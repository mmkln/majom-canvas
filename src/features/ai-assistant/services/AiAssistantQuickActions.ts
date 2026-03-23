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

export function getAiAssistantQuickActions(
  context: AiAssistantCanvasSnapshot | null
): AiAssistantQuickAction[] {
  if (!context) {
    return [];
  }

  const selection = getAiAssistantSelectedItems(context);
  const scopedSelection = selection.length > 0 ? selection : [];
  const actions: AiAssistantQuickAction[] = [
    {
      id: 'review',
      label: selection.length > 0 ? 'Review selection' : 'Review plan',
      prompt: buildAiAssistantReviewPrompt(scopedSelection),
      submission: createIntentQuickActionSubmission(context, 'review'),
    },
    {
      id: 'missing',
      label: 'What is missing?',
      prompt: buildAiAssistantMissingPrompt(scopedSelection),
      submission: createIntentQuickActionSubmission(context, 'missing'),
    },
    {
      id: 'next-steps',
      label: 'Next steps',
      prompt: buildAiAssistantNextStepsPrompt(scopedSelection),
    },
    {
      id: 'duplicates',
      label: 'Find duplicates',
      prompt: buildAiAssistantDuplicatePrompt(scopedSelection),
    },
    {
      id: 'recent-changes',
      label: 'Review recent changes',
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
      label: 'Generate strategic plan',
      prompt: buildAiAssistantStrategicPlanPrompt([]),
      submission: createIntentQuickActionSubmission(context, 'strategic_plan'),
    });
  }

  if (selection.length !== 1) {
    return actions;
  }

  const item = selection[0];
  if (item.kind === 'goal' || item.kind === 'story') {
    actions.unshift({
      id: 'break-selection',
      label: item.kind === 'goal' ? 'Break into stories' : 'Break into tasks',
      prompt: buildAiAssistantBreakdownPrompt(item),
      submission: createIntentQuickActionSubmission(context, 'breakdown'),
    });
  }
  if (item.kind === 'goal') {
    actions.unshift({
      id: 'strategic-plan-selection',
      label: 'Generate strategic plan',
      prompt: buildAiAssistantStrategicPlanPrompt([item]),
      submission: createIntentQuickActionSubmission(context, 'strategic_plan'),
    });
  }
  actions.splice(3, 0, {
    id: 'dependencies-selection',
    label: selection.length > 1 ? 'Connect selected' : 'Suggest dependencies',
    prompt: buildAiAssistantDependencyPrompt([item]),
    submission: createIntentQuickActionSubmission(context, 'dependencies'),
  });

  return actions;
}

function createIntentQuickActionSubmission(
  context: AiAssistantCanvasSnapshot,
  intent: 'review' | 'breakdown' | 'strategic_plan' | 'dependencies' | 'missing'
) {
  const selection = getAiAssistantSelectedItems(context);
  return resolveAiAssistantIntentSubmission(
    {
      intent,
      scope: selection.length > 0 ? 'selection' : 'canvas',
      targetIds: selection.length > 0 ? selection.map((item) => item.id) : undefined,
    },
    context
  );
}
