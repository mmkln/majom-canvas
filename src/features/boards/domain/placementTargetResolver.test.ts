import { describe, expect, it } from 'vitest';
import type { Card } from '../../../majom-wrapper/interfaces/index.ts';
import {
  hasCardPlacementTargetChanged,
  resolveCardPlacementTarget,
} from './placementTargetResolver.ts';

const COLUMN_A = '00000000-0000-4000-8000-000000000010';
const COLUMN_B = '00000000-0000-4000-8000-000000000011';
const CARD_A = '00000000-0000-4000-8000-000000000001';
const CARD_B = '00000000-0000-4000-8000-000000000002';
const CARD_C = '00000000-0000-4000-8000-000000000003';
const PLACEMENT_A = '00000000-0000-4000-8000-000000000101';
const PLACEMENT_B = '00000000-0000-4000-8000-000000000102';
const PLACEMENT_C = '00000000-0000-4000-8000-000000000103';
const MOVING_PLACEMENT = '00000000-0000-4000-8000-000000000200';

function card(id: string, placementId = id): Card {
  return {
    id,
    placement_id: placementId,
    column: COLUMN_A,
    title: `Card ${id}`,
    description: '',
    pos: id,
  };
}

describe('resolveCardPlacementTarget', () => {
  it('targets an empty column by bottom position', () => {
    expect(
      resolveCardPlacementTarget({
        columnId: COLUMN_B,
        cards: [],
        movingPlacementId: MOVING_PLACEMENT,
        insertionIndex: 0,
      })
    ).toEqual({ column: COLUMN_B, position: 'bottom' });
  });

  it('targets the top before the first existing card', () => {
    expect(
      resolveCardPlacementTarget({
        columnId: COLUMN_B,
        cards: [card(CARD_A, PLACEMENT_A), card(CARD_B, PLACEMENT_B)],
        movingPlacementId: MOVING_PLACEMENT,
        insertionIndex: 0,
      })
    ).toEqual({ column: COLUMN_B, after_placement: PLACEMENT_A });
  });

  it('targets the gap between two existing cards', () => {
    expect(
      resolveCardPlacementTarget({
        columnId: COLUMN_B,
        cards: [
          card(CARD_A, PLACEMENT_A),
          card(CARD_B, PLACEMENT_B),
          card(CARD_C, PLACEMENT_C),
        ],
        movingPlacementId: MOVING_PLACEMENT,
        insertionIndex: 2,
      })
    ).toEqual({
      column: COLUMN_B,
      before_placement: PLACEMENT_B,
      after_placement: PLACEMENT_C,
    });
  });

  it('targets the bottom after the last existing card', () => {
    expect(
      resolveCardPlacementTarget({
        columnId: COLUMN_B,
        cards: [card(CARD_A, PLACEMENT_A), card(CARD_B, PLACEMENT_B)],
        movingPlacementId: MOVING_PLACEMENT,
        insertionIndex: 99,
      })
    ).toEqual({ column: COLUMN_B, before_placement: PLACEMENT_B });
  });

  it('excludes the moving placement when resolving same-column gaps', () => {
    expect(
      resolveCardPlacementTarget({
        columnId: COLUMN_B,
        cards: [
          card(CARD_A, PLACEMENT_A),
          card(CARD_B, PLACEMENT_B),
          card(CARD_C, PLACEMENT_C),
        ],
        movingPlacementId: PLACEMENT_B,
        insertionIndex: 1,
      })
    ).toEqual({
      column: COLUMN_B,
      before_placement: PLACEMENT_A,
      after_placement: PLACEMENT_C,
    });
  });
});

describe('hasCardPlacementTargetChanged', () => {
  it('returns false when a same-column drop keeps the original neighbors', () => {
    expect(
      hasCardPlacementTargetChanged(
        [
          card(CARD_A, PLACEMENT_A),
          card(CARD_B, PLACEMENT_B),
          card(CARD_C, PLACEMENT_C),
        ],
        PLACEMENT_B,
        {
          column: COLUMN_A,
          before_placement: PLACEMENT_A,
          after_placement: PLACEMENT_C,
        }
      )
    ).toBe(false);
  });

  it('returns true when a same-column drop changes the neighbors', () => {
    expect(
      hasCardPlacementTargetChanged(
        [
          card(CARD_A, PLACEMENT_A),
          card(CARD_B, PLACEMENT_B),
          card(CARD_C, PLACEMENT_C),
        ],
        PLACEMENT_B,
        {
          column: COLUMN_A,
          after_placement: PLACEMENT_A,
        }
      )
    ).toBe(true);
  });
});
