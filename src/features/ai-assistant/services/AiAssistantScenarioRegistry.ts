import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type {
  AiAssistantScenarioDefinition,
  AiAssistantScenarioId,
} from './AiAssistantScenarioTypes.ts';
import type { AiAssistantStructuredActionEntryKind } from './AiAssistantStructuredTransport.ts';

const TYPED_BATCH_CONFIRMATION = 'batch' as const;
const FALLBACK_SINGLE_CONFIRMATION = 'single' as const;
const FALLBACK_NONE_CONFIRMATION = 'none' as const;

export const AI_ASSISTANT_SCENARIO_REGISTRY: Record<
  AiAssistantScenarioId,
  AiAssistantScenarioDefinition
> = {
  'strategic_plan.canvas_bootstrap': {
    id: 'strategic_plan.canvas_bootstrap',
    kind: 'typed',
    intent: 'strategic_plan',
    mode: 'canvas_bootstrap',
    scope: 'canvas',
    allowedActions: ['create_goals', 'create_goal_blueprint'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'strategic_plan.goal_subgoals': {
    id: 'strategic_plan.goal_subgoals',
    kind: 'typed',
    intent: 'strategic_plan',
    mode: 'goal_subgoals',
    scope: 'item',
    allowedActions: ['create_goals', 'create_goal_blueprint'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'strategic_plan.goal_replan': {
    id: 'strategic_plan.goal_replan',
    kind: 'typed',
    intent: 'strategic_plan',
    mode: 'goal_replan',
    scope: 'item',
    allowedActions: ['create_goals', 'create_goal_blueprint'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'breakdown.goal_stories': {
    id: 'breakdown.goal_stories',
    kind: 'typed',
    intent: 'breakdown',
    mode: 'goal_stories',
    scope: 'item',
    allowedActions: ['create_batch_stories'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'breakdown.story_tasks': {
    id: 'breakdown.story_tasks',
    kind: 'typed',
    intent: 'breakdown',
    mode: 'story_tasks',
    scope: 'item',
    allowedActions: ['create_batch_tasks'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'breakdown.task_refine': {
    id: 'breakdown.task_refine',
    kind: 'typed',
    intent: 'breakdown',
    mode: 'task_refine',
    scope: 'item',
    allowedActions: ['suggest_update'],
    confirmationMode: FALLBACK_SINGLE_CONFIRMATION,
  },
  'breakdown.unspecified_goal_decomposition': {
    id: 'breakdown.unspecified_goal_decomposition',
    kind: 'typed',
    intent: 'breakdown',
    mode: 'unspecified_goal_decomposition',
    scope: 'conversation',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'dependencies.default': {
    id: 'dependencies.default',
    kind: 'typed',
    intent: 'dependencies',
    mode: 'default',
    scope: 'selection',
    allowedActions: ['suggest_relation', 'remove_relation', 'update_relation'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'fill_details.default': {
    id: 'fill_details.default',
    kind: 'typed',
    intent: 'fill_details',
    mode: 'default',
    scope: 'selection',
    allowedActions: ['suggest_update'],
    confirmationMode: TYPED_BATCH_CONFIRMATION,
  },
  'review.default': {
    id: 'review.default',
    kind: 'fallback',
    intent: 'review',
    mode: 'review_selection',
    scope: 'selection',
    allowedActions: ['suggest_relation', 'remove_relation', 'update_relation', 'suggest_update'],
    confirmationMode: FALLBACK_SINGLE_CONFIRMATION,
  },
  'missing.default': {
    id: 'missing.default',
    kind: 'fallback',
    intent: 'missing',
    mode: 'missing_details',
    scope: 'selection',
    allowedActions: ['suggest_relation', 'remove_relation', 'update_relation', 'suggest_update'],
    confirmationMode: FALLBACK_SINGLE_CONFIRMATION,
  },
  'clarify.default': {
    id: 'clarify.default',
    kind: 'fallback',
    intent: 'clarify',
    mode: 'clarify_selection',
    scope: 'selection',
    allowedActions: ['suggest_update'],
    confirmationMode: FALLBACK_SINGLE_CONFIRMATION,
  },
  'next_steps.default': {
    id: 'next_steps.default',
    kind: 'fallback',
    intent: 'next_steps',
    mode: 'next_steps',
    scope: 'canvas',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'recent_changes.default': {
    id: 'recent_changes.default',
    kind: 'fallback',
    intent: 'recent_changes',
    mode: 'recent_changes',
    scope: 'canvas',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'duplicates.default': {
    id: 'duplicates.default',
    kind: 'fallback',
    intent: 'duplicates',
    mode: 'duplicate_review',
    scope: 'canvas',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'general_question.default': {
    id: 'general_question.default',
    kind: 'fallback',
    intent: 'general_question',
    mode: 'general_question',
    scope: 'conversation',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'capability_help.default': {
    id: 'capability_help.default',
    kind: 'fallback',
    intent: 'capability_help',
    mode: 'capability_help',
    scope: 'conversation',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
  'conversation.default': {
    id: 'conversation.default',
    kind: 'fallback',
    intent: null,
    mode: 'conversation',
    scope: 'conversation',
    allowedActions: [],
    confirmationMode: FALLBACK_NONE_CONFIRMATION,
  },
};

export function getAiAssistantScenarioDefinition(
  intent: AiAssistantIntentKind | null | undefined,
  mode?: string
): AiAssistantScenarioDefinition {
  if (!intent) {
    return AI_ASSISTANT_SCENARIO_REGISTRY['conversation.default'];
  }

  if (intent === 'strategic_plan') {
    if (mode === 'goal_subgoals') {
      return AI_ASSISTANT_SCENARIO_REGISTRY['strategic_plan.goal_subgoals'];
    }
    if (mode === 'goal_replan') {
      return AI_ASSISTANT_SCENARIO_REGISTRY['strategic_plan.goal_replan'];
    }
    return AI_ASSISTANT_SCENARIO_REGISTRY['strategic_plan.canvas_bootstrap'];
  }

  if (intent === 'breakdown') {
    if (mode === 'goal_stories') {
      return AI_ASSISTANT_SCENARIO_REGISTRY['breakdown.goal_stories'];
    }
    if (mode === 'story_tasks') {
      return AI_ASSISTANT_SCENARIO_REGISTRY['breakdown.story_tasks'];
    }
    if (mode === 'task_refine') {
      return AI_ASSISTANT_SCENARIO_REGISTRY['breakdown.task_refine'];
    }
    return AI_ASSISTANT_SCENARIO_REGISTRY['breakdown.unspecified_goal_decomposition'];
  }

  switch (intent) {
    case 'dependencies':
      return AI_ASSISTANT_SCENARIO_REGISTRY['dependencies.default'];
    case 'fill_details':
      return AI_ASSISTANT_SCENARIO_REGISTRY['fill_details.default'];
    case 'review':
      return AI_ASSISTANT_SCENARIO_REGISTRY['review.default'];
    case 'missing':
      return AI_ASSISTANT_SCENARIO_REGISTRY['missing.default'];
    case 'clarify':
      return AI_ASSISTANT_SCENARIO_REGISTRY['clarify.default'];
    case 'next_steps':
      return AI_ASSISTANT_SCENARIO_REGISTRY['next_steps.default'];
    case 'recent_changes':
      return AI_ASSISTANT_SCENARIO_REGISTRY['recent_changes.default'];
    case 'duplicates':
      return AI_ASSISTANT_SCENARIO_REGISTRY['duplicates.default'];
    case 'capability_help':
      return AI_ASSISTANT_SCENARIO_REGISTRY['capability_help.default'];
    case 'general_question':
    default:
      return AI_ASSISTANT_SCENARIO_REGISTRY['general_question.default'];
  }
}

export function getAiAssistantScenarioActionKinds(
  intent: AiAssistantIntentKind | null | undefined,
  mode?: string
): AiAssistantStructuredActionEntryKind[] {
  return getAiAssistantScenarioDefinition(intent, mode).allowedActions;
}
