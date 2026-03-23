import { describe, expect, it } from 'vitest';
import {
  buildAiAssistantDecisionMessages,
  buildAiAssistantRouterMessages,
} from './AiAssistantPlannerPromptBuilder.ts';
import { createAiAssistantTestMemory } from './AiAssistantTestUtils.ts';
import {
  createAiAssistantInstructionRegistry,
} from './AiAssistantInstructionRegistry.ts';
import { createAiAssistantToolRegistry } from './AiAssistantToolRegistry.ts';

describe('AiAssistantPlannerPromptBuilder', () => {
  it('lists exact allowed profiles instead of a vague placeholder', () => {
    const instructionRegistry = createAiAssistantInstructionRegistry();
    const toolRegistry = createAiAssistantToolRegistry();

    const messages = buildAiAssistantRouterMessages({
      prompt: 'чим можеш бути корисним?',
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        lastRecommendations: [],
      }),
      instructions: instructionRegistry.listIndex(),
      tools: toolRegistry.listForPlanner(),
    });

    expect(messages[0]?.content).toContain('"general-question"');
    expect(messages[0]?.content).toContain('"review-selection"');
    expect(messages[0]?.content).not.toContain('<AI assistant profile>');
  });

  it('uses a compact evidence packet in the decision path instead of raw tool JSON', () => {
    const instructionRegistry = createAiAssistantInstructionRegistry();
    const toolRegistry = createAiAssistantToolRegistry();

    const messages = buildAiAssistantDecisionMessages({
      prompt: 'декомпозуй поточну ціль у підцілі',
      profile: 'strategic-plan',
      contextMode: 'selection',
      memory: createAiAssistantTestMemory({
        currentIntent: 'strategic_plan',
      }),
      loadedInstructions: [
        instructionRegistry.getPacket('planning.strategic-plan')!,
      ],
      availableInstructions: instructionRegistry.listIndex(),
      tools: toolRegistry.listForPlanner(),
      toolResults: [
        {
          tool: 'get_focus_bundle',
          ok: true,
          data: {
            focus: {
              item: {
                id: 'goal-1',
                kind: 'goal',
                title: 'Launch v2',
                description: 'Deliver the next release with a stable checkout flow.',
              },
              parent: null,
              children: [],
              siblings: [],
              related: [],
            },
          },
        },
      ],
    });

    const userMessage = messages[messages.length - 1]?.content ?? '';

    expect(userMessage).toContain('Evidence packet:');
    expect(userMessage).not.toContain('Current tool results:');
    expect(userMessage).not.toContain('"tool": "get_focus_bundle"');
  });
});
