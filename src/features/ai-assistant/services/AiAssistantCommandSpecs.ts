import { isUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
  AiAssistantConnectionEdge,
  AiAssistantElementKind,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import {
  isAiAssistantCreateElementStatus,
  isAiAssistantRelationSuggestionType,
  type AiAssistantActionKind,
  type AiAssistantRelationSuggestionType,
} from '../aiAssistantActions.ts';
import type { AiAssistantActionPlan } from './AiAssistantActionPlanTypes.ts';
import type { AiAssistantApiMessage } from './AiAssistantApiTypes.ts';
import type {
  AiAssistantFocusItem,
  AiAssistantMemoryState,
} from './AiAssistantContextTypes.ts';
import {
  buildAiAssistantScenarioDescriptor,
  type AiAssistantScenarioDescriptor,
} from './AiAssistantContextPlanner.ts';
import {
  buildAiAssistantActionPlanFromScenario,
} from './AiAssistantActionPlan.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import type { AiAssistantInstructionPacket } from './AiAssistantInstructionTypes.ts';
import {
  AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE,
  type AiAssistantStructuredReplyEnvelope,
} from './AiAssistantStructuredTransport.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import { isPlainObject } from './AiAssistantToolTypes.ts';

type AiAssistantCommandBuildContextParams = {
  prompt: string;
  memory: AiAssistantMemoryState;
  toolResults: AiAssistantToolResult[];
  snapshot: AiAssistantCanvasSnapshot | null;
  intentContext?: AiAssistantIntentContext;
};

type AiAssistantCommandBuildMessagesParams = {
  prompt: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
};

type AiAssistantCommandValidateEnvelopeParams = {
  envelope: AiAssistantStructuredReplyEnvelope;
  compiledContext: Record<string, unknown>;
};

type AiAssistantCommandBuildRepairMessagesParams = {
  invalidResponse: string;
  validationError: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
};

export type AiAssistantCommandSpec = {
  intent: AiAssistantIntentKind;
  buildCompiledContext: (
    params: AiAssistantCommandBuildContextParams
  ) => Record<string, unknown>;
  buildMessages: (
    params: AiAssistantCommandBuildMessagesParams
  ) => AiAssistantApiMessage[];
  validateEnvelope: (
    params: AiAssistantCommandValidateEnvelopeParams
  ) => string | null;
  buildRepairMessages: (
    params: AiAssistantCommandBuildRepairMessagesParams
  ) => AiAssistantApiMessage[];
};

type AiAssistantCommandElementSummary = {
  id: string;
  kind: AiAssistantElementKind;
  title: string;
  description: string;
  status?: string;
  priority?: string;
};

type AiAssistantCommandRelatedSummary = {
  relationType: string;
  item: AiAssistantCommandElementSummary;
};

type AiAssistantDependencyFinding = {
  code: string;
  severity: string;
  message: string;
  targetIds: string[];
};

type AiAssistantDependencyRelationSummary = {
  fromId: string;
  toId: string;
  relationType: AiAssistantRelationSuggestionType;
  fromTitle?: string;
  toTitle?: string;
};

type AiAssistantDependenciesCommandContext = {
  intent: 'dependencies';
  commandVersion: 2;
  latestUserInput: string;
  scope: 'single' | 'cluster';
  preferredActionShape: 'suggest_relation' | 'suggest_relations';
  allowedElementIds: string[];
  selectedElementIds: string[];
  items: AiAssistantCommandElementSummary[];
  existingRelations: AiAssistantDependencyRelationSummary[];
  dependencyFindings: AiAssistantDependencyFinding[];
  scenario: AiAssistantScenarioDescriptor;
  actionPlan: AiAssistantActionPlan;
  constraints: {
    allowedRelationTypes: ['blocks', 'leads_to', 'relates_to'];
    forbidReviewFindings: true;
    requireConciseFollowupQuestionWhenNoActions: true;
  };
};

type AiAssistantFillDetailsTarget = AiAssistantCommandElementSummary & {
  missingFields: Array<'title' | 'description'>;
  context?: {
    parent: AiAssistantCommandElementSummary | null;
    children: AiAssistantCommandElementSummary[];
    siblings: AiAssistantCommandElementSummary[];
    related: AiAssistantCommandRelatedSummary[];
  };
};

type AiAssistantFillDetailsCommandContext = {
  intent: 'fill_details';
  commandVersion: 2;
  latestUserInput: string;
  scope: 'single' | 'cluster';
  preferredActionShape: 'suggest_update' | 'suggest_updates';
  allowedElementIds: string[];
  target?: AiAssistantFillDetailsTarget;
  targets?: AiAssistantFillDetailsTarget[];
  scenario: AiAssistantScenarioDescriptor;
  actionPlan: AiAssistantActionPlan;
  constraints: {
    allowedPatchFields: ['title', 'description'];
    allowTitleParaphraseForDescription: false;
    requireContextBackedDetailForDescription: true;
    allowUserProvidedDetailForDescription: true;
    forbidReviewFindings: true;
    forbidInventedFacts: string[];
  };
};

type AiAssistantStrategicPlanCommandContext = {
  intent: 'strategic_plan';
  commandVersion: 2;
  latestUserInput: string;
  canvasTitle: string;
  targetScope: 'canvas' | 'selected_goal';
  mode: 'canvas_bootstrap' | 'goal_subgoals' | 'goal_replan';
  summary: AiAssistantCanvasSnapshot['summary'];
  selectedGoal?: AiAssistantCommandElementSummary;
  strategicHints: string[];
  scenario: AiAssistantScenarioDescriptor;
  actionPlan: AiAssistantActionPlan;
  constraints: {
    allowedActionKinds: AiAssistantActionKind[];
    forbidReviewFindings: true;
    requireSingleStrategicProposal: true;
    strategicLevelOnly: true;
    confirmationMode: AiAssistantActionPlan['confirmationMode'];
  };
};

type AiAssistantBreakdownCommandContext = {
  intent: 'breakdown';
  commandVersion: 1;
  latestUserInput: string;
  mode:
    | 'goal_stories'
    | 'story_tasks'
    | 'task_refine'
    | 'unspecified_goal_decomposition';
  target?: AiAssistantCommandElementSummary;
  scenario: AiAssistantScenarioDescriptor;
  actionPlan: AiAssistantActionPlan;
  constraints: {
    forbidReviewFindings: true;
    requireConciseFollowupQuestionWhenAmbiguous: true;
  };
};

const DEPENDENCIES_COMMAND_SPEC: AiAssistantCommandSpec = {
  intent: 'dependencies',
  buildCompiledContext: (params) => buildDependenciesCommandContext(params),
  buildMessages: ({ instructionPackets, compiledContext }) =>
    buildDependenciesCommandMessages({
      instructionPackets,
      compiledContext,
    }),
  validateEnvelope: ({ envelope, compiledContext }) =>
    validateDependenciesCommandEnvelope(envelope, compiledContext),
  buildRepairMessages: ({
    invalidResponse,
    validationError,
    instructionPackets,
    compiledContext,
  }) =>
    buildDependenciesCommandRepairMessages({
      invalidResponse,
      validationError,
      instructionPackets,
      compiledContext,
    }),
};

const FILL_DETAILS_COMMAND_SPEC: AiAssistantCommandSpec = {
  intent: 'fill_details',
  buildCompiledContext: (params) => buildFillDetailsCommandContext(params),
  buildMessages: ({ instructionPackets, compiledContext }) =>
    buildFillDetailsCommandMessages({
      instructionPackets,
      compiledContext,
    }),
  validateEnvelope: ({ envelope, compiledContext }) =>
    validateFillDetailsCommandEnvelope(envelope, compiledContext),
  buildRepairMessages: ({
    invalidResponse,
    validationError,
    instructionPackets,
    compiledContext,
  }) =>
    buildFillDetailsCommandRepairMessages({
      invalidResponse,
      validationError,
      instructionPackets,
      compiledContext,
    }),
};

const STRATEGIC_PLAN_COMMAND_SPEC: AiAssistantCommandSpec = {
  intent: 'strategic_plan',
  buildCompiledContext: (params) => buildStrategicPlanCommandContext(params),
  buildMessages: ({ instructionPackets, compiledContext }) =>
    buildStrategicPlanCommandMessages({
      instructionPackets,
      compiledContext,
    }),
  validateEnvelope: ({ envelope, compiledContext }) =>
    validateStrategicPlanCommandEnvelope(envelope, compiledContext),
  buildRepairMessages: ({
    invalidResponse,
    validationError,
    instructionPackets,
    compiledContext,
  }) =>
    buildStrategicPlanCommandRepairMessages({
      invalidResponse,
      validationError,
      instructionPackets,
      compiledContext,
    }),
};

const BREAKDOWN_COMMAND_SPEC: AiAssistantCommandSpec = {
  intent: 'breakdown',
  buildCompiledContext: (params) => buildBreakdownCommandContext(params),
  buildMessages: ({ instructionPackets, compiledContext }) =>
    buildBreakdownCommandMessages({
      instructionPackets,
      compiledContext,
    }),
  validateEnvelope: ({ envelope, compiledContext }) =>
    validateBreakdownCommandEnvelope(envelope, compiledContext),
  buildRepairMessages: ({
    invalidResponse,
    validationError,
    instructionPackets,
    compiledContext,
  }) =>
    buildBreakdownCommandRepairMessages({
      invalidResponse,
      validationError,
      instructionPackets,
      compiledContext,
    }),
};

export function getAiAssistantCommandSpec(
  intent: AiAssistantIntentKind | undefined
): AiAssistantCommandSpec | null {
  switch (intent) {
    case 'dependencies':
      return DEPENDENCIES_COMMAND_SPEC;
    case 'strategic_plan':
      return STRATEGIC_PLAN_COMMAND_SPEC;
    case 'fill_details':
      return FILL_DETAILS_COMMAND_SPEC;
    case 'breakdown':
      return BREAKDOWN_COMMAND_SPEC;
    default:
      return null;
  }
}

export function getAiAssistantCommandSpecForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): AiAssistantCommandSpec | null {
  if (!scenario?.kind) {
    return null;
  }
  return getAiAssistantCommandSpec(scenario.kind);
}

