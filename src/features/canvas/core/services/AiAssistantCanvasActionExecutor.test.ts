import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { AiAssistantCanvasActionExecutor } from './AiAssistantCanvasActionExecutor.ts';
import type { AiAssistantActionExecutionRequest } from '../../../ai-assistant/aiAssistantActions.ts';

function createExecutor(scene: Scene) {
  return new AiAssistantCanvasActionExecutor({
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
  action: AiAssistantActionExecutionRequest['action'],
  allowSelectionTargeting = true
): AiAssistantActionExecutionRequest {
  return {
    action,
    allowSelectionTargeting,
  };
}

function rectsOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

describe('AiAssistantCanvasActionExecutor', () => {
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

  it('lays out standalone task batches without overlap', async () => {
    const scene = new Scene();
    const executor = createExecutor(scene);

    const results = await executor.executeBatch([
      makeRequest(
        {
          id: 'action-task-1',
          kind: 'create_task',
          label: 'Create task',
          title: 'Draft first standalone task',
          status: 'idle',
        },
        false
      ),
      makeRequest(
        {
          id: 'action-task-2',
          kind: 'create_task',
          label: 'Create task',
          title: 'Draft second standalone task',
          status: 'idle',
        },
        false
      ),
    ]);

    expect(results.map((result) => result.status)).toEqual(['applied', 'applied']);
    const tasks = scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    expect(tasks).toHaveLength(2);
    expect(
      rectsOverlap(
        {
          x: tasks[0]!.x,
          y: tasks[0]!.y,
          width: TaskElement.width,
          height: TaskElement.height,
        },
        {
          x: tasks[1]!.x,
          y: tasks[1]!.y,
          width: TaskElement.width,
          height: TaskElement.height,
        }
      )
    ).toBe(false);

    historyService.undo();
    expect(
      scene
        .getElements()
        .filter((element): element is TaskElement => element instanceof TaskElement)
    ).toHaveLength(0);
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

  it('lays out multiple created stories under the same goal without overlap', async () => {
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

    const results = await executor.executeBatch([
      makeRequest({
        id: 'action-story-1',
        kind: 'create_story',
        label: 'Create story',
        title: 'Refund flow',
        status: 'idle',
      }),
      makeRequest({
        id: 'action-story-2',
        kind: 'create_story',
        label: 'Create story',
        title: 'Chargeback flow',
        status: 'idle',
      }),
    ]);

    expect(results.map((result) => result.status)).toEqual(['applied', 'applied']);
    const stories = scene
      .getElements()
      .filter((element): element is StoryElement => element instanceof StoryElement);
    expect(stories).toHaveLength(2);
    expect(
      rectsOverlap(
        {
          x: stories[0]!.x,
          y: stories[0]!.y,
          width: stories[0]!.width,
          height: stories[0]!.height,
        },
        {
          x: stories[1]!.x,
          y: stories[1]!.y,
          width: stories[1]!.width,
          height: stories[1]!.height,
        }
      )
    ).toBe(false);
    expect(
      scene
        .getConnections()
        .filter(
          (connection) =>
            connection.relationType === ConnectionRelationType.ParentChild
        )
    ).toHaveLength(2);
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

  it('creates a child goal under an existing goal target', async () => {
    const scene = new Scene();
    const parentGoal = new GoalElement({
      id: 'goal-parent',
      x: 120,
      y: 120,
      title: 'Master marketing automation',
    });
    scene.addElement(parentGoal);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'action-goal-child',
        kind: 'create_goal',
        label: 'Create goal',
        title: 'Learn automation fundamentals',
        target: {
          kind: 'goal',
          id: 'goal-parent',
        },
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    const goals = scene
      .getElements()
      .filter((element): element is GoalElement => element instanceof GoalElement);
    expect(goals).toHaveLength(2);
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]).toMatchObject({
      relationType: ConnectionRelationType.ParentChild,
      fromId: 'goal-parent',
    });
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

  it('removes an existing non-hierarchical relation through the command stack', async () => {
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
    await createExecutor(scene).execute(
      makeRequest({
        id: 'relation-existing',
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

    const executor = createExecutor(scene);
    const result = await executor.execute(
      makeRequest({
        id: 'relation-remove-1',
        kind: 'remove_relation',
        label: 'Remove relation',
        title: 'Remove blocking relation',
        relationType: 'blocks',
        fromId: 'task-1',
        toId: 'task-2',
        fromLabel: 'Validate payment form',
        toLabel: 'Render order review',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    expect(scene.getConnections()).toHaveLength(0);
    expect(historyService.canUndo()).toBe(true);
  });

  it('updates an existing relation type and normalizes direction for relates_to links', async () => {
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
    await createExecutor(scene).execute(
      makeRequest({
        id: 'relation-existing',
        kind: 'suggest_relation',
        label: 'Add relation',
        title: 'Add related relation',
        relationType: 'relates_to',
        fromId: 'task-2',
        toId: 'task-1',
        fromLabel: 'Render order review',
        toLabel: 'Validate payment form',
        status: 'idle',
      })
    );

    const executor = createExecutor(scene);
    const result = await executor.execute(
      makeRequest({
        id: 'relation-update-1',
        kind: 'update_relation',
        label: 'Update relation',
        title: 'Change related relation to blocker',
        currentRelationType: 'relates_to',
        nextRelationType: 'blocks',
        fromId: 'task-1',
        toId: 'task-2',
        fromLabel: 'Validate payment form',
        toLabel: 'Render order review',
        reason: 'Validation should block review, not merely relate to it.',
        status: 'idle',
      })
    );

    expect(result.status).toBe('applied');
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]?.relationType).toBe(
      ConnectionRelationType.Blocks
    );
    expect(scene.getConnections()[0]?.fromId).toBe('task-1');
    expect(scene.getConnections()[0]?.toId).toBe('task-2');
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

  it('creates a strategic goal blueprint atomically and supports undo/redo', async () => {
    const scene = new Scene();
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'plan-blueprint-1',
        kind: 'create_goal_blueprint',
        label: 'Create plan',
        title: 'Marketing automation learning plan',
        status: 'idle',
        pattern: 'goal_tree_with_sequence',
        summary: 'Strategic starter structure for the topic.',
        goals: [
          { ref: 'root', title: 'Master marketing automation strategically' },
          {
            ref: 'fundamentals',
            title: 'Learn core automation concepts',
            parentRef: 'root',
          },
          {
            ref: 'practice',
            title: 'Build first automation workflows',
            parentRef: 'root',
          },
        ],
        relations: [
          {
            fromRef: 'fundamentals',
            toRef: 'practice',
            relationType: 'leads_to',
          },
        ],
      })
    );

    expect(result.status).toBe('applied');
    expect(
      scene
        .getElements()
        .filter((element): element is GoalElement => element instanceof GoalElement)
    ).toHaveLength(3);
    expect(scene.getConnections()).toHaveLength(3);
    expect(
      scene
        .getConnections()
        .filter(
          (connection) =>
            connection.relationType === ConnectionRelationType.ParentChild
        )
    ).toHaveLength(2);
    expect(
      scene
        .getConnections()
        .filter(
          (connection) => connection.relationType === ConnectionRelationType.LeadsTo
        )
    ).toHaveLength(1);

    historyService.undo();
    expect(
      scene
        .getElements()
        .filter((element): element is GoalElement => element instanceof GoalElement)
    ).toHaveLength(0);
    expect(scene.getConnections()).toHaveLength(0);

    historyService.redo();
    expect(
      scene
        .getElements()
        .filter((element): element is GoalElement => element instanceof GoalElement)
    ).toHaveLength(3);
    expect(scene.getConnections()).toHaveLength(3);
  });

  it('attaches blueprint roots under a targeted existing goal', async () => {
    const scene = new Scene();
    const parentGoal = new GoalElement({
      id: 'goal-parent',
      x: 120,
      y: 120,
      title: 'Master marketing automation',
    });
    scene.addElement(parentGoal);
    const executor = createExecutor(scene);

    const result = await executor.execute(
      makeRequest({
        id: 'plan-blueprint-2',
        kind: 'create_goal_blueprint',
        label: 'Create plan',
        title: 'Strategic subgoals',
        status: 'idle',
        target: {
          kind: 'goal',
          id: 'goal-parent',
        },
        pattern: 'goal_tree',
        goals: [
          { ref: 'fundamentals', title: 'Learn the fundamentals' },
          { ref: 'practice', title: 'Build the first workflows' },
        ],
        relations: [],
      })
    );

    expect(result.status).toBe('applied');
    expect(
      scene
        .getConnections()
        .filter(
          (connection) =>
            connection.relationType === ConnectionRelationType.ParentChild &&
            connection.fromId === 'goal-parent'
        )
    ).toHaveLength(2);
  });
});
