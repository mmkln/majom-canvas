import { describe, expect, it } from 'vitest';
import { buildAiAssistantRouterMessages } from './AiAssistantPlannerPromptBuilder.ts';
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
});
