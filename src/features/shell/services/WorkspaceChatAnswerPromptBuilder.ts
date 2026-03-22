import {
  WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES,
  WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE,
} from './WorkspaceChatStructuredTransport.ts';
import type { WorkspaceChatApiMessage } from './WorkspaceChatApiTypes.ts';
import type {
  WorkspaceChatMemoryState,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatInstructionPacket } from './WorkspaceChatInstructionTypes.ts';
import type { WorkspaceChatToolResult } from './WorkspaceChatToolTypes.ts';

export function buildWorkspaceChatAnswerMessages(params: {
  prompt: string;
  profile: WorkspaceChatProfile;
  memory: WorkspaceChatMemoryState;
  instructionPackets: WorkspaceChatInstructionPacket[];
  toolResults: WorkspaceChatToolResult[];
  allowActions: boolean;
}): WorkspaceChatApiMessage[] {
  const messages: WorkspaceChatApiMessage[] = [
    {
      role: 'system',
      content: buildAnswerSystemPrompt(params.allowActions),
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

function buildAnswerSystemPrompt(allowActions: boolean): string {
  const lines = [
    'You are a concise product planning assistant embedded inside a canvas workspace.',
    'Answer only from the provided tool results and memory.',
    'Do not invent canvas facts beyond the provided tool outputs.',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE}`,
  ];

  if (!allowActions) {
    lines.push('Do not include planning actions. Always return "actions": [].');
    return lines.join('\n');
  }

  lines.push(
    'This is a confirm-first planning copilot. Never claim that changes were already applied.',
    'Use these action kinds only when the tool results provide enough evidence:',
    ...WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES,
    'If data is insufficient, ask a follow-up question and return "actions": [].'
  );
  return lines.join('\n');
}

function buildAnswerMemorySection(memory: WorkspaceChatMemoryState): string {
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
  instructions: WorkspaceChatInstructionPacket[]
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
