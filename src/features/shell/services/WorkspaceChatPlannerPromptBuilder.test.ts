import { describe, expect, it } from 'vitest';
import { buildWorkspaceChatRouterMessages } from './WorkspaceChatPlannerPromptBuilder.ts';
import { createWorkspaceChatTestMemory } from './WorkspaceChatTestUtils.ts';
import {
  createWorkspaceChatInstructionRegistry,
} from './WorkspaceChatInstructionRegistry.ts';
import { createWorkspaceChatToolRegistry } from './WorkspaceChatToolRegistry.ts';

describe('WorkspaceChatPlannerPromptBuilder', () => {
  it('lists exact allowed profiles instead of a vague placeholder', () => {
    const instructionRegistry = createWorkspaceChatInstructionRegistry();
    const toolRegistry = createWorkspaceChatToolRegistry();

    const messages = buildWorkspaceChatRouterMessages({
      prompt: 'чим можеш бути корисним?',
      contextMode: 'selection',
      memory: createWorkspaceChatTestMemory({
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
    expect(messages[0]?.content).not.toContain('<workspace chat profile>');
  });
});
