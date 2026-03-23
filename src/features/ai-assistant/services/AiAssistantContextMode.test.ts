import { describe, expect, it } from 'vitest';
import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import { scopeAiAssistantContext } from './AiAssistantContextMode.ts';

function makeSnapshot(): AiAssistantCanvasSnapshot {
  return {
    canvasId: 'canvas-a',
    canvasTitle: 'Canvas A',
    summary: {
      goalCount: 1,
      storyCount: 1,
      taskCount: 2,
      selectedCount: 1,
    },
    selectionIds: ['task-a'],
    focusId: 'task-a',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-a',
        kind: 'goal',
        title: 'Goal A',
        description: '',
        status: 'defined',
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
        title: 'Story A',
        description: '',
        status: 'in-progress',
        priority: 'medium',
        childCount: 2,
        parentId: 'goal-a',
        childIds: ['task-a', 'task-b'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-a',
        kind: 'task',
        title: 'Task A',
        description: '',
        status: 'pending',
        priority: 'lowest',
        parentId: 'story-a',
        childIds: [],
        selected: true,
        focused: true,
        highlighted: false,
      },
      {
        id: 'task-b',
        kind: 'task',
        title: 'Task B',
        description: '',
        status: 'done',
        priority: 'low',
        parentId: 'story-a',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
    ],
    connections: [
      {
        id: 'rel-1',
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
      visibleElementIds: ['story-a', 'task-b'],
    },
    recentActivity: [
      {
        id: 'recent-1',
        type: 'selection',
        label: 'Selected Task A',
        entityIds: ['task-a'],
        timestamp: 1,
      },
    ],
  };
}

describe('scopeAiAssistantContext', () => {
  it('returns only visible items in viewport mode', () => {
    const scoped = scopeAiAssistantContext(makeSnapshot(), 'viewport');

    expect(scoped?.elements.map((item) => item.id)).toEqual(['story-a', 'task-b']);
    expect(scoped?.summary).toEqual({
      goalCount: 0,
      storyCount: 1,
      taskCount: 1,
      selectedCount: 0,
    });
  });

  it('keeps selected items with nearby structure in selection mode', () => {
    const scoped = scopeAiAssistantContext(makeSnapshot(), 'selection');

    expect(scoped?.elements.map((item) => item.id)).toEqual([
      'story-a',
      'task-a',
      'task-b',
    ]);
    expect(scoped?.selectionIds).toEqual(['task-a']);
    expect(scoped?.focusId).toBe('task-a');
  });

  it('returns null when selection mode has no selected items', () => {
    const snapshot = makeSnapshot();
    snapshot.selectionIds = [];
    snapshot.focusId = null;
    snapshot.summary.selectedCount = 0;
    snapshot.elements = snapshot.elements.map((item) => ({
      ...item,
      selected: false,
      focused: false,
    }));

    expect(scopeAiAssistantContext(snapshot, 'selection')).toBeNull();
  });
});
