import { describe, expect, it } from 'vitest';
import type { CanvasAlignmentContext } from '../CanvasAlignmentAdapter.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PlanningCanvasAlignmentAdapter } from './PlanningCanvasAlignmentAdapter.ts';

function createContext(
  elements: CanvasAlignmentContext['elements'],
  movingElements: CanvasAlignmentContext['movingElements'] = []
): CanvasAlignmentContext {
  return {
    elements,
    movingElements,
    viewport: null,
    mode: 'move',
    preferences: {
      enabled: true,
      snapEnabled: true,
      showSpacingGuides: false,
      showContainerGuides: false,
      showViewportCenterGuides: false,
      strictness: 'default',
    },
  };
}

describe('PlanningCanvasAlignmentAdapter', () => {
  it('assigns container scope and planning priorities to planning nodes', () => {
    const adapter = new PlanningCanvasAlignmentAdapter();
    const story = new StoryElement({
      id: 'story-1',
      x: 320,
      y: 80,
      width: 344,
      height: 240,
    });
    const task = new TaskElement({ id: 'task-1', x: 360, y: 140 });
    const looseTask = new TaskElement({ id: 'task-2', x: 40, y: 40 });
    const goal = new GoalElement({ id: 'goal-1', x: 840, y: 120 });
    story.addTask(task);

    const subjects = adapter.getReferenceSubjects(
      createContext([story, task, looseTask, goal])
    );
    const taskSubject = subjects.find((subject) => subject.id === task.id);
    const looseTaskSubject = subjects.find(
      (subject) => subject.id === looseTask.id
    );
    const storySubject = subjects.find((subject) => subject.id === story.id);
    const goalSubject = subjects.find((subject) => subject.id === goal.id);

    expect(taskSubject).toMatchObject({
      role: 'element',
      scopeKind: 'container',
      scopeId: story.id,
      priority: 320,
    });
    expect(looseTaskSubject).toMatchObject({
      role: 'element',
      scopeKind: 'global',
      scopeId: null,
      priority: 320,
    });
    expect(storySubject).toMatchObject({
      role: 'container',
      scopeKind: 'global',
      scopeId: null,
      priority: 220,
    });
    expect(goalSubject).toMatchObject({
      role: 'element',
      scopeKind: 'global',
      scopeId: null,
      priority: 180,
    });
  });

  it('excludes moving elements from planning reference subjects', () => {
    const adapter = new PlanningCanvasAlignmentAdapter();
    const story = new StoryElement({
      id: 'story-1',
      x: 320,
      y: 80,
      width: 344,
      height: 240,
    });
    const task = new TaskElement({ id: 'task-1', x: 360, y: 140 });
    story.addTask(task);

    const subjects = adapter.getReferenceSubjects(
      createContext([story, task], [task])
    );

    expect(subjects.find((subject) => subject.id === task.id)).toBeUndefined();
    expect(subjects.find((subject) => subject.id === story.id)).toBeDefined();
  });

  it('assigns container scope to moving tasks when they stay within the same story', () => {
    const adapter = new PlanningCanvasAlignmentAdapter();
    const story = new StoryElement({
      id: 'story-1',
      x: 320,
      y: 80,
      width: 344,
      height: 240,
    });
    const taskA = new TaskElement({ id: 'task-a', x: 360, y: 140 });
    const taskB = new TaskElement({ id: 'task-b', x: 360, y: 280 });
    story.addTask(taskA);
    story.addTask(taskB);

    const movingSubject = adapter.getMovingSubject(
      createContext([story, taskA, taskB], [taskA, taskB])
    );

    expect(movingSubject).toMatchObject({
      role: 'element',
      scopeKind: 'container',
      scopeId: story.id,
      priority: 320,
    });
  });

  it('exposes a virtual viewport subject for viewport-center alignment', () => {
    const adapter = new PlanningCanvasAlignmentAdapter();
    const story = new StoryElement({
      id: 'story-1',
      x: 320,
      y: 80,
      width: 344,
      height: 240,
    });

    const virtualSubjects = adapter.getVirtualSubjects({
      ...createContext([story]),
      viewport: {
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
        left: 0,
        right: 1200,
        top: 0,
        bottom: 800,
        centerX: 600,
        centerY: 400,
      },
    });

    expect(virtualSubjects).toHaveLength(1);
    expect(virtualSubjects[0]).toMatchObject({
      id: '__viewport__',
      role: 'viewport',
      scopeKind: 'viewport',
      bounds: {
        centerX: 600,
        centerY: 400,
      },
    });
  });
});
