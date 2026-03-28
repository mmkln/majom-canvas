import { describe, expect, it, vi } from 'vitest';
import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { AI_ASSISTANT_CONTEXT_CHANGED_EVENT } from '../../../ai-assistant/aiAssistantEvents.ts';
import { PlanningCanvasElementSemantics } from './PlanningCanvasElementSemantics.ts';
import type { PlanningCanvasHierarchy } from './PlanningCanvasRelationSemantics.ts';

describe('PlanningCanvasElementSemantics', () => {
  it('classifies planning elements by kind', () => {
    const semantics = new PlanningCanvasElementSemantics();

    expect(semantics.getKind(new TaskElement({}))).toBe('task');
    expect(semantics.getKind(new StoryElement({}))).toBe('story');
    expect(semantics.getKind(new GoalElement({}))).toBe('goal');
  });

  it('builds story layout meta with dimensions and selection state', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const story = new StoryElement({
      id: 'story-1',
      width: 400,
      height: 300,
    });
    const scene = {
      isFocused: vi.fn((element) => element === story),
      isHighlighted: vi.fn(() => false),
    };

    expect(
      semantics.getLayoutMeta(
        scene as unknown as Parameters<
          PlanningCanvasElementSemantics['getLayoutMeta']
        >[0],
        story
      )
    ).toEqual({
      width: 400,
      height: 300,
      focused: true,
      highlighted: false,
    });
  });

  it('stores goal scale in layout meta and rejects unsupported record kinds', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const goal = new GoalElement({
      id: 'goal-1',
      scale: 3,
    });
    const scene = {
      isFocused: vi.fn(() => false),
      isHighlighted: vi.fn(() => true),
    };

    expect(
      semantics.getLayoutMeta(
        scene as unknown as Parameters<
          PlanningCanvasElementSemantics['getLayoutMeta']
        >[0],
        goal
      )
    ).toEqual({
      scale: 3,
      focused: false,
      highlighted: true,
    });

    expect(() =>
      semantics.materializeNode({
        id: 'unknown-1',
        kind: 'unknown',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        title: 'Unknown',
        description: '',
      })
    ).toThrow('Unsupported planning record kind: unknown');
  });

  it('resolves hierarchy parent and child ids by planning element kind', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const goal = new GoalElement({ id: 'goal-1' });
    const story = new StoryElement({ id: 'story-1' });
    const task = new TaskElement({ id: 'task-1' });
    const hierarchy: PlanningCanvasHierarchy = {
      goalParentById: new Map([['goal-1', null]]),
      storyParentById: new Map([['story-1', 'goal-1']]),
      taskParentById: new Map([['task-1', 'story-1']]),
      goalChildIds: new Map([['goal-1', ['story-1']]]),
      storyChildIds: new Map([['story-1', ['task-1']]]),
    };

    expect(semantics.getHierarchyParentId(goal, hierarchy)).toBeNull();
    expect(semantics.getHierarchyParentId(story, hierarchy)).toBe('goal-1');
    expect(semantics.getHierarchyParentId(task, hierarchy)).toBe('story-1');
    expect(semantics.getHierarchyChildIds(goal, hierarchy)).toEqual([
      'story-1',
    ]);
    expect(semantics.getHierarchyChildIds(story, hierarchy)).toEqual([
      'task-1',
    ]);
    expect(semantics.getHierarchyChildIds(task, hierarchy)).toEqual([]);
  });

  it('emits an empty AI assistant context snapshot', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const originalWindow = globalThis.window;
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });

    semantics.emitEmptyAiAssistantContext();

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AI_ASSISTANT_CONTEXT_CHANGED_EVENT,
        detail: expect.objectContaining({
          canvasId: null,
          elements: [],
          connections: [],
          recentActivity: [],
        }),
      })
    );

    vi.unstubAllGlobals();
    if (originalWindow) {
      vi.stubGlobal('window', originalWindow);
    }
  });

  it('builds snapshot summary and highlighted ids from planning elements', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const goal = new GoalElement({ id: 'goal-1' });
    const story = new StoryElement({ id: 'story-1' });
    const task = new TaskElement({ id: 'task-1' });
    const scene = {
      getHighlightedElementIds: vi.fn(() => ['story-1', 'missing']),
    };

    expect(
      semantics.buildSnapshotSummary([goal, story, task], [story, task])
    ).toEqual({
      goalCount: 1,
      storyCount: 1,
      taskCount: 1,
      selectedCount: 2,
    });
    expect(
      semantics.getHighlightedElementIds(
        scene as unknown as Parameters<
          PlanningCanvasElementSemantics['getHighlightedElementIds']
        >[0],
        [goal, story, task]
      )
    ).toEqual(['story-1']);
  });

  it('builds viewport visibility from planning element bounds', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const visibleTask = new TaskElement({
      id: 'task-visible',
      x: 80,
      y: 40,
    });
    visibleTask.width = 120;
    visibleTask.height = 80;
    const hiddenTask = new TaskElement({
      id: 'task-hidden',
      x: 900,
      y: 900,
    });
    hiddenTask.width = 120;
    hiddenTask.height = 80;

    expect(
      semantics.buildViewport([visibleTask, hiddenTask], {
        minX: 0,
        minY: 0,
        maxX: 400,
        maxY: 300,
      })
    ).toEqual({
      minX: 0,
      minY: 0,
      maxX: 400,
      maxY: 300,
      visibleElementIds: ['task-visible'],
    });
  });

  it('filters arbitrary canvas elements down to planning elements', () => {
    const semantics = new PlanningCanvasElementSemantics();
    const task = new TaskElement({ id: 'task-1' });
    const otherElement = { id: 'misc-1' } as ICanvasElement;

    expect(semantics.getElements([task, otherElement])).toEqual([task]);
  });
});
