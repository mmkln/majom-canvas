import { describe, expect, it, vi } from 'vitest';
import { WorkspaceChatOrchestrator } from './WorkspaceChatOrchestrator.ts';
import {
  createWorkspaceChatTestMemory,
  createWorkspaceChatTestSnapshot,
} from './WorkspaceChatTestUtils.ts';

describe('WorkspaceChatOrchestrator', () => {
  it('uses deterministic intent plans without calling the planner model', async () => {
    const completeText = vi.fn(async (messages: Array<{ content: string }>) => {
      expect(messages[1]?.content).toContain('planning.readiness-check');
      return JSON.stringify({
        replyMarkdown: 'Structured reply',
        actions: [],
      });
    });
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'What is missing?',
      source: 'intent',
      intent: 'missing',
      snapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: true,
    });

    expect(reply.plan.calls.map((call) => call.tool)).toEqual([
      'get_focus_bundle',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
    ]);
    expect(reply.replyMarkdown).toBe('Structured reply');
  });

  it('uses planner and final answer model calls for manual requests', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'load_instructions',
          profile: 'review-selection',
          contextMode: 'selection',
          instructionIds: ['planning.review-selection'],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'execute_tools',
          profile: 'review-selection',
          contextMode: 'selection',
          calls: [{ tool: 'get_focus_bundle', input: { target: 'selection' } }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'review-selection',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'Planned reply',
          actions: [],
        })
      );
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(4);
    expect(reply.plan.calls).toEqual([
      { tool: 'get_focus_bundle', input: { target: 'selection' } },
    ]);
    expect(reply.actions).toEqual([]);
  });

  it('preserves allowActions and validation snapshot during final parse', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'review-selection',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'Reply with invalid action',
          actions: [
            {
              kind: 'suggest_update',
              elementId: 'missing-id',
              elementKind: 'task',
              patch: {
                title: 'Updated title',
              },
            },
          ],
        })
      );
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createWorkspaceChatTestSnapshot(),
      validationSnapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: true,
    });

    expect(reply.actions).toEqual([]);
    expect(reply.replyMarkdown).toBe('Reply with invalid action');
  });

  it('can return a follow-up question without calling the final answer model', async () => {
    const completeText = vi.fn(async () =>
      JSON.stringify({
        kind: 'ask_followup',
        profile: 'general-question',
        contextMode: 'selection',
        question: 'Which story should I inspect?',
      })
    );
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review it',
      source: 'manual',
      snapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(1);
    expect(reply.replyMarkdown).toBe('Which story should I inspect?');
    expect(reply.actions).toEqual([]);
  });

  it('repairs one invalid router response before continuing', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce('not json')
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'review-selection',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'Recovered reply',
          actions: [],
        })
      );
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(3);
    expect(completeText.mock.calls[1]?.[0]?.[0]?.content).toContain(
      'You repair invalid JSON emitted by a routing model.'
    );
    expect(reply.replyMarkdown).toBe('Recovered reply');
  });

  it('repairs one invalid final envelope before parsing it', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'review-selection',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce('Plain markdown reply')
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'Repaired structured reply',
          actions: [],
        })
      );
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createWorkspaceChatTestSnapshot(),
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(3);
    expect(completeText.mock.calls[2]?.[0]?.[0]?.content).toContain(
      'You repair invalid workspace chat responses into the required structured JSON envelope.'
    );
    expect(reply.replyMarkdown).toBe('Repaired structured reply');
  });
});
