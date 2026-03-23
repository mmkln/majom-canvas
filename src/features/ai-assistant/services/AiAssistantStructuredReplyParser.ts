import {
  isUiPriority,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
  AiAssistantConnectionRelationType,
  AiAssistantElementKind,
} from '../aiAssistantEvents.ts';
import {
  getAiAssistantActionLabel,
  isAiAssistantActionKind,
  isAiAssistantActionStatus,
  isAiAssistantCreateElementStatus,
  type AiAssistantGoalBlueprintAction,
  type AiAssistantGoalBlueprintGoal,
  type AiAssistantGoalBlueprintPattern,
  type AiAssistantGoalBlueprintRelation,
  isAiAssistantRelationSuggestionType,
  isAiAssistantReviewFindingSeverity,
  type AiAssistantAction,
  type AiAssistantActionGroup,
  type AiAssistantActionStatus,
  type AiAssistantCreateAction,
  type AiAssistantCreateActionKind,
  type AiAssistantCreateElementStatus,
  type AiAssistantRemoveRelationAction,
  type AiAssistantRelationAction,
  type AiAssistantRelationSuggestionType,
  type AiAssistantUpdateRelationAction,
  type AiAssistantReviewFinding,
  type AiAssistantReviewFindings,
  type AiAssistantStructuredReply,
  type AiAssistantUpdateAction,
  type AiAssistantUpdatePatch,
} from '../aiAssistantActions.ts';
import {
  isAiAssistantStructuredActionEntryKind,
  isAiAssistantStructuredReplyEnvelopeLike,
  type AiAssistantStructuredCreateBatchEntry,
  type AiAssistantStructuredRemoveRelationBatchEntry,
  type AiAssistantStructuredRelationBatchEntry,
  type AiAssistantStructuredReplyEnvelope,
  type AiAssistantStructuredUpdateRelationBatchEntry,
  type AiAssistantStructuredUpdateBatchEntry,
} from './AiAssistantStructuredTransport.ts';
import { resolveAiAssistantActionKindsForIntent } from './AiAssistantActionPolicy.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';

type ParseAiAssistantStructuredReplyOptions = {
  allowActions: boolean;
  validationSnapshot?: AiAssistantCanvasSnapshot | null;
  intent?: AiAssistantIntentKind;
};

type SanitizeActionOptions = {
  validationSnapshot?: AiAssistantCanvasSnapshot | null;
  preserveExecutionState?: boolean;
  group?: AiAssistantActionGroup;
};

export function parseAiAssistantStructuredReply(
  rawContent: string,
  options: ParseAiAssistantStructuredReplyOptions
): AiAssistantStructuredReply {
  const normalizedContent = rawContent.trim();
  if (isSystemFallbackMessage(normalizedContent)) {
    return {
      replyMarkdown: normalizedContent,
      actions: [],
    };
  }

  const parsed = tryParseAiAssistantStructuredReplyEnvelope(normalizedContent);
  if (!parsed) {
    return {
      replyMarkdown: normalizedContent,
      actions: [],
    };
  }

  const parsedReplyMarkdown =
    typeof parsed.replyMarkdown === 'string'
      ? parsed.replyMarkdown.trim()
      : '';
  const actions = filterActionsForIntent(
    normalizeStructuredActions(parsed.actions, options),
    options.intent
  );
  const reviewFindings = sanitizeAiAssistantReviewFindings(
    parsed.reviewFindings
  );
  const fallbackActions =
    actions.length === 0 && !reviewFindings ? [] : [];

  return {
    replyMarkdown: parsedReplyMarkdown,
    actions: actions.length > 0 ? actions : fallbackActions,
    reviewFindings: reviewFindings ?? undefined,
  };
}

function isSystemFallbackMessage(content: string): boolean {
  return (
    content === 'AI Assistant is not configured.' ||
    content.startsWith('AI Assistant request failed:')
  );
}

export function sanitizeStoredAiAssistantAction(
  value: unknown
): AiAssistantAction | null {
  return sanitizeAiAssistantAction(value, {
    preserveExecutionState: true,
  });
}

