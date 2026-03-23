import { describe, expect, it } from 'vitest';
import { buildAiAssistantAnswerMessages } from './AiAssistantAnswerPromptBuilder.ts';
import { createAiAssistantTestMemory } from './AiAssistantTestUtils.ts';

describe('AiAssistantAnswerPromptBuilder', () => {
  it('uses a compact evidence packet instead of raw tool JSON', () => {
    const messages = buildAiAssistantAnswerMessages({
      prompt: 'покажи мені підтверджені факти',
      profile: 'general-question',
      memory: createAiAssistantTestMemory(),
      instructionPackets: [],
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
                description: '',
              },
              parent: null,
              children: [],
              siblings: [],
              related: [],
            },
          },
        },
      ],
      allowActions: true,
    });

    const userMessage = messages[1]?.content ?? '';

    expect(userMessage).toContain('Evidence packet:');
    expect(userMessage).not.toContain('Current tool results:');
    expect(userMessage).not.toContain('"tool": "get_focus_bundle"');
  });
});