function buildDependenciesCommandContext(
  params: AiAssistantCommandBuildContextParams
): AiAssistantDependenciesCommandContext {
  const focus = readFocusBundle(params.toolResults) ?? deriveFocusFromSnapshot(params.snapshot);
  const cluster = readSelectionCluster(params.toolResults) ?? params.snapshot ?? null;
  const selectedElementIds = params.snapshot?.selectionIds.slice() ?? [];
  const allowedElementIds = resolveDependenciesAllowedElementIds(
    selectedElementIds,
    cluster,
    focus
  );
  const allowedIdSet = new Set(allowedElementIds);
  const sourceElements = cluster?.elements ?? params.snapshot?.elements ?? [];
  const items = sourceElements
    .filter((element) => allowedIdSet.has(element.id))
    .map((element) => toCommandElementSummary(element));
  const scenario = buildAiAssistantScenarioDescriptor({
    intent: 'dependencies',
    prompt: params.prompt,
    memory: params.memory,
    snapshot: params.snapshot,
    toolResults: params.toolResults,
    intentContext: params.intentContext,
  });
  const actionPlan = buildAiAssistantActionPlanFromScenario(scenario)!;

  return {
    intent: 'dependencies',
    commandVersion: 2,
    latestUserInput: params.prompt.trim(),
    scope: selectedElementIds.length > 1 ? 'cluster' : 'single',
    preferredActionShape:
      selectedElementIds.length > 1 ? 'suggest_relations' : 'suggest_relation',
    allowedElementIds,
    selectedElementIds,
    items,
    existingRelations: readDependenciesExistingRelations(
      params.toolResults,
      params.snapshot,
      allowedIdSet
    ),
    dependencyFindings: readDependencyFindings(params.toolResults),
    scenario,
    actionPlan,
    constraints: {
      allowedRelationTypes: ['blocks', 'leads_to', 'relates_to'],
      forbidReviewFindings: true,
      requireConciseFollowupQuestionWhenNoActions: true,
    },
  };
}

function buildFillDetailsCommandContext(
  params: AiAssistantCommandBuildContextParams
): AiAssistantFillDetailsCommandContext {
  const focus = readFocusBundle(params.toolResults) ?? deriveFocusFromSnapshot(params.snapshot);
  const cluster =
    readSelectionCluster(params.toolResults) ?? params.snapshot ?? null;
  const missingDescriptionIds = readMissingDescriptionIds(params.toolResults);
  const candidateElements = resolveFillDetailsCandidateElements(
    focus,
    cluster,
    missingDescriptionIds
  );
  const targets = candidateElements.map((element) =>
    buildFillDetailsTarget(element, focus, missingDescriptionIds)
  );
  const scenario = buildAiAssistantScenarioDescriptor({
    intent: 'fill_details',
    prompt: params.prompt,
    memory: params.memory,
    snapshot: params.snapshot,
    toolResults: params.toolResults,
    intentContext: params.intentContext,
  });
  const actionPlan = buildAiAssistantActionPlanFromScenario(scenario)!;

  if (targets.length <= 1) {
    return {
      intent: 'fill_details',
      commandVersion: 2,
      latestUserInput: params.prompt.trim(),
      scope: 'single',
      preferredActionShape: 'suggest_update',
      allowedElementIds: targets.map((target) => target.id),
      target: targets[0],
      scenario,
      actionPlan,
      constraints: {
        allowedPatchFields: ['title', 'description'],
        allowTitleParaphraseForDescription: false,
        requireContextBackedDetailForDescription: true,
        allowUserProvidedDetailForDescription: true,
        forbidReviewFindings: true,
        forbidInventedFacts: [
          'timelines',
          'metrics',
          'locations',
          'acceptance criteria',
        ],
      },
    };
  }

  return {
    intent: 'fill_details',
    commandVersion: 2,
    latestUserInput: params.prompt.trim(),
    scope: 'cluster',
    preferredActionShape: 'suggest_updates',
    allowedElementIds: targets.map((target) => target.id),
    targets,
    scenario,
    actionPlan,
    constraints: {
      allowedPatchFields: ['title', 'description'],
      allowTitleParaphraseForDescription: false,
      requireContextBackedDetailForDescription: true,
      allowUserProvidedDetailForDescription: true,
      forbidReviewFindings: true,
      forbidInventedFacts: [
        'timelines',
        'metrics',
        'locations',
        'acceptance criteria',
      ],
    },
  };
}

function buildStrategicPlanCommandContext(
  params: AiAssistantCommandBuildContextParams
): AiAssistantStrategicPlanCommandContext {
  const summary = params.snapshot?.summary ?? {
    goalCount: 0,
    storyCount: 0,
    taskCount: 0,
    selectedCount: 0,
  };
  const focus =
    readFocusBundle(params.toolResults) ?? deriveFocusFromSnapshot(params.snapshot);
  const selectedGoal =
    focus?.item.kind === 'goal' ? toCommandElementSummary(focus.item) : undefined;
  const latestUserInput = params.prompt.trim();
  const scenario = buildAiAssistantScenarioDescriptor({
    intent: 'strategic_plan',
    prompt: params.prompt,
    memory: params.memory,
    snapshot: params.snapshot,
    toolResults: params.toolResults,
    intentContext: params.intentContext,
  });
  const actionPlan = buildAiAssistantActionPlanFromScenario(scenario)!;
  return {
    intent: 'strategic_plan',
    commandVersion: 2,
    latestUserInput,
    canvasTitle: params.snapshot?.canvasTitle ?? 'Untitled canvas',
    targetScope: scenario.targetScope === 'canvas' ? 'canvas' : 'selected_goal',
    mode: scenario.mode,
    summary,
    selectedGoal: scenario.target?.kind === 'goal' ? scenario.target : selectedGoal,
    strategicHints: scenario.strategicHints,
    scenario,
    actionPlan,
    constraints: {
      allowedActionKinds: actionPlan.allowedRuntimeActionKinds,
      forbidReviewFindings: true,
      requireSingleStrategicProposal: true,
      strategicLevelOnly: true,
      confirmationMode: actionPlan.confirmationMode,
    },
  };
}

function buildBreakdownCommandContext(
  params: AiAssistantCommandBuildContextParams
): AiAssistantBreakdownCommandContext {
  const focus =
    readFocusBundle(params.toolResults) ?? deriveFocusFromSnapshot(params.snapshot);
  const target = focus?.item ? toCommandElementSummary(focus.item) : undefined;
  const scenario = buildAiAssistantScenarioDescriptor({
    intent: 'breakdown',
    prompt: params.prompt,
    memory: params.memory,
    snapshot: params.snapshot,
    toolResults: params.toolResults,
    intentContext: params.intentContext,
  });
  const actionPlan = buildAiAssistantActionPlanFromScenario(scenario)!;
  return {
    intent: 'breakdown',
    commandVersion: 1,
    latestUserInput: params.prompt.trim(),
    mode: scenario.mode,
    target: scenario.target ?? target,
    scenario,
    actionPlan,
    constraints: {
      forbidReviewFindings: true,
      requireConciseFollowupQuestionWhenAmbiguous: true,
    },
  };
}

function buildDependenciesCommandMessages(params: {
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: buildDependenciesCommandSystemPrompt(),
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
      'Action command: dependencies',
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
    ].join('\n\n'),
  });

  return messages;
}

function buildFillDetailsCommandMessages(params: {
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: buildFillDetailsCommandSystemPrompt(),
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
      'Action command: fill_details',
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
    ].join('\n\n'),
  });

  return messages;
}

function buildDependenciesCommandRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: [
        buildDependenciesCommandSystemPrompt(),
        'Repair the previous answer into one valid command reply JSON object.',
        'Preserve the original meaning whenever possible.',
      ].join('\n'),
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
      `Validation error: ${params.validationError}`,
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
      `Invalid response:\n${params.invalidResponse}`,
    ].join('\n\n'),
  });

  return messages;
}

function buildFillDetailsCommandRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: [
        buildFillDetailsCommandSystemPrompt(),
        'Repair the previous answer into one valid command reply JSON object.',
        'Preserve the original meaning whenever possible.',
      ].join('\n'),
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
      `Validation error: ${params.validationError}`,
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
      `Invalid response:\n${params.invalidResponse}`,
    ].join('\n\n'),
  });

  return messages;
}

