import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatConnectionEdge,
  WorkspaceChatElementKind,
  WorkspaceChatIntentKind,
} from '../workspaceChatEvents.ts';
import {
  isWorkspaceChatRelationSuggestionType,
  type WorkspaceChatRelationSuggestionType,
} from '../workspaceChatActions.ts';
import type { WorkspaceChatApiMessage } from './WorkspaceChatApiTypes.ts';
import type {
  WorkspaceChatFocusItem,
  WorkspaceChatMemoryState,
} from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatInstructionPacket } from './WorkspaceChatInstructionTypes.ts';
import {
  WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE,
  type WorkspaceChatStructuredReplyEnvelope,
} from './WorkspaceChatStructuredTransport.ts';
import type { WorkspaceChatToolResult } from './WorkspaceChatToolTypes.ts';
import { isPlainObject } from './WorkspaceChatToolTypes.ts';

type WorkspaceChatCommandBuildContextParams = {
  prompt: string;
  memory: WorkspaceChatMemoryState;
  toolResults: WorkspaceChatToolResult[];
  snapshot: WorkspaceChatCanvasSnapshot | null;
};

type WorkspaceChatCommandBuildMessagesParams = {
  prompt: string;
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
};

type WorkspaceChatCommandValidateEnvelopeParams = {
  envelope: WorkspaceChatStructuredReplyEnvelope;
  compiledContext: Record<string, unknown>;
};

type WorkspaceChatCommandBuildRepairMessagesParams = {
  invalidResponse: string;
  validationError: string;
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
};

export type WorkspaceChatCommandSpec = {
  intent: WorkspaceChatIntentKind;
  buildCompiledContext: (
    params: WorkspaceChatCommandBuildContextParams
  ) => Record<string, unknown>;
  buildMessages: (
    params: WorkspaceChatCommandBuildMessagesParams
  ) => WorkspaceChatApiMessage[];
  validateEnvelope: (
    params: WorkspaceChatCommandValidateEnvelopeParams
  ) => string | null;
  buildRepairMessages: (
    params: WorkspaceChatCommandBuildRepairMessagesParams
  ) => WorkspaceChatApiMessage[];
};

type WorkspaceChatCommandElementSummary = {
  id: string;
  kind: WorkspaceChatElementKind;
  title: string;
  description: string;
  status?: string;
  priority?: string;
};

type WorkspaceChatCommandRelatedSummary = {
  relationType: string;
  item: WorkspaceChatCommandElementSummary;
};

type WorkspaceChatDependencyFinding = {
  code: string;
  severity: string;
  message: string;
  targetIds: string[];
};

type WorkspaceChatDependencyRelationSummary = {
  fromId: string;
  toId: string;
  relationType: WorkspaceChatRelationSuggestionType;
  fromTitle?: string;
  toTitle?: string;
};

type WorkspaceChatDependenciesCommandContext = {
  intent: 'dependencies';
  commandVersion: 2;
  latestUserInput: string;
  scope: 'single' | 'cluster';
  preferredActionShape: 'suggest_relation' | 'suggest_relations';
  allowedElementIds: string[];
  selectedElementIds: string[];
  items: WorkspaceChatCommandElementSummary[];
  existingRelations: WorkspaceChatDependencyRelationSummary[];
  dependencyFindings: WorkspaceChatDependencyFinding[];
  constraints: {
    allowedRelationTypes: ['blocks', 'leads_to', 'relates_to'];
    forbidReviewFindings: true;
    requireConciseFollowupQuestionWhenNoActions: true;
  };
};

type WorkspaceChatFillDetailsTarget = WorkspaceChatCommandElementSummary & {
  missingFields: Array<'title' | 'description'>;
  context?: {
    parent: WorkspaceChatCommandElementSummary | null;
    children: WorkspaceChatCommandElementSummary[];
    siblings: WorkspaceChatCommandElementSummary[];
    related: WorkspaceChatCommandRelatedSummary[];
  };
};

type WorkspaceChatFillDetailsCommandContext = {
  intent: 'fill_details';
  commandVersion: 2;
  latestUserInput: string;
  scope: 'single' | 'cluster';
  preferredActionShape: 'suggest_update' | 'suggest_updates';
  allowedElementIds: string[];
  target?: WorkspaceChatFillDetailsTarget;
  targets?: WorkspaceChatFillDetailsTarget[];
  constraints: {
    allowedPatchFields: ['title', 'description'];
    allowTitleParaphraseForDescription: false;
    requireContextBackedDetailForDescription: true;
    allowUserProvidedDetailForDescription: true;
    forbidReviewFindings: true;
    forbidInventedFacts: string[];
  };
};

