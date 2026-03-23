import type { UiPriority } from '../../majom-wrapper/utils/priorityMapping.ts';
import type {
  WorkspaceChatConnectionRelationType,
  WorkspaceChatElementKind,
} from './workspaceChatEvents.ts';

export type WorkspaceChatCreateActionKind =
  | 'create_task'
  | 'create_story'
  | 'create_goal';

export type WorkspaceChatActionKind =
  | WorkspaceChatCreateActionKind
  | 'create_goal_blueprint'
  | 'suggest_relation'
  | 'remove_relation'
  | 'update_relation'
  | 'suggest_update';

export type WorkspaceChatCreateElementStatus =
  | 'defined'
  | 'pending'
  | 'in-progress'
  | 'done';

export type WorkspaceChatActionStatus =
  | 'idle'
  | 'applying'
  | 'applied'
  | 'failed';

export type WorkspaceChatActionTarget =
  | { kind: 'canvas' }
  | { kind: 'story'; id: string }
  | { kind: 'goal'; id: string };

export type WorkspaceChatActionGroup = {
  groupId?: string;
  groupTitle?: string;
  groupSummary?: string;
};

type WorkspaceChatActionBase = WorkspaceChatActionGroup & {
  id: string;
  kind: WorkspaceChatActionKind;
  label: string;
  title: string;
  status: WorkspaceChatActionStatus;
  errorMessage?: string;
  createdElementId?: string;
  affectedElementIds?: string[];
};

export type WorkspaceChatCreateAction = WorkspaceChatActionBase & {
  kind: WorkspaceChatCreateActionKind;
  description?: string;
  priority?: UiPriority;
  elementStatus?: WorkspaceChatCreateElementStatus;
  target?: WorkspaceChatActionTarget;
};

export type WorkspaceChatGoalBlueprintPattern =
  | 'goal_tree'
  | 'goal_tree_with_sequence'
  | 'goal_graph';

export type WorkspaceChatGoalBlueprintGoal = {
  ref: string;
  title: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: WorkspaceChatCreateElementStatus;
  parentRef?: string;
};

export type WorkspaceChatGoalBlueprintRelation = {
  fromRef: string;
  toRef: string;
  relationType: 'leads_to';
  reason?: string;
};

export type WorkspaceChatGoalBlueprintAction = WorkspaceChatActionBase & {
  kind: 'create_goal_blueprint';
  target?: { kind: 'canvas' } | { kind: 'goal'; id: string };
  pattern: WorkspaceChatGoalBlueprintPattern;
  summary?: string;
  assumptions?: string[];
  goals: WorkspaceChatGoalBlueprintGoal[];
  relations: WorkspaceChatGoalBlueprintRelation[];
};

export type WorkspaceChatRelationSuggestionType = Exclude<
  WorkspaceChatConnectionRelationType,
  'parent_child'
>;

type WorkspaceChatRelationActionBase = WorkspaceChatActionBase & {
  relationType: WorkspaceChatRelationSuggestionType;
  fromId: string;
  toId: string;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type WorkspaceChatRelationAction = WorkspaceChatRelationActionBase & {
  kind: 'suggest_relation';
};

export type WorkspaceChatRemoveRelationAction =
  WorkspaceChatRelationActionBase & {
    kind: 'remove_relation';
  };

export type WorkspaceChatUpdateRelationAction =
  WorkspaceChatActionBase & {
    kind: 'update_relation';
    fromId: string;
    toId: string;
    fromLabel?: string;
    toLabel?: string;
    currentRelationType: WorkspaceChatRelationSuggestionType;
    nextRelationType: WorkspaceChatRelationSuggestionType;
    reason?: string;
  };

export type WorkspaceChatUpdatePatch = {
  title?: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: WorkspaceChatCreateElementStatus;
};

export type WorkspaceChatUpdateAction = WorkspaceChatActionBase & {
  kind: 'suggest_update';
  elementId: string;
  elementKind: WorkspaceChatElementKind;
  targetTitle?: string;
  patch: WorkspaceChatUpdatePatch;
  reason?: string;
};

export type WorkspaceChatAction =
  | WorkspaceChatCreateAction
  | WorkspaceChatGoalBlueprintAction
  | WorkspaceChatRelationAction
  | WorkspaceChatRemoveRelationAction
  | WorkspaceChatUpdateRelationAction
  | WorkspaceChatUpdateAction;

export type WorkspaceChatReviewFindingSeverity = 'low' | 'medium' | 'high';

export type WorkspaceChatReviewFinding = {
  id: string;
  severity: WorkspaceChatReviewFindingSeverity;
  category: string;
  title: string;
  detail: string;
  targetIds?: string[];
};

export type WorkspaceChatReviewFindings = {
  title: string;
  summary?: string;
  readinessScore?: number;
  readinessVerdict?: string;
  findings: WorkspaceChatReviewFinding[];
};

export type WorkspaceChatStructuredReply = {
  replyMarkdown: string;
  actions: WorkspaceChatAction[];
  reviewFindings?: WorkspaceChatReviewFindings;
};

export type WorkspaceChatActionExecutionRequest = {
  action: WorkspaceChatAction;
  allowSelectionTargeting: boolean;
};

export type WorkspaceChatActionExecutionResult = {
  status: 'applied' | 'failed';
  createdElementId?: string;
  affectedElementIds?: string[];
  errorMessage?: string;
};

export function getWorkspaceChatActionLabel(
  kind: WorkspaceChatActionKind
): string {
  switch (kind) {
    case 'create_task':
      return 'Create task';
    case 'create_story':
      return 'Create story';
    case 'create_goal':
      return 'Create goal';
    case 'create_goal_blueprint':
      return 'Create plan';
    case 'suggest_relation':
      return 'Add relation';
    case 'remove_relation':
      return 'Remove relation';
    case 'update_relation':
      return 'Update relation';
    case 'suggest_update':
      return 'Apply update';
  }
}

export function getWorkspaceChatActionEntityLabel(
  kind: WorkspaceChatCreateActionKind
): 'task' | 'story' | 'goal' {
  switch (kind) {
    case 'create_task':
      return 'task';
    case 'create_story':
      return 'story';
    case 'create_goal':
      return 'goal';
  }
}

export function isWorkspaceChatActionKind(
  value: unknown
): value is WorkspaceChatActionKind {
  return (
    value === 'create_task' ||
    value === 'create_story' ||
    value === 'create_goal' ||
    value === 'create_goal_blueprint' ||
    value === 'suggest_relation' ||
    value === 'remove_relation' ||
    value === 'update_relation' ||
    value === 'suggest_update'
  );
}

export function isWorkspaceChatActionStatus(
  value: unknown
): value is WorkspaceChatActionStatus {
  return (
    value === 'idle' ||
    value === 'applying' ||
    value === 'applied' ||
    value === 'failed'
  );
}

export function isWorkspaceChatCreateElementStatus(
  value: unknown
): value is WorkspaceChatCreateElementStatus {
  return (
    value === 'defined' ||
    value === 'pending' ||
      value === 'in-progress' ||
      value === 'done'
  );
}

export function isWorkspaceChatRelationSuggestionType(
  value: unknown
): value is WorkspaceChatRelationSuggestionType {
  return (
    value === 'blocks' ||
    value === 'leads_to' ||
    value === 'relates_to'
  );
}

export function isWorkspaceChatReviewFindingSeverity(
  value: unknown
): value is WorkspaceChatReviewFindingSeverity {
  return value === 'low' || value === 'medium' || value === 'high';
}
