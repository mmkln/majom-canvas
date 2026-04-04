import { describe, expect, it } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import type {
  Goal,
  GoalRelation,
  Story,
} from '../interfaces/index.ts';
import { GoalRelatedItemsLookupService } from './goal-related-items-lookup-service.ts';
import type { GoalsApiService } from '../data-access/goals-api-service.ts';
import type { StoriesApiService } from '../data-access/stories-api-service.ts';
import type { GoalRelationsApiService } from '../data-access/goal-relations-api-service.ts';

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    uuid: '11111111-1111-4111-8111-111111111111',
    title: 'Primary goal',
    description: 'Goal description',
    created_at: '2026-04-04T00:00:00Z',
    scale: 1,
    tasks: [],
    stories: [],
    subgoals: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    priority: 'medium',
    status: 'todo',
    strategies: [],
    milestones: {
      items: [],
      total_count: 0,
      completed_count: 0,
      is_draft: false,
    },
    tags: [],
    ...overrides,
  };
}

function createStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 10,
    uuid: 'story-uuid',
    title: 'Story',
    description: 'Story description',
    status: 'todo',
    priority: 'medium',
    tasks: [],
    ...overrides,
  };
}

describe('GoalRelatedItemsLookupService', () => {
  it('aggregates tasks, stories, and related goals from goal domain data', async () => {
    const embeddedStory = createStory({
      id: 21,
      uuid: 'story-21',
      title: 'Embedded story',
    });
    const fetchedStory = createStory({
      id: 22,
      uuid: 'story-22',
      title: 'Fetched story',
    });
    const primaryGoal = createGoal({
      tasks: [
        {
          id: 100,
          uuid: 'task-100',
          title: 'Task with embedded story',
          description: '',
          created_at: new Date(),
          start_date: null,
          due_date: null,
          resolved_date: null,
          estimate: 0,
          subtasks: [],
          priority: 'medium',
          status: 'todo',
          tags: [],
          challenge: null,
          goal: null,
          goal_id: null,
          strategy: null,
          is_completed: false,
          is_standalone: true,
          relations: [],
          flows: [],
          story: embeddedStory,
          story_id: embeddedStory.id,
        },
        {
          id: 101,
          uuid: 'task-101',
          title: 'Task with fetched story',
          description: '',
          created_at: new Date(),
          start_date: null,
          due_date: null,
          resolved_date: null,
          estimate: 0,
          subtasks: [],
          priority: 'medium',
          status: 'todo',
          tags: [],
          challenge: null,
          goal: null,
          goal_id: null,
          strategy: null,
          is_completed: false,
          is_standalone: true,
          relations: [],
          flows: [],
          story: null,
          story_id: fetchedStory.id,
        },
      ],
    });

    const relations: GoalRelation[] = [
      {
        id: 'rel-1',
        from_goal_uuid: primaryGoal.uuid!,
        to_goal_uuid: '22222222-2222-4222-8222-222222222222',
        relation_type: 'leads_to',
        meta: null,
        created_at: '2026-04-04T00:00:00Z',
        updated_at: '2026-04-04T00:00:00Z',
      },
      {
        id: 'rel-2',
        from_goal_uuid: '33333333-3333-4333-8333-333333333333',
        to_goal_uuid: primaryGoal.uuid!,
        relation_type: 'blocks',
        meta: null,
        created_at: '2026-04-04T00:00:00Z',
        updated_at: '2026-04-04T00:00:00Z',
      },
    ];

    const goalsApi = {
      getGoal: () => of(primaryGoal),
      fetchGoalsByUuids: (uuids: string[]) =>
        of(
          uuids.map((uuid, index) =>
            createGoal({
              id: index + 2,
              uuid,
              title: `Related ${index + 1}`,
            })
          )
        ),
    } as unknown as GoalsApiService;
    const storiesApi = {
      fetchStoriesByIds: () => of([fetchedStory]),
    } as unknown as StoriesApiService;
    const goalRelationsApi = {
      listRelations: () => of(relations),
    } as unknown as GoalRelationsApiService;

    const service = new GoalRelatedItemsLookupService(
      goalsApi,
      storiesApi,
      goalRelationsApi
    );

    const result = await firstValueFrom(service.getRelatedItems(primaryGoal.uuid!));
    expect(result.tasks.map((task) => task.id)).toEqual([100, 101]);
    expect(result.stories.map((story) => story.id).sort()).toEqual([21, 22]);
    expect(result.goals.map((goal) => goal.uuid).sort()).toEqual([
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
    ]);
  });
});
