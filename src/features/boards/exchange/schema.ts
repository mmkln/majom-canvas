import type {
  Board,
  BoardColumn,
  Card,
  CardCheckItem,
  CardChecklist,
} from '../../../majom-wrapper/interfaces/index.ts';

export type BoardsExchangeScope = 'board' | 'column' | 'card';
export type BoardsExchangeFormat = 'json' | 'markdown';

export const BOARDS_EXCHANGE_SCHEMA = 'majom.boards.exchange' as const;
export const BOARDS_EXCHANGE_VERSION = '1.0' as const;

export type BoardsExchangeEnvelope<TPayload> = {
  schema: typeof BOARDS_EXCHANGE_SCHEMA;
  version: typeof BOARDS_EXCHANGE_VERSION;
  format: BoardsExchangeFormat;
  scope: BoardsExchangeScope;
  exportedAt: string;
  payload: TPayload;
};

export type ExchangeCheckItemPayload = {
  id?: CardCheckItem['id'];
  title: string;
  state?: CardCheckItem['state'];
};

export type ExchangeChecklistPayload = {
  id?: CardChecklist['id'];
  title: string;
  items: ExchangeCheckItemPayload[];
};

export type ExchangeCardPayload = {
  id?: Card['id'];
  title: string;
  description?: string;
  checklists?: ExchangeChecklistPayload[];
};

export type ExchangeColumnPayload = {
  id?: BoardColumn['id'];
  title: string;
  cards: ExchangeCardPayload[];
};

export type ExchangeBoardPayload = {
  id?: Board['id'];
  title: string;
  columns: ExchangeColumnPayload[];
};

export type BoardsExchangePayload =
  | ExchangeBoardPayload
  | ExchangeColumnPayload
  | ExchangeCardPayload;

export type BoardsImportDiagnosticLevel = 'warning' | 'error';

export type BoardsImportDiagnostic = {
  level: BoardsImportDiagnosticLevel;
  code: string;
  message: string;
  path?: string;
};

export type BoardsParsedImport = {
  envelope: BoardsExchangeEnvelope<
    ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
  > | null;
  diagnostics: BoardsImportDiagnostic[];
};

export type BoardsImportMode = 'create' | 'merge' | 'replace';

export type BoardsImportMissingFieldPolicy =
  | 'keep_existing'
  | 'use_defaults'
  | 'clear_on_replace';

export type BoardsImportMatchStrategy = 'id' | 'external_ref' | 'title';

export type BoardsImportUnknownFieldPolicy = 'warn_and_ignore' | 'strict_error';

export type BoardsImportPolicies = {
  mode: BoardsImportMode;
  missingFieldPolicy: BoardsImportMissingFieldPolicy;
  matchStrategy: BoardsImportMatchStrategy;
  unknownFieldPolicy: BoardsImportUnknownFieldPolicy;
};

export type BoardsImportTarget = {
  boardId?: Board['id'];
  columnId?: BoardColumn['id'];
  cardId?: Card['id'];
};

export type BoardsImportRequest = {
  raw: string;
  format: BoardsExchangeFormat;
  scope: BoardsExchangeScope;
  target?: BoardsImportTarget;
  policies: BoardsImportPolicies;
};

export type BoardsImportApplyResult = {
  scope: BoardsExchangeScope;
  created: {
    boardId?: Board['id'];
    columnIds: BoardColumn['id'][];
    cardIds: Card['id'][];
    checklistIds: CardChecklist['id'][];
    checkItemIds: CardCheckItem['id'][];
  };
};

export type BoardsExportSource = {
  board?: Board;
  column?: BoardColumn;
  card?: Card;
};

export type BoardsExportRequest = {
  format: BoardsExchangeFormat;
  scope: BoardsExchangeScope;
  boardId?: Board['id'];
  columnId?: BoardColumn['id'];
  cardId?: Card['id'];
};

export type BoardsExportResult = {
  format: BoardsExchangeFormat;
  scope: BoardsExchangeScope;
  fileName: string;
  content: string;
};

export type BoardsImportPlanCounts = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};

export type BoardsImportPlanItemAction =
  | 'create'
  | 'update'
  | 'skip'
  | 'conflict';

export type BoardsImportPlanItem = {
  action: BoardsImportPlanItemAction;
  entity: 'board' | 'column' | 'card' | 'checklist' | 'checkItem';
  title: string;
  path: string;
  reason?: string;
  targetId?: string;
  source?: {
    id?: string;
    explicitFields: string[];
  };
};

export type BoardsImportPlan = {
  scope: BoardsExchangeScope;
  canApply: boolean;
  counts: BoardsImportPlanCounts;
  items: BoardsImportPlanItem[];
  diagnostics: BoardsImportDiagnostic[];
  warnings: string[];
  errors: string[];
};

export function createDefaultBoardsImportPolicies(): BoardsImportPolicies {
  return {
    mode: 'merge',
    missingFieldPolicy: 'keep_existing',
    matchStrategy: 'title',
    unknownFieldPolicy: 'warn_and_ignore',
  };
}