function buildDependenciesCommandSystemPrompt(): string {
  return [
    'You are executing the workspace action command "dependencies".',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
    'Prepared command context.actionPlan is authoritative for confirmation semantics and allowed reply kinds.',
    'Do not include reviewFindings for this command.',
    'Use only these action kinds: suggest_relation, suggest_relations, remove_relation, remove_relations, update_relation, or update_relations.',
    'For suggest_relation use this exact shape:',
    '{"kind":"suggest_relation","fromId":"<element id>","toId":"<element id>","relationType":"<blocks|leads_to|relates_to>","reason":"<why this link helps planning>"}',
    'For suggest_relations use this exact shape:',
    '{"kind":"suggest_relations","relations":[{"fromId":"<element id>","toId":"<element id>","relationType":"<blocks|leads_to|relates_to>","reason":"<why this link helps planning>"}]}',
    'For remove_relation use this exact shape:',
    '{"kind":"remove_relation","fromId":"<element id>","toId":"<element id>","relationType":"<blocks|leads_to|relates_to>","reason":"<why this existing link should be removed>"}',
    'For remove_relations use this exact shape:',
    '{"kind":"remove_relations","relations":[{"fromId":"<element id>","toId":"<element id>","relationType":"<blocks|leads_to|relates_to>","reason":"<why this existing link should be removed>"}]}',
    'For update_relation use this exact shape:',
    '{"kind":"update_relation","fromId":"<element id>","toId":"<element id>","currentRelationType":"<blocks|leads_to|relates_to>","nextRelationType":"<blocks|leads_to|relates_to>","reason":"<why this existing link should change type>"}',
    'For update_relations use this exact shape:',
    '{"kind":"update_relations","relations":[{"fromId":"<element id>","toId":"<element id>","currentRelationType":"<blocks|leads_to|relates_to>","nextRelationType":"<blocks|leads_to|relates_to>","reason":"<why this existing link should change type>"}]}',
    'Use only element ids that appear in allowedElementIds.',
    'A remove_relation action is valid only for a relation that already exists in existingRelations.',
    'An update_relation action is valid only when the current relation exists in existingRelations, the next relation type is different, and that next relation does not already exist between the same items.',
    'replyMarkdown must be user-facing, short, and concrete.',
    'When the selected scope has multiple items, prefer 1 to 3 strongest supported relations inside the selected items.',
    'Do not return analysis sections, candidate lists, or ask the user to choose among relation options you can already suggest.',
    'If you mention a concrete relation in replyMarkdown, that relation must also appear in actions.',
    'If no relation can be justified yet, ask one concise follow-up question and return "actions": [].',
    'When you do return relation actions, explain which link or links you suggested adding, removing, or retyping and why they improve sequencing or dependency clarity.',
  ].join('\n');
}

function buildFillDetailsCommandSystemPrompt(): string {
  return [
    'You are executing the workspace action command "fill_details".',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
    'Prepared command context.actionPlan is authoritative for confirmation semantics and allowed reply kinds.',
    'Do not include reviewFindings for this command.',
    'Use only these action kinds: suggest_update or suggest_updates.',
    'For suggest_update use this exact shape:',
    '{"kind":"suggest_update","elementId":"<element id>","patch":{"title":"...","description":"..."},"reason":"<why this is safe>"}',
    'For suggest_updates use this exact shape:',
    '{"kind":"suggest_updates","updates":[{"elementId":"<element id>","patch":{"title":"...","description":"..."},"reason":"<why this is safe>"}]}',
    'The patch object may only contain title and/or description.',
    'Never use fields like itemId, top-level title, or top-level description to describe the mutation.',
    'replyMarkdown must be user-facing, short, and concrete.',
    'If latestUserInput provides explicit user constraints or desired details, use them as the primary source for the proposed update.',
    'If latestUserInput already contains concrete desired details, do not ask another follow-up question about supporting context; propose the confirm-first update directly.',
    'Do not use internal policy phrasing like "safe paraphrase", "minimal safe update", or "restates the title".',
    'Do not propose a description that only paraphrases the current title.',
    'A description update is valid only when it adds at least one concrete detail supported either by explicit latestUserInput from the user or by parent, child, sibling, or related canvas context.',
    'Ask a follow-up question only when both nearby canvas context and latestUserInput are too thin to support a concrete update.',
    'When you do return an update, explain what concrete detail you added and whether it came from user-provided details or nearby canvas context.',
  ].join('\n');
}

function buildStrategicPlanCommandMessages(params: {
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: buildStrategicPlanCommandSystemPrompt(),
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
      'Action command: strategic_plan',
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
    ].join('\n\n'),
  });

  return messages;
}

function buildStrategicPlanCommandRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages = buildStrategicPlanCommandMessages({
    instructionPackets: params.instructionPackets,
    compiledContext: params.compiledContext,
  });

  messages.push({
    role: 'user',
    content: [
      `Validation error: ${params.validationError}`,
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
      `Invalid response:\n${params.invalidResponse}`,
    ].join('\n\n'),
  });

  return messages;
}

function buildStrategicPlanCommandSystemPrompt(): string {
  return [
    'You are executing the workspace action command "strategic_plan".',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
    'Prepared command context.actionPlan is authoritative for confirmation semantics and allowed reply kinds.',
    'Do not include reviewFindings for this command.',
    'Use only these action kinds: create_goals or create_goal_blueprint.',
    'For create_goals use this exact shape:',
    '{"kind":"create_goals","title":"<group title>","summary":"<short summary>","target":{"kind":"<canvas|goal>","id":"<goal id when target.kind is goal>"},"items":[{"title":"<goal title>","description":"<optional description>","priority":"<optional priority>","elementStatus":"<optional status>"}]}',
    'For create_goal_blueprint use this exact shape:',
    '{"kind":"create_goal_blueprint","title":"<plan title>","summary":"<short summary>","target":{"kind":"<canvas|goal>","id":"<goal id when target.kind is goal>"},"pattern":"<goal_tree|goal_tree_with_sequence|goal_graph>","goals":[{"ref":"<local ref>","title":"<goal title>","description":"<optional description>","priority":"<optional priority>","elementStatus":"<optional status>","parentRef":"<optional parent ref>"}],"relations":[{"fromRef":"<local ref>","toRef":"<local ref>","relationType":"leads_to","reason":"<why this sequence helps>"}],"assumptions":["<optional assumption>"]}',
    'Return at most one strategic proposal action.',
    'Prefer create_goal_blueprint whenever hierarchy or leads_to links are part of the proposal.',
    'Prefer create_goals when the best structure is only several strategic goals with no reliable links.',
    'If Prepared command context.mode is goal_subgoals or goal_replan, anchor the proposal to Prepared command context.selectedGoal by using target.kind = "goal" with that exact id.',
    'Optional evidence metadata such as supportedBy, evidenceIds, and sourceContext may be attached to any action when it helps reviewability.',
    'Do not return create_goal, create_story, create_task, create_batch_stories, create_batch_tasks, suggest_relations, or suggest_updates.',
    'Do not collapse the plan into one goal with the rest hidden inside description prose.',
    'Default to strategic goals only. Do not propose stories or tasks unless the user explicitly asked for execution detail.',
    'Do not invent timelines, named tools, certifications, or metrics unless the user explicitly asked for them or supplied them.',
    'replyMarkdown must be user-facing, short, and concrete.',
    'If the request is too ambiguous to draft a useful strategic plan, ask one concise follow-up question and return "actions": [].',
  ].join('\n');
}

function buildBreakdownCommandMessages(params: {
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages: AiAssistantApiMessage[] = [
    {
      role: 'system',
      content: buildBreakdownCommandSystemPrompt(),
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
      'Action command: breakdown',
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
    ].join('\n\n'),
  });

  return messages;
}

