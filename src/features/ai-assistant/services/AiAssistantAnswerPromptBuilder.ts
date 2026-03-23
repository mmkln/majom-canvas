import {
  AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES,
  AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE,
} from './AiAssistantStructuredTransport.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type {
  AiAssistantMemoryState,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import type { AiAssistantInstructionPacket } from './AiAssistantInstructionTypes.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import { describeAiAssistantStructuredReplyKindsForScenario } from './AiAssistantActionPolicy.ts';
import {
  compileAiAssistantEvidencePacket,
  renderAiAssistantEvidencePacket,
} from './AiAssistantEvidenceCompiler.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';

export function buildAiAssistantAnswerMessages(params: {
  prompt: string;
  scenario?: AiAssistantScenarioDescriptor | null;
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
        params.scenario
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
      `Evidence packet:\n${renderAiAssistantEvidencePacket(
        compileAiAssistantEvidencePacket({
          snapshot: null,
          toolResults: params.toolResults,
          intent: params.scenario?.intent ?? undefined,
          scenario: params.scenario,
        })
      )}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  return messages;
}

function buildAnswerSystemPromptForIntent(
  allowActions: boolean,
  scenario: AiAssistantScenarioDescriptor | null | undefined
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

  const intentScopedKinds =
    describeAiAssistantStructuredReplyKindsForScenario(scenario);
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
  const confirmedFacts = renderMemoryFactEntries(memory.confirmedFacts);
  const userConstraints = renderMemoryConstraintEntries(memory.userConstraints);
  const appliedActions = renderAppliedActionEntries(memory.appliedActions);
  const parts = [
    memory.currentIntent ? `Current intent: ${memory.currentIntent}` : null,
    memory.conversationSummary
      ? `Conversation summary: ${memory.conversationSummary}`
      : null,
    confirmedFacts.length > 0
      ? `Confirmed facts:\n- ${confirmedFacts.join('\n- ')}`
      : null,
    memory.agreedFacts.length > 0
      ? `Agreed facts:\n- ${memory.agreedFacts.join('\n- ')}`
      : null,
    userConstraints.length > 0
      ? `User constraints:\n- ${userConstraints.join('\n- ')}`
      : null,
    memory.awaitingInput
      ? `Awaiting input:\n- ${memory.awaitingInput.prompt}${
          memory.awaitingInput.replyPreview
            ? `\n- Follow-up: ${memory.awaitingInput.replyPreview}`
            : ''
        }`
      : null,
    memory.openFollowUpSlots.length > 0
      ? `Open follow-up slots:\n- ${memory.openFollowUpSlots.join('\n- ')}`
      : null,
    appliedActions.length > 0
      ? `Applied actions:\n- ${appliedActions.join('\n- ')}`
      : null,
    memory.lastRecommendations.length > 0
      ? `Last recommendations:\n- ${memory.lastRecommendations.join('\n- ')}`
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : 'Conversation memory: none';
}

function renderMemoryFactEntries(
  entries: AiAssistantMemoryState['confirmedFacts']
): string[] {
  return entries.map((entry) => entry.text).filter((text) => text.length > 0);
}

function renderMemoryConstraintEntries(
  entries: AiAssistantMemoryState['userConstraints']
): string[] {
  return entries.map((entry) => entry.text).filter((text) => text.length > 0);
}

function renderAppliedActionEntries(
  entries: AiAssistantMemoryState['appliedActions']
): string[] {
  return entries
    .slice(-5)
    .map((entry) => entry.summary)
    .filter((text) => text.length > 0);
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