export function sanitizeStoredAiAssistantReviewFindings(
  value: unknown
): AiAssistantReviewFindings | null {
  return sanitizeAiAssistantReviewFindings(value);
}

function normalizeStructuredActions(
  value: unknown,
  options: ParseAiAssistantStructuredReplyOptions
): AiAssistantAction[] {
  if (!options.allowActions || !Array.isArray(value)) {
    return [];
  }

  const actions: AiAssistantAction[] = [];
  value.forEach((item) => {
    actions.push(
      ...normalizeStructuredActionEntry(item, {
        validationSnapshot: options.validationSnapshot,
      })
    );
  });
  return actions;
}

function normalizeStructuredActionEntry(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const entry = value as { kind?: unknown };
  if (!isAiAssistantStructuredActionEntryKind(entry.kind)) {
    return [];
  }

  if (entry.kind === 'create_batch_tasks') {
    return normalizeCreateBatchActions('create_task', value, options);
  }
  if (entry.kind === 'create_batch_stories') {
    return normalizeCreateBatchActions('create_story', value, options);
  }
  if (entry.kind === 'create_goals') {
    return normalizeCreateBatchActions(
      'create_goal',
      value,
      options,
      'Strategic goals'
    );
  }
  if (entry.kind === 'create_goal_blueprint') {
    const action = sanitizeAiAssistantAction(value, options);
    return action ? [action] : [];
  }
  if (entry.kind === 'suggest_relations') {
    return normalizeRelationBatchActions(value, options);
  }
  if (entry.kind === 'remove_relations') {
    return normalizeRemoveRelationBatchActions(value, options);
  }
  if (entry.kind === 'update_relations') {
    return normalizeUpdateRelationBatchActions(value, options);
  }
  if (entry.kind === 'suggest_updates') {
    return normalizeUpdateBatchActions(value, options);
  }

  const action = sanitizeAiAssistantAction(value, options);
  return action ? [action] : [];
}

function normalizeCreateBatchActions(
  kind: AiAssistantCreateActionKind,
  value: unknown,
  options: SanitizeActionOptions,
  fallbackTitle?: string
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<AiAssistantStructuredCreateBatchEntry> & {
    data?: {
      parentId?: unknown;
      items?: unknown;
      stories?: unknown;
      tasks?: unknown;
      goals?: unknown;
    };
  };
  const legacyParentId =
    batch.data && typeof batch.data.parentId === 'string'
      ? batch.data.parentId
      : undefined;
  const legacyItems =
    batch.data && Array.isArray(batch.data.items)
      ? batch.data.items
      : kind === 'create_story' && batch.data && Array.isArray(batch.data.stories)
        ? batch.data.stories
        : kind === 'create_task' && batch.data && Array.isArray(batch.data.tasks)
          ? batch.data.tasks
          : kind === 'create_goal' && batch.data && Array.isArray(batch.data.goals)
            ? batch.data.goals
            : [];
  const items = Array.isArray(batch.items)
    ? batch.items
    : legacyItems;
  if (items.length === 0) return [];

  const group = buildActionGroup(
    batch,
    fallbackTitle ??
      (kind === 'create_task'
        ? 'Task breakdown'
        : kind === 'create_story'
          ? 'Story breakdown'
          : 'Suggested goals')
  );

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const legacyTarget =
        legacyParentId && kind !== 'create_goal'
          ? {
              kind: kind === 'create_story' ? 'goal' : 'story',
              id: legacyParentId,
            }
          : legacyParentId && kind === 'create_goal'
            ? { kind: 'goal', id: legacyParentId }
            : undefined;
      const merged = {
        ...(item as Record<string, unknown>),
        kind,
        target:
          (item as { target?: unknown }).target !== undefined
            ? (item as { target?: unknown }).target
            : batch.target ?? legacyTarget,
      };
      return sanitizeAiAssistantAction(merged, {
        ...options,
        group,
      });
    })
    .filter((item): item is AiAssistantAction => item !== null);
}

function normalizeRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<AiAssistantStructuredRelationBatchEntry> & {
    items?: unknown;
  };
  const items = Array.isArray(batch.relations)
    ? batch.relations
    : Array.isArray(batch.items)
      ? batch.items
      : [];
  if (items.length === 0) return [];

  const group = buildActionGroup(batch, 'Suggested relations');
  return items
    .map((item) =>
      sanitizeAiAssistantAction(
        {
          ...(item as Record<string, unknown>),
          kind: 'suggest_relation',
        },
        {
          ...options,
          group,
        }
      )
    )
    .filter((item): item is AiAssistantAction => item !== null);
}

function normalizeRemoveRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<AiAssistantStructuredRemoveRelationBatchEntry> & {
    items?: unknown;
  };
  const items = Array.isArray(batch.relations)
    ? batch.relations
    : Array.isArray(batch.items)
      ? batch.items
      : [];
  if (items.length === 0) return [];

  const group = buildActionGroup(batch, 'Relations to remove');
  return items
    .map((item) =>
      sanitizeAiAssistantAction(
        {
          ...(item as Record<string, unknown>),
          kind: 'remove_relation',
        },
        {
          ...options,
          group,
        }
      )
    )
    .filter((item): item is AiAssistantAction => item !== null);
}

function normalizeUpdateBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<AiAssistantStructuredUpdateBatchEntry> & {
    items?: unknown;
  };
  const items = Array.isArray(batch.updates)
    ? batch.updates
    : Array.isArray(batch.items)
      ? batch.items
      : [];
  if (items.length === 0) return [];

  const group = buildActionGroup(batch, 'Suggested refinements');
  return items
    .map((item) =>
      sanitizeAiAssistantAction(
        {
          ...(item as Record<string, unknown>),
          kind: 'suggest_update',
        },
        {
          ...options,
          group,
        }
      )
    )
    .filter((item): item is AiAssistantAction => item !== null);
}

function normalizeUpdateRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<AiAssistantStructuredUpdateRelationBatchEntry> & {
    items?: unknown;
  };
  const items = Array.isArray(batch.relations)
    ? batch.relations
    : Array.isArray(batch.items)
      ? batch.items
      : [];
  if (items.length === 0) return [];

  const group = buildActionGroup(batch, 'Relation type changes');
  return items
    .map((item) =>
      sanitizeAiAssistantAction(
        {
          ...(item as Record<string, unknown>),
          kind: 'update_relation',
        },
        {
          ...options,
          group,
        }
      )
    )
    .filter((item): item is AiAssistantAction => item !== null);
}

function sanitizeAiAssistantAction(
  value: unknown,
  options: SanitizeActionOptions
): AiAssistantAction | null {
  if (!value || typeof value !== 'object') return null;
  const action = value as { kind?: unknown };
  if (!isAiAssistantActionKind(action.kind)) return null;

  switch (action.kind) {
    case 'create_task':
    case 'create_story':
    case 'create_goal':
      return sanitizeCreateAction(
        value as Partial<AiAssistantCreateAction> & { target?: unknown },
        options
      );
    case 'create_goal_blueprint':
      return sanitizeGoalBlueprintAction(
        value as Partial<AiAssistantGoalBlueprintAction>,
        options
      );
    case 'suggest_relation':
      return sanitizeRelationAction(
        value as Partial<AiAssistantRelationAction>,
        options,
        'suggest_relation'
      );
    case 'remove_relation':
      return sanitizeRelationAction(
        value as Partial<AiAssistantRemoveRelationAction>,
        options,
        'remove_relation'
      );
    case 'update_relation':
      return sanitizeUpdateRelationAction(
        value as Partial<AiAssistantUpdateRelationAction>,
        options
      );
    case 'suggest_update':
      return sanitizeUpdateAction(
        value as Partial<AiAssistantUpdateAction> & { patch?: unknown },
        options
      );
  }
}

