import type {
  BoardColumn,
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import type {
  BoardCardPlacementPatch,
  BoardsState,
} from '../domain/types.ts';
import { getCardPlacementId } from '../domain/cardIdentity.ts';
import {
  hasCardPlacementTargetChanged,
  resolveCardPlacementTarget,
} from '../domain/placementTargetResolver.ts';

const DRAG_START_THRESHOLD_PX = 4;
const AUTO_SCROLL_EDGE_PX = 44;
const AUTO_SCROLL_STEP_PX = 18;

type BoardDragControllerOptions = {
  root: HTMLElement;
  getState: () => BoardsState | null;
  onDrop: (
    placementId: CardPlacement['id'],
    target: BoardCardPlacementPatch
  ) => void;
  onDragStart?: () => void;
};

type PendingDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  sourceCardElement: HTMLElement;
  placementId: CardPlacement['id'];
  sourceColumnId: BoardColumn['id'];
};

type ActiveDrag = PendingDrag & {
  offsetX: number;
  offsetY: number;
  preview: HTMLElement;
  placeholder: HTMLElement;
  sourceColumnCards: Card[];
  targetColumnId: BoardColumn['id'] | null;
  target: BoardCardPlacementPatch | null;
};

function getEventWindow(event: Event): Window {
  return (event as UIEvent).view ?? window;
}

function findColumnCards(
  state: BoardsState,
  columnId: BoardColumn['id']
): Card[] | null {
  for (const board of state.boards) {
    const column = board.columns.find((candidate) => candidate.id === columnId);
    if (column) return column.cards;
  }
  return null;
}

function findCardColumnId(
  state: BoardsState,
  placementId: CardPlacement['id']
): BoardColumn['id'] | null {
  for (const board of state.boards) {
    for (const column of board.columns) {
      if (column.cards.some((card) => getCardPlacementId(card) === placementId)) {
        return column.id;
      }
    }
  }
  return null;
}

export class BoardDragController {
  private pending: PendingDrag | null = null;
  private active: ActiveDrag | null = null;
  private eventWindow: Window | null = null;
  private suppressNextClick = false;
  private mounted = false;

  constructor(private readonly options: BoardDragControllerOptions) {}

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
    const cardElement = target?.closest<HTMLElement>(
      '[data-board-card-draggable="true"]'
    );
    if (!cardElement || !this.options.root.contains(cardElement)) return;
    if (target?.closest('[data-board-drag-ignore="true"], input, textarea, select')) {
      return;
    }

    const placementId = cardElement.dataset.boardCardPlacementId;
    const state = this.options.getState();
    if (!state || !placementId) return;
    const sourceColumnId = findCardColumnId(state, placementId);
    if (sourceColumnId === null) return;

    this.pending = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      sourceCardElement: cardElement,
      placementId,
      sourceColumnId,
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
    this.updateDropTarget(active, event.clientX, event.clientY);
    this.autoScroll(event.clientX, event.clientY);
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
    if (!state) return;
    const sourceColumnCards = findColumnCards(state, pending.sourceColumnId);
    if (!sourceColumnCards) return;

