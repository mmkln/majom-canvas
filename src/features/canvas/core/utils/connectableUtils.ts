import type { Scene } from '../scene/Scene.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { getCollapsedStoryTaskIds } from './storyVisibility.ts';

/**
 * Returns all connectable elements (shapes + planning elements) sorted by zIndex ascending.
 * This ensures that higher zIndex elements (e.g., Task) are hit-tested first.
 */
export function getOrderedConnectables(scene: Scene): IConnectable[] {
  const shapes = scene.getShapes();
  const planningEls = scene
    .getElements()
    .filter(isPlanningElement) as IConnectable[];
  const hiddenTaskIds = getCollapsedStoryTaskIds(scene.getElements());
  const items: IConnectable[] = [...shapes, ...planningEls];
  return items
    .filter(
      (item) => !(item instanceof TaskElement) || !hiddenTaskIds.has(item.id)
    )
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}