function sanitizeCreateAction(
  action: Partial<AiAssistantCreateAction> & { target?: unknown },
  options: SanitizeActionOptions
): AiAssistantCreateAction | null {
  const title = sanitizeText(action.title);
  if (!title || !action.kind) return null;

  const priority = normalizePriority(action.priority);
  if (action.priority !== undefined && priority === null) return null;
  const elementStatus = normalizeElementStatus(
    (action as { elementStatus?: unknown }).elementStatus
  );
  if (
    (action as { elementStatus?: unknown }).elementStatus !== undefined &&
    elementStatus === null
  ) {
    return null;
  }

  const target = normalizeTarget(
    action.kind,
    action.target,
    options.validationSnapshot
  );
  if (action.target !== undefined && target === null) return null;

  return {
    ...buildCommonActionFields(
      action,
      options,
      getAiAssistantActionLabel(action.kind),
      title
    ),
    kind: action.kind,
    description: sanitizeText(action.description, 600) ?? undefined,
    priority: priority ?? undefined,
    elementStatus: elementStatus ?? undefined,
    target: target ?? undefined,
  };
}

function sanitizeGoalBlueprintAction(
  action: Partial<AiAssistantGoalBlueprintAction>,
  options: SanitizeActionOptions
): AiAssistantGoalBlueprintAction | null {
  const target = normalizeGoalBlueprintTarget(action.target, options.validationSnapshot);
  if (action.target !== undefined && target === null) {
    return null;
  }

  const pattern = normalizeGoalBlueprintPattern(action.pattern);
  if (!pattern) return null;

  const goals = normalizeGoalBlueprintGoals(action.goals);
  if (!goals || goals.length === 0) return null;

  const relations = normalizeGoalBlueprintRelations(action.relations, goals);
  if (action.relations !== undefined && relations === null) return null;

  const rootTitle =
    resolveGoalBlueprintRoot(goals)?.title ??
    goals[0]?.title ??
    'Strategic plan';
  const title =
    sanitizeText(action.title) ?? `Create plan for "${rootTitle}"`;

  return {
    ...buildCommonActionFields(
      action,
      options,
      getAiAssistantActionLabel('create_goal_blueprint'),
      title
    ),
    kind: 'create_goal_blueprint',
    target: target ?? undefined,
    pattern,
    summary: sanitizeText(action.summary, 600) ?? undefined,
    assumptions: sanitizeTextList(action.assumptions, 8, 160),
    goals,
    relations: relations ?? [],
  };
}

function sanitizeRelationAction(
  action: Partial<AiAssistantRelationAction | AiAssistantRemoveRelationAction>,
  options: SanitizeActionOptions,
  kind: 'suggest_relation' | 'remove_relation'
): AiAssistantRelationAction | AiAssistantRemoveRelationAction | null {
  const relationType = normalizeRelationType(action.relationType);
  if (!relationType) return null;

  const fromId = sanitizeId(action.fromId);
  const toId = sanitizeId(action.toId);
  if (!fromId || !toId || fromId === toId) return null;

  const fromElement = getElementById(options.validationSnapshot, fromId);
  const toElement = getElementById(options.validationSnapshot, toId);
  if (
    options.validationSnapshot &&
    (!fromElement || !toElement || fromElement.id === toElement.id)
  ) {
    return null;
  }

  const fromLabel =
    sanitizeText(action.fromLabel, 160) ?? fromElement?.title ?? undefined;
  const toLabel =
    sanitizeText(action.toLabel, 160) ?? toElement?.title ?? undefined;
  const title =
    sanitizeText(action.title) ??
    `${kind === 'remove_relation' ? 'Remove' : 'Add'} ${formatRelationTypeLabel(relationType)} relation`;

  return {
    ...buildCommonActionFields(
      action,
      options,
      getAiAssistantActionLabel(kind),
      title
    ),
    kind,
    relationType,
    fromId,
    toId,
    fromLabel,
    toLabel,
    reason: sanitizeText(action.reason, 400) ?? undefined,
  };
}

