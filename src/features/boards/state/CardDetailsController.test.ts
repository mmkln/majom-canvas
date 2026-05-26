// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type {
  Card,
  CardChecklist,
  CardEntityLink,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  createBoardsCommandFailure,
  createBoardsCommandSuccess,
} from '../domain/boardsCommandResult.ts';
import { createCardDetailsPatch } from '../domain/cardDetailsSession.ts';
import {
  CardDetailsController,
  type CardDetailsChecklistPorts,
  type CardDetailsEntityLinkPorts,
} from './CardDetailsController.ts';

const CARD_ID = '00000000-0000-4000-8000-000000000020';
const REAL_PLACEMENT_ID = '00000000-0000-4000-8000-000000000200';
const COLUMN_ID = '00000000-0000-4000-8000-000000000010';
const CHECKLIST_ID = '00000000-0000-4000-8000-000000000300';
const ENTITY_LINK_ID = '00000000-0000-4000-8000-000000000400';
const LINKED_TASK_ID = '00000000-0000-4000-8000-000000000500';
const TEMP_CARD_ID = 'temp:card';
const TEMP_PLACEMENT_ID = 'temp:placement';

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: CARD_ID,
    placement_id: REAL_PLACEMENT_ID,
    column: COLUMN_ID,
    title: 'Original title',
    description: 'Original description',
    order: 0,
    ...overrides,
  };
}

function createChecklist(
  overrides: Partial<CardChecklist> = {}
): CardChecklist {
  return {
    id: CHECKLIST_ID,
    card: CARD_ID,
    title: 'Checklist',
    items: [],
    ...overrides,
  };
}

function createEntityLink(
  overrides: Partial<CardEntityLink> = {}
): CardEntityLink {
  return {
    id: ENTITY_LINK_ID,
    card: CARD_ID,
    entity_type: 'task',
    entity_id: LINKED_TASK_ID,
    entity: {
      id: LINKED_TASK_ID,
      title: 'Linked task',
      status: 'open',
    },
    ...overrides,
  };
}

function createChecklistPorts(
  overrides: Partial<CardDetailsChecklistPorts> = {}
): CardDetailsChecklistPorts {
  return {
    loadChecklists: vi.fn(async () => []),
    createChecklist: vi.fn(async () => createBoardsCommandSuccess(null)),
    deleteChecklist: vi.fn(async () => createBoardsCommandSuccess()),
    createCheckItem: vi.fn(async () => createBoardsCommandSuccess(null)),
    patchCheckItem: vi.fn(async () => createBoardsCommandSuccess(null)),
    deleteCheckItem: vi.fn(async () => createBoardsCommandSuccess()),
    ...overrides,
  };
}

function createEntityLinkPorts(
  overrides: Partial<CardDetailsEntityLinkPorts> = {}
): CardDetailsEntityLinkPorts {
  return {
    createLink: vi.fn(async () => createBoardsCommandSuccess(null)),
    createEntityFromCard: vi.fn(async () => createBoardsCommandSuccess(null)),
    deleteLink: vi.fn(async () => createBoardsCommandSuccess()),
    deleteLinkedEntity: vi.fn(async () => createBoardsCommandSuccess()),
    ...overrides,
  };
}

