import { describe, expect, it, vi } from 'vitest';
import type {
  Card,
  CardEntityLink,
} from '../../../majom-wrapper/interfaces/index.ts';
import { createBoardsCommandSuccess } from '../domain/boardsCommandResult.ts';
import {
  BoardsEntityLinkUseCases,
  type BoardsEntityLinkUseCasePorts,
} from './BoardsEntityLinkUseCases.ts';

const CARD_ID = 'card-1';
const LINK_ID = 'link-1';

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: CARD_ID,
    placement_id: 'placement-1',
    column: 'column-1',
    title: '  Card title  ',
    description: '  Card description  ',
    order: 0,
    ...overrides,
  } as Card;
}

function createLink(overrides: Partial<CardEntityLink> = {}): CardEntityLink {
  return {
    id: LINK_ID,
    card: CARD_ID,
    entity_type: 'task',
    entity_id: 'entity-1',
    entity: null,
    ...overrides,
  };
}

function createPorts(
  overrides: Partial<BoardsEntityLinkUseCasePorts> = {}
): BoardsEntityLinkUseCasePorts {
  return {
    createTask: vi.fn(async () => ({ id: 1, uuid: 'task-uuid' })),
    createStory: vi.fn(async () => ({ id: 2, uuid: 'story-uuid' })),
    createGoal: vi.fn(async () => ({ id: 3, uuid: 'goal-uuid' })),
    deleteTask: vi.fn(async () => undefined),
    deleteStory: vi.fn(async () => undefined),
    deleteGoal: vi.fn(async () => undefined),
    createCardEntityLink: vi.fn(async () =>
      createBoardsCommandSuccess(createLink())
    ),
    reloadBoards: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('BoardsEntityLinkUseCases', () => {
  it('creates a standalone task from a card and links it back to the card', async () => {
    const ports = createPorts();
    const useCases = new BoardsEntityLinkUseCases(ports);

    const result = await useCases.createEntityFromCard(createCard(), 'task');

    expect(result.ok).toBe(true);
    expect(ports.createTask).toHaveBeenCalledWith({
      title: 'Card title',
      description: 'Card description',
      is_standalone: true,
    });
    expect(ports.createCardEntityLink).toHaveBeenCalledWith(
      CARD_ID,
      'task',
      'task-uuid'
    );
  });

  it('creates story and goal entities with normalized card fields', async () => {
    const ports = createPorts({
      createStory: vi.fn(async () => ({ id: 42 })),
    });
    const useCases = new BoardsEntityLinkUseCases(ports);

    await useCases.createEntityFromCard(
      createCard({ description: null }),
      'story'
    );
    await useCases.createEntityFromCard(createCard(), 'goal');

    expect(ports.createStory).toHaveBeenCalledWith({
      title: 'Card title',
      description: '',
    });
    expect(ports.createCardEntityLink).toHaveBeenCalledWith(
      CARD_ID,
      'story',
      '42'
    );
    expect(ports.createGoal).toHaveBeenCalledWith({
      title: 'Card title',
      description: 'Card description',
    });
  });

  it('deletes linked entities through the matching domain port and reloads boards', async () => {
    const ports = createPorts();
    const useCases = new BoardsEntityLinkUseCases(ports);

    const result = await useCases.deleteLinkedEntity(
      createLink({ entity_type: 'story', entity_id: 'story-uuid' })
    );

    expect(result.ok).toBe(true);
    expect(ports.deleteStory).toHaveBeenCalledWith('story-uuid');
    expect(ports.reloadBoards).toHaveBeenCalledTimes(1);
    expect(ports.deleteTask).not.toHaveBeenCalled();
    expect(ports.deleteGoal).not.toHaveBeenCalled();
  });

  it('returns a recoverable command failure when entity creation or deletion fails', async () => {
    const ports = createPorts({
      createGoal: vi.fn(async () => {
        throw new Error('failed');
      }),
      deleteTask: vi.fn(async () => {
        throw new Error('failed');
      }),
    });
    const useCases = new BoardsEntityLinkUseCases(ports);

    const createResult = await useCases.createEntityFromCard(
      createCard(),
      'goal'
    );
    const deleteResult = await useCases.deleteLinkedEntity(createLink());

    expect(createResult.ok).toBe(false);
    expect(deleteResult.ok).toBe(false);
    expect(ports.createCardEntityLink).not.toHaveBeenCalled();
    expect(ports.reloadBoards).not.toHaveBeenCalled();
  });
});
