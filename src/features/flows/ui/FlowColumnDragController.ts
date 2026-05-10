import type { Flow } from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowsState } from '../domain/types.ts';
import { hasFlowInsertionChanged } from '../domain/flowColumnPosition.ts';

const DRAG_START_THRESHOLD_PX = 4;
const AUTO_SCROLL_EDGE_PX = 44;
const AUTO_SCROLL_STEP_PX = 18;

type FlowColumnDragControllerOptions = {
  root: HTMLElement;
  getState: () => FlowsState | null;
  onDrop: (flowId: Flow['id'], insertionIndex: number) => void;
};

type PendingDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  sourceColumnElement: HTMLElement;
  flowId: Flow['id'];
};

type ActiveDrag = PendingDrag & {
  offsetX: number;
  offsetY: number;
  preview: HTMLElement;
  placeholder: HTMLElement;
  insertionIndex: number | null;
};

function getEventWindow(event: Event): Window {
  return (event as UIEvent).view ?? window;
}

function isDragIgnoredTarget(target: Element | null): boolean {
  if (!target) return false;
  if (target.closest('.flows-column-collapsed')) return false;
  return Boolean(
    target.closest(
      '[data-flow-drag-ignore="true"], button, input, textarea, select'
    )
  );
}

export class FlowColumnDragController {
  private pending: PendingDrag | null = null;
  private active: ActiveDrag | null = null;
  private eventWindow: Window | null = null;
  private suppressNextClick = false;
  private mounted = false;

  constructor(private readonly options: FlowColumnDragControllerOptions) {}

