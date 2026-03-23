import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import { getWorkspaceChatSelectedItems } from './WorkspaceChatContent.ts';
import type { WorkspaceChatQuickAction } from './WorkspaceChatTypes.ts';
import {
  buildWorkspaceChatBreakdownPrompt,
  buildWorkspaceChatDuplicatePrompt,
  buildWorkspaceChatDependencyPrompt,
  buildWorkspaceChatNextStepsPrompt,
  buildWorkspaceChatMissingPrompt,
  buildWorkspaceChatRecentChangesPrompt,
  buildWorkspaceChatReviewPrompt,
  buildWorkspaceChatStrategicPlanPrompt,
} from '../workspaceChatPrompts.ts';

export function getWorkspaceChatQuickActions(
  context: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatQuickAction[] {
  if (!context) {
    return [];
  }

  const selection = getWorkspaceChatSelectedItems(context);
  const scopedSelection = selection.length > 0 ? selection : [];
  const actions: WorkspaceChatQuickAction[] = [
    {
      id: 'review',
      label: selection.length > 0 ? 'Review selection' : 'Review plan',
      prompt: buildWorkspaceChatReviewPrompt(scopedSelection),
    },
    {
      id: 'missing',
      label: 'What is missing?',
      prompt: buildWorkspaceChatMissingPrompt(scopedSelection),
    },
    {
      id: 'next-steps',
      label: 'Next steps',
      prompt: buildWorkspaceChatNextStepsPrompt(scopedSelection),
    },
    {
      id: 'duplicates',
      label: 'Find duplicates',
      prompt: buildWorkspaceChatDuplicatePrompt(scopedSelection),
    },
    {
      id: 'recent-changes',
      label: 'Review recent changes',
      prompt: buildWorkspaceChatRecentChangesPrompt(scopedSelection),
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
      prompt: buildWorkspaceChatStrategicPlanPrompt([]),
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
      prompt: buildWorkspaceChatBreakdownPrompt(item),
    });
  }
  if (item.kind === 'goal') {
    actions.unshift({
      id: 'strategic-plan-selection',
      label: 'Generate strategic plan',
      prompt: buildWorkspaceChatStrategicPlanPrompt([item]),
    });
  }
  actions.splice(3, 0, {
    id: 'dependencies-selection',
    label: selection.length > 1 ? 'Connect selected' : 'Suggest dependencies',
    prompt: buildWorkspaceChatDependencyPrompt([item]),
  });

  return actions;
}
