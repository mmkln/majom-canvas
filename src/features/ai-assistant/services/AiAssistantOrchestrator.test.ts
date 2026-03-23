import { describe, expect, it, vi } from 'vitest';
import { AiAssistantOrchestrator } from './AiAssistantOrchestrator.ts';
import {
  createAiAssistantTestMemory,
  createAiAssistantTestSnapshot,
} from './AiAssistantTestUtils.ts';
import { createAiAssistantTelemetryCollector } from './AiAssistantTelemetryStore.ts';

describe('AiAssistantOrchestrator', () => {
  it('uses deterministic intent plans without calling the planner model', async () => {
    const completeText = vi.fn(async (messages: Array<{ content: string }>) => {
      expect(messages[1]?.content).toContain('planning.readiness-check');
      return JSON.stringify({
        replyMarkdown: 'Structured reply',
        actions: [],
      });
    });
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'What is missing?',
      source: 'intent',
      intent: 'missing',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
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

  it('records telemetry for command-spec replies, including token usage', async () => {
    const collector = createAiAssistantTelemetryCollector();
    const completeTextWithMetadata = vi.fn(async () => ({
      content: JSON.stringify({
        replyMarkdown: 'Do you want stories or tasks?',
        actions: [],
      }),
      usage: {
        promptTokens: 11,
        completionTokens: 4,
        totalTokens: 15,
      },
    }));
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText: vi.fn(async () => {
          throw new Error('completeText should not be used when metadata is available.');
        }),
        completeTextWithMetadata,
      },
      telemetry: collector,
    });

    const reply = await orchestrator.reply({
      prompt: 'декомпозуй поточну ціль',
      source: 'intent',
      intent: 'breakdown',
      intentContext: {
        breakdownMode: 'unspecified_goal_decomposition',
      },
      telemetryContext: {
        conversationKey: 'canvas:test',
        requestId: 'request-1',
      },
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(reply.replyMarkdown).toBe('Do you want stories or tasks?');
    expect(completeTextWithMetadata).toHaveBeenCalledTimes(1);
    const events = collector.snapshot();
    const interaction = events.find((event) => event.kind === 'interaction');
    expect(interaction).toMatchObject({
      kind: 'interaction',
      routeType: 'intent',
      intent: 'breakdown',
      commandSpecUsed: true,
      toolCallCount: 1,
      repairAttempts: 0,
      invalidEnvelopeCount: 0,
      tokenUsage: {
        totalTokens: 15,
      },
      outcome: 'reply',
    });
    expect(events.some((event) => event.kind === 'repair')).toBe(false);
  });

  it('records repair telemetry when a command-spec reply is repaired', async () => {
    const collector = createAiAssistantTelemetryCollector();
    const completeTextWithMetadata = vi
      .fn()
      .mockResolvedValueOnce({
        content: 'not json',
        usage: {
          totalTokens: 5,
        },
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({
          replyMarkdown: 'Need a little more detail.',
          actions: [],
        }),
        usage: {
          totalTokens: 7,
        },
      });
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText: vi.fn(async () => {
          throw new Error('completeText should not be used when metadata is available.');
        }),
        completeTextWithMetadata,
      },
      telemetry: collector,
    });

    const reply = await orchestrator.reply({
      prompt: 'декомпозуй поточну ціль',
      source: 'intent',
      intent: 'breakdown',
      intentContext: {
        breakdownMode: 'unspecified_goal_decomposition',
      },
      telemetryContext: {
        conversationKey: 'canvas:test',
        requestId: 'request-2',
      },
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(reply.replyMarkdown).toBe('Need a little more detail.');
    expect(completeTextWithMetadata).toHaveBeenCalledTimes(2);
    const events = collector.snapshot();
    expect(events.some((event) => event.kind === 'repair')).toBe(true);
    expect(events.find((event) => event.kind === 'repair')).toMatchObject({
      kind: 'repair',
      stage: 'command',
      attempt: 1,
    });
    expect(events.find((event) => event.kind === 'interaction')).toMatchObject({
      kind: 'interaction',
      repairAttempts: 1,
      invalidEnvelopeCount: 1,
      tokenUsage: {
        totalTokens: 12,
      },
    });
  });

  it('emits staged progress updates while building an intent reply', async () => {
    const progress: Array<{
      phase: string;
      label: string;
      detail?: string;
      currentStep?: number;
      totalSteps?: number;
    }> = [];
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText: vi.fn(async () =>
          JSON.stringify({
            replyMarkdown: 'Structured reply',
            actions: [],
          })
        ),
      },
    });

    await orchestrator.reply({
      prompt: 'What is missing?',
      source: 'intent',
      intent: 'missing',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: true,
      onProgress: (entry) => {
        progress.push(entry);
      },
    });

    expect(progress[0]).toMatchObject({
      phase: 'routing',
      label: 'Preparing workflow',
    });
    expect(progress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: 'instructions',
          label: 'Loading instructions',
        }),
        expect.objectContaining({
          phase: 'tools',
          label: 'Checking workspace context',
          detail: 'Inspecting the focus item and nearby structure.',
          currentStep: 1,
          totalSteps: 4,
        }),
        expect.objectContaining({
          phase: 'drafting',
          label: 'Drafting structured reply',
        }),
      ])
    );
  });

  it('uses a command-spec flow for fill_details and repairs invalid command payloads', async () => {
    const baseSnapshot = createAiAssistantTestSnapshot();
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
    const orchestrator = new AiAssistantOrchestrator({
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
      memory: createAiAssistantTestMemory({
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

  it('repairs a repeated fill-details follow-up into an update when the user already supplied concrete details', async () => {
    const snapshot = {
      canvasId: 'canvas-physique',
      canvasTitle: 'Body goals',
      summary: {
        goalCount: 1,
        storyCount: 0,
        taskCount: 0,
        selectedCount: 1,
      },
      selectionIds: ['goal-physique'],
      focusId: 'goal-physique',
      highlightedIds: [],
      elements: [
        {
          id: 'goal-physique',
          kind: 'goal' as const,
          title: 'Єбєйша фіз форма',
          description: '',
          status: 'todo' as const,
          priority: 'high' as const,
          childCount: 0,
          parentId: null,
          childIds: [],
          selected: true,
          focused: true,
          highlighted: false,
        },
      ],
      connections: [],
      viewport: null,
      recentActivity: [],
    };
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown:
            'What parent project or related goals support adding 85kg minimum, big shoulders, chest, abs, forearms, glutes, and legs?',
          actions: [],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown:
            'Я підготував опис цілі на основі конкретних параметрів, які ти щойно дав.',
          actions: [
            {
              kind: 'suggest_update',
              elementId: 'goal-physique',
              patch: {
                description:
                  'Мінімум 85 кг, великі плечі й грудні мязи, 6-пак прес, сильні передпліччя та накачані ноги.',
              },
              reason:
                'Це напряму використовує конкретні критерії форми, які користувач щойно задав.',
            },
          ],
        })
      );
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt:
        'кілограм 85 це мінімум, далі великі плечі, великі грудні мязи, 6 пак прес, здорові передпліччя і ноги накачані.',
      source: 'intent',
      intent: 'fill_details',
      snapshot,
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(completeText.mock.calls[1]?.[0]?.[2]?.content).toContain(
      'Fill_details should use the explicit user details instead of asking another follow-up question.'
    );
    expect(reply.actions).toHaveLength(1);
    expect(reply.actions[0]?.kind).toBe('suggest_update');
    expect(reply.actions[0]).toMatchObject({
      elementId: 'goal-physique',
      patch: {
        description:
          'Мінімум 85 кг, великі плечі й грудні мязи, 6-пак прес, сильні передпліччя та накачані ноги.',
      },
    });
  });

  it('uses a command-spec flow for dependencies and repairs prose-only analysis into relation actions', async () => {
    const baseSnapshot = createAiAssistantTestSnapshot();
    const snapshot = {
      ...baseSnapshot,
      selectionIds: ['story-1', 'story-2'],
      focusId: 'story-1',
      summary: {
        ...baseSnapshot.summary,
        selectedCount: 2,
      },
      elements: baseSnapshot.elements.map((element) => ({
        ...element,
        selected: element.id === 'story-1' || element.id === 'story-2',
        focused: element.id === 'story-1',
      })),
      connections: baseSnapshot.connections.filter(
        (connection) => connection.relationType === 'parent_child'
      ),
    };
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: [
            'Cluster overview:',
            'Checkout flow likely leads_to Post-purchase.',
            'Which relation should I suggest first?',
          ].join('\n'),
          actions: [],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown:
            'I suggested one sequence link so the selected stories read in execution order.',
          actions: [
            {
              kind: 'suggest_relations',
              relations: [
                {
                  fromId: 'story-1',
                  toId: 'story-2',
                  relationType: 'leads_to',
                  reason:
                    'Checkout flow naturally precedes post-purchase work in the selected cluster.',
                },
              ],
            },
          ],
        })
      );
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Analyze the selected cluster and suggest relations.',
      source: 'intent',
      intent: 'dependencies',
      snapshot,
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(completeText.mock.calls[0]?.[0]?.[0]?.content).toContain(
      'workspace action command "dependencies"'
    );
    expect(completeText.mock.calls[1]?.[0]?.[0]?.content).toContain(
      'Repair the previous answer into one valid command reply JSON object.'
    );
    expect(reply.actions).toHaveLength(1);
    expect(reply.actions[0]?.kind).toBe('suggest_relation');
    expect(reply.actions[0]).toMatchObject({
      fromId: 'story-1',
      toId: 'story-2',
      relationType: 'leads_to',
    });
  });

  it('classifies manual requests before running the response flow', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: 'review',
          confidence: 0.95,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'Planned reply',
          actions: [],
        })
      );
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(completeText.mock.calls[0]?.[0]?.[0]?.content).toContain(
      'classify workspace requests into scenarios'
    );
    expect(reply.plan.calls).toEqual([
      { tool: 'get_focus_bundle', input: { target: 'selection' } },
    ]);
    expect(reply.actions).toEqual([]);
  });

  it('classifies a manual prompt into a typed breakdown scenario', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: 'breakdown',
          breakdownMode: 'story_tasks',
          confidence: 0.96,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          replyMarkdown: 'I split the selected story into tasks.',
          actions: [
            {
              kind: 'create_batch_tasks',
              title: 'Task group',
              summary: 'Split the story into next actions.',
              target: {
                kind: 'story',
                id: 'story-1',
              },
              items: [
                {
                  title: 'Confirm the checkout step',
                },
                {
                  title: 'Define the receipt email',
                },
              ],
            },
          ],
        })
      );
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Please break the selected story into tasks.',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: true,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(completeText.mock.calls[0]?.[0]?.[0]?.content).toContain(
      'classify workspace requests into scenarios'
    );
    expect(completeText.mock.calls[1]?.[0]?.[0]?.content).toContain(
      'workspace action command "breakdown"'
    );
    expect(reply.replyMarkdown).toBe('I split the selected story into tasks.');
    expect(reply.actions).toHaveLength(2);
    expect(reply.actions.map((action) => action.kind)).toEqual([
      'create_task',
      'create_task',
    ]);
  });

  it('can answer capability questions by loading capability instructions and frontend context', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: null,
          confidence: 0.15,
        })
      )
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
    const snapshot = createAiAssistantTestSnapshot();
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'привіт, чим можеш бути корисний?',
      source: 'manual',
      snapshot,
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: false,
      liveHost: {
        getAiAssistantSnapshot: () => snapshot,
        getAiAssistantCapabilities: () => ({
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

    expect(completeText).toHaveBeenCalledTimes(6);
    expect(completeText.mock.calls[1]?.[0]?.[1]?.content).toContain(
      'planning.capability-help'
    );
    expect(completeText.mock.calls[2]?.[0]?.[1]?.content).toContain(
      'Original router request:'
    );
    expect(completeText.mock.calls[2]?.[0]?.[1]?.content).toContain(
      'get_chat_capabilities'
    );
    expect(completeText.mock.calls[4]?.[0]?.[1]?.content).toContain(
      'planning.capability-help'
    );
    expect(completeText.mock.calls[5]?.[0]?.[2]?.content).toContain(
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
          intent: null,
          confidence: 0.15,
        })
      )
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
    const snapshot = createAiAssistantTestSnapshot();
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'чим можеш бути корисним?',
      source: 'manual',
      snapshot,
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      allowActions: false,
      liveHost: {
        getAiAssistantSnapshot: () => snapshot,
        getAiAssistantCapabilities: () => ({
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
          intent: null,
          confidence: 0.15,
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
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      validationSnapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: true,
    });

    expect(reply.actions).toEqual([]);
    expect(reply.replyMarkdown).toBe('Reply with invalid action');
  });

  it('can return a follow-up question without calling the final answer model', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: null,
          confidence: 0.15,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          kind: 'ask_followup',
          profile: 'general-question',
          contextMode: 'selection',
          question: 'Which story should I inspect?',
        })
      );
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review it',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(2);
    expect(reply.replyMarkdown).toBe('Which story should I inspect?');
    expect(reply.actions).toEqual([]);
  });

  it('repairs one invalid router response before continuing', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: null,
          confidence: 0.15,
        })
      )
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
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(4);
    expect(completeText.mock.calls[2]?.[0]?.[0]?.content).toContain(
      'You repair invalid JSON emitted by a routing model.'
    );
    expect(reply.replyMarkdown).toBe('Recovered reply');
  });

  it('repairs one invalid final envelope before parsing it', async () => {
    const completeText = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          intent: null,
          confidence: 0.15,
        })
      )
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
    const orchestrator = new AiAssistantOrchestrator({
      apiClient: {
        completeText,
      },
    });

    const reply = await orchestrator.reply({
      prompt: 'Review the selected work',
      source: 'manual',
      snapshot: createAiAssistantTestSnapshot(),
      contextMode: 'selection',
      memory: createAiAssistantTestMemory(),
      allowActions: false,
    });

    expect(completeText).toHaveBeenCalledTimes(4);
    expect(completeText.mock.calls[3]?.[0]?.[0]?.content).toContain(
      'You repair invalid AI assistant responses into the required structured JSON envelope.'
    );
    expect(reply.replyMarkdown).toBe('Repaired structured reply');
  });
});
