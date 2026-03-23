import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type { IconName } from '../../../ui-lib/src/hud/icons.ts';
import { getAiAssistantSelectedItems } from '../services/AiAssistantContent.ts';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantElementKind,
} from '../aiAssistantEvents.ts';
import type {
  AiAssistantAction,
  AiAssistantCreateElementStatus,
  AiAssistantReviewFindings,
  AiAssistantReviewFindingSeverity,
  AiAssistantActionStatus,
} from '../aiAssistantActions.ts';
import { getAiAssistantActionGroupButtonLabel } from '../aiAssistantActions.ts';

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
  action: AiAssistantAction
): string {
  if (action.kind === 'create_goal_blueprint') {
    if (action.status === 'applied') {
      return 'Created';
    }
    if (action.status === 'applying') {
      return 'Creating...';
    }
    if (action.status === 'failed') {
      return 'Retry';
    }
    return 'Create plan';
  }
  if (action.kind === 'create_goals') {
    if (action.status === 'applied') {
      return 'Created';
    }
    if (action.status === 'applying') {
      return 'Creating...';
    }
    if (action.status === 'failed') {
      return 'Retry';
    }
    return 'Create all';
  }

  const isApplyAction =
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation' ||
    action.kind === 'update_relation' ||
    action.kind === 'suggest_update';
  if (action.status === 'applied') {
    return isApplyAction ? 'Applied' : 'Created';
  }
  if (action.status === 'applying') {
    return isApplyAction ? 'Applying...' : 'Creating...';
  }
  if (action.status === 'failed') {
    return 'Retry';
  }
  return isApplyAction ? 'Apply' : 'Create';
}

export function buildAiAssistantActionButtonModel(
  action: AiAssistantAction
): AiAssistantActionButtonModel {
  const disabled =
    action.status === 'applied' || action.status === 'applying';
  return {
    label: getAiAssistantActionButtonLabel(action),
    tone: disabled ? 'quiet' : 'primary',
    disabled,
    dimmed: action.status === 'applying',
  };
}

export function buildAiAssistantActionCardModel(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean
): AiAssistantActionCardModel {
  const base = buildAiAssistantActionCardBaseModel(
    action,
    context,
    contextEnabled
  );

  switch (action.kind) {
    case 'suggest_update':
      return {
        ...base,
        family: 'update',
        changes: buildAiAssistantUpdateChanges(action),
      };
    case 'create_goals':
      return {
        ...base,
        family: 'create-goals',
        items: buildAiAssistantCreateGoalsItems(action),
      };
    case 'create_goal_blueprint':
      return {
        ...base,
        family: 'blueprint',
        goals: buildGoalBlueprintHierarchyItems(action),
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
  contextEnabled: boolean
): AiAssistantActionCardBaseModel {
  return {
    eyebrow: action.label,
    title: action.title,
    meta: getAiAssistantActionMeta(action, context, contextEnabled),
    chips: buildAiAssistantActionTagModels(action),
    summary: getAiAssistantActionSummary(action),
    rationale: getAiAssistantActionReason(action),
    provenance: getAiAssistantActionProvenance(action),
    error: action.status === 'failed' ? action.errorMessage ?? null : null,
  };
}

export function buildAiAssistantActionEntryModel(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean
): AiAssistantActionEntryModel {
  return {
    actionId: action.id,
    status: action.status,
    card: buildAiAssistantActionCardModel(action, context, contextEnabled),
    button: buildAiAssistantActionButtonModel(action),
  };
}

export function buildAiAssistantGroupedActionCardModel(
  actions: AiAssistantAction[],
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean
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
      eyebrow: group.groupTitle || group.label,
      summary: group.groupSummary ?? null,
    },
    entries: actions.map((action) =>
      buildAiAssistantActionEntryModel(action, context, contextEnabled)
    ),
    footer:
      actionableActionIds.length > 1
        ? {
            actionIds: actionableActionIds,
            button: {
              label: getAiAssistantActionGroupButtonLabel(actions),
              tone: 'primary',
              disabled: false,
              dimmed: false,
            },
          }
        : null,
  };
}

