import type { Observable } from 'rxjs';
import type {
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from '../../../../majom-wrapper/index.ts';
import type { GoalElement } from '../../elements/GoalElement.ts';
import type { StoryElement } from '../../elements/StoryElement.ts';
import type { TaskElement } from '../../elements/TaskElement.ts';

export interface PlanningCanvasRelationAdapter {
  updateTaskStoryLink(
    task: TaskElement,
    story: StoryElement | null
  ): Observable<unknown>;
  updateStoryGoalLink(
    story: StoryElement,
    goal: GoalElement,
    options: StoryGoalLinkOptions
  ): Observable<StoryGoalLinkResult>;
}
