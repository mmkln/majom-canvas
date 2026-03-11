import type {
  HitTestableElement,
  TopElementResolver,
} from 'majom-canvas-core';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';

type LegacyHitElement = ICanvasElement & HitTestableElement;

const reverseFindHit = (
  elements: LegacyHitElement[],
  sceneX: number,
  sceneY: number
): LegacyHitElement | null => {
  for (let i = elements.length - 1; i >= 0; i -= 1) {
    if (elements[i].contains(sceneX, sceneY)) {
      return elements[i];
    }
  }
  return null;
};

export const legacyPlanningTopElementResolver: TopElementResolver<
  LegacyHitElement
> = ({ sceneX, sceneY, candidates }) => {
  const tasks = candidates.filter(
    (candidate): candidate is TaskElement & LegacyHitElement =>
      candidate instanceof TaskElement
  );
  const taskHit = reverseFindHit(tasks, sceneX, sceneY);
  if (taskHit) return taskHit;

  const stories = candidates.filter(
    (candidate): candidate is StoryElement & LegacyHitElement =>
      candidate instanceof StoryElement
  );
  const storyHit = reverseFindHit(stories, sceneX, sceneY);
  if (storyHit) return storyHit;

  const planning = candidates.filter((candidate) => isPlanningElement(candidate));
  const otherPlanning = planning.filter(
    (candidate) =>
      !(candidate instanceof TaskElement) && !(candidate instanceof StoryElement)
  ) as LegacyHitElement[];
  const otherPlanningHit = reverseFindHit(otherPlanning, sceneX, sceneY);
  if (otherPlanningHit) return otherPlanningHit;

  const nonPlanning = candidates.filter(
    (candidate) => !isPlanningElement(candidate)
  );
  return reverseFindHit(nonPlanning, sceneX, sceneY);
};

