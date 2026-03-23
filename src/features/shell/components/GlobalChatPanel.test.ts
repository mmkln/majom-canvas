// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  WorkspaceChatPanelState,
  WorkspaceChatSessionController,
} from '../services/WorkspaceChatSessionController.ts';
import { createWorkspaceChatTestSnapshot } from '../services/WorkspaceChatTestUtils.ts';
import type { WorkspaceChatMessage } from '../services/WorkspaceChatTypes.ts';
import { GlobalChatPanel } from './GlobalChatPanel.ts';

function createMessage(
  id: string,
  role: WorkspaceChatMessage['role'],
  content: string
): WorkspaceChatMessage {
  return {
    id,
    role,
    kind: role === 'system' ? 'system' : 'default',
    content,
    createdAt: Date.UTC(2026, 2, 22, 10, 0, 0),
  };
}

function createState(messages: WorkspaceChatMessage[]): WorkspaceChatPanelState {
  return {
    currentView: 'canvas',
    context: createWorkspaceChatTestSnapshot(),
    messages,
    pendingConfirmation: null,
    quickActions: [],
    replying: false,
    replyProgress: null,
    canClear:
      messages.length > 1 || messages.some((message) => message.role === 'user'),
    contextEnabled: true,
    contextMode: 'canvas',
    composerPlaceholder: 'Ask about the current canvas',
  };
}

function createController(initialState: WorkspaceChatPanelState): {
  controller: WorkspaceChatSessionController;
  updateState: (nextState: WorkspaceChatPanelState) => void;
} {
  let state = initialState;
  let listener: () => void = () => {};

  const controller = {
    subscribe: vi.fn((nextListener: () => void) => {
      listener = nextListener;
      return () => {
        listener = () => {};
      };
    }),
    getState: vi.fn(() => state),
    setContextMode: vi.fn(),
    clearConversation: vi.fn(),
    submitPrompt: vi.fn(async () => undefined),
    submitPreparedSubmission: vi.fn(async () => undefined),
    regenerateMessage: vi.fn(async () => undefined),
    executeMessageActions: vi.fn(async () => []),
    setView: vi.fn(),
    setContext: vi.fn(),
  } as unknown as WorkspaceChatSessionController;

  return {
    controller,
    updateState: (nextState: WorkspaceChatPanelState) => {
      state = nextState;
      listener();
    },
  };
}

