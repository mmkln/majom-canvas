import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type { IconName } from '../../../ui-lib/src/hud/icons.ts';
import type { I18nService } from '../../../i18n/index.ts';
import { getAiAssistantSelectedItems } from '../services/AiAssistantContent.ts';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantElementKind,
} from '../aiAssistantEvents.ts';
import type {
  AiAssistantAction,
  AiAssistantCreateElementStatus,
  AiAssistantGoalBlueprintPattern,
  AiAssistantRelationSuggestionType,
  AiAssistantReviewFindings,
  AiAssistantReviewFindingSeverity,
  AiAssistantActionStatus,
} from '../aiAssistantActions.ts';
import {
  getAiAssistantActionGroupButtonLabel,
  getAiAssistantActionLabel,
} from '../aiAssistantActions.ts';

export type AiAssistantBadgeTone = {
  background: string;
  color: string;
  border: string;
};

export type AiAssistantActionTagModel = {
  text: string;
  tone: AiAssistantBadgeTone;
  icon?: IconName;
  iconColor?: string;
  iconOnly?: boolean;
  title?: string;
};

export type AiAssistantActionRenderGroup = {
  groupId: string | null;
  actions: AiAssistantAction[];
};

export type AiAssistantActionChangeEntry = {
  label: string;
  value: string;
};

export type AiAssistantActionEntityItem = {
  title: string;
  description?: string;
  meta?: string[];
};

export type AiAssistantActionHierarchyItem = {
  title: string;
  description?: string;
  depth: number;
  meta?: string[];
};

type AiAssistantActionCardBaseModel = {
  eyebrow: string;
  title: string;
  meta: string | null;
  chips: AiAssistantActionTagModel[];
  summary: string | null;
  rationale: string | null;
  provenance: string | null;
  error: string | null;
};

export type AiAssistantAtomicCreateCardModel = AiAssistantActionCardBaseModel & {
  family: 'atomic-create';
};

export type AiAssistantRelationCardModel = AiAssistantActionCardBaseModel & {
  family: 'relation';
};

export type AiAssistantUpdateCardModel = AiAssistantActionCardBaseModel & {
  family: 'update';
  changes: AiAssistantActionChangeEntry[];
};

export type AiAssistantCreateGoalsCardModel = AiAssistantActionCardBaseModel & {
  family: 'create-goals';
  items: AiAssistantActionEntityItem[];
};

export type AiAssistantBlueprintCardModel = AiAssistantActionCardBaseModel & {
  family: 'blueprint';
  goals: AiAssistantActionHierarchyItem[];
  sequence: string[];
  assumptions: string[];
};

export type AiAssistantActionCardModel =
  | AiAssistantAtomicCreateCardModel
  | AiAssistantRelationCardModel
  | AiAssistantUpdateCardModel
  | AiAssistantCreateGoalsCardModel
  | AiAssistantBlueprintCardModel;

export type AiAssistantActionButtonModel = {
  label: string;
  tone: 'primary' | 'quiet';
  disabled: boolean;
  dimmed: boolean;
};

export type AiAssistantActionEntryModel = {
  actionId: string;
  status: AiAssistantActionStatus;
  card: AiAssistantActionCardModel;
  button: AiAssistantActionButtonModel;
};

export type AiAssistantActionGroupHeaderModel = {
  eyebrow: string;
  summary: string | null;
};

export type AiAssistantActionGroupFooterModel = {
  actionIds: string[];
  button: AiAssistantActionButtonModel;
};

export type AiAssistantGroupedActionCardModel = {
  header: AiAssistantActionGroupHeaderModel;
  entries: AiAssistantActionEntryModel[];
  footer: AiAssistantActionGroupFooterModel | null;
};

type AiAssistantRenderI18n = Pick<I18nService, 't'>;

export function groupAiAssistantActionsForRender(
  actions: AiAssistantAction[]
): AiAssistantActionRenderGroup[] {
  const groups: AiAssistantActionRenderGroup[] = [];
  actions.forEach((action) => {
    const groupId = action.groupId ?? null;
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.groupId === groupId) {
      lastGroup.actions.push(action);
      return;
    }
    groups.push({
      groupId,
      actions: [action],
    });
  });
  return groups;
}

