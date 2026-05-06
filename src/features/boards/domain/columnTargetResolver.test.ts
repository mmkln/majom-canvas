import { describe, expect, it } from 'vitest';
import type { BoardColumn } from '../../../majom-wrapper/interfaces/index.ts';
import {
  hasColumnTargetChanged,
  resolveColumnTarget,
} from './columnTargetResolver.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const COLUMN_A = '00000000-0000-4000-8000-000000000010';
const COLUMN_B = '00000000-0000-4000-8000-000000000011';
const COLUMN_C = '00000000-0000-4000-8000-000000000012';

function column(id: string, order: number): BoardColumn {
  return {
    id,
    board: BOARD_ID,
    title: id,
    order,
    cards: [],
  };
}

describe('resolveColumnTarget', () => {
  it('targets an empty board by end position', () => {
    expect(
      resolveColumnTarget({
        columns: [column(COLUMN_A, 0)],
        movingColumnId: COLUMN_A,
        insertionIndex: 0,
      })
    ).toEqual({ position: 'end' });
  });

  it('returns semantic neighbors for a column insertion', () => {
    expect(
      resolveColumnTarget({
        columns: [column(COLUMN_A, 0), column(COLUMN_B, 1), column(COLUMN_C, 2)],
        movingColumnId: COLUMN_C,
        insertionIndex: 1,
      })
    ).toEqual({
      before_column: COLUMN_A,
      after_column: COLUMN_B,
    });
  });

  it('detects whether the column target changes', () => {
    const columns = [column(COLUMN_A, 0), column(COLUMN_B, 1), column(COLUMN_C, 2)];

    expect(
      hasColumnTargetChanged(columns, COLUMN_B, {
        before_column: COLUMN_A,
        after_column: COLUMN_C,
      })
    ).toBe(false);
    expect(
      hasColumnTargetChanged(columns, COLUMN_B, {
        after_column: COLUMN_A,
      })
    ).toBe(true);
  });
});
