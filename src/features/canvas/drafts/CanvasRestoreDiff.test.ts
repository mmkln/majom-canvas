import { describe, expect, it } from 'vitest';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import { ElementStatus } from '../elements/ElementStatus.ts';
import type { CanvasDraftSnapshot } from './CanvasDraftRepository.ts';
import { diffCanvasRestoreSnapshots } from './CanvasRestoreDiff.ts';

function createBaseSnapshot(): CanvasDraftSnapshot {
  return {
    version: 2,
    canvasId: 'canvas-1',
    savedAt: '2026-04-04T10:00:00.000Z',
    baseCanvasMetaFingerprint: 'meta-v1',
    fingerprint: 'base',
    nodes: [
      {
        kind: 'task',
        id: 'task-1',
        uuid: 'task-uuid-1',
        x: 100,
        y: 200,
        title: 'Server task',
        description: 'Server description',
        status: ElementStatus.Pending,
        priority: 'medium',
        dueDate: null,
      },
      {
        kind: 'habit',
        id: 'habit-1',
        uuid: 'habit-uuid-1',
        x: 300,
        y: 400,
        title: 'Morning walk',
        description: '',
        priority: 'low',
        habitStatus: Status.Active,
        meta: null,
        completedToday: false,
        isDueToday: true,
        lastChecked: null,
        completionHistory: [],
      },
    ],
    connections: [],
    focusedElementId: null,
    highlightedElementIds: [],
  };
}

describe('diffCanvasRestoreSnapshots', () => {
  it('marks layout-affecting changes as structural', () => {
    const base = createBaseSnapshot();
    const restored: CanvasDraftSnapshot = {
      ...base,
      fingerprint: 'restored-1',
      nodes: base.nodes.map((node) =>
        node.id === 'task-1' ? { ...node, x: 180, y: 260 } : node
      ),
    };

    const diff = diffCanvasRestoreSnapshots(base, restored);

    expect(diff.hasStructuralChanges).toBe(true);
    expect(diff.structurallyChangedElementIds).toContain('task-1');
    expect(diff.elementPatchIntents).toEqual([]);
    expect(diff.habitMutationIntents).toEqual([]);
  });

  it('extracts replayable element patch intents for content-only changes', () => {
    const base = createBaseSnapshot();
    const restored: CanvasDraftSnapshot = {
      ...base,
      fingerprint: 'restored-2',
      nodes: base.nodes.map((node) =>
        node.id === 'task-1'
          ? {
              ...node,
              title: 'Draft task',
              description: 'Draft description',
              status: ElementStatus.InProgress,
              priority: 'high',
              dueDate: '2026-04-10T12:00:00.000Z',
            }
          : node
      ),
    };

    const diff = diffCanvasRestoreSnapshots(base, restored);

    expect(diff.hasStructuralChanges).toBe(false);
    expect(diff.structurallyChangedElementIds).toEqual([]);
    expect(diff.elementPatchIntents).toEqual([
      {
        elementId: 'task-1',
        patch: {
          title: 'Draft task',
          description: 'Draft description',
          status: ElementStatus.InProgress,
          priority: 'high',
          dueDate: new Date('2026-04-10T12:00:00.000Z'),
        },
      },
    ]);
  });

  it('extracts replayable habit lifecycle and completion mutations', () => {
    const base = createBaseSnapshot();
    const restored: CanvasDraftSnapshot = {
      ...base,
      fingerprint: 'restored-3',
      nodes: base.nodes.map((node) =>
        node.id === 'habit-1'
          ? {
              ...node,
              habitStatus: Status.Archived,
              completionHistory: [['2026-04-04', true]],
            }
          : node
      ),
    };

    const diff = diffCanvasRestoreSnapshots(base, restored);

    expect(diff.elementPatchIntents).toEqual([]);
    expect(diff.habitMutationIntents).toEqual([
      {
        elementId: 'habit-1',
        action: 'archive',
      },
      {
        elementId: 'habit-1',
        action: 'set-completion-date',
        date: '2026-04-04',
        completed: true,
      },
    ]);
  });
});