export function getAiAssistantActionButtonLabel(
  action: AiAssistantAction,
  i18n?: AiAssistantRenderI18n
): string {
  if (action.kind === 'create_goal_blueprint') {
    if (action.status === 'applied') {
      return i18n?.t('aiChat.actionButton.created') ?? 'Created';
    }
    if (action.status === 'applying') {
      return i18n?.t('aiChat.actionButton.creating') ?? 'Creating...';
    }
    if (action.status === 'failed') {
      return i18n?.t('common.retry') ?? 'Retry';
    }
    return i18n?.t('aiChat.actionLabel.createPlan') ?? 'Create plan';
  }
  if (action.kind === 'create_goals') {
    if (action.status === 'applied') {
      return i18n?.t('aiChat.actionButton.created') ?? 'Created';
    }
    if (action.status === 'applying') {
      return i18n?.t('aiChat.actionButton.creating') ?? 'Creating...';
    }
    if (action.status === 'failed') {
      return i18n?.t('common.retry') ?? 'Retry';
    }
    return i18n?.t('aiChat.actionButton.createAll') ?? 'Create all';
  }

  const isApplyAction =
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation' ||
    action.kind === 'update_relation' ||
    action.kind === 'suggest_update';
  if (action.status === 'applied') {
    return isApplyAction
      ? i18n?.t('aiChat.actionButton.applied') ?? 'Applied'
      : i18n?.t('aiChat.actionButton.created') ?? 'Created';
  }
  if (action.status === 'applying') {
    return isApplyAction
      ? i18n?.t('aiChat.actionButton.applying') ?? 'Applying...'
      : i18n?.t('aiChat.actionButton.creating') ?? 'Creating...';
  }
  if (action.status === 'failed') {
    return i18n?.t('common.retry') ?? 'Retry';
  }
  return isApplyAction
    ? i18n?.t('aiChat.actionButton.apply') ?? 'Apply'
    : i18n?.t('common.create') ?? 'Create';
}

