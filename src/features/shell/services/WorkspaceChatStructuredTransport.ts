import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type {
  WorkspaceChatActionTarget,
  WorkspaceChatCreateActionKind,
  WorkspaceChatCreateElementStatus,
  WorkspaceChatRelationSuggestionType,
  WorkspaceChatReviewFindings,
  WorkspaceChatUpdatePatch,
} from '../workspaceChatActions.ts';
import {
  getWorkspaceChatActionEntityLabel,
  type WorkspaceChatActionKind,
} from '../workspaceChatActions.ts';

export type WorkspaceChatStructuredActionEntryKind =
  | WorkspaceChatActionKind
  | 'create_batch_tasks'
  | 'create_batch_stories'
  | 'suggest_relations'
  | 'suggest_updates';

export type WorkspaceChatStructuredCreateActionEntry = {
  kind: WorkspaceChatCreateActionKind;
  title: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: WorkspaceChatCreateElementStatus;
  target?: WorkspaceChatActionTarget;
};

export type WorkspaceChatStructuredCreateBatchItem = Omit<
  WorkspaceChatStructuredCreateActionEntry,
  'kind' | 'target'
> & {
  target?: WorkspaceChatActionTarget;
};

export type WorkspaceChatStructuredCreateBatchEntry = {
  kind: 'create_batch_tasks' | 'create_batch_stories';
  title?: string;
  summary?: string;
  description?: string;
  target?: WorkspaceChatActionTarget;
  items: WorkspaceChatStructuredCreateBatchItem[];
};

