import { describe, expect, it } from 'vitest';
import type { Board } from '../../../majom-wrapper/interfaces/index.ts';
import {
  createDefaultBoardsImportPolicies,
  type BoardsImportRequest,
} from './schema.ts';
import { previewBoardsImport } from './importPlanner.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const COLUMN_TODO = '00000000-0000-4000-8000-000000000010';
const COLUMN_DONE = '00000000-0000-4000-8000-000000000011';
const CARD_FIRST = '00000000-0000-4000-8000-000000000020';
const CARD_SECOND = '00000000-0000-4000-8000-000000000021';

function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: BOARD_ID,
    title: 'Existing board',
    columns: [],
    ...overrides,
  };
}

function createRequest(
  overrides: Partial<BoardsImportRequest>
): BoardsImportRequest {
  return {
    raw: '',
    format: 'markdown',
    scope: 'board',
    policies: createDefaultBoardsImportPolicies(),
    ...overrides,
  };
}

describe('previewBoardsImport', () => {
  it('plans a partial Markdown board import with only board, column, and card titles', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        raw: [
          '---',
          'title: "AI Generated Board"',
          '---',
          '',
          '## Column: Backlog',
          '### Card: First task',
        ].join('\n'),
      })
    );

    expect(plan.canApply).toBe(true);
    expect(plan.counts).toEqual({
      create: 3,
      update: 0,
      skip: 0,
      conflict: 0,
    });
    expect(
      plan.items.map((item) => [item.entity, item.title, item.path])
    ).toEqual([
      ['board', 'AI Generated Board', 'payload'],
      ['column', 'Backlog', 'payload.columns[0]'],
      ['card', 'First task', 'payload.columns[0].cards[0]'],
    ]);
  });

  it('includes checklist and checklist item creations in the preview plan', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        raw: [
          '---',
          'title: "AI Generated Board"',
          '---',
          '',
          '## Column: Backlog',
          '### Card: First task',
          'Checklist: Implementation',
          '- [ ] Parser',
          '- [x] Preview',
        ].join('\n'),
      })
    );

    expect(plan.canApply).toBe(true);
    expect(plan.counts).toEqual({
      create: 6,
      update: 0,
      skip: 0,
      conflict: 0,
    });
    expect(
      plan.items.map((item) => [item.entity, item.title, item.path])
    ).toEqual([
      ['board', 'AI Generated Board', 'payload'],
      ['column', 'Backlog', 'payload.columns[0]'],
      ['card', 'First task', 'payload.columns[0].cards[0]'],
      [
        'checklist',
        'Implementation',
        'payload.columns[0].cards[0].checklists[0]',
      ],
      [
        'checkItem',
        'Parser',
        'payload.columns[0].cards[0].checklists[0].items[0]',
      ],
      [
        'checkItem',
        'Preview',
        'payload.columns[0].cards[0].checklists[0].items[1]',
      ],
    ]);
  });

  it('keeps partial Markdown import applyable while reporting missing fallback fields', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        raw: ['## Column:', '### Card:'].join('\n'),
      })
    );

    expect(plan.canApply).toBe(true);
    expect(plan.items.map((item) => item.title)).toEqual([
      'Untitled board',
      'Untitled column',
      'Untitled card',
    ]);
    expect(plan.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'empty_title',
      'empty_title',
      'missing_title',
    ]);
  });

  it('blocks import preview when strict mode sees an unknown JSON payload field', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        format: 'json',
        raw: JSON.stringify({
          schema: 'majom.boards.exchange',
          version: '1.0',
          scope: 'card',
          payload: {
            title: 'Generated card',
            unsupported: true,
          },
        }),
        scope: 'card',
        policies: {
          ...createDefaultBoardsImportPolicies(),
          unknownFieldPolicy: 'strict_error',
        },
      })
    );

    expect(plan.canApply).toBe(false);
    expect(plan.counts.conflict).toBe(1);
    expect(plan.errors).toEqual([
      'Unknown payload field "unsupported" will be ignored.',
    ]);
  });

  it('blocks import preview when strict mode sees an unknown Markdown front matter field', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        raw: ['---', 'title: "Imported"', 'unexpected: value', '---'].join(
          '\n'
        ),
        policies: {
          ...createDefaultBoardsImportPolicies(),
          unknownFieldPolicy: 'strict_error',
        },
      })
    );

    expect(plan.canApply).toBe(false);
    expect(plan.counts.conflict).toBe(1);
    expect(plan.errors).toEqual([
      'Unknown front matter field "unexpected" will be ignored.',
    ]);
  });

  it('marks title matching as a conflict when card import is ambiguous', () => {
    const plan = previewBoardsImport(
      [
        createBoard({
          columns: [
            {
              id: COLUMN_TODO,
              board: BOARD_ID,
              title: 'Todo',
              order: 0,
              cards: [
                {
                  id: CARD_FIRST,
                  column: COLUMN_TODO,
                  title: 'Repeated',
                  description: '',
                  order: 0,
                },
              ],
            },
            {
              id: COLUMN_DONE,
              board: BOARD_ID,
              title: 'Done',
              order: 1,
              cards: [
                {
                  id: CARD_SECOND,
                  column: COLUMN_DONE,
                  title: 'Repeated',
                  description: '',
                  order: 0,
                },
              ],
            },
          ],
        }),
      ],
      createRequest({
        scope: 'card',
        raw: '### Card: Repeated',
      })
    );

    expect(plan.canApply).toBe(false);
    expect(plan.counts).toEqual({
      create: 0,
      update: 0,
      skip: 0,
      conflict: 1,
    });
    expect(plan.items[0]).toMatchObject({
      action: 'conflict',
      entity: 'card',
      title: 'Repeated',
      reason: 'ambiguous-title-match',
    });
  });

  it('turns malformed JSON into a blocking preview conflict instead of throwing', () => {
    const plan = previewBoardsImport(
      [],
      createRequest({
        format: 'json',
        scope: 'board',
        raw: '{',
      })
    );

    expect(plan.canApply).toBe(false);
    expect(plan.errors).toEqual(['Import source is not valid JSON.']);
    expect(plan.items[0]).toMatchObject({
      action: 'conflict',
      entity: 'board',
      reason: 'invalid-source',
    });
  });
});
