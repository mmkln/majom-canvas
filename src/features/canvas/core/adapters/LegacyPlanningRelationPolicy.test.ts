import { describe, expect, it } from 'vitest';
import { LegacyPlanningRelationPolicy } from './LegacyPlanningRelationPolicy.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';

describe('LegacyPlanningRelationPolicy', () => {
  it('returns leads_to for goal-goal pair', () => {
    const policy = new LegacyPlanningRelationPolicy();
    const source = new GoalElement({ x: 10, y: 20 });
    const target = new GoalElement({ x: 300, y: 400 });

    const result = policy.canConnect({ source, target });

    expect(result).toEqual({
      allowed: true,
      relationType: ConnectionRelationType.LeadsTo,
    });
  });

  it('returns parent_child for goal-story pair', () => {
    const policy = new LegacyPlanningRelationPolicy();
    const source = new GoalElement({ x: 10, y: 20 });
    const target = new StoryElement({ x: 300, y: 400, width: 400, height: 220 });

    const result = policy.canConnect({ source, target });

    expect(result).toEqual({
      allowed: true,
      relationType: ConnectionRelationType.ParentChild,
    });
  });

  it('rejects duplicate story-task attachment relation', () => {
    const policy = new LegacyPlanningRelationPolicy();
    const story = new StoryElement({ x: 100, y: 120, width: 400, height: 220 });
    const task = new TaskElement({ x: 160, y: 180 });
    story.addTask(task);

    const result = policy.canConnect({ source: story, target: task });

    expect(result.allowed).toBe(false);
  });
});

