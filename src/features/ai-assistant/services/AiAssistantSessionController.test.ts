import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantSelectionItem,
} from '../aiAssistantEvents.ts';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import { AiAssistantSessionController } from './AiAssistantSessionController.ts';
import type { AiAssistantMessage } from './AiAssistantTypes.ts';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createLocalStorageMock() {
  const storage = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
  };
}

function makeContext(
  canvasId: string,
  canvasTitle: string
): AiAssistantCanvasSnapshot {
  return {
    canvasId,
    canvasTitle,
    summary: {
      goalCount: 2,
      storyCount: 1,
      taskCount: 3,
      selectedCount: 0,
    },
    selectionIds: [],
    focusId: null,
    highlightedIds: [],
    elements: [],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

function makeEmptyContext(
  canvasId: string,
  canvasTitle: string
): AiAssistantCanvasSnapshot {
  return {
    canvasId,
    canvasTitle,
    summary: {
      goalCount: 0,
      storyCount: 0,
      taskCount: 0,
      selectedCount: 0,
    },
    selectionIds: [],
    focusId: null,
    highlightedIds: [],
    elements: [],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

function makeSelectionItem(
  id: string,
  kind: 'goal' | 'story' | 'task',
  title: string
): AiAssistantSelectionItem {
  return {
    id,
    kind,
    title,
    description: '',
  };
}

function makeContextWithElements(
  canvasId: string,
  canvasTitle: string,
  items: AiAssistantSelectionItem[],
  options: {
    selectionIds?: string[];
    focusId?: string | null;
  } = {}
): AiAssistantCanvasSnapshot {
  const selectionIds = options.selectionIds ?? [];
  const selectionIdSet = new Set(selectionIds);
  return {
    canvasId,
    canvasTitle,
    summary: {
      goalCount: items.filter((item) => item.kind === 'goal').length,
      storyCount: items.filter((item) => item.kind === 'story').length,
      taskCount: items.filter((item) => item.kind === 'task').length,
      selectedCount: selectionIds.length,
    },
    selectionIds,
    focusId: options.focusId ?? null,
    highlightedIds: [],
    elements: items.map((item) => ({
      ...item,
      parentId: null,
      childIds: [],
      selected: selectionIdSet.has(item.id),
      focused: (options.focusId ?? null) === item.id,
      highlighted: false,
    })),
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

function createMessage(
  role: 'assistant' | 'user' | 'system',
  content: string,
  createdAt = Date.now(),
  actions?: AiAssistantAction[],
  kind: 'default' | 'system' | 'command' = 'default',
  requestPrompt?: string,
  requestIntent?:
    | 'review'
    | 'breakdown'
    | 'strategic_plan'
    | 'dependencies'
    | 'missing'
    | 'clarify'
    | 'fill_details'
): AiAssistantMessage {
  return {
    id: `chat-${Math.random().toString(36).slice(2, 10)}`,
    role,
    kind,
    content,
    createdAt,
    requestPrompt,
    requestIntent,
    actions,
  };
}

function createSystemMessage(
  content: string,
  createdAt = Date.now()
): AiAssistantMessage {
  return createMessage('system', content, createdAt, undefined, 'system');
}

describe('AiAssistantSessionController', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      localStorage: createLocalStorageMock(),
    };
  });

  afterEach(() => {
    if (typeof originalWindow === 'undefined') {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  it('keeps an in-flight reply in the original conversation scope after switching canvas', async () => {
    const deferred = createDeferred<AiAssistantMessage>();
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(() => deferred.promise),
    };
    const controller = new AiAssistantSessionController({ service });
    const contextA = makeContext('canvas-a', 'Canvas A');
    const contextB = makeContext('canvas-b', 'Canvas B');

    controller.setContext(contextA);
    const submitPromise = controller.submitPrompt('First prompt');
    controller.setContext(contextB);

    expect(controller.getState().messages).toHaveLength(1);
    expect(controller.getState().messages[0]?.content).toContain('Canvas B');

    deferred.resolve(createMessage('assistant', 'Reply for A'));
    await submitPromise;

    expect(
      controller.getState().messages.some((message) => message.content === 'Reply for A')
    ).toBe(false);

    controller.setContext(contextA);
    expect(controller.getState().messages.map((message) => message.content)).toEqual([
      'Welcome Canvas A',
      'First prompt',
      'Reply for A',
    ]);
  });

  it('clears only the active conversation scope', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new AiAssistantSessionController({ service });
    const contextA = makeContext('canvas-a', 'Canvas A');
    const contextB = makeContext('canvas-b', 'Canvas B');

    controller.setContext(contextA);
    await controller.submitPrompt('Prompt A');
    controller.setContext(contextB);
    await controller.submitPrompt('Prompt B');

    controller.clearConversation();
    expect(controller.getState().messages).toHaveLength(1);
    expect(controller.getState().messages[0]?.content).toBe('Welcome Canvas B');

    controller.setContext(contextA);
    expect(controller.getState().messages.map((message) => message.content)).toEqual([
      'Welcome Canvas A',
      'Prompt A',
      'Reply',
    ]);
  });

  it('refreshes the seed message when the active context changes and no user messages exist', () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new AiAssistantSessionController({ service });

    controller.setContext(makeContext('canvas-a', 'Canvas A'));
    expect(controller.getState().messages[0]?.content).toBe('Welcome Canvas A');

    controller.setContext(makeContext('canvas-a', 'Canvas A v2'));
    expect(controller.getState().messages[0]?.content).toBe('Welcome Canvas A v2');
  });

  it('can disable canvas context for the active conversation scope', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Reply'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => [
        {
          id: 'summarize',
          label: 'Summarize canvas',
          prompt: 'Summarize the current canvas',
        },
      ]),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    expect(controller.getState().contextEnabled).toBe(true);
    expect(controller.getState().context?.canvasTitle).toBe('Canvas A');
    expect(controller.getState().quickActions).toHaveLength(1);

    controller.setContextEnabled(false);

    expect(controller.getState().contextEnabled).toBe(false);
    expect(controller.getState().context).toBeNull();
    expect(controller.getState().quickActions).toHaveLength(0);
    expect(controller.getState().messages).toHaveLength(0);
    expect(controller.getState().composerPlaceholder).toBe(
      'Ask without canvas context'
    );

    await controller.submitPrompt('Hello');

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].snapshot).toBeNull();
  });

  it('exposes reply progress while a response is in flight', async () => {
    const deferred = createDeferred<AiAssistantMessage>();
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn((request: { onProgress?: (progress: object) => void }) => {
        request.onProgress?.({
          phase: 'tools',
          label: 'Checking workspace context',
          detail: 'Inspecting the focus item and nearby structure.',
          currentStep: 1,
          totalSteps: 3,
        });
        return deferred.promise;
      }),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    const submitPromise = controller.submitPrompt('Review checkout risks');

    expect(controller.getState().replying).toBe(true);
    expect(controller.getState().replyProgress).toMatchObject({
      phase: 'tools',
      label: 'Checking workspace context',
      detail: 'Inspecting the focus item and nearby structure.',
      currentStep: 1,
      totalSteps: 3,
    });

    deferred.resolve(createMessage('assistant', 'Reply'));
    await submitPromise;

    expect(controller.getState().replying).toBe(false);
    expect(controller.getState().replyProgress).toBeNull();
  });

  it('renders prepared intent submissions as command messages instead of raw user prompts', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Linked suggestions'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    const context = makeContext('canvas-a', 'Canvas A');
    controller.setContext(context);

    await controller.submitPreparedSubmission({
      prompt: 'Analyze the selected cluster and suggest relations.',
      snapshot: context,
      contextMode: 'selection',
      source: 'intent',
      intent: 'dependencies',
      profile: 'dependency-review',
      requestLabel: 'Connect selected',
      requestMessageKind: 'command',
    });

    const messages = controller.getState().messages;
    expect(messages[1]?.kind).toBe('command');
    expect(messages[1]?.role).toBe('system');
    expect(messages[1]?.content).toBe('Connect selected');
    expect(messages[1]?.requestPrompt).toBe(
      'Analyze the selected cluster and suggest relations.'
    );
    expect(messages[1]?.requestIntent).toBe('dependencies');
    expect(reply.mock.calls[0]?.[0].prompt).toBe(
      'Analyze the selected cluster and suggest relations.'
    );
  });

  it('auto-upgrades explicit relation cleanup prompts into dependencies intent flow', async () => {
    const reply = vi.fn(async () =>
      createMessage('assistant', 'I prepared relation removals for review.', Date.now(), [
        {
          id: 'remove-relation-1',
          kind: 'remove_relation',
          label: 'Remove relation',
          title: 'Remove outdated relation',
          relationType: 'relates_to',
          fromId: 'story-1',
          toId: 'story-2',
          fromLabel: 'Story 1',
          toLabel: 'Story 2',
          status: 'idle',
        },
      ])
    );
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(
      makeContextWithElements(
        'canvas-a',
        'Canvas A',
        [
          makeSelectionItem('story-1', 'story', 'Story 1'),
          makeSelectionItem('story-2', 'story', 'Story 2'),
        ],
        {
          selectionIds: ['story-1', 'story-2'],
          focusId: 'story-1',
        }
      )
    );

    await controller.submitPrompt('delete all relations for the elements');

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].source).toBe('intent');
    expect(reply.mock.calls[0]?.[0].intent).toBe('dependencies');
    expect(controller.getState().messages[1]).toMatchObject({
      role: 'user',
      content: 'delete all relations for the elements',
      requestIntent: 'dependencies',
    });
    expect(controller.getState().pendingConfirmation).toMatchObject({
      actionIds: ['remove-relation-1'],
      actionLabel: 'Remove relation',
      actionCount: 1,
    });
  });

  it('auto-upgrades empty-canvas strategic planning prompts into strategic_plan intent flow', async () => {
    const reply = vi.fn(async () =>
      createMessage('assistant', 'I prepared one strategic plan.', Date.now(), [
        {
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
        },
      ])
    );
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeEmptyContext('canvas-empty', 'Empty canvas'));

    await controller.submitPrompt(
      'згенеруй загальний стратегічний план для вивчення автоматизації маркетингу'
    );

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].source).toBe('intent');
    expect(reply.mock.calls[0]?.[0].intent).toBe('strategic_plan');
    expect(reply.mock.calls[0]?.[0].profile).toBe('strategic-plan');
    expect(controller.getState().messages[1]).toMatchObject({
      role: 'user',
      requestIntent: 'strategic_plan',
    });
    expect(controller.getState().pendingConfirmation).toMatchObject({
      actionIds: ['plan-blueprint-1'],
      actionLabel: 'Create plan',
      actionTitle: 'Marketing automation learning plan',
      actionCount: 1,
    });
  });

  it('auto-upgrades selected-goal subgoal prompts into strategic_plan intent flow', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Reply'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(
      makeContextWithElements(
        'canvas-goals',
        'Goal canvas',
        [makeSelectionItem('goal-1', 'goal', 'Стратегічний план вивчення автоматизації маркетингу')],
        {
          selectionIds: ['goal-1'],
          focusId: 'goal-1',
        }
      )
    );

    await controller.submitPrompt(
      'декомпозуй поточну ціль у паралельні або послідовні підцілі'
    );

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].source).toBe('intent');
    expect(reply.mock.calls[0]?.[0].intent).toBe('strategic_plan');
    expect(reply.mock.calls[0]?.[0].profile).toBe('strategic-plan');
  });

  it('restores the seed message after turning canvas context back on', () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    controller.setContextMode('none');
    expect(controller.getState().messages).toHaveLength(0);

    controller.setContextMode('canvas');
    expect(controller.getState().messages.map((message) => message.content)).toEqual([
      'Welcome Canvas A',
    ]);
  });

  it('uses the provided prepared submission context when context was disabled', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Reply'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    const selectedGoal = makeSelectionItem(
      'goal-1',
      'goal',
      '5 клієнтів по автоматизації (GHL)'
    );
    const snapshot = makeContextWithElements('canvas-a', 'Canvas A', [selectedGoal], {
      selectionIds: ['goal-1'],
      focusId: 'goal-1',
    });
    controller.setContext(snapshot);
    controller.setContextMode('none');

    await controller.submitPreparedSubmission(
      {
        prompt:
          'Assess what is missing before the selected goal is ready for execution.',
        snapshot,
        contextMode: 'selection',
        profile: 'readiness-check',
      },
    );

    expect(controller.getState().contextMode).toBe('selection');
    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].snapshot?.selectionIds).toEqual(['goal-1']);
    expect(reply.mock.calls[0]?.[0].snapshot?.summary.selectedCount).toBe(1);
    expect(reply.mock.calls[0]?.[0].profile).toBe('readiness-check');
    expect(reply.mock.calls[0]?.[0].source).toBe('manual');
  });

  it('does not pre-resolve a profile for manual prompts', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Reply'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Review the selected work');

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].source).toBe('manual');
    expect(reply.mock.calls[0]?.[0].profile).toBeUndefined();
  });

  it('submits the provided snapshot as-is without repairing selection state', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Reply'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    const selectedGoal = makeSelectionItem(
      'goal-1',
      'goal',
      '5 клієнтів по автоматизації (GHL)'
    );
    const staleSnapshot = makeContextWithElements('canvas-a', 'Canvas A', [selectedGoal], {
      selectionIds: [],
    });
    controller.setContext(staleSnapshot);

    await controller.submitPreparedSubmission(
      {
        prompt:
          'Assess what is missing before the selected goal is ready for execution.',
        snapshot: staleSnapshot,
        contextMode: 'selection',
        profile: 'readiness-check',
      },
    );

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls[0]?.[0].snapshot).toBeNull();
  });

  it('persists context mode per conversation scope', () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };

    const firstController = new AiAssistantSessionController({ service });
    firstController.setContext(makeContext('canvas-a', 'Canvas A'));
    firstController.setContextMode('selection');
    firstController.setContext(makeContext('canvas-b', 'Canvas B'));
    firstController.setContextMode('viewport');

    const secondController = new AiAssistantSessionController({ service });
    secondController.setContext(makeContext('canvas-a', 'Canvas A'));
    expect(secondController.getState().contextMode).toBe('selection');

    secondController.setContext(makeContext('canvas-b', 'Canvas B'));
    expect(secondController.getState().contextMode).toBe('viewport');

    secondController.setView('kanban');
    secondController.setContextMode('none');

    const thirdController = new AiAssistantSessionController({ service });
    thirdController.setView('kanban');
    expect(thirdController.getState().contextMode).toBe('none');
  });

  it('applies a chat create action and appends a confirmation message', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared a task for you.', Date.now(), [
          {
            id: 'action-task',
            kind: 'create_task',
            label: 'Create task',
            title: 'Build payment form',
            description: 'Implement PCI-safe payment form validation.',
            priority: 'highest',
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));
    await controller.submitPrompt('Create a task for payment form');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);
    expect(assistantMessage?.actions?.[0]?.status).toBe('idle');
    expect(controller.getState().pendingConfirmation).toMatchObject({
      messageId: assistantMessage?.id,
      actionIds: ['action-task'],
      actionLabel: 'Create task',
      actionTitle: 'Build payment form',
      actionCount: 1,
    });

    await controller.executeMessageAction(
      assistantMessage!.id,
      assistantMessage!.actions![0]!.id,
      vi.fn(async ({ action }) => ({
        status: 'applied',
        createdElementId: `${action.kind}-1`,
      }))
    );

    const messages = controller.getState().messages;
    const updatedAssistant = messages.find((message) => message.id === assistantMessage!.id);
    expect(updatedAssistant?.actions?.[0]?.status).toBe('applied');
    expect(updatedAssistant?.actions?.[0]?.createdElementId).toBe('create_task-1');
    expect(controller.getState().pendingConfirmation).toBeNull();
    expect(messages[messages.length - 1]?.content).toBe(
      'Created task "Build payment form".'
    );
  });

  it('exposes batch pending confirmation when the latest assistant reply has multiple idle actions', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared two updates for review.', Date.now(), [
          {
            id: 'action-update-1',
            kind: 'suggest_update',
            label: 'Apply update',
            groupId: 'group-updates',
            groupTitle: 'Suggested updates',
            title: 'Update goal "A"',
            elementId: 'goal-a',
            elementKind: 'goal',
            patch: { description: 'First update' },
            status: 'idle',
          },
          {
            id: 'action-update-2',
            kind: 'suggest_update',
            label: 'Apply update',
            groupId: 'group-updates',
            groupTitle: 'Suggested updates',
            title: 'Update goal "B"',
            elementId: 'goal-b',
            elementKind: 'goal',
            patch: { description: 'Second update' },
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Prepare two updates');

    expect(controller.getState().pendingConfirmation).toMatchObject({
      actionIds: ['action-update-1', 'action-update-2'],
      actionLabel: 'Apply all',
      actionTitle: 'Suggested updates (2)',
      actionCount: 2,
    });
  });

  it('applies multiple chat actions at once and appends a single summary message', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared relation suggestions.', Date.now(), [
          {
            id: 'relation-1',
            kind: 'suggest_relation',
            label: 'Add relation',
            groupId: 'group-relations',
            groupTitle: 'Suggested relations',
            title: 'Add sequence relation',
            relationType: 'leads_to',
            fromId: 'course-1',
            toId: 'goal-1',
            fromLabel: 'Course 1',
            toLabel: 'Goal 1',
            status: 'idle',
          },
          {
            id: 'relation-2',
            kind: 'suggest_relation',
            label: 'Add relation',
            groupId: 'group-relations',
            groupTitle: 'Suggested relations',
            title: 'Add sequence relation',
            relationType: 'leads_to',
            fromId: 'course-2',
            toId: 'goal-1',
            fromLabel: 'Course 2',
            toLabel: 'Goal 1',
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Connect these courses to the goal');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);
    expect(controller.getState().pendingConfirmation).toMatchObject({
      messageId: assistantMessage?.id,
      actionIds: ['relation-1', 'relation-2'],
      actionLabel: 'Apply all',
      actionTitle: 'Suggested relations (2)',
      actionCount: 2,
    });

    await controller.executeMessageActions(
      assistantMessage!.id,
      ['relation-1', 'relation-2'],
      vi.fn(async ({ action }) => ({
        status: 'applied',
        affectedElementIds:
          action.kind === 'suggest_relation'
            ? [action.fromId, action.toId]
            : undefined,
      }))
    );

    const updatedAssistant = controller
      .getState()
      .messages.find((message) => message.id === assistantMessage!.id);
    expect(updatedAssistant?.actions?.map((action) => action.status)).toEqual([
      'applied',
      'applied',
    ]);
    expect(controller.getState().pendingConfirmation).toBeNull();
    expect(controller.getState().messages.at(-1)?.content).toBe(
      'Applied 2 relations.'
    );
  });

  it('uses batch executor support when applying multiple actions', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared stories for you.', Date.now(), [
          {
            id: 'action-story-1',
            kind: 'create_story',
            label: 'Create story',
            groupId: 'group-stories',
            groupTitle: 'Suggested stories',
            title: 'Refund flow',
            status: 'idle',
          },
          {
            id: 'action-story-2',
            kind: 'create_story',
            label: 'Create story',
            groupId: 'group-stories',
            groupTitle: 'Suggested stories',
            title: 'Chargeback flow',
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Prepare two stories');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);
    const singleExecutor = vi.fn(async () => ({
      status: 'failed' as const,
      errorMessage: 'Single executor should not be used.',
    }));
    const batchExecutor = vi.fn(async (requests: Array<{ action: { kind: string } }>) =>
      requests.map((request, index) => ({
        status: 'applied' as const,
        createdElementId: `${request.action.kind}-${index + 1}`,
      }))
    );
    const executor = Object.assign(singleExecutor, {
      executeBatch: batchExecutor,
    });

    await controller.executeMessageActions(
      assistantMessage!.id,
      ['action-story-1', 'action-story-2'],
      executor
    );

    expect(batchExecutor).toHaveBeenCalledTimes(1);
    expect(singleExecutor).not.toHaveBeenCalled();
    expect(controller.getState().messages.at(-1)?.content).toBe(
      'Created 2 stories.'
    );
  });

  it('summarizes applied relation type updates as updated relations', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared relation type changes.', Date.now(), [
          {
            id: 'relation-update-1',
            kind: 'update_relation',
            label: 'Update relation',
            groupId: 'group-relation-updates',
            groupTitle: 'Relation type changes',
            title: 'Change relation type',
            currentRelationType: 'relates_to',
            nextRelationType: 'leads_to',
            fromId: 'course-1',
            toId: 'goal-1',
            fromLabel: 'Course 1',
            toLabel: 'Goal 1',
            status: 'idle',
          },
          {
            id: 'relation-update-2',
            kind: 'update_relation',
            label: 'Update relation',
            groupId: 'group-relation-updates',
            groupTitle: 'Relation type changes',
            title: 'Change relation type',
            currentRelationType: 'relates_to',
            nextRelationType: 'leads_to',
            fromId: 'course-2',
            toId: 'goal-1',
            fromLabel: 'Course 2',
            toLabel: 'Goal 1',
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Retype these relations');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);
    expect(controller.getState().pendingConfirmation).toMatchObject({
      actionIds: ['relation-update-1', 'relation-update-2'],
      actionLabel: 'Apply all',
      actionTitle: 'Relation type changes (2)',
      actionCount: 2,
    });

    await controller.executeMessageActions(
      assistantMessage!.id,
      ['relation-update-1', 'relation-update-2'],
      vi.fn(async ({ action }) => ({
        status: 'applied',
        affectedElementIds:
          action.kind === 'update_relation'
            ? [action.fromId, action.toId]
            : undefined,
      }))
    );

    expect(controller.getState().messages.at(-1)?.content).toBe(
      'Updated 2 relations.'
    );
  });

  it('marks a chat create action as failed and keeps it retryable', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () =>
        createMessage('assistant', 'I prepared a story for you.', Date.now(), [
          {
            id: 'action-story',
            kind: 'create_story',
            label: 'Create story',
            title: 'Refund flow',
            priority: 'lowest',
            status: 'idle',
          },
        ])
      ),
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));
    await controller.submitPrompt('Create a story for refunds');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);

    await controller.executeMessageAction(
      assistantMessage!.id,
      assistantMessage!.actions![0]!.id,
      vi.fn(async () => ({
        status: 'failed',
        errorMessage: 'Canvas is unavailable.',
      }))
    );

    const updatedAssistant = controller
      .getState()
      .messages.find((message) => message.id === assistantMessage!.id);
    expect(updatedAssistant?.actions?.[0]?.status).toBe('failed');
    expect(updatedAssistant?.actions?.[0]?.errorMessage).toBe(
      'Canvas is unavailable.'
    );
    expect(
      controller.getState().messages.at(-1)?.content
    ).not.toBe('Created story "Refund flow".');
  });

  it('regenerates the latest assistant reply without including the replaced answer in history', async () => {
    const reply = vi
      .fn()
      .mockResolvedValueOnce(createMessage('assistant', 'First answer'))
      .mockResolvedValueOnce(createMessage('assistant', 'Second answer'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));

    await controller.submitPrompt('Explain checkout risks');

    const originalReply = controller.getState().messages.at(-1);
    expect(originalReply?.content).toBe('First answer');

    await controller.regenerateMessage(originalReply!.id);

    expect(reply).toHaveBeenCalledTimes(2);
    expect(reply.mock.calls[1]?.[0].prompt).toBe('Explain checkout risks');
    expect(reply.mock.calls[1]?.[0].source).toBe('manual');
    expect(reply.mock.calls[1]?.[0].snapshot?.canvasTitle).toBe('Canvas A');
    expect(controller.getState().messages.map((message) => message.content)).toEqual([
      'Welcome Canvas A',
      'Explain checkout risks',
      'Second answer',
    ]);
  });

  it('regenerates command replies through the original intent flow', async () => {
    const reply = vi
      .fn()
      .mockResolvedValueOnce(createMessage('assistant', 'First command answer'))
      .mockResolvedValueOnce(createMessage('assistant', 'Second command answer'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    const context = makeContext('canvas-a', 'Canvas A');
    controller.setContext(context);

    await controller.submitPreparedSubmission({
      prompt: 'Analyze the selected cluster and suggest relations.',
      snapshot: context,
      contextMode: 'selection',
      source: 'intent',
      intent: 'dependencies',
      profile: 'dependency-review',
      requestLabel: 'Connect selected',
      requestMessageKind: 'command',
    });

    const originalReply = controller.getState().messages.at(-1);
    expect(originalReply?.content).toBe('First command answer');

    await controller.regenerateMessage(originalReply!.id);

    expect(reply).toHaveBeenCalledTimes(2);
    expect(reply.mock.calls[1]?.[0].source).toBe('intent');
    expect(reply.mock.calls[1]?.[0].intent).toBe('dependencies');
    expect(reply.mock.calls[1]?.[0].profile).toBe('dependency-review');
    expect(controller.getState().messages.at(-2)?.content).toBe('Connect selected');
    expect(controller.getState().messages.at(-1)?.content).toBe(
      'Second command answer'
    );
  });

  it('continues an intent flow when the latest assistant reply is a follow-up question', async () => {
    const reply = vi
      .fn()
      .mockResolvedValueOnce(
        createMessage(
          'assistant',
          'What specific metrics define success for this goal?'
        )
      )
      .mockResolvedValueOnce(createMessage('assistant', 'Structured follow-up answer'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: AiAssistantCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new AiAssistantSessionController({ service });
    const context = makeContextWithElements(
      'canvas-a',
      'Canvas A',
      [makeSelectionItem('goal-1', 'goal', 'Peak physical form')],
      {
        selectionIds: ['goal-1'],
        focusId: 'goal-1',
      }
    );
    controller.setContext(context);

    await controller.submitPreparedSubmission({
      prompt: 'Fill in the missing details for the selected goal "Peak physical form".',
      snapshot: context,
      contextMode: 'selection',
      source: 'intent',
      intent: 'fill_details',
      profile: 'readiness-check',
      requestLabel: 'Fill missing details',
      requestMessageKind: 'command',
    });

    expect(controller.getState().messages.at(-1)?.requestIntent).toBe('fill_details');

    await controller.submitPrompt(
      '85kg minimum, broad shoulders, big chest, 6-pack abs, strong forearms, glutes and legs trained.'
    );

    expect(reply).toHaveBeenCalledTimes(2);
    expect(reply.mock.calls[1]?.[0].source).toBe('intent');
    expect(reply.mock.calls[1]?.[0].intent).toBe('fill_details');
    expect(reply.mock.calls[1]?.[0].profile).toBe('readiness-check');
    expect(reply.mock.calls[1]?.[0].prompt).toBe(
      '85kg minimum, broad shoulders, big chest, 6-pack abs, strong forearms, glutes and legs trained.'
    );
    expect(controller.getState().messages.at(-2)?.requestIntent).toBe(
      'fill_details'
    );
  });
});
