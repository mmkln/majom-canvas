import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatSelectionItem,
} from '../workspaceChatEvents.ts';
import type { WorkspaceChatAction } from '../workspaceChatActions.ts';
import { WorkspaceChatSessionController } from './WorkspaceChatSessionController.ts';
import type { WorkspaceChatMessage } from './WorkspaceChatTypes.ts';

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
): WorkspaceChatCanvasSnapshot {
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

function makeSelectionItem(
  id: string,
  kind: 'goal' | 'story' | 'task',
  title: string
): WorkspaceChatSelectionItem {
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
  items: WorkspaceChatSelectionItem[],
  options: {
    selectionIds?: string[];
    focusId?: string | null;
  } = {}
): WorkspaceChatCanvasSnapshot {
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
  actions?: WorkspaceChatAction[],
  kind: 'default' | 'system' | 'command' = 'default',
  requestPrompt?: string,
  requestIntent?:
    | 'review'
    | 'breakdown'
    | 'dependencies'
    | 'missing'
    | 'clarify'
    | 'fill_details'
): WorkspaceChatMessage {
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
): WorkspaceChatMessage {
  return createMessage('system', content, createdAt, undefined, 'system');
}

describe('WorkspaceChatSessionController', () => {
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
    const deferred = createDeferred<WorkspaceChatMessage>();
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(() => deferred.promise),
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new WorkspaceChatSessionController({ service });

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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
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
    const controller = new WorkspaceChatSessionController({ service });
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

  it('renders prepared intent submissions as command messages instead of raw user prompts', async () => {
    const reply = vi.fn(async () => createMessage('assistant', 'Linked suggestions'));
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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

  it('restores the seed message after turning canvas context back on', () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply: vi.fn(async () => createMessage('assistant', 'Reply')),
    };

    const firstController = new WorkspaceChatSessionController({ service });
    firstController.setContext(makeContext('canvas-a', 'Canvas A'));
    firstController.setContextMode('selection');
    firstController.setContext(makeContext('canvas-b', 'Canvas B'));
    firstController.setContextMode('viewport');

    const secondController = new WorkspaceChatSessionController({ service });
    secondController.setContext(makeContext('canvas-a', 'Canvas A'));
    expect(secondController.getState().contextMode).toBe('selection');

    secondController.setContext(makeContext('canvas-b', 'Canvas B'));
    expect(secondController.getState().contextMode).toBe('viewport');

    secondController.setView('kanban');
    secondController.setContextMode('none');

    const thirdController = new WorkspaceChatSessionController({ service });
    thirdController.setView('kanban');
    expect(thirdController.getState().contextMode).toBe('none');
  });

  it('applies a chat create action and appends a confirmation message', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
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
    const controller = new WorkspaceChatSessionController({ service });
    controller.setContext(makeContext('canvas-a', 'Canvas A'));
    await controller.submitPrompt('Create a task for payment form');

    const assistantMessage = controller
      .getState()
      .messages.find((message) => message.actions?.length);
    expect(assistantMessage?.actions?.[0]?.status).toBe('idle');

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
    expect(messages[messages.length - 1]?.content).toBe(
      'Created task "Build payment form".'
    );
  });

  it('marks a chat create action as failed and keeps it retryable', async () => {
    const service = {
      createMessage,
      createSystemMessage,
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
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
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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
      createWelcomeMessage: (context: WorkspaceChatCanvasSnapshot | null) =>
        createSystemMessage(`Welcome ${context?.canvasTitle ?? 'none'}`),
      getQuickActions: vi.fn(() => []),
      reply,
    };
    const controller = new WorkspaceChatSessionController({ service });
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
});