  public mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    this.options.root.addEventListener(
      'pointerdown',
      this.handlePointerDown,
      true
    );
    this.options.root.addEventListener('click', this.handleClick, true);
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.cancelDrag();
    this.options.root.removeEventListener(
      'pointerdown',
      this.handlePointerDown,
      true
    );
    this.options.root.removeEventListener('click', this.handleClick, true);
  }

  public cancelDrag(): void {
    this.removeWindowListeners();
    this.pending = null;
    this.finishActiveDrag(false);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (!this.suppressNextClick) return;
    this.suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || event.isPrimary === false) return;
    const target = event.target as Element | null;
    const columnElement = target?.closest<HTMLElement>(
      '[data-flow-column-draggable="true"]'
    );
    if (!columnElement || !this.options.root.contains(columnElement)) return;
    if (isDragIgnoredTarget(target)) {
      return;
    }

    const flowId = Number(columnElement.dataset.flowId);
    const state = this.options.getState();
    if (!state || !Number.isFinite(flowId)) return;
    if (!state.columns.some((column) => column.flow.id === flowId)) return;

    this.pending = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      sourceColumnElement: columnElement,
      flowId,
    };
    this.addWindowListeners(getEventWindow(event));
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const pending = this.pending;
    if (!pending || event.pointerId !== pending.pointerId) return;

    if (!this.active) {
      const deltaX = event.clientX - pending.startX;
      const deltaY = event.clientY - pending.startY;
      if (Math.hypot(deltaX, deltaY) < DRAG_START_THRESHOLD_PX) return;
      this.startDrag(pending, event);
    }

    const active = this.active;
    if (!active) return;
    event.preventDefault();
    this.movePreview(active, event.clientX, event.clientY);
    this.updateDropTarget(active, event.clientX);
    this.autoScroll(event.clientX);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.pending && event.pointerId !== this.pending.pointerId) return;
    this.removeWindowListeners();
    this.pending = null;
    this.finishActiveDrag(true);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (this.pending && event.pointerId !== this.pending.pointerId) return;
    this.cancelDrag();
  };

  private startDrag(pending: PendingDrag, event: PointerEvent): void {
    const rect = pending.sourceColumnElement.getBoundingClientRect();
    const preview = pending.sourceColumnElement.cloneNode(true) as HTMLElement;
    preview.classList.add('flows-column-drag-preview');
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.top}px`;

    const placeholder = document.createElement('div');
    placeholder.className = 'flows-column-drag-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.flexBasis = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    pending.sourceColumnElement.classList.add('is-dragging');
    document.body.append(preview);

    this.active = {
      ...pending,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      preview,
      placeholder,
      insertionIndex: null,
    };
    this.options.root.classList.add('is-flow-column-dragging');
    this.movePreview(this.active, event.clientX, event.clientY);
    this.updateDropTarget(this.active, event.clientX);
  }

  private movePreview(active: ActiveDrag, clientX: number, clientY: number): void {
    active.preview.style.left = `${clientX - active.offsetX}px`;
    active.preview.style.top = `${clientY - active.offsetY}px`;
  }

  private updateDropTarget(active: ActiveDrag, clientX: number): void {
    const insertionIndex = this.resolveInsertionIndex(active.flowId, clientX);
    active.insertionIndex = insertionIndex;
    if (!this.hasActiveTargetChanged(active)) {
      active.placeholder.remove();
      return;
    }
    this.placePlaceholder(active, insertionIndex);
  }

  private hasActiveTargetChanged(active: ActiveDrag): boolean {
    const state = this.options.getState();
    return Boolean(
      state &&
        active.insertionIndex !== null &&
        hasFlowInsertionChanged(state.columns, active.flowId, active.insertionIndex)
    );
  }

  private resolveInsertionIndex(
    movingFlowId: Flow['id'],
    clientX: number
  ): number {
    const columnElements = Array.from(
      this.options.root.querySelectorAll<HTMLElement>(
        '[data-flow-column-draggable="true"]'
      )
    ).filter((column) => Number(column.dataset.flowId) !== movingFlowId);
    const index = columnElements.findIndex((column) => {
      const rect = column.getBoundingClientRect();
      return clientX < rect.left + rect.width / 2;
    });
    return index >= 0 ? index : columnElements.length;
  }

  private placePlaceholder(active: ActiveDrag, insertionIndex: number): void {
    const board = this.options.root.querySelector<HTMLElement>(
      '[data-flow-board="true"]'
    );
    if (!board) return;
    const columns = Array.from(
      board.querySelectorAll<HTMLElement>('[data-flow-column-draggable="true"]')
    ).filter((column) => Number(column.dataset.flowId) !== active.flowId);
    board.insertBefore(active.placeholder, columns[insertionIndex] ?? null);
  }

  private autoScroll(clientX: number): void {
    const body = this.options.root.querySelector<HTMLElement>('.flows-body');
    if (!body) return;
    const rect = body.getBoundingClientRect();
    if (clientX < rect.left + AUTO_SCROLL_EDGE_PX) {
      body.scrollLeft -= AUTO_SCROLL_STEP_PX;
    } else if (clientX > rect.right - AUTO_SCROLL_EDGE_PX) {
      body.scrollLeft += AUTO_SCROLL_STEP_PX;
    }
  }

  private finishActiveDrag(commit: boolean): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    active.preview.remove();
    active.placeholder.remove();
    active.sourceColumnElement.classList.remove('is-dragging');
    this.options.root.classList.remove('is-flow-column-dragging');
    this.suppressNextClick = true;

    if (commit && this.hasActiveTargetChanged(active) && active.insertionIndex !== null) {
      this.options.onDrop(active.flowId, active.insertionIndex);
    }
  }

  private addWindowListeners(win: Window): void {
    this.eventWindow = win;
    win.addEventListener('pointermove', this.handlePointerMove, true);
    win.addEventListener('pointerup', this.handlePointerUp, true);
    win.addEventListener('pointercancel', this.handlePointerCancel, true);
    win.addEventListener('blur', this.handleWindowBlur, true);
  }

  private removeWindowListeners(): void {
    const win = this.eventWindow ?? window;
    this.eventWindow = null;
    win.removeEventListener('pointermove', this.handlePointerMove, true);
    win.removeEventListener('pointerup', this.handlePointerUp, true);
    win.removeEventListener('pointercancel', this.handlePointerCancel, true);
    win.removeEventListener('blur', this.handleWindowBlur, true);
  }

  private readonly handleWindowBlur = (): void => {
    this.cancelDrag();
  };
}
