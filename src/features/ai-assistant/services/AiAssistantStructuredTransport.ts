import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantActionTarget,
  AiAssistantCreateActionKind,
  AiAssistantCreateElementStatus,
  AiAssistantGoalBlueprintGoal,
  AiAssistantGoalBlueprintPattern,
  AiAssistantGoalBlueprintRelation,
  AiAssistantRelationSuggestionType,
  AiAssistantReviewFindings,
  AiAssistantUpdatePatch,
} from '../aiAssistantActions.ts';
import {
  getAiAssistantActionEntityLabel,
  type AiAssistantActionKind,
} from '../aiAssistantActions.ts';

export type AiAssistantStructuredActionEntryKind =
  | AiAssistantActionKind
  | 'create_goals'
  | 'create_batch_tasks'
  | 'create_batch_stories'
  | 'suggest_relations'
  | 'remove_relations'
  | 'update_relations'
  | 'suggest_updates';

export type AiAssistantStructuredActionEvidence = {
  supportedBy?: string[];
  evidenceIds?: string[];
  sourceContext?: string;
};

export type AiAssistantStructuredCreateActionEntry = {
  kind: AiAssistantCreateActionKind;
  title: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
  target?: AiAssistantActionTarget;
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredCreateBatchItem = Omit<
  AiAssistantStructuredCreateActionEntry,
  'kind' | 'target'
> & {
  target?: AiAssistantActionTarget;
};

export type AiAssistantStructuredCreateBatchEntry = {
  kind: 'create_batch_tasks' | 'create_batch_stories' | 'create_goals';
  title?: string;
  summary?: string;
  description?: string;
  target?: AiAssistantActionTarget;
  items: AiAssistantStructuredCreateBatchItem[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredCreateGoalsItem = Omit<
  AiAssistantStructuredCreateBatchItem,
  'target'
> & {
  target?: AiAssistantActionTarget;
};

export type AiAssistantStructuredGoalBlueprintEntry = {
  kind: 'create_goal_blueprint';
  title?: string;
  summary?: string;
  assumptions?: string[];
  target?: { kind: 'canvas' } | { kind: 'goal'; id: string };
  pattern: AiAssistantGoalBlueprintPattern;
  goals: AiAssistantGoalBlueprintGoal[];
  relations?: AiAssistantGoalBlueprintRelation[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredRelationSuggestion = {
  fromId: string;
  toId: string;
  relationType: AiAssistantRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type AiAssistantStructuredRelationActionEntry = {
  kind: 'suggest_relation';
  title?: string;
  fromId: string;
  toId: string;
  relationType: AiAssistantRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredRemoveRelationActionEntry = {
  kind: 'remove_relation';
  title?: string;
  fromId: string;
  toId: string;
  relationType: AiAssistantRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredRelationBatchEntry = {
  kind: 'suggest_relations';
  title?: string;
  summary?: string;
  description?: string;
  relations: AiAssistantStructuredRelationSuggestion[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredRemoveRelationBatchEntry = {
  kind: 'remove_relations';
  title?: string;
  summary?: string;
  description?: string;
  relations: AiAssistantStructuredRelationSuggestion[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredRelationTypeChange = {
  fromId: string;
  toId: string;
  currentRelationType: AiAssistantRelationSuggestionType;
  nextRelationType: AiAssistantRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type AiAssistantStructuredUpdateRelationActionEntry = {
  kind: 'update_relation';
  title?: string;
  fromId: string;
  toId: string;
  currentRelationType: AiAssistantRelationSuggestionType;
  nextRelationType: AiAssistantRelationSuggestionType;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredUpdateRelationBatchEntry = {
  kind: 'update_relations';
  title?: string;
  summary?: string;
  description?: string;
  relations: AiAssistantStructuredRelationTypeChange[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredUpdateSuggestion = {
  elementId: string;
  patch: AiAssistantUpdatePatch;
  reason?: string;
  targetTitle?: string;
};

export type AiAssistantStructuredUpdateActionEntry = {
  kind: 'suggest_update';
  title?: string;
  elementId: string;
  patch: AiAssistantUpdatePatch;
  reason?: string;
  targetTitle?: string;
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredUpdateBatchEntry = {
  kind: 'suggest_updates';
  title?: string;
  summary?: string;
  description?: string;
  updates: AiAssistantStructuredUpdateSuggestion[];
} & AiAssistantStructuredActionEvidence;

export type AiAssistantStructuredActionEntry =
  | AiAssistantStructuredCreateActionEntry
  | AiAssistantStructuredCreateBatchEntry
  | AiAssistantStructuredGoalBlueprintEntry
  | AiAssistantStructuredRelationActionEntry
  | AiAssistantStructuredRelationBatchEntry
  | AiAssistantStructuredRemoveRelationActionEntry
  | AiAssistantStructuredRemoveRelationBatchEntry
  | AiAssistantStructuredUpdateRelationActionEntry
  | AiAssistantStructuredUpdateRelationBatchEntry
  | AiAssistantStructuredUpdateActionEntry
  | AiAssistantStructuredUpdateBatchEntry;

export type AiAssistantStructuredReplyEnvelope = {
  replyMarkdown?: string;
  actions?: AiAssistantStructuredActionEntry[];
  reviewFindings?: AiAssistantReviewFindings;
};

export const AI_ASSISTANT_STRUCTURED_ENVELOPE_SHAPE =
  '{"replyMarkdown":"<markdown reply>","actions":[...],"reviewFindings":{"title":"...","summary":"...","readinessScore":72,"readinessVerdict":"...","findings":[...]}}';

export const AI_ASSISTANT_STRUCTURED_ACTION_KIND_NOTES = [
  '- reviewFindings: for review, readiness, missing work, overlaps, weak decomposition, orphaned items, or planning gaps.',
  '- create_task / create_story / create_goal: for single clear create proposals.',
  '- create_goals: for proposing several top-level strategic goals at once.',
  '- create_goal_blueprint: for one confirm-first strategic plan skeleton with goals, hierarchy, and optional leads_to links.',
  '- create_batch_tasks: for decomposing a story or cluster into multiple tasks.',
  '- create_batch_stories: for decomposing a goal into multiple stories.',
  '- suggest_relations: for non-hierarchical dependency or sequencing suggestions.',
  '- remove_relations: for removing incorrect non-hierarchical links that already exist on the canvas.',
  '- update_relations: for changing the type of an existing non-hierarchical link that should stay but with a different meaning.',
  '- suggest_updates: for title, description, priority, or status refinements to existing items.',
  '- optional evidence metadata such as supportedBy, evidenceIds, and sourceContext may be attached to an action when it helps reviewability.',
];

export function isAiAssistantStructuredActionEntryKind(
  value: unknown
): value is AiAssistantStructuredActionEntryKind {
  return (
    value === 'create_task' ||
    value === 'create_story' ||
    value === 'create_goal' ||
    value === 'create_goal_blueprint' ||
    value === 'suggest_relation' ||
    value === 'remove_relation' ||
    value === 'update_relation' ||
    value === 'suggest_update' ||
    value === 'create_goals' ||
    value === 'create_batch_tasks' ||
    value === 'create_batch_stories' ||
    value === 'suggest_relations' ||
    value === 'remove_relations' ||
    value === 'update_relations' ||
    value === 'suggest_updates'
  );
}

export function isAiAssistantStructuredReplyEnvelopeLike(
  value: unknown
): value is AiAssistantStructuredReplyEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as AiAssistantStructuredReplyEnvelope;
  return (
    typeof envelope.replyMarkdown === 'string' ||
    Array.isArray(envelope.actions) ||
    (envelope.reviewFindings !== undefined &&
      envelope.reviewFindings !== null &&
      typeof envelope.reviewFindings === 'object')
  );
}

export function getAiAssistantStructuredReplyExamples() {
  const singleActionsExample: AiAssistantStructuredReplyEnvelope = {
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
        supportedBy: ['goal-1'],
        sourceContext: 'Selected goal summary',
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

  const batchCreateExample: AiAssistantStructuredReplyEnvelope = {
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

  const strategicGoalsExample: AiAssistantStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared a strategic goal set you can create together.',
    actions: [
      {
        kind: 'create_goals',
        title: 'Strategic goals',
        summary: 'These top-level goals cover the main planning tracks.',
        items: [
          {
            title: 'Learn the fundamentals of marketing automation',
            priority: 'high',
            elementStatus: 'defined',
          },
          {
            title: 'Build first automated lifecycle flows',
            priority: 'high',
            elementStatus: 'defined',
          },
        ],
      },
    ],
  };

  const strategicBlueprintExample: AiAssistantStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared a strategic plan blueprint you can create in one step.',
    actions: [
      {
        kind: 'create_goal_blueprint',
        title: 'Strategic marketing automation plan',
        summary: 'One umbrella goal, several subgoals, and a few sequence links.',
        pattern: 'goal_tree_with_sequence',
        goals: [
          {
            ref: 'root',
            title: 'Master marketing automation strategically',
            priority: 'highest',
            elementStatus: 'defined',
          },
          {
            ref: 'fundamentals',
            parentRef: 'root',
            title: 'Learn automation fundamentals',
            priority: 'high',
            elementStatus: 'defined',
          },
          {
            ref: 'flows',
            parentRef: 'root',
            title: 'Build first lifecycle flows',
            priority: 'high',
            elementStatus: 'defined',
          },
        ],
        relations: [
          {
            fromRef: 'fundamentals',
            toRef: 'flows',
            relationType: 'leads_to',
            reason: 'Core principles should inform the first implementation flow.',
          },
        ],
      },
    ],
  };

  const dependencySuggestionExample: AiAssistantStructuredReplyEnvelope = {
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

  const dependencyRemovalExample: AiAssistantStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared one relation cleanup you can confirm.',
    actions: [
      {
        kind: 'remove_relations',
        title: 'Relations to remove',
        relations: [
          {
            fromId: 'task-payment-form',
            toId: 'task-order-review',
            relationType: 'blocks',
            reason:
              'This blocker link no longer matches the current sequence and adds noise to the dependency model.',
          },
        ],
      },
    ],
  };

  const dependencyUpdateExample: AiAssistantStructuredReplyEnvelope = {
    replyMarkdown: 'I prepared one relation type change you can confirm.',
    actions: [
      {
        kind: 'update_relations',
        title: 'Relation type changes',
        relations: [
          {
            fromId: 'task-payment-form',
            toId: 'task-order-review',
            currentRelationType: 'relates_to',
            nextRelationType: 'blocks',
            reason:
              'This link is not just related work anymore; payment validation now clearly blocks order review.',
          },
        ],
      },
    ],
  };

  const updateSuggestionExample: AiAssistantStructuredReplyEnvelope = {
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
    strategicGoalsExample,
    strategicBlueprintExample,
    dependencySuggestionExample,
    dependencyRemovalExample,
    dependencyUpdateExample,
    updateSuggestionExample,
  };
}

export function getAiAssistantCreateTargetRules(): string[] {
  return [
    `- ${getAiAssistantActionEntityLabel('create_task')}: target.kind may be "story" or "canvas"`,
    `- ${getAiAssistantActionEntityLabel('create_story')}: target.kind may be "goal" or "canvas"`,
    `- ${getAiAssistantActionEntityLabel('create_goal')}: target.kind may be "goal" or "canvas"`,
    '- create_goals may target the canvas or a goal and its items inherit the same anchor unless overridden',
    '- create_goal_blueprint may target the canvas or a goal and resolves any internal hierarchy or leads_to links atomically',
  ];
}
