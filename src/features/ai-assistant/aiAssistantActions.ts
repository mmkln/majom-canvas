import type { UiPriority } from '../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantConnectionRelationType,
  AiAssistantElementKind,
} from './aiAssistantEvents.ts';

export type AiAssistantCreateActionKind =
  | 'create_task'
  | 'create_story'
  | 'create_goal';

export type AiAssistantActionKind =
  | AiAssistantCreateActionKind
  | 'create_goal_blueprint'
  | 'suggest_relation'
  | 'remove_relation'
  | 'update_relation'
  | 'suggest_update';

export type AiAssistantCreateElementStatus =
  | 'defined'
  | 'pending'
  | 'in-progress'
  | 'done';

export type AiAssistantActionStatus =
  | 'idle'
  | 'applying'
  | 'applied'
  | 'failed';

export type AiAssistantActionTarget =
  | { kind: 'canvas' }
  | { kind: 'story'; id: string }
  | { kind: 'goal'; id: string };

export type AiAssistantActionGroup = {
  groupId?: string;
  groupTitle?: string;
  groupSummary?: string;
};

type AiAssistantActionBase = AiAssistantActionGroup & {
  id: string;
  kind: AiAssistantActionKind;
  label: string;
  title: string;
  status: AiAssistantActionStatus;
  errorMessage?: string;
  createdElementId?: string;
  affectedElementIds?: string[];
};

export type AiAssistantCreateAction = AiAssistantActionBase & {
  kind: AiAssistantCreateActionKind;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
  target?: AiAssistantActionTarget;
};

export type AiAssistantGoalBlueprintPattern =
  | 'goal_tree'
  | 'goal_tree_with_sequence'
  | 'goal_graph';

export type AiAssistantGoalBlueprintGoal = {
  ref: string;
  title: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
  parentRef?: string;
};

export type AiAssistantGoalBlueprintRelation = {
  fromRef: string;
  toRef: string;
  relationType: 'leads_to';
  reason?: string;
};

export type AiAssistantGoalBlueprintAction = AiAssistantActionBase & {
  kind: 'create_goal_blueprint';
  target?: { kind: 'canvas' } | { kind: 'goal'; id: string };
  pattern: AiAssistantGoalBlueprintPattern;
  summary?: string;
  assumptions?: string[];
  goals: AiAssistantGoalBlueprintGoal[];
  relations: AiAssistantGoalBlueprintRelation[];
};

export type AiAssistantRelationSuggestionType = Exclude<
  AiAssistantConnectionRelationType,
  'parent_child'
>;

type AiAssistantRelationActionBase = AiAssistantActionBase & {
  relationType: AiAssistantRelationSuggestionType;
  fromId: string;
  toId: string;
  fromLabel?: string;
  toLabel?: string;
  reason?: string;
};

export type AiAssistantRelationAction = AiAssistantRelationActionBase & {
  kind: 'suggest_relation';
};

export type AiAssistantRemoveRelationAction =
  AiAssistantRelationActionBase & {
    kind: 'remove_relation';
  };

export type AiAssistantUpdateRelationAction =
  AiAssistantActionBase & {
    kind: 'update_relation';
    fromId: string;
    toId: string;
    fromLabel?: string;
    toLabel?: string;
    currentRelationType: AiAssistantRelationSuggestionType;
    nextRelationType: AiAssistantRelationSuggestionType;
    reason?: string;
  };

export type AiAssistantUpdatePatch = {
  title?: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
};

export type AiAssistantUpdateAction = AiAssistantActionBase & {
  kind: 'suggest_update';
  elementId: string;
  elementKind: AiAssistantElementKind;
  targetTitle?: string;
  patch: AiAssistantUpdatePatch;
  reason?: string;
};

export type AiAssistantAction =
  | AiAssistantCreateAction
  | AiAssistantGoalBlueprintAction
  | AiAssistantRelationAction
  | AiAssistantRemoveRelationAction
  | AiAssistantUpdateRelationAction
  | AiAssistantUpdateAction;

export type AiAssistantReviewFindingSeverity = 'low' | 'medium' | 'high';

export type AiAssistantReviewFinding = {
  id: string;
  severity: AiAssistantReviewFindingSeverity;
  category: string;
  title: string;
  detail: string;
  targetIds?: string[];
};

export type AiAssistantReviewFindings = {
  title: string;
  summary?: string;
  readinessScore?: number;
  readinessVerdict?: string;
  findings: AiAssistantReviewFinding[];
};

export type AiAssistantStructuredReply = {
  replyMarkdown: string;
  actions: AiAssistantAction[];
  reviewFindings?: AiAssistantReviewFindings;
};

export type AiAssistantActionExecutionRequest = {
  action: AiAssistantAction;
  allowSelectionTargeting: boolean;
};

export type AiAssistantActionExecutionResult = {
  status: 'applied' | 'failed';
  createdElementId?: string;
  affectedElementIds?: string[];
  errorMessage?: string;
};

export type AiAssistantActionExecutor = (
  request: AiAssistantActionExecutionRequest
) => Promise<AiAssistantActionExecutionResult>;

export type AiAssistantActionExecutionHandler = AiAssistantActionExecutor & {
  executeBatch?: (
    requests: AiAssistantActionExecutionRequest[]
  ) => Promise<AiAssistantActionExecutionResult[]>;
};

export function getAiAssistantActionLabel(
  kind: AiAssistantActionKind
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

export function getAiAssistantActionEntityLabel(
  kind: AiAssistantCreateActionKind
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

export function isAiAssistantActionKind(
  value: unknown
): value is AiAssistantActionKind {
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

export function isAiAssistantActionStatus(
  value: unknown
): value is AiAssistantActionStatus {
  return (
    value === 'idle' ||
    value === 'applying' ||
    value === 'applied' ||
    value === 'failed'
  );
}

export function isAiAssistantCreateElementStatus(
  value: unknown
): value is AiAssistantCreateElementStatus {
  return (
    value === 'defined' ||
    value === 'pending' ||
      value === 'in-progress' ||
      value === 'done'
  );
}

export function isAiAssistantRelationSuggestionType(
  value: unknown
): value is AiAssistantRelationSuggestionType {
  return (
    value === 'blocks' ||
    value === 'leads_to' ||
    value === 'relates_to'
  );
}

export function isAiAssistantReviewFindingSeverity(
  value: unknown
): value is AiAssistantReviewFindingSeverity {
  return value === 'low' || value === 'medium' || value === 'high';
}
