import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import {
  describeWorkspaceChatSelectionInline,
  getWorkspaceChatSelectedItems,
  summarizeWorkspaceChatCanvas,
} from './WorkspaceChatContent.ts';

export function buildWorkspaceChatWelcomeContent(
  context: WorkspaceChatCanvasSnapshot | null
): string {
  if (!context) {
    return 'Open a canvas and select an element to get contextual help.';
  }

  const selection = getWorkspaceChatSelectedItems(context);

  return [
    `You're in "${context.canvasTitle || 'Untitled canvas'}".`,
    summarizeWorkspaceChatCanvas(context),
    selection.length > 0
      ? `Current selection: ${describeWorkspaceChatSelectionInline(selection)}.`
      : 'Select an element on the canvas to get more specific help.',
  ].join('\n\n');
}
