import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';

export function getCollapsedStoryTaskIds(
  elements: ReadonlyArray<ICanvasElement>
): Set<string> {
  const hiddenTaskIds = new Set<string>();
  elements.forEach((element) => {
    if (!(element instanceof StoryElement) || !element.isCollapsed) return;
    element.tasks.forEach((task) => {
      hiddenTaskIds.add(task.id);
    });
  });
  return hiddenTaskIds;
}
