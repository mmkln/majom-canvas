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
  onCreateBoard: (title: string) => void;
  onPatchBoard: (
    boardId: Board['id'],
    patch: { title?: string; meta?: BoardMeta }
  ) => void;
  onToggleBoardStar: (boardId: Board['id']) => void;
  onUpdateBoardGroup: (
    boardId: Board['id'],
    group: { id: string; name: string } | null
  ) => void;
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
  onLoadCardChecklists: (
    cardId: Card['id']
  ) => BoardsIntentResult<CardChecklist[]>;
  onCreateCardChecklist: (
    cardId: Card['id'],
    title: string
  ) => BoardsIntentResult<CardChecklist | null>;
  onDeleteCardChecklist: (
    checklistId: CardChecklist['id']
  ) => BoardsIntentResult<void>;
  onCreateCardCheckItem: (
    checklistId: CardChecklist['id'],
    title: string
  ) => BoardsIntentResult<CardCheckItem | null>;
  onPatchCardCheckItem: (
    itemId: CardCheckItem['id'],
    patch: { title?: string; state?: CardCheckItem['state'] }
  ) => BoardsIntentResult<CardCheckItem | null>;
  onDeleteCardCheckItem: (
    itemId: CardCheckItem['id']
  ) => BoardsIntentResult<void>;
  onCreateCardEntityLink: (
    cardId: Card['id'],
    entityType: CardEntityLinkType,
    entityId: string
  ) => BoardsIntentResult<CardEntityLink | null>;
  onCreateCardEntityFromCard: (
    card: Card,
    entityType: CardEntityLinkType
  ) => BoardsIntentResult<CardEntityLink | null>;
  onDeleteCardEntityLink: (
    linkId: CardEntityLink['id']
  ) => BoardsIntentResult<void>;
  onDeleteLinkedEntity: (
    card: Card,
    link: CardEntityLink
  ) => BoardsIntentResult<void>;
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
  onPreviewImport: (
    request: BoardsImportRequest
  ) => BoardsIntentResult<BoardsImportPlan>;
  onExportData: (
    request: BoardsExportRequest
  ) => BoardsIntentResult<BoardsExportResult | null>;
  onApplyImport: (
    request: BoardsImportRequest
  ) => BoardsIntentResult<BoardsImportApplyResult | null>;
};
