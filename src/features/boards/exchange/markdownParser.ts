import {
  BOARDS_EXCHANGE_SCHEMA,
  BOARDS_EXCHANGE_VERSION,
  type BoardsExchangeEnvelope,
  type BoardsExchangeScope,
  type BoardsImportDiagnostic,
  type BoardsImportPlan,
  type ExchangeBoardPayload,
  type ExchangeCardPayload,
  type ExchangeChecklistPayload,
  type ExchangeColumnPayload,
} from './schema.ts';

const MARKDOWN_FRONT_MATTER_KEYS = new Set([
  'schema',
  'version',
  'scope',
  'title',
  'id',
  'exportedAt',
]);

type ParsedFrontMatter = {
  fields: Record<string, string>;
  body: string;
  diagnostics: BoardsImportDiagnostic[];
};

function parseFrontMatter(raw: string): ParsedFrontMatter {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') {
    return { fields: {}, body: raw, diagnostics: [] };
  }
  const endIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---'
  );
  if (endIndex < 0) {
    return {
      fields: {},
      body: raw,
      diagnostics: [
        {
          level: 'warning',
          code: 'markdown_front_matter_unclosed',
          message: 'Markdown front matter was not closed and was ignored.',
          path: 'frontMatter',
        },
      ],
    };
  }

  const frontMatterLines = lines.slice(1, endIndex);
  const result: Record<string, string> = {};
  const diagnostics: BoardsImportDiagnostic[] = [];
  for (const line of frontMatterLines) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|"$/g, '');
    if (!key) continue;
    result[key] = value;
    if (!MARKDOWN_FRONT_MATTER_KEYS.has(key)) {
      diagnostics.push({
        level: 'warning',
        code: 'unknown_front_matter_field',
        message: `Unknown front matter field "${key}" will be ignored.`,
        path: `frontMatter.${key}`,
      });
    }
  }
  return {
    fields: result,
    body: lines.slice(endIndex + 1).join('\n'),
    diagnostics,
  };
}

function normalizeTitle(
  value: string | undefined,
  fallback: string,
  path: string,
  diagnostics: BoardsImportDiagnostic[]
): string {
  if (value === undefined) {
    diagnostics.push({
      level: 'warning',
      code: 'missing_title',
      message: `Missing title at ${path}; using "${fallback}".`,
      path,
    });
    return fallback;
  }
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

function readCardDescription(
  lines: string[],
  startIndex: number
): string | undefined {
  const descriptionLine = lines[startIndex]?.trim() ?? '';
  const inlineDescription = descriptionLine
    .replace(/^Description:\s*/i, '')
    .trim();
  if (inlineDescription) return inlineDescription;

  const descriptionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (/^#{1,6}\s/.test(line) || /^[A-Za-z][A-Za-z0-9 _-]*:\s*/.test(line)) {
      break;
    }
    descriptionLines.push(line);
  }
  const description = descriptionLines.join('\n').trim();
  return description || undefined;
}

