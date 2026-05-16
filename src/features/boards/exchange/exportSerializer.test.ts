import { describe, expect, it } from 'vitest';
import type {
  Board,
  Card,
  CardChecklist,
} from '../../../majom-wrapper/interfaces/index.ts';
import { exportBoard, exportCard } from './exportSerializer.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const COLUMN_ID = '00000000-0000-4000-8000-000000000010';
const CARD_ID = '00000000-0000-4000-8000-000000000020';
const CHECKLIST_ID = '00000000-0000-4000-8000-000000000030';
const CHECKITEM_OPEN = '00000000-0000-4000-8000-000000000031';
const CHECKITEM_DONE = '00000000-0000-4000-8000-000000000032';

type CardWithLoadedChecklists = Card & {
  checklists: CardChecklist[];
};

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: CARD_ID,
    column: COLUMN_ID,
    title: 'Draft import UX',
    description: 'Make Markdown easy for AI.',
    order: 0,
    ...overrides,
  };
}

function createBoard(): Board {
  return {
    id: BOARD_ID,
    title: 'Product Board',
    columns: [
      {
        id: COLUMN_ID,
        board: BOARD_ID,
        title: 'Backlog',
        order: 0,
        cards: [createCard()],
      },
    ],
  };
}

describe('Boards export serializers', () => {
  it('exports a board as AI-editable Markdown', () => {
    const result = exportBoard(createBoard(), 'markdown');

    expect(result.fileName).toBe('board-product-board.md');
    expect(result.content).toContain('schema: majom.boards.exchange');
    expect(result.content).toContain('scope: board');
    expect(result.content).toContain('title: "Product Board"');
    expect(result.content).toContain('## Column: Backlog');
    expect(result.content).toContain('### Card: Draft import UX');
    expect(result.content).toContain(
      'Description:\nMake Markdown easy for AI.'
    );
  });

  it('exports loaded card checklists in Markdown', () => {
    const card: CardWithLoadedChecklists = {
      ...createCard(),
      checklists: [
        {
          id: CHECKLIST_ID,
          card: CARD_ID,
          title: 'Implementation',
          items: [
            {
              id: CHECKITEM_OPEN,
              checklist: CHECKLIST_ID,
              title: 'Parser',
              state: 'incomplete',
            },
            {
              id: CHECKITEM_DONE,
              checklist: CHECKLIST_ID,
              title: 'Preview',
              state: 'complete',
            },
          ],
        },
      ],
    };

    const result = exportCard(card, 'markdown');

    expect(result.content).toContain('Checklist: Implementation');
    expect(result.content).toContain('- [ ] Parser');
    expect(result.content).toContain('- [x] Preview');
  });

  it('exports a card as full envelope JSON', () => {
    const result = exportCard(createCard(), 'json');
    const parsed = JSON.parse(result.content);

    expect(result.fileName).toBe('card-draft-import-ux.json');
    expect(parsed).toMatchObject({
      schema: 'majom.boards.exchange',
      version: '1.0',
      format: 'json',
      scope: 'card',
      payload: {
        id: CARD_ID,
        title: 'Draft import UX',
        description: 'Make Markdown easy for AI.',
      },
    });
  });
});
