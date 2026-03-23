import type { AiAssistantActionKind } from '../aiAssistantActions.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
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

const STRUCTURED_ACTION_KIND_EXPANSIONS: Partial<
  Record<
    AiAssistantStructuredActionEntryKind,
    Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'>
  >
> = {
  create_batch_tasks: ['create_task', 'create_batch_tasks'],
  create_batch_stories: ['create_story', 'create_batch_stories'],
  suggest_relation: ['suggest_relation', 'suggest_relations'],
  remove_relation: ['remove_relation', 'remove_relations'],
  update_relation: ['update_relation', 'update_relations'],
  suggest_update: ['suggest_update', 'suggest_updates'],
};

export function resolveAiAssistantStructuredReplyKindsForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'> | null {
  if (!scenario) {
    return null;
  }
  const expandedKinds = scenario.allowedActions.reduce<
    Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'>
  >((kinds, kind) => {
    kinds.push(...(STRUCTURED_ACTION_KIND_EXPANSIONS[kind] ?? [kind]));
    return kinds;
  }, []);
  return uniqueStructuredReplyKinds(expandedKinds);
}

export function resolveAiAssistantActionKindsForScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): AiAssistantActionKind[] | null {
  if (!scenario) {
    return null;
  }

  return scenario.allowedActions
    .map(mapStructuredKindToRuntimeKind)
    .filter((kind, index, kinds): kind is AiAssistantActionKind =>
      kinds.indexOf(kind) === index
    );
}

function mapStructuredKindToRuntimeKind(
  kind: AiAssistantStructuredActionEntryKind
): AiAssistantActionKind {
  return (STRUCTURED_TO_RUNTIME_ACTION_KIND[kind] ?? kind) as AiAssistantActionKind;
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

function uniqueStructuredReplyKinds(
  kinds: Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'>
): Array<AiAssistantStructuredActionEntryKind | 'reviewFindings'> {
  return kinds.filter((kind, index) => kinds.indexOf(kind) === index);
}
