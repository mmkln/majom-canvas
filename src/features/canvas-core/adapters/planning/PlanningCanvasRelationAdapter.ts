import type { Observable } from 'rxjs';
import type {
  GoalRelation,
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from '../../../../majom-wrapper/index.ts';
import { ConnectionRelationType } from '../../core/interfaces/connection.ts';
import type { GoalElement } from '../../elements/GoalElement.ts';
import type { StoryElement } from '../../elements/StoryElement.ts';
import type { TaskElement } from '../../elements/TaskElement.ts';

export type PlanningGoalLink = {
  fromGoal: GoalElement;
  toGoal: GoalElement;
  relationType: ConnectionRelationType;
};

export type PlanningTaskStoryLink = {
  task: TaskElement;
  story: StoryElement | null;
};

export type PlanningStoryGoalLink = {
  story: StoryElement;
  goal: GoalElement;
};

export interface PlanningCanvasRelationAdapter {
  updateTaskStoryLink(taskStoryLink: PlanningTaskStoryLink): Observable<unknown>;
  updateStoryGoalLink(
    storyGoalLink: PlanningStoryGoalLink,
    options: StoryGoalLinkOptions
  ): Observable<StoryGoalLinkResult>;
  createGoalRelation(goalLink: PlanningGoalLink): Observable<GoalRelation>;
  updateGoalRelation(
    currentGoalLink: PlanningGoalLink,
    nextGoalLink: PlanningGoalLink
  ): Observable<GoalRelation>;
  deleteGoalRelation(goalLink: PlanningGoalLink): Observable<void>;
}
