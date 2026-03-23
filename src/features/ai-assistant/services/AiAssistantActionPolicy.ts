import type { AiAssistantActionKind } from '../aiAssistantActions.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantContextPlanner.ts';
import type { AiAssistantStructuredActionEntryKind } from './AiAssistantStructuredTransport.ts';

const STRUCTURED_ACTION_KIND_LABELS: Record<
  AiAssistantStructuredActionEntryKind | 'reviewFindings',
  string
> = {
  reviewFindings: 'reviewFindings',
  create_task: 'create_task',
  create_story: 'create_story',
  create_goal: 'create_goal',
  create_goal_blueprint: 'create_goal_blueprint',
  create_goals: 'create_goals',
  create_batch_tasks: 'create_batch_tasks',
  create_batch_stories: 'create_batch_stories',
  suggest_relation: 'suggest_relation',
  suggest_relations: 'suggest_relations',
  remove_relation: 'remove_relation',
  remove_relations: 'remove_relations',
  update_relation: 'update_relation',
  update_relations: 'update_relations',
  suggest_update: 'suggest_update',
  suggest_updates: 'suggest_updates',
};

const STRUCTURED_TO_RUNTIME_ACTION_KIND: Partial<
  Record<AiAssistantStructuredActionEntryKind, AiAssistantActionKind>
> = {
  create_batch_tasks: 'create_task',
  create_batch_stories: 'create_story',
  suggest_relations: 'suggest_relation',
  remove_relations: 'remove_relation',
  update_relations: 'update_relation',
  suggest_updates: 'suggest_update',
};

export function resolveAiAssistantActionKindsForIntent(
  intent: AiAssistantIntentKind | undefined
): AiAssistantActionKind[] | null {
  switch (intent) {
    case 'dependencies':
      return ['suggest_relation', 'remove_relation', 'update_relation'];
    case 'clarify':
    case 'fill_details':
      return ['suggest_update'];
    case 'missing':
    case 'review':
      return ['suggest_relation', 'remove_relation', 'update_relation', 'suggest_update'];
    case 'breakdown':
      return ['create_task', 'create_story', 'suggest_update'];
    case 'strategic_plan':
      return ['create_goals', 'create_goal_blueprint'];
    default:
      return null;
  }
}

export function resolveAiAssistantStructuredReplyKindsForIntent(
  intent: AiAssistantIntentKind | undefined
): Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'> | null {
  switch (intent) {
    case 'dependencies':
      return [
        'suggest_relation',
        'suggest_relations',
        'remove_relation',
        'remove_relations',
        'update_relation',
        'update_relations',
      ];
    case 'clarify':
    case 'fill_details':
      return ['suggest_update', 'suggest_updates'];
    case 'missing':
      return ['reviewFindings', 'suggest_relation', 'suggest_relations', 'remove_relation', 'remove_relations', 'update_relation', 'update_relations', 'suggest_update', 'suggest_updates'];
    case 'review':
      return ['reviewFindings', 'suggest_relation', 'suggest_relations', 'remove_relation', 'remove_relations', 'update_relation', 'update_relations', 'suggest_update', 'suggest_updates'];
    case 'breakdown':
      return [
        'create_task',
        'create_story',
        'create_batch_tasks',
        'create_batch_stories',
        'suggest_update',
        'suggest_updates',
      ];
    case 'strategic_plan':
      return ['create_goals', 'create_goal_blueprint'];
    default:
      return null;
  }
}

export function resolveAiAssistantStructuredReplyKindsForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'> | null {
  if (!scenario) {
    return null;
  }

  if (scenario.kind === 'breakdown') {
    if (scenario.mode === 'goal_stories') {
      return ['create_story', 'create_batch_stories'];
    }
    if (scenario.mode === 'story_tasks') {
      return ['create_task', 'create_batch_tasks'];
    }
    if (scenario.mode === 'task_refine') {
      return ['suggest_update', 'suggest_updates'];
    }
    return [];
  }

  return scenario.allowedActions as Array<
    AiAssistantStructuredActionEntryKind | 'reviewFindings'
  >;
}

export function resolveAiAssistantActionKindsForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): AiAssistantActionKind[] | null {
  if (!scenario) {
    return null;
  }

  return scenario.allowedActions
    .map((kind) =>
      (STRUCTURED_TO_RUNTIME_ACTION_KIND[kind as AiAssistantStructuredActionEntryKind] ??
        kind) as AiAssistantActionKind
    )
    .filter((kind, index, kinds): kind is AiAssistantActionKind =>
      kinds.indexOf(kind) === index
    );
}

export function describeAiAssistantStructuredReplyKindsForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): string | null {
  const allowedKinds = resolveAiAssistantStructuredReplyKindsForScenario(
    scenario
  );
  if (!allowedKinds || allowedKinds.length === 0) {
    return null;
  }
  return allowedKinds
    .map((kind) => STRUCTURED_ACTION_KIND_LABELS[kind])
    .join(', ');
}

export function describeAiAssistantStructuredReplyKinds(
  intent: AiAssistantIntentKind | undefined
): string | null {
  const allowedKinds = resolveAiAssistantStructuredReplyKindsForIntent(intent);
  if (!allowedKinds || allowedKinds.length === 0) {
    return null;
  }
  return allowedKinds
    .map((kind) => STRUCTURED_ACTION_KIND_LABELS[kind])
    .join(', ');
}
