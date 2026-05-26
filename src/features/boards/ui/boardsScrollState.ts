type BoardsColumnScrollSnapshot = Record<string, number>;

export type BoardsScrollSnapshot = {
  canvasScrollLeft: number;
  columnScrollTops: BoardsColumnScrollSnapshot;
};

const BOARD_CANVAS_SELECTOR = '[data-board-canvas="true"]';
const BOARD_COLUMN_SELECTOR = '[data-board-column-id]';
const BOARD_CARDS_CONTAINER_SELECTOR = '[data-board-cards-container="true"]';

export function captureBoardsScroll(root: HTMLElement): BoardsScrollSnapshot {
  const canvas = root.querySelector<HTMLElement>(BOARD_CANVAS_SELECTOR);
  const columnScrollTops: BoardsColumnScrollSnapshot = {};

  root
    .querySelectorAll<HTMLElement>(BOARD_COLUMN_SELECTOR)
    .forEach((column) => {
      const columnId = column.dataset.boardColumnId;
      if (!columnId) return;
      const cardsContainer = column.querySelector<HTMLElement>(
        BOARD_CARDS_CONTAINER_SELECTOR
      );
      if (!cardsContainer) return;
      columnScrollTops[columnId] = cardsContainer.scrollTop;
    });

  return {
    canvasScrollLeft: canvas?.scrollLeft ?? 0,
    columnScrollTops,
  };
}

export function restoreBoardsScroll(
  root: HTMLElement,
  snapshot: BoardsScrollSnapshot
): void {
  const canvas = root.querySelector<HTMLElement>(BOARD_CANVAS_SELECTOR);
  if (canvas) {
    canvas.scrollLeft = snapshot.canvasScrollLeft;
  }

  root
    .querySelectorAll<HTMLElement>(BOARD_COLUMN_SELECTOR)
    .forEach((column) => {
      const columnId = column.dataset.boardColumnId;
      if (!columnId) return;
      const scrollTop = snapshot.columnScrollTops[columnId];
      if (scrollTop === undefined) return;
      const cardsContainer = column.querySelector<HTMLElement>(
        BOARD_CARDS_CONTAINER_SELECTOR
      );
      if (cardsContainer) {
        cardsContainer.scrollTop = scrollTop;
      }
    });
}

export class BoardsScrollCoordinator {
  constructor(private readonly root: HTMLElement) {}

  public capture(shouldPreserveScroll: boolean): BoardsScrollSnapshot | null {
    return shouldPreserveScroll ? captureBoardsScroll(this.root) : null;
  }

  public restore(snapshot: BoardsScrollSnapshot | null): void {
    if (!snapshot) return;
    restoreBoardsScroll(this.root, snapshot);
    requestAnimationFrame(() => restoreBoardsScroll(this.root, snapshot));
  }
}
