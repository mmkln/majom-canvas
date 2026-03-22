import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { getWorkspaceChatSelectedItems } from '../services/WorkspaceChatContent.ts';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatCreateElementStatus,
  WorkspaceChatReviewFindings,
  WorkspaceChatReviewFindingSeverity,
} from '../workspaceChatActions.ts';

export type WorkspaceChatBadgeTone = {
  background: string;
  color: string;
  border: string;
};

export type WorkspaceChatActionTagModel = {
  text: string;
  tone: WorkspaceChatBadgeTone;
};

export type WorkspaceChatActionRenderGroup = {
  groupId: string | null;
  actions: WorkspaceChatAction[];
};

export function groupWorkspaceChatActionsForRender(
  actions: WorkspaceChatAction[]
): WorkspaceChatActionRenderGroup[] {
  const groups: WorkspaceChatActionRenderGroup[] = [];
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

export function getWorkspaceChatActionButtonLabel(
  action: WorkspaceChatAction
): string {
  const isApplyAction =
    action.kind === 'suggest_relation' || action.kind === 'suggest_update';
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

export function buildWorkspaceChatActionTagModels(
  action: WorkspaceChatAction
): WorkspaceChatActionTagModel[] {
  const tags: WorkspaceChatActionTagModel[] = [];

  if ('priority' in action && action.priority) {
    tags.push({
      text: action.priority,
      tone: getWorkspaceChatPriorityBadgeTone(action.priority),
    });
  }

  if ('elementStatus' in action && action.elementStatus) {
    tags.push({
      text: formatWorkspaceChatElementStatus(action.elementStatus),
      tone: getWorkspaceChatNeutralBadgeTone(),
    });
  }

  if (action.kind === 'suggest_relation') {
    tags.push({
      text: action.relationType.replace('_', ' '),
      tone: {
        background: 'rgba(238, 242, 255, 0.96)',
        color: '#4338ca',
        border: 'rgba(199, 210, 254, 0.92)',
      },
    });
  }

  if (action.kind === 'suggest_update') {
    Object.entries(action.patch).forEach(([key, value]) => {
      tags.push({
        text: formatWorkspaceChatUpdatePatchTagLabel(
          key,
          value as string | UiPriority | WorkspaceChatCreateElementStatus
        ),
        tone: getWorkspaceChatNeutralBadgeTone(),
      });
    });
  }

  return tags;
}

export function getWorkspaceChatActionAccentColor(
  action: WorkspaceChatAction
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
    case 'suggest_update':
      return '#0f766e';
    case 'create_goal':
    case 'create_story':
    case 'create_task':
    default:
      return '#111827';
  }
}

export function getWorkspaceChatActionSecondaryText(
  action: WorkspaceChatAction,
  context: WorkspaceChatCanvasSnapshot | null,
  contextEnabled: boolean
): string {
  if (action.kind === 'suggest_relation') {
    const from = action.fromLabel || action.fromId;
    const to = action.toLabel || action.toId;
    return `"${from}" → "${to}"`;
  }
  if (action.kind === 'suggest_update') {
    return `For ${action.elementKind} "${action.targetTitle || action.elementId}"`;
  }
  return getWorkspaceChatActionTargetPreview(action, context, contextEnabled);
}

export function getWorkspaceChatActionTargetPreview(
  action: WorkspaceChatAction,
  context: WorkspaceChatCanvasSnapshot | null,
  contextEnabled: boolean
): string {
  if (action.target?.kind === 'story') {
    const target = context?.elements.find(
      (item) => item.id === action.target?.id
    );
    return target?.title ? `In story "${target.title}"` : 'In story';
  }
  if (action.target?.kind === 'goal') {
    const target = context?.elements.find(
      (item) => item.id === action.target?.id
    );
    return target?.title ? `In goal "${target.title}"` : 'In goal';
  }
  if (contextEnabled && context) {
    const selection = getWorkspaceChatSelectedItems(context);
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

export function getWorkspaceChatActionReason(
  action: WorkspaceChatAction
): string | null {
  if (action.kind === 'suggest_relation') {
    return action.reason ?? null;
  }
  if (action.kind === 'suggest_update') {
    return action.reason ?? null;
  }
  return null;
}

export function getWorkspaceChatFindingSeverityBadgeTone(
  severity: WorkspaceChatReviewFindingSeverity
): WorkspaceChatBadgeTone {
  switch (severity) {
    case 'high':
      return {
        background: 'rgba(254, 242, 242, 0.9)',
        color: '#b91c1c',
        border: 'rgba(254, 202, 202, 0.72)',
      };
    case 'medium':
      return {
        background: 'rgba(255, 251, 235, 0.9)',
        color: '#b45309',
        border: 'rgba(253, 230, 138, 0.72)',
      };
    case 'low':
    default:
      return {
        background: 'rgba(239, 246, 255, 0.9)',
        color: '#1d4ed8',
        border: 'rgba(191, 219, 254, 0.72)',
      };
  }
}

export function getWorkspaceChatReadinessBadgeTone(
  score: number
): WorkspaceChatBadgeTone {
  if (score >= 80) {
    return {
      background: 'rgba(236, 253, 245, 0.9)',
      color: '#047857',
      border: 'rgba(167, 243, 208, 0.72)',
    };
  }
  if (score >= 60) {
    return {
      background: 'rgba(255, 251, 235, 0.9)',
      color: '#b45309',
      border: 'rgba(253, 230, 138, 0.72)',
    };
  }
  return {
    background: 'rgba(254, 242, 242, 0.9)',
    color: '#b91c1c',
    border: 'rgba(254, 202, 202, 0.72)',
  };
}

export function getWorkspaceChatReviewAccentColor(
  review: WorkspaceChatReviewFindings
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

export function formatWorkspaceChatElementStatus(
  value: WorkspaceChatCreateElementStatus
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

function getWorkspaceChatPriorityBadgeTone(
  priority: UiPriority
): WorkspaceChatBadgeTone {
  switch (priority) {
    case 'lowest':
    case 'low':
      return {
        background: 'rgba(239, 246, 255, 0.9)',
        color: '#1d4ed8',
        border: 'rgba(191, 219, 254, 0.72)',
      };
    case 'medium':
      return {
        background: 'rgba(255, 251, 235, 0.9)',
        color: '#b45309',
        border: 'rgba(253, 230, 138, 0.72)',
      };
    case 'high':
    case 'highest':
      return {
        background: 'rgba(254, 242, 242, 0.9)',
        color: '#b91c1c',
        border: 'rgba(254, 202, 202, 0.72)',
      };
  }
}

function getWorkspaceChatNeutralBadgeTone(): WorkspaceChatBadgeTone {
  return {
    background: 'rgba(248, 250, 252, 0.92)',
    color: '#475569',
    border: 'rgba(203, 213, 225, 0.76)',
  };
}

function formatWorkspaceChatUpdatePatchTagLabel(
  key: string,
  value: string | UiPriority | WorkspaceChatCreateElementStatus
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
