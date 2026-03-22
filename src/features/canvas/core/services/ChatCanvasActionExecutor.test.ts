import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { ChatCanvasActionExecutor } from './ChatCanvasActionExecutor.ts';
import type { WorkspaceChatActionExecutionRequest } from '../../../shell/workspaceChatActions.ts';

function createExecutor(scene: Scene) {
  return new ChatCanvasActionExecutor({
    scene,
    canvasManager: {
      draw: vi.fn(),
      getCanvas: () => ({ width: 1000, height: 800 } as HTMLCanvasElement),
      getPanZoomManager: () =>
        ({
          scrollX: 0,
          scrollY: 0,
          scale: 1,
        }) as {
          scrollX: number;
          scrollY: number;
          scale: number;
        },
    } as any,
  });
}

function makeRequest(
  action: WorkspaceChatActionExecutionRequest['action'],
  allowSelectionTargeting = true
): WorkspaceChatActionExecutionRequest {
  return {
    action,
    allowSelectionTargeting,
  };
}

describe('ChatCanvasActionExecutor', () => {
  beforeEach(() => {
    historyService.reset();
    (globalThis as { window?: unknown }).window = {
      dispatchEvent: vi.fn(),
    };
  });

  it('creates a task inside the selected story and preserves highest priority', async () => {
    const scene = new Scene();
    const story = new StoryElement({
      id: 'story-1',
      x: 100,
      y: 100,
      width: 760,
      height: 320,
      title: 'Checkout flow',
    });
    scene.addElement(story);
    scene.setSelected([story]);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'action-task',
        kind: 'create_task',
        label: 'Create task',
        title: 'Build payment form',
        description: 'Implement PCI-safe form validation.',
        priority: 'highest',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    const tasks = scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('Build payment form');
    expect(tasks[0]?.priority).toBe('highest');
    expect(story.tasks.map((task) => task.id)).toContain(tasks[0]?.id);
    expect(historyService.canUndo()).toBe(true);
  });

  it('falls back to viewport-center standalone task when selection targeting is disabled', async () => {
    const scene = new Scene();
    const story = new StoryElement({
      id: 'story-1',
      x: 100,
      y: 100,
      width: 760,
      height: 320,
      title: 'Checkout flow',
    });
    scene.addElement(story);
    scene.setSelected([story]);
    const executor = createExecutor(scene);

    await executor.execute(
      makeRequest(
        {
          id: 'action-task',
          kind: 'create_task',
          label: 'Create task',
          title: 'Draft standalone task',
          priority: 'lowest',
          status: 'idle',
        },
        false
      )
    );

    const tasks = scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.x).toBe(364);
    expect(tasks[0]?.y).toBe(344);
    expect(tasks[0]?.priority).toBe('lowest');
    expect(story.tasks).toHaveLength(0);
  });

  it('creates a story under the selected goal and adds a parent-child connection', async () => {
    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-1',
      x: 80,
      y: 80,
      title: 'Launch v2',
    });
    scene.addElement(goal);
    scene.setSelected([goal]);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'action-story',
        kind: 'create_story',
        label: 'Create story',
        title: 'Refund flow',
        description: 'Support refund initiation and follow-up.',
        priority: 'highest',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    const stories = scene
      .getElements()
      .filter((element): element is StoryElement => element instanceof StoryElement);
    expect(stories).toHaveLength(1);
    expect(stories[0]?.title).toBe('Refund flow');
    expect(stories[0]?.priority).toBe('highest');
    const connections = scene.getConnections();
    expect(connections).toHaveLength(1);
    expect(connections[0]?.relationType).toBe(ConnectionRelationType.ParentChild);
  });

  it('creates a goal at viewport center and preserves lowest priority', async () => {
    const scene = new Scene();
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'action-goal',
        kind: 'create_goal',
        label: 'Create goal',
        title: 'Improve trust',
        description: 'Make the post-purchase experience clearer.',
        priority: 'lowest',
        elementStatus: 'in-progress',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    const goals = scene
      .getElements()
      .filter((element): element is GoalElement => element instanceof GoalElement);
    expect(goals).toHaveLength(1);
    expect(goals[0]?.priority).toBe('lowest');
    expect(goals[0]?.status).toBe('in-progress');
    expect(goals[0]?.x).toBe(360);
    expect(goals[0]?.y).toBe(260);
  });

  it('applies a suggested non-hierarchical relation through the command stack', async () => {
    const scene = new Scene();
    const firstTask = new TaskElement({
      id: 'task-1',
      x: 80,
      y: 80,
      title: 'Validate payment form',
    });
    const secondTask = new TaskElement({
      id: 'task-2',
      x: 320,
      y: 80,
      title: 'Render order review',
    });
    scene.addElement(firstTask);
    scene.addElement(secondTask);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'relation-1',
        kind: 'suggest_relation',
        label: 'Add relation',
        title: 'Add blocking relation',
        relationType: 'blocks',
        fromId: 'task-1',
        toId: 'task-2',
        fromLabel: 'Validate payment form',
        toLabel: 'Render order review',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]?.relationType).toBe(
      ConnectionRelationType.Blocks
    );
    expect(historyService.canUndo()).toBe(true);
  });

  it('applies a suggested update and preserves undo support', async () => {
    const scene = new Scene();
    const story = new StoryElement({
      id: 'story-1',
      x: 100,
      y: 100,
      title: 'Checkout flow',
      priority: 'medium',
    });
    scene.addElement(story);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'update-1',
        kind: 'suggest_update',
        label: 'Apply update',
        title: 'Refine checkout story',
        elementId: 'story-1',
        elementKind: 'story',
        targetTitle: 'Checkout flow',
        patch: {
          title: 'Checkout validation flow',
          priority: 'highest',
          elementStatus: 'in-progress',
        },
        reason: 'The current story title is too broad for the selected scope.',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    expect(story.title).toBe('Checkout validation flow');
    expect(story.priority).toBe('highest');
    expect(story.status).toBe('in-progress');
    expect(historyService.canUndo()).toBe(true);
  });
});