export type WorkspaceChatStructuredRelationSuggestion = {
  fromId: string;
  toId: string;
  relationType: WorkspaceChatRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type WorkspaceChatStructuredRelationActionEntry = {
  kind: 'suggest_relation';
  title?: string;
  fromId: string;
  toId: string;
  relationType: WorkspaceChatRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type WorkspaceChatStructuredRelationBatchEntry = {
  kind: 'suggest_relations';
  title?: string;
  summary?: string;
  description?: string;
  relations: WorkspaceChatStructuredRelationSuggestion[];
};

export type WorkspaceChatStructuredUpdateSuggestion = {
  elementId: string;
  patch: WorkspaceChatUpdatePatch;
  reason?: string;
  targetTitle?: string;
};

export type WorkspaceChatStructuredUpdateActionEntry = {
  kind: 'suggest_update';
  title?: string;
  elementId: string;
  patch: WorkspaceChatUpdatePatch;
  reason?: string;
  targetTitle?: string;
};

export type WorkspaceChatStructuredUpdateBatchEntry = {
  kind: 'suggest_updates';
  title?: string;
  summary?: string;
  description?: string;
  updates: WorkspaceChatStructuredUpdateSuggestion[];
};

export type WorkspaceChatStructuredActionEntry =
  | WorkspaceChatStructuredCreateActionEntry
  | WorkspaceChatStructuredCreateBatchEntry
  | WorkspaceChatStructuredRelationActionEntry
  | WorkspaceChatStructuredRelationBatchEntry
  | WorkspaceChatStructuredUpdateActionEntry
  | WorkspaceChatStructuredUpdateBatchEntry;

export type WorkspaceChatStructuredReplyEnvelope = {
  replyMarkdown?: string;
  actions?: WorkspaceChatStructuredActionEntry[];
  reviewFindings?: WorkspaceChatReviewFindings;
};

export const WORKSPACE_CHAT_STRUCTURED_ENVELOPE_SHAPE =
  '{"replyMarkdown":"<markdown reply>","actions":[...],"reviewFindings":{"title":"...","summary":"...","readinessScore":72,"readinessVerdict":"...","findings":[...]}}';

export const WORKSPACE_CHAT_STRUCTURED_ACTION_KIND_NOTES = [
  '- reviewFindings: for review, readiness, missing work, overlaps, weak decomposition, orphaned items, or planning gaps.',
  '- create_task / create_story / create_goal: for single clear create proposals.',
  '- create_batch_tasks: for decomposing a story or cluster into multiple tasks.',
  '- create_batch_stories: for decomposing a goal into multiple stories.',
  '- suggest_relations: for non-hierarchical dependency or sequencing suggestions.',
  '- suggest_updates: for title, description, priority, or status refinements to existing items.',
];

export function isWorkspaceChatStructuredActionEntryKind(
  value: unknown
): value is WorkspaceChatStructuredActionEntryKind {
  return (
    value === 'create_task' ||
    value === 'create_story' ||
    value === 'create_goal' ||
    value === 'suggest_relation' ||
    value === 'suggest_update' ||
    value === 'create_batch_tasks' ||
    value === 'create_batch_stories' ||
    value === 'suggest_relations' ||
    value === 'suggest_updates'
  );
}

export function isWorkspaceChatStructuredReplyEnvelopeLike(
  value: unknown
): value is WorkspaceChatStructuredReplyEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as WorkspaceChatStructuredReplyEnvelope;
  return (
    typeof envelope.replyMarkdown === 'string' ||
    Array.isArray(envelope.actions) ||
    (envelope.reviewFindings !== undefined &&
      envelope.reviewFindings !== null &&
      typeof envelope.reviewFindings === 'object')
  );
}

export function getWorkspaceChatStructuredReplyExamples() {
  const singleActionsExample: WorkspaceChatStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared a task you can add as-is.',
    actions: [
      {
        kind: 'create_task',
        title: 'Draft checkout validation task',
        description: 'Add validation states for payment form inputs.',
        priority: 'high',
        elementStatus: 'pending',
        target: { kind: 'story', id: 'story-id' },
      },
      {
        kind: 'create_story',
        title: 'Support refund flow',
        description: 'Add a story for refund initiation and notifications.',
        priority: 'medium',
        elementStatus: 'defined',
        target: { kind: 'goal', id: 'goal-id' },
      },
      {
        kind: 'create_goal',
        title: 'Improve post-purchase trust',
        description: 'Clarify the next outcome to plan for.',
        priority: 'lowest',
        elementStatus: 'in-progress',
        target: { kind: 'canvas' },
      },
    ],
    reviewFindings: {
      title: 'Story review',
      summary: 'The current story is actionable but still broad.',
      readinessScore: 68,
      readinessVerdict: 'Needs clearer dependencies before execution.',
      findings: [
        {
          id: 'finding-1',
          severity: 'medium',
          category: 'missing_dependencies',
          title: 'Missing sequence between review and confirmation',
          detail:
            'The flow mentions order review and confirmation, but no explicit dependency clarifies the handoff.',
          targetIds: ['task-order-review', 'task-email-confirmation'],
        },
      ],
    },
  };

  const batchCreateExample: WorkspaceChatStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared a story breakdown you can apply selectively.',
    actions: [
      {
        kind: 'create_batch_tasks',
        title: 'Checkout flow breakdown',
        summary: 'These tasks cover the main delivery slices.',
        target: { kind: 'story', id: 'story-id' },
        items: [
          {
            title: 'Validate payment form states',
            description: 'Cover empty, invalid, and declined-card states.',
            priority: 'high',
            elementStatus: 'pending',
          },
          {
            title: 'Add order review step',
            priority: 'medium',
            elementStatus: 'defined',
          },
        ],
      },
    ],
  };

  const dependencySuggestionExample: WorkspaceChatStructuredReplyEnvelope = {
    replyMarkdown: 'I found two useful non-hierarchical links.',
    actions: [
      {
        kind: 'suggest_relations',
        title: 'Suggested relations',
        relations: [
          {
            fromId: 'task-payment-form',
            toId: 'task-order-review',
            relationType: 'blocks',
            reason: 'Order review should wait until payment validation is complete.',
          },
        ],
      },
    ],
  };

  const updateSuggestionExample: WorkspaceChatStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared two refinements to make the story more actionable.',
    actions: [
      {
        kind: 'suggest_updates',
        title: 'Suggested refinements',
        updates: [
          {
            elementId: 'story-id',
            patch: {
              title: 'Checkout validation flow',
              priority: 'high',
            },
            reason:
              'The current title is broad and does not reflect the actual implementation slice.',
          },
        ],
      },
    ],
  };

  return {
    singleActionsExample,
    batchCreateExample,
    dependencySuggestionExample,
    updateSuggestionExample,
  };
}

export function getWorkspaceChatCreateTargetRules(): string[] {
  return [
    `- ${getWorkspaceChatActionEntityLabel('create_task')}: target.kind may be "story" or "canvas"`,
    `- ${getWorkspaceChatActionEntityLabel('create_story')}: target.kind may be "goal" or "canvas"`,
    `- ${getWorkspaceChatActionEntityLabel('create_goal')}: target.kind must be "canvas"`,
  ];
}
