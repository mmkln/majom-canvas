import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  describeAiAssistantSelectionInline,
  getAiAssistantSelectedItems,
  summarizeAiAssistantCanvas,
} from './AiAssistantContent.ts';

export function buildAiAssistantWelcomeContent(
  context: AiAssistantCanvasSnapshot | null
): string {
  if (!context) {
    return 'Open a canvas and select an element to get contextual help.';
  }

  const selection = getAiAssistantSelectedItems(context);

  return [
    `You're in "${context.canvasTitle || 'Untitled canvas'}".`,
    summarizeAiAssistantCanvas(context),
    context.summary.goalCount === 0 &&
    context.summary.storyCount === 0 &&
    context.summary.taskCount === 0
      ? 'This canvas is empty. Ask for a strategic plan to generate the initial goal structure.'
      : null,
    selection.length === 1 && selection[0]?.kind === 'goal'
      ? 'Ask for strategic subgoals to decompose the selected goal at the goal level, or ask to break it into stories for execution planning.'
      : null,
    selection.length > 0
      ? `Current selection: ${describeAiAssistantSelectionInline(selection)}.`
      : 'Select an element on the canvas to get more specific help.',
  ]
    .filter((item): item is string => Boolean(item))
    .join('\n\n');
}
