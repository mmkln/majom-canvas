import type {
  Board,
  CardPlacement,
  BoardColumn,
} from '../../../majom-wrapper/interfaces/index.ts';
import type {
  BoardCardPlacementPatch,
  BoardColumnPatch,
} from '../domain/types.ts';

export type BoardSurfaceState = {
  selectedBoardId: Board['id'] | null;
  expandedCardComposerColumnId: BoardColumn['id'] | null;
  cardComposerDrafts: ReadonlyMap<BoardColumn['id'], string>;
  isColumnComposerExpanded: boolean;
  columnComposerDraft: string;
  editingBoardTitleId: Board['id'] | null;
  boardTitleDraft: string;
  editingColumnTitleId: BoardColumn['id'] | null;
  columnTitleDraft: string;
  quickEditor: BoardSurfaceQuickEditorState | null;
};

export type BoardSurfaceRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type BoardSurfaceQuickEditorState = {
  placementId: string;
  anchorRect: BoardSurfaceRect;
  titleDraft: string;
};

export type BoardSurfaceRenderTransition = {
  selectedBoardChanged: boolean;
  shouldPreserveScroll: boolean;
};

export type BoardSurfaceDragKind = 'card' | 'column';

export type BoardSurfaceCardDropIntent = {
  placementId: CardPlacement['id'];
  target: BoardCardPlacementPatch;
};

export type BoardSurfaceColumnDropIntent = {
  columnId: BoardColumn['id'];
  target: BoardColumnPatch;
};

export class BoardSurfaceController {
  private selectedBoardId: Board['id'] | null = null;
  private expandedCardComposerColumnId: BoardColumn['id'] | null = null;
  private readonly cardComposerDrafts = new Map<BoardColumn['id'], string>();
  private isColumnComposerExpanded = false;
  private columnComposerDraft = '';
  private editingBoardTitleId: Board['id'] | null = null;
  private boardTitleDraft = '';
  private editingColumnTitleId: BoardColumn['id'] | null = null;
  private columnTitleDraft = '';
  private quickEditor: BoardSurfaceQuickEditorState | null = null;
  private activeDragKind: BoardSurfaceDragKind | null = null;

  public get snapshot(): BoardSurfaceState {
    return {
      selectedBoardId: this.selectedBoardId,
      expandedCardComposerColumnId: this.expandedCardComposerColumnId,
      cardComposerDrafts: new Map(this.cardComposerDrafts),
      isColumnComposerExpanded: this.isColumnComposerExpanded,
      columnComposerDraft: this.columnComposerDraft,
      editingBoardTitleId: this.editingBoardTitleId,
      boardTitleDraft: this.boardTitleDraft,
      editingColumnTitleId: this.editingColumnTitleId,
      columnTitleDraft: this.columnTitleDraft,
      quickEditor: this.quickEditor
        ? {
            ...this.quickEditor,
            anchorRect: { ...this.quickEditor.anchorRect },
          }
        : null,
    };
  }

  public syncSelectedBoard(boardId: Board['id'] | null): void {
    if (this.selectedBoardId === boardId) return;
    this.selectedBoardId = boardId;
    this.clearSurfaceSession();
  }

  public beginRender(
    boardId: Board['id'] | null
  ): BoardSurfaceRenderTransition {
    const hadSelectedBoard = this.selectedBoardId !== null;
    const selectedBoardChanged =
      hadSelectedBoard && this.selectedBoardId !== boardId;
    const shouldPreserveScroll = this.selectedBoardId === boardId;
    this.syncSelectedBoard(boardId);
    return {
      selectedBoardChanged,
      shouldPreserveScroll,
    };
  }

  public beginCardComposer(columnId: BoardColumn['id']): void {
    this.expandedCardComposerColumnId = columnId;
    if (!this.cardComposerDrafts.has(columnId)) {
      this.cardComposerDrafts.set(columnId, '');
    }
  }

  public cancelCardComposer(): void {
    if (this.expandedCardComposerColumnId) {
      this.cardComposerDrafts.delete(this.expandedCardComposerColumnId);
    }
    this.expandedCardComposerColumnId = null;
  }

  public setCardComposerDraft(
    columnId: BoardColumn['id'],
    value: string
  ): void {
    this.cardComposerDrafts.set(columnId, value);
  }

