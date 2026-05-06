import type { BoardColumn } from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardColumnPatch, BoardsState } from '../domain/types.ts';
import {
  hasColumnTargetChanged,
  resolveColumnTarget,
} from '../domain/columnTargetResolver.ts';

const DRAG_START_THRESHOLD_PX = 4;
const AUTO_SCROLL_EDGE_PX = 44;
const AUTO_SCROLL_STEP_PX = 18;

type BoardColumnDragControllerOptions = {
  root: HTMLElement;
  getState: () => BoardsState | null;
  onDrop: (columnId: BoardColumn['id'], target: BoardColumnPatch) => void;
  onDragStart?: () => void;
};

type PendingDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  sourceColumnElement: HTMLElement;
  columnId: BoardColumn['id'];
};

type ActiveDrag = PendingDrag & {
  offsetX: number;
  offsetY: number;
  preview: HTMLElement;
  placeholder: HTMLElement;
  sourceColumns: BoardColumn[];
  target: BoardColumnPatch | null;
};

function getEventWindow(event: Event): Window {
  return (event as UIEvent).view ?? window;
}

function findBoardColumns(
  state: BoardsState,
  columnId: BoardColumn['id']
): BoardColumn[] | null {
  for (const board of state.boards) {
    if (board.columns.some((column) => column.id === columnId)) {
      return board.columns;
    }
  }
  return null;
}

export class BoardColumnDragController {
  private pending: PendingDrag | null = null;
  private active: ActiveDrag | null = null;
  private eventWindow: Window | null = null;
  private suppressNextClick = false;
  private mounted = false;

  constructor(private readonly options: BoardColumnDragControllerOptions) {}

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
      '[data-board-column-draggable="true"]'
    );
    if (!columnElement || !this.options.root.contains(columnElement)) return;
    if (
      target?.closest(
        '[data-board-drag-ignore="true"], [data-board-card-draggable="true"], input, textarea, select'
      )
    ) {
      return;
    }

    const columnId = columnElement.dataset.boardColumnId;
    const state = this.options.getState();
    if (!state || !columnId || !findBoardColumns(state, columnId)) return;

    this.pending = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      sourceColumnElement: columnElement,
      columnId,
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
    const state = this.options.getState();
    const sourceColumns = state ? findBoardColumns(state, pending.columnId) : null;
    if (!sourceColumns) return;

    this.options.onDragStart?.();
    const rect = pending.sourceColumnElement.getBoundingClientRect();
    const preview = pending.sourceColumnElement.cloneNode(true) as HTMLElement;
    preview.classList.add('majom-boards__column-drag-preview');
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.top}px`;

    const placeholder = document.createElement('div');
    placeholder.className = 'majom-boards__column-drag-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    pending.sourceColumnElement.classList.add('is-dragging');
    document.body.append(preview);

    this.active = {
      ...pending,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      preview,
      placeholder,
      sourceColumns,
      target: null,
    };
    this.options.root.classList.add('is-column-dragging');
    this.movePreview(this.active, event.clientX, event.clientY);
    this.updateDropTarget(this.active, event.clientX);
  }

  private movePreview(active: ActiveDrag, clientX: number, clientY: number): void {
    active.preview.style.left = `${clientX - active.offsetX}px`;
    active.preview.style.top = `${clientY - active.offsetY}px`;
  }

  private updateDropTarget(active: ActiveDrag, clientX: number): void {
    const insertionIndex = this.resolveInsertionIndex(active.columnId, clientX);
    active.target = resolveColumnTarget({
      columns: active.sourceColumns,
      movingColumnId: active.columnId,
      insertionIndex,
    });
    this.placePlaceholder(active, insertionIndex);
  }

  private resolveInsertionIndex(
    movingColumnId: BoardColumn['id'],
    clientX: number
  ): number {
    const columnElements = Array.from(
      this.options.root.querySelectorAll<HTMLElement>(
        '[data-board-column-draggable="true"]'
      )
    ).filter((column) => column.dataset.boardColumnId !== movingColumnId);
    const index = columnElements.findIndex((column) => {
      const rect = column.getBoundingClientRect();
      return clientX < rect.left + rect.width / 2;
    });
    return index >= 0 ? index : columnElements.length;
  }

  private placePlaceholder(active: ActiveDrag, insertionIndex: number): void {
    const canvas = this.options.root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    );
    if (!canvas) return;
    const columns = Array.from(
      canvas.querySelectorAll<HTMLElement>('[data-board-column-draggable="true"]')
    ).filter((column) => column.dataset.boardColumnId !== active.columnId);
    const composer = canvas.querySelector<HTMLElement>(
      '[data-board-column-composer="true"]'
    );
    canvas.insertBefore(
      active.placeholder,
      columns[insertionIndex] ?? composer ?? null
    );
  }

  private autoScroll(clientX: number): void {
    const canvas = this.options.root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    );
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left + AUTO_SCROLL_EDGE_PX) {
      canvas.scrollLeft -= AUTO_SCROLL_STEP_PX;
    } else if (clientX > rect.right - AUTO_SCROLL_EDGE_PX) {
      canvas.scrollLeft += AUTO_SCROLL_STEP_PX;
    }
  }

  private finishActiveDrag(commit: boolean): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    active.preview.remove();
    active.placeholder.remove();
    active.sourceColumnElement.classList.remove('is-dragging');
    this.options.root.classList.remove('is-column-dragging');
    this.suppressNextClick = true;

    if (
      commit &&
      active.target &&
      hasColumnTargetChanged(active.sourceColumns, active.columnId, active.target)
    ) {
      this.options.onDrop(active.columnId, active.target);
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
