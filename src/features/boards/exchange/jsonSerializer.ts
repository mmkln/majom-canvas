import type {
  BoardsExchangeEnvelope,
  ExchangeBoardPayload,
  ExchangeCardPayload,
  ExchangeColumnPayload,
} from './schema.ts';

export function serializeBoardsJson(
  envelope: BoardsExchangeEnvelope<
    ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
  >
): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}
