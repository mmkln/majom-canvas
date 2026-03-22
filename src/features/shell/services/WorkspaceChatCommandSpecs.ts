import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatElementKind,
  WorkspaceChatIntentKind,
} from '../workspaceChatEvents.ts';
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
  scope: 'single' | 'cluster';
  preferredActionShape: 'suggest_update' | 'suggest_updates';
  allowedElementIds: string[];
  target?: WorkspaceChatFillDetailsTarget;
  targets?: WorkspaceChatFillDetailsTarget[];
  constraints: {
    allowedPatchFields: ['title', 'description'];
    allowTitleParaphraseForDescription: false;
    requireContextBackedDetailForDescription: true;
    forbidReviewFindings: true;
    forbidInventedFacts: string[];
  };
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
    case 'fill_details':
      return FILL_DETAILS_COMMAND_SPEC;
    default:
      return null;
  }
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
      scope: 'single',
      preferredActionShape: 'suggest_update',
      allowedElementIds: targets.map((target) => target.id),
      target: targets[0],
      constraints: {
        allowedPatchFields: ['title', 'description'],
        allowTitleParaphraseForDescription: false,
        requireContextBackedDetailForDescription: true,
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
    scope: 'cluster',
    preferredActionShape: 'suggest_updates',
    allowedElementIds: targets.map((target) => target.id),
    targets,
    constraints: {
      allowedPatchFields: ['title', 'description'],
      allowTitleParaphraseForDescription: false,
      requireContextBackedDetailForDescription: true,
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
    'Do not use internal policy phrasing like "safe paraphrase", "minimal safe update", or "restates the title".',
    'Do not propose a description that only paraphrases the current title.',
    'A description update is valid only when it adds at least one concrete detail supported by parent, child, sibling, or related canvas context.',
    'If you cannot add context-backed detail, ask one concrete follow-up question or clearly say the current context is too thin, and return "actions": [].',
    'When you do return an update, explain what concrete detail you added and what nearby context supports it.',
  ].join('\n');
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
  const actions = Array.isArray(envelope.actions) ? envelope.actions : [];

  for (const action of actions) {
    if (!isPlainObject(action) || typeof action.kind !== 'string') {
      return 'Every action must be a JSON object with a supported kind.';
    }

    if (action.kind === 'suggest_update') {
      const error = validateFillDetailsUpdateEntry(
        action,
        allowedElementIds,
        targetsById
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
          targetsById
        );
        if (error) return error;
      }
      continue;
    }

    return `Unsupported action kind "${action.kind}" for fill_details command.`;
  }

  return null;
}

function validateFillDetailsUpdateEntry(
  value: Record<string, unknown>,
  allowedElementIds: ReadonlySet<string>,
  targetsById: ReadonlyMap<string, WorkspaceChatFillDetailsTarget>
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
      !isContextBackedFillDetailsDescription(description, target)
    ) {
      return 'Fill_details description must add context-backed detail instead of restating the current item.';
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

function collectFillDetailsEvidenceFragments(
  target: WorkspaceChatFillDetailsTarget
): Set<string> {
  const childEvidence = (target.context?.children ?? []).flatMap((item) => [
    item.title,
    item.description,
  ]);
  const siblingEvidence = (target.context?.siblings ?? []).flatMap((item) => [
    item.title,
    item.description,
  ]);
  const relatedEvidence = (target.context?.related ?? []).flatMap((entry) => [
    entry.item.title,
    entry.item.description,
  ]);
  const evidence = [
    target.context?.parent?.title ?? '',
    target.context?.parent?.description ?? '',
    ...childEvidence,
    ...siblingEvidence,
    ...relatedEvidence,
  ].filter((value) => value.trim().length > 0);

  return extractFillDetailsFragments(evidence.join(' '));
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
