import {
  BOARDS_EXCHANGE_SCHEMA,
  BOARDS_EXCHANGE_VERSION,
  type BoardsExchangeEnvelope,
  type BoardsImportDiagnostic,
  type BoardsImportRequest,
  type BoardsParsedImport,
  type ExchangeBoardPayload,
  type ExchangeCardPayload,
  type ExchangeCheckItemPayload,
  type ExchangeChecklistPayload,
  type ExchangeColumnPayload,
} from './schema.ts';
import { parseBoardsMarkdown } from './markdownParser.ts';

type UnknownRecord = Record<string, unknown>;

const PAYLOAD_KEYS = {
  board: new Set(['id', 'title', 'columns']),
  column: new Set(['id', 'title', 'cards']),
  card: new Set(['id', 'title', 'description', 'checklists']),
  checklist: new Set(['id', 'title', 'items']),
  checkItem: new Set(['id', 'title', 'state']),
};

const CHECK_ITEM_STATES = new Set(['complete', 'incomplete']);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addDiagnostic(
  diagnostics: BoardsImportDiagnostic[],
  request: BoardsImportRequest,
  code: string,
  message: string,
  path?: string
): void {
  diagnostics.push({
    level:
      request.policies.unknownFieldPolicy === 'strict_error'
        ? 'error'
        : 'warning',
    code,
    message,
    ...(path ? { path } : {}),
  });
}

function warnMissingTitle(
  diagnostics: BoardsImportDiagnostic[],
  path: string,
  fallback: string
): string {
  diagnostics.push({
    level: 'warning',
    code: 'missing_title',
    message: `Missing title at ${path}; using "${fallback}".`,
    path,
  });
  return fallback;
}

function normalizeTitle(
  value: unknown,
  fallback: string,
  path: string,
  diagnostics: BoardsImportDiagnostic[]
): string {
  if (typeof value !== 'string')
    return warnMissingTitle(diagnostics, path, fallback);
  const trimmed = value.trim();
  if (!trimmed) {
    diagnostics.push({
      level: 'warning',
      code: 'empty_title',
      message: `Empty title at ${path}; using "${fallback}".`,
      path,
    });
    return fallback;
  }
  return trimmed;
}

function collectUnknownPayloadFields(
  value: UnknownRecord,
  allowedKeys: Set<string>,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): void {
  for (const key of Object.keys(value)) {
    if (allowedKeys.has(key)) continue;
    addDiagnostic(
      diagnostics,
      request,
      'unknown_payload_field',
      `Unknown payload field "${key}" will be ignored.`,
      `${path}.${key}`
    );
  }
}

function normalizeCardPayload(
  value: unknown,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): ExchangeCardPayload {
  if (!isRecord(value)) {
    diagnostics.push({
      level: 'error',
      code: 'invalid_card_payload',
      message: `Card payload at ${path} must be an object.`,
      path,
    });
    return { title: 'Untitled card' };
  }

  collectUnknownPayloadFields(
    value,
    PAYLOAD_KEYS.card,
    path,
    request,
    diagnostics
  );
  const rawChecklists = Array.isArray(value.checklists) ? value.checklists : [];
  if (value.checklists !== undefined && !Array.isArray(value.checklists)) {
    diagnostics.push({
      level: 'warning',
      code: 'invalid_checklists_field',
      message: `Checklists at ${path}.checklists must be an array and were ignored.`,
      path: `${path}.checklists`,
    });
  }

  const checklists = rawChecklists.map((checklist, index) =>
    normalizeChecklistPayload(
      checklist,
      `${path}.checklists[${index}]`,
      request,
      diagnostics
    )
  );

  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    title: normalizeTitle(
      value.title,
      'Untitled card',
      `${path}.title`,
      diagnostics
    ),
    ...(typeof value.description === 'string'
      ? { description: value.description }
      : {}),
    ...(checklists.length > 0 ? { checklists } : {}),
  };
}