function sanitizeUpdateRelationAction(
  action: Partial<AiAssistantUpdateRelationAction>,
  options: SanitizeActionOptions
): AiAssistantUpdateRelationAction | null {
  const currentRelationType = normalizeRelationType(action.currentRelationType);
  const nextRelationType = normalizeRelationType(action.nextRelationType);
  if (
    !currentRelationType ||
    !nextRelationType ||
    currentRelationType === nextRelationType
  ) {
    return null;
  }

  const fromId = sanitizeId(action.fromId);
  const toId = sanitizeId(action.toId);
  if (!fromId || !toId || fromId === toId) return null;

  const fromElement = getElementById(options.validationSnapshot, fromId);
  const toElement = getElementById(options.validationSnapshot, toId);
  if (
    options.validationSnapshot &&
    (!fromElement || !toElement || fromElement.id === toElement.id)
  ) {
    return null;
  }

  const fromLabel =
    sanitizeText(action.fromLabel, 160) ?? fromElement?.title ?? undefined;
  const toLabel =
    sanitizeText(action.toLabel, 160) ?? toElement?.title ?? undefined;
  const title =
    sanitizeText(action.title) ??
    `Change ${formatRelationTypeLabel(currentRelationType)} relation to ${formatRelationTypeLabel(nextRelationType)}`;

  return {
    ...buildCommonActionFields(
      action,
      options,
      getAiAssistantActionLabel('update_relation'),
      title
    ),
    kind: 'update_relation',
    fromId,
    toId,
    fromLabel,
    toLabel,
    currentRelationType,
    nextRelationType,
    reason: sanitizeText(action.reason, 400) ?? undefined,
  };
}

function sanitizeUpdateAction(
  action: Partial<AiAssistantUpdateAction> & { patch?: unknown },
  options: SanitizeActionOptions
): AiAssistantUpdateAction | null {
  const elementId = sanitizeId(action.elementId);
  if (!elementId) return null;

  const targetElement = getElementById(options.validationSnapshot, elementId);
  if (options.validationSnapshot && !targetElement) return null;

  const elementKind =
    normalizeElementKind(action.elementKind) ?? targetElement?.kind ?? null;
  if (!elementKind) return null;

  const patch = normalizeUpdatePatch(action.patch);
  if (!patch) return null;

  const targetTitle =
    sanitizeText(action.targetTitle, 160) ?? targetElement?.title ?? undefined;
  const title =
    sanitizeText(action.title) ??
    `Update ${capitalize(elementKind)} "${targetTitle || 'Untitled'}"`;

  return {
    ...buildCommonActionFields(
      action,
      options,
      getAiAssistantActionLabel('suggest_update'),
      title
    ),
    kind: 'suggest_update',
    elementId,
    elementKind,
    targetTitle,
    patch,
    reason: sanitizeText(action.reason, 400) ?? undefined,
  };
}

function buildCommonActionFields(
  value: {
    id?: unknown;
    status?: unknown;
    errorMessage?: unknown;
    createdElementId?: unknown;
    affectedElementIds?: unknown;
    groupId?: unknown;
    groupTitle?: unknown;
    groupSummary?: unknown;
  },
  options: SanitizeActionOptions,
  defaultLabel: string,
  title: string
): Pick<
  AiAssistantAction,
  | 'id'
  | 'label'
  | 'title'
  | 'status'
  | 'errorMessage'
  | 'createdElementId'
  | 'affectedElementIds'
  | 'groupId'
  | 'groupTitle'
  | 'groupSummary'
> {
  const sanitizedGroup = sanitizeActionGroup(value);
  const group = {
    groupId: sanitizedGroup.groupId ?? options.group?.groupId,
    groupTitle: sanitizedGroup.groupTitle ?? options.group?.groupTitle,
    groupSummary: sanitizedGroup.groupSummary ?? options.group?.groupSummary,
  };
  return {
    id: sanitizeId(value.id) ?? createActionId(defaultLabel),
    label: sanitizeText((value as { label?: unknown }).label, 60) ?? defaultLabel,
    title,
    status: options.preserveExecutionState
      ? normalizeActionStatus(value.status)
      : 'idle',
    errorMessage: options.preserveExecutionState
      ? sanitizeText(value.errorMessage, 300) ?? undefined
      : undefined,
    createdElementId: options.preserveExecutionState
      ? sanitizeId(value.createdElementId) ?? undefined
      : undefined,
    affectedElementIds: options.preserveExecutionState
      ? sanitizeStringList(value.affectedElementIds)
      : undefined,
    groupId: group.groupId,
    groupTitle: group.groupTitle,
    groupSummary: group.groupSummary,
  };
}

