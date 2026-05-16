import type {
  Board,
  BoardColumn,
  Card,
  CardChecklist,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  BOARDS_EXCHANGE_SCHEMA,
  BOARDS_EXCHANGE_VERSION,
  type BoardsExchangeEnvelope,
  type BoardsExchangeFormat,
  type BoardsExchangeScope,
  type ExchangeBoardPayload,
  type ExchangeCardPayload,
  type ExchangeColumnPayload,
} from './schema.ts';

type CardWithLoadedChecklists = Card & {
  checklists?: CardChecklist[];
};

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : undefined;
}

export function createExchangeCardPayload(card: Card): ExchangeCardPayload {
  const loadedChecklists = (card as CardWithLoadedChecklists).checklists ?? [];
  return {
    id: card.id,
    title: card.title.trim() || 'Untitled card',
    ...(normalizeText(card.description)
      ? { description: normalizeText(card.description) }
      : {}),
    ...(loadedChecklists.length > 0
      ? {
          checklists: loadedChecklists.map((checklist) => ({
            id: checklist.id,
            title: checklist.title.trim() || 'Checklist',
            items: (checklist.items ?? []).map((item) => ({
              id: item.id,
              title: item.title.trim() || 'Untitled item',
              state: item.state,
            })),
          })),
        }
      : {}),
  };
}

export function createExchangeColumnPayload(
  column: BoardColumn
): ExchangeColumnPayload {
  return {
    id: column.id,
    title: column.title.trim() || 'Untitled column',
    cards: (column.cards ?? []).map(createExchangeCardPayload),
  };
}

export function createExchangeBoardPayload(board: Board): ExchangeBoardPayload {
  return {
    id: board.id,
    title: board.title.trim() || 'Untitled board',
    columns: (board.columns ?? []).map(createExchangeColumnPayload),
  };
}

export function createBoardsExchangeEnvelope(
  format: BoardsExchangeFormat,
  scope: BoardsExchangeScope,
  payload: ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload,
  exportedAt = new Date().toISOString()
): BoardsExchangeEnvelope<
  ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
> {
  return {
    schema: BOARDS_EXCHANGE_SCHEMA,
    version: BOARDS_EXCHANGE_VERSION,
    format,
    scope,
    exportedAt,
    payload,
  };
}
