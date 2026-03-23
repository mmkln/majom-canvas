import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  EMPTY_AI_ASSISTANT_MEMORY_STATE,
  type AiAssistantMemoryState,
} from './AiAssistantContextTypes.ts';

export function createAiAssistantTestSnapshot(
  overrides: Partial<AiAssistantCanvasSnapshot> = {}
): AiAssistantCanvasSnapshot {
  const snapshot: AiAssistantCanvasSnapshot = {
    canvasId: 'canvas-main',
    canvasTitle: 'Main current flow',
    summary: {
      goalCount: 1,
      storyCount: 2,
      taskCount: 3,
      selectedCount: 1,
    },
    selectionIds: ['story-1'],
    focusId: 'story-1',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-1',
        kind: 'goal',
        title: 'Launch v2',
        description: 'Deliver the next release with a stable checkout flow.',
        status: 'in_progress',
        priority: 'high',
        childCount: 2,
        parentId: null,
        childIds: ['story-1', 'story-2'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'story-1',
        kind: 'story',
        title: 'Checkout flow',
        description: 'Improve payment and order confirmation flow.',
        status: 'todo',
        priority: 'medium',
        childCount: 2,
        parentId: 'goal-1',
        childIds: ['task-1', 'task-2'],
        selected: true,
        focused: true,
        highlighted: false,
      },
      {
        id: 'story-2',
        kind: 'story',
        title: 'Post-purchase',
        description: '',
        status: 'todo',
        priority: 'low',
        childCount: 1,
        parentId: 'goal-1',
        childIds: ['task-3'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-1',
        kind: 'task',
        title: 'Payment form',
        description: '',
        status: 'todo',
        priority: 'high',
        parentId: 'story-1',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-2',
        kind: 'task',
        title: 'Receipt email',
        description: 'Send a confirmation after successful payment.',
        status: 'todo',
        priority: 'medium',
        parentId: 'story-1',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-3',
        kind: 'task',
        title: 'Receipt email',
        description: '',
        status: 'todo',
        priority: 'low',
        parentId: 'story-2',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
    ],
    connections: [
      {
        id: 'rel-1',
        fromId: 'task-1',
        toId: 'task-2',
        relationType: 'blocks',
      },
      {
        id: 'rel-2',
        fromId: 'story-1',
        toId: 'story-2',
        relationType: 'relates_to',
      },
      {
        id: 'rel-parent-1',
        fromId: 'goal-1',
        toId: 'story-1',
        relationType: 'parent_child',
      },
      {
        id: 'rel-parent-2',
        fromId: 'goal-1',
        toId: 'story-2',
        relationType: 'parent_child',
      },
    ],
    viewport: {
      minX: 0,
      minY: 0,
      maxX: 800,
      maxY: 600,
      visibleElementIds: ['goal-1', 'story-1', 'task-1', 'task-2'],
    },
    recentActivity: [
      {
        id: 'activity-1',
        type: 'updated',
        label: 'Updated story "Checkout flow"',
        entityIds: ['story-1'],
        timestamp: 1,
      },
      {
        id: 'activity-2',
        type: 'selection',
        label: 'Selection changed to story "Checkout flow"',
        entityIds: ['story-1'],
        timestamp: 2,
      },
      {
        id: 'activity-3',
        type: 'updated',
        label: 'Updated task "Payment form"',
        entityIds: ['task-1'],
        timestamp: 3,
      },
    ],
  };

  return {
    ...snapshot,
    ...overrides,
    summary: {
      ...snapshot.summary,
      ...(overrides.summary ?? {}),
    },
    viewport:
      overrides.viewport === undefined
        ? snapshot.viewport
        : overrides.viewport === null
          ? null
          : {
              ...snapshot.viewport!,
              ...overrides.viewport,
            },
  };
}

export function createAiAssistantTestMemory(
  overrides: Partial<AiAssistantMemoryState> = {}
): AiAssistantMemoryState {
  return {
    ...EMPTY_AI_ASSISTANT_MEMORY_STATE,
    currentIntent: 'Review checkout plan',
    conversationSummary: 'Discussing checkout planning gaps.',
    agreedFacts: ['Canvas has a goal and two stories.'],
    lastRecommendations: ['Clarify missing tasks.'],
    ...overrides,
  };
}