export function buildAiAssistantActionTagModels(
  action: AiAssistantAction
): AiAssistantActionTagModel[] {
  const tags: AiAssistantActionTagModel[] = [];

  if (
    'priority' in action &&
    action.priority
  ) {
    const priorityLabel = formatAiAssistantPriorityLabel(action.priority);
    tags.push({
      text: priorityLabel,
      tone: getAiAssistantPriorityBadgeTone(action.priority),
      icon: getAiAssistantPriorityIcon(action.priority),
      iconColor: getAiAssistantPriorityIconColor(action.priority),
      iconOnly: true,
      title: `${priorityLabel} priority`,
    });
  }

  if (
    'elementStatus' in action &&
    action.elementStatus &&
    shouldDisplayAiAssistantElementStatus(action.elementStatus)
  ) {
    tags.push({
      text: formatAiAssistantElementStatus(action.elementStatus),
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  if (
    action.kind === 'suggest_relation' ||
    action.kind === 'remove_relation'
  ) {
    tags.push({
      text: formatAiAssistantRelationTypeLabel(action.relationType),
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
      text: `${formatAiAssistantRelationTypeLabel(action.currentRelationType)} → ${formatAiAssistantRelationTypeLabel(action.nextRelationType)}`,
      tone: {
        background: 'rgba(255, 247, 237, 0.52)',
        color: '#a36c2f',
        border: 'rgba(254, 215, 170, 0.44)',
      },
    });
  }

  if (action.kind === 'create_goal_blueprint') {
    tags.push({
      text: formatAiAssistantGoalBlueprintPatternLabel(action.pattern),
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
  contextEnabled: boolean
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
    return `${formatAiAssistantElementKindLabel(action.elementKind)}: ${action.targetTitle || action.elementId}`;
  }
  return getAiAssistantActionTargetPreview(action, context, contextEnabled);
}

function getAiAssistantActionMeta(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean
): string | null {
  if (action.kind === 'create_task' || action.kind === 'create_story') {
    return null;
  }
  const meta = getAiAssistantActionSecondaryText(action, context, contextEnabled);
  if (
    meta === 'On canvas' &&
    (action.kind === 'create_task' ||
      action.kind === 'create_story' ||
      action.kind === 'create_goal' ||
      action.kind === 'create_goals' ||
      action.kind === 'create_goal_blueprint')
  ) {
    return null;
  }
  return meta;
}

export function getAiAssistantActionTargetPreview(
  action: AiAssistantAction,
  context: AiAssistantCanvasSnapshot | null,
  contextEnabled: boolean
): string {
  const target = 'target' in action ? action.target : undefined;

  if (target?.kind === 'story') {
    const targetElement = context?.elements.find(
      (item) => item.id === target.id
    );
    return targetElement?.title ? `Story: ${targetElement.title}` : 'Story';
  }
  if (target?.kind === 'goal') {
    const targetElement = context?.elements.find(
      (item) => item.id === target.id
    );
    return targetElement?.title ? `Goal: ${targetElement.title}` : 'Goal';
  }
  if (contextEnabled && context) {
    const selection = getAiAssistantSelectedItems(context);
    if (
      action.kind === 'create_task' &&
      selection.length === 1 &&
      selection[0]?.kind === 'story'
    ) {
      return 'Selected story';
    }
    if (
      action.kind === 'create_story' &&
      selection.length === 1 &&
      selection[0]?.kind === 'goal'
    ) {
      return 'Selected goal';
    }
  }
  return 'On canvas';
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
  action: Extract<AiAssistantAction, { kind: 'suggest_update' }>
): AiAssistantActionChangeEntry[] {
  return Object.entries(action.patch)
    .map(([key, value]) => {
      if (value === undefined) {
        return null;
      }

      switch (key) {
        case 'title':
          return { label: 'Title', value: String(value) };
        case 'description':
          return { label: 'Description', value: String(value) };
        case 'priority':
          return {
            label: 'Priority',
            value: formatAiAssistantPriorityLabel(value as UiPriority),
          };
        case 'elementStatus':
          return {
            label: 'Status',
            value: formatAiAssistantElementStatus(
              value as AiAssistantCreateElementStatus
            ),
          };
        default:
          return null;
      }
    })
    .filter((entry): entry is AiAssistantActionChangeEntry => entry !== null);
}

function buildAiAssistantCreateGoalsItems(
  action: Extract<AiAssistantAction, { kind: 'create_goals' }>
): AiAssistantActionEntityItem[] {
  return action.items.map((item) => ({
    title: item.title,
    description: item.description,
    meta: [
      item.priority
        ? shouldDisplayAiAssistantPriority(item.priority)
          ? formatAiAssistantPriorityLabel(item.priority)
          : null
        : null,
      item.elementStatus
        ? shouldDisplayAiAssistantElementStatus(item.elementStatus)
          ? formatAiAssistantElementStatus(item.elementStatus)
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
  action: AiAssistantAction
): string | null {
  const parts: string[] = [];

  if (action.supportedBy && action.supportedBy.length > 0) {
    parts.push(
      `${action.supportedBy.length} supporting item${action.supportedBy.length === 1 ? '' : 's'}`
    );
  }

  if (action.evidenceIds && action.evidenceIds.length > 0) {
    parts.push(
      `${action.evidenceIds.length} evidence item${action.evidenceIds.length === 1 ? '' : 's'}`
    );
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function buildGoalBlueprintHierarchyItems(
  action: Extract<AiAssistantAction, { kind: 'create_goal_blueprint' }>
): Array<{
  title: string;
  description?: string;
  depth: number;
}> {
  const items: Array<{
    title: string;
    description?: string;
    depth: number;
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
  value: AiAssistantCreateElementStatus
): string {
  switch (value) {
    case 'in-progress':
      return 'In progress';
    case 'pending':
      return 'Pending';
    case 'done':
      return 'Done';
    case 'defined':
    default:
      return 'Defined';
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

function formatAiAssistantPriorityLabel(priority: UiPriority): string {
  switch (priority) {
    case 'lowest':
      return 'Lowest';
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'highest':
      return 'Highest';
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
  relationType: AiAssistantRelationSuggestionType
): string {
  return relationType
    .split('_')
    .map((part, index) =>
      index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part
    )
    .join(' ');
}

function formatAiAssistantElementKindLabel(
  elementKind: AiAssistantElementKind
): string {
  switch (elementKind) {
    case 'goal':
      return 'Goal';
    case 'story':
      return 'Story';
    case 'task':
    default:
      return 'Task';
  }
}

function formatAiAssistantGoalBlueprintPatternLabel(
  pattern: AiAssistantGoalBlueprintPattern
): string {
  switch (pattern) {
    case 'goal_tree':
      return 'Goal tree';
    case 'goal_tree_with_sequence':
      return 'Goal tree + sequence';
    case 'goal_graph':
      return 'Goal graph';
    default:
      return pattern.replace(/_/g, ' ');
  }
}