function normalizeChecklistPayload(
  value: unknown,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): ExchangeChecklistPayload {
  if (!isRecord(value)) {
    diagnostics.push({
      level: 'error',
      code: 'invalid_checklist_payload',
      message: `Checklist payload at ${path} must be an object.`,
      path,
    });
    return { title: 'Checklist', items: [] };
  }

  collectUnknownPayloadFields(
    value,
    PAYLOAD_KEYS.checklist,
    path,
    request,
    diagnostics
  );
  const rawItems = Array.isArray(value.items) ? value.items : [];
  if (value.items !== undefined && !Array.isArray(value.items)) {
    diagnostics.push({
      level: 'warning',
      code: 'invalid_check_items_field',
      message: `Checklist items at ${path}.items must be an array and were ignored.`,
      path: `${path}.items`,
    });
  }

  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    title: normalizeTitle(
      value.title,
      'Checklist',
      `${path}.title`,
      diagnostics
    ),
    items: rawItems.map((item, index) =>
      normalizeCheckItemPayload(
        item,
        `${path}.items[${index}]`,
        request,
        diagnostics
      )
    ),
  };
}

function normalizeCheckItemPayload(
  value: unknown,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): ExchangeCheckItemPayload {
  if (!isRecord(value)) {
    diagnostics.push({
      level: 'error',
      code: 'invalid_check_item_payload',
      message: `Checklist item payload at ${path} must be an object.`,
      path,
    });
    return { title: 'Untitled item', state: 'incomplete' };
  }

  collectUnknownPayloadFields(
    value,
    PAYLOAD_KEYS.checkItem,
    path,
    request,
    diagnostics
  );
  const state =
    typeof value.state === 'string' && CHECK_ITEM_STATES.has(value.state)
      ? value.state
      : 'incomplete';
  if (value.state !== undefined && state !== value.state) {
    diagnostics.push({
      level: 'warning',
      code: 'invalid_check_item_state',
      message: `Checklist item state at ${path}.state must be "complete" or "incomplete"; using "incomplete".`,
      path: `${path}.state`,
    });
  }

  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    title: normalizeTitle(
      value.title,
      'Untitled item',
      `${path}.title`,
      diagnostics
    ),
    state,
  };
}

function normalizeColumnPayload(
  value: unknown,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): ExchangeColumnPayload {
  if (!isRecord(value)) {
    diagnostics.push({
      level: 'error',
      code: 'invalid_column_payload',
      message: `Column payload at ${path} must be an object.`,
      path,
    });
    return { title: 'Untitled column', cards: [] };
  }

  collectUnknownPayloadFields(
    value,
    PAYLOAD_KEYS.column,
    path,
    request,
    diagnostics
  );
  const rawCards = Array.isArray(value.cards) ? value.cards : [];
  if (value.cards !== undefined && !Array.isArray(value.cards)) {
    diagnostics.push({
      level: 'warning',
      code: 'invalid_cards_field',
      message: `Cards at ${path}.cards must be an array and were ignored.`,
      path: `${path}.cards`,
    });
  }
  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    title: normalizeTitle(
      value.title,
      'Untitled column',
      `${path}.title`,
      diagnostics
    ),
    cards: rawCards.map((card, index) =>
      normalizeCardPayload(
        card,
        `${path}.cards[${index}]`,
        request,
        diagnostics
      )
    ),
  };
}

