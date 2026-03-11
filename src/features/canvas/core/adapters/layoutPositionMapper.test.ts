import { describe, expect, it } from 'vitest';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import {
  dedupeLayoutPositions,
  mapPlanningElementsToLayoutPositions,
} from './layoutPositionMapper.ts';

describe('layoutPositionMapper', () => {
  it('maps planning elements to layout positions with focused/highlighted meta', () => {
    const task = new TaskElement({ id: 'task-1', uuid: 'task-uuid', x: 10, y: 20 });
    const story = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid',
      x: 100,
      y: 200,
      width: 320,
      height: 220,
    });
    const goal = new GoalElement({
      id: 'goal-1',
      uuid: 'goal-uuid',
      x: 500,
      y: 600,
      scale: 3,
    });

    const mapped = mapPlanningElementsToLayoutPositions([task, story, goal], {
      isFocused: (element) => element.id === story.id,
      isHighlighted: (element) => element.id === goal.id,
    });

    expect(mapped.missingIds).toEqual([]);
    expect(mapped.positions).toEqual([
      {
        element_type: 'task',
        element_uuid: 'task-uuid',
        x: 10,
        y: 20,
        meta: { focused: false, highlighted: false },
      },
      {
        element_type: 'story',
        element_uuid: 'story-uuid',
        x: 100,
        y: 200,
        meta: { width: 320, height: 220, focused: true, highlighted: false },
      },
      {
        element_type: 'goal',
        element_uuid: 'goal-uuid',
        x: 500,
        y: 600,
        meta: { goalScale: 3, focused: false, highlighted: true },
      },
    ]);
  });

  it('collects missing uuids and skips those positions', () => {
    const task = new TaskElement({ id: 'task-1', x: 10, y: 20 });

    const mapped = mapPlanningElementsToLayoutPositions([task], {
      isFocused: () => false,
      isHighlighted: () => false,
    });

    expect(mapped.positions).toEqual([]);
    expect(mapped.missingIds).toEqual(['task-1']);
  });

  it('dedupes positions by element_type and element_uuid', () => {
    const deduped = dedupeLayoutPositions([
      { element_type: 'task', element_uuid: 't-1', x: 1, y: 2 },
      { element_type: 'task', element_uuid: 't-1', x: 3, y: 4 },
      { element_type: 'story', element_uuid: 's-1', x: 10, y: 20 },
    ]);

    expect(deduped).toEqual([
      { element_type: 'task', element_uuid: 't-1', x: 3, y: 4 },
      { element_type: 'story', element_uuid: 's-1', x: 10, y: 20 },
    ]);
  });
});