function buildBreakdownCommandRepairMessages(params: {
  invalidResponse: string;
  validationError: string;
  instructionPackets: AiAssistantInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): AiAssistantApiMessage[] {
  const messages = buildBreakdownCommandMessages({
    instructionPackets: params.instructionPackets,
    compiledContext: params.compiledContext,
  });

  messages.push({
    role: 'user',
    content: [
      `Validation error: ${params.validationError}`,
      'Prepared command context:',
      JSON.stringify(params.compiledContext, null, 2),
      `Invalid response:\n${params.invalidResponse}`,
    ].join('\n\n'),
  });

  return messages;
}

function buildBreakdownCommandSystemPrompt(): string {
  return [
    'You are executing the workspace action command "breakdown".',
    'Return valid JSON only.',
    `Use this exact envelope shape: ${AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE}`,
    'Prepared command context.actionPlan is authoritative for confirmation semantics and allowed reply kinds.',
    'Do not include reviewFindings for this command.',
    'Use only the action kinds allowed by Prepared command context.mode.',
    'For goal_stories use this exact shape:',
    '{"kind":"create_batch_stories","title":"<group title>","summary":"<short summary>","target":{"kind":"goal","id":"<selected goal id>"},"items":[{"title":"<story title>","description":"<optional description>","priority":"<optional priority>","elementStatus":"<optional status>"}]}',
    'For story_tasks use this exact shape:',
    '{"kind":"create_batch_tasks","title":"<group title>","summary":"<short summary>","target":{"kind":"story","id":"<selected story id>"},"items":[{"title":"<task title>","description":"<optional description>","priority":"<optional priority>","elementStatus":"<optional status>"}]}',
    'For task_refine use this exact shape:',
    '{"kind":"suggest_update","elementId":"<task id>","patch":{"title":"<optional title>","description":"<optional description>"},"reason":"<why this refinement helps>"}',
    'Optional evidence metadata such as supportedBy, evidenceIds, and sourceContext may be attached to any action when it helps reviewability.',
    'Never use wrappers like data.parentId, data.stories, or data.tasks.',
    'replyMarkdown must be user-facing, short, and concrete.',
    'If Prepared command context.mode is unspecified_goal_decomposition, ask one concise follow-up question and return "actions": [].',
  ].join('\n');
}

function validateDependenciesCommandEnvelope(
  envelope: AiAssistantStructuredReplyEnvelope,
  compiledContext: Record<string, unknown>
): string | null {
  if (
    typeof envelope.replyMarkdown !== 'string' ||
    envelope.replyMarkdown.trim().length === 0
  ) {
    return 'replyMarkdown must be a non-empty string.';
  }

  if (envelope.reviewFindings !== undefined) {
    return 'reviewFindings are not allowed for dependencies commands.';
  }

  const allowedElementIds = new Set(
    readAllowedElementIdsFromCommandContext(compiledContext)
  );
  const existingRelationKeys = readDependencyExistingRelationKeys(compiledContext);
  const seenRelationKeys = new Set<string>();
  const actions = Array.isArray(envelope.actions) ? envelope.actions : [];

  for (const action of actions) {
    if (!isPlainObject(action) || typeof action.kind !== 'string') {
      return 'Every action must be a JSON object with a supported kind.';
    }

    if (action.kind === 'suggest_relation') {
      const error = validateDependenciesRelationEntry(
        action,
        allowedElementIds,
        existingRelationKeys,
        seenRelationKeys,
        'add'
      );
      if (error) return error;
      continue;
    }

    if (action.kind === 'suggest_relations') {
      if (!Array.isArray(action.relations) || action.relations.length === 0) {
        return 'suggest_relations must contain a non-empty relations array.';
      }
      for (const relation of action.relations) {
        const error = validateDependenciesRelationEntry(
          relation,
          allowedElementIds,
          existingRelationKeys,
          seenRelationKeys,
          'add'
        );
        if (error) return error;
      }
      continue;
    }

    if (action.kind === 'remove_relation') {
      const error = validateDependenciesRelationEntry(
        action,
        allowedElementIds,
        existingRelationKeys,
        seenRelationKeys,
        'remove'
      );
      if (error) return error;
      continue;
    }

    if (action.kind === 'remove_relations') {
      if (!Array.isArray(action.relations) || action.relations.length === 0) {
        return 'remove_relations must contain a non-empty relations array.';
      }
      for (const relation of action.relations) {
        const error = validateDependenciesRelationEntry(
          relation,
          allowedElementIds,
          existingRelationKeys,
          seenRelationKeys,
          'remove'
        );
        if (error) return error;
      }
      continue;
    }

    if (action.kind === 'update_relation') {
      const error = validateDependenciesRelationUpdateEntry(
        action,
        allowedElementIds,
        existingRelationKeys,
        seenRelationKeys
      );
      if (error) return error;
      continue;
    }

    if (action.kind === 'update_relations') {
      if (!Array.isArray(action.relations) || action.relations.length === 0) {
        return 'update_relations must contain a non-empty relations array.';
      }
      for (const relation of action.relations) {
        const error = validateDependenciesRelationUpdateEntry(
          relation,
          allowedElementIds,
          existingRelationKeys,
          seenRelationKeys
        );
        if (error) return error;
      }
      continue;
    }

    return `Unsupported action kind "${action.kind}" for dependencies command.`;
  }

  if (
    actions.length === 0 &&
    !isConciseFollowupReply(envelope.replyMarkdown)
  ) {
    return 'Dependencies command must return relation suggestions or one concise follow-up question.';
  }

  return null;
}

function validateStrategicPlanCommandEnvelope(
  envelope: AiAssistantStructuredReplyEnvelope,
  compiledContext: Record<string, unknown>
): string | null {
  if (
    typeof envelope.replyMarkdown !== 'string' ||
    envelope.replyMarkdown.trim().length === 0
  ) {
    return 'replyMarkdown must be a non-empty string.';
  }

  if (envelope.reviewFindings !== undefined) {
    return 'reviewFindings are not allowed for strategic_plan commands.';
  }

  const actions = Array.isArray(envelope.actions) ? envelope.actions : [];
  if (actions.length > 1) {
    return 'strategic_plan must return at most one strategic proposal action.';
  }

  const actionPlan = readActionPlanFromCommandContext(compiledContext);
  const mode = readStrategicPlanMode(compiledContext);
  const selectedGoalId = readStrategicPlanSelectedGoalId(compiledContext);
  const allowedActionKinds = new Set(
    actionPlan?.allowedStructuredReplyKinds ?? [
      'create_goals',
      'create_goal_blueprint',
    ]
  );
  for (const action of actions) {
    if (!isPlainObject(action) || typeof action.kind !== 'string') {
      return 'Every action must be a JSON object with a supported kind.';
    }

    if (action.kind === 'create_goals' && allowedActionKinds.has(action.kind)) {
      return validateStrategicCreateGoalsEntry(action, mode, selectedGoalId);
    }

    if (
      action.kind === 'create_goal_blueprint' &&
      allowedActionKinds.has(action.kind)
    ) {
      return validateStrategicGoalBlueprintEntry(action, mode, selectedGoalId);
    }

    return `Unsupported action kind "${action.kind}" for strategic_plan command.`;
  }

  if (
    actions.length === 0 &&
    !isConciseFollowupReply(envelope.replyMarkdown)
  ) {
    return 'strategic_plan must return one strategic proposal or one concise follow-up question.';
  }

  return null;
}

function validateBreakdownCommandEnvelope(
  envelope: AiAssistantStructuredReplyEnvelope,
  compiledContext: Record<string, unknown>
): string | null {
  if (
    typeof envelope.replyMarkdown !== 'string' ||
    envelope.replyMarkdown.trim().length === 0
  ) {
    return 'replyMarkdown must be a non-empty string.';
  }

  if (envelope.reviewFindings !== undefined) {
    return 'reviewFindings are not allowed for breakdown commands.';
  }

  const actions = Array.isArray(envelope.actions) ? envelope.actions : [];
  const mode = readBreakdownMode(compiledContext);
  const target = readBreakdownTarget(compiledContext);
  const actionPlan = readActionPlanFromCommandContext(compiledContext);
  const allowedActionKinds = new Set(
    actionPlan?.allowedStructuredReplyKinds ??
      (mode === 'goal_stories'
        ? ['create_batch_stories']
        : mode === 'story_tasks'
          ? ['create_batch_tasks']
          : mode === 'task_refine'
            ? ['suggest_update', 'suggest_updates']
            : [])
  );

  if (mode === 'unspecified_goal_decomposition') {
    if (actions.length > 0) {
      return 'Ambiguous goal decomposition should ask a follow-up question instead of returning actions.';
    }
    return isConciseFollowupReply(envelope.replyMarkdown)
      ? null
      : 'Ambiguous goal decomposition must return one concise follow-up question.';
  }

  if (actions.length !== 1) {
    return 'Breakdown command must return exactly one action when the target level is known.';
  }

  const action = actions[0];
  if (!isPlainObject(action) || typeof action.kind !== 'string') {
    return 'Every action must be a JSON object with a supported kind.';
  }

  if (mode === 'goal_stories') {
    if (
      action.kind !== 'create_batch_stories' &&
      action.kind !== 'create_story'
    ) {
      return 'goal_stories breakdown must return create_story or create_batch_stories.';
    }
    return action.kind === 'create_story'
      ? validateBreakdownSingleCreateEntry(
          action,
          'goal',
          target?.id ?? null,
          'story'
        )
      : validateBreakdownCreateBatchEntry(
          action,
          'goal',
          target?.id ?? null,
          'stories'
        );
  }

  if (mode === 'story_tasks') {
    if (
      action.kind !== 'create_batch_tasks' &&
      action.kind !== 'create_task'
    ) {
      return 'story_tasks breakdown must return create_task or create_batch_tasks.';
    }
    return action.kind === 'create_task'
      ? validateBreakdownSingleCreateEntry(
          action,
          'story',
          target?.id ?? null,
          'task'
        )
      : validateBreakdownCreateBatchEntry(
          action,
          'story',
          target?.id ?? null,
          'tasks'
        );
  }

  if (mode === 'task_refine') {
    if (
      !allowedActionKinds.has('suggest_update') &&
      !allowedActionKinds.has('suggest_updates')
    ) {
      return 'task_refine breakdown must allow suggest_update or suggest_updates.';
    }
    if (action.kind !== 'suggest_update' && action.kind !== 'suggest_updates') {
      return 'task_refine breakdown must return suggest_update or suggest_updates.';
    }
    return null;
  }

  return 'Unsupported breakdown mode.';
}

function validateFillDetailsCommandEnvelope(
  envelope: AiAssistantStructuredReplyEnvelope,
  compiledContext: Record<string, unknown>
): string | null {
  if (
    typeof envelope.replyMarkdown !== 'string' ||
    envelope.replyMarkdown.trim().length === 0
  ) {
    return 'replyMarkdown must be a non-empty string.';
  }

  if (envelope.reviewFindings !== undefined) {
    return 'reviewFindings are not allowed for fill_details commands.';
  }

  const allowedElementIds = new Set(
    readAllowedElementIdsFromCommandContext(compiledContext)
  );
  const targetsById = readFillDetailsTargetsById(compiledContext);
  const latestUserInput = readFillDetailsLatestUserInput(compiledContext);
  const actions = Array.isArray(envelope.actions) ? envelope.actions : [];

  for (const action of actions) {
    if (!isPlainObject(action) || typeof action.kind !== 'string') {
      return 'Every action must be a JSON object with a supported kind.';
    }

    if (action.kind === 'suggest_update') {
      const error = validateFillDetailsUpdateEntry(
        action,
        allowedElementIds,
        targetsById,
        latestUserInput
      );
      if (error) return error;
      continue;
    }

    if (action.kind === 'suggest_updates') {
      if (!Array.isArray(action.updates) || action.updates.length === 0) {
        return 'suggest_updates must contain a non-empty updates array.';
      }
      for (const update of action.updates) {
        const error = validateFillDetailsUpdateEntry(
          update,
          allowedElementIds,
          targetsById,
          latestUserInput
        );
        if (error) return error;
      }
      continue;
    }

    return `Unsupported action kind "${action.kind}" for fill_details command.`;
  }

  if (
    actions.length === 0 &&
    hasConcreteLatestUserInputForFillDetails(targetsById, latestUserInput)
  ) {
    return 'Fill_details should use the explicit user details instead of asking another follow-up question.';
  }

  return null;
}

function validateDependenciesRelationEntry(
  value: Record<string, unknown>,
  allowedElementIds: ReadonlySet<string>,
  existingRelationKeys: ReadonlySet<string>,
  seenRelationKeys: Set<string>,
  mode: 'add' | 'remove'
): string | null {
  if (typeof value.fromId !== 'string' || value.fromId.trim().length === 0) {
    return 'Every dependency suggestion must include fromId.';
  }
  if (typeof value.toId !== 'string' || value.toId.trim().length === 0) {
    return 'Every dependency suggestion must include toId.';
  }
  if (!isAiAssistantRelationSuggestionType(value.relationType)) {
    return 'Dependencies command relationType must be one of blocks, leads_to, or relates_to.';
  }

  const fromId = value.fromId.trim();
  const toId = value.toId.trim();
  if (fromId === toId) {
    return 'Dependency suggestions must point between two different items.';
  }
  if (
    allowedElementIds.size > 0 &&
    (!allowedElementIds.has(fromId) || !allowedElementIds.has(toId))
  ) {
    return 'Dependency suggestions must stay inside the prepared command scope.';
  }

  const relationKey = serializeDependencyRelationKey(
    fromId,
    toId,
    value.relationType
  );
  if (mode === 'add' && existingRelationKeys.has(relationKey)) {
    return 'Suggested dependency already exists in the prepared command context.';
  }
  if (mode === 'remove' && !existingRelationKeys.has(relationKey)) {
    return 'Removed dependency must already exist in the prepared command context.';
  }
  if (seenRelationKeys.has(relationKey)) {
    return 'Dependencies command contains a duplicate suggested relation.';
  }
  seenRelationKeys.add(relationKey);

  return null;
}

function validateDependenciesRelationUpdateEntry(
  value: Record<string, unknown>,
  allowedElementIds: ReadonlySet<string>,
  existingRelationKeys: ReadonlySet<string>,
  seenRelationKeys: Set<string>
): string | null {
  if (typeof value.fromId !== 'string' || value.fromId.trim().length === 0) {
    return 'Every dependency relation update must include fromId.';
  }
  if (typeof value.toId !== 'string' || value.toId.trim().length === 0) {
    return 'Every dependency relation update must include toId.';
  }
  if (!isAiAssistantRelationSuggestionType(value.currentRelationType)) {
    return 'Dependencies command currentRelationType must be one of blocks, leads_to, or relates_to.';
  }
  if (!isAiAssistantRelationSuggestionType(value.nextRelationType)) {
    return 'Dependencies command nextRelationType must be one of blocks, leads_to, or relates_to.';
  }

  const fromId = value.fromId.trim();
  const toId = value.toId.trim();
  if (fromId === toId) {
    return 'Dependency relation updates must point between two different items.';
  }
  if (
    allowedElementIds.size > 0 &&
    (!allowedElementIds.has(fromId) || !allowedElementIds.has(toId))
  ) {
    return 'Dependency relation updates must stay inside the prepared command scope.';
  }

  const currentRelationType = value.currentRelationType;
  const nextRelationType = value.nextRelationType;
  if (currentRelationType === nextRelationType) {
    return 'Dependency relation updates must change the relation type.';
  }

  const currentRelationKey = serializeDependencyRelationKey(
    fromId,
    toId,
    currentRelationType
  );
  const nextRelationKey = serializeDependencyRelationKey(
    fromId,
    toId,
    nextRelationType
  );
  if (!existingRelationKeys.has(currentRelationKey)) {
    return 'Updated dependency must already exist in the prepared command context.';
  }
  if (existingRelationKeys.has(nextRelationKey)) {
    return 'Updated dependency cannot change into a relation that already exists in the prepared command context.';
  }
  if (
    seenRelationKeys.has(currentRelationKey) ||
    seenRelationKeys.has(nextRelationKey)
  ) {
    return 'Dependencies command contains a duplicate relation update.';
  }

  seenRelationKeys.add(currentRelationKey);
  seenRelationKeys.add(nextRelationKey);
  return null;
}

function validateStrategicCreateGoalsEntry(
  value: Record<string, unknown>,
  mode: AiAssistantStrategicPlanCommandContext['mode'],
  selectedGoalId: string | null
): string | null {
  if (!Array.isArray(value.items) || value.items.length < 2) {
    return 'create_goals must contain at least two goal items.';
  }

  const batchTargetError = validateStrategicGoalTarget(
    value.target,
    mode,
    selectedGoalId
  );
  if (batchTargetError) {
    return batchTargetError;
  }

  for (const item of value.items) {
    if (!isPlainObject(item)) {
      return 'Each create_goals item must be a JSON object.';
    }
    if (typeof item.title !== 'string' || item.title.trim().length === 0) {
      return 'Each create_goals item must include a non-empty title.';
    }
    if (
      item.description !== undefined &&
      (typeof item.description !== 'string' || item.description.trim().length === 0)
    ) {
      return 'Each create_goals description must be a non-empty string when provided.';
    }
    if (item.priority !== undefined && !isUiPriority(item.priority)) {
      return 'create_goals priority must use a supported priority value.';
    }
    if (
      item.elementStatus !== undefined &&
      !isAiAssistantCreateElementStatus(item.elementStatus)
    ) {
      return 'create_goals elementStatus must use a supported status value.';
    }
    if (item.target !== undefined) {
      const targetError = validateStrategicGoalTarget(
        item.target,
        mode,
        selectedGoalId
      );
      if (targetError) {
        return targetError;
      }
    }
  }

  return null;
}

function validateStrategicGoalBlueprintEntry(
  value: Record<string, unknown>,
  mode: AiAssistantStrategicPlanCommandContext['mode'],
  selectedGoalId: string | null
): string | null {
  const targetError = validateStrategicGoalTarget(
    value.target,
    mode,
    selectedGoalId
  );
  if (targetError) {
    return targetError;
  }

  const pattern = value.pattern;
  if (
    pattern !== 'goal_tree' &&
    pattern !== 'goal_tree_with_sequence' &&
    pattern !== 'goal_graph'
  ) {
    return 'create_goal_blueprint pattern must be goal_tree, goal_tree_with_sequence, or goal_graph.';
  }

  if (!Array.isArray(value.goals) || value.goals.length < 2) {
    return 'create_goal_blueprint must contain at least two goals.';
  }

  const refs = new Set<string>();
  const parentByRef = new Map<string, string | null>();
  for (const goal of value.goals) {
    if (!isPlainObject(goal)) {
      return 'Each create_goal_blueprint goal must be a JSON object.';
    }
    if (typeof goal.ref !== 'string' || goal.ref.trim().length === 0) {
      return 'Each create_goal_blueprint goal must include ref.';
    }
    const ref = goal.ref.trim();
    if (refs.has(ref)) {
      return 'create_goal_blueprint goal refs must be unique.';
    }
    refs.add(ref);
    parentByRef.set(
      ref,
      typeof goal.parentRef === 'string' && goal.parentRef.trim().length > 0
        ? goal.parentRef.trim()
        : null
    );

    if (typeof goal.title !== 'string' || goal.title.trim().length === 0) {
      return 'Each create_goal_blueprint goal must include a non-empty title.';
    }
    if (
      goal.description !== undefined &&
      (typeof goal.description !== 'string' || goal.description.trim().length === 0)
    ) {
      return 'Each create_goal_blueprint goal description must be a non-empty string when provided.';
    }
    if (goal.priority !== undefined && !isUiPriority(goal.priority)) {
      return 'create_goal_blueprint goal priority must use a supported priority value.';
    }
    if (
      goal.elementStatus !== undefined &&
      !isAiAssistantCreateElementStatus(goal.elementStatus)
    ) {
      return 'create_goal_blueprint goal elementStatus must use a supported status value.';
    }
  }

  let rootCount = 0;
  for (const [ref, parentRef] of parentByRef.entries()) {
    if (!parentRef) {
      rootCount += 1;
      continue;
    }
    if (!refs.has(parentRef)) {
      return 'create_goal_blueprint parentRef must point to another goal in the blueprint.';
    }
    if (parentRef === ref) {
      return 'create_goal_blueprint goals cannot parent themselves.';
    }
  }

  if (pattern === 'goal_graph') {
    if (rootCount !== refs.size) {
      return 'goal_graph blueprints may not contain parentRef values.';
    }
  } else if (rootCount !== 1) {
    return 'goal_tree blueprints must contain exactly one root goal.';
  }

  if (hasGoalBlueprintCycle(parentByRef)) {
    return 'create_goal_blueprint may not contain hierarchy cycles.';
  }

  if (value.relations === undefined) {
    return null;
  }

  if (!Array.isArray(value.relations)) {
    return 'create_goal_blueprint relations must be an array when provided.';
  }

  const relationKeys = new Set<string>();
  for (const relation of value.relations) {
    if (!isPlainObject(relation)) {
      return 'Each create_goal_blueprint relation must be a JSON object.';
    }
    if (relation.relationType !== 'leads_to') {
      return 'create_goal_blueprint relations may only use leads_to.';
    }
    if (
      typeof relation.fromRef !== 'string' ||
      relation.fromRef.trim().length === 0 ||
      typeof relation.toRef !== 'string' ||
      relation.toRef.trim().length === 0
    ) {
      return 'Each create_goal_blueprint relation must include fromRef and toRef.';
    }
    const fromRef = relation.fromRef.trim();
    const toRef = relation.toRef.trim();
    if (fromRef === toRef) {
      return 'create_goal_blueprint relations must connect two different goals.';
    }
    if (!refs.has(fromRef) || !refs.has(toRef)) {
      return 'create_goal_blueprint relations must point to declared goal refs.';
    }
    const relationKey = `${fromRef}->${toRef}:leads_to`;
    if (relationKeys.has(relationKey)) {
      return 'create_goal_blueprint contains a duplicate leads_to relation.';
    }
    relationKeys.add(relationKey);
  }

  return null;
}

function validateStrategicGoalTarget(
  value: unknown,
  mode: AiAssistantStrategicPlanCommandContext['mode'],
  selectedGoalId: string | null
): string | null {
  if (value === undefined) {
    if (mode === 'canvas_bootstrap') {
      return null;
    }
    return 'Strategic decomposition around a selected goal must target that goal explicitly.';
  }
  if (!isPlainObject(value)) {
    return 'Strategic plan target must be a JSON object.';
  }
  if (value.kind === 'canvas') {
    return mode === 'canvas_bootstrap'
      ? null
      : 'Selected-goal strategic planning must target the selected goal, not the canvas.';
  }
  if (value.kind !== 'goal' || typeof value.id !== 'string' || value.id.trim().length === 0) {
    return 'Strategic plan target must be canvas or goal.';
  }
  if (mode === 'canvas_bootstrap') {
    return 'Canvas bootstrap strategic plans may only target the canvas.';
  }
  if (!selectedGoalId || value.id.trim() !== selectedGoalId) {
    return 'Strategic plan target must match the selected goal from the prepared command context.';
  }
  return null;
}

function validateBreakdownCreateBatchEntry(
  value: Record<string, unknown>,
  targetKind: 'goal' | 'story',
  expectedTargetId: string | null,
  label: 'stories' | 'tasks'
): string | null {
  if (!Array.isArray(value.items) || value.items.length === 0) {
    return `create_batch_${label} must contain a non-empty items array.`;
  }
  if (!isPlainObject(value.target)) {
    return `create_batch_${label} must include a canonical target object.`;
  }
  if (value.target.kind !== targetKind) {
    return `create_batch_${label} target must be a ${targetKind}.`;
  }
  if (
    typeof value.target.id !== 'string' ||
    value.target.id.trim().length === 0
  ) {
    return `create_batch_${label} target must include id.`;
  }
  if (expectedTargetId && value.target.id.trim() !== expectedTargetId) {
    return `create_batch_${label} target must match the selected ${targetKind}.`;
  }

  for (const item of value.items) {
    if (!isPlainObject(item)) {
      return `Each create_batch_${label} item must be a JSON object.`;
    }
    if (typeof item.title !== 'string' || item.title.trim().length === 0) {
      return `Each create_batch_${label} item must include a non-empty title.`;
    }
    if (
      item.description !== undefined &&
      (typeof item.description !== 'string' || item.description.trim().length === 0)
    ) {
      return `Each create_batch_${label} description must be a non-empty string when provided.`;
    }
    if (item.priority !== undefined && !isUiPriority(item.priority)) {
      return `create_batch_${label} priority must use a supported priority value.`;
    }
    if (
      item.elementStatus !== undefined &&
      !isAiAssistantCreateElementStatus(item.elementStatus)
    ) {
      return `create_batch_${label} elementStatus must use a supported status value.`;
    }
  }

  return null;
}

function validateBreakdownSingleCreateEntry(
  value: Record<string, unknown>,
  targetKind: 'goal' | 'story',
  expectedTargetId: string | null,
  entityLabel: 'story' | 'task'
): string | null {
  if (typeof value.title !== 'string' || value.title.trim().length === 0) {
    return `Each create_${entityLabel} action must include a non-empty title.`;
  }
  if (
    value.description !== undefined &&
    (typeof value.description !== 'string' || value.description.trim().length === 0)
  ) {
    return `create_${entityLabel} description must be a non-empty string when provided.`;
  }
  if (value.priority !== undefined && !isUiPriority(value.priority)) {
    return `create_${entityLabel} priority must use a supported priority value.`;
  }
  if (
    value.elementStatus !== undefined &&
    !isAiAssistantCreateElementStatus(value.elementStatus)
  ) {
    return `create_${entityLabel} elementStatus must use a supported status value.`;
  }
  if (!isPlainObject(value.target)) {
    return `create_${entityLabel} must include a canonical target object.`;
  }
  if (value.target.kind !== targetKind) {
    return `create_${entityLabel} target must be a ${targetKind}.`;
  }
  if (
    typeof value.target.id !== 'string' ||
    value.target.id.trim().length === 0
  ) {
    return `create_${entityLabel} target must include id.`;
  }
  if (expectedTargetId && value.target.id.trim() !== expectedTargetId) {
    return `create_${entityLabel} target must match the selected ${targetKind}.`;
  }
  return null;
}

function hasGoalBlueprintCycle(
  parentByRef: ReadonlyMap<string, string | null>
): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (ref: string): boolean => {
    if (visited.has(ref)) return false;
    if (visiting.has(ref)) return true;
    visiting.add(ref);
    const parentRef = parentByRef.get(ref);
    if (parentRef && walk(parentRef)) {
      return true;
    }
    visiting.delete(ref);
    visited.add(ref);
    return false;
  };

  for (const ref of parentByRef.keys()) {
    if (walk(ref)) {
      return true;
    }
  }
  return false;
}

