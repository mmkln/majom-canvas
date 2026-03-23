import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { getAiAssistantSelectedItems } from '../services/AiAssistantContent.ts';
import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type {
  AiAssistantAction,
  AiAssistantCreateElementStatus,
  AiAssistantReviewFindings,
  AiAssistantReviewFindingSeverity,
} from '../aiAssistantActions.ts';

export type AiAssistantBadgeTone = {
  background: string;
  color: string;
  border: string;
};

export type AiAssistantActionTagModel = {
  text: string;
  tone: AiAssistantBadgeTone;
};

export type AiAssistantActionRenderGroup = {
  groupId: string | null;
  actions: AiAssistantAction[];
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

export function buildAiAssistantActionTagModels(
  action: AiAssistantAction
): AiAssistantActionTagModel[] {
  const tags: AiAssistantActionTagModel[] = [];

  if ('priority' in action && action.priority) {
    tags.push({
      text: action.priority,
      tone: getAiAssistantPriorityBadgeTone(action.priority),
    });
  }

  if ('elementStatus' in action && action.elementStatus) {
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
      text: action.relationType.replace('_', ' '),
      tone: {
        background:
          action.kind === 'remove_relation'
            ? 'rgba(254, 242, 242, 0.82)'
            : 'rgba(238, 242, 255, 0.82)',
        color: action.kind === 'remove_relation' ? '#be123c' : '#4f46e5',
        border:
          action.kind === 'remove_relation'
            ? 'rgba(254, 205, 211, 0.88)'
            : 'rgba(199, 210, 254, 0.86)',
      },
    });
  }

  if (action.kind === 'update_relation') {
    tags.push({
      text: `${action.currentRelationType.replace('_', ' ')} -> ${action.nextRelationType.replace('_', ' ')}`,
      tone: {
        background: 'rgba(255, 247, 237, 0.82)',
        color: '#c2410c',
        border: 'rgba(254, 215, 170, 0.86)',
      },
    });
  }

  if (action.kind === 'suggest_update') {
    Object.entries(action.patch).forEach(([key, value]) => {
      tags.push({
        text: formatAiAssistantUpdatePatchTagLabel(key, String(value)),
        tone: getAiAssistantNeutralBadgeTone(),
      });
    });
  }

  if (action.kind === 'create_goal_blueprint') {
    tags.push({
      text: action.pattern.replace(/_/g, ' '),
      tone: {
        background: 'rgba(238, 242, 255, 0.82)',
        color: '#4f46e5',
        border: 'rgba(199, 210, 254, 0.86)',
      },
    });
    tags.push({
      text: `${action.goals.length} goal${action.goals.length === 1 ? '' : 's'}`,
      tone: getAiAssistantNeutralBadgeTone(),
    });
    if (action.relations.length > 0) {
      tags.push({
        text: `${action.relations.length} sequence link${action.relations.length === 1 ? '' : 's'}`,
        tone: getAiAssistantNeutralBadgeTone(),
      });
    }
  }

  if (action.kind === 'create_goals') {
    tags.push({
      text: `${action.items.length} goal${action.items.length === 1 ? '' : 's'}`,
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  if (action.supportedBy && action.supportedBy.length > 0) {
    tags.push({
      text: `supported by ${action.supportedBy.length}`,
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  if (action.evidenceIds && action.evidenceIds.length > 0) {
    tags.push({
      text: `${action.evidenceIds.length} evidence`,
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  if (action.sourceContext) {
    tags.push({
      text: 'source context',
      tone: getAiAssistantNeutralBadgeTone(),
    });
  }

  return tags;
}

export function getAiAssistantActionAccentColor(
  action: AiAssistantAction
): string {
  if (action.status === 'failed') {
    return '#c2410c';
  }
  if (action.status === 'applied') {
    return '#64748b';
  }
  switch (action.kind) {
    case 'suggest_relation':
      return '#4338ca';
    case 'remove_relation':
      return '#b91c1c';
    case 'update_relation':
      return '#c2410c';
    case 'suggest_update':
      return '#0f766e';
    case 'create_goal_blueprint':
      return '#1d4ed8';
    case 'create_goals':
    case 'create_goal':
    case 'create_story':
    case 'create_task':
    default:
      return '#111827';
  }
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
    return `"${from}" → "${to}"`;
  }
  if (action.kind === 'suggest_update') {
    return `For ${action.elementKind} "${action.targetTitle || action.elementId}"`;
  }
  if (action.kind === 'create_goal_blueprint') {
    return `${action.goals.length} strategic goal${action.goals.length === 1 ? '' : 's'}${action.relations.length > 0 ? ` · ${action.relations.length} leads-to link${action.relations.length === 1 ? '' : 's'}` : ''}`;
  }
  if (action.kind === 'create_goals') {
    const base = `${action.items.length} strategic goal${action.items.length === 1 ? '' : 's'}`;
    const targetPreview = getAiAssistantActionTargetPreview(
      action,
      context,
      contextEnabled
    );
    return targetPreview === 'On canvas' ? base : `${base} · ${targetPreview}`;
  }
  return getAiAssistantActionTargetPreview(action, context, contextEnabled);
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
    return targetElement?.title ? `In story "${targetElement.title}"` : 'In story';
  }
  if (target?.kind === 'goal') {
    const targetElement = context?.elements.find(
      (item) => item.id === target.id
    );
    return targetElement?.title ? `In goal "${targetElement.title}"` : 'In goal';
  }
  if (contextEnabled && context) {
    const selection = getAiAssistantSelectedItems(context);
    if (
      action.kind === 'create_task' &&
      selection.length === 1 &&
      selection[0]?.kind === 'story'
    ) {
      return 'In selected story';
    }
    if (
      action.kind === 'create_story' &&
      selection.length === 1 &&
      selection[0]?.kind === 'goal'
    ) {
      return 'In selected goal';
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

function getAiAssistantPriorityBadgeTone(
  priority: UiPriority
): AiAssistantBadgeTone {
  switch (priority) {
    case 'lowest':
    case 'low':
      return {
        background: 'rgba(248, 250, 252, 0.9)',
        color: '#475569',
        border: 'rgba(203, 213, 225, 0.82)',
      };
    case 'medium':
      return {
        background: 'rgba(255, 251, 235, 0.82)',
        color: '#b45309',
        border: 'rgba(253, 230, 138, 0.82)',
      };
    case 'high':
    case 'highest':
      return {
        background: 'rgba(254, 242, 242, 0.82)',
        color: '#be123c',
        border: 'rgba(254, 205, 211, 0.82)',
      };
  }
}

function getAiAssistantNeutralBadgeTone(): AiAssistantBadgeTone {
  return {
    background: 'rgba(248, 250, 252, 0.92)',
    color: '#475569',
    border: 'rgba(203, 213, 225, 0.76)',
  };
}

function formatAiAssistantUpdatePatchTagLabel(
  key: string,
  value: string
): string {
  switch (key) {
    case 'title':
      return 'Title change';
    case 'description':
      return 'Description change';
    case 'priority':
      return 'Priority change';
    case 'elementStatus':
      return 'Status change';
    default:
      return `${key}: ${String(value)}`;
  }
}
