import { describe, expect, it } from 'vitest';
import type { WorkspaceChatAssembledContext } from './WorkspaceChatContextTypes.ts';
import { EMPTY_WORKSPACE_CHAT_MEMORY_STATE } from './WorkspaceChatContextTypes.ts';
import {
  buildWorkspaceChatApiMessages,
  buildWorkspaceChatSystemPrompt,
} from './WorkspaceChatPromptBuilder.ts';
import type { WorkspaceChatMessage } from './WorkspaceChatTypes.ts';

const assembledContext: WorkspaceChatAssembledContext = {
  profile: 'general-question',
  contextMode: 'canvas',
  rawSnapshot: {
    canvasId: 'canvas-a',
    canvasTitle: 'Main current flow',
    summary: {
      goalCount: 1,
      storyCount: 1,
      taskCount: 2,
      selectedCount: 1,
    },
    selectionIds: ['task-a'],
    focusId: 'story-a',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-a',
        kind: 'goal',
        title: 'Workspace UX',
        description: '',
        status: 'in-progress',
        priority: 'high',
        childCount: 1,
        parentId: null,
        childIds: ['story-a'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'story-a',
        kind: 'story',
        title: 'Chat improvements',
        description: '',
        status: 'defined',
        priority: 'medium',
        childCount: 2,
        parentId: 'goal-a',
        childIds: ['task-a', 'task-b'],
        selected: false,
        focused: true,
        highlighted: false,
      },
      {
        id: 'task-a',
        kind: 'task',
        title: 'Add regenerate',
        description: '',
        status: 'pending',
        priority: 'low',
        parentId: 'story-a',
        childIds: [],
        selected: true,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-b',
        kind: 'task',
        title: 'Improve context formatting',
        description: '',
        status: 'pending',
        priority: 'high',
        parentId: 'story-a',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
    ],
    connections: [
      {
        id: 'conn-parent',
        fromId: 'goal-a',
        toId: 'story-a',
        relationType: 'parent_child',
      },
      {
        id: 'conn-blocks',
        fromId: 'task-a',
        toId: 'task-b',
        relationType: 'blocks',
      },
    ],
    viewport: {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      visibleElementIds: ['goal-a', 'story-a', 'task-a'],
    },
    recentActivity: [],
  },
  contextSummary: 'Profile: general-question. Primary focus: Story "Chat improvements".',
  workspaceSummary: 'Canvas "Main current flow" currently has 1 goals, 1 stories, and 2 tasks.',
  selection: [],
  focus: null,
  viewportItems: [],
  recentActivity: [],
  memory: { ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE },
  queryMatches: [],
};

describe('buildWorkspaceChatSystemPrompt', () => {
  it('includes canonical workspace context sections', () => {
    const prompt = buildWorkspaceChatSystemPrompt(assembledContext, true);

    expect(prompt).toContain('Workspace context:');
    expect(prompt).toContain('Summary');
    expect(prompt).toContain('Hierarchy');
    expect(prompt).toContain('Relations');
    expect(prompt).toContain('- Canvas: Main current flow');
    expect(prompt).toContain('- Goal [goal-a] "Workspace UX"');
    expect(prompt).toContain('  - Story [story-a] "Chat improvements"');
    expect(prompt).toContain(
      '- Task [task-a] "Add regenerate" blocks Task [task-b] "Improve context formatting"'
    );
    expect(prompt).not.toContain('parent_child');
    expect(prompt).not.toContain('Visible area:');
  });

  it('excludes system messages from model history', () => {
    const history: WorkspaceChatMessage[] = [
      {
        id: 'sys-1',
        role: 'assistant',
        kind: 'system',
        content: 'Created task "Add regenerate".',
        createdAt: 1,
      },
      {
        id: 'user-1',
        role: 'user',
        kind: 'default',
        content: 'What is still missing?',
        createdAt: 2,
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        kind: 'default',
        content: 'The story is still broad.',
        createdAt: 3,
      },
    ];

    const messages = buildWorkspaceChatApiMessages(
      'Review it again',
      assembledContext,
      history,
      true,
      6
    );

    expect(messages.map((message) => message.content)).not.toContain(
      'Created task "Add regenerate".'
    );
    expect(messages.map((message) => message.content)).toContain(
      'The story is still broad.'
    );
  });
});