    this.options.onDragStart?.();
    const rect = pending.sourceCardElement.getBoundingClientRect();
    const preview = pending.sourceCardElement.cloneNode(true) as HTMLElement;
    preview.classList.add('majom-boards__card-drag-preview');
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.top}px`;

    const placeholder = document.createElement('div');
    placeholder.className = 'majom-boards__card-drag-placeholder';
    placeholder.style.height = `${rect.height}px`;
    pending.sourceCardElement.classList.add('is-dragging');
    document.body.append(preview);

    this.active = {
      ...pending,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      preview,
      placeholder,
      sourceColumnCards,
      targetColumnId: null,
      target: null,
    };
    this.options.root.classList.add('is-card-dragging');
    this.movePreview(this.active, event.clientX, event.clientY);
    this.updateDropTarget(this.active, event.clientX, event.clientY);
  }

  private movePreview(active: ActiveDrag, clientX: number, clientY: number): void {
    active.preview.style.left = `${clientX - active.offsetX}px`;
    active.preview.style.top = `${clientY - active.offsetY}px`;
  }

  private updateDropTarget(
    active: ActiveDrag,
    clientX: number,
    clientY: number
  ): void {
    const state = this.options.getState();
    if (!state) return;
    const columnElement = this.findTargetColumn(clientX);
    if (!columnElement) return;
    const columnId = columnElement.dataset.boardColumnId;
    if (!columnId) return;
    const cards = findColumnCards(state, columnId);
    const container = columnElement.querySelector<HTMLElement>(
      '[data-board-cards-container="true"]'
    );
    if (!cards || !container) return;

    const insertionIndex = this.resolveInsertionIndex(
      columnElement,
      active.placementId,
      clientY
    );
    active.targetColumnId = columnId;
    active.target = resolveCardPlacementTarget({
      columnId,
      cards,
      movingPlacementId: active.placementId,
      insertionIndex,
    });
    if (!this.hasActiveTargetChanged(active)) {
      active.placeholder.remove();
      return;
    }
    this.placePlaceholder(container, active, insertionIndex);
  }

  private hasActiveTargetChanged(active: ActiveDrag): boolean {
    if (!active.target || active.targetColumnId === null) return false;
    const sameColumn = active.targetColumnId === active.sourceColumnId;
    return (
      !sameColumn ||
      hasCardPlacementTargetChanged(
        active.sourceColumnCards,
        active.placementId,
        active.target
      )
    );
  }

  private findTargetColumn(clientX: number): HTMLElement | null {
    const columns = Array.from(
      this.options.root.querySelectorAll<HTMLElement>('[data-board-column-id]')
    );
    if (columns.length === 0) return null;
    const containing = columns.find((column) => {
      const rect = column.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right;
    });
    if (containing) return containing;

    return columns.reduce<HTMLElement | null>((nearest, column) => {
      if (!nearest) return column;
      const columnRect = column.getBoundingClientRect();
      const nearestRect = nearest.getBoundingClientRect();
      const columnDistance = Math.abs(
        clientX - (columnRect.left + columnRect.width / 2)
      );
      const nearestDistance = Math.abs(
        clientX - (nearestRect.left + nearestRect.width / 2)
      );
      return columnDistance < nearestDistance ? column : nearest;
    }, null);
  }

  private resolveInsertionIndex(
    columnElement: HTMLElement,
    movingPlacementId: CardPlacement['id'],
    clientY: number
  ): number {
    const cardElements = Array.from(
      columnElement.querySelectorAll<HTMLElement>('[data-board-card-placement-id]')
    ).filter(
      (cardElement) =>
        cardElement.dataset.boardCardPlacementId !== movingPlacementId
    );
    const index = cardElements.findIndex((cardElement) => {
      const rect = cardElement.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });
    return index >= 0 ? index : cardElements.length;
  }

  private placePlaceholder(
    container: HTMLElement,
    active: ActiveDrag,
    insertionIndex: number
  ): void {
    const siblings = Array.from(
      container.querySelectorAll<HTMLElement>('[data-board-card-placement-id]')
    ).filter(
      (cardElement) =>
        cardElement.dataset.boardCardPlacementId !== active.placementId
    );
    const beforeElement = siblings[insertionIndex] ?? null;
    container.insertBefore(active.placeholder, beforeElement);
  }

  private autoScroll(clientX: number, clientY: number): void {
    const canvas = this.options.root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    );
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (clientX < rect.left + AUTO_SCROLL_EDGE_PX) {
        canvas.scrollLeft -= AUTO_SCROLL_STEP_PX;
      } else if (clientX > rect.right - AUTO_SCROLL_EDGE_PX) {
        canvas.scrollLeft += AUTO_SCROLL_STEP_PX;
      }
    }

    const active = this.active;
    if (!active?.targetColumnId) return;
    const column = Array.from(
      this.options.root.querySelectorAll<HTMLElement>('[data-board-column-id]')
    ).find(
      (candidate) => candidate.dataset.boardColumnId === active.targetColumnId
    );
    const cards = column?.querySelector<HTMLElement>(
      '[data-board-cards-container="true"]'
    );
    if (!cards) return;
    const rect = cards.getBoundingClientRect();
    if (clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
      cards.scrollTop -= AUTO_SCROLL_STEP_PX;
    } else if (clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
      cards.scrollTop += AUTO_SCROLL_STEP_PX;
    }
  }

  private finishActiveDrag(commit: boolean): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    active.preview.remove();
    active.placeholder.remove();
    active.sourceCardElement.classList.remove('is-dragging');
    this.options.root.classList.remove('is-card-dragging');
    this.suppressNextClick = true;

    if (!commit || !active.target || active.targetColumnId === null) return;
    if (this.hasActiveTargetChanged(active)) {
      this.options.onDrop(active.placementId, active.target);
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
