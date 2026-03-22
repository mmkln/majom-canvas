import { describe, expect, it } from 'vitest';
import { WORKSPACE_CHAT_SNAPSHOT_TOOLS } from './WorkspaceChatSnapshotTools.ts';
import {
  createWorkspaceChatTestMemory,
  createWorkspaceChatTestSnapshot,
} from './WorkspaceChatTestUtils.ts';

function getTool(name: string) {
  const tool = WORKSPACE_CHAT_SNAPSHOT_TOOLS.find((entry) => entry.name === name);
  if (!tool) {
    throw new Error(`Missing tool ${name}`);
  }
  return tool;
}

describe('WorkspaceChatSnapshotTools', () => {
  it('returns a narrow focus bundle without live host', async () => {
    const tool = getTool('get_focus_bundle');
    const result = await tool.execute(
      { target: 'selection' },
      {
        runtime: {
          snapshot: createWorkspaceChatTestSnapshot(),
          memory: createWorkspaceChatTestMemory(),
          prompt: 'Review the selected story',
          contextMode: 'selection',
        },
        previousResults: [],
      }
    );

    expect((result as { focus: { item: { id: string } } | null }).focus?.item.id).toBe(
      'story-1'
    );
  });

  it('returns a scoped selection cluster', async () => {
    const tool = getTool('get_selection_cluster');
    const result = await tool.execute(
      { ids: ['story-1'] },
      {
        runtime: {
          snapshot: createWorkspaceChatTestSnapshot(),
          memory: createWorkspaceChatTestMemory(),
          prompt: 'Inspect this story',
          contextMode: 'selection',
        },
        previousResults: [],
      }
    );

    const cluster = (result as { cluster: { elements: Array<{ id: string }> } | null }).cluster;
    expect(cluster?.elements.map((element) => element.id)).toEqual([
      'goal-1',
      'story-1',
      'story-2',
      'task-1',
      'task-2',
    ]);
  });

  it('falls back to live host when runtime snapshot is missing', async () => {
    const tool = getTool('get_recent_activity');
    const snapshot = createWorkspaceChatTestSnapshot();
    const result = await tool.execute(
      {},
      {
        runtime: {
          snapshot: null,
          liveHost: {
            getWorkspaceChatSnapshot: () => snapshot,
          },
          memory: createWorkspaceChatTestMemory(),
          prompt: 'Show recent activity',
          contextMode: 'canvas',
        },
        previousResults: [],
      }
    );

    expect(
      (result as { recentActivity: Array<{ id: string }> }).recentActivity.map(
        (item) => item.id
      )
    ).toEqual(['activity-1', 'activity-2']);
  });

  it('returns frontend-backed chat capabilities when requested', async () => {
    const tool = getTool('get_chat_capabilities');
    const snapshot = createWorkspaceChatTestSnapshot();
    const result = await tool.execute(
      {},
      {
        runtime: {
          snapshot,
          liveHost: {
            getWorkspaceChatSnapshot: () => snapshot,
            getWorkspaceChatCapabilities: () => ({
              assistantScope: 'Workspace planning copilot.',
              currentView: 'canvas',
              canvasTitle: 'Main current flow',
              currentSelection: {
                count: 1,
                summary: 'Current selection: Story "Checkout flow".',
              },
              contextModes: [],
              supportedWorkflows: ['Review plan'],
              currentQuickActions: ['Review selection'],
              currentAiActions: ['Clarify'],
              constraints: ['Confirm-first changes only.'],
            }),
          },
          memory: createWorkspaceChatTestMemory(),
          prompt: 'What can you do here?',
          contextMode: 'selection',
        },
        previousResults: [],
      }
    );

    expect(
      (result as { capabilities: { currentQuickActions: string[] } }).capabilities
        .currentQuickActions
    ).toEqual(['Review selection']);
  });
});
