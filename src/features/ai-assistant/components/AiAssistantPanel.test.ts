// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AiAssistantPanelState,
  AiAssistantSessionController,
} from '../services/AiAssistantSessionController.ts';
import { createAiAssistantTestSnapshot } from '../services/AiAssistantTestUtils.ts';
import type { AiAssistantMessage } from '../services/AiAssistantTypes.ts';
import { AiAssistantPanel } from './AiAssistantPanel.ts';

function createMessage(
  id: string,
  role: AiAssistantMessage['role'],
  content: string
): AiAssistantMessage {
  return {
    id,
    role,
    kind: role === 'system' ? 'system' : 'default',
    content,
    createdAt: Date.UTC(2026, 2, 22, 10, 0, 0),
  };
}

function createState(messages: AiAssistantMessage[]): AiAssistantPanelState {
  return {
    currentView: 'canvas',
    context: createAiAssistantTestSnapshot(),
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

function createController(initialState: AiAssistantPanelState): {
  controller: AiAssistantSessionController;
  updateState: (nextState: AiAssistantPanelState) => void;
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
    submitPrompt: vi.fn(() => Promise.resolve(undefined)),
    submitPreparedSubmission: vi.fn(() => Promise.resolve(undefined)),
    regenerateMessage: vi.fn(() => Promise.resolve(undefined)),
    executeMessageAction: vi.fn(() => Promise.resolve(undefined)),
    executeMessageActions: vi.fn(() => Promise.resolve([])),
    setView: vi.fn(),
    setContext: vi.fn(),
  } as unknown as AiAssistantSessionController;

  return {
    controller,
    updateState: (nextState: AiAssistantPanelState) => {
      state = nextState;
      listener();
    },
  };
}

function getPanelInternals(panel: AiAssistantPanel): {
  messagesViewport: HTMLDivElement;
  scrollToBottomButton: HTMLButtonElement;
  messagesList: HTMLDivElement;
  sendButton: HTMLButtonElement;
} {
  return panel as unknown as {
    messagesViewport: HTMLDivElement;
    scrollToBottomButton: HTMLButtonElement;
    messagesList: HTMLDivElement;
    sendButton: HTMLButtonElement;
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

describe('AiAssistantPanel auto-scroll', () => {
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
    const panel = new AiAssistantPanel({ controller });
    const { messagesViewport: viewport } = getPanelInternals(panel);
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

  it('scrolls to the latest messages when the scroll-to-bottom control is used', () => {
    const initialMessages = [
      createMessage('assistant-1', 'assistant', 'First reply'),
      createMessage('assistant-2', 'assistant', 'Second reply'),
    ];
    const { controller } = createController(createState(initialMessages));
    const panel = new AiAssistantPanel({ controller });
    const {
      messagesViewport: viewport,
      scrollToBottomButton: button,
    } = getPanelInternals(panel);
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 120,
      scrollHeight: 900,
      clientHeight: 240,
    });

    viewport.dispatchEvent(new Event('scroll'));

    button.click();

    expect(metrics.scrollToSpy).toHaveBeenCalledWith({
      top: 900,
      behavior: 'smooth',
    });
    expect(metrics.getScrollTop()).toBe(900);
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
    const panel = new AiAssistantPanel({ controller });
    const { messagesViewport: viewport } = getPanelInternals(panel);
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
      label: 'Checking context',
      detail: 'Inspecting the focus item and nearby structure.',
      currentStep: 1,
      totalSteps: 3,
    };
    const { controller } = createController(state);
    const panel = new AiAssistantPanel({ controller });
    const { messagesList, sendButton } = getPanelInternals(panel);

    expect(messagesList.textContent).toContain('Checking context');
    expect(messagesList.textContent).toContain(
      'Inspecting the focus item and nearby structure.'
    );
    expect(messagesList.textContent).toContain('1/3');
    expect(sendButton.textContent).toBe('Working...');
    panel.unmount();
  });

  it('renders a copy button for user messages and copies their text', async () => {
    const writeText = vi.fn(() => Promise.resolve(undefined));
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    });

    const state = createState([createMessage('user-1', 'user', 'User draft')]);
    const { controller } = createController(state);
    const panel = new AiAssistantPanel({ controller });
    const { messagesList } = getPanelInternals(panel);

    const copyButtons = Array.from(
      messagesList.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Copy message to clipboard"]'
      )
    );
    const copyButton =
      copyButtons.length > 0 ? copyButtons[copyButtons.length - 1] : null;

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('User draft');
    panel.unmount();
  });

  it('preserves chat scroll position when copy feedback rerenders the message list', async () => {
    const writeText = vi.fn(() => Promise.resolve(undefined));
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    });

    const { controller } = createController(
      createState([createMessage('user-1', 'user', 'User draft')])
    );
    const panel = new AiAssistantPanel({ controller });
    const { messagesViewport: viewport, messagesList } = getPanelInternals(panel);
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

    const copyButton = messagesList.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy message to clipboard"]'
    );

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('User draft');
    expect(metrics.getScrollTop()).toBe(180);
    panel.unmount();
  });

});
