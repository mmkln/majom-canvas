import { describe, expect, it } from 'vitest';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { LegacyPlanningConnectionLifecycleAdapter } from './LegacyPlanningConnectionLifecycleAdapter.ts';

describe('LegacyPlanningConnectionLifecycleAdapter', () => {
  it('normalizes parent-child direction to goal -> story', () => {
    const adapter = new LegacyPlanningConnectionLifecycleAdapter();
    const goal = new GoalElement({ x: 10, y: 20 });
    const story = new StoryElement({ x: 30, y: 40, width: 300, height: 180 });

    const normalized = adapter.normalizeConnectionRefs(
      ConnectionRelationType.ParentChild,
      story as unknown as IConnectable,
      goal as unknown as IConnectable
    );

    expect(normalized).toEqual({
      from: goal,
      to: story,
    });
  });

  it('rejects parent-child for unsupported element pairs', () => {
    const adapter = new LegacyPlanningConnectionLifecycleAdapter();
    const goalA = new GoalElement({ x: 10, y: 20 });
    const goalB = new GoalElement({ x: 30, y: 40 });

    const normalized = adapter.normalizeConnectionRefs(
      ConnectionRelationType.ParentChild,
      goalA as unknown as IConnectable,
      goalB as unknown as IConnectable
    );

    expect(normalized).toBeNull();
  });
});
