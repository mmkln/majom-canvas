import type { WorkspaceChatActionKind } from '../workspaceChatActions.ts';
import type { WorkspaceChatIntentKind } from '../workspaceChatEvents.ts';
import type { WorkspaceChatStructuredActionEntryKind } from './WorkspaceChatStructuredTransport.ts';

const STRUCTURED_ACTION_KIND_LABELS: Record<
  WorkspaceChatStructuredActionEntryKind | 'reviewFindings',
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

export function resolveWorkspaceChatActionKindsForIntent(
  intent: WorkspaceChatIntentKind | undefined
): WorkspaceChatActionKind[] | null {
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
      return ['create_goal', 'create_goal_blueprint'];
    default:
      return null;
  }
}

export function resolveWorkspaceChatStructuredReplyKindsForIntent(
  intent: WorkspaceChatIntentKind | undefined
): Array<WorkspaceChatStructuredActionEntryKind | 'reviewFindings'> | null {
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

export function describeWorkspaceChatStructuredReplyKinds(
  intent: WorkspaceChatIntentKind | undefined
): string | null {
  const allowedKinds = resolveWorkspaceChatStructuredReplyKindsForIntent(intent);
  if (!allowedKinds || allowedKinds.length === 0) {
    return null;
  }
  return allowedKinds
    .map((kind) => STRUCTURED_ACTION_KIND_LABELS[kind])
    .join(', ');
}