function validateFillDetailsUpdateEntry(
  value: Record<string, unknown>,
  allowedElementIds: ReadonlySet<string>,
  targetsById: ReadonlyMap<string, AiAssistantFillDetailsTarget>,
  latestUserInput: string
): string | null {
  if (typeof value.elementId !== 'string' || value.elementId.trim().length === 0) {
    return 'Every fill_details update must include elementId.';
  }

  const elementId = value.elementId.trim();

  if (
    allowedElementIds.size > 0 &&
    !allowedElementIds.has(elementId)
  ) {
    return `Update target "${elementId}" is outside the prepared command context.`;
  }

  if (!isPlainObject(value.patch)) {
    return 'Every fill_details update must include a patch object.';
  }

  const patchKeys = Object.keys(value.patch);
  if (patchKeys.length === 0) {
    return 'Fill_details patch must update title or description.';
  }

  if (
    patchKeys.some((key) => key !== 'title' && key !== 'description')
  ) {
    return 'Fill_details patch may only contain title and description.';
  }

  const title =
    typeof value.patch.title === 'string' ? value.patch.title.trim() : '';
  const description =
    typeof value.patch.description === 'string'
      ? value.patch.description.trim()
      : '';

  if (title.length === 0 && description.length === 0) {
    return 'Fill_details patch must provide a non-empty title or description.';
  }

  const target = targetsById.get(elementId);
  if (target) {
    if (
      title.length > 0 &&
      normalizeFillDetailsComparableText(title) ===
        normalizeFillDetailsComparableText(target.title)
    ) {
      return 'Fill_details title update must meaningfully change the current title.';
    }

    if (
      description.length > 0 &&
      normalizeFillDetailsComparableText(description) ===
        normalizeFillDetailsComparableText(target.description)
    ) {
      return 'Fill_details description update must change the current description.';
    }

    if (
      description.length > 0 &&
      !isSupportedFillDetailsDescription(description, target, latestUserInput)
    ) {
      return 'Fill_details description must add concrete detail from user input or nearby context instead of restating the current item.';
    }
  }

  return null;
}

