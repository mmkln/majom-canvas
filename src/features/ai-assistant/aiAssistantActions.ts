import type { UiPriority } from '../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantConnectionRelationType,
  AiAssistantElementKind,
} from './aiAssistantEvents.ts';
import type { I18nService } from '../../i18n/index.ts';

export type AiAssistantCreateActionKind =
  | 'create_task'
  | 'create_story'
  | 'create_goal';

export type AiAssistantActionConfirmationMode =
  | 'none'
  | 'single'
  | 'batch'
  | 'follow-up';

export type AiAssistantCreateGoalsItem = {
  title: string;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
  target?: AiAssistantActionTarget;
  supportedBy?: string[];
  evidenceIds?: string[];
  sourceContext?: string;
};

export type AiAssistantActionKind =
  | AiAssistantCreateActionKind
  | 'create_goals'
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
  confirmationMode?: AiAssistantActionConfirmationMode;
  errorMessage?: string;
  createdElementId?: string;
  affectedElementIds?: string[];
  supportedBy?: string[];
  evidenceIds?: string[];
  sourceContext?: string;
};

export type AiAssistantCreateAction = AiAssistantActionBase & {
  kind: AiAssistantCreateActionKind;
  description?: string;
  priority?: UiPriority;
  elementStatus?: AiAssistantCreateElementStatus;
  target?: AiAssistantActionTarget;
};

export type AiAssistantCreateGoalsAction = AiAssistantActionBase & {
  kind: 'create_goals';
  target?: AiAssistantActionTarget;
  items: AiAssistantCreateGoalsItem[];
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
  | AiAssistantCreateGoalsAction
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

type AiAssistantActionI18n = Pick<I18nService, 't'>;

export function getAiAssistantActionLabel(
  kind: AiAssistantActionKind,
  i18n?: AiAssistantActionI18n
): string {
  switch (kind) {
    case 'create_task':
      return i18n?.t('aiChat.actionLabel.createTask') ?? 'Create task';
    case 'create_story':
      return i18n?.t('aiChat.actionLabel.createStory') ?? 'Create story';
    case 'create_goal':
      return i18n?.t('aiChat.actionLabel.createGoal') ?? 'Create goal';
    case 'create_goals':
      return i18n?.t('aiChat.actionLabel.createGoals') ?? 'Create goals';
    case 'create_goal_blueprint':
      return i18n?.t('aiChat.actionLabel.createPlan') ?? 'Create plan';
    case 'suggest_relation':
      return i18n?.t('aiChat.actionLabel.addRelation') ?? 'Add relation';
    case 'remove_relation':
      return i18n?.t('aiChat.actionLabel.removeRelation') ?? 'Remove relation';
    case 'update_relation':
      return i18n?.t('aiChat.actionLabel.updateRelation') ?? 'Update relation';
    case 'suggest_update':
      return i18n?.t('aiChat.actionLabel.applyUpdate') ?? 'Apply update';
  }
}

type AiAssistantActionGroupButtonLabelOptions = {
  singleActionMode?: 'action-label' | 'generic';
};

export function getAiAssistantActionGroupButtonLabel(
  actions: AiAssistantAction[],
  options: AiAssistantActionGroupButtonLabelOptions = {},
  i18n?: AiAssistantActionI18n
): string {
  const actionableActions = actions.filter(
    (action) => action.status !== 'applied' && action.status !== 'applying'
  );
  const candidateActions =
    actionableActions.length > 0 ? actionableActions : actions;

  if (candidateActions.length === 0) {
    return i18n?.t('aiChat.actionButton.confirm') ?? 'Confirm';
  }

  if (candidateActions.length === 1) {
    const action = candidateActions[0];
    if (!action) {
      return i18n?.t('aiChat.actionButton.confirm') ?? 'Confirm';
    }

    if (options.singleActionMode === 'action-label') {
      return action.kind === 'create_goals'
        ? i18n?.t('aiChat.actionButton.createAll') ?? 'Create all'
        : getAiAssistantActionLabel(action.kind, i18n) ||
            i18n?.t('aiChat.actionButton.confirm') ||
            'Confirm';
    }

    if (action.status === 'failed') {
      return i18n?.t('common.retry') ?? 'Retry';
    }

    switch (action.kind) {
      case 'create_goal_blueprint':
        return i18n?.t('aiChat.actionLabel.createPlan') ?? 'Create plan';
      case 'create_goals':
        return i18n?.t('aiChat.actionButton.createAll') ?? 'Create all';
      case 'create_task':
      case 'create_story':
      case 'create_goal':
        return i18n?.t('common.create') ?? 'Create';
      case 'suggest_relation':
      case 'remove_relation':
      case 'update_relation':
      case 'suggest_update':
      default:
        return i18n?.t('aiChat.actionButton.apply') ?? 'Apply';
    }
  }

  if (candidateActions.every((action) => action.status === 'failed')) {
    return i18n?.t('aiChat.actionButton.retryAll') ?? 'Retry all';
  }

  const kinds = new Set(candidateActions.map((action) => action.kind));
  if (kinds.size !== 1) {
    return i18n?.t('aiChat.actionButton.confirmAll') ?? 'Confirm all';
  }

  switch (candidateActions[0]?.kind) {
    case 'create_task':
    case 'create_story':
    case 'create_goal':
    case 'create_goals':
      return i18n?.t('aiChat.actionButton.createAll') ?? 'Create all';
    case 'suggest_relation':
    case 'remove_relation':
    case 'update_relation':
    case 'suggest_update':
      return i18n?.t('aiChat.actionButton.applyAll') ?? 'Apply all';
    case 'create_goal_blueprint':
    default:
      return i18n?.t('aiChat.actionButton.confirmAll') ?? 'Confirm all';
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
    value === 'create_goals' ||
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

export function isAiAssistantActionConfirmationMode(
  value: unknown
): value is AiAssistantActionConfirmationMode {
  return (
    value === 'none' ||
    value === 'single' ||
    value === 'batch' ||
    value === 'follow-up'
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
