import { catchError, forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import type {
  Goal,
  GoalRelation,
  PlatformTask,
  Story,
} from '../interfaces/index.ts';
import { GoalRelationsApiService } from '../data-access/goal-relations-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';

export type GoalRelatedItemsLookupResult = {
  tasks: PlatformTask[];
  stories: Story[];
  goals: Goal[];
};

export class GoalRelatedItemsLookupService {
  constructor(
    private readonly goalsApi: GoalsApiService,
    private readonly storiesApi: StoriesApiService,
    private readonly goalRelationsApi: GoalRelationsApiService
  ) {}

  public getRelatedItems(
    ref: string
  ): Observable<GoalRelatedItemsLookupResult> {
    return this.goalsApi.getGoal(ref).pipe(
      switchMap((goal) => {
        const tasks = this.getGoalTasks(goal);
        const stories$ = this.loadStories(goal, tasks);
        const goals$ = this.loadRelatedGoals(ref, goal);
        return forkJoin({
          stories: stories$,
          goals: goals$,
        }).pipe(
          map(({ stories, goals }) => ({
            tasks,
            stories,
            goals,
          }))
        );
      })
    );
  }

  private loadStories(
    goal: Goal,
    tasks: PlatformTask[]
  ): Observable<Story[]> {
    const directStories = this.getGoalStories(goal);
    const embeddedStories = this.extractStoriesFromGoalTasks(tasks);
    const knownStories = this.mergeStories(directStories, embeddedStories);
    const storyIds = this.extractStoryIdsFromGoalTasks(tasks);
    const knownIds = new Set(knownStories.map((story) => story.id));
    const missingIds = storyIds.filter((id) => !knownIds.has(id));
    if (missingIds.length === 0) {
      return of(knownStories);
    }
    return this.storiesApi.fetchStoriesByIds(missingIds).pipe(
      map((stories) => this.mergeStories(knownStories, stories)),
      catchError(() => of(knownStories))
    );
  }

  private loadRelatedGoals(ref: string, goal: Goal): Observable<Goal[]> {
    return this.goalRelationsApi.listRelations({ goal_id: ref }).pipe(
      switchMap((relations) => {
        const relatedUuids = this.extractRelatedGoalUuids(relations, goal, ref);
        if (relatedUuids.length === 0) {
          return of([]);
        }
        return this.goalsApi.fetchGoalsByUuids(relatedUuids).pipe(
          map((goals) => this.dedupeGoals(goals, goal.uuid)),
          catchError(() => of([]))
        );
      }),
      catchError(() => of([]))
    );
  }

  private getGoalTasks(goal: Goal): PlatformTask[] {
    const rawTasks = (goal as { tasks?: unknown }).tasks;
    if (Array.isArray(rawTasks)) {
      return rawTasks as PlatformTask[];
    }
    const rawItems = (rawTasks as { items?: unknown } | undefined)?.items;
    if (Array.isArray(rawItems)) {
      return rawItems as PlatformTask[];
    }
    return [];
  }

  private getGoalStories(goal: Goal): Story[] {
    const rawStories = (goal as { stories?: unknown }).stories;
    if (Array.isArray(rawStories)) {
      return rawStories as Story[];
    }
    return [];
  }

  private extractStoriesFromGoalTasks(tasks: PlatformTask[]): Story[] {
    const stories: Story[] = [];
    const seenIds = new Set<number>();
    tasks.forEach((task) => {
      if (!task.story) return;
      const storyId = task.story.id;
      if (seenIds.has(storyId)) return;
      seenIds.add(storyId);
      stories.push(task.story);
    });
    return stories;
  }

  private extractStoryIdsFromGoalTasks(tasks: PlatformTask[]): number[] {
    const seen = new Set<number>();
    const ids: number[] = [];
    tasks.forEach((task) => {
      const id = task.story_id;
      if (!Number.isFinite(id)) return;
      const value = Number(id);
      if (seen.has(value)) return;
      seen.add(value);
      ids.push(value);
    });
    return ids;
  }

  private mergeStories(primary: Story[], secondary: Story[]): Story[] {
    const merged = new Map<number, Story>();
    primary.forEach((story) => merged.set(story.id, story));
    secondary.forEach((story) => merged.set(story.id, story));
    return Array.from(merged.values());
  }

  private extractRelatedGoalUuids(
    relations: GoalRelation[],
    goal: Goal,
    ref: string
  ): string[] {
    const currentGoalUuid = goal.uuid ?? this.asUuid(ref);
    if (!currentGoalUuid) {
      return [];
    }
    const uuids = new Set<string>();
    relations.forEach((relation) => {
      if (relation.from_goal_uuid === currentGoalUuid) {
        uuids.add(relation.to_goal_uuid);
      } else if (relation.to_goal_uuid === currentGoalUuid) {
        uuids.add(relation.from_goal_uuid);
      }
    });
    uuids.delete(currentGoalUuid);
    return Array.from(uuids.values());
  }

  private dedupeGoals(goals: Goal[], currentGoalUuid?: string): Goal[] {
    const seen = new Set<string>();
    const result: Goal[] = [];
    goals.forEach((goal) => {
      const key = goal.uuid ?? `id:${goal.id}`;
      if (currentGoalUuid && goal.uuid === currentGoalUuid) {
        return;
      }
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(goal);
    });
    return result;
  }

  private asUuid(ref: string): string | null {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      ref
    )
      ? ref
      : null;
  }
}
