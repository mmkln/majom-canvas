import { describe, expect, it } from 'vitest';
import { Status, type Flow } from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowColumn } from './types.ts';
import {
  compareFlowsForDisplay,
  hasFlowInsertionChanged,
  resolveFlowColumnPosAtInsertion,
  resolveFlowColumnPosPatches,
} from './flowColumnPosition.ts';

describe('flowColumnPosition', () => {
  it('sorts flows by persisted meta pos before title fallback', () => {
    const flows = [
      createFlow({ id: 1, title: 'Alpha', pos: 2048 }),
      createFlow({ id: 2, title: 'Beta', pos: 1024 }),
      createFlow({ id: 3, title: 'Aardvark' }),
    ];

    expect([...flows].sort(compareFlowsForDisplay).map((flow) => flow.id)).toEqual([
      2,
      1,
      3,
    ]);
  });

  it('resolves a fractional pos between neighboring flow columns', () => {
    const columns = [
      createColumn(createFlow({ id: 1, title: 'Alpha', pos: 1000 })),
      createColumn(createFlow({ id: 2, title: 'Beta', pos: 2000 })),
      createColumn(createFlow({ id: 3, title: 'Gamma', pos: 3000 })),
    ];

    expect(resolveFlowColumnPosAtInsertion(columns, 3, 1)).toBe(1500);
    expect(hasFlowInsertionChanged(columns, 3, 1)).toBe(true);
    expect(hasFlowInsertionChanged(columns, 2, 1)).toBe(false);
  });

  it('creates dense pos patches for the reordered visual column sequence', () => {
    const columns = [
      createColumn(createFlow({ id: 1, title: 'Alpha' })),
      createColumn(createFlow({ id: 2, title: 'Beta' })),
      createColumn(createFlow({ id: 3, title: 'Gamma' })),
    ];

    expect(resolveFlowColumnPosPatches(columns, 3, 0).map(({ column, pos }) => ({
      id: column.flow.id,
      pos,
    }))).toEqual([
      { id: 3, pos: 1024 },
      { id: 1, pos: 2048 },
      { id: 2, pos: 3072 },
    ]);
  });
});

function createFlow(
  overrides: Partial<Flow> & { pos?: number | string | null } = {}
): Flow {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Flow',
    status: overrides.status ?? Status.Active,
    meta:
      overrides.pos === undefined
        ? null
        : { pos: overrides.pos },
    tasks: [],
  };
}

function createColumn(flow: Flow): FlowColumn {
  return {
    flow,
    tasks: [],
    taskStatus: 'ready',
    taskError: null,
    openTaskCount: 0,
  };
}
