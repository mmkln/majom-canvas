// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { createAppRuntime } from '../../../../app-runtime/index.ts';
import type { AppRuntime } from '../../../../app-runtime/index.ts';
import Connection from '../../core/shapes/Connection.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type { CanvasManager } from '../../core/managers/CanvasManager.ts';
import { PlanningCanvasInteractionAdapter, PLANNING_CANVAS_ACTION_REQUESTED_EVENT } from './PlanningCanvasInteractionAdapter.ts';

function createRuntime(): AppRuntime {
  return createAppRuntime({ initialLocale: 'en' });
}

function createCanvasManagerStub(): CanvasManager {
  return {
    getCanvas: () =>
      ({
        getBoundingClientRect: () => new DOMRect(0, 0, 1200, 800),
      }) as unknown as HTMLCanvasElement,
  } as unknown as CanvasManager;
}

function createAdapter() {
  return new PlanningCanvasInteractionAdapter();
}

describe('PlanningCanvasInteractionAdapter', () => {
  it('exposes creation actions for the canvas', () => {
    const adapter = createAdapter();
    const scene = new Scene();
    const groups = adapter.getCreationActions?.({
      scene,
      canvasManager: createCanvasManagerStub(),
      runtime: createRuntime(),
      sceneX: 120,
      sceneY: 180,
      selectedElements: [],
    });

    expect(groups).toHaveLength(1);
    expect(groups?.[0].title).toBe('Create');
    expect(groups?.[0].actions.map((action) => action.id)).toEqual([
      'planning:create-goal',
      'planning:create-story',
      'planning:create-task',
    ]);
    expect(groups?.[0].actions[0].tone).toBe('primary');
  });

  it('exposes context actions for story, goal and connection targets', () => {
    const adapter = createAdapter();
    const scene = new Scene();
    const runtime = createRuntime();
    const canvasManager = createCanvasManagerStub();

    const story = new StoryElement({ id: 'story-1', title: 'Story' });
    const goal = new GoalElement({ id: 'goal-1', title: 'Goal' });
    const connection = new Connection('from-1', 'to-1', 'connection-1');

    const storyGroups = adapter.getContextMenuActions?.({
      scene,
      canvasManager,
      runtime,
      sceneX: 320,
      sceneY: 420,
      target: story,
      selectedElements: [story],
    });
    expect(storyGroups?.[0].title).toBe('Story');
    expect(storyGroups?.[0].actions.map((action) => action.label)).toEqual([
      'Edit',
      'Copy',
      'Delete',
    ]);
    expect(storyGroups?.[1].title).toBe('Planning');
    expect(storyGroups?.[1].actions.map((action) => action.id)).toEqual([
      'planning:create-task-under-story',
      'planning:add-existing-task',
    ]);

    const goalGroups = adapter.getContextMenuActions?.({
      scene,
      canvasManager,
      runtime,
      sceneX: 320,
      sceneY: 420,
      target: goal,
      selectedElements: [goal],
    });
    expect(goalGroups?.[0].title).toBe('Goal');
    expect(goalGroups?.[1].actions.map((action) => action.id)).toEqual([
      'planning:create-story-under-goal',
      'planning:add-existing-story',
    ]);

    const connectionGroups = adapter.getContextMenuActions?.({
      scene,
      canvasManager,
      runtime,
      sceneX: 320,
      sceneY: 420,
      target: connection,
      selectedElements: [connection],
    });
    expect(connectionGroups).toHaveLength(1);
    expect(connectionGroups?.[0].title).toBe('Connection');
    expect(connectionGroups?.[0].actions.map((action) => action.id)).toEqual([
      'planning:delete-connection',
    ]);
  });

  it('exposes selection actions and emits execution requests', () => {
    const adapter = createAdapter();
    const scene = new Scene();
    const runtime = createRuntime();
    const canvasManager = createCanvasManagerStub();
    const goal = new GoalElement({ id: 'goal-1', title: 'Goal' });
    const story = new StoryElement({ id: 'story-1', title: 'Story' });
    const task = new TaskElement({ id: 'task-1', title: 'Task' });

    const multiSelectionGroups = adapter.getSelectionActions?.({
      scene,
      canvasManager,
      runtime,
      selectedElements: [goal, story, task],
    });
    expect(multiSelectionGroups).toHaveLength(1);
    expect(multiSelectionGroups?.[0].title).toBe('Selection');
    expect(multiSelectionGroups?.[0].actions.map((action) => action.id)).toEqual([
      'planning:connect-selected',
      'planning:copy-selection',
      'planning:delete-selection',
    ]);

    const events: CustomEvent[] = [];
    const eventHandler = (event: Event): void => {
      events.push(event as CustomEvent);
    };
    window.addEventListener(
      PLANNING_CANVAS_ACTION_REQUESTED_EVENT,
      eventHandler
    );

    try {
      adapter.executeAction?.({
        scene,
        canvasManager,
        runtime,
        actionId: 'planning:connect-selected',
        target: story,
        selectedElements: [goal, story, task],
        sceneX: 640,
        sceneY: 360,
      });

      expect(events).toHaveLength(1);
      expect(events[0].detail).toEqual({
        actionId: 'planning:connect-selected',
        targetId: 'story-1',
        targetKind: 'story',
        selectedElementIds: ['goal-1', 'story-1', 'task-1'],
        sceneX: 640,
        sceneY: 360,
      });
    } finally {
      window.removeEventListener(
        PLANNING_CANVAS_ACTION_REQUESTED_EVENT,
        eventHandler
      );
    }
  });
});
