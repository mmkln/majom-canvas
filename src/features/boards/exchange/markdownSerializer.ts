import type {
  BoardsExchangeEnvelope,
  ExchangeBoardPayload,
  ExchangeCardPayload,
  ExchangeColumnPayload,
} from './schema.ts';

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}

function frontMatter(
  envelope: BoardsExchangeEnvelope<
    ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
  >
): string[] {
  const payload = envelope.payload;
  return [
    '---',
    `schema: ${envelope.schema}`,
    `version: ${quoteYaml(envelope.version)}`,
    `scope: ${envelope.scope}`,
    `title: ${quoteYaml(payload.title)}`,
    `exportedAt: ${quoteYaml(envelope.exportedAt)}`,
    ...(payload.id ? [`id: ${quoteYaml(payload.id)}`] : []),
    '---',
  ];
}

function appendDescription(
  lines: string[],
  description: string | undefined
): void {
  if (!description) return;
  lines.push('', 'Description:', description);
}

function appendCard(lines: string[], card: ExchangeCardPayload): void {
  lines.push(`### Card: ${card.title}`);
  appendDescription(lines, card.description);
  for (const checklist of card.checklists ?? []) {
    lines.push('', `Checklist: ${checklist.title}`);
    for (const item of checklist.items ?? []) {
      const marker = item.state === 'complete' ? 'x' : ' ';
      lines.push(`- [${marker}] ${item.title}`);
    }
  }
}

function appendColumn(lines: string[], column: ExchangeColumnPayload): void {
  lines.push(`## Column: ${column.title}`);
  for (const card of column.cards) {
    lines.push('');
    appendCard(lines, card);
  }
}

export function serializeBoardsMarkdown(
  envelope: BoardsExchangeEnvelope<
    ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
  >
): string {
  const lines = frontMatter(envelope);

  if (envelope.scope === 'board') {
    const payload = envelope.payload as ExchangeBoardPayload;
    for (const column of payload.columns) {
      lines.push('');
      appendColumn(lines, column);
    }
    return `${lines.join('\n').trimEnd()}\n`;
  }

  if (envelope.scope === 'column') {
    appendColumn(lines, envelope.payload as ExchangeColumnPayload);
    return `${lines.join('\n').trimEnd()}\n`;
  }

  appendCard(lines, envelope.payload as ExchangeCardPayload);
  return `${lines.join('\n').trimEnd()}\n`;
}