function sanitizeActionGroup(value: {
  groupId?: unknown;
  groupTitle?: unknown;
  groupSummary?: unknown;
}): AiAssistantActionGroup {
  return {
    groupId: sanitizeId(value.groupId) ?? undefined,
    groupTitle: sanitizeText(value.groupTitle, 160) ?? undefined,
    groupSummary: sanitizeText(value.groupSummary, 400) ?? undefined,
  };
}

function buildActionGroup(
  value: {
    title?: unknown;
    summary?: unknown;
    description?: unknown;
  },
  fallbackTitle: string
): AiAssistantActionGroup {
  const groupId = `chat-group-${Math.random().toString(36).slice(2, 10)}`;
  const groupTitle =
    sanitizeText(value.title, 160) ??
    sanitizeText((value as { groupTitle?: unknown }).groupTitle, 160) ??
    fallbackTitle;
  const groupSummary =
    sanitizeText(value.summary, 400) ??
    sanitizeText(value.description, 400) ??
    undefined;

  return {
    groupId,
    groupTitle,
    groupSummary,
  };
}

function normalizeTarget(
  kind: AiAssistantCreateActionKind,
  value: unknown,
  validationSnapshot?: AiAssistantCanvasSnapshot | null
): AiAssistantCreateAction['target'] | undefined | null {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object') return null;
  const target = value as { kind?: unknown; id?: unknown };
  if (target.kind === 'canvas') {
    return { kind: 'canvas' };
  }

  const id = sanitizeId(target.id);
  if (!id) return null;

  if (kind === 'create_task' && target.kind === 'story') {
    if (!validateTargetElement(validationSnapshot, id, 'story')) return null;
    return { kind: 'story', id };
  }
  if (kind === 'create_story' && target.kind === 'goal') {
    if (!validateTargetElement(validationSnapshot, id, 'goal')) return null;
    return { kind: 'goal', id };
  }
  if (kind === 'create_goal' && target.kind === 'goal') {
    if (!validateTargetElement(validationSnapshot, id, 'goal')) return null;
    return { kind: 'goal', id };
  }
  return null;
}

function normalizeGoalBlueprintTarget(
  value: unknown,
  validationSnapshot?: AiAssistantCanvasSnapshot | null
): AiAssistantGoalBlueprintAction['target'] | undefined | null {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object') return null;
  const target = value as { kind?: unknown; id?: unknown };
  if (target.kind === 'canvas') {
    return { kind: 'canvas' };
  }
  const id = sanitizeId(target.id);
  if (!id || target.kind !== 'goal') {
    return null;
  }
  if (!validateTargetElement(validationSnapshot, id, 'goal')) {
    return null;
  }
  return { kind: 'goal', id };
}

function validateTargetElement(
  validationSnapshot: AiAssistantCanvasSnapshot | null | undefined,
  id: string,
  kind: 'story' | 'goal'
): boolean {
  if (!validationSnapshot) return true;
  return validationSnapshot.elements.some(
    (element) => element.id === id && element.kind === kind
  );
}

function getElementById(
  validationSnapshot: AiAssistantCanvasSnapshot | null | undefined,
  id: string
): AiAssistantCanvasElement | null {
  if (!validationSnapshot) return null;
  return (
    validationSnapshot.elements.find((element) => element.id === id) ?? null
  );
}

function normalizePriority(value: unknown): UiPriority | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isUiPriority(value)) return null;
  return value;
}

function normalizeElementStatus(
  value: unknown
): AiAssistantCreateElementStatus | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isAiAssistantCreateElementStatus(value)) return null;
  return value;
}

function normalizeRelationType(
  value: unknown
): AiAssistantRelationSuggestionType | null {
  return isAiAssistantRelationSuggestionType(value) ? value : null;
}

function normalizeElementKind(
  value: unknown
): AiAssistantElementKind | null {
  return value === 'goal' || value === 'story' || value === 'task'
    ? value
    : null;
}

