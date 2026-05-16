import type {
  Board,
  BoardColumn,
  Card,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  type BoardsExchangeFormat,
  type BoardsExchangeScope,
  type BoardsExportResult,
} from './schema.ts';
import {
  createBoardsExchangeEnvelope,
  createExchangeBoardPayload,
  createExchangeCardPayload,
  createExchangeColumnPayload,
} from './exportPayload.ts';
import { serializeBoardsJson } from './jsonSerializer.ts';
import { serializeBoardsMarkdown } from './markdownSerializer.ts';

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

function serialize(
  format: BoardsExchangeFormat,
  scope: BoardsExchangeScope,
  payload:
    | ReturnType<typeof createExchangeBoardPayload>
    | ReturnType<typeof createExchangeColumnPayload>
    | ReturnType<typeof createExchangeCardPayload>
): string {
  const envelope = createBoardsExchangeEnvelope(format, scope, payload);
  return format === 'json'
    ? serializeBoardsJson(envelope)
    : serializeBoardsMarkdown(envelope);
}

export function exportBoard(
  board: Board,
  format: BoardsExchangeFormat
): BoardsExportResult {
  const payload = createExchangeBoardPayload(board);
  return {
    format,
    scope: 'board',
    fileName: `board-${slugify(payload.title)}.${format === 'json' ? 'json' : 'md'}`,
    content: serialize(format, 'board', payload),
  };
}

export function exportColumn(
  column: BoardColumn,
  format: BoardsExchangeFormat
): BoardsExportResult {
  const payload = createExchangeColumnPayload(column);
  return {
    format,
    scope: 'column',
    fileName: `column-${slugify(payload.title)}.${format === 'json' ? 'json' : 'md'}`,
    content: serialize(format, 'column', payload),
  };
}

export function exportCard(
  card: Card,
  format: BoardsExchangeFormat
): BoardsExportResult {
  const payload = createExchangeCardPayload(card);
  return {
    format,
    scope: 'card',
    fileName: `card-${slugify(payload.title)}.${format === 'json' ? 'json' : 'md'}`,
    content: serialize(format, 'card', payload),
  };
}
