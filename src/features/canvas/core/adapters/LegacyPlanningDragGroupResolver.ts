import type {
  DragGroupResolver,
  ICanvasElement as CoreCanvasElement,
} from 'majom-canvas-core';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';

export const legacyPlanningDragGroupResolver: DragGroupResolver<
  CoreCanvasElement
> = (selected) => {
  const legacySelected = selected as ICanvasElement[];
  const group = new Set<ICanvasElement>(legacySelected);

  legacySelected
    .filter((element): element is StoryElement => element instanceof StoryElement)
    .forEach((story) => {
      story.tasks.forEach((task) => group.add(task));
    });

  return Array.from(group) as CoreCanvasElement[];
};