  public getCardComposerDraft(columnId: BoardColumn['id']): string {
    return this.cardComposerDrafts.get(columnId) ?? '';
  }

  public submitCardComposer(columnId: BoardColumn['id']): string | null {
    const title = this.getCardComposerDraft(columnId).trim();
    if (!title) return null;
    this.cardComposerDrafts.delete(columnId);
    if (this.expandedCardComposerColumnId === columnId) {
      this.expandedCardComposerColumnId = null;
    }
    return title;
  }

  public beginColumnComposer(): void {
    this.isColumnComposerExpanded = true;
  }

  public cancelColumnComposer(): void {
    this.isColumnComposerExpanded = false;
    this.columnComposerDraft = '';
  }

  public setColumnComposerDraft(value: string): void {
    this.columnComposerDraft = value;
  }

  public submitColumnComposer(): string | null {
    const title = this.columnComposerDraft.trim();
    if (!title) return null;
    this.isColumnComposerExpanded = false;
    this.columnComposerDraft = '';
    return title;
  }

  public beginBoardTitleEdit(board: Board): void {
    this.editingBoardTitleId = board.id;
    this.boardTitleDraft = board.title;
  }

  public setBoardTitleDraft(value: string): void {
    this.boardTitleDraft = value;
  }

  public finishBoardTitleEdit(board: Board, apply: boolean): string | null {
    if (this.editingBoardTitleId !== board.id) return null;
    const nextTitle = this.boardTitleDraft.trim();
    this.editingBoardTitleId = null;
    this.boardTitleDraft = '';
    if (!apply || nextTitle.length === 0 || nextTitle === board.title) {
      return null;
    }
    return nextTitle;
  }

  public beginColumnTitleEdit(column: BoardColumn): void {
    this.editingColumnTitleId = column.id;
    this.columnTitleDraft = column.title;
  }

  public setColumnTitleDraft(value: string): void {
    this.columnTitleDraft = value;
  }

  public finishColumnTitleEdit(
    column: BoardColumn,
    apply: boolean
  ): string | null {
    if (this.editingColumnTitleId !== column.id) return null;
    const nextTitle = this.columnTitleDraft.trim();
    this.editingColumnTitleId = null;
    this.columnTitleDraft = '';
    if (!apply || nextTitle.length === 0 || nextTitle === column.title) {
      return null;
    }
    return nextTitle;
  }

  public openQuickEditor(
    placementId: string,
    anchorRect: BoardSurfaceRect,
    title: string
  ): void {
    this.quickEditor = {
      placementId,
      anchorRect,
      titleDraft: title,
    };
  }

  public setQuickEditorTitleDraft(placementId: string, value: string): void {
    if (this.quickEditor?.placementId !== placementId) return;
    this.quickEditor.titleDraft = value;
  }

  public submitQuickEditor(placementId: string): string | null {
    if (this.quickEditor?.placementId !== placementId) return null;
    const title = this.quickEditor.titleDraft.trim();
    if (!title) return null;
    this.quickEditor = null;
    return title;
  }

  public closeQuickEditor(): void {
    this.quickEditor = null;
  }

  public beginDrag(kind: BoardSurfaceDragKind): void {
    this.activeDragKind = kind;
    this.closeQuickEditor();
  }

  public createCardDropIntent(
    placementId: CardPlacement['id'],
    target: BoardCardPlacementPatch
  ): BoardSurfaceCardDropIntent {
    this.activeDragKind = null;
    return { placementId, target };
  }

  public createColumnDropIntent(
    columnId: BoardColumn['id'],
    target: BoardColumnPatch
  ): BoardSurfaceColumnDropIntent {
    this.activeDragKind = null;
    return { columnId, target };
  }

  public cancelDrag(): void {
    this.activeDragKind = null;
  }

  public reset(): void {
    this.selectedBoardId = null;
    this.clearSurfaceSession();
  }

  private clearSurfaceSession(): void {
    this.expandedCardComposerColumnId = null;
    this.cardComposerDrafts.clear();
    this.isColumnComposerExpanded = false;
    this.columnComposerDraft = '';
    this.editingBoardTitleId = null;
    this.boardTitleDraft = '';
    this.editingColumnTitleId = null;
    this.columnTitleDraft = '';
    this.quickEditor = null;
    this.activeDragKind = null;
  }
}
