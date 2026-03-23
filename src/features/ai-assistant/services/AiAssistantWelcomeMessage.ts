import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  describeAiAssistantSelectionInline,
  getAiAssistantSelectedItems,
} from './AiAssistantContent.ts';

export function buildAiAssistantWelcomeContent(
  context: AiAssistantCanvasSnapshot | null
): string {
  if (!context) {
    return 'Open a canvas and select something when you want contextual help.';
  }

  const selection = getAiAssistantSelectedItems(context);

  return [
    `You're looking at "${context.canvasTitle || 'Untitled canvas'}".`,
    formatAiAssistantWelcomeCanvasSummary(context),
    context.summary.goalCount === 0 &&
    context.summary.storyCount === 0 &&
    context.summary.taskCount === 0
      ? 'This canvas is still empty. I can help you sketch the first goal structure.'
      : null,
    selection.length === 1 && selection[0]?.kind === 'goal'
      ? 'I can help expand this goal into strategic subgoals or break it into stories for execution planning.'
      : null,
    selection.length > 0
      ? `You currently have ${describeAiAssistantSelectionInline(selection)} selected.`
      : 'Select a goal, story, or task if you want more specific help.',
  ]
    .filter((item): item is string => Boolean(item))
    .join('\n\n');
}

function formatAiAssistantWelcomeCanvasSummary(
  context: AiAssistantCanvasSnapshot
): string {
  return `Right now this canvas has ${formatAiAssistantWelcomeCount(context.summary.goalCount, 'goal')}, ${formatAiAssistantWelcomeCount(context.summary.storyCount, 'story')}, and ${formatAiAssistantWelcomeCount(context.summary.taskCount, 'task')}.`;
}

function formatAiAssistantWelcomeCount(count: number, label: string): string {
  if (count === 0) {
    return `no ${label}s`;
  }

  return `${count} ${label}${count === 1 ? '' : 's'}`;
}