function normalizeBoardPayload(
  value: unknown,
  path: string,
  request: BoardsImportRequest,
  diagnostics: BoardsImportDiagnostic[]
): ExchangeBoardPayload {
  if (!isRecord(value)) {
    diagnostics.push({
      level: 'error',
      code: 'invalid_board_payload',
      message: `Board payload at ${path} must be an object.`,
      path,
    });
    return { title: 'Untitled board', columns: [] };
  }

  collectUnknownPayloadFields(
    value,
    PAYLOAD_KEYS.board,
    path,
    request,
    diagnostics
  );
  const rawColumns = Array.isArray(value.columns) ? value.columns : [];
  if (value.columns !== undefined && !Array.isArray(value.columns)) {
    diagnostics.push({
      level: 'warning',
      code: 'invalid_columns_field',
      message: `Columns at ${path}.columns must be an array and were ignored.`,
      path: `${path}.columns`,
    });
  }
  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    title: normalizeTitle(
      value.title,
      'Untitled board',
      `${path}.title`,
      diagnostics
    ),
    columns: rawColumns.map((column, index) =>
      normalizeColumnPayload(
        column,
        `${path}.columns[${index}]`,
        request,
        diagnostics
      )
    ),
  };
}

function createEnvelope(
  request: BoardsImportRequest,
  payload: ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
): BoardsExchangeEnvelope<
  ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
> {
  return {
    schema: BOARDS_EXCHANGE_SCHEMA,
    version: BOARDS_EXCHANGE_VERSION,
    format: request.format,
    scope: request.scope,
    exportedAt: new Date().toISOString(),
    payload,
  };
}

function parseJsonImport(request: BoardsImportRequest): BoardsParsedImport {
  const diagnostics: BoardsImportDiagnostic[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(request.raw);
  } catch {
    return {
      envelope: null,
      diagnostics: [
        {
          level: 'error',
          code: 'invalid_json',
          message: 'Import source is not valid JSON.',
          path: 'source',
        },
      ],
    };
  }

  if (!isRecord(parsed)) {
    return {
      envelope: null,
      diagnostics: [
        {
          level: 'error',
          code: 'invalid_json_root',
          message: 'JSON import root must be an object.',
          path: 'source',
        },
      ],
    };
  }

  const payloadRoot = 'payload' in parsed ? parsed.payload : parsed;
  if (!('payload' in parsed)) {
    diagnostics.push({
      level: 'warning',
      code: 'missing_envelope',
      message:
        'JSON import has no exchange envelope; treating root as payload.',
      path: 'source',
    });
  }
  if (parsed.schema !== undefined && parsed.schema !== BOARDS_EXCHANGE_SCHEMA) {
    diagnostics.push({
      level: 'error',
      code: 'schema_mismatch',
      message: 'JSON import schema is not supported.',
      path: 'schema',
    });
  }
  if (
    parsed.version !== undefined &&
    parsed.version !== BOARDS_EXCHANGE_VERSION
  ) {
    diagnostics.push({
      level: 'error',
      code: 'version_mismatch',
      message: 'JSON import version is not supported.',
      path: 'version',
    });
  }
  if (parsed.scope !== undefined && parsed.scope !== request.scope) {
    diagnostics.push({
      level: 'error',
      code: 'scope_mismatch',
      message: `JSON import scope "${String(parsed.scope)}" does not match "${request.scope}".`,
      path: 'scope',
    });
  }

  const payload =
    request.scope === 'board'
      ? normalizeBoardPayload(payloadRoot, 'payload', request, diagnostics)
      : request.scope === 'column'
        ? normalizeColumnPayload(payloadRoot, 'payload', request, diagnostics)
        : normalizeCardPayload(payloadRoot, 'payload', request, diagnostics);

  return {
    envelope: createEnvelope(request, payload),
    diagnostics,
  };
}

export function parseBoardsImport(
  request: BoardsImportRequest
): BoardsParsedImport {
  if (request.format === 'markdown') {
    const parsed = parseBoardsMarkdown(request.raw, request.scope);
    if (request.policies.unknownFieldPolicy !== 'strict_error') return parsed;
    return {
      ...parsed,
      diagnostics: parsed.diagnostics.map((diagnostic) =>
        diagnostic.code.startsWith('unknown_')
          ? { ...diagnostic, level: 'error' }
          : diagnostic
      ),
    };
  }
  return parseJsonImport(request);
}
