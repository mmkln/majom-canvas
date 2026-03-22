import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import { getWorkspaceChatSelectedItems } from './WorkspaceChatContent.ts';
import type { WorkspaceChatQuickAction } from './WorkspaceChatTypes.ts';
import {
  buildWorkspaceChatBreakdownPrompt,
  buildWorkspaceChatDependencyPrompt,
  buildWorkspaceChatMissingPrompt,
  buildWorkspaceChatReviewPrompt,
} from '../workspaceChatPrompts.ts';

export function getWorkspaceChatQuickActions(
  context: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatQuickAction[] {
  if (!context) {
    return [];
  }

  const actions: WorkspaceChatQuickAction[] = [
    {
      id: 'review',
      label: 'Review plan',
      prompt: buildWorkspaceChatReviewPrompt([]),
    },
    {
      id: 'dependencies',
      label: 'Suggest dependencies',
      prompt: buildWorkspaceChatDependencyPrompt([]),
    },
    {
      id: 'missing',
      label: 'What is missing?',
      prompt: buildWorkspaceChatMissingPrompt([]),
    },
    {
      id: 'next-steps',
      label: 'Suggest next steps',
      prompt:
        'Suggest the next best planning steps for this canvas, with emphasis on sequence, gaps, and execution readiness.',
    },
  ];

  const selection = getWorkspaceChatSelectedItems(context);
  if (selection.length !== 1) {
    return actions;
  }

  const item = selection[0];
  actions.unshift({
    id: 'review-selection',
    label: 'Review selection',
    prompt: buildWorkspaceChatReviewPrompt([item]),
  });
  actions.push({
    id: 'break-selection',
    label:
      item.kind === 'goal'
        ? 'Break into stories'
        : item.kind === 'story'
          ? 'Break into tasks'
          : 'Refine task',
    prompt: buildWorkspaceChatBreakdownPrompt(item),
  });
  actions.push({
    id: 'dependencies-selection',
    label: 'Suggest dependencies',
    prompt: buildWorkspaceChatDependencyPrompt([item]),
  });
  actions.push({
    id: 'missing-selection',
    label: 'What is missing?',
    prompt: buildWorkspaceChatMissingPrompt([item]),
  });

  return actions;
}
