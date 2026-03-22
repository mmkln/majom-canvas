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

  it('uses a command-spec flow for fill_details and repairs invalid command payloads', async () => {
    const baseSnapshot = createWorkspaceChatTestSnapshot();
    const snapshot = {
      ...baseSnapshot,
      selectionIds: ['story-2'],
      focusId: 'story-2',
      summary: {
        ...baseSnapshot.summary,
        selectedCount: 1,
      },
      elements: baseSnapshot.elements.map((element) => ({
        ...element,
        selected: element.id === 'story-2',
        focused: element.id === 'story-2',
      })),
    };
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'I prepared an update.',
          actions: [
            {
              kind: 'suggest_update',
              itemId: 'story-2',
              title: 'Post-purchase',
              description: 'Clarify the post-purchase work.',
            },
          ],
          reviewFindings: {
            title: 'Should not be here',
            findings: [],
          },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'I found one concrete detail to add from the nearby canvas context.',
          actions: [
            {
              kind: 'suggest_update',
              elementId: 'story-2',
              patch: {
                description:
                  'Cover the receipt email follow-up after purchase so the next step is explicit.',
              },
              reason:
                'This uses the child task about the receipt email to make the story scope concrete.',
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
      prompt:
        'Fill in the missing details for the selected story "Post-purchase".',
      source: 'intent',
      intent: 'fill_details',
      snapshot,
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(completeText.mock.calls[0]?.[0]?.[0]?.content).toContain(
      'workspace action command "fill_details"'
    );
    expect(completeText.mock.calls[0]?.[0]?.[2]?.content).toContain(
      'Prepared command context:'
    );
    expect(completeText.mock.calls[0]?.[0]?.[2]?.content).not.toContain(
      'Tool results:'
    );
    expect(completeText.mock.calls[0]?.[0]?.[2]?.content).not.toContain(
      'recentActivity'
    );
    expect(completeText.mock.calls[0]?.[0]?.[2]?.content).not.toContain(
      'viewport'
    );
    expect(completeText.mock.calls[1]?.[0]?.[0]?.content).toContain(
      'Repair the previous answer into one valid command reply JSON object.'
    );
    expect(reply.actions).toHaveLength(1);
    expect(reply.actions[0]?.kind).toBe('suggest_update');
    expect(reply.replyMarkdown).toBe(
      'I found one concrete detail to add from the nearby canvas context.'
    );
    expect(reply.reviewFindings).toBeUndefined();
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

  it('can answer capability questions by loading capability instructions and frontend context', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        'Привіт! Я можу допомогти з плануванням на канвасі, перевіркою структури, наступними кроками та уточненням вибраних елементів.'
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'load_instructions',
          profile: 'general-question',
          contextMode: 'selection',
          instructionIds: ['planning.capability-help'],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'execute_tools',
          profile: 'general-question',
          contextMode: 'selection',
          calls: [{ tool: 'get_chat_capabilities', input: {} }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'general-question',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown:
            'I can help review the selected work, point out what is missing, suggest next steps, and propose confirm-first updates like clarifying or filling missing details.',
          actions: [],
        })
      );
    const snapshot = createWorkspaceChatTestSnapshot();
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'привіт, чим можеш бути корисний?',
      source: 'manual',
      snapshot,
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: false,
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
          supportedWorkflows: ['Review selected work', 'Suggest next steps'],
          currentQuickActions: ['Review selection', 'Next steps'],
          currentAiActions: ['Clarify', 'Fill missing details'],
          constraints: ['Confirm-first changes only.'],
        }),
      },
    });

    expect(completeText).toHaveBeenCalledTimes(5);
    expect(completeText.mock.calls[0]?.[0]?.[1]?.content).toContain(
      'planning.capability-help'
    );
    expect(completeText.mock.calls[1]?.[0]?.[1]?.content).toContain(
      'Original router request:'
    );
    expect(completeText.mock.calls[1]?.[0]?.[1]?.content).toContain(
      'get_chat_capabilities'
    );
    expect(completeText.mock.calls[3]?.[0]?.[1]?.content).toContain(
      'planning.capability-help'
    );
    expect(completeText.mock.calls[4]?.[0]?.[2]?.content).toContain(
      'get_chat_capabilities'
    );
    expect(reply.replyMarkdown).toContain('review the selected work');
    expect(reply.actions).toEqual([]);
  });

  it('normalizes router profile aliases such as workspace into general-question', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'load_instructions',
          profile: 'workspace',
          contextMode: 'selection',
          instructionIds: ['planning.capability-help'],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'execute_tools',
          profile: 'workspace',
          contextMode: 'selection',
          calls: [{ tool: 'get_chat_capabilities', input: {} }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'finalize',
          profile: 'workspace',
          contextMode: 'selection',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'I can help with grounded planning tasks in this workspace.',
          actions: [],
        })
      );
    const snapshot = createWorkspaceChatTestSnapshot();
    const orchestrator = new WorkspaceChatOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'чим можеш бути корисним?',
      source: 'manual',
      snapshot,
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: false,
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
          supportedWorkflows: ['Review selected work'],
          currentQuickActions: ['Review selection'],
          currentAiActions: ['Clarify'],
          constraints: ['Confirm-first changes only.'],
        }),
      },
    });

    expect(reply.plan.profile).toBe('general-question');
    expect(reply.replyMarkdown).toContain('grounded planning tasks');
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
