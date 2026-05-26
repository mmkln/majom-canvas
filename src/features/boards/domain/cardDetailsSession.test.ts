import { describe, expect, it } from 'vitest';
import type { Card } from '../../../majom-wrapper/interfaces/index.ts';
import {
  createCardDetailsPatch,
  createCardDetailsSession,
  hasCardDetailsPatch,
  queueCardDetailsSubmit,
  reconcileCardDetailsSession,
  updateCardDetailsDraft,
  updateCardDetailsRequestedTagIds,
} from './cardDetailsSession.ts';

const TEMP_CARD = 'temp:card';
const TEMP_PLACEMENT = 'temp:placement';
const CARD_ID = '00000000-0000-4000-8000-000000000020';
const PLACEMENT_ID = '00000000-0000-4000-8000-000000000200';
const COLUMN_ID = '00000000-0000-4000-8000-000000000010';

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: CARD_ID,
    placement_id: PLACEMENT_ID,
    column: COLUMN_ID,
    title: 'Design of Everyday Things',
    description: 'Interaction design notes',
    order: 0,
    ...overrides,
  };
}

describe('cardDetailsSession', () => {
  it('opens temp cards as unresolved edit sessions', () => {
    const session = createCardDetailsSession(
      createCard({ id: TEMP_CARD, placement_id: TEMP_PLACEMENT }),
      TEMP_PLACEMENT,
      { isResolved: false }
    );

    expect(session.identity).toEqual({
      cardId: TEMP_CARD,
      placementId: TEMP_PLACEMENT,
      isResolved: false,
    });
    expect(session.draft.title).toBe('Design of Everyday Things');
    expect(session.dirty.title).toBe(false);
  });

  it('marks edited fields dirty and creates a patch from dirty fields only', () => {
    const session = updateCardDetailsDraft(
      createCardDetailsSession(createCard(), PLACEMENT_ID, {
        isResolved: true,
      }),
      {
        title: 'The Design of Everyday Things',
      }
    );

    expect(session.dirty.title).toBe(true);
    expect(session.dirty.description).toBe(false);
    expect(createCardDetailsPatch(session)).toEqual({
      title: 'The Design of Everyday Things',
    });
  });

  it('reconciles temp identity to real identity without dropping dirty draft', () => {
    const tempSession = createCardDetailsSession(
      createCard({ id: TEMP_CARD, placement_id: TEMP_PLACEMENT }),
      TEMP_PLACEMENT,
      { isResolved: false }
    );
    const edited = updateCardDetailsDraft(tempSession, {
      title: 'User typed title',
    });

    const reconciled = reconcileCardDetailsSession(
      edited,
      createCard({
        title: 'Backend title',
        description: 'Backend description',
      }),
      PLACEMENT_ID,
      { isResolved: true }
    );

    expect(reconciled.identity).toEqual({
      cardId: CARD_ID,
      placementId: PLACEMENT_ID,
      isResolved: true,
    });
    expect(reconciled.base.title).toBe('Backend title');
    expect(reconciled.draft.title).toBe('User typed title');
    expect(reconciled.draft.description).toBe('Backend description');
    expect(reconciled.dirty.title).toBe(true);
    expect(reconciled.dirty.description).toBe(false);
  });

  it('keeps a queued submit until the session resolves', () => {
    const queued = queueCardDetailsSubmit(
      updateCardDetailsDraft(
        createCardDetailsSession(
          createCard({ id: TEMP_CARD, placement_id: TEMP_PLACEMENT }),
          TEMP_PLACEMENT,
          { isResolved: false }
        ),
        { description: 'Draft notes' }
      ),
      { closeAfterSubmit: true }
    );
    const patchBeforeResolve = createCardDetailsPatch(queued);

    expect(queued.pendingSubmit).toBe(true);
    expect(queued.closeAfterSubmit).toBe(true);
    expect(hasCardDetailsPatch(patchBeforeResolve)).toBe(true);

    const resolved = reconcileCardDetailsSession(
      queued,
      createCard({ description: 'Backend notes' }),
      PLACEMENT_ID,
      { isResolved: true }
    );

    expect(resolved.pendingSubmit).toBe(true);
    expect(resolved.identity.cardId).toBe(CARD_ID);
    expect(createCardDetailsPatch(resolved)).toEqual({
      description: 'Draft notes',
    });
  });

  it('does not duplicate already requested tag changes in a later save patch', () => {
    const edited = updateCardDetailsDraft(
      createCardDetailsSession(
        createCard({
          tag_ids: [1],
        }),
        PLACEMENT_ID,
        { isResolved: true }
      ),
      { tagIds: [1, 2] }
    );

    const requested = updateCardDetailsRequestedTagIds(edited, [1, 2]);

    expect(createCardDetailsPatch(requested)).toEqual({});
  });
});
