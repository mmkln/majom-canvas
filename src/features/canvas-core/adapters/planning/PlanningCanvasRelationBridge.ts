import type { Observable } from 'rxjs';
import type {
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from '../../../../majom-wrapper/index.ts';
import type { GoalElement as LegacyGoalElement } from '../../../../features/canvas/elements/GoalElement.ts';
import type { StoryElement as LegacyStoryElement } from '../../../../features/canvas/elements/StoryElement.ts';
import type { TaskElement as LegacyTaskElement } from '../../../../features/canvas/elements/TaskElement.ts';
import type { PlanningCanvasDataPort } from './PlanningCanvasDataPort.ts';
import type {
  PlanningCanvasRelationAdapter,
  PlanningStoryGoalLink,
  PlanningTaskStoryLink,
} from './PlanningCanvasRelationAdapter.ts';

export class PlanningCanvasRelationBridge
  implements PlanningCanvasRelationAdapter
{
  constructor(private readonly port: PlanningCanvasDataPort) {}

  public updateTaskStoryLink(
    taskStoryLink: PlanningTaskStoryLink
  ): Observable<unknown> {
    return this.port.updateTaskStoryLink(
      {
        task: taskStoryLink.task as unknown as LegacyTaskElement,
        story: taskStoryLink.story as LegacyStoryElement | null,
      }
    );
  }

  public updateStoryGoalLink(
    storyGoalLink: PlanningStoryGoalLink,
    options: StoryGoalLinkOptions
  ): Observable<StoryGoalLinkResult> {
    return this.port.updateStoryGoalLink(
      {
        story: storyGoalLink.story as unknown as LegacyStoryElement,
        goal: storyGoalLink.goal as unknown as LegacyGoalElement,
      },
      options
    );
  }
}
