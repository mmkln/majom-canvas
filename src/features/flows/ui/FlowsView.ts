import type { AppRuntime } from '../../../app-runtime/index.ts';
import { StaticDropdownSelect } from '../../../ui-lib/src/components/StaticDropdownSelect.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createSurface,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon, type IconName } from '../../../ui-lib/src/hud/icons.ts';
import {
  Priority,
  Status,
  type Flow,
} from '../../../majom-wrapper/interfaces/index.ts';
import type {
  FlowCreatePayload,
  FlowUpdatePayload,
} from '../../../majom-wrapper/data-access/flows-api-service.ts';
import {
  FLOW_PRIORITIES,
  FLOW_RISK_LEVELS,
  FLOW_THEME_COLORS,
  FLOW_THEME_ICONS,
  type FlowPresentationSettings,
  type FlowPriority,
  type FlowRiskLevel,
  type FlowThemeColor,
  type FlowThemeIcon,
  getFallbackFlowColor,
  getFallbackFlowIcon,
  readFlowPresentationSettings,
  writeFlowPresentationSettings,
} from '../domain/flowPresentation.ts';
import { hasFlowInsertionChanged } from '../domain/flowColumnPosition.ts';
import type { FlowColumn, FlowsState } from '../domain/types.ts';
import { FlowColumnDragController } from './FlowColumnDragController.ts';
import { ensureFlowsStyles } from './flowsStyles.ts';

type FlowEditDraft = {
  title: string;
  status: Status;
  icon: FlowThemeIcon;
  color: FlowThemeColor;
  timeProfile: string;
  riskLevel: FlowRiskLevel;
  priority: FlowPriority | null;
};

type FlowVisual = {
  icon: FlowThemeIcon;
  color: FlowThemeColor;
};

type FlowTitleEditSurface = 'column' | 'organize';

type FlowTitleEditTarget = {
  flowId: Flow['id'];
  surface: FlowTitleEditSurface;
};

type FlowColumnMenuPopover = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type FlowAppearancePopover = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type FlowMetaTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';

type FlowMetaSelectItem = {
  value: string;
  label: string;
  icon: IconName;
  tone: FlowMetaTone;
};

const FLOW_PRIORITY_DEFAULT_VALUE = 'default';

const FLOW_STATUSES = [
  Status.Draft,
  Status.Described,
  Status.Active,
  Status.Completed,
  Status.Archived,
  Status.Cancelled,
] as const;
const ORGANIZE_MULTI_COLUMN_THRESHOLD = 8;

type FlowsViewHandlers = {
  onCreateFlow: (payload: FlowCreatePayload) => Promise<void> | void;
  onPatchFlow: (
    flowId: Flow['id'],
    patch: FlowUpdatePayload
  ) => Promise<void> | void;
  onReorderFlow: (
    flowId: Flow['id'],
    insertionIndex: number
  ) => Promise<void> | void;
  onDeleteFlow: (flowId: Flow['id']) => Promise<void> | void;
};

export class FlowsView {
  private readonly element: HTMLDivElement;
  private readonly columnDragController: FlowColumnDragController;
  private isOrganizeModalOpen = false;
  private organizeDraggingFlowId: Flow['id'] | null = null;
  private organizeDragOverFlowId: Flow['id'] | null = null;
  private organizeDragPlacement: 'before' | 'after' | null = null;
  private organizeDropInsertionIndex: number | null = null;
  private reorderPendingFlowId: Flow['id'] | null = null;
  private columnMenuPopover: FlowColumnMenuPopover | null = null;
  private appearancePopover: FlowAppearancePopover | null = null;
  private editingFlowTitleTarget: FlowTitleEditTarget | null = null;
  private flowTitleEditInput: HTMLInputElement | null = null;
  private isCreatingFlow = false;
  private editingFlowId: number | null = null;
  private editDraft: FlowEditDraft | null = null;
  private editError: string | null = null;
  private isSubmittingEdit = false;
  private lastState: FlowsState | null = null;
  private readonly dropdownDisposers: Array<() => void> = [];

  constructor(
    private readonly parent: HTMLElement,
    private readonly runtime: AppRuntime,
    private readonly handlers: FlowsViewHandlers
  ) {
    ensureFlowsStyles();
    this.element = document.createElement('div');
    this.element.id = 'flows-root';
    this.element.dataset.module = 'flows';
    this.parent.appendChild(this.element);
    this.columnDragController = new FlowColumnDragController({
      root: this.element,
      getState: () => this.lastState,
      onDrop: (flowId, insertionIndex) => {
        void this.handlers.onReorderFlow(flowId, insertionIndex);
      },
    });
    this.columnDragController.mount();
  }

  public render(state: FlowsState): void {
    this.closeColumnMenu();
    this.closeAppearancePopover();
    this.disposeDropdownControls();
    this.lastState = state;
    this.element.replaceChildren(this.renderPage(state));
  }

  public destroy(): void {
    this.closeColumnMenu();
    this.closeAppearancePopover();
    this.disposeDropdownControls();
    this.columnDragController.unmount();
    this.element.remove();
  }

  private renderPage(state: FlowsState): HTMLElement {
    const page = document.createElement('div');
    page.className = 'flows-page';

    const body = document.createElement('main');
    body.className = 'flows-body';
    body.appendChild(this.renderBody(state));

    page.append(this.renderHeader(state), body);
    const editingColumn = this.getEditingColumn(state);
    if (editingColumn) {
      page.appendChild(this.renderEditModal(editingColumn));
    }
    if (this.isCreatingFlow) {
      page.appendChild(this.renderEditModal(null));
    }
    if (this.isOrganizeModalOpen) {
      page.appendChild(this.renderOrganizeModal(state));
    }
    return page;
  }

  private renderHeader(state: FlowsState): HTMLElement {
    const header = document.createElement('header');
    header.className = 'flows-header';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'flows-header-title-block';
    const titleRow = document.createElement('div');
    titleRow.className = 'flows-header-title-row';
    const title = document.createElement('h1');
    title.className = 'flows-header-title';
    title.textContent = this.runtime.i18n.t('flows.title');
    titleRow.append(
      title,
      this.renderHeaderActionButton({
        label: this.runtime.i18n.t('flows.actions.organize'),
        icon: 'bars-3',
        pressed: this.isOrganizeModalOpen,
        onClick: () => {
          this.openOrganizeModal();
          this.renderCurrent();
        },
      }),
      this.renderHeaderActionButton({
        label: this.runtime.i18n.t('flows.actions.create'),
        icon: 'plus',
        disabled: state.status === 'loading',
        onClick: () => {
          this.openCreateModal();
          this.renderCurrent();
        },
      })
    );
    titleBlock.appendChild(titleRow);

    header.appendChild(titleBlock);
    return header;
  }