function resolveFillDetailsCandidateElements(
  focus: AiAssistantFocusItem | null,
  cluster: AiAssistantCanvasSnapshot | null,
  missingDescriptionIds: ReadonlySet<string>
): AiAssistantCanvasElement[] {
  const clusterElements = cluster?.elements ?? [];
  const elementIds = new Set<string>();
  const elements: AiAssistantCanvasElement[] = [];

  clusterElements.forEach((element) => {
    if (!hasFillDetailsGap(element, missingDescriptionIds)) {
      return;
    }
    elementIds.add(element.id);
    elements.push(element);
  });

  if (
    focus?.item &&
    hasFillDetailsGap(focus.item, missingDescriptionIds) &&
    !elementIds.has(focus.item.id)
  ) {
    elements.unshift(focus.item);
  }

  if (elements.length > 0) {
    return elements;
  }

  return focus?.item ? [focus.item] : [];
}

function buildFillDetailsTarget(
  element: AiAssistantCanvasElement,
  focus: AiAssistantFocusItem | null,
  missingDescriptionIds: ReadonlySet<string>
): AiAssistantFillDetailsTarget {
  const target: AiAssistantFillDetailsTarget = {
    ...toCommandElementSummary(element),
    missingFields: resolveMissingFields(element, missingDescriptionIds),
  };

  if (focus?.item.id === element.id) {
    target.context = {
      parent: focus.parent ? toCommandElementSummary(focus.parent) : null,
      children: focus.children.map((item) => toCommandElementSummary(item)),
      siblings: focus.siblings.map((item) => toCommandElementSummary(item)),
      related: focus.related.map((entry) => ({
        relationType: entry.relationType,
        item: toCommandElementSummary(entry.item),
      })),
    };
  }

  return target;
}

