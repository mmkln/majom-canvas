import type {
  Board,
  BoardColumn,
  Card,
  CardPlacement,
  Tag,
} from '../../../majom-wrapper/interfaces/index.ts';

export type BoardsRequestStatus = 'idle' | 'loading' | 'saving' | 'error';

export type BoardCardPatch = {
  title?: string;
  description?: string;
  tag_ids?: number[];
};

export type BoardCardPlacementPatch = {
  column?: BoardColumn['id'];
  before_placement?: CardPlacement['id'] | null;
  after_placement?: CardPlacement['id'] | null;
  position?: 'top' | 'bottom';
  archived?: boolean;
};

export type BoardCardPlacementTarget = Pick<
  BoardCardPlacementPatch,
  'before_placement' | 'after_placement' | 'position'
>;

export type BoardColumnPatch = {
  title?: string;
  order?: number;
};

export type BoardsState = {
  boards: Board[];
  selectedBoardId: Board['id'] | null;
  status: BoardsRequestStatus;
  error: string | null;
};

export type BoardTagCatalogPort = {
  loadTags: () => Promise<Tag[]>;
  createTag: (title: string, color?: string) => Promise<Tag>;
  updateTag: (
    id: number,
    patch: { title?: string; color?: string }
  ) => Promise<Tag>;
  deleteTag: (id: number) => Promise<void>;
};

export type BoardsIntentHandlers = {
  onRefresh: () => void;
  onSelectBoard: (boardId: Board['id']) => void;
  onCreateBoard: (title: string) => void;
  onPatchBoard: (boardId: Board['id'], patch: { title?: string }) => void;
  onDeleteBoard: (boardId: Board['id']) => void;
  onCreateColumn: (boardId: Board['id'], title: string) => void;
  onPatchColumn: (columnId: BoardColumn['id'], patch: BoardColumnPatch) => void;
  onDeleteColumn: (columnId: BoardColumn['id']) => void;
  onCreateCard: (
    columnId: BoardColumn['id'],
    title: string,
    description: string
  ) => void;
  onPatchCard: (cardId: Card['id'], patch: BoardCardPatch) => void;
  onCreateCardMirror: (
    cardId: Card['id'],
    columnId: BoardColumn['id'],
    target: BoardCardPlacementTarget
  ) => void;
  onPatchCardPlacement: (
    placementId: CardPlacement['id'],
    patch: BoardCardPlacementPatch
  ) => void;
  onDeleteCardPlacement: (placementId: CardPlacement['id']) => void;
  onDeleteCard: (cardId: Card['id']) => void;
};
