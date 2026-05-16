import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Priority, Status } from '../../../majom-wrapper/interfaces/index.ts';
import { ApiTaskRelationCatalog } from './ApiTaskRelationCatalog.ts';

describe('ApiTaskRelationCatalog', () => {
  it('searches goals and stories through the platform APIs', async () => {
    const goalsApi = {
      searchGoalsForPicker: vi.fn(() =>
        of({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 7,
              uuid: 'goal-7',
              title: 'Launch goal',
              description: '',
              created_at: '2026-01-01T00:00:00.000Z',
              scale: null,
              status: Status.Active,
              priority: Priority.Medium,
              tasks: [],
              stories: [],
              subgoals: {
                items: [],
                total_count: 0,
                completed_count: 0,
                is_draft: false,
              },
              strategies: [],
              milestones: {
                items: [],
                total_count: 0,
                completed_count: 0,
                is_draft: false,
              },
              tags: [],
            },
          ],
        })
      ),
    };
    const storiesApi = {
      fetchStories: vi.fn(() =>
        of({
          count: 1,
          next: '/stories/?page=2',
          previous: null,
          results: [
            {
              id: 17,
              uuid: 'story-17',
              title: 'Pilot story',
              description: '',
              status: Status.Active,
              priority: Priority.Medium,
              goal_id: 7,
            },
          ],
        })
      ),
    };
    const catalog = new ApiTaskRelationCatalog({ goalsApi, storiesApi });

    await expect(
      catalog.searchGoals({ query: ' launch ', page: 1, pageSize: 20 })
    ).resolves.toEqual({
      items: [
        {
          id: 7,
          uuid: 'goal-7',
          title: 'Launch goal',
          status: Status.Active,
        },
      ],
      nextPage: null,
    });
    await expect(
      catalog.searchStories({
        query: 'pilot',
        page: 1,
        pageSize: 20,
        goalId: 7,
      })
    ).resolves.toMatchObject({
      items: [{ id: 17, goalId: 7, title: 'Pilot story' }],
      nextPage: 2,
    });

    expect(goalsApi.searchGoalsForPicker).toHaveBeenCalledWith({
      search: ' launch ',
      page: 1,
      pageSize: 20,
    });
    expect(storiesApi.fetchStories).toHaveBeenCalledWith({
      search: 'pilot',
      page: 1,
      pageSize: 20,
      goal: 7,
    });
  });

  it('keeps catalog methods safe when passed as callbacks', async () => {
    const goalsApi = {
      searchGoalsForPicker: vi.fn(() =>
        of({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      ),
    };
    const storiesApi = {
      fetchStories: vi.fn(() =>
        of({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })
      ),
    };
    const catalog = new ApiTaskRelationCatalog({
      goalsApi,
      storiesApi,
    } as any);
    const { searchGoals, searchStories } = catalog;

    await expect(
      searchGoals({ query: '', page: 1, pageSize: 20 })
    ).resolves.toEqual({ items: [], nextPage: null });
    await expect(
      searchStories({ query: '', page: 1, pageSize: 20, goalId: null })
    ).resolves.toEqual({ items: [], nextPage: null });
  });
});