  private renderHeaderActionButton(options: {
    label: string;
    icon: IconName;
    disabled?: boolean;
    pressed?: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      text: '',
      tone: 'text',
      size: 'sm',
      className: 'flows-header-action',
      title: options.label,
      ariaLabel: options.label,
      disabled: options.disabled,
      onClick: options.onClick,
    });
    if (options.pressed !== undefined) {
      button.setAttribute('aria-pressed', options.pressed ? 'true' : 'false');
    }
    const icon = createIcon(options.icon, { size: 16, strokeWidth: 2 });
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = options.label;
    button.append(icon, label);
    return button;
  }

  private renderBody(state: FlowsState): HTMLElement {
    if (state.status === 'loading' || state.status === 'idle') {
      return this.renderCenterState(this.runtime.i18n.t('flows.loading'));
    }
    if (state.status === 'error') {
      return this.renderCenterState(this.runtime.i18n.t('flows.errors.load'));
    }
    if (state.columns.length === 0) {
      return this.renderCenterState(this.runtime.i18n.t('flows.empty'));
    }
    const visibleColumns = state.columns.filter(
      (column) => readFlowPresentationSettings(column.flow).hidden !== true
    );

    const board = document.createElement('div');
    board.className = 'flows-board';
    board.dataset.flowBoard = 'true';
    visibleColumns.forEach((column) => {
      board.appendChild(this.renderFlowColumn(column));
    });
    board.appendChild(this.renderAddFlowButton(state));
    return board;
  }

  private renderCenterState(text: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flows-center-state';

    const paragraph = document.createElement('p');
    paragraph.className = 'flows-state-text';
    paragraph.textContent = text;
    wrapper.appendChild(paragraph);
    return wrapper;
  }

  private renderFlowColumn(column: FlowColumn): HTMLElement {
    const presentation = readFlowPresentationSettings(column.flow);
    const isCollapsed = presentation.collapsed === true;
    const visual = this.getColumnVisual(column);
    const root = document.createElement('section');
    root.className = `flows-column${
      isCollapsed ? ' is-collapsed' : ''
    }`;
    root.dataset.flowId = String(column.flow.id);
    root.dataset.flowColumnDraggable = 'true';

    root.appendChild(this.renderCollapsedColumn(column, visual));
    root.appendChild(this.renderExpandedColumn(column, visual));
    return root;
  }

  private renderOrganizeModal(state: FlowsState): HTMLElement {
    const columns = state.columns;
    const useMultiColumnLayout =
      columns.length >= ORGANIZE_MULTI_COLUMN_THRESHOLD;
    const overlay = document.createElement('div');
    overlay.className = 'flows-organize-modal';
    overlay.setAttribute('role', 'presentation');
    overlay.addEventListener('click', () => this.closeOrganizeModal());

    const dialog = document.createElement('section');
    dialog.className = `flows-organize-dialog${
      useMultiColumnLayout ? ' flows-organize-dialog--multi-column' : ''
    }`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'flows-organize-title');
    dialog.addEventListener('click', (event) => event.stopPropagation());

    const header = document.createElement('header');
    header.className = 'flows-organize-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flows-organize-title-wrap';
    const titleIcon = createIcon('bars-3', { size: 20, strokeWidth: 2 });
    titleIcon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('h2');
    title.id = 'flows-organize-title';
    title.className = 'flows-organize-title';
    title.textContent = this.runtime.i18n.t('flows.organize.title');
    titleWrap.append(titleIcon, title);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'flows-organize-close';
    closeButton.title = this.runtime.i18n.t('flows.organize.close');
    closeButton.setAttribute('aria-label', closeButton.title);
    closeButton.disabled = this.reorderPendingFlowId !== null;
    closeButton.appendChild(createIcon('x-mark', { size: 19, strokeWidth: 2 }));
    closeButton.addEventListener('click', () => this.closeOrganizeModal());
    header.append(titleWrap, closeButton);

    const body = document.createElement('div');
    body.className = `flows-organize-body${
      useMultiColumnLayout ? ' flows-organize-body--multi-column' : ''
    }`;
    body.setAttribute('role', 'list');
    body.addEventListener('dragover', (event) => {
      this.handleOrganizeBodyDragOver(event);
    });
    body.addEventListener('drop', (event) => {
      void this.handleOrganizeBodyDrop(event, columns);
    });
    if (columns.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'flows-organize-empty';
      empty.textContent = this.runtime.i18n.t('flows.organize.empty');
      body.appendChild(empty);
    } else {
      columns.forEach((column, index) => {
        body.appendChild(this.renderOrganizeRow(column, index, columns));
      });
    }

    const footer = document.createElement('footer');
    footer.className = 'flows-organize-footer';
    const done = createTextButton({
      text: this.runtime.i18n.t('flows.organize.done'),
      tone: 'primary',
      size: 'sm',
      className: 'flows-organize-done',
      disabled: this.reorderPendingFlowId !== null,
      onClick: () => this.closeOrganizeModal(),
    });
    footer.appendChild(done);

    dialog.append(header, body, footer);
    overlay.appendChild(dialog);
    return overlay;
  }

  private renderOrganizeRow(
    column: FlowColumn,
    index: number,
    columns: FlowColumn[]
  ): HTMLElement {
    const visual = this.getColumnVisual(column);
    const presentation = readFlowPresentationSettings(column.flow);
    const isPending = this.reorderPendingFlowId === column.flow.id;
    const row = document.createElement('div');
    row.className = `flows-organize-row${
      isPending ? ' is-pending' : ''
    }${presentation.hidden === true ? ' is-hidden' : ''}`;
    row.setAttribute('role', 'listitem');
    row.dataset.flowId = String(column.flow.id);
    row.addEventListener('dragover', (event) => {
      this.handleOrganizeDragOver(event, row, column, index, columns);
    });
    row.addEventListener('drop', (event) => {
      void this.handleOrganizeDrop(event, row, column, index, columns);
    });

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'flows-organize-drag-handle';
    handle.draggable = this.reorderPendingFlowId === null;
    handle.title = this.runtime.i18n.t('flows.organize.drag', {
      title: column.flow.title,
    });
    handle.setAttribute('aria-label', handle.title);
    handle.disabled = this.reorderPendingFlowId !== null;
    handle.appendChild(createIcon('drag-handle', { size: 16 }));
    handle.addEventListener('dragstart', (event) => {
      this.startOrganizeDrag(event, row, column);
    });
    handle.addEventListener('dragend', () => {
      this.resetOrganizeDragState();
    });

    const main = document.createElement('div');
    main.className = 'flows-organize-row-main';

    const icon = this.renderFlowVisualIcon(
      visual,
      'flows-organize-icon',
      16
    );

    const label = document.createElement('span');
    label.className = 'flows-organize-label';
    label.appendChild(this.renderFlowTitleInline(column, 'organize'));
    main.append(handle, icon, label);

    row.append(main, this.renderOrganizeHideButton(column, presentation));

    return row;
  }

  private renderOrganizeHideButton(
    column: FlowColumn,
    presentation: FlowPresentationSettings
  ): HTMLButtonElement {
    const isHidden = presentation.hidden === true;
    const label = this.runtime.i18n.t(
      isHidden ? 'flows.organize.show' : 'flows.organize.hide'
    );
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `flows-organize-hide${isHidden ? ' is-hidden' : ''}`;
    button.dataset.flowDragIgnore = 'true';
    button.disabled = this.reorderPendingFlowId !== null;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.appendChild(
      createIcon(isHidden ? 'eye' : 'eye-slash', {
        size: 16,
        strokeWidth: 2,
      })
    );
    button.addEventListener('click', () => {
      void this.patchFlowHidden(column, !isHidden);
    });
    return button;
  }

  private renderFlowTitleInline(
    column: FlowColumn,
    surface: FlowTitleEditSurface
  ): HTMLElement {
    const isEditing =
      this.editingFlowTitleTarget?.flowId === column.flow.id &&
      this.editingFlowTitleTarget.surface === surface;
    if (isEditing) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className =
        surface === 'column'
          ? 'flows-column-title-input'
          : 'flows-organize-title-input';
      input.value = column.flow.title;
      input.maxLength = 512;
      input.autocomplete = 'off';
      input.dataset.flowDragIgnore = 'true';
      input.setAttribute(
        'aria-label',
        this.runtime.i18n.t('flows.titlePlaceholder')
      );
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.finishFlowTitleEdit(column.flow, true);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.finishFlowTitleEdit(column.flow, false);
        }
      });
      input.addEventListener('blur', () => {
        this.finishFlowTitleEdit(column.flow, true);
      });
      this.flowTitleEditInput = input;
      requestAnimationFrame(() => {
        if (this.flowTitleEditInput !== input) return;
        input.focus();
        input.select();
      });
      return input;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      surface === 'column'
        ? 'flows-column-title-button'
        : 'flows-organize-title-button';
    button.dataset.flowDragIgnore = 'true';
    button.title = this.runtime.i18n.t('flows.actions.renameFlow');
    button.setAttribute('aria-label', button.title);
    button.addEventListener('click', () => {
      this.startFlowTitleEdit(column.flow.id, surface);
    });
    const text = document.createElement('span');
    text.className =
      surface === 'column'
        ? 'flows-column-title-text'
        : 'flows-organize-title-text';
    text.textContent = column.flow.title;
    button.appendChild(text);
    return button;
  }

  private startOrganizeDrag(
    event: DragEvent,
    row: HTMLElement,
    column: FlowColumn
  ): void {
    if (this.reorderPendingFlowId !== null) {
      event.preventDefault();
      return;
    }
    this.organizeDraggingFlowId = column.flow.id;
    event.dataTransfer?.setData('text/plain', String(column.flow.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    row.classList.add('is-dragging');
  }

  private handleOrganizeDragOver(
    event: DragEvent,
    row: HTMLElement,
    column: FlowColumn,
    targetIndex: number,
    columns: FlowColumn[]
  ): void {
    const draggingFlowId = this.organizeDraggingFlowId;
    if (
      this.reorderPendingFlowId !== null ||
      draggingFlowId === null ||
      draggingFlowId === column.flow.id
    ) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const placement = this.resolveOrganizeDropPlacement(event, row);
    const insertionIndex = this.resolveOrganizeInsertionIndex(
      columns,
      draggingFlowId,
      targetIndex,
      placement
    );
    this.organizeDragOverFlowId = column.flow.id;
    this.organizeDragPlacement = placement;
    this.organizeDropInsertionIndex = insertionIndex;
    this.placeOrganizeDropPlaceholder({
      row,
      placement,
      show: hasFlowInsertionChanged(columns, draggingFlowId, insertionIndex),
    });
  }

  private async handleOrganizeDrop(
    event: DragEvent,
    row: HTMLElement,
    column: FlowColumn,
    targetIndex: number,
    columns: FlowColumn[]
  ): Promise<void> {
    const draggingFlowId = this.readOrganizeDraggedFlowId(event);
    if (
      this.reorderPendingFlowId !== null ||
      draggingFlowId === null ||
      draggingFlowId === column.flow.id
    ) {
      this.resetOrganizeDragState();
      return;
    }
    event.preventDefault();
    const placement =
      this.organizeDragOverFlowId === column.flow.id &&
      this.organizeDragPlacement
        ? this.organizeDragPlacement
        : this.resolveOrganizeDropPlacement(event, row);
    const insertionIndex =
      this.organizeDragOverFlowId === column.flow.id &&
      this.organizeDragPlacement &&
      this.organizeDropInsertionIndex !== null
        ? this.organizeDropInsertionIndex
        : this.resolveOrganizeInsertionIndex(
            columns,
            draggingFlowId,
            targetIndex,
            placement
          );
    event.stopPropagation();
    this.resetOrganizeDragState();
    await this.moveOrganizeColumn(draggingFlowId, insertionIndex);
  }

  private async handleOrganizeBodyDrop(
    event: DragEvent,
    columns: FlowColumn[]
  ): Promise<void> {
    const draggingFlowId = this.readOrganizeDraggedFlowId(event);
    const insertionIndex = this.organizeDropInsertionIndex;
    if (
      this.reorderPendingFlowId !== null ||
      draggingFlowId === null ||
      insertionIndex === null
    ) {
      this.resetOrganizeDragState();
      return;
    }
    event.preventDefault();
    this.resetOrganizeDragState();
    if (!hasFlowInsertionChanged(columns, draggingFlowId, insertionIndex)) {
      return;
    }
    await this.moveOrganizeColumn(draggingFlowId, insertionIndex);
  }

  private handleOrganizeBodyDragOver(event: DragEvent): void {
    if (
      this.reorderPendingFlowId !== null ||
      this.organizeDraggingFlowId === null ||
      this.organizeDropInsertionIndex === null
    ) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  private resolveOrganizeDropPlacement(
    event: DragEvent,
    row: HTMLElement
  ): 'before' | 'after' {
    const rect = row.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    return event.clientY > midpoint ? 'after' : 'before';
  }

  private resolveOrganizeInsertionIndex(
    columns: FlowColumn[],
    movingFlowId: Flow['id'],
    targetIndex: number,
    placement: 'before' | 'after'
  ): number {
    const movingIndex = columns.findIndex(
      (candidate) => candidate.flow.id === movingFlowId
    );
    const stableTargetIndex =
      movingIndex >= 0 && movingIndex < targetIndex
        ? targetIndex - 1
        : targetIndex;
    return placement === 'after' ? stableTargetIndex + 1 : stableTargetIndex;
  }

  private placeOrganizeDropPlaceholder(options: {
    row: HTMLElement;
    placement: 'before' | 'after';
    show: boolean;
  }): void {
    this.element
      .querySelectorAll<HTMLElement>('.flows-organize-drop-placeholder')
      .forEach((placeholder) => placeholder.remove());
    if (!options.show) return;
    const parent = options.row.parentElement;
    if (!parent) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'flows-organize-drop-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    parent.insertBefore(
      placeholder,
      options.placement === 'before'
        ? options.row
        : options.row.nextElementSibling
    );
  }

  private readOrganizeDraggedFlowId(event: DragEvent): Flow['id'] | null {
    const transferred = event.dataTransfer?.getData('text/plain') ?? '';
    if (!transferred.trim()) return this.organizeDraggingFlowId;
    const parsed = Number(transferred);
    if (Number.isFinite(parsed)) return parsed;
    return this.organizeDraggingFlowId;
  }

  private resetOrganizeDragState(): void {
    this.organizeDraggingFlowId = null;
    this.organizeDragOverFlowId = null;
    this.organizeDragPlacement = null;
    this.organizeDropInsertionIndex = null;
    this.clearOrganizeDropIndicators();
  }

  private clearOrganizeDropIndicators(): void {
    this.element
      .querySelectorAll<HTMLElement>('.flows-organize-row.is-dragging')
      .forEach((row) => {
        row.classList.remove('is-dragging');
      });
    this.element
      .querySelectorAll<HTMLElement>('.flows-organize-drop-placeholder')
      .forEach((placeholder) => placeholder.remove());
  }

  private async moveOrganizeColumn(
    flowId: Flow['id'],
    insertionIndex: number
  ): Promise<void> {
    if (!this.lastState) return;
    if (insertionIndex < 0 || insertionIndex >= this.lastState.columns.length) {
      return;
    }
    if (!this.lastState.columns.some((column) => column.flow.id === flowId)) {
      return;
    }
    if (
      !hasFlowInsertionChanged(this.lastState.columns, flowId, insertionIndex)
    ) {
      return;
    }
    this.reorderPendingFlowId = flowId;
    this.renderCurrent();
    try {
      await this.handlers.onReorderFlow(flowId, insertionIndex);
    } finally {
      this.reorderPendingFlowId = null;
      this.renderCurrent();
    }
  }

  private openOrganizeModal(): void {
    this.closeColumnMenu();
    this.isOrganizeModalOpen = true;
  }

  private closeOrganizeModal(): void {
    if (this.reorderPendingFlowId !== null) return;
    this.isOrganizeModalOpen = false;
    this.resetOrganizeDragState();
    this.renderCurrent();
  }

  private getColumnVisual(column: FlowColumn): FlowVisual {
    const presentation = readFlowPresentationSettings(column.flow);
    return {
      icon: presentation.icon ?? getFallbackFlowIcon(),
      color: presentation.color ?? getFallbackFlowColor(),
    };
  }

  private renderFlowVisualIcon(
    visual: FlowVisual,
    className: string,
    size: number
  ): SVGSVGElement {
    const icon = createIcon(visual.icon, { size, strokeWidth: 1.8 });
    icon.classList.add(
      'flows-flow-icon',
      className,
      `flows-flow-icon--${visual.color}`
    );
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  private renderFlowAppearanceButton(options: {
    column: FlowColumn | null;
    visual: FlowVisual;
    className: string;
    iconClassName: string;
    size: number;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `flows-appearance-button ${options.className}`;
    button.dataset.flowDragIgnore = 'true';
    button.title = this.runtime.i18n.t('flows.edit.appearance');
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.dataset.flowAppearanceIconClass = options.iconClassName;
    button.dataset.flowAppearanceIconSize = String(options.size);
    button.appendChild(
      this.renderFlowVisualIcon(
        options.visual,
        options.iconClassName,
        options.size
      )
    );
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openAppearancePopover(button, options.column, options.visual);
    });
    return button;
  }

  private openAppearancePopover(
    trigger: HTMLButtonElement,
    column: FlowColumn | null,
    visual: FlowVisual
  ): void {
    if (this.appearancePopover?.trigger === trigger) {
      this.closeAppearancePopover();
      return;
    }
    this.closeAppearancePopover();
    this.closeColumnMenu();

    const panel = createSurface({
      elevated: true,
      className: 'flows-appearance-popover hidden',
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', this.runtime.i18n.t('flows.edit.appearance'));
    panel.dataset.flowAppearanceIcon = visual.icon;
    panel.dataset.flowAppearanceColor = visual.color;
    panel.addEventListener('mousedown', (event) => event.stopPropagation());
    panel.append(
      this.renderAppearanceIconGrid(panel, trigger, column),
      this.renderAppearanceColorRow(panel, trigger, column)
    );

    const menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 300,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.appearancePopover?.menu === menu) {
          this.closeAppearancePopover();
        }
      },
    });
    this.appearancePopover = { menu, panel, trigger };
    menu.mount();
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-start',
      fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
      gap: 6,
      margin: 8,
    });
    this.syncAppearancePopover(panel, trigger);
  }

  private renderAppearanceIconGrid(
    panel: HTMLElement,
    trigger: HTMLButtonElement,
    column: FlowColumn | null
  ): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'flows-appearance-icon-grid';
    FLOW_THEME_ICONS.forEach((iconName) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flows-appearance-icon-option';
      button.dataset.flowAppearanceIconOption = iconName;
      button.title = this.getThemeIconLabel(iconName);
      button.setAttribute('aria-label', button.title);
      button.appendChild(createIcon(iconName, { size: 18, strokeWidth: 1.8 }));
      button.addEventListener('click', () => {
        this.applyAppearanceSelection(panel, trigger, column, { icon: iconName });
      });
      grid.appendChild(button);
    });
    return grid;
  }

  private renderAppearanceColorRow(
    panel: HTMLElement,
    trigger: HTMLButtonElement,
    column: FlowColumn | null
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'flows-appearance-color-row';
    FLOW_THEME_COLORS.forEach((color) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `flows-appearance-color-option flows-edit-color--${color}`;
      button.dataset.flowAppearanceColorOption = color;
      button.title = this.runtime.i18n.t(`flows.colors.${color}`);
      button.setAttribute('aria-label', button.title);
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      button.appendChild(dot);
      button.addEventListener('click', () => {
        this.applyAppearanceSelection(panel, trigger, column, { color });
      });
      row.appendChild(button);
    });
    return row;
  }

  private applyAppearanceSelection(
    panel: HTMLElement,
    trigger: HTMLButtonElement,
    column: FlowColumn | null,
    patch: Partial<FlowVisual>
  ): void {
    const next: FlowVisual = {
      icon: patch.icon ?? this.readPopoverIcon(panel),
      color: patch.color ?? this.readPopoverColor(panel),
    };
    panel.dataset.flowAppearanceIcon = next.icon;
    panel.dataset.flowAppearanceColor = next.color;
    this.syncAppearancePopover(panel, trigger);
    if (this.editDraft) {
      this.editDraft = {
        ...this.editDraft,
        icon: next.icon,
        color: next.color,
      };
    }
    if (column) {
      void this.patchFlowAppearance(column, next);
    }
  }

  private syncAppearancePopover(
    panel: HTMLElement,
    trigger: HTMLButtonElement
  ): void {
    const visual: FlowVisual = {
      icon: this.readPopoverIcon(panel),
      color: this.readPopoverColor(panel),
    };
    const triggerIconClass =
      trigger.dataset.flowAppearanceIconClass ?? 'flows-appearance-button-icon';
    const triggerIconSize = Number(trigger.dataset.flowAppearanceIconSize);
    trigger.replaceChildren(
      this.renderFlowVisualIcon(
        visual,
        triggerIconClass,
        Number.isFinite(triggerIconSize) ? triggerIconSize : 18
      )
    );
    panel
      .querySelectorAll<HTMLButtonElement>('.flows-appearance-icon-option')
      .forEach((button) => {
        const active = button.dataset.flowAppearanceIconOption === visual.icon;
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        FLOW_THEME_COLORS.forEach((color) => {
          button.classList.remove(`flows-flow-icon--${color}`);
        });
        button.classList.add(`flows-flow-icon--${visual.color}`);
      });
    panel
      .querySelectorAll<HTMLButtonElement>('.flows-appearance-color-option')
      .forEach((button) => {
        const active = button.dataset.flowAppearanceColorOption === visual.color;
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
  }

  private readPopoverIcon(panel: HTMLElement): FlowThemeIcon {
    const value = panel.dataset.flowAppearanceIcon ?? '';
    return FLOW_THEME_ICONS.includes(value as FlowThemeIcon)
      ? (value as FlowThemeIcon)
      : getFallbackFlowIcon();
  }

  private readPopoverColor(panel: HTMLElement): FlowThemeColor {
    const value = panel.dataset.flowAppearanceColor ?? '';
    return FLOW_THEME_COLORS.includes(value as FlowThemeColor)
      ? (value as FlowThemeColor)
      : getFallbackFlowColor();
  }

  private async patchFlowAppearance(
    column: FlowColumn,
    visual: FlowVisual
  ): Promise<void> {
    const presentation = readFlowPresentationSettings(column.flow);
    await this.handlers.onPatchFlow(column.flow.id, {
      meta: writeFlowPresentationSettings(column.flow.meta, {
        ...presentation,
        icon: visual.icon,
        color: visual.color,
      }),
    });
  }

  private renderCollapsedColumn(
    column: FlowColumn,
    visual: FlowVisual
  ): HTMLElement {
    const collapsed = document.createElement('button');
    collapsed.type = 'button';
    collapsed.className = 'flows-column-collapsed';
    collapsed.title = column.flow.title;
    collapsed.setAttribute('aria-label', this.runtime.i18n.t('flows.expand'));
    collapsed.addEventListener('click', () => {
      void this.patchColumnCollapsed(column, false);
    });

    const icon = this.renderFlowVisualIcon(
      visual,
      'flows-column-collapsed-icon',
      20
    );

    const title = document.createElement('span');
    title.className = 'flows-column-collapsed-title';
    title.textContent = column.flow.title;

    collapsed.append(icon, title);
    return collapsed;
  }

  private renderExpandedColumn(
    column: FlowColumn,
    visual: FlowVisual
  ): HTMLElement {
    const expanded = document.createElement('div');
    expanded.className = 'flows-column-expanded';

    const header = document.createElement('header');
    header.className = 'flows-column-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'flows-column-title-row';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flows-column-title-wrap';
    titleWrap.appendChild(
      this.renderFlowAppearanceButton({
        column,
        visual,
        className: 'flows-column-title-icon-button',
        iconClassName: 'flows-column-title-icon',
        size: 18,
      })
    );

    const collapseButton = document.createElement('button');
    collapseButton.type = 'button';
    collapseButton.className = 'flows-column-icon-button';
    collapseButton.dataset.flowDragIgnore = 'true';
    collapseButton.title = this.runtime.i18n.t('flows.collapse');
    collapseButton.setAttribute('aria-label', collapseButton.title);
    collapseButton.appendChild(
      createIcon('shrink', { size: 16, strokeWidth: 2 })
    );
    collapseButton.addEventListener('click', () => {
      void this.patchColumnCollapsed(column, true);
    });

    const heading = document.createElement('h2');
    heading.className = 'flows-column-title';
    heading.appendChild(this.renderFlowTitleInline(column, 'column'));
    titleWrap.appendChild(heading);

    const titleActions = document.createElement('div');
    titleActions.className = 'flows-column-title-actions';
    titleActions.append(collapseButton, this.renderColumnMenu(column));

    titleRow.append(titleWrap, titleActions);

    header.append(titleRow);

    const taskList = document.createElement('div');
    taskList.className = 'flows-column-task-list';
    this.appendTaskContent(taskList, column);

    expanded.append(header, taskList);
    return expanded;
  }

  private renderColumnMenu(column: FlowColumn): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flows-column-menu-container';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'flows-column-icon-button flows-column-menu-trigger';
    trigger.dataset.flowDragIgnore = 'true';
    trigger.title = this.runtime.i18n.t('flows.actions.menu');
    trigger.setAttribute('aria-label', trigger.title);
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.appendChild(
      createIcon('ellipsis-horizontal', { size: 18, strokeWidth: 2 })
    );
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.columnMenuPopover?.trigger === trigger) {
        this.closeColumnMenu();
        return;
      }
      this.openColumnMenu(trigger, column);
    });

    container.appendChild(trigger);
    return container;
  }

  private openColumnMenu(trigger: HTMLButtonElement, column: FlowColumn): void {
    this.closeColumnMenu();

    const panel = createSurface({
      elevated: true,
      className: 'flows-column-menu hidden',
    });
    panel.setAttribute('role', 'menu');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());
    panel.append(
      this.renderColumnMenuItem({
        label: this.runtime.i18n.t('flows.actions.edit'),
        icon: 'pencil',
        onClick: () => this.openEditModal(column),
      }),
      this.renderColumnMenuItem({
        label: this.runtime.i18n.t('flows.actions.delete'),
        icon: 'trash',
        tone: 'danger',
        onClick: () => void this.deleteFlow(column),
      })
    );

    const menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 290,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.columnMenuPopover?.menu === menu) {
          this.closeColumnMenu();
        }
      },
    });
    menu.mount();
    this.columnMenuPopover = { menu, panel, trigger };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      gap: 6,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderColumnMenuItem(options: {
    label: string;
    icon: Parameters<typeof createIcon>[0];
    tone?: 'danger';
    onClick: () => void;
  }): HTMLButtonElement {
    const leadingIcon = document.createElement('span');
    leadingIcon.className = 'flows-column-menu-item-icon';
    leadingIcon.appendChild(
      createIcon(options.icon, { size: 15, strokeWidth: 2 })
    );
    const item = createDropdownItem({
      label: options.label,
      tone: options.tone === 'danger' ? 'danger' : 'default',
      leading: leadingIcon,
      className: `flows-column-menu-item${
        options.tone === 'danger' ? ' flows-column-menu-item--danger' : ''
      }`,
      onClick: (event) => {
        event.stopPropagation();
        options.onClick();
      },
    });
    item.dataset.flowDragIgnore = 'true';
    item.setAttribute('role', 'menuitem');
    return item;
  }

  private openEditModal(column: FlowColumn): void {
    const presentation = readFlowPresentationSettings(column.flow);
    this.closeColumnMenu();
    this.editingFlowTitleTarget = null;
    this.flowTitleEditInput = null;
    this.isCreatingFlow = false;
    this.editingFlowId = column.flow.id;
    this.editDraft = {
      title: column.flow.title,
      status: column.flow.status,
      icon:
        presentation.icon ??
        getFallbackFlowIcon(),
      color:
        presentation.color ??
        getFallbackFlowColor(),
      timeProfile: presentation.timeProfile ?? '',
      riskLevel: presentation.riskLevel ?? 'stable',
      priority: presentation.priority,
    };
    this.editError = null;
    this.renderCurrent();
  }

  private openCreateModal(): void {
    this.closeColumnMenu();
    this.isOrganizeModalOpen = false;
    this.editingFlowTitleTarget = null;
    this.flowTitleEditInput = null;
    this.isCreatingFlow = true;
    this.editingFlowId = null;
    this.editDraft = this.createNewFlowDraft();
    this.editError = null;
  }

  private async deleteFlow(column: FlowColumn): Promise<void> {
    this.closeColumnMenu();
    const confirmed = window.confirm(
      this.runtime.i18n.t('flows.delete.confirm', {
        title: column.flow.title,
      })
    );
    if (!confirmed) return;
    await this.handlers.onDeleteFlow(column.flow.id);
  }

  private async patchColumnCollapsed(
    column: FlowColumn,
    collapsed: boolean
  ): Promise<void> {
    const presentation = readFlowPresentationSettings(column.flow);
    await this.handlers.onPatchFlow(column.flow.id, {
      meta: writeFlowPresentationSettings(column.flow.meta, {
        ...presentation,
        collapsed,
      }),
    });
  }

  private async patchFlowHidden(
    column: FlowColumn,
    hidden: boolean
  ): Promise<void> {
    const presentation = readFlowPresentationSettings(column.flow);
    await this.handlers.onPatchFlow(column.flow.id, {
      meta: writeFlowPresentationSettings(column.flow.meta, {
        ...presentation,
        hidden,
      }),
    });
  }

  private appendTaskContent(parent: HTMLElement, column: FlowColumn): void {
    if (column.taskStatus === 'loading') {
      parent.appendChild(
        this.renderColumnState(this.runtime.i18n.t('flows.tasks.loading'))
      );
      return;
    }
    if (column.taskStatus === 'error') {
      parent.appendChild(
        this.renderColumnState(this.runtime.i18n.t('flows.tasks.errors.load'))
      );
      return;
    }
    column.tasks.forEach((task) => {
      const card = document.createElement('article');
      card.className = 'flows-task-card';

      const title = document.createElement('p');
      title.className = 'flows-task-title';
      title.textContent = task.title;

      const meta = document.createElement('div');
      meta.className = 'flows-task-meta';
      meta.append(
        this.renderTaskMetaItem(task.status),
        this.renderTaskMetaItem(task.priority)
      );
      card.append(title, meta);
      parent.appendChild(card);
    });
    parent.appendChild(this.renderAddTaskButton());
  }

  private renderColumnState(text: string): HTMLElement {
    const state = document.createElement('div');
    state.className = 'flows-column-state';
    state.textContent = text;
    return state;
  }

  private renderTaskMetaItem(text: string): HTMLElement {
    const item = document.createElement('span');
    item.className = 'flows-task-meta-item';
    item.textContent = text;
    return item;
  }

  private renderAddTaskButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flows-add-task-button';
    button.dataset.flowDragIgnore = 'true';
    button.append(
      createIcon('plus', { size: 15, strokeWidth: 2 }),
      document.createTextNode(this.runtime.i18n.t('flows.tasks.add'))
    );
    return button;
  }

  private renderAddFlowButton(state: FlowsState): HTMLElement {
    const wrapper = document.createElement('aside');
    wrapper.className = 'flows-add-flow-panel';
    wrapper.dataset.flowDragIgnore = 'true';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flows-add-flow-button';
    button.disabled = state.status === 'loading';
    button.append(
      createIcon('plus', { size: 16, strokeWidth: 2 }),
      document.createTextNode(this.runtime.i18n.t('flows.actions.addFlow'))
    );
    button.addEventListener('click', () => {
      this.openCreateModal();
      this.renderCurrent();
    });
    wrapper.appendChild(button);
    return wrapper;
  }

  private renderEditModal(column: FlowColumn | null): HTMLElement {
    const isCreate = column === null;
    const draft =
      this.editDraft ??
      (isCreate ? this.createNewFlowDraft() : this.createEditDraft(column));
    const overlay = document.createElement('div');
    overlay.className = 'flows-edit-modal';
    overlay.setAttribute('role', 'presentation');
    overlay.addEventListener('click', () => this.closeEditModal());

    const dialog = document.createElement('form');
    dialog.className = 'flows-edit-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'flows-edit-title');
    dialog.addEventListener('click', (event) => event.stopPropagation());
    dialog.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submitEditModal(column, dialog);
    });

    const header = document.createElement('header');
    header.className = 'flows-edit-header';

    const title = document.createElement('h2');
    title.id = 'flows-edit-title';
    title.className = 'flows-edit-title';
    title.textContent = this.runtime.i18n.t(
      isCreate ? 'flows.create.title' : 'flows.edit.title'
    );

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'flows-edit-close';
    closeButton.title = this.runtime.i18n.t(
      isCreate ? 'flows.create.close' : 'flows.edit.close'
    );
    closeButton.setAttribute('aria-label', closeButton.title);
    closeButton.appendChild(createIcon('x-mark', { size: 18, strokeWidth: 2 }));
    closeButton.addEventListener('click', () => this.closeEditModal());
    header.append(title, closeButton);

    const body = document.createElement('div');
    body.className = 'flows-edit-body';
    body.append(this.renderTitleField(column, draft));
    if (!isCreate) {
      body.appendChild(
        this.renderEditFieldGrid([
          this.renderStatusField(draft.status),
          this.renderPriorityField(draft.priority),
        ])
      );
    }
    body.append(
      this.renderTextField({
        name: 'timeProfile',
        label: this.runtime.i18n.t('flows.edit.timeProfile'),
        value: draft.timeProfile,
        placeholder: this.runtime.i18n.t('flows.edit.timeProfilePlaceholder'),
      }),
      this.renderRiskField(draft.riskLevel)
    );
    if (this.editError) {
      const error = document.createElement('p');
      error.className = 'flows-edit-error';
      error.textContent = this.editError;
      body.appendChild(error);
    }

    const footer = document.createElement('footer');
    footer.className = 'flows-edit-footer';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'flows-edit-secondary';
    cancel.textContent = this.runtime.i18n.t('flows.edit.cancel');
    cancel.disabled = this.isSubmittingEdit;
    cancel.addEventListener('click', () => this.closeEditModal());

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'flows-edit-primary';
    save.textContent = this.runtime.i18n.t(
      this.isSubmittingEdit
        ? isCreate
          ? 'flows.create.saving'
          : 'flows.edit.saving'
        : isCreate
          ? 'flows.create.save'
          : 'flows.edit.save'
    );
    save.disabled = this.isSubmittingEdit;
    footer.append(cancel, save);

    dialog.append(header, body, footer);
    overlay.appendChild(dialog);
    requestAnimationFrame(() => {
      dialog.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
    });
    return overlay;
  }

  private renderTextField(options: {
    name: string;
    label: string;
    value: string;
    placeholder: string;
  }): HTMLElement {
    const field = document.createElement('label');
    field.className = 'flows-edit-field';

    const label = document.createElement('span');
    label.className = 'flows-edit-label';
    label.textContent = options.label;

    const input = document.createElement('input');
    input.className = 'flows-edit-input';
    input.dataset.flowDragIgnore = 'true';
    input.name = options.name;
    input.type = 'text';
    input.value = options.value;
    input.placeholder = options.placeholder;
    input.disabled = this.isSubmittingEdit;

    field.append(label, input);
    return field;
  }

  private renderTitleField(
    column: FlowColumn | null,
    draft: FlowEditDraft
  ): HTMLElement {
    const field = document.createElement('div');
    field.className = 'flows-edit-field flows-edit-title-field';

    const label = document.createElement('span');
    label.className = 'flows-edit-label';
    label.textContent = this.runtime.i18n.t('flows.edit.name');

    const row = document.createElement('div');
    row.className = 'flows-edit-title-control-row';
    row.appendChild(
      this.renderFlowAppearanceButton({
        column,
        visual: { icon: draft.icon, color: draft.color },
        className: 'flows-edit-title-icon-button',
        iconClassName: 'flows-edit-title-icon',
        size: 22,
      })
    );

    const input = document.createElement('input');
    input.className = 'flows-edit-input flows-edit-title-input';
    input.dataset.flowDragIgnore = 'true';
    input.name = 'title';
    input.type = 'text';
    input.value = draft.title;
    input.placeholder = this.runtime.i18n.t('flows.edit.namePlaceholder');
    input.disabled = this.isSubmittingEdit;
    input.setAttribute('aria-label', this.runtime.i18n.t('flows.edit.name'));

    row.appendChild(input);
    field.append(label, row);
    return field;
  }

  private renderEditFieldGrid(fields: HTMLElement[]): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'flows-edit-field-grid';
    grid.append(...fields);
    return grid;
  }

  private renderStatusField(selectedStatus: Status): HTMLElement {
    return this.renderEditDropdownField({
      label: this.runtime.i18n.t('flows.fields.status'),
      value: selectedStatus,
      items: FLOW_STATUSES.map((status) => ({
        value: status,
        label: this.getStatusLabel(status),
        icon: this.getStatusIcon(status),
        tone: this.getStatusTone(status),
      })),
      onSelect: (value) => {
        if (!isFlowStatus(value)) return;
        this.updateEditDraft({ status: value });
      },
    });
  }

  private renderPriorityField(priority: FlowPriority | null): HTMLElement {
    return this.renderEditDropdownField({
      label: this.runtime.i18n.t('flows.fields.priority'),
      value: priority ?? FLOW_PRIORITY_DEFAULT_VALUE,
      items: [
        {
          value: FLOW_PRIORITY_DEFAULT_VALUE,
          label: this.runtime.i18n.t('flows.edit.priorityDefault'),
          icon: 'bars-2',
          tone: 'slate',
        },
        ...FLOW_PRIORITIES.map((value) => ({
          value,
          label: this.getPriorityLabel(value),
          icon: this.getPriorityIcon(value),
          tone: this.getPriorityTone(value),
        })),
      ],
      onSelect: (value) => {
        this.updateEditDraft({
          priority: isFlowPriority(value) ? value : null,
        });
      },
    });
  }

  private renderRiskField(selectedRisk: FlowRiskLevel): HTMLElement {
    return this.renderEditDropdownField({
      label: this.runtime.i18n.t('flows.edit.risk'),
      value: selectedRisk,
      items: FLOW_RISK_LEVELS.map((risk) => ({
        value: risk,
        label: this.getRiskLabel(risk),
        icon: this.getRiskIcon(risk),
        tone: this.getRiskTone(risk),
      })),
      onSelect: (value) => {
        if (!isFlowRisk(value)) return;
        this.updateEditDraft({ riskLevel: value });
      },
    });
  }

  private renderEditDropdownField(options: {
    label: string;
    value: string;
    items: FlowMetaSelectItem[];
    onSelect: (value: string) => void;
  }): HTMLElement {
    const selected =
      options.items.find((item) => item.value === options.value) ?? null;
    const field = document.createElement('div');
    field.className = 'flows-edit-field';

    const label = document.createElement('span');
    label.className = 'flows-edit-label';
    label.textContent = options.label;

    const dropdown = new StaticDropdownSelect<FlowMetaSelectItem>({
      size: 'md',
      value: selected,
      placeholder: options.label,
      items: options.items,
      getKey: (item) => item.value,
      getLabel: (item) => item.label,
      ariaLabel: options.label,
      className: 'flows-edit-dropdown',
      disabled: this.isSubmittingEdit,
      portalTarget: document.body,
      renderTriggerLeading: (item) => this.renderDropdownIcon(item, false),
      renderOptionLeading: (item) => this.renderDropdownIcon(item, true),
      renderOptionTrailing: (_item, active) => {
        if (!active) return null;
        const check = createIcon('check', { size: 14, strokeWidth: 2.3 });
        check.setAttribute('aria-hidden', 'true');
        const wrapper = document.createElement('span');
        wrapper.className = 'flows-edit-dropdown-check';
        wrapper.appendChild(check);
        return wrapper;
      },
      onSelect: (item) => options.onSelect(item.value),
    });
    dropdown.element.dataset.flowDragIgnore = 'true';
    this.dropdownDisposers.push(() => dropdown.destroy());

    field.append(label, dropdown.element);
    return field;
  }

  private renderDropdownIcon(
    item: FlowMetaSelectItem | null,
    option: boolean
  ): HTMLElement | null {
    if (!item) return null;
    const icon = createIcon(item.icon, { size: option ? 14 : 15, strokeWidth: 2 });
    const wrapper = document.createElement('span');
    wrapper.classList.add(
      option ? 'flows-edit-dropdown-option-icon' : 'flows-edit-dropdown-icon',
      `flows-edit-dropdown-tone--${item.tone}`
    );
    icon.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(icon);
    return wrapper;
  }

  private updateEditDraft(patch: Partial<FlowEditDraft>): void {
    if (!this.editDraft) return;
    this.editDraft = {
      ...this.editDraft,
      ...patch,
    };
  }

  private async submitEditModal(
    column: FlowColumn | null,
    form: HTMLFormElement
  ): Promise<void> {
    const formData = new FormData(form);
    const draft =
      column === null
        ? this.readCreateDraft(formData)
        : this.readEditDraft(formData, column);
    this.editDraft = draft;
    this.editError = null;
    this.isSubmittingEdit = true;
    this.renderCurrent();
    try {
      if (column === null) {
        await this.handlers.onCreateFlow({
          title: draft.title,
          meta: this.writeDraftPresentation(null, draft, null, null),
        });
      } else {
        const presentation = readFlowPresentationSettings(column.flow);
        const patch: FlowUpdatePayload = {
          title: draft.title,
          meta: this.writeDraftPresentation(
            column.flow.meta,
            draft,
            presentation.collapsed,
            presentation.hidden
          ),
        };
        if (draft.status !== column.flow.status) {
          patch.status = draft.status;
        }
        await this.handlers.onPatchFlow(column.flow.id, patch);
      }
      this.isSubmittingEdit = false;
      this.closeEditModal();
    } catch {
      this.isSubmittingEdit = false;
      this.editError = this.runtime.i18n.t(
        column === null ? 'flows.create.error' : 'flows.edit.error'
      );
      this.renderCurrent();
    }
  }

  private writeDraftPresentation(
    currentMeta: Flow['meta'] | undefined,
    draft: FlowEditDraft,
    collapsed: boolean | null,
    hidden: boolean | null
  ): Flow['meta'] {
    return writeFlowPresentationSettings(currentMeta, {
      icon: draft.icon,
      color: draft.color,
      timeProfile: draft.timeProfile || null,
      riskLevel: draft.riskLevel,
      priority: draft.priority,
      collapsed,
      hidden,
    });
  }

  private readCreateDraft(formData: FormData): FlowEditDraft {
    const draft = this.editDraft ?? this.createNewFlowDraft();
    return this.readDraftFromForm(
      formData,
      this.runtime.i18n.t('flows.defaultFlowTitle'),
      draft.icon,
      draft.color,
      draft.status,
      draft.riskLevel,
      draft.priority
    );
  }

  private readEditDraft(formData: FormData, column: FlowColumn): FlowEditDraft {
    const draft = this.editDraft ?? this.createEditDraft(column);
    return this.readDraftFromForm(
      formData,
      column.flow.title,
      draft.icon,
      draft.color,
      draft.status,
      draft.riskLevel,
      draft.priority
    );
  }

  private readDraftFromForm(
    formData: FormData,
    fallbackTitle: string,
    fallbackIcon: FlowThemeIcon,
    fallbackColor: FlowThemeColor,
    status: Status,
    riskLevel: FlowRiskLevel,
    priority: FlowPriority | null
  ): FlowEditDraft {
    const title = readFormString(formData, 'title');
    const iconValue = readFormString(formData, 'icon');
    const colorValue = readFormString(formData, 'color');
    return {
      title: title || fallbackTitle,
      status,
      icon: FLOW_THEME_ICONS.includes(iconValue as FlowThemeIcon)
        ? (iconValue as FlowThemeIcon)
        : fallbackIcon,
      color: FLOW_THEME_COLORS.includes(colorValue as FlowThemeColor)
        ? (colorValue as FlowThemeColor)
        : fallbackColor,
      timeProfile: readFormString(formData, 'timeProfile'),
      riskLevel,
      priority,
    };
  }

  private createEditDraft(column: FlowColumn): FlowEditDraft {
    const presentation = readFlowPresentationSettings(column.flow);
    return {
      title: column.flow.title,
      status: column.flow.status,
      icon:
        presentation.icon ??
        getFallbackFlowIcon(),
      color:
        presentation.color ??
        getFallbackFlowColor(),
      timeProfile: presentation.timeProfile ?? '',
      riskLevel: presentation.riskLevel ?? 'stable',
      priority: presentation.priority,
    };
  }

  private createNewFlowDraft(): FlowEditDraft {
    return {
      title: '',
      status: Status.Draft,
      icon: getFallbackFlowIcon(),
      color: getFallbackFlowColor(),
      timeProfile: '',
      riskLevel: 'stable',
      priority: null,
    };
  }

  private getThemeIconLabel(icon: FlowThemeIcon): string {
    switch (icon) {
      case 'academic-cap':
        return this.runtime.i18n.t('flows.icons.academicCap');
      case 'bar-chart':
        return this.runtime.i18n.t('flows.icons.barChart');
      case 'book-closed':
        return this.runtime.i18n.t('flows.icons.bookClosed');
      case 'book-open':
        return this.runtime.i18n.t('flows.icons.bookOpen');
      case 'brain':
        return this.runtime.i18n.t('flows.icons.brain');
      case 'code-brackets':
        return this.runtime.i18n.t('flows.icons.codeBrackets');
      case 'command-line':
        return this.runtime.i18n.t('flows.icons.commandLine');
      case 'computer-desktop':
        return this.runtime.i18n.t('flows.icons.computerDesktop');
      case 'currency-dollar':
        return this.runtime.i18n.t('flows.icons.currencyDollar');
      case 'dumbbell':
        return this.runtime.i18n.t('flows.icons.dumbbell');
      case 'folder':
        return this.runtime.i18n.t('flows.icons.folder');
      case 'health':
        return this.runtime.i18n.t('flows.icons.health');
      case 'heart':
        return this.runtime.i18n.t('flows.icons.heart');
      case 'notebook':
        return this.runtime.i18n.t('flows.icons.notebook');
      case 'lotus':
        return this.runtime.i18n.t('flows.icons.lotus');
      case 'paw':
        return this.runtime.i18n.t('flows.icons.paw');
      case 'plane':
        return this.runtime.i18n.t('flows.icons.plane');
      case 'plant':
        return this.runtime.i18n.t('flows.icons.plant');
      case 'popcorn':
        return this.runtime.i18n.t('flows.icons.popcorn');
    }
  }

  private getStatusLabel(status: Status): string {
    return this.runtime.i18n.t(`flows.status.${status}`);
  }

  private getStatusIcon(status: Status): IconName {
    switch (status) {
      case Status.Active:
        return 'arrow-path';
      case Status.Completed:
        return 'check-circle';
      case Status.Archived:
        return 'archive-box';
      case Status.Cancelled:
        return 'x-mark';
      case Status.Described:
        return 'map-pin';
      case Status.Draft:
      default:
        return 'status-pending';
    }
  }

  private getStatusTone(
    status: Status
  ): 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' {
    switch (status) {
      case Status.Active:
        return 'blue';
      case Status.Completed:
        return 'emerald';
      case Status.Cancelled:
        return 'rose';
      case Status.Described:
        return 'violet';
      case Status.Draft:
        return 'amber';
      case Status.Archived:
      default:
        return 'slate';
    }
  }

  private getPriorityLabel(priority: FlowPriority): string {
    switch (priority) {
      case Priority.Highest:
        return this.runtime.i18n.t('priority.highest');
      case Priority.High:
        return this.runtime.i18n.t('priority.high');
      case Priority.Low:
        return this.runtime.i18n.t('priority.low');
      case Priority.Lowest:
        return this.runtime.i18n.t('priority.lowest');
      case Priority.Medium:
      default:
        return this.runtime.i18n.t('priority.medium');
    }
  }

  private getPriorityIcon(priority: FlowPriority): IconName {
    switch (priority) {
      case Priority.Highest:
        return 'chevron-double-up';
      case Priority.High:
        return 'chevron-up';
      case Priority.Low:
        return 'chevron-down';
      case Priority.Lowest:
        return 'chevron-double-down';
      case Priority.Medium:
      default:
        return 'bars-2';
    }
  }

  private getPriorityTone(
    priority: FlowPriority
  ): 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' {
    switch (priority) {
      case Priority.Highest:
      case Priority.High:
        return 'rose';
      case Priority.Low:
      case Priority.Lowest:
        return 'blue';
      case Priority.Medium:
      default:
        return 'amber';
    }
  }

  private getRiskLabel(risk: FlowRiskLevel): string {
    return risk === 'high'
      ? this.runtime.i18n.t('flows.risk.high')
      : risk === 'medium'
        ? this.runtime.i18n.t('flows.risk.medium')
        : this.runtime.i18n.t('flows.risk.stable');
  }

  private getRiskIcon(risk: FlowRiskLevel): IconName {
    return risk === 'high'
      ? 'shield-exclamation'
      : risk === 'medium'
        ? 'exclamation-circle'
        : 'check-circle';
  }

  private getRiskTone(risk: FlowRiskLevel): FlowMetaTone {
    return risk === 'high' ? 'rose' : risk === 'medium' ? 'amber' : 'emerald';
  }

  private getEditingColumn(state: FlowsState): FlowColumn | null {
    if (this.editingFlowId === null) return null;
    return (
      state.columns.find((column) => column.flow.id === this.editingFlowId) ??
      null
    );
  }

  private getColumnIndex(flowId: Flow['id']): number {
    return Math.max(
      0,
      this.lastState?.columns.findIndex(
        (column) => column.flow.id === flowId
      ) ?? 0
    );
  }

  private closeEditModal(): void {
    if (this.isSubmittingEdit) return;
    this.isCreatingFlow = false;
    this.editingFlowId = null;
    this.editDraft = null;
    this.editError = null;
    this.renderCurrent();
  }

  private startFlowTitleEdit(
    flowId: Flow['id'],
    surface: FlowTitleEditSurface
  ): void {
    this.editingFlowTitleTarget = { flowId, surface };
    this.flowTitleEditInput = null;
    this.renderCurrent();
  }

  private finishFlowTitleEdit(flow: Flow, apply: boolean): void {
    if (this.editingFlowTitleTarget?.flowId !== flow.id) return;
    const nextTitle = this.flowTitleEditInput?.value.trim() ?? '';
    this.editingFlowTitleTarget = null;
    this.flowTitleEditInput = null;
    if (apply && nextTitle.length > 0 && nextTitle !== flow.title) {
      void this.handlers.onPatchFlow(flow.id, { title: nextTitle });
      return;
    }
    this.renderCurrent();
  }

  private renderCurrent(): void {
    if (!this.lastState) return;
    this.render(this.lastState);
  }

  private closeColumnMenu(): void {
    const popover = this.columnMenuPopover;
    if (!popover) return;
    this.columnMenuPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeAppearancePopover(): void {
    const popover = this.appearancePopover;
    if (!popover) return;
    this.appearancePopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private disposeDropdownControls(): void {
    while (this.dropdownDisposers.length > 0) {
      this.dropdownDisposers.pop()?.();
    }
  }
}

function isFlowStatus(value: string): value is Status {
  return FLOW_STATUSES.includes(value as Status);
}

function isFlowPriority(value: string): value is FlowPriority {
  return FLOW_PRIORITIES.includes(value as FlowPriority);
}

function isFlowRisk(value: string): value is FlowRiskLevel {
  return FLOW_RISK_LEVELS.includes(value as FlowRiskLevel);
}

function readFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
