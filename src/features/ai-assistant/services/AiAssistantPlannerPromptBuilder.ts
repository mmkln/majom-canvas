import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type {
  AiAssistantMemoryState,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import { describeAiAssistantProfiles } from './AiAssistantContextTypes.ts';
import type {
  AiAssistantInstructionIndexEntry,
  AiAssistantInstructionPacket,
} from './AiAssistantInstructionTypes.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';

type AiAssistantPlannerToolSummary = {
  name: string;
  kind: string;
  description: string;
  inputSchema: string;
};

export function buildAiAssistantRouterMessages(params: {
  prompt: string;
  contextMode: AiAssistantContextMode;
  memory: AiAssistantMemoryState;
  instructions: AiAssistantInstructionIndexEntry[];
  tools: AiAssistantPlannerToolSummary[];
}): AiAssistantApiMessage[] {
  const allowedProfiles = describeAiAssistantProfiles();
  return [
    {
      role: 'system',
      content: [
        'You are a routing model for a canvas workspace assistant.',
        'Return valid JSON only.',
        'Treat instructions, tools, and canvas data as separate resources.',
        'Do not answer the user directly.',
        'First decide whether to load detailed instruction packets, execute tools, ask a follow-up question, or finalize.',
        'Capability questions about what this AI assistant can do are valid requests and should be routed through instructions or tools, not rejected as off-topic.',
        'Request detailed instruction packets before tool execution when domain-specific guidance or response rules are needed.',
        'Never request more than 6 total tool calls.',
        'Use only listed tools.',
        `Use one of these exact profile values: ${allowedProfiles}.`,
        'Use one of these exact JSON shapes:',
        '{"kind":"load_instructions","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","instructionIds":["<instruction id>"]}',
        '{"kind":"execute_tools","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","calls":[{"tool":"<tool name>","input":{}}]}',
        '{"kind":"ask_followup","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","question":"<question>"}',
        '{"kind":"finalize","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>"}',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Prompt: ${params.prompt.trim()}`,
        `Current context mode: ${params.contextMode}`,
        buildPlannerMemorySection(params.memory),
        buildInstructionIndexSection(params.instructions),
        `Available tools:\n${params.tools
          .map(
            (tool) =>
              `- ${tool.name} [${tool.kind}]: ${tool.description}. Input: ${tool.inputSchema}`
          )
          .join('\n')}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];
}

export function buildAiAssistantDecisionMessages(params: {
  prompt: string;
  profile: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
  memory: AiAssistantMemoryState;
  loadedInstructions: AiAssistantInstructionPacket[];
  availableInstructions: AiAssistantInstructionIndexEntry[];
  tools: AiAssistantPlannerToolSummary[];
  toolResults: AiAssistantToolResult[];
}): AiAssistantApiMessage[] {
  const allowedProfiles = describeAiAssistantProfiles();
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: [
        'You are a bounded orchestration model for a canvas workspace assistant.',
        'Return valid JSON only.',
        'Do not answer the user directly.',
        'Use loaded instruction packets as the detailed operating policy for the current case.',
        'Capability questions about what this AI assistant can do should use capability context tools instead of being treated as invalid small talk.',
        'If you still need more policy, request more instruction packets by id.',
        'If you need more workspace evidence, request tool calls using only the listed tools.',
        'If the user request is blocked by ambiguity, ask a follow-up question.',
        'If you already have enough instructions and evidence, finalize.',
        `Use one of these exact profile values: ${allowedProfiles}.`,
        'Use one of these exact JSON shapes:',
        '{"kind":"load_instructions","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","instructionIds":["<instruction id>"]}',
        '{"kind":"execute_tools","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","calls":[{"tool":"<tool name>","input":{}}]}',
        '{"kind":"ask_followup","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>","question":"<question>"}',
        '{"kind":"finalize","profile":"<exact profile value>","contextMode":"<none|canvas|viewport|selection>"}',
      ].join('\n'),
    },
  ];

  const instructionMessage = buildInstructionPacketSystemMessage(
    params.loadedInstructions
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
      `Prompt: ${params.prompt.trim()}`,
      `Current profile: ${params.profile}`,
      `Current context mode: ${params.contextMode}`,
      buildPlannerMemorySection(params.memory),
      buildInstructionIndexSection(params.availableInstructions),
      `Available tools:\n${params.tools
        .map(
          (tool) =>
            `- ${tool.name} [${tool.kind}]: ${tool.description}. Input: ${tool.inputSchema}`
        )
        .join('\n')}`,
      `Current tool results:\n${JSON.stringify(params.toolResults, null, 2)}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  return messages;
}

export function buildAiAssistantPlannerMessages(params: {
  prompt: string;
  contextMode: AiAssistantContextMode;
  memory: AiAssistantMemoryState;
  instructions?: AiAssistantInstructionIndexEntry[];
  tools: AiAssistantPlannerToolSummary[];
}): AiAssistantApiMessage[] {
  return buildAiAssistantRouterMessages({
    prompt: params.prompt,
    contextMode: params.contextMode,
    memory: params.memory,
    instructions: params.instructions ?? [],
    tools: params.tools,
  });
}

function buildPlannerMemorySection(memory: AiAssistantMemoryState): string {
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

  if (parts.length === 0) {
    return 'Conversation memory: none';
  }
  return `Conversation memory:\n${parts.join('\n')}`;
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

function buildInstructionIndexSection(
  instructions: AiAssistantInstructionIndexEntry[]
): string {
  if (instructions.length === 0) {
    return 'Available instruction packets: none';
  }

  return `Instruction index:\n${instructions
    .map((instruction) => {
      const category = instruction.category ? `${instruction.category}/` : '';
      const relatedTools =
        instruction.relatedToolNames.length > 0
          ? ` Related tools: ${instruction.relatedToolNames.join(', ')}.`
          : '';
      return `- ${instruction.id} (${category}${instruction.title}): ${instruction.summary}. Use when: ${instruction.whenToUse}.${relatedTools}`;
    })
    .join('\n')}`;
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
      const header = instruction.category
        ? `## ${instruction.category}/${instruction.id}`
        : `## ${instruction.id}`;
      const allowedTools =
        instruction.allowedToolNames && instruction.allowedToolNames.length > 0
          ? `Allowed tools: ${instruction.allowedToolNames.join(', ')}`
          : 'Allowed tools: any listed tool if needed';
      const responsePolicy = instruction.responsePolicy
        ? `Response policy: ${instruction.responsePolicy}`
        : null;
      return [
        header,
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