function parseCardDetails(
  lines: string[],
  startIndex: number,
  path: string,
  diagnostics: BoardsImportDiagnostic[]
): Pick<ExchangeCardPayload, 'description' | 'checklists'> {
  let description: string | undefined;
  const checklists: ExchangeChecklistPayload[] = [];
  let currentChecklist: ExchangeChecklistPayload | null = null;
  const firstDetailIndex = Math.max(startIndex + 1, 0);

  for (let index = firstDetailIndex; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();
    if (/^##\s+Column:/.test(rawLine) || /^###\s+Card:/.test(rawLine)) break;
    if (!line) continue;

    if (/^Description:/i.test(line)) {
      description = readCardDescription(lines, index);
      currentChecklist = null;
      continue;
    }

    const checklistMatch = /^Checklist:\s*(.*)$/i.exec(line);
    if (checklistMatch) {
      const checklistIndex = checklists.length;
      currentChecklist = {
        title: normalizeTitle(
          checklistMatch[1],
          'Checklist',
          `${path}.checklists[${checklistIndex}].title`,
          diagnostics
        ),
        items: [],
      };
      checklists.push(currentChecklist);
      continue;
    }

    const checkItemMatch = /^-\s*\[( |x|X)\]\s*(.*)$/.exec(line);
    if (checkItemMatch) {
      if (!currentChecklist) {
        currentChecklist = {
          title: 'Checklist',
          items: [],
        };
        checklists.push(currentChecklist);
        diagnostics.push({
          level: 'warning',
          code: 'check_item_without_checklist',
          message:
            'A checklist item appeared before any checklist title; using "Checklist".',
          path: `${path}.checklists[${checklists.length - 1}]`,
        });
      }
      const itemIndex = currentChecklist.items.length;
      currentChecklist.items.push({
        title: normalizeTitle(
          checkItemMatch[2],
          'Untitled item',
          `${path}.checklists[${checklists.length - 1}].items[${itemIndex}].title`,
          diagnostics
        ),
        state:
          checkItemMatch[1].toLowerCase() === 'x' ? 'complete' : 'incomplete',
      });
    }
  }

  return {
    ...(description ? { description } : {}),
    ...(checklists.length > 0 ? { checklists } : {}),
  };
}

function createEnvelope(
  scope: BoardsExchangeScope,
  payload: ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
): BoardsExchangeEnvelope<
  ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
> {
  return {
    schema: BOARDS_EXCHANGE_SCHEMA,
    version: BOARDS_EXCHANGE_VERSION,
    format: 'markdown',
    scope,
    exportedAt: new Date().toISOString(),
    payload,
  };
}

export function parseBoardsMarkdown(
  raw: string,
  scope: BoardsExchangeScope
): {
  envelope: BoardsExchangeEnvelope<
    ExchangeBoardPayload | ExchangeColumnPayload | ExchangeCardPayload
  >;
  diagnostics: BoardsImportDiagnostic[];
} {
  const frontMatter = parseFrontMatter(raw);
  const lines = frontMatter.body.replace(/\r\n/g, '\n').split('\n');
  const diagnostics = [...frontMatter.diagnostics];

  if (scope === 'card') {
    const titleLineIndex = lines.findIndex(
      (line) => line.startsWith('### Card:') || line.startsWith('# Card:')
    );
    const titleLine = titleLineIndex >= 0 ? lines[titleLineIndex] : undefined;
    const title = normalizeTitle(
      titleLine?.replace(/^#{1,3}\s*Card:/, ''),
      'Untitled card',
      'payload.title',
      diagnostics
    );
    const details = parseCardDetails(
      lines,
      titleLineIndex >= 0 ? titleLineIndex : -1,
      'payload',
      diagnostics
    );
    return {
      envelope: createEnvelope(scope, {
        ...(frontMatter.fields.id ? { id: frontMatter.fields.id } : {}),
        title,
        ...details,
      }),
      diagnostics,
    };
  }

  const columns: ExchangeColumnPayload[] = [];
  let currentColumn: ExchangeColumnPayload | null = null;

  for (const [lineIndex, line] of lines.entries()) {
    if (line.startsWith('## Column:')) {
      currentColumn = {
        title: normalizeTitle(
          line.replace('## Column:', ''),
          'Untitled column',
          `payload.columns[${columns.length}].title`,
          diagnostics
        ),
        cards: [],
      };
      columns.push(currentColumn);
      continue;
    }
    if (line.startsWith('### Card:')) {
      if (!currentColumn) {
        currentColumn = { title: 'Imported', cards: [] };
        columns.push(currentColumn);
        diagnostics.push({
          level: 'warning',
          code: 'card_without_column',
          message:
            'A card heading appeared before any column; using "Imported".',
          path: `body.line${lineIndex + 1}`,
        });
      }
      const columnIndex = Math.max(columns.length - 1, 0);
      const cardIndex = currentColumn.cards.length;
      const cardTitle = normalizeTitle(
        line.replace('### Card:', ''),
        'Untitled card',
        `payload.columns[${columnIndex}].cards[${cardIndex}].title`,
        diagnostics
      );
      const details = parseCardDetails(
        lines,
        lineIndex,
        `payload.columns[${columnIndex}].cards[${cardIndex}]`,
        diagnostics
      );
      currentColumn.cards.push({
        title: cardTitle,
        ...details,
      });
    }
  }

  if (scope === 'column') {
    const payload = columns[0] ?? {
      title: normalizeTitle(
        frontMatter.fields.title,
        'Untitled column',
        'payload.title',
        diagnostics
      ),
      cards: [],
    };
    return {
      envelope: createEnvelope(scope, payload),
      diagnostics,
    };
  }

  const payload: ExchangeBoardPayload = {
    ...(frontMatter.fields.id ? { id: frontMatter.fields.id } : {}),
    title: normalizeTitle(
      frontMatter.fields.title,
      'Untitled board',
      'payload.title',
      diagnostics
    ),
    columns,
  };

  return {
    envelope: createEnvelope(scope, payload),
    diagnostics,
  };
}

export function buildInitialImportPlan(
  scope: BoardsExchangeScope,
  diagnostics: BoardsImportDiagnostic[] = []
): BoardsImportPlan {
  return {
    scope,
    canApply: diagnostics.every((diagnostic) => diagnostic.level !== 'error'),
    counts: { create: 0, update: 0, skip: 0, conflict: 0 },
    items: [],
    diagnostics,
    warnings: diagnostics
      .filter((diagnostic) => diagnostic.level === 'warning')
      .map((diagnostic) => diagnostic.message),
    errors: diagnostics
      .filter((diagnostic) => diagnostic.level === 'error')
      .map((diagnostic) => diagnostic.message),
  };
}
