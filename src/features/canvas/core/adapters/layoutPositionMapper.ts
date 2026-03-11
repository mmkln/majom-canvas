import type { CanvasPositionWriteDTO } from '../../../../majom-wrapper/index.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

type PlanningElement = TaskElement | StoryElement | GoalElement;

type MapperOptions = {
  isFocused: (element: PlanningElement) => boolean;
  isHighlighted: (element: PlanningElement) => boolean;
};

export type LayoutPositionMappingResult = {
  positions: CanvasPositionWriteDTO[];
  missingIds: string[];
};

export function mapPlanningElementsToLayoutPositions(
  elements: PlanningElement[],
  options: MapperOptions
): LayoutPositionMappingResult {
  const positions: CanvasPositionWriteDTO[] = [];
  const missingIds: string[] = [];

  elements.forEach((element) => {
    const elementType =
      element instanceof TaskElement
        ? 'task'
        : element instanceof StoryElement
          ? 'story'
          : 'goal';
    const elementUuid = element.uuid;
    if (!elementUuid) {
      missingIds.push(String((element as { id: unknown }).id));
      return;
    }

    const meta =
      element instanceof StoryElement
        ? {
            width: element.width,
            height: element.height,
            focused: options.isFocused(element),
            highlighted: options.isHighlighted(element),
          }
        : element instanceof GoalElement
          ? {
              goalScale: element.scale,
              focused: options.isFocused(element),
              highlighted: options.isHighlighted(element),
            }
          : {
              focused: options.isFocused(element),
              highlighted: options.isHighlighted(element),
            };

    positions.push({
      element_type: elementType,
      element_uuid: elementUuid,
      x: element.x,
      y: element.y,
      meta,
    });
  });

  return { positions, missingIds };
}

export function dedupeLayoutPositions(
  positions: CanvasPositionWriteDTO[]
): CanvasPositionWriteDTO[] {
  const map = new Map<string, CanvasPositionWriteDTO>();
  positions.forEach((pos) => {
    const ref = pos.element_uuid ?? 'na';
    const key = `${pos.element_type ?? 'na'}:${ref}`;
    map.set(key, pos);
  });
  return Array.from(map.values());
}
