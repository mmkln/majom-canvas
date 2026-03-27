// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import type {
  AiAssistantPanelState,
  AiAssistantSessionController,
} from '../services/AiAssistantSessionController.ts';
import { createAiAssistantTestSnapshot } from '../services/AiAssistantTestUtils.ts';
import type { AiAssistantMessage } from '../services/AiAssistantTypes.ts';
import { AiAssistantPanel } from './AiAssistantPanel.ts';
import { createAppRuntime } from '../../../app-runtime/index.ts';
import { AI_ASSISTANT_TOGGLE_REQUEST_EVENT } from '../aiAssistantEvents.ts';

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
      messages.length > 1 ||
      messages.some((message) => message.role === 'user'),
    contextEnabled: true,
    contextMode: 'canvas',
    composerPlaceholder: 'Ask about the current canvas',
  };
}

function createCreateTaskAction(id: string, title: string): AiAssistantAction {
  return {
    id,
    kind: 'create_task',
    label: title,
    title,
    status: 'idle',
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
    panel.mount();
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
    panel.mount();
    const { messagesViewport: viewport, scrollToBottomButton: button } =
      getPanelInternals(panel);
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
    panel.mount();
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
    const state = createState([
      createMessage('user-1', 'user', 'Check this plan'),
    ]);
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
    panel.mount();
    const { messagesList, sendButton } = getPanelInternals(panel);

    expect(messagesList.textContent).toContain('Running tools');
    expect(messagesList.textContent).toContain(
      'Running tools and collecting grounded data.'
    );
    expect(messagesList.textContent).toContain('1/3');
    expect(sendButton.disabled).toBe(true);
    expect(sendButton.getAttribute('aria-label')).toBe('Working');
    expect(sendButton.getAttribute('aria-busy')).toBe('true');
    panel.unmount();
  });

  it('uses hover/focus CSS visibility for older message actions and keeps latest actions always visible', () => {
    const state = createState([
      createMessage('user-1', 'user', 'Older user draft'),
      createMessage('user-2', 'user', 'Latest user draft'),
    ]);
    const { controller } = createController(state);
    const panel = new AiAssistantPanel({ controller });
    panel.mount();
    const { messagesList } = getPanelInternals(panel);

    const copyButtons = Array.from(
      messagesList.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Copy reply"]'
      )
    );

    expect(copyButtons).toHaveLength(2);
    const olderButton = copyButtons[0];
    const latestButton = copyButtons[1];

    const olderActions = olderButton.parentElement as HTMLDivElement;
    const latestActions = latestButton.parentElement as HTMLDivElement;
    expect(olderActions.classList.contains('opacity-0')).toBe(true);
    expect(olderActions.classList.contains('group-hover:opacity-100')).toBe(
      true
    );
    expect(
      olderActions.classList.contains('group-focus-within:opacity-100')
    ).toBe(true);
    expect(latestActions.classList.contains('opacity-0')).toBe(false);
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
    panel.mount();
    const { messagesList } = getPanelInternals(panel);

    const copyButtons = Array.from(
      messagesList.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Copy reply"]'
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
    panel.mount();
    const { messagesViewport: viewport, messagesList } =
      getPanelInternals(panel);
    const metrics = installViewportMetrics(viewport, {
      scrollTop: 180,
      scrollHeight: 960,
      clientHeight: 240,
    });

    viewport.dispatchEvent(new Event('scroll'));

    const originalReplaceChildren =
      messagesList.replaceChildren.bind(messagesList);
    messagesList.replaceChildren = (...nodes: (Node | string)[]) => {
      viewport.scrollTop = 0;
      originalReplaceChildren(...nodes);
    };

    const copyButton = messagesList.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy reply"]'
    );

    expect(copyButton).not.toBeNull();
    copyButton?.click();

    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('User draft');
    expect(metrics.getScrollTop()).toBe(180);
    panel.unmount();
  });

  it('uses a shared text-button style for the action toggle so keyboard focus stays visible', () => {
    const assistantMessage: AiAssistantMessage = {
      id: 'assistant-actions',
      role: 'assistant',
      kind: 'default',
      content: 'Proposed task batch',
      createdAt: Date.UTC(2026, 2, 22, 10, 0, 0),
      actions: [
        createCreateTaskAction('action-1', 'First task'),
        createCreateTaskAction('action-2', 'Second task'),
      ],
    };
    const { controller } = createController(createState([assistantMessage]));
    const panel = new AiAssistantPanel({ controller });
    panel.mount();
    const { messagesList } = getPanelInternals(panel);

    const toggleButton = messagesList.querySelector<HTMLButtonElement>(
      'button[aria-label="Hide actions"]'
    );

    expect(toggleButton).not.toBeNull();
    expect(toggleButton?.className).toContain('focus-visible:ring-2');
    expect(toggleButton?.className).toContain('focus-visible:ring-indigo-300');
    expect(toggleButton?.classList.contains('truncate')).toBe(false);
    expect(toggleButton?.style.outline).toBe('');
    panel.unmount();
  });

  it('renders neutral meta labels and borderless message bubbles', () => {
    const systemMessage: AiAssistantMessage = {
      id: 'system-1',
      role: 'system',
      kind: 'system',
      content: 'Canvas context is unavailable.',
      createdAt: Date.UTC(2026, 2, 22, 10, 0, 0),
    };
    const state = createState([systemMessage]);
    state.replying = true;
    state.replyProgress = {
      phase: 'drafting',
      label: 'Thinking',
      detail: 'Preparing a grounded reply.',
      currentStep: 1,
      totalSteps: 2,
    };

    const { controller } = createController(state);
    const panel = new AiAssistantPanel({ controller });
    panel.mount();
    const { messagesList } = getPanelInternals(panel);

    const messageWrap = messagesList.children[0] as HTMLDivElement;
    const messageMeta = messageWrap.children[0] as HTMLDivElement;
    const roleLabel = messageMeta.children[0] as HTMLSpanElement;
    const messageBubble = messageWrap.children[1] as HTMLDivElement;

    const typingWrap = messagesList.children[1] as HTMLDivElement;
    const typingBubble = typingWrap.children[1] as HTMLDivElement;

    expect(roleLabel.style.color).toBe('rgb(100, 116, 139)');
    expect(messageBubble.style.border).toBe('');
    expect(typingBubble.style.border).toBe('');
    panel.unmount();
  });

  it('updates AI chat chrome when the runtime locale changes', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const { controller } = createController(
      createState([createMessage('assistant-1', 'assistant', 'First reply')])
    );
    const panel = new AiAssistantPanel({ controller, runtime });
    panel.mount();
    const { sendButton } = getPanelInternals(panel);

    expect(sendButton.getAttribute('aria-label')).toBe('Send message');
    expect(sendButton.querySelector('svg')?.getAttribute('data-icon-name')).toBe(
      'arrow-up'
    );

    runtime.setLocale('uk');

    expect(sendButton.getAttribute('aria-label')).toBe(
      'Надіслати повідомлення'
    );
    expect(sendButton.querySelector('svg')?.getAttribute('data-icon-name')).toBe(
      'arrow-up'
    );
    panel.unmount();
  });

  it('closes the panel when the header icon button is clicked', () => {
    const { controller } = createController(
      createState([createMessage('assistant-1', 'assistant', 'First reply')])
    );
    const panel = new AiAssistantPanel({ controller });
    const toggleEvents: CustomEvent[] = [];
    const handleToggle = (event: Event) => {
      toggleEvents.push(event as CustomEvent);
    };
    window.addEventListener(AI_ASSISTANT_TOGGLE_REQUEST_EVENT, handleToggle);

    try {
      panel.mount();
      const toggleButton = document.querySelector<HTMLButtonElement>(
        '[data-role="ai-assistant-panel-toggle-button"]'
      );

      expect(toggleButton).not.toBeNull();
      expect(toggleButton?.className).toContain('bg-indigo-50');
      expect(toggleButton?.dataset.selected).toBe('true');
      toggleButton?.click();

      expect(toggleEvents).toHaveLength(1);
      expect(toggleEvents[0]?.detail).toEqual({ open: false });
    } finally {
      window.removeEventListener(
        AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
        handleToggle
      );
      panel.unmount();
    }
  });
});
