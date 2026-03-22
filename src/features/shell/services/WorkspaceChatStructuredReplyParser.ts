import {
  isUiPriority,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';
import type {
  WorkspaceChatCanvasElement,
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatConnectionRelationType,
  WorkspaceChatElementKind,
} from '../workspaceChatEvents.ts';
import {
  getWorkspaceChatActionLabel,
  isWorkspaceChatActionKind,
  isWorkspaceChatActionStatus,
  isWorkspaceChatCreateElementStatus,
  isWorkspaceChatRelationSuggestionType,
  isWorkspaceChatReviewFindingSeverity,
  type WorkspaceChatAction,
  type WorkspaceChatActionGroup,
  type WorkspaceChatActionStatus,
  type WorkspaceChatCreateAction,
  type WorkspaceChatCreateActionKind,
  type WorkspaceChatCreateElementStatus,
  type WorkspaceChatRemoveRelationAction,
  type WorkspaceChatRelationAction,
  type WorkspaceChatRelationSuggestionType,
  type WorkspaceChatUpdateRelationAction,
  type WorkspaceChatReviewFinding,
  type WorkspaceChatReviewFindings,
  type WorkspaceChatStructuredReply,
  type WorkspaceChatUpdateAction,
  type WorkspaceChatUpdatePatch,
} from '../workspaceChatActions.ts';
import {
  isWorkspaceChatStructuredActionEntryKind,
  isWorkspaceChatStructuredReplyEnvelopeLike,
  type WorkspaceChatStructuredCreateBatchEntry,
  type WorkspaceChatStructuredRemoveRelationBatchEntry,
  type WorkspaceChatStructuredRelationBatchEntry,
  type WorkspaceChatStructuredReplyEnvelope,
  type WorkspaceChatStructuredUpdateRelationBatchEntry,
  type WorkspaceChatStructuredUpdateBatchEntry,
} from './WorkspaceChatStructuredTransport.ts';
import { resolveWorkspaceChatActionKindsForIntent } from './WorkspaceChatActionPolicy.ts';
import type { WorkspaceChatIntentKind } from '../workspaceChatEvents.ts';

type ParseWorkspaceChatStructuredReplyOptions = {
  allowActions: boolean;
  validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
  intent?: WorkspaceChatIntentKind;
};

type SanitizeActionOptions = {
  validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
  preserveExecutionState?: boolean;
  group?: WorkspaceChatActionGroup;
};

export function parseWorkspaceChatStructuredReply(
  rawContent: string,
  options: ParseWorkspaceChatStructuredReplyOptions
): WorkspaceChatStructuredReply {
  const normalizedContent = rawContent.trim();
  if (isSystemFallbackMessage(normalizedContent)) {
    return {
      replyMarkdown: normalizedContent,
      actions: [],
    };
  }

  const parsed = tryParseWorkspaceChatStructuredReplyEnvelope(normalizedContent);
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
  const reviewFindings = sanitizeWorkspaceChatReviewFindings(
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
    content === 'Chat is not configured.' ||
    content.startsWith('Chat request failed:')
  );
}

export function sanitizeStoredWorkspaceChatAction(
  value: unknown
): WorkspaceChatAction | null {
  return sanitizeWorkspaceChatAction(value, {
    preserveExecutionState: true,
  });
}

export function sanitizeStoredWorkspaceChatReviewFindings(
  value: unknown
): WorkspaceChatReviewFindings | null {
  return sanitizeWorkspaceChatReviewFindings(value);
}

function normalizeStructuredActions(
  value: unknown,
  options: ParseWorkspaceChatStructuredReplyOptions
): WorkspaceChatAction[] {
  if (!options.allowActions || !Array.isArray(value)) {
    return [];
  }

  const actions: WorkspaceChatAction[] = [];
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
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const entry = value as { kind?: unknown };
  if (!isWorkspaceChatStructuredActionEntryKind(entry.kind)) {
    return [];
  }

  if (entry.kind === 'create_batch_tasks') {
    return normalizeCreateBatchActions('create_task', value, options);
  }
  if (entry.kind === 'create_batch_stories') {
    return normalizeCreateBatchActions('create_story', value, options);
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

  const action = sanitizeWorkspaceChatAction(value, options);
  return action ? [action] : [];
}

function normalizeCreateBatchActions(
  kind: WorkspaceChatCreateActionKind,
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<WorkspaceChatStructuredCreateBatchEntry>;
  const items = Array.isArray(batch.items) ? batch.items : [];
  if (items.length === 0) return [];

  const group = buildActionGroup(
    batch,
    kind === 'create_task' ? 'Task breakdown' : 'Story breakdown'
  );

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const merged = {
        ...(item as Record<string, unknown>),
        kind,
        target:
          (item as { target?: unknown }).target !== undefined
            ? (item as { target?: unknown }).target
            : batch.target,
      };
      return sanitizeWorkspaceChatAction(merged, {
        ...options,
        group,
      });
    })
    .filter((item): item is WorkspaceChatAction => item !== null);
}

function normalizeRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<WorkspaceChatStructuredRelationBatchEntry> & {
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
      sanitizeWorkspaceChatAction(
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
    .filter((item): item is WorkspaceChatAction => item !== null);
}

function normalizeRemoveRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<WorkspaceChatStructuredRemoveRelationBatchEntry> & {
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
      sanitizeWorkspaceChatAction(
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
    .filter((item): item is WorkspaceChatAction => item !== null);
}

function normalizeUpdateBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<WorkspaceChatStructuredUpdateBatchEntry> & {
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
      sanitizeWorkspaceChatAction(
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
    .filter((item): item is WorkspaceChatAction => item !== null);
}

function normalizeUpdateRelationBatchActions(
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction[] {
  if (!value || typeof value !== 'object') return [];
  const batch = value as Partial<WorkspaceChatStructuredUpdateRelationBatchEntry> & {
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
      sanitizeWorkspaceChatAction(
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
    .filter((item): item is WorkspaceChatAction => item !== null);
}

function sanitizeWorkspaceChatAction(
  value: unknown,
  options: SanitizeActionOptions
): WorkspaceChatAction | null {
  if (!value || typeof value !== 'object') return null;
  const action = value as { kind?: unknown };
  if (!isWorkspaceChatActionKind(action.kind)) return null;

  switch (action.kind) {
    case 'create_task':
    case 'create_story':
    case 'create_goal':
      return sanitizeCreateAction(
        value as Partial<WorkspaceChatCreateAction> & { target?: unknown },
        options
      );
    case 'suggest_relation':
      return sanitizeRelationAction(
        value as Partial<WorkspaceChatRelationAction>,
        options,
        'suggest_relation'
      );
    case 'remove_relation':
      return sanitizeRelationAction(
        value as Partial<WorkspaceChatRemoveRelationAction>,
        options,
        'remove_relation'
      );
    case 'update_relation':
      return sanitizeUpdateRelationAction(
        value as Partial<WorkspaceChatUpdateRelationAction>,
        options
      );
    case 'suggest_update':
      return sanitizeUpdateAction(
        value as Partial<WorkspaceChatUpdateAction> & { patch?: unknown },
        options
      );
  }
}

function sanitizeCreateAction(
  action: Partial<WorkspaceChatCreateAction> & { target?: unknown },
  options: SanitizeActionOptions
): WorkspaceChatCreateAction | null {
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
      getWorkspaceChatActionLabel(action.kind),
      title
    ),
    kind: action.kind,
    description: sanitizeText(action.description, 600) ?? undefined,
    priority: priority ?? undefined,
    elementStatus: elementStatus ?? undefined,
    target: target ?? undefined,
  };
}

function sanitizeRelationAction(
  action: Partial<WorkspaceChatRelationAction | WorkspaceChatRemoveRelationAction>,
  options: SanitizeActionOptions,
  kind: 'suggest_relation' | 'remove_relation'
): WorkspaceChatRelationAction | WorkspaceChatRemoveRelationAction | null {
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
      getWorkspaceChatActionLabel(kind),
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
  action: Partial<WorkspaceChatUpdateRelationAction>,
  options: SanitizeActionOptions
): WorkspaceChatUpdateRelationAction | null {
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
      getWorkspaceChatActionLabel('update_relation'),
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
  action: Partial<WorkspaceChatUpdateAction> & { patch?: unknown },
  options: SanitizeActionOptions
): WorkspaceChatUpdateAction | null {
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
      getWorkspaceChatActionLabel('suggest_update'),
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
  WorkspaceChatAction,
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
}): WorkspaceChatActionGroup {
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
): WorkspaceChatActionGroup {
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
  kind: WorkspaceChatCreateActionKind,
  value: unknown,
  validationSnapshot?: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatCreateAction['target'] | undefined | null {
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
  return null;
}

function validateTargetElement(
  validationSnapshot: WorkspaceChatCanvasSnapshot | null | undefined,
  id: string,
  kind: 'story' | 'goal'
): boolean {
  if (!validationSnapshot) return true;
  return validationSnapshot.elements.some(
    (element) => element.id === id && element.kind === kind
  );
}

function getElementById(
  validationSnapshot: WorkspaceChatCanvasSnapshot | null | undefined,
  id: string
): WorkspaceChatCanvasElement | null {
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
): WorkspaceChatCreateElementStatus | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isWorkspaceChatCreateElementStatus(value)) return null;
  return value;
}

function normalizeRelationType(
  value: unknown
): WorkspaceChatRelationSuggestionType | null {
  return isWorkspaceChatRelationSuggestionType(value) ? value : null;
}

function normalizeElementKind(
  value: unknown
): WorkspaceChatElementKind | null {
  return value === 'goal' || value === 'story' || value === 'task'
    ? value
    : null;
}

function normalizeUpdatePatch(value: unknown): WorkspaceChatUpdatePatch | null {
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

  const normalizedPatch: WorkspaceChatUpdatePatch = {};
  if (title) normalizedPatch.title = title;
  if (description) normalizedPatch.description = description;
  if (priority) normalizedPatch.priority = priority;
  if (elementStatus) normalizedPatch.elementStatus = elementStatus;

  return Object.keys(normalizedPatch).length > 0 ? normalizedPatch : null;
}

function sanitizeWorkspaceChatReviewFindings(
  value: unknown
): WorkspaceChatReviewFindings | null {
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
        .map((item) => sanitizeWorkspaceChatReviewFinding(item))
        .filter((item): item is WorkspaceChatReviewFinding => item !== null)
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

function sanitizeWorkspaceChatReviewFinding(
  value: unknown
): WorkspaceChatReviewFinding | null {
  if (!value || typeof value !== 'object') return null;
  const finding = value as {
    id?: unknown;
    severity?: unknown;
    category?: unknown;
    title?: unknown;
    detail?: unknown;
    targetIds?: unknown;
  };
  const severity = isWorkspaceChatReviewFindingSeverity(finding.severity)
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

function normalizeActionStatus(value: unknown): WorkspaceChatActionStatus {
  return isWorkspaceChatActionStatus(value) ? value : 'idle';
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

function createActionId(seed: string): string {
  const normalizedSeed = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `chat-action-${normalizedSeed}-${Math.random().toString(36).slice(2, 10)}`;
}

export function tryParseWorkspaceChatStructuredReplyEnvelope(
  content: string
): WorkspaceChatStructuredReplyEnvelope | null {
  const candidates = [content, extractJsonCodeBlock(content), extractJsonObject(content)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isWorkspaceChatStructuredReplyEnvelopeLike(parsed)) {
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
  actions: WorkspaceChatAction[],
  intent: WorkspaceChatIntentKind | undefined
): WorkspaceChatAction[] {
  const allowedKinds = resolveWorkspaceChatActionKindsForIntent(intent);
  if (!allowedKinds) {
    return actions;
  }
  const allowedSet = new Set(allowedKinds);
  return actions.filter((action) => allowedSet.has(action.kind));
}

function formatRelationTypeLabel(
  relationType: WorkspaceChatConnectionRelationType
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