export function buildAiAssistantActionButtonModel(
  action: AiAssistantAction,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionButtonModel {
  const disabled =
    action.status === 'applied' || action.status === 'applying';
  return {
    label: getAiAssistantActionButtonLabel(action, i18n),
    tone: disabled ? 'quiet' : 'primary',
    disabled,
    dimmed: action.status === 'applying',
  };
}

export function buildAiAssistantActionCardModel(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionCardModel {
  const base = buildAiAssistantActionCardBaseModel(
    action,
    context,
    contextEnabled,
    i18n
  );

  switch (action.kind) {
    case 'suggest_update':
      return {
        ...base,
        family: 'update',
        changes: buildAiAssistantUpdateChanges(action, i18n),
      };
    case 'create_goals':
      return {
        ...base,
        family: 'create-goals',
        items: buildAiAssistantCreateGoalsItems(action, i18n),
      };
    case 'create_goal_blueprint':
      return {
        ...base,
        family: 'blueprint',
        goals: buildGoalBlueprintHierarchyItems(action, i18n),
        sequence: buildAiAssistantBlueprintSequence(action),
        assumptions: Array.isArray(action.assumptions) ? action.assumptions : [],
      };
    case 'suggest_relation':
    case 'remove_relation':
    case 'update_relation':
      return {
        ...base,
        family: 'relation',
      };
    case 'create_task':
    case 'create_story':
    case 'create_goal':
    default:
      return {
        ...base,
        family: 'atomic-create',
      };
  }
}

function buildAiAssistantActionCardBaseModel(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionCardBaseModel {
  return {
    eyebrow: getAiAssistantActionLabel(action.kind, i18n),
    title: action.title,
    meta: getAiAssistantActionMeta(action, context, contextEnabled, i18n),
    chips: buildAiAssistantActionTagModels(action, i18n),
    summary: getAiAssistantActionSummary(action),
    rationale: getAiAssistantActionReason(action),
    provenance: getAiAssistantActionProvenance(action, i18n),
    error: action.status === 'failed' ? action.errorMessage ?? null : null,
  };
}

export function buildAiAssistantActionEntryModel(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionEntryModel {
  return {
    actionId: action.id,
    status: action.status,
    card: buildAiAssistantActionCardModel(action, context, contextEnabled, i18n),
    button: buildAiAssistantActionButtonModel(action, i18n),
  };
}

export function buildAiAssistantGroupedActionCardModel(
  actions: AiAssistantAction[],
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): AiAssistantGroupedActionCardModel {
  const group = actions[0];
  if (!group) {
    throw new Error('Grouped action card requires at least one action.');
  }

  const actionableActionIds = actions
    .filter(
      (action) => action.status !== 'applied' && action.status !== 'applying'
    )
    .map((action) => action.id);

  return {
    header: {
      eyebrow: getAiAssistantGroupedActionEyebrow(actions, i18n),
      summary: group.groupSummary ?? null,
    },
    entries: actions.map((action) =>
      buildAiAssistantActionEntryModel(action, context, contextEnabled, i18n)
    ),
    footer:
      actionableActionIds.length > 1
        ? {
            actionIds: actionableActionIds,
            button: {
              label: getAiAssistantActionGroupButtonLabel(actions, {}, i18n),
              tone: 'primary',
              disabled: false,
              dimmed: false,
            },
          }
        : null,
  };
}

export function buildAiAssistantActionTagModels(
  action: AiAssistantAction,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionTagModel[] {
  const tags: AiAssistantActionTagModel[] = [];

  if (
    'priority' in action &&
    action.priority
  ) {
    const priorityLabel = formatAiAssistantPriorityLabel(action.priority, i18n);
    tags.push({
      text: priorityLabel,
      tone: getAiAssistantPriorityBadgeTone(action.priority),
      icon: getAiAssistantPriorityIcon(action.priority),
      iconColor: getAiAssistantPriorityIconColor(action.priority),
      iconOnly: true,
      title:
        i18n?.t('aiChat.priorityBadgeTitle', { label: priorityLabel }) ??
        `${priorityLabel} priority`,
    });
  }

  if (
    'elementStatus' in action &&
    action.elementStatus &&
    shouldDisplayAiAssistantElementStatus(action.elementStatus)
  ) {
    tags.push({
      text: formatAiAssistantElementStatus(action.elementStatus, i18n),
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  if (
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation'
  ) {
    tags.push({
      text: formatAiAssistantRelationTypeLabel(action.relationType, i18n),
      tone: {
        background:
          action.kind === 'remove_relation'
            ? 'rgba(254, 242, 242, 0.48)'
            : 'rgba(238, 242, 255, 0.48)',
        color: action.kind === 'remove_relation' ? '#b05a5a' : '#646bb8',
        border:
          action.kind === 'remove_relation'
            ? 'rgba(254, 205, 211, 0.42)'
            : 'rgba(199, 210, 254, 0.42)',
      },
    });
  }

  if (action.kind === 'update_relation') {
    tags.push({
      text: `${formatAiAssistantRelationTypeLabel(action.currentRelationType, i18n)} → ${formatAiAssistantRelationTypeLabel(action.nextRelationType, i18n)}`,
      tone: {
        background: 'rgba(255, 247, 237, 0.52)',
        color: '#a36c2f',
        border: 'rgba(254, 215, 170, 0.44)',
      },
    });
  }

  if (action.kind === 'create_goal_blueprint') {
    tags.push({
      text: formatAiAssistantGoalBlueprintPatternLabel(action.pattern, i18n),
      tone: {
        background: 'rgba(238, 242, 255, 0.48)',
        color: '#646bb8',
        border: 'rgba(199, 210, 254, 0.42)',
      },
    });
  }

  return tags;
}

export function getAiAssistantActionSecondaryText(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): string {
  if (
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation' ||
    action.kind === 'update_relation'
  ) {
    const from = action.fromLabel || action.fromId;
    const to = action.toLabel || action.toId;
    return `${from} → ${to}`;
  }
  if (action.kind === 'suggest_update') {
    return `${formatAiAssistantElementKindLabel(action.elementKind, i18n)}: ${action.targetTitle || action.elementId}`;
  }
  return getAiAssistantActionTargetPreview(action, context, contextEnabled, i18n);
}

function getAiAssistantActionMeta(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): string | null {
  if (action.kind === 'create_task' || action.kind === 'create_story') {
    return null;
  }
  const meta = getAiAssistantActionSecondaryText(
    action,
    context,
    contextEnabled,
    i18n
  );
  const onCanvas = i18n?.t('aiChat.target.onCanvas') ?? 'On canvas';
  const goal = i18n?.t('aiChat.kind.goal') ?? 'Goal';
  if (
    meta === onCanvas &&
    (action.kind === 'create_goal' ||
      action.kind === 'create_goals' ||
      action.kind === 'create_goal_blueprint')
  ) {
    return null;
  }
  if (action.kind === 'create_goal_blueprint' && meta === goal) {
    return null;
  }
  return meta;
}

export function getAiAssistantActionTargetPreview(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean,
  i18n?: AiAssistantRenderI18n
): string {
  const target = 'target' in action ? action.target : undefined;

  if (target?.kind === 'story') {
    const targetElement = context?.elements.find(
      (item) => item.id === target.id
    );
    const label = i18n?.t('aiChat.kind.story') ?? 'Story';
    return targetElement?.title ? `${label}: ${targetElement.title}` : label;
  }
  if (target?.kind === 'goal') {
    const targetElement = context?.elements.find(
      (item) => item.id === target.id
    );
    const label = i18n?.t('aiChat.kind.goal') ?? 'Goal';
    return targetElement?.title ? `${label}: ${targetElement.title}` : label;
  }
  if (contextEnabled && context) {
    const selection = getAiAssistantSelectedItems(context);
    if (
      action.kind === 'create_task' &&
      selection.length === 1 &&
      selection[0]?.kind === 'story'
    ) {
      return i18n?.t('aiChat.target.selectedStory') ?? 'Selected story';
    }
    if (
      action.kind === 'create_story' &&
      selection.length === 1 &&
      selection[0]?.kind === 'goal'
    ) {
      return i18n?.t('aiChat.target.selectedGoal') ?? 'Selected goal';
    }
  }
  return i18n?.t('aiChat.target.onCanvas') ?? 'On canvas';
}

export function getAiAssistantActionReason(
  action: AiAssistantAction
): string | null {
  if (
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation' ||
    action.kind === 'update_relation'
  ) {
    return action.reason ?? null;
  }
  if (action.kind === 'suggest_update') {
    return action.reason ?? null;
  }
  return null;
}

function buildAiAssistantUpdateChanges(
  action: Extract<AiAssistantAction, { kind: 'suggest_update' }>,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionChangeEntry[] {
  return Object.entries(action.patch)
    .map(([key, value]) => {
      if (value === undefined) {
        return null;
      }

      switch (key) {
        case 'title':
          return {
            label: i18n?.t('aiChat.field.title') ?? 'Title',
            value: String(value),
          };
        case 'description':
          return {
            label: i18n?.t('aiChat.field.description') ?? 'Description',
            value: String(value),
          };
        case 'priority':
          return {
            label: i18n?.t('aiChat.field.priority') ?? 'Priority',
            value: formatAiAssistantPriorityLabel(value as UiPriority, i18n),
          };
        case 'elementStatus':
          return {
            label: i18n?.t('aiChat.field.status') ?? 'Status',
            value: formatAiAssistantElementStatus(
              value as AiAssistantCreateElementStatus,
              i18n
            ),
          };
        default:
          return null;
      }
    })
    .filter((entry): entry is AiAssistantActionChangeEntry => entry !== null);
}

function buildAiAssistantCreateGoalsItems(
  action: Extract<AiAssistantAction, { kind: 'create_goals' }>,
  i18n?: AiAssistantRenderI18n
): AiAssistantActionEntityItem[] {
  return action.items.map((item) => ({
    title: item.title,
    description: item.description,
    meta: [
      item.priority
        ? shouldDisplayAiAssistantPriority(item.priority)
          ? formatAiAssistantPriorityLabel(item.priority, i18n)
          : null
        : null,
      item.elementStatus
        ? shouldDisplayAiAssistantElementStatus(item.elementStatus)
          ? formatAiAssistantElementStatus(item.elementStatus, i18n)
          : null
        : null,
    ].filter((part): part is string => part !== null),
  }));
}

function buildAiAssistantBlueprintSequence(
  action: Extract<AiAssistantAction, { kind: 'create_goal_blueprint' }>
): string[] {
  if (action.relations.length === 0) {
    return [];
  }

  const goalsByRef = new Map(action.goals.map((goal) => [goal.ref, goal]));
  return action.relations.map((relation) => {
    const from = goalsByRef.get(relation.fromRef)?.title ?? relation.fromRef;
    const to = goalsByRef.get(relation.toRef)?.title ?? relation.toRef;
    return `${from} → ${to}`;
  });
}

function getAiAssistantActionSummary(action: AiAssistantAction): string | null {
  if ('description' in action && action.description) {
    return action.description;
  }
  if (action.kind === 'create_goal_blueprint') {
    return action.summary ?? null;
  }
  return null;
}

function getAiAssistantActionProvenance(
  action: AiAssistantAction,
  i18n?: AiAssistantRenderI18n
): string | null {
  const parts: string[] = [];

  if (action.supportedBy && action.supportedBy.length > 0) {
    parts.push(
      i18n?.t('aiChat.provenance.supportingItems', {
        count: action.supportedBy.length,
      }) ??
        `${action.supportedBy.length} supporting item${action.supportedBy.length === 1 ? '' : 's'}`
    );
  }

  if (action.evidenceIds && action.evidenceIds.length > 0) {
    parts.push(
      i18n?.t('aiChat.provenance.evidenceItems', {
        count: action.evidenceIds.length,
      }) ??
        `${action.evidenceIds.length} evidence item${action.evidenceIds.length === 1 ? '' : 's'}`
    );
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function buildGoalBlueprintHierarchyItems(
  action: Extract<AiAssistantAction, { kind: 'create_goal_blueprint' }>,
  i18n?: AiAssistantRenderI18n
): Array<{
  title: string;
  description?: string;
  depth: number;
  meta?: string[];
}> {
  const goalMetaByRef = new Map(
    action.goals.map((goal) => [
      goal.ref,
      [
        goal.priority
          ? shouldDisplayAiAssistantPriority(goal.priority)
            ? formatAiAssistantPriorityLabel(goal.priority, i18n)
            : null
          : null,
        goal.elementStatus
          ? shouldDisplayAiAssistantElementStatus(goal.elementStatus)
            ? formatAiAssistantElementStatus(goal.elementStatus, i18n)
            : null
          : null,
      ].filter((part): part is string => part !== null),
    ])
  );
  const allGoalMetaTexts = action.goals.map((goal) =>
    (goalMetaByRef.get(goal.ref) ?? []).join(' · ')
  );
  const firstMetaText = allGoalMetaTexts[0] ?? '';
  const hideUniformGoalMeta =
    firstMetaText.length > 0 &&
    allGoalMetaTexts.length > 0 &&
    allGoalMetaTexts.every((metaText) => metaText === firstMetaText);

  const items: Array<{
    title: string;
    description?: string;
    depth: number;
    meta?: string[];
  }> = [];
  const childrenByParent = new Map<string | null, typeof action.goals>();

  action.goals.forEach((goal) => {
    const key = goal.parentRef ?? null;
    const bucket = childrenByParent.get(key) ?? [];
    bucket.push(goal);
    childrenByParent.set(key, bucket);
  });

  const appendGoal = (
    goal: (typeof action.goals)[number],
    depth: number
  ): void => {
    items.push({
      title: goal.title,
      description: goal.description,
      depth,
      meta: hideUniformGoalMeta ? [] : (goalMetaByRef.get(goal.ref) ?? []),
    });
    const children = childrenByParent.get(goal.ref) ?? [];
    children.forEach((child) => {
      appendGoal(child, depth + 1);
    });
  };

  const roots = childrenByParent.get(null) ?? action.goals;
  roots.forEach((goal) => {
    appendGoal(goal, 0);
  });

  return items;
}

export function getAiAssistantFindingSeverityBadgeTone(
  severity: AiAssistantReviewFindingSeverity
): AiAssistantBadgeTone {
  switch (severity) {
    case 'high':
      return {
        background: 'rgba(254, 242, 242, 0.82)',
        color: '#be123c',
        border: 'rgba(254, 205, 211, 0.82)',
      };
    case 'medium':
      return {
        background: 'rgba(255, 251, 235, 0.82)',
        color: '#b45309',
        border: 'rgba(253, 230, 138, 0.82)',
      };
    case 'low':
    default:
      return {
        background: 'rgba(248, 250, 252, 0.9)',
        color: '#475569',
        border: 'rgba(203, 213, 225, 0.82)',
      };
  }
}

export function getAiAssistantReadinessBadgeTone(
  score: number
): AiAssistantBadgeTone {
  if (score >= 80) {
    return {
      background: 'rgba(238, 242, 255, 0.82)',
      color: '#4f46e5',
      border: 'rgba(199, 210, 254, 0.82)',
    };
  }
  if (score >= 60) {
    return {
      background: 'rgba(255, 251, 235, 0.82)',
      color: '#b45309',
      border: 'rgba(253, 230, 138, 0.82)',
    };
  }
  return {
    background: 'rgba(254, 242, 242, 0.82)',
    color: '#be123c',
    border: 'rgba(254, 205, 211, 0.82)',
  };
}

export function getAiAssistantReviewAccentColor(
  review: AiAssistantReviewFindings
): string {
  if (typeof review.readinessScore === 'number') {
    if (review.readinessScore >= 80) {
      return '#047857';
    }
    if (review.readinessScore >= 60) {
      return '#b45309';
    }
    return '#b91c1c';
  }

  const severities = review.findings.map((finding) => finding.severity);
  if (severities.includes('high')) {
    return '#b91c1c';
  }
  if (severities.includes('medium')) {
    return '#b45309';
  }
  return '#475569';
}

export function formatAiAssistantElementStatus(
  value: AiAssistantCreateElementStatus,
  i18n?: AiAssistantRenderI18n
): string {
  switch (value) {
    case 'in-progress':
      return i18n?.t('status.inProgress') ?? 'In progress';
    case 'pending':
      return i18n?.t('status.pending') ?? 'Pending';
    case 'done':
      return i18n?.t('status.done') ?? 'Done';
    case 'defined':
    default:
      return i18n?.t('status.defined') ?? 'Defined';
  }
}

function shouldDisplayAiAssistantElementStatus(
  value: AiAssistantCreateElementStatus
): boolean {
  return value !== 'defined';
}

function shouldDisplayAiAssistantPriority(priority: UiPriority): boolean {
  return true;
}

function formatAiAssistantPriorityLabel(
  priority: UiPriority,
  i18n?: AiAssistantRenderI18n
): string {
  switch (priority) {
    case 'lowest':
      return i18n?.t('priority.lowest') ?? 'Lowest';
    case 'low':
      return i18n?.t('priority.low') ?? 'Low';
    case 'medium':
      return i18n?.t('priority.medium') ?? 'Medium';
    case 'high':
      return i18n?.t('priority.high') ?? 'High';
    case 'highest':
      return i18n?.t('priority.highest') ?? 'Highest';
    default:
      return priority;
  }
}

function getAiAssistantPriorityBadgeTone(
  priority: UiPriority
): AiAssistantBadgeTone {
  switch (priority) {
    case 'lowest':
    case 'low':
      return {
        background: 'rgba(240, 249, 255, 0.72)',
        color: '#0ea5e9',
        border: 'rgba(186, 230, 253, 0.62)',
      };
    case 'medium':
      return {
        background: 'rgba(255, 247, 237, 0.72)',
        color: '#f97316',
        border: 'rgba(254, 215, 170, 0.62)',
      };
    case 'high':
    case 'highest':
      return {
        background: 'rgba(254, 242, 242, 0.72)',
        color: '#ef4444',
        border: 'rgba(252, 165, 165, 0.62)',
      };
  }
}

function getAiAssistantPriorityIcon(priority: UiPriority): IconName {
  switch (priority) {
    case 'lowest':
      return 'chevron-double-down';
    case 'low':
      return 'chevron-down';
    case 'medium':
      return 'bars-2';
    case 'high':
      return 'chevron-up';
    case 'highest':
      return 'chevron-double-up';
  }
}

function getAiAssistantPriorityIconColor(priority: UiPriority): string {
  switch (priority) {
    case 'lowest':
    case 'low':
      return '#0ea5e9';
    case 'medium':
      return '#f97316';
    case 'high':
    case 'highest':
      return '#ef4444';
  }
}

function getAiAssistantNeutralBadgeTone(): AiAssistantBadgeTone {
  return {
    background: 'rgba(241, 245, 249, 0.7)',
    color: '#64748b',
    border: 'rgba(203, 213, 225, 0.44)',
  };
}

function formatAiAssistantRelationTypeLabel(
  relationType: AiAssistantRelationSuggestionType,
  i18n?: AiAssistantRenderI18n
): string {
  switch (relationType) {
    case 'blocks':
      return i18n?.t('aiChat.relation.blocks') ?? 'Blocks';
    case 'leads_to':
      return i18n?.t('aiChat.relation.leadsTo') ?? 'Leads to';
    case 'relates_to':
    default:
      return i18n?.t('aiChat.relation.relatesTo') ?? 'Relates to';
  }
}

function formatAiAssistantElementKindLabel(
  elementKind: AiAssistantElementKind,
  i18n?: AiAssistantRenderI18n
): string {
  switch (elementKind) {
    case 'goal':
      return i18n?.t('aiChat.kind.goal') ?? 'Goal';
    case 'story':
      return i18n?.t('aiChat.kind.story') ?? 'Story';
    case 'task':
    default:
      return i18n?.t('aiChat.kind.task') ?? 'Task';
  }
}

function formatAiAssistantGoalBlueprintPatternLabel(
  pattern: AiAssistantGoalBlueprintPattern,
  i18n?: AiAssistantRenderI18n
): string {
  switch (pattern) {
    case 'goal_tree':
      return i18n?.t('aiChat.blueprint.goalPlan') ?? 'Goal plan';
    case 'goal_tree_with_sequence':
      return i18n?.t('aiChat.blueprint.sequencedPlan') ?? 'Sequenced plan';
    case 'goal_graph':
      return i18n?.t('aiChat.blueprint.goalMap') ?? 'Goal map';
  }
}

function getAiAssistantGroupedActionEyebrow(
  actions: AiAssistantAction[],
  i18n?: AiAssistantRenderI18n
): string {
  const firstAction = actions[0];
  if (!firstAction) {
    return i18n?.t('common.actions') ?? 'Actions';
  }

  if (actions.length <= 1) {
    return getAiAssistantActionLabel(firstAction.kind, i18n);
  }

  switch (firstAction.kind) {
    case 'create_task':
      return i18n?.t('aiChat.actionGroup.createTasks') ?? 'Create tasks';
    case 'create_story':
      return i18n?.t('aiChat.actionGroup.createStories') ?? 'Create stories';
    case 'create_goal':
    case 'create_goals':
      return i18n?.t('aiChat.actionGroup.createGoals') ?? 'Create goals';
    case 'create_goal_blueprint':
      return i18n?.t('aiChat.actionGroup.createPlan') ?? 'Create plan';
    case 'suggest_relation':
      return (
        i18n?.t('aiChat.actionGroup.suggestedRelations') ??
        'Suggested relations'
      );
    case 'remove_relation':
      return (
        i18n?.t('aiChat.actionGroup.relationsToRemove') ??
        'Relations to remove'
      );
    case 'update_relation':
      return (
        i18n?.t('aiChat.actionGroup.relationTypeChanges') ??
        'Relation type changes'
      );
    case 'suggest_update':
    default:
      return (
        i18n?.t('aiChat.actionGroup.suggestedUpdates') ??
        'Suggested updates'
      );
  }
}
