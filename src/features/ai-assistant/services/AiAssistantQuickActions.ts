import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import { getAiAssistantSelectedItems } from './AiAssistantContent.ts';
import type { AiAssistantQuickAction } from './AiAssistantTypes.ts';
import { resolveAiAssistantIntentSubmission } from './AiAssistantIntentResolver.ts';
import {
  buildAiAssistantBreakdownPrompt,
  buildAiAssistantDuplicatePrompt,
  buildAiAssistantDependencyPrompt,
  buildAiAssistantNextStepsPrompt,
  buildAiAssistantMissingPrompt,
  buildAiAssistantRecentChangesPrompt,
  buildAiAssistantReviewPrompt,
  buildAiAssistantStrategicPlanPrompt,
} from '../aiAssistantPrompts.ts';
import type { I18nService } from '../../../i18n/index.ts';

type AiAssistantQuickActionI18n = Pick<I18nService, 't'>;

export function getAiAssistantQuickActions(
  context: AiAssistantCanvasSnapshot | null,
  i18n?: AiAssistantQuickActionI18n
): AiAssistantQuickAction[] {
  if (!context) {
    return [];
  }

  const selection = getAiAssistantSelectedItems(context);
  const scopedSelection = selection.length > 0 ? selection : [];
  const actions: AiAssistantQuickAction[] = [
    {
      id: 'review',
      label:
        selection.length > 0
          ? i18n?.t('aiChat.quickAction.reviewSelection') ?? 'Review selection'
          : i18n?.t('aiChat.quickAction.reviewPlan') ?? 'Review plan',
      prompt: buildAiAssistantReviewPrompt(scopedSelection),
      submission: createIntentQuickActionSubmission(context, 'review', i18n),
    },
    {
      id: 'missing',
      label: i18n?.t('aiChat.quickAction.missing') ?? 'What is missing?',
      prompt: buildAiAssistantMissingPrompt(scopedSelection),
      submission: createIntentQuickActionSubmission(context, 'missing', i18n),
    },
    {
      id: 'next-steps',
      label: i18n?.t('aiChat.quickAction.nextSteps') ?? 'Next steps',
      prompt: buildAiAssistantNextStepsPrompt(scopedSelection),
    },
    {
      id: 'duplicates',
      label: i18n?.t('aiChat.quickAction.findDuplicates') ?? 'Find duplicates',
      prompt: buildAiAssistantDuplicatePrompt(scopedSelection),
    },
    {
      id: 'recent-changes',
      label:
        i18n?.t('aiChat.quickAction.reviewRecentChanges') ??
        'Review recent changes',
      prompt: buildAiAssistantRecentChangesPrompt(scopedSelection),
    },
  ];

  if (
    context.summary.goalCount === 0 &&
    context.summary.storyCount === 0 &&
    context.summary.taskCount === 0
  ) {
    actions.unshift({
      id: 'strategic-plan',
      label:
        i18n?.t('aiChat.quickAction.generateStrategicPlan') ??
        'Generate strategic plan',
      prompt: buildAiAssistantStrategicPlanPrompt([]),
      submission: createIntentQuickActionSubmission(
        context,
        'strategic_plan',
        i18n
      ),
    });
  }

  if (selection.length !== 1) {
    return actions;
  }

  const item = selection[0];
  if (item.kind === 'goal' || item.kind === 'story') {
    actions.unshift({
      id: 'break-selection',
      label:
        item.kind === 'goal'
          ? i18n?.t('aiChat.quickAction.breakIntoStories') ??
            'Break into stories'
          : i18n?.t('aiChat.quickAction.breakIntoTasks') ??
            'Break into tasks',
      prompt: buildAiAssistantBreakdownPrompt(item),
      submission: createIntentQuickActionSubmission(context, 'breakdown', i18n),
    });
  }
  if (item.kind === 'goal') {
    actions.unshift({
      id: 'strategic-plan-selection',
      label:
        i18n?.t('aiChat.quickAction.generateStrategicPlan') ??
        'Generate strategic plan',
      prompt: buildAiAssistantStrategicPlanPrompt([item]),
      submission: createIntentQuickActionSubmission(
        context,
        'strategic_plan',
        i18n
      ),
    });
  }
  actions.splice(3, 0, {
    id: 'dependencies-selection',
    label:
      selection.length > 1
        ? i18n?.t('aiChat.quickAction.connectSelected') ?? 'Connect selected'
        : i18n?.t('aiChat.quickAction.suggestDependencies') ??
          'Suggest dependencies',
    prompt: buildAiAssistantDependencyPrompt([item]),
    submission: createIntentQuickActionSubmission(context, 'dependencies', i18n),
  });

  return actions;
}

function createIntentQuickActionSubmission(
  context: AiAssistantCanvasSnapshot,
  intent: 'review' | 'breakdown' | 'strategic_plan' | 'dependencies' | 'missing',
  i18n?: AiAssistantQuickActionI18n
) {
  const selection = getAiAssistantSelectedItems(context);
  return resolveAiAssistantIntentSubmission(
    {
      intent,
      scope: selection.length > 0 ? 'selection' : 'canvas',
      targetIds: selection.length > 0 ? selection.map((item) => item.id) : undefined,
    },
    context,
    i18n
  );
}
