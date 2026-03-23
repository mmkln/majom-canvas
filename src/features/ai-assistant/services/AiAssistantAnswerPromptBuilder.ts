import {
  AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES,
  AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE,
} from './AiAssistantStructuredTransport.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type {
  AiAssistantMemoryState,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import type { AiAssistantInstructionPacket } from './AiAssistantInstructionTypes.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import { describeAiAssistantStructuredReplyKinds } from './AiAssistantActionPolicy.ts';

export function buildAiAssistantAnswerMessages(params: {
  prompt: string;
  intent?: AiAssistantIntentKind;
  profile: AiAssistantProfile;
  memory: AiAssistantMemoryState;
  instructionPackets: AiAssistantInstructionPacket[];
  toolResults: AiAssistantToolResult[];
  allowActions: boolean;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: buildAnswerSystemPromptForIntent(
        params.allowActions,
        params.intent
      ),
    },
  ];

  const instructionMessage = buildInstructionPacketSystemMessage(
    params.instructionPackets
  );
  if (instructionMessage) {
    messages.push({
      role: 'system',
      content: instructionMessage,
    });
  }

  messages.push({
    role: 'user',
    content: [
      `Profile: ${params.profile}`,
      `User request: ${params.prompt.trim()}`,
      buildAnswerMemorySection(params.memory),
      `Tool results:\n${JSON.stringify(params.toolResults, null, 2)}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  return messages;
}

function buildAnswerSystemPromptForIntent(
  allowActions: boolean,
  intent: AiAssistantIntentKind | undefined
): string {
  const lines = [
    'You are a concise product planning assistant embedded inside a canvas workspace.',
    'Answer only from the provided tool results and memory.',
    'Do not invent canvas facts beyond the provided tool outputs.',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
  ];

  if (!allowActions) {
    lines.push('Do not include planning actions. Always return "actions": [].');
    return lines.join('\n');
  }

  const intentScopedKinds = describeAiAssistantStructuredReplyKinds(intent);
  lines.push(
    'This is a confirm-first planning copilot. Never claim that changes were already applied.',
    intentScopedKinds
      ? `For this request, only use these structured reply fields or action kinds: ${intentScopedKinds}.`
      : 'Use these action kinds only when the tool results provide enough evidence:',
    ...(intentScopedKinds ? [] : AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES),
    'If data is insufficient, ask a follow-up question and return "actions": [].'
  );
  return lines.join('\n');
}

function buildAnswerMemorySection(memory: AiAssistantMemoryState): string {
  const parts = [
    memory.currentIntent ? `Current intent: ${memory.currentIntent}` : null,
    memory.conversationSummary
      ? `Conversation summary: ${memory.conversationSummary}`
      : null,
    memory.agreedFacts.length > 0
      ? `Agreed facts:\n- ${memory.agreedFacts.join('\n- ')}`
      : null,
    memory.lastRecommendations.length > 0
      ? `Last recommendations:\n- ${memory.lastRecommendations.join('\n- ')}`
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : 'Conversation memory: none';
}

function buildInstructionPacketSystemMessage(
  instructions: AiAssistantInstructionPacket[]
): string | null {
  if (instructions.length === 0) {
    return null;
  }

  return [
    'Loaded instruction packets:',
    ...instructions.map((instruction) => {
      const allowedTools =
        instruction.allowedToolNames && instruction.allowedToolNames.length > 0
          ? `Allowed tools: ${instruction.allowedToolNames.join(', ')}`
          : null;
      const responsePolicy = instruction.responsePolicy
        ? `Response policy: ${instruction.responsePolicy}`
        : null;
      return [
        `## ${instruction.id}`,
        `Title: ${instruction.title}`,
        allowedTools,
        responsePolicy,
        instruction.body,
      ]
        .filter(Boolean)
        .join('\n');
    }),
  ].join('\n\n');
}
