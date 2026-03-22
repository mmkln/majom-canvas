import { describe, expect, it } from 'vitest';
import {
  getFocusBundle,
  getRelations,
  getSelectionCluster,
} from './WorkspaceChatSnapshotLens.ts';
import { createWorkspaceChatTestSnapshot } from './WorkspaceChatTestUtils.ts';

describe('WorkspaceChatSnapshotLens', () => {
  it('returns focus bundle for single selection', () => {
    const snapshot = createWorkspaceChatTestSnapshot({
      selectionIds: ['story-1'],
      focusId: 'story-1',
    });

    const focus = getFocusBundle(snapshot, { target: 'selection' });

    expect(focus?.item.id).toBe('story-1');
    expect(focus?.parent?.id).toBe('goal-1');
    expect(focus?.children.map((item) => item.id)).toEqual(['task-1', 'task-2']);
  });

  it('builds a selection cluster for multiple selected items', () => {
    const snapshot = createWorkspaceChatTestSnapshot({
      selectionIds: ['story-1', 'story-2'],
      summary: {
        goalCount: 1,
        storyCount: 2,
        taskCount: 3,
        selectedCount: 2,
      },
      elements: createWorkspaceChatTestSnapshot().elements.map((element) => ({
        ...element,
        selected: element.id === 'story-1' || element.id === 'story-2',
      })),
    });

    const cluster = getSelectionCluster(snapshot);

    expect(cluster?.selectionIds).toEqual(['story-1', 'story-2']);
    expect(cluster?.elements.map((element) => element.id)).toEqual([
      'goal-1',
      'story-1',
      'story-2',
      'task-1',
      'task-2',
      'task-3',
    ]);
  });

  it('returns null cluster when target ids are missing', () => {
    const snapshot = createWorkspaceChatTestSnapshot();

    const cluster = getSelectionCluster(snapshot, ['missing-id']);

    expect(cluster).toBeNull();
  });

  it('scopes relations to requested ids', () => {
    const snapshot = createWorkspaceChatTestSnapshot();

    const relations = getRelations(snapshot, ['story-1']);

    expect(relations.map((relation) => relation.id)).toEqual(['rel-2', 'rel-parent-1']);
  });
});