function toCommandElementSummary(
  element: AiAssistantCanvasElement
): AiAssistantCommandElementSummary {
  return {
    id: element.id,
    kind: element.kind,
    title: element.title,
    description: element.description,
    status: typeof element.status === 'string' ? element.status : undefined,
    priority:
      typeof element.priority === 'string' ? element.priority : undefined,
  };
}

function resolveMissingFields(
  element: AiAssistantCanvasElement,
  missingDescriptionIds: ReadonlySet<string>
): Array<'title' | 'description'> {
  const missingFields: Array<'title' | 'description'> = [];
  if (element.title.trim().length === 0) {
    missingFields.push('title');
  }
  if (
    element.description.trim().length === 0 ||
    missingDescriptionIds.has(element.id)
  ) {
    missingFields.push('description');
  }
  return missingFields;
}

function hasFillDetailsGap(
  element: AiAssistantCanvasElement,
  missingDescriptionIds: ReadonlySet<string>
): boolean {
  return (
    element.title.trim().length === 0 ||
    element.description.trim().length === 0 ||
    missingDescriptionIds.has(element.id)
  );
}

function readAllowedElementIdsFromCommandContext(
  value: Record<string, unknown>
): string[] {
  const ids = value.allowedElementIds;
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.filter((id): id is string => typeof id === 'string');
}

function readFillDetailsTargetsById(
  value: Record<string, unknown>
): Map<string, AiAssistantFillDetailsTarget> {
  const targets = new Map<string, AiAssistantFillDetailsTarget>();
  const singleTarget = coerceFillDetailsTarget(value.target);
  if (singleTarget) {
    targets.set(singleTarget.id, singleTarget);
  }

  const batchTargets = value.targets;
  if (Array.isArray(batchTargets)) {
    batchTargets.forEach((item) => {
      const target = coerceFillDetailsTarget(item);
      if (target) {
        targets.set(target.id, target);
      }
    });
  }

  return targets;
}

function readFillDetailsLatestUserInput(
  value: Record<string, unknown>
): string {
  return typeof value.latestUserInput === 'string'
    ? value.latestUserInput.trim()
    : '';
}

function readActionPlanFromCommandContext(
  value: Record<string, unknown>
): AiAssistantActionPlan | null {
  const actionPlan = value.actionPlan;
  if (!isPlainObject(actionPlan)) {
    return null;
  }

  const confirmationMode = actionPlan.confirmationMode;
  if (
    typeof actionPlan.scenarioId !== 'string' ||
    typeof actionPlan.scenarioKind !== 'string' ||
    typeof actionPlan.scenarioMode !== 'string' ||
    (actionPlan.intent !== null && typeof actionPlan.intent !== 'string') ||
    !Array.isArray(actionPlan.allowedRuntimeActionKinds) ||
    !Array.isArray(actionPlan.allowedStructuredReplyKinds) ||
    (actionPlan.primaryRuntimeActionKind !== null &&
      typeof actionPlan.primaryRuntimeActionKind !== 'string') ||
    (confirmationMode !== 'batch' &&
      confirmationMode !== 'single' &&
      confirmationMode !== 'follow-up') ||
    typeof actionPlan.requiresConfirmation !== 'boolean' ||
    typeof actionPlan.requiresFollowUp !== 'boolean' ||
    typeof actionPlan.batchable !== 'boolean'
  ) {
    return null;
  }

  return actionPlan as AiAssistantActionPlan;
}

function readStrategicPlanMode(
  value: Record<string, unknown>
): AiAssistantStrategicPlanCommandContext['mode'] {
  switch (value.mode) {
    case 'goal_subgoals':
    case 'goal_replan':
      return value.mode;
    default:
      return 'canvas_bootstrap';
  }
}

function readStrategicPlanSelectedGoalId(
  value: Record<string, unknown>
): string | null {
  const selectedGoal = value.selectedGoal;
  if (!isPlainObject(selectedGoal) || typeof selectedGoal.id !== 'string') {
    return null;
  }
  return selectedGoal.id;
}

function readBreakdownMode(
  value: Record<string, unknown>
): AiAssistantBreakdownCommandContext['mode'] {
  switch (value.mode) {
    case 'goal_stories':
    case 'story_tasks':
    case 'task_refine':
      return value.mode;
    default:
      return 'unspecified_goal_decomposition';
  }
}

function readBreakdownTarget(
  value: Record<string, unknown>
): AiAssistantCommandElementSummary | null {
  const target = value.target;
  if (!isPlainObject(target) || typeof target.id !== 'string') {
    return null;
  }
  return target as AiAssistantCommandElementSummary;
}

function readDependencyExistingRelationKeys(
  value: Record<string, unknown>
): Set<string> {
  const keys = new Set<string>();
  const existingRelations = value.existingRelations;
  if (!Array.isArray(existingRelations)) {
    return keys;
  }

  existingRelations.forEach((entry) => {
    if (
      !isPlainObject(entry) ||
      typeof entry.fromId !== 'string' ||
      typeof entry.toId !== 'string' ||
      !isAiAssistantRelationSuggestionType(entry.relationType)
    ) {
      return;
    }
    keys.add(
      serializeDependencyRelationKey(
        entry.fromId,
        entry.toId,
        entry.relationType
      )
    );
  });

  return keys;
}

function coerceFillDetailsTarget(
  value: unknown
): AiAssistantFillDetailsTarget | null {
  if (
    !isPlainObject(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string'
  ) {
    return null;
  }

  return value as AiAssistantFillDetailsTarget;
}

function normalizeFillDetailsComparableText(text: string): string {
  const words = text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.join(' ').trim();
}

function isSupportedFillDetailsDescription(
  description: string,
  target: AiAssistantFillDetailsTarget,
  latestUserInput: string
): boolean {
  if (isUserBackedFillDetailsDescription(description, target, latestUserInput)) {
    return true;
  }

  return isContextBackedFillDetailsDescription(description, target);
}

function isContextBackedFillDetailsDescription(
  description: string,
  target: AiAssistantFillDetailsTarget
): boolean {
  const evidenceFragments = collectFillDetailsEvidenceFragments(target);
  if (evidenceFragments.size === 0) {
    return false;
  }

  const descriptionFragments = extractFillDetailsFragments(description);
  const existingFragments = extractFillDetailsFragments(
    [target.title, target.description].join(' ')
  );

  for (const fragment of descriptionFragments) {
    if (existingFragments.has(fragment)) {
      continue;
    }
    if (evidenceFragments.has(fragment)) {
      return true;
    }
  }

  return false;
}

function isUserBackedFillDetailsDescription(
  description: string,
  target: AiAssistantFillDetailsTarget,
  latestUserInput: string
): boolean {
  if (!hasConcreteUserProvidedFillDetails(latestUserInput, target)) {
    return false;
  }

  const userFragments = collectFillDetailsUserInputFragments(latestUserInput, target);
  const descriptionFragments = extractFillDetailsFragments(description);
  const existingFragments = extractFillDetailsFragments(
    [target.title, target.description].join(' ')
  );

  for (const fragment of descriptionFragments) {
    if (existingFragments.has(fragment)) {
      continue;
    }
    if (userFragments.has(fragment)) {
      return true;
    }
  }

  return false;
}

function hasConcreteLatestUserInputForFillDetails(
  targetsById: ReadonlyMap<string, AiAssistantFillDetailsTarget>,
  latestUserInput: string
): boolean {
  if (targetsById.size === 0) {
    return hasConcreteUserProvidedFillDetails(latestUserInput, null);
  }

  for (const target of targetsById.values()) {
    if (hasConcreteUserProvidedFillDetails(latestUserInput, target)) {
      return true;
    }
  }

  return false;
}

function hasConcreteUserProvidedFillDetails(
  latestUserInput: string,
  target: AiAssistantFillDetailsTarget | null
): boolean {
  const userFragments = collectFillDetailsUserInputFragments(latestUserInput, target);
  if (userFragments.size === 0) {
    return false;
  }

  let fragmentCount = 0;
  let hasPhrase = false;
  for (const fragment of userFragments) {
    fragmentCount += 1;
    if (fragment.includes(' ')) {
      hasPhrase = true;
      break;
    }
  }

  return hasPhrase || fragmentCount >= 2;
}

function collectFillDetailsUserInputFragments(
  latestUserInput: string,
  target: AiAssistantFillDetailsTarget | null
): Set<string> {
  const userFragments = extractFillDetailsFragments(latestUserInput);
  if (!target) {
    return userFragments;
  }

  const existingFragments = extractFillDetailsFragments(
    [target.title, target.description].join(' ')
  );
  const novelFragments = new Set<string>();
  userFragments.forEach((fragment) => {
    if (!existingFragments.has(fragment)) {
      novelFragments.add(fragment);
    }
  });
  return novelFragments;
}

function isConciseFollowupReply(replyMarkdown: string): boolean {
  const trimmed = replyMarkdown.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 220 &&
    !trimmed.includes('\n')
  );
}

