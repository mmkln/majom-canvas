import type { GoalRelationType } from '../../../majom-wrapper/interfaces/index.ts';
import type { AppRuntime } from '../../../app-runtime/index.ts';

export type GoalRelationSemanticOption =
  | 'blocks'
  | 'blocked_by'
  | 'leads_to'
  | 'follows'
  | 'relates_to';

export type GoalRelationSemanticOptionMeta = {
  value: GoalRelationSemanticOption;
  label: string;
  description: string;
  icon: 'arrow-up' | 'arrow-right' | 'slash' | 'link';
  className: string;
};

export type GoalRelationCreatePayload = {
  from_goal_uuid: string;
  to_goal_uuid: string;
  relation_type: GoalRelationType;
};

export type GoalRelationDirection = 'incoming' | 'outgoing';
export type GoalRelationPresentation = {
  icon: 'arrow-up' | 'arrow-right' | 'arrow-down' | 'slash' | 'link';
  label: string;
  className: string;
};

const GOAL_RELATION_SEMANTIC_OPTIONS: readonly GoalRelationSemanticOption[] = [
  'blocks',
  'blocked_by',
  'leads_to',
  'follows',
  'relates_to',
];

export function getGoalRelationSemanticOptions(
  runtime: AppRuntime
): GoalRelationSemanticOptionMeta[] {
  return GOAL_RELATION_SEMANTIC_OPTIONS.map((option) =>
    getGoalRelationSemanticOptionMeta(option, runtime)
  );
}

export function getGoalRelationSemanticOptionMeta(
  option: GoalRelationSemanticOption,
  runtime: AppRuntime
): GoalRelationSemanticOptionMeta {
  switch (option) {
    case 'blocks':
      return {
        value: option,
        label: runtime.i18n.t('planningDetails.goal.addRelation.option.blocks'),
        description: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.blocksHint'
        ),
        icon: 'slash',
        className: 'bg-rose-100/70 text-rose-700',
      };
    case 'blocked_by':
      return {
        value: option,
        label: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.blockedBy'
        ),
        description: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.blockedByHint'
        ),
        icon: 'slash',
        className: 'bg-rose-100/70 text-rose-700',
      };
    case 'leads_to':
      return {
        value: option,
        label: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.leadsTo'
        ),
        description: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.leadsToHint'
        ),
        icon: 'arrow-up',
        className: 'bg-blue-100/70 text-blue-700',
      };
    case 'follows':
      return {
        value: option,
        label: runtime.i18n.t('planningDetails.goal.addRelation.option.follows'),
        description: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.followsHint'
        ),
        icon: 'arrow-right',
        className: 'bg-blue-100/70 text-blue-700',
      };
    case 'relates_to':
    default:
      return {
        value: option,
        label: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.relatesTo'
        ),
        description: runtime.i18n.t(
          'planningDetails.goal.addRelation.option.relatesToHint'
        ),
        icon: 'link',
        className: 'bg-violet-100/70 text-violet-700',
      };
  }
}

export function mapGoalRelationSemanticOptionToPayload(
  currentGoalUuid: string,
  targetGoalUuid: string,
  option: GoalRelationSemanticOption
): GoalRelationCreatePayload {
  switch (option) {
    case 'blocks':
      return {
        from_goal_uuid: currentGoalUuid,
        to_goal_uuid: targetGoalUuid,
        relation_type: 'blocks',
      };
    case 'blocked_by':
      return {
        from_goal_uuid: targetGoalUuid,
        to_goal_uuid: currentGoalUuid,
        relation_type: 'blocks',
      };
    case 'leads_to':
      return {
        from_goal_uuid: currentGoalUuid,
        to_goal_uuid: targetGoalUuid,
        relation_type: 'leads_to',
      };
    case 'follows':
      return {
        from_goal_uuid: targetGoalUuid,
        to_goal_uuid: currentGoalUuid,
        relation_type: 'leads_to',
      };
    case 'relates_to':
    default:
      return currentGoalUuid > targetGoalUuid
        ? {
            from_goal_uuid: targetGoalUuid,
            to_goal_uuid: currentGoalUuid,
            relation_type: 'relates_to',
          }
        : {
            from_goal_uuid: currentGoalUuid,
            to_goal_uuid: targetGoalUuid,
            relation_type: 'relates_to',
          };
  }
}

export function getGoalRelationPreviewText(
  option: GoalRelationSemanticOption | null,
  runtime: AppRuntime
): string {
  switch (option) {
    case 'blocks':
      return runtime.i18n.t('planningDetails.goal.addRelation.previewText.blocks');
    case 'blocked_by':
      return runtime.i18n.t(
        'planningDetails.goal.addRelation.previewText.blockedBy'
      );
    case 'leads_to':
      return runtime.i18n.t(
        'planningDetails.goal.addRelation.previewText.leadsTo'
      );
    case 'follows':
      return runtime.i18n.t('planningDetails.goal.addRelation.previewText.follows');
    case 'relates_to':
      return runtime.i18n.t(
        'planningDetails.goal.addRelation.previewText.relatesTo'
      );
    default:
      return '...';
  }
}

export function getGoalRelationBadgePresentation(
  relationType: GoalRelationType | 'blocks' | 'leads_to' | 'relates_to',
  direction: GoalRelationDirection,
  runtime: AppRuntime
): GoalRelationPresentation {
  switch (relationType) {
    case 'leads_to':
      return {
        icon: direction === 'outgoing' ? 'arrow-right' : 'arrow-up',
        label:
          direction === 'outgoing'
            ? runtime.i18n.t('planningDetails.goal.relatedGoals.relation.follows')
            : runtime.i18n.t('planningDetails.goal.relatedGoals.relation.leadsTo'),
        className: 'bg-blue-50 text-blue-700',
      };
    case 'blocks':
      return {
        icon: 'slash',
        label:
          direction === 'outgoing'
            ? runtime.i18n.t(
                'planningDetails.goal.relatedGoals.relation.blockedBy'
              )
            : runtime.i18n.t('planningDetails.goal.relatedGoals.relation.blocks'),
        className: 'bg-rose-50 text-rose-700',
      };
    case 'relates_to':
    default:
      return {
        icon: 'link',
        label: runtime.i18n.t('planningDetails.goal.relatedGoals.relation.relatesTo'),
        className: 'bg-violet-50 text-violet-700',
      };
  }
}
