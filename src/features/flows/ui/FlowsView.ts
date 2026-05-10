import type { AppRuntime } from '../../../app-runtime/index.ts';
import { createTextButton } from '../../../ui-lib/src/hud/index.ts';
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
  type FlowPresentationSettings,
  type FlowPriority,
  type FlowRiskLevel,
  type FlowThemeColor,
  getFallbackFlowColor,
  readFlowPresentationSettings,
  writeFlowPresentationSettings,
} from '../domain/flowPresentation.ts';
import { hasFlowInsertionChanged } from '../domain/flowColumnPosition.ts';
import type { FlowColumn, FlowsState } from '../domain/types.ts';
import { FlowColumnDragController } from './FlowColumnDragController.ts';
import { ensureFlowsStyles } from './flowsStyles.ts';

type FlowEditDraft = {
  title: string;
  color: FlowThemeColor;
  timeProfile: string;
  riskLevel: FlowRiskLevel;
  priority: FlowPriority | null;
};

type FlowTitleEditSurface = 'column' | 'organize';

type FlowTitleEditTarget = {
  flowId: Flow['id'];
  surface: FlowTitleEditSurface;
};

const FLOW_STATUSES = [
  Status.Draft,
  Status.Described,
  Status.Active,
  Status.Completed,
  Status.Archived,
  Status.Cancelled,
] as const;

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
  private reorderPendingFlowId: Flow['id'] | null = null;
  private openMenuFlowId: number | null = null;
  private editingFlowTitleTarget: FlowTitleEditTarget | null = null;
  private flowTitleEditInput: HTMLInputElement | null = null;
  private isCreatingFlow = false;
  private editingFlowId: number | null = null;
  private editDraft: FlowEditDraft | null = null;
  private editError: string | null = null;
  private isSubmittingEdit = false;
  private lastState: FlowsState | null = null;
  private readonly closeMenuOnOutsideClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.flows-column-menu-container')) return;
    this.closeColumnMenu();
  };

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
    document.addEventListener('click', this.closeMenuOnOutsideClick);
  }

  public render(state: FlowsState): void {
    this.lastState = state;
    this.element.replaceChildren(this.renderPage(state));
  }

  public destroy(): void {
    this.columnDragController.unmount();
    document.removeEventListener('click', this.closeMenuOnOutsideClick);
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
      })
    );
    titleBlock.appendChild(titleRow);

    const actions = document.createElement('div');
    actions.className = 'flows-header-actions';
    actions.appendChild(
      this.renderHeaderActionButton({
        label: this.runtime.i18n.t('flows.actions.create'),
        icon: 'plus',
        tone: 'primary',
        disabled: state.status === 'loading',
        onClick: () => {
          this.openCreateModal();
          this.renderCurrent();
        },
      })
    );

    header.append(titleBlock, actions);
    return header;
  }

  private renderHeaderActionButton(options: {
    label: string;
    icon: IconName;
    tone?: 'primary' | 'quiet';
    disabled?: boolean;
    pressed?: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      text: '',
      tone: options.tone === 'primary' ? 'primary' : 'text',
      size: 'sm',
      className: `flows-header-action${
        options.tone === 'primary' ? ' flows-header-action--primary' : ''
      }`,
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

    const board = document.createElement('div');
    board.className = 'flows-board';
    board.dataset.flowBoard = 'true';
    state.columns.forEach((column, index) => {
      board.appendChild(this.renderFlowColumn(column, index));
    });
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

  private renderFlowColumn(column: FlowColumn, index: number): HTMLElement {
    const presentation = readFlowPresentationSettings(column.flow);
    const isCollapsed = presentation.collapsed === true;
    const accentColor = this.getColumnAccentColor(column, index);
    const root = document.createElement('section');
    root.className = `flows-column flows-column--${accentColor}${
      isCollapsed ? ' is-collapsed' : ''
    }`;
    root.dataset.flowId = String(column.flow.id);
    root.dataset.flowColumnDraggable = 'true';

    root.appendChild(this.renderCollapsedColumn(column));
    root.appendChild(this.renderExpandedColumn(column));
    return root;
  }

  private renderOrganizeModal(state: FlowsState): HTMLElement {
    const columns = state.columns;
    const overlay = document.createElement('div');
    overlay.className = 'flows-organize-modal';
    overlay.setAttribute('role', 'presentation');
    overlay.addEventListener('click', () => this.closeOrganizeModal());

    const dialog = document.createElement('section');
    dialog.className = 'flows-organize-dialog';
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
    body.className = 'flows-organize-body';
    body.setAttribute('role', 'list');
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
    const accentColor = this.getColumnAccentColor(column, index);
    const isPending = this.reorderPendingFlowId === column.flow.id;
    const row = document.createElement('div');
    row.className = `flows-organize-row flows-column--${accentColor}${
      isPending ? ' is-pending' : ''
    }`;
    row.setAttribute('role', 'listitem');
    row.dataset.flowId = String(column.flow.id);
    row.addEventListener('dragover', (event) => {
      this.handleOrganizeDragOver(event, row, column);
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

    const dot = document.createElement('span');
    dot.className = 'flows-organize-dot';
    dot.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'flows-organize-label';
    label.appendChild(this.renderFlowTitleInline(column, 'organize'));
    main.append(handle, dot, label);

    const actions = document.createElement('div');
    actions.className = 'flows-organize-row-actions';
    actions.append(
      this.renderOrganizeMoveButton({
        icon: 'chevron-up',
        label: this.runtime.i18n.t('flows.organize.moveUp', {
          title: column.flow.title,
        }),
        disabled: index === 0 || this.reorderPendingFlowId !== null,
        onClick: () => void this.moveOrganizeColumn(column.flow.id, index - 1),
      }),
      this.renderOrganizeMoveButton({
        icon: 'chevron-down',
        label: this.runtime.i18n.t('flows.organize.moveDown', {
          title: column.flow.title,
        }),
        disabled:
          index === columns.length - 1 || this.reorderPendingFlowId !== null,
        onClick: () => void this.moveOrganizeColumn(column.flow.id, index + 1),
      })
    );
    row.append(main, actions);

    return row;
  }

  private renderOrganizeMoveButton(options: {
    icon: IconName;
    label: string;
    disabled: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flows-organize-move';
    button.title = options.label;
    button.setAttribute('aria-label', options.label);
    button.disabled = options.disabled;
    button.appendChild(createIcon(options.icon, { size: 17, strokeWidth: 2 }));
    button.addEventListener('click', options.onClick);
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
    column: FlowColumn
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
    this.clearOrganizeDropIndicators();
    this.organizeDragOverFlowId = column.flow.id;
    this.organizeDragPlacement = placement;
    row.classList.add('is-drag-over', `is-drag-over-${placement}`);
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
    const insertionIndex = this.resolveOrganizeInsertionIndex(
      columns,
      draggingFlowId,
      targetIndex,
      placement
    );
    this.resetOrganizeDragState();
    await this.moveOrganizeColumn(draggingFlowId, insertionIndex);
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
    this.clearOrganizeDropIndicators();
  }

  private clearOrganizeDropIndicators(): void {
    this.element
      .querySelectorAll<HTMLElement>(
        '.flows-organize-row.is-dragging, .flows-organize-row.is-drag-over'
      )
      .forEach((row) => {
        row.classList.remove(
          'is-dragging',
          'is-drag-over',
          'is-drag-over-before',
          'is-drag-over-after'
        );
      });
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
    this.openMenuFlowId = null;
    this.isOrganizeModalOpen = true;
  }

  private closeOrganizeModal(): void {
    if (this.reorderPendingFlowId !== null) return;
    this.isOrganizeModalOpen = false;
    this.resetOrganizeDragState();
    this.renderCurrent();
  }

  private getColumnAccentColor(
    column: FlowColumn,
    index: number
  ): FlowThemeColor {
    return (
      readFlowPresentationSettings(column.flow).color ??
      getFallbackFlowColor(index)
    );
  }

  private renderCollapsedColumn(column: FlowColumn): HTMLElement {
    const collapsed = document.createElement('button');
    collapsed.type = 'button';
    collapsed.className = 'flows-column-collapsed';
    collapsed.title = column.flow.title;
    collapsed.setAttribute('aria-label', this.runtime.i18n.t('flows.expand'));
    collapsed.addEventListener('click', () => {
      void this.patchColumnCollapsed(column, false);
    });

    const indicator = document.createElement('span');
    indicator.className = 'flows-column-collapsed-indicator';

    const title = document.createElement('span');
    title.className = 'flows-column-collapsed-title';
    title.textContent = column.flow.title;

    collapsed.append(indicator, title);
    return collapsed;
  }

  private renderExpandedColumn(column: FlowColumn): HTMLElement {
    const expanded = document.createElement('div');
    expanded.className = 'flows-column-expanded';

    const header = document.createElement('header');
    header.className = 'flows-column-header';

    const colorBar = document.createElement('span');
    colorBar.className = 'flows-column-color-bar';
    colorBar.setAttribute('aria-hidden', 'true');

    const titleRow = document.createElement('div');
    titleRow.className = 'flows-column-title-row';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flows-column-title-wrap';

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

    const metaRow = document.createElement('div');
    metaRow.className = 'flows-column-meta-row';
    const presentation = readFlowPresentationSettings(column.flow);
    metaRow.append(
      this.renderFlowStatusSelect(column),
      this.renderFlowPrioritySelect(column, presentation)
    );

    header.append(colorBar, titleRow, metaRow);

    const taskList = document.createElement('div');
    taskList.className = 'flows-column-task-list';
    this.appendTaskContent(taskList, column);

    expanded.append(header, taskList);
    return expanded;
  }

  private renderColumnMenu(column: FlowColumn): HTMLElement {
    const isOpen = this.openMenuFlowId === column.flow.id;
    const container = document.createElement('div');
    container.className = 'flows-column-menu-container';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'flows-column-icon-button flows-column-menu-trigger';
    trigger.dataset.flowDragIgnore = 'true';
    trigger.title = this.runtime.i18n.t('flows.actions.menu');
    trigger.setAttribute('aria-label', trigger.title);
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    trigger.appendChild(
      createIcon('ellipsis-horizontal', { size: 18, strokeWidth: 2 })
    );
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openMenuFlowId = isOpen ? null : column.flow.id;
      this.renderCurrent();
    });

    container.appendChild(trigger);
    if (isOpen) {
      container.appendChild(this.renderColumnMenuDropdown(column));
    }
    return container;
  }

  private renderColumnMenuDropdown(column: FlowColumn): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'flows-column-menu';
    menu.setAttribute('role', 'menu');
    menu.addEventListener('click', (event) => event.stopPropagation());
    menu.append(
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
    return menu;
  }

  private renderColumnMenuItem(options: {
    label: string;
    icon: Parameters<typeof createIcon>[0];
    tone?: 'danger';
    onClick: () => void;
  }): HTMLButtonElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.dataset.flowDragIgnore = 'true';
    item.className = `flows-column-menu-item${
      options.tone === 'danger' ? ' flows-column-menu-item--danger' : ''
    }`;
    item.setAttribute('role', 'menuitem');
    item.appendChild(createIcon(options.icon, { size: 15, strokeWidth: 2 }));
    item.append(document.createTextNode(options.label));
    item.addEventListener('click', options.onClick);
    return item;
  }

  private openEditModal(column: FlowColumn): void {
    const presentation = readFlowPresentationSettings(column.flow);
    this.openMenuFlowId = null;
    this.editingFlowTitleTarget = null;
    this.flowTitleEditInput = null;
    this.isCreatingFlow = false;
    this.editingFlowId = column.flow.id;
    this.editDraft = {
      title: column.flow.title,
      color:
        presentation.color ??
        getFallbackFlowColor(this.getColumnIndex(column.flow.id)),
      timeProfile: presentation.timeProfile ?? '',
      riskLevel: presentation.riskLevel ?? 'stable',
      priority: presentation.priority,
    };
    this.editError = null;
    this.renderCurrent();
  }

  private openCreateModal(): void {
    this.openMenuFlowId = null;
    this.isOrganizeModalOpen = false;
    this.editingFlowTitleTarget = null;
    this.flowTitleEditInput = null;
    this.isCreatingFlow = true;
    this.editingFlowId = null;
    this.editDraft = this.createNewFlowDraft();
    this.editError = null;
  }

  private async deleteFlow(column: FlowColumn): Promise<void> {
    this.openMenuFlowId = null;
    this.renderCurrent();
    const confirmed = window.confirm(
      this.runtime.i18n.t('flows.delete.confirm', {
        title: column.flow.title,
      })
    );
    if (!confirmed) return;
    await this.handlers.onDeleteFlow(column.flow.id);
  }

  private renderFlowStatusSelect(column: FlowColumn): HTMLElement {
    return this.renderMetaSelect({
      label: this.runtime.i18n.t('flows.fields.status'),
      value: column.flow.status,
      options: FLOW_STATUSES.map((status) => ({
        value: status,
        label: this.getStatusLabel(status),
      })),
      onChange: (value, select) => {
        if (!isFlowStatus(value) || value === column.flow.status) return;
        void this.patchFlowFromSelect(select, column, { status: value });
      },
    });
  }

  private renderFlowPrioritySelect(
    column: FlowColumn,
    presentation: FlowPresentationSettings
  ): HTMLElement {
    const priority = presentation.priority ?? Priority.Medium;
    return this.renderMetaSelect({
      label: this.runtime.i18n.t('flows.fields.priority'),
      value: priority,
      options: FLOW_PRIORITIES.map((value) => ({
        value,
        label: this.getPriorityLabel(value),
      })),
      onChange: (value, select) => {
        if (!isFlowPriority(value) || value === presentation.priority) return;
        void this.patchFlowFromSelect(select, column, {
          meta: writeFlowPresentationSettings(column.flow.meta, {
            ...presentation,
            priority: value,
          }),
        });
      },
    });
  }

  private renderMetaSelect(options: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string, select: HTMLSelectElement) => void;
  }): HTMLElement {
    const field = document.createElement('label');
    field.className = 'flows-column-meta-select-field';

    const text = document.createElement('span');
    text.className = 'flows-column-meta-select-label';
    text.textContent = options.label;

    const select = document.createElement('select');
    select.className = 'flows-column-meta-select';
    select.dataset.flowDragIgnore = 'true';
    select.value = options.value;
    options.options.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.selected = item.value === options.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      options.onChange(select.value, select);
    });

    field.append(text, select);
    return field;
  }

  private async patchFlowFromSelect(
    select: HTMLSelectElement,
    column: FlowColumn,
    patch: FlowUpdatePayload
  ): Promise<void> {
    select.disabled = true;
    try {
      await this.handlers.onPatchFlow(column.flow.id, patch);
    } catch {
      select.disabled = false;
      this.renderCurrent();
    }
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

  private renderRiskBadge(
    column: FlowColumn,
    presentation: FlowPresentationSettings
  ): HTMLElement {
    const badge = document.createElement('span');
    const highCount = column.tasks.filter(
      (task) => task.priority === 'high' || task.priority === 'highest'
    ).length;
    const tone =
      presentation.riskLevel ??
      (highCount > 0
        ? 'high'
        : column.openTaskCount > column.tasks.length
          ? 'medium'
          : 'stable');
    badge.className = `flows-column-risk flows-column-risk--${tone}`;

    const dot = document.createElement('span');
    dot.className = 'flows-column-risk-dot';
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent =
      tone === 'high'
        ? this.runtime.i18n.t('flows.risk.high')
        : tone === 'medium'
          ? this.runtime.i18n.t('flows.risk.medium')
          : this.runtime.i18n.t('flows.risk.stable');

    badge.append(dot, text);
    return badge;
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
    if (column.tasks.length === 0) {
      parent.appendChild(
        this.renderColumnState(this.runtime.i18n.t('flows.tasks.empty'))
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
    body.append(
      this.renderTextField({
        name: 'title',
        label: this.runtime.i18n.t('flows.edit.name'),
        value: draft.title,
        placeholder: this.runtime.i18n.t('flows.edit.namePlaceholder'),
      }),
      this.renderColorField(draft.color),
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

  private renderColorField(selectedColor: FlowThemeColor): HTMLElement {
    const field = document.createElement('fieldset');
    field.className = 'flows-edit-field flows-edit-color-field';

    const legend = document.createElement('legend');
    legend.className = 'flows-edit-label';
    legend.textContent = this.runtime.i18n.t('flows.edit.color');

    const options = document.createElement('div');
    options.className = 'flows-edit-color-row';
    FLOW_THEME_COLORS.forEach((color) => {
      const swatch = document.createElement('label');
      swatch.className = `flows-edit-color flows-edit-color--${color}`;
      swatch.title = this.runtime.i18n.t(`flows.colors.${color}`);

      const input = document.createElement('input');
      input.type = 'radio';
      input.dataset.flowDragIgnore = 'true';
      input.name = 'color';
      input.value = color;
      input.checked = color === selectedColor;
      input.disabled = this.isSubmittingEdit;

      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      swatch.append(input, dot);
      options.appendChild(swatch);
    });

    field.append(legend, options);
    return field;
  }

  private renderRiskField(selectedRisk: FlowRiskLevel): HTMLElement {
    const field = document.createElement('label');
    field.className = 'flows-edit-field';

    const label = document.createElement('span');
    label.className = 'flows-edit-label';
    label.textContent = this.runtime.i18n.t('flows.edit.risk');

    const select = document.createElement('select');
    select.className = 'flows-edit-select';
    select.dataset.flowDragIgnore = 'true';
    select.name = 'riskLevel';
    select.disabled = this.isSubmittingEdit;
    FLOW_RISK_LEVELS.forEach((risk) => {
      const option = document.createElement('option');
      option.value = risk;
      option.selected = risk === selectedRisk;
      option.textContent = this.getRiskLabel(risk);
      select.appendChild(option);
    });

    field.append(label, select);
    return field;
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
          meta: this.writeDraftPresentation(null, draft, null),
        });
      } else {
        await this.handlers.onPatchFlow(column.flow.id, {
          title: draft.title,
          meta: this.writeDraftPresentation(
            column.flow.meta,
            draft,
            readFlowPresentationSettings(column.flow).collapsed
          ),
        });
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
    collapsed: boolean | null
  ): Flow['meta'] {
    return writeFlowPresentationSettings(currentMeta, {
      color: draft.color,
      timeProfile: draft.timeProfile || null,
      riskLevel: draft.riskLevel,
      priority: draft.priority,
      collapsed,
    });
  }

  private readCreateDraft(formData: FormData): FlowEditDraft {
    return this.readDraftFromForm(
      formData,
      this.runtime.i18n.t('flows.defaultFlowTitle'),
      getFallbackFlowColor(this.lastState?.columns.length ?? 0),
      null
    );
  }

  private readEditDraft(formData: FormData, column: FlowColumn): FlowEditDraft {
    return this.readDraftFromForm(
      formData,
      column.flow.title,
      getFallbackFlowColor(this.getColumnIndex(column.flow.id)),
      readFlowPresentationSettings(column.flow).priority
    );
  }

  private readDraftFromForm(
    formData: FormData,
    fallbackTitle: string,
    fallbackColor: FlowThemeColor,
    priority: FlowPriority | null
  ): FlowEditDraft {
    const title = String(formData.get('title') ?? '').trim();
    const colorValue = String(formData.get('color') ?? '');
    const riskValue = String(formData.get('riskLevel') ?? '');
    return {
      title: title || fallbackTitle,
      color: FLOW_THEME_COLORS.includes(colorValue as FlowThemeColor)
        ? (colorValue as FlowThemeColor)
        : fallbackColor,
      timeProfile: String(formData.get('timeProfile') ?? '').trim(),
      riskLevel: FLOW_RISK_LEVELS.includes(riskValue as FlowRiskLevel)
        ? (riskValue as FlowRiskLevel)
        : 'stable',
      priority,
    };
  }

  private createEditDraft(column: FlowColumn): FlowEditDraft {
    const presentation = readFlowPresentationSettings(column.flow);
    return {
      title: column.flow.title,
      color:
        presentation.color ??
        getFallbackFlowColor(this.getColumnIndex(column.flow.id)),
      timeProfile: presentation.timeProfile ?? '',
      riskLevel: presentation.riskLevel ?? 'stable',
      priority: presentation.priority,
    };
  }

  private createNewFlowDraft(): FlowEditDraft {
    return {
      title: '',
      color: getFallbackFlowColor(this.lastState?.columns.length ?? 0),
      timeProfile: '',
      riskLevel: 'stable',
      priority: null,
    };
  }

  private getStatusLabel(status: Status): string {
    return this.runtime.i18n.t(`flows.status.${status}`);
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

  private getRiskLabel(risk: FlowRiskLevel): string {
    return risk === 'high'
      ? this.runtime.i18n.t('flows.risk.high')
      : risk === 'medium'
        ? this.runtime.i18n.t('flows.risk.medium')
        : this.runtime.i18n.t('flows.risk.stable');
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
    if (this.openMenuFlowId === null) return;
    this.openMenuFlowId = null;
    this.renderCurrent();
  }
}

function isFlowStatus(value: string): value is Status {
  return FLOW_STATUSES.includes(value as Status);
}

function isFlowPriority(value: string): value is FlowPriority {
  return FLOW_PRIORITIES.includes(value as FlowPriority);
}