const DEPENDENCIES_COMMAND_SPEC: WorkspaceChatCommandSpec = {
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

const FILL_DETAILS_COMMAND_SPEC: WorkspaceChatCommandSpec = {
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

export function getWorkspaceChatCommandSpec(
  intent: WorkspaceChatIntentKind | undefined
): WorkspaceChatCommandSpec | null {
  switch (intent) {
    case 'dependencies':
      return DEPENDENCIES_COMMAND_SPEC;
    case 'fill_details':
      return FILL_DETAILS_COMMAND_SPEC;
    default:
      return null;
  }
}

function buildDependenciesCommandContext(
  params: WorkspaceChatCommandBuildContextParams
): WorkspaceChatDependenciesCommandContext {
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
    constraints: {
      allowedRelationTypes: ['blocks', 'leads_to', 'relates_to'],
      forbidReviewFindings: true,
      requireConciseFollowupQuestionWhenNoActions: true,
    },
  };
}

function buildFillDetailsCommandContext(
  params: WorkspaceChatCommandBuildContextParams
): WorkspaceChatFillDetailsCommandContext {
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

  if (targets.length <= 1) {
    return {
      intent: 'fill_details',
      commandVersion: 2,
      latestUserInput: params.prompt.trim(),
      scope: 'single',
      preferredActionShape: 'suggest_update',
      allowedElementIds: targets.map((target) => target.id),
      target: targets[0],
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

function buildDependenciesCommandMessages(params: {
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): WorkspaceChatApiMessage[] {
  const messages: WorkspaceChatApiMessage[] = [
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
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): WorkspaceChatApiMessage[] {
  const messages: WorkspaceChatApiMessage[] = [
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
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): WorkspaceChatApiMessage[] {
  const messages: WorkspaceChatApiMessage[] = [
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
  instructionPackets: WorkspaceChatInstructionPacket[];
  compiledContext: Record<string, unknown>;
}): WorkspaceChatApiMessage[] {
  const messages: WorkspaceChatApiMessage[] = [
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
    `Use this exact envelope shape: ${WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE}`,
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
    `Use this exact envelope shape: ${WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE}`,
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

function validateDependenciesCommandEnvelope(
  envelope: WorkspaceChatStructuredReplyEnvelope,
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
    !isConciseDependenciesFollowupQuestion(envelope.replyMarkdown)
  ) {
    return 'Dependencies command must return relation suggestions or one concise follow-up question.';
  }

  return null;
}

function validateFillDetailsCommandEnvelope(
  envelope: WorkspaceChatStructuredReplyEnvelope,
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
    envelope.replyMarkdown.includes('?') &&
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
  if (!isWorkspaceChatRelationSuggestionType(value.relationType)) {
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
  if (!isWorkspaceChatRelationSuggestionType(value.currentRelationType)) {
    return 'Dependencies command currentRelationType must be one of blocks, leads_to, or relates_to.';
  }
  if (!isWorkspaceChatRelationSuggestionType(value.nextRelationType)) {
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

function validateFillDetailsUpdateEntry(
  value: Record<string, unknown>,
  allowedElementIds: ReadonlySet<string>,
  targetsById: ReadonlyMap<string, WorkspaceChatFillDetailsTarget>,
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
  focus: WorkspaceChatFocusItem | null,
  cluster: WorkspaceChatCanvasSnapshot | null,
  missingDescriptionIds: ReadonlySet<string>
): WorkspaceChatCanvasElement[] {
  const clusterElements = cluster?.elements ?? [];
  const elementIds = new Set<string>();
  const elements: WorkspaceChatCanvasElement[] = [];

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
  element: WorkspaceChatCanvasElement,
  focus: WorkspaceChatFocusItem | null,
  missingDescriptionIds: ReadonlySet<string>
): WorkspaceChatFillDetailsTarget {
  const target: WorkspaceChatFillDetailsTarget = {
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
  element: WorkspaceChatCanvasElement
): WorkspaceChatCommandElementSummary {
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
  element: WorkspaceChatCanvasElement,
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
  element: WorkspaceChatCanvasElement,
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
): Map<string, WorkspaceChatFillDetailsTarget> {
  const targets = new Map<string, WorkspaceChatFillDetailsTarget>();
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
      !isWorkspaceChatRelationSuggestionType(entry.relationType)
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
): WorkspaceChatFillDetailsTarget | null {
  if (
    !isPlainObject(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string'
  ) {
    return null;
  }

  return value as WorkspaceChatFillDetailsTarget;
}

function normalizeFillDetailsComparableText(text: string): string {
  const words = text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.join(' ').trim();
}

function isSupportedFillDetailsDescription(
  description: string,
  target: WorkspaceChatFillDetailsTarget,
  latestUserInput: string
): boolean {
  if (isUserBackedFillDetailsDescription(description, target, latestUserInput)) {
    return true;
  }

  return isContextBackedFillDetailsDescription(description, target);
}

function isContextBackedFillDetailsDescription(
  description: string,
  target: WorkspaceChatFillDetailsTarget
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
  target: WorkspaceChatFillDetailsTarget,
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
  targetsById: ReadonlyMap<string, WorkspaceChatFillDetailsTarget>,
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
  target: WorkspaceChatFillDetailsTarget | null
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
  target: WorkspaceChatFillDetailsTarget | null
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

function isConciseDependenciesFollowupQuestion(replyMarkdown: string): boolean {
  const trimmed = replyMarkdown.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 220 &&
    !trimmed.includes('\n') &&
    trimmed.includes('?')
  );
}

function resolveDependenciesAllowedElementIds(
  selectedElementIds: string[],
  cluster: WorkspaceChatCanvasSnapshot | null,
  focus: WorkspaceChatFocusItem | null
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
  toolResults: WorkspaceChatToolResult[],
  snapshot: WorkspaceChatCanvasSnapshot | null,
  allowedElementIds: ReadonlySet<string>
): WorkspaceChatDependencyRelationSummary[] {
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
    .filter((relation) => isWorkspaceChatRelationSuggestionType(relation.relationType))
    .map((relation) => ({
      fromId: relation.fromId,
      toId: relation.toId,
      relationType: relation.relationType,
      fromTitle: elementsById.get(relation.fromId)?.title,
      toTitle: elementsById.get(relation.toId)?.title,
    }));
}

function readDependencyRelationEdges(
  toolResults: WorkspaceChatToolResult[],
  snapshot: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatConnectionEdge[] {
  const data = getSuccessfulToolData(toolResults, 'get_related_relations');
  if (isPlainObject(data) && Array.isArray(data.relations)) {
    return data.relations.filter(
      (relation): relation is WorkspaceChatConnectionEdge =>
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
  toolResults: WorkspaceChatToolResult[]
): WorkspaceChatDependencyFinding[] {
  const data = getSuccessfulToolData(toolResults, 'find_dependency_gaps');
  if (!isPlainObject(data) || !Array.isArray(data.findings)) {
    return [];
  }

  const findings: WorkspaceChatDependencyFinding[] = [];
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
  relationType: WorkspaceChatRelationSuggestionType
): string {
  if (relationType === 'relates_to') {
    const orderedIds = [fromId, toId].sort();
    return `${relationType}:${orderedIds[0]}:${orderedIds[1]}`;
  }
  return `${relationType}:${fromId}:${toId}`;
}

function collectFillDetailsEvidenceFragments(
  target: WorkspaceChatFillDetailsTarget
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
  toolResults: WorkspaceChatToolResult[]
): WorkspaceChatFocusItem | null {
  const data = getSuccessfulToolData(toolResults, 'get_focus_bundle');
  if (!isPlainObject(data) || !isPlainObject(data.focus)) {
    return null;
  }
  return data.focus as WorkspaceChatFocusItem;
}

function readSelectionCluster(
  toolResults: WorkspaceChatToolResult[]
): WorkspaceChatCanvasSnapshot | null {
  const data = getSuccessfulToolData(toolResults, 'get_selection_cluster');
  if (!isPlainObject(data) || !isPlainObject(data.cluster)) {
    return null;
  }
  return data.cluster as WorkspaceChatCanvasSnapshot;
}

function readMissingDescriptionIds(
  toolResults: WorkspaceChatToolResult[]
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
  snapshot: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatFocusItem | null {
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
  toolResults: WorkspaceChatToolResult[],
  toolName: string
): unknown {
  const result = toolResults.find((entry) => entry.tool === toolName && entry.ok);
  return result?.data;
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