function installViewportMetrics(
  viewport: HTMLDivElement,
  initial: {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  }
): {
  getScrollTop: () => number;
  setScrollHeight: (value: number) => void;
  scrollToSpy: ReturnType<typeof vi.fn>;
} {
  let scrollTop = initial.scrollTop;
  let scrollHeight = initial.scrollHeight;
  const clientHeight = initial.clientHeight;

  Object.defineProperty(viewport, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  Object.defineProperty(viewport, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(viewport, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  const scrollToSpy = vi.fn((options?: ScrollToOptions) => {
    if (typeof options?.top === 'number') {
      scrollTop = options.top;
    }
  });
  Object.defineProperty(viewport, 'scrollTo', {
    configurable: true,
    value: scrollToSpy,
  });

  return {
    getScrollTop: () => scrollTop,
    setScrollHeight: (value: number) => {
      scrollHeight = value;
    },
    scrollToSpy,
  };
}

describe('GlobalChatPanel auto-scroll', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('does not force-scroll when new messages arrive while the user is reading older history', () => {
    const initialMessages = [
      createMessage('assistant-1', 'assistant', 'First reply'),
      createMessage('assistant-2', 'assistant', 'Second reply'),
    ];
    const { controller, updateState } = createController(
      createState(initialMessages)
    );
    const panel = new GlobalChatPanel({ controller });
    const viewport = (panel as any).messagesViewport as HTMLDivElement;
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 120,
      scrollHeight: 900,
      clientHeight: 240,
    });

    viewport.dispatchEvent(new Event('scroll'));
    metrics.setScrollHeight(1040);
    updateState(
      createState([
        ...initialMessages,
        createMessage('assistant-3', 'assistant', 'Newest reply'),
      ])
    );

    expect(metrics.getScrollTop()).toBe(120);
    panel.unmount();
  });

  it('shows a scroll-to-bottom button with the down arrow while reading older history', () => {
    const initialMessages = [
      createMessage('assistant-1', 'assistant', 'First reply'),
      createMessage('assistant-2', 'assistant', 'Second reply'),
    ];
    const { controller } = createController(createState(initialMessages));
    const panel = new GlobalChatPanel({ controller });
    const viewport = (panel as any).messagesViewport as HTMLDivElement;
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 120,
      scrollHeight: 900,
      clientHeight: 240,
    });
    const button = (panel as any).scrollToBottomButton as HTMLButtonElement;

    viewport.dispatchEvent(new Event('scroll'));

    expect(button.style.display).toBe('inline-flex');
    expect(button.querySelector('svg')).not.toBeNull();

    button.click();

    expect(metrics.scrollToSpy).toHaveBeenCalledWith({
      top: 900,
      behavior: 'smooth',
    });
    expect(metrics.getScrollTop()).toBe(900);
    expect(button.style.display).toBe('none');
    panel.unmount();
  });

  it('keeps auto-scrolling when the viewport is already near the bottom', () => {
    const initialMessages = [
      createMessage('assistant-1', 'assistant', 'First reply'),
      createMessage('assistant-2', 'assistant', 'Second reply'),
    ];
    const { controller, updateState } = createController(
      createState(initialMessages)
    );
    const panel = new GlobalChatPanel({ controller });
    const viewport = (panel as any).messagesViewport as HTMLDivElement;
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 630,
      scrollHeight: 900,
      clientHeight: 240,
    });

    viewport.dispatchEvent(new Event('scroll'));
    metrics.setScrollHeight(1040);
    updateState(
      createState([
        ...initialMessages,
        createMessage('assistant-3', 'assistant', 'Newest reply'),
      ])
    );

    expect(metrics.getScrollTop()).toBe(1040);
    panel.unmount();
  });

  it('renders detailed reply progress instead of a generic thinking label', () => {
    const state = createState([createMessage('user-1', 'user', 'Check this plan')]);
    state.replying = true;
    state.replyProgress = {
      phase: 'tools',
      label: 'Checking workspace context',
      detail: 'Inspecting the focus item and nearby structure.',
      currentStep: 1,
      totalSteps: 3,
    };
    const { controller } = createController(state);
    const panel = new GlobalChatPanel({ controller });
    const messagesList = (panel as any).messagesList as HTMLDivElement;
    const sendButton = (panel as any).sendButton as HTMLButtonElement;

    expect(messagesList.textContent).toContain('Checking workspace context');
    expect(messagesList.textContent).toContain(
      'Inspecting the focus item and nearby structure.'
    );
    expect(messagesList.textContent).toContain('1/3');
    expect(sendButton.textContent).toBe('Working...');
    panel.unmount();
  });

  it('renders a copy button for user messages and copies their text', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    });

    const state = createState([createMessage('user-1', 'user', 'User draft')]);
    const { controller } = createController(state);
    const panel = new GlobalChatPanel({ controller });
    const messagesList = (panel as any).messagesList as HTMLDivElement;

    const copyButtons = Array.from(
      messagesList.querySelectorAll(
        'button[aria-label="Copy message to clipboard"]'
      )
    ) as HTMLButtonElement[];
    const copyButton = copyButtons.at(-1) ?? null;

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('User draft');
    panel.unmount();
  });

  it('preserves chat scroll position when copy feedback rerenders the message list', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    });

    const { controller } = createController(
      createState([createMessage('user-1', 'user', 'User draft')])
    );
    const panel = new GlobalChatPanel({ controller });
    const viewport = (panel as any).messagesViewport as HTMLDivElement;
    const messagesList = (panel as any).messagesList as HTMLDivElement;
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 180,
      scrollHeight: 960,
      clientHeight: 240,
    });

    viewport.dispatchEvent(new Event('scroll'));

    const originalReplaceChildren = messagesList.replaceChildren.bind(messagesList);
    messagesList.replaceChildren = (...nodes: (Node | string)[]) => {
      viewport.scrollTop = 0;
      originalReplaceChildren(...nodes);
    };

    const copyButton = messagesList.querySelector(
      'button[aria-label="Copy message to clipboard"]'
    ) as HTMLButtonElement | null;

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('User draft');
    expect(metrics.getScrollTop()).toBe(180);
    panel.unmount();
  });
});
