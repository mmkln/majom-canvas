import type {
  Board,
  BoardMeta,
  BoardColumn,
  Card,
  CardCheckItem,
  CardChecklist,
  CardEntityLink,
  CardEntityLinkType,
  CardPlacement,
  Tag,
} from '../../../majom-wrapper/interfaces/index.ts';

import type {
  BoardsExportRequest,
  BoardsExportResult,
  BoardsImportApplyResult,
  BoardsImportPlan,
  BoardsImportRequest,
} from '../exchange/schema.ts';

export type BoardsRequestStatus = 'idle' | 'loading' | 'saving' | 'error';
export type BoardsIntentResult<T> = T | Promise<T>;
export type BoardsCommandError = {
  code: string;
  messageKey: string;
  recoverable: boolean;
};
export type BoardsCommandResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: BoardsCommandError };
export type BoardsCommandKind =
  | 'create-board'
  | 'patch-board'
  | 'delete-board'
  | 'create-column'
  | 'patch-column'
  | 'delete-column'
  | 'create-card'
  | 'patch-card'
  | 'patch-card-placement'
  | 'delete-card-placement'
  | 'delete-card'
  | 'create-card-mirror';
export type BoardsCommandStatus = 'running' | 'confirmed' | 'rejected';
export type BoardsCommandRecord = {
  id: string;
  kind: BoardsCommandKind;
  status: BoardsCommandStatus;
  optimisticMutationId?: string;
  error?: BoardsCommandError;
};
export type BoardsOptimisticEntityState = 'creating' | 'saving' | 'deleting';

export type BoardsOptimisticState = {
  cards: Record<Card['id'], BoardsOptimisticEntityState>;
  placements: Record<CardPlacement['id'], BoardsOptimisticEntityState>;
  columns: Record<BoardColumn['id'], BoardsOptimisticEntityState>;
  resolved: {
    cards: Record<Card['id'], Card['id']>;
    placements: Record<CardPlacement['id'], CardPlacement['id']>;
    columns: Record<BoardColumn['id'], BoardColumn['id']>;
  };
};

export type BoardCardPatch = {
  title?: string;
  description?: string;
  completedAt?: Card['completedAt'];
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
  before_column?: BoardColumn['id'] | null;
  after_column?: BoardColumn['id'] | null;
  position?: 'start' | 'end';
};

export type BoardsState = {
  boards: Board[];
  selectedBoardId: Board['id'] | null;
  status: BoardsRequestStatus;
  error: string | null;
  optimistic: BoardsOptimisticState;
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

export type BoardEntityLinkSearchItem = {
  id: string;
  title: string;
  status?: string | null;
};

export type BoardEntityCatalogPort = {
  searchTasks: (query: string) => Promise<BoardEntityLinkSearchItem[]>;
  searchStories: (query: string) => Promise<BoardEntityLinkSearchItem[]>;
  searchGoals: (query: string) => Promise<BoardEntityLinkSearchItem[]>;
};

export type BoardsIntentHandlers = {
  onRefresh: () => void;
  onSelectBoard: (boardId: Board['id']) => void;
  onCreateBoard: (title: string) => BoardsIntentResult<BoardsCommandResult>;
  onPatchBoard: (
    boardId: Board['id'],
    patch: { title?: string; meta?: BoardMeta }
  ) => BoardsIntentResult<BoardsCommandResult>;
  onToggleBoardStar: (boardId: Board['id']) => void;
  onUpdateBoardGroup: (
    boardId: Board['id'],
    group: { id: string; name: string } | null
  ) => void;
  onDeleteBoard: (
    boardId: Board['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onCreateColumn: (
    boardId: Board['id'],
    title: string
  ) => BoardsIntentResult<BoardsCommandResult>;
  onPatchColumn: (
    columnId: BoardColumn['id'],
    patch: BoardColumnPatch
  ) => BoardsIntentResult<BoardsCommandResult>;
  onDeleteColumn: (
    columnId: BoardColumn['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onCreateCard: (
    columnId: BoardColumn['id'],
    title: string,
    description: string
  ) => BoardsIntentResult<BoardsCommandResult>;
  onPatchCard: (
    cardId: Card['id'],
    patch: BoardCardPatch
  ) => BoardsIntentResult<BoardsCommandResult>;
  onLoadCardChecklists: (
    cardId: Card['id']
  ) => BoardsIntentResult<CardChecklist[]>;
  onCreateCardChecklist: (
    cardId: Card['id'],
    title: string
  ) => BoardsIntentResult<BoardsCommandResult<CardChecklist | null>>;
  onDeleteCardChecklist: (
    checklistId: CardChecklist['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onCreateCardCheckItem: (
    checklistId: CardChecklist['id'],
    title: string
  ) => BoardsIntentResult<BoardsCommandResult<CardCheckItem | null>>;
  onPatchCardCheckItem: (
    itemId: CardCheckItem['id'],
    patch: { title?: string; state?: CardCheckItem['state'] }
  ) => BoardsIntentResult<BoardsCommandResult<CardCheckItem | null>>;
  onDeleteCardCheckItem: (
    itemId: CardCheckItem['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onCreateCardEntityLink: (
    cardId: Card['id'],
    entityType: CardEntityLinkType,
    entityId: string
  ) => BoardsIntentResult<BoardsCommandResult<CardEntityLink | null>>;
  onCreateCardEntityFromCard: (
    card: Card,
    entityType: CardEntityLinkType
  ) => BoardsIntentResult<BoardsCommandResult<CardEntityLink | null>>;
  onDeleteCardEntityLink: (
    linkId: CardEntityLink['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onDeleteLinkedEntity: (
    card: Card,
    link: CardEntityLink
  ) => BoardsIntentResult<BoardsCommandResult>;
  onCreateCardMirror: (
    cardId: Card['id'],
    columnId: BoardColumn['id'],
    target: BoardCardPlacementTarget
  ) => BoardsIntentResult<BoardsCommandResult>;
  onPatchCardPlacement: (
    placementId: CardPlacement['id'],
    patch: BoardCardPlacementPatch
  ) => BoardsIntentResult<BoardsCommandResult>;
  onDeleteCardPlacement: (
    placementId: CardPlacement['id']
  ) => BoardsIntentResult<BoardsCommandResult>;
  onDeleteCard: (cardId: Card['id']) => BoardsIntentResult<BoardsCommandResult>;
  onPreviewImport: (
    request: BoardsImportRequest
  ) => BoardsIntentResult<BoardsImportPlan>;
  onExportData: (
    request: BoardsExportRequest
  ) => BoardsIntentResult<BoardsExportResult | null>;
  onApplyImport: (
    request: BoardsImportRequest
  ) => BoardsIntentResult<BoardsCommandResult<BoardsImportApplyResult | null>>;
};