function normalizeGoalBlueprintPattern(
  value: unknown
): AiAssistantGoalBlueprintPattern | null {
  return value === 'goal_tree' ||
    value === 'goal_tree_with_sequence' ||
    value === 'goal_graph'
    ? value
    : null;
}

function normalizeGoalBlueprintGoals(
  value: unknown
): AiAssistantGoalBlueprintGoal[] | null {
  if (!Array.isArray(value)) return null;
  const goals = value
    .map((item) => sanitizeGoalBlueprintGoal(item))
    .filter((item): item is AiAssistantGoalBlueprintGoal => item !== null);
  if (goals.length === 0) return null;

  const refs = new Set<string>();
  for (const goal of goals) {
    if (refs.has(goal.ref)) {
      return null;
    }
    refs.add(goal.ref);
  }
  return goals;
}

function sanitizeGoalBlueprintGoal(
  value: unknown
): AiAssistantGoalBlueprintGoal | null {
  if (!value || typeof value !== 'object') return null;
  const goal = value as Partial<AiAssistantGoalBlueprintGoal>;
  const ref = sanitizeId(goal.ref);
  const title = sanitizeText(goal.title);
  if (!ref || !title) return null;

  const priority = normalizePriority(goal.priority);
  if (goal.priority !== undefined && priority === null) return null;
  const elementStatus = normalizeElementStatus(goal.elementStatus);
  if (goal.elementStatus !== undefined && elementStatus === null) return null;

  return {
    ref,
    title,
    description: sanitizeText(goal.description, 600) ?? undefined,
    priority: priority ?? undefined,
    elementStatus: elementStatus ?? undefined,
    parentRef: sanitizeId(goal.parentRef) ?? undefined,
  };
}

function normalizeGoalBlueprintRelations(
  value: unknown,
  goals: AiAssistantGoalBlueprintGoal[]
): AiAssistantGoalBlueprintRelation[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const goalRefs = new Set(goals.map((goal) => goal.ref));
  const relations = value
    .map((item) => sanitizeGoalBlueprintRelation(item, goalRefs))
    .filter((item): item is AiAssistantGoalBlueprintRelation => item !== null);
  return relations.length === value.length ? relations : null;
}

function sanitizeGoalBlueprintRelation(
  value: unknown,
  goalRefs: Set<string>
): AiAssistantGoalBlueprintRelation | null {
  if (!value || typeof value !== 'object') return null;
  const relation = value as Partial<AiAssistantGoalBlueprintRelation>;
  const fromRef = sanitizeId(relation.fromRef);
  const toRef = sanitizeId(relation.toRef);
  if (
    !fromRef ||
    !toRef ||
    fromRef === toRef ||
    !goalRefs.has(fromRef) ||
    !goalRefs.has(toRef) ||
    relation.relationType !== 'leads_to'
  ) {
    return null;
  }
  return {
    fromRef,
    toRef,
    relationType: 'leads_to',
    reason: sanitizeText(relation.reason, 400) ?? undefined,
  };
}

function resolveGoalBlueprintRoot(
  goals: AiAssistantGoalBlueprintGoal[]
): AiAssistantGoalBlueprintGoal | null {
  return goals.find((goal) => !goal.parentRef) ?? null;
}

function normalizeUpdatePatch(value: unknown): AiAssistantUpdatePatch | null {
  if (!value || typeof value !== 'object') return null;
  const patch = value as {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    elementStatus?: unknown;
  };

  const title = sanitizeText(patch.title, 200);
  if (patch.title !== undefined && title === null) return null;
  const description = sanitizeText(patch.description, 600);
  if (patch.description !== undefined && description === null) return null;
  const priority = normalizePriority(patch.priority);
  if (patch.priority !== undefined && priority === null) return null;
  const elementStatus = normalizeElementStatus(patch.elementStatus);
  if (patch.elementStatus !== undefined && elementStatus === null) return null;

  const normalizedPatch: AiAssistantUpdatePatch = {};
  if (title) normalizedPatch.title = title;
  if (description) normalizedPatch.description = description;
  if (priority) normalizedPatch.priority = priority;
  if (elementStatus) normalizedPatch.elementStatus = elementStatus;

  return Object.keys(normalizedPatch).length > 0 ? normalizedPatch : null;
}

