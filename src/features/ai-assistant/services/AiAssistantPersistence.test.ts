import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiAssistantPersistence } from './AiAssistantPersistence.ts';
import type { AiAssistantMessage } from './AiAssistantTypes.ts';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

describe('AiAssistantPersistence', () => {
  let localStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorage = createLocalStorageMock();
    vi.stubGlobal('window', {
      localStorage,
    } as unknown as Window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('migrates legacy bootstrap intent records to the versioned strategic_plan envelope', () => {
    const persistence = new AiAssistantPersistence('ai-assistant-history:');
    const key = 'canvas:test';
    const storageKey = `ai-assistant-history:${key}`;
    const legacyConversation = [
      {
        id: 'message-1',
        role: 'user',
        kind: 'default',
        content: 'Create a plan.',
        createdAt: 1,
        requestIntent: 'bootstrap_plan',
        requestIntentContext: {
          strategicPlanMode: 'goal_subgoals',
        },
      },
    ];
    localStorage.setItem(storageKey, JSON.stringify(legacyConversation));

    const messages = persistence.readConversation(key);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.requestIntent).toBe('strategic_plan');
    expect(messages[0]?.requestIntentContext).toEqual({
      strategicPlanMode: 'goal_subgoals',
    });

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as {
      version?: number;
      messages?: AiAssistantMessage[];
    };
    expect(stored.version).toBe(2);
    expect(stored.messages?.[0]?.requestIntent).toBe('strategic_plan');
  });

  it('writes versioned conversation envelopes on save', () => {
    const persistence = new AiAssistantPersistence('ai-assistant-history:');
    const key = 'canvas:test';
    const messages: AiAssistantMessage[] = [
      {
        id: 'message-1',
        role: 'assistant',
        kind: 'default',
        content: 'Hello',
        createdAt: 1,
      },
    ];

    persistence.saveConversation(key, messages);

    const stored = JSON.parse(
      localStorage.setItem.mock.calls[0]?.[1] ?? '{}'
    ) as {
      version?: number;
      messages?: AiAssistantMessage[];
    };
    expect(stored.version).toBe(2);
    expect(stored.messages).toEqual(messages);
  });
});