describe('CardDetailsController', () => {
  it('owns the active placement and session lifecycle', () => {
    const controller = new CardDetailsController();

    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    expect(controller.isOpen).toBe(true);
    expect(controller.activePlacementId).toBe(REAL_PLACEMENT_ID);
    expect(controller.snapshot?.identity).toEqual({
      cardId: CARD_ID,
      placementId: REAL_PLACEMENT_ID,
      isResolved: true,
    });

    controller.close();

    expect(controller.isOpen).toBe(false);
    expect(controller.activePlacementId).toBeNull();
    expect(controller.snapshot).toBeNull();
  });

  it('reconciles a temp card to the real placement without dropping dirty draft', () => {
    const controller = new CardDetailsController();
    controller.open(
      createCard({
        id: TEMP_CARD_ID,
        placement_id: TEMP_PLACEMENT_ID,
      }),
      TEMP_PLACEMENT_ID,
      { isResolved: false }
    );

    controller.updateDraft({ title: 'User draft' });
    const reconciled = controller.reconcile(
      createCard({
        title: 'Backend title',
        description: 'Backend description',
      }),
      REAL_PLACEMENT_ID,
      { isResolved: true }
    );

    expect(controller.activePlacementId).toBe(REAL_PLACEMENT_ID);
    expect(reconciled?.identity).toEqual({
      cardId: CARD_ID,
      placementId: REAL_PLACEMENT_ID,
      isResolved: true,
    });
    expect(reconciled?.draft.title).toBe('User draft');
    expect(reconciled?.draft.description).toBe('Backend description');
    expect(createCardDetailsPatch(reconciled!)).toEqual({
      title: 'User draft',
    });
  });

  it('keeps queued submit state across identity resolution', () => {
    const controller = new CardDetailsController();
    controller.open(
      createCard({
        id: TEMP_CARD_ID,
        placement_id: TEMP_PLACEMENT_ID,
      }),
      TEMP_PLACEMENT_ID,
      { isResolved: false }
    );
    controller.updateDraft({ description: 'Queued draft' });
    controller.queueSubmit({ closeAfterSubmit: true });

    const reconciled = controller.reconcile(createCard(), REAL_PLACEMENT_ID, {
      isResolved: true,
    });

    expect(reconciled?.pendingSubmit).toBe(true);
    expect(reconciled?.closeAfterSubmit).toBe(true);
    expect(createCardDetailsPatch(reconciled!)).toEqual({
      description: 'Queued draft',
    });
  });

  it('resets checklist state on open and card identity change', () => {
    const controller = new CardDetailsController();
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });
    const version = controller.beginChecklistLoad(CARD_ID);
    controller.applyChecklistLoadSuccess(version, CARD_ID, [createChecklist()]);
    controller.toggleChecklistCheckedItems(CHECKLIST_ID);
    controller.expandCheckItemComposer(CHECKLIST_ID);

    expect(controller.checklists?.checklists).toHaveLength(1);
    expect(controller.isChecklistCheckedItemsHidden(CHECKLIST_ID)).toBe(true);
    expect(controller.isCheckItemComposerExpanded(CHECKLIST_ID)).toBe(true);

    controller.reconcile(
      createCard({
        id: '00000000-0000-4000-8000-000000000021',
        placement_id: '00000000-0000-4000-8000-000000000201',
      }),
      '00000000-0000-4000-8000-000000000201',
      { isResolved: true }
    );

    expect(controller.checklists).toMatchObject({
      cardId: '00000000-0000-4000-8000-000000000021',
      status: 'idle',
      checklists: [],
      error: null,
    });
    expect(controller.isChecklistCheckedItemsHidden(CHECKLIST_ID)).toBe(false);
    expect(controller.isCheckItemComposerExpanded(CHECKLIST_ID)).toBe(false);
  });

  it('ignores stale checklist load results after a newer load starts', () => {
    const controller = new CardDetailsController();
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    const staleVersion = controller.beginChecklistLoad(CARD_ID);
    const currentVersion = controller.beginChecklistLoad(CARD_ID);

    expect(
      controller.applyChecklistLoadSuccess(staleVersion, CARD_ID, [
        createChecklist({ title: 'Stale' }),
      ])
    ).toBe(false);
    expect(controller.checklists?.status).toBe('loading');

    expect(
      controller.applyChecklistLoadSuccess(currentVersion, CARD_ID, [
        createChecklist({ title: 'Current' }),
      ])
    ).toBe(true);
    expect(controller.checklists?.status).toBe('ready');
    expect(controller.checklists?.checklists[0]?.title).toBe('Current');
  });

  it('ignores checklist load results after close', () => {
    const controller = new CardDetailsController();
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });
    const version = controller.beginChecklistLoad(CARD_ID);

    controller.close();

    expect(
      controller.applyChecklistLoadError(
        version,
        CARD_ID,
        'boards.cardBack.checklistsLoadFailed'
      )
    ).toBe(false);
    expect(controller.checklists).toBeNull();
  });

  it('keeps previous checklists visible when a checklist mutation fails', () => {
    const controller = new CardDetailsController();
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });
    const version = controller.beginChecklistLoad(CARD_ID);
    controller.applyChecklistLoadSuccess(version, CARD_ID, [createChecklist()]);

    controller.beginChecklistMutation(CARD_ID);
    controller.failChecklistMutation(
      CARD_ID,
      'boards.cardBack.checklistsSaveFailed'
    );

    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'error',
      error: 'boards.cardBack.checklistsSaveFailed',
    });
    expect(controller.checklists?.checklists).toHaveLength(1);
  });

  it('loads checklists through ports and owns loading state', async () => {
    const ports = createChecklistPorts({
      loadChecklists: vi.fn(async () => [createChecklist()]),
    });
    const controller = new CardDetailsController(ports);
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    const load = controller.loadChecklists(CARD_ID);

    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'loading',
      error: null,
    });
    await expect(load).resolves.toBe(true);
    expect(ports.loadChecklists).toHaveBeenCalledWith(CARD_ID);
    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'ready',
      checklists: [createChecklist()],
      error: null,
    });
  });

  it('sets checklist load error when loading through ports fails', async () => {
    const controller = new CardDetailsController(
      createChecklistPorts({
        loadChecklists: vi.fn(async () => {
          throw new Error('failed');
        }),
      })
    );
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    await expect(controller.loadChecklists(CARD_ID)).resolves.toBe(true);

    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'error',
      checklists: [],
      error: 'boards.cardBack.checklistsLoadFailed',
    });
  });

  it('reloads checklists after a checklist mutation succeeds', async () => {
    const ports = createChecklistPorts({
      createChecklist: vi.fn(async () =>
        createBoardsCommandSuccess(createChecklist({ title: 'Created' }))
      ),
      loadChecklists: vi.fn(async () => [
        createChecklist({ title: 'Reloaded' }),
      ]),
    });
    const controller = new CardDetailsController(ports);
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    const save = controller.createChecklist(CARD_ID, 'Created');

    expect(controller.checklists?.status).toBe('saving');
    await expect(save).resolves.toBe(true);
    expect(ports.createChecklist).toHaveBeenCalledWith(CARD_ID, 'Created');
    expect(ports.loadChecklists).toHaveBeenCalledWith(CARD_ID);
    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'ready',
      checklists: [createChecklist({ title: 'Reloaded' })],
    });
  });

  it('keeps previous checklists when a port mutation returns a command failure', async () => {
    const ports = createChecklistPorts({
      createChecklist: vi.fn(async () => createBoardsCommandFailure()),
    });
    const controller = new CardDetailsController(ports);
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });
    const version = controller.beginChecklistLoad(CARD_ID);
    controller.applyChecklistLoadSuccess(version, CARD_ID, [createChecklist()]);

    await expect(controller.createChecklist(CARD_ID, 'Rejected')).resolves.toBe(
      true
    );

    expect(ports.loadChecklists).not.toHaveBeenCalled();
    expect(controller.checklists).toMatchObject({
      cardId: CARD_ID,
      status: 'error',
      error: 'boards.cardBack.checklistsSaveFailed',
    });
    expect(controller.checklists?.checklists).toHaveLength(1);
  });

  it('routes entity link creation through ports and exposes a confirmed action result', async () => {
    const entityPorts = createEntityLinkPorts({
      createLink: vi.fn(async () =>
        createBoardsCommandSuccess(createEntityLink())
      ),
    });
    const controller = new CardDetailsController(null, entityPorts);
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    const result = await controller.createEntityLink(
      createCard(),
      'task',
      LINKED_TASK_ID
    );

    expect(entityPorts.createLink).toHaveBeenCalledWith(
      CARD_ID,
      'task',
      LINKED_TASK_ID
    );
    expect(result).toEqual({
      status: 'confirmed',
      shouldRefresh: true,
    });
    expect(controller.entityLinks).toMatchObject({
      cardId: CARD_ID,
      status: 'idle',
      error: null,
    });
  });

  it('keeps entity link errors in the controller when a command fails', async () => {
    const entityPorts = createEntityLinkPorts({
      deleteLink: vi.fn(async () => createBoardsCommandFailure()),
    });
    const controller = new CardDetailsController(null, entityPorts);
    controller.open(createCard(), REAL_PLACEMENT_ID, { isResolved: true });

    const result = await controller.unlinkEntity(
      createCard(),
      createEntityLink()
    );

    expect(entityPorts.deleteLink).toHaveBeenCalledWith(ENTITY_LINK_ID);
    expect(result).toEqual({
      status: 'rejected',
      shouldRefresh: true,
    });
    expect(controller.entityLinks).toMatchObject({
      cardId: CARD_ID,
      status: 'error',
      error: 'boards.cardLinks.saveFailed',
    });
  });

  it('ignores backend-only entity link actions before card identity is resolved', async () => {
    const entityPorts = createEntityLinkPorts();
    const controller = new CardDetailsController(null, entityPorts);
    controller.open(
      createCard({ id: TEMP_CARD_ID, placement_id: TEMP_PLACEMENT_ID }),
      TEMP_PLACEMENT_ID,
      { isResolved: false }
    );

    const result = await controller.createEntityLink(
      createCard({ id: TEMP_CARD_ID, placement_id: TEMP_PLACEMENT_ID }),
      'task',
      LINKED_TASK_ID
    );

    expect(entityPorts.createLink).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'ignored',
      shouldRefresh: false,
    });
  });
});