function sanitizeAiAssistantReviewFindings(
  value: unknown
): AiAssistantReviewFindings | null {
  if (!value || typeof value !== 'object') return null;
  const review = value as {
    title?: unknown;
    summary?: unknown;
    readinessScore?: unknown;
    readinessVerdict?: unknown;
    findings?: unknown;
  };

  const findings = Array.isArray(review.findings)
    ? review.findings
        .map((item) => sanitizeAiAssistantReviewFinding(item))
        .filter((item): item is AiAssistantReviewFinding => item !== null)
    : [];
  if (findings.length === 0) return null;

  const title =
    sanitizeText(review.title, 160) ?? 'Planning review';
  const readinessScore = normalizeReadinessScore(review.readinessScore);
  const readinessVerdict =
    sanitizeText(review.readinessVerdict, 120) ?? undefined;

  return {
    title,
    summary: sanitizeText(review.summary, 400) ?? undefined,
    readinessScore: readinessScore ?? undefined,
    readinessVerdict,
    findings,
  };
}

function sanitizeAiAssistantReviewFinding(
  value: unknown
): AiAssistantReviewFinding | null {
  if (!value || typeof value !== 'object') return null;
  const finding = value as {
    id?: unknown;
    severity?: unknown;
    category?: unknown;
    title?: unknown;
    detail?: unknown;
    targetIds?: unknown;
  };
  const severity = isAiAssistantReviewFindingSeverity(finding.severity)
    ? finding.severity
    : null;
  const title = sanitizeText(finding.title, 180);
  const detail = sanitizeText(finding.detail, 500);
  const category = sanitizeText(finding.category, 80);
  if (!severity || !title || !detail || !category) return null;

  return {
    id:
      sanitizeId(finding.id) ??
      `chat-review-finding-${Math.random().toString(36).slice(2, 10)}`,
    severity,
    category,
    title,
    detail,
    targetIds: sanitizeStringList(finding.targetIds),
  };
}

function normalizeReadinessScore(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return clamped;
}

function normalizeActionStatus(value: unknown): AiAssistantActionStatus {
  return isAiAssistantActionStatus(value) ? value : 'idle';
}

function sanitizeText(value: unknown, maxLength = 200): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  return normalized.slice(0, maxLength);
}

function sanitizeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => sanitizeId(item))
    .filter((item): item is string => item !== null);
  return items.length > 0 ? items : undefined;
}

function sanitizeTextList(
  value: unknown,
  maxItems: number,
  maxLength = 200
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => sanitizeText(item, maxLength))
    .filter((item): item is string => item !== null)
    .slice(0, maxItems);
  return items.length > 0 ? items : undefined;
}

function createActionId(seed: string): string {
  const normalizedSeed = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `chat-action-${normalizedSeed}-${Math.random().toString(36).slice(2, 10)}`;
}

export function tryParseAiAssistantStructuredReplyEnvelope(
  content: string
): AiAssistantStructuredReplyEnvelope | null {
  const candidates = [content, extractJsonCodeBlock(content), extractJsonObject(content)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isAiAssistantStructuredReplyEnvelopeLike(parsed)) {
        return parsed;
      }
    } catch {
      // ignore and try next candidate
    }
  }
  return null;
}

function extractJsonCodeBlock(content: string): string | null {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() || null;
}

function extractJsonObject(content: string): string | null {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return content.slice(start, end + 1).trim();
}

function filterActionsForIntent(
  actions: AiAssistantAction[],
  intent: AiAssistantIntentKind | undefined
): AiAssistantAction[] {
  const allowedKinds = resolveAiAssistantActionKindsForIntent(intent);
  if (!allowedKinds) {
    return actions;
  }
  const allowedSet = new Set(allowedKinds);
  return actions.filter((action) => allowedSet.has(action.kind));
}

function formatRelationTypeLabel(
  relationType: AiAssistantConnectionRelationType
): string {
  switch (relationType) {
    case 'blocks':
      return 'blocking';
    case 'leads_to':
      return 'sequence';
    case 'relates_to':
    default:
      return 'related';
  }
}

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}