function resolveDependenciesAllowedElementIds(
  selectedElementIds: string[],
  cluster: AiAssistantCanvasSnapshot | null,
  focus: AiAssistantFocusItem | null
): string[] {
  if (selectedElementIds.length > 1) {
    return selectedElementIds.slice();
  }

  const ids = new Set<string>();
  if (selectedElementIds.length === 1) {
    ids.add(selectedElementIds[0]);
  }

  if (focus?.item) {
    ids.add(focus.item.id);
    if (focus.parent) {
      ids.add(focus.parent.id);
    }
    focus.children.forEach((item) => {
      ids.add(item.id);
    });
    focus.siblings.forEach((item) => {
      ids.add(item.id);
    });
    focus.related.forEach((entry) => {
      ids.add(entry.item.id);
    });
  }

  if (ids.size === 0 && cluster) {
    cluster.elements.forEach((element) => {
      ids.add(element.id);
    });
  }

  return Array.from(ids);
}

function readDependenciesExistingRelations(
  toolResults: AiAssistantToolResult[],
  snapshot: AiAssistantCanvasSnapshot | null,
  allowedElementIds: ReadonlySet<string>
): AiAssistantDependencyRelationSummary[] {
  const relationEdges = readDependencyRelationEdges(toolResults, snapshot);
  const elementsById = new Map(
    (snapshot?.elements ?? []).map((element) => [element.id, element])
  );

  return relationEdges
    .filter(
      (relation) =>
        allowedElementIds.size === 0 ||
        (allowedElementIds.has(relation.fromId) &&
          allowedElementIds.has(relation.toId))
    )
    .filter((relation) => relation.relationType !== 'parent_child')
    .filter(
      (
        relation
      ): relation is AiAssistantConnectionEdge & {
        relationType: AiAssistantRelationSuggestionType;
      } => isAiAssistantRelationSuggestionType(relation.relationType)
    )
    .map((relation) => ({
      fromId: relation.fromId,
      toId: relation.toId,
      relationType: relation.relationType,
      fromTitle: elementsById.get(relation.fromId)?.title,
      toTitle: elementsById.get(relation.toId)?.title,
    }));
}

function readDependencyRelationEdges(
  toolResults: AiAssistantToolResult[],
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantConnectionEdge[] {
  const data = getSuccessfulToolData(toolResults, 'get_related_relations');
  if (isPlainObject(data) && Array.isArray(data.relations)) {
    return data.relations.filter(
      (relation): relation is AiAssistantConnectionEdge =>
        isPlainObject(relation) &&
        typeof relation.id === 'string' &&
        typeof relation.fromId === 'string' &&
        typeof relation.toId === 'string' &&
        typeof relation.relationType === 'string'
    );
  }

  return snapshot?.connections.slice() ?? [];
}

function readDependencyFindings(
  toolResults: AiAssistantToolResult[]
): AiAssistantDependencyFinding[] {
  const data = getSuccessfulToolData(toolResults, 'find_dependency_gaps');
  if (!isPlainObject(data) || !Array.isArray(data.findings)) {
    return [];
  }

  const findings: AiAssistantDependencyFinding[] = [];
  data.findings.forEach((finding) => {
    if (
      !isPlainObject(finding) ||
      typeof finding.code !== 'string' ||
      typeof finding.severity !== 'string' ||
      typeof finding.message !== 'string' ||
      !Array.isArray(finding.targetIds)
    ) {
      return;
    }
    findings.push({
      code: finding.code,
      severity: finding.severity,
      message: finding.message,
      targetIds: finding.targetIds.filter(
        (targetId): targetId is string => typeof targetId === 'string'
      ),
    });
  });

  return findings;
}

function serializeDependencyRelationKey(
  fromId: string,
  toId: string,
  relationType: AiAssistantRelationSuggestionType
): string {
  if (relationType === 'relates_to') {
    const orderedIds = [fromId, toId].sort();
    return `${relationType}:${orderedIds[0]}:${orderedIds[1]}`;
  }
  return `${relationType}:${fromId}:${toId}`;
}

function collectFillDetailsEvidenceFragments(
  target: AiAssistantFillDetailsTarget
): Set<string> {
  const evidence: string[] = [];
  const parent = target.context?.parent;
  if (parent) {
    evidence.push(parent.title, parent.description);
  }
  (target.context?.children ?? []).forEach((item) => {
    evidence.push(item.title, item.description);
  });
  (target.context?.siblings ?? []).forEach((item) => {
    evidence.push(item.title, item.description);
  });
  (target.context?.related ?? []).forEach((entry) => {
    evidence.push(entry.item.title, entry.item.description);
  });

  return extractFillDetailsFragments(
    evidence.filter((value) => value.trim().length > 0).join(' ')
  );
}

function extractFillDetailsFragments(text: string): Set<string> {
  const fragments = new Set<string>();
  const words = (text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (word) => word.length >= 4
  );

  words.forEach((word) => {
    fragments.add(word);
  });

  for (let index = 0; index < words.length - 1; index += 1) {
    const current = words[index];
    const next = words[index + 1];
    if (!current || !next) {
      continue;
    }
    fragments.add(`${current} ${next}`);
  }

  return fragments;
}

function readFocusBundle(
  toolResults: AiAssistantToolResult[]
): AiAssistantFocusItem | null {
  const data = getSuccessfulToolData(toolResults, 'get_focus_bundle');
  if (!isPlainObject(data) || !isPlainObject(data.focus)) {
    return null;
  }
  return data.focus as AiAssistantFocusItem;
}

function readSelectionCluster(
  toolResults: AiAssistantToolResult[]
): AiAssistantCanvasSnapshot | null {
  const data = getSuccessfulToolData(toolResults, 'get_selection_cluster');
  if (!isPlainObject(data) || !isPlainObject(data.cluster)) {
    return null;
  }
  return data.cluster as AiAssistantCanvasSnapshot;
}

function readMissingDescriptionIds(
  toolResults: AiAssistantToolResult[]
): Set<string> {
  const data = getSuccessfulToolData(toolResults, 'find_missing_descriptions');
  if (!isPlainObject(data) || !Array.isArray(data.findings)) {
    return new Set<string>();
  }

  const ids: string[] = [];
  data.findings.forEach((finding) => {
    if (!isPlainObject(finding) || !Array.isArray(finding.targetIds)) {
      return;
    }
    finding.targetIds.forEach((id) => {
      if (typeof id === 'string') {
        ids.push(id);
      }
    });
  });

  return new Set(ids);
}

function deriveFocusFromSnapshot(
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantFocusItem | null {
  if (!snapshot || !snapshot.focusId) {
    return null;
  }

  const item = snapshot.elements.find((element) => element.id === snapshot.focusId);
  if (!item) {
    return null;
  }

  const parent = item.parentId
    ? snapshot.elements.find((element) => element.id === item.parentId) ?? null
    : null;
  const children = snapshot.elements.filter((element) =>
    item.childIds.includes(element.id)
  );
  const siblings = parent
    ? snapshot.elements.filter(
        (element) => element.parentId === parent.id && element.id !== item.id
      )
    : [];

  return {
    item,
    parent,
    children,
    siblings,
    related: [],
  };
}

function getSuccessfulToolData(
  toolResults: AiAssistantToolResult[],
  toolName: string
): unknown {
  const result = toolResults.find((entry) => entry.tool === toolName && entry.ok);
  return result?.data;
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
