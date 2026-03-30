import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { GoalsApiService } from './goals-api-service.ts';

describe('GoalsApiService picker search', () => {
  it('matches goals by tag fields when the goal title does not match', async () => {
    const http = {
      get: vi.fn(() =>
        of({
          count: 2,
          next: null,
          previous: null,
          results: [
            createGoal({
              id: 1,
              title: 'Ship roadmap',
              description: 'Quarter planning',
              tags: [
                {
                  id: 11,
                  title: 'Focus',
                  slug: 'focus',
                  color: '#2563eb',
                  description: 'Deep work',
                },
              ],
            }),
            createGoal({
              id: 2,
              title: 'Onboard team',
              description: 'Hiring',
              tags: [],
            }),
          ],
        })
      ),
    };
    const service = new GoalsApiService(http as any);

    const result = await firstValueFrom(
      service.searchGoalsForPicker({ search: 'focus', page: 1, pageSize: 30 })
    );

    expect(http.get).toHaveBeenCalledWith('/goals/?page=1&page_size=100');
    expect(result.results.map((goal) => goal.id)).toEqual([1]);
    expect(result.count).toBe(1);
  });

  it('paginates locally after filtering by tags', async () => {
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(
          of({
            count: 3,
            next: '/goals/?page=2&page_size=100',
            previous: null,
            results: [
              createGoal({
                id: 1,
                title: 'A',
                tags: [createTag({ id: 1, title: 'Focus' })],
              }),
              createGoal({
                id: 2,
                title: 'B',
                tags: [createTag({ id: 2, title: 'Focus' })],
              }),
            ],
          })
        )
        .mockReturnValueOnce(
          of({
            count: 3,
            next: null,
            previous: '/goals/?page=1&page_size=100',
            results: [
              createGoal({
                id: 3,
                title: 'C',
                tags: [createTag({ id: 3, title: 'Focus' })],
              }),
            ],
          })
        )
        .mockReturnValueOnce(
          of({
            count: 3,
            next: '/goals/?page=2&page_size=100',
            previous: null,
            results: [
              createGoal({
                id: 1,
                title: 'A',
                tags: [createTag({ id: 1, title: 'Focus' })],
              }),
              createGoal({
                id: 2,
                title: 'B',
                tags: [createTag({ id: 2, title: 'Focus' })],
              }),
            ],
          })
        )
        .mockReturnValueOnce(
          of({
            count: 3,
            next: null,
            previous: '/goals/?page=1&page_size=100',
            results: [
              createGoal({
                id: 3,
                title: 'C',
                tags: [createTag({ id: 3, title: 'Focus' })],
              }),
            ],
          })
        ),
    };
    const service = new GoalsApiService(http as any);

    const pageOne = await firstValueFrom(
      service.searchGoalsForPicker({ search: 'focus', page: 1, pageSize: 2 })
    );
    const pageTwo = await firstValueFrom(
      service.searchGoalsForPicker({ search: 'focus', page: 2, pageSize: 2 })
    );

    expect(http.get).toHaveBeenNthCalledWith(1, '/goals/?page=1&page_size=100');
    expect(http.get).toHaveBeenNthCalledWith(2, '/goals/?page=2&page_size=100');
    expect(http.get).toHaveBeenNthCalledWith(3, '/goals/?page=1&page_size=100');
    expect(http.get).toHaveBeenNthCalledWith(4, '/goals/?page=2&page_size=100');
    expect(pageOne.results.map((goal) => goal.id)).toEqual([1, 2]);
    expect(pageOne.next).toBe('/goals/?page=2&page_size=2&search=focus');
    expect(pageTwo.results.map((goal) => goal.id)).toEqual([3]);
    expect(pageTwo.previous).toBe('/goals/?page=1&page_size=2&search=focus');
  });

  it('delegates blank searches to the regular paginated goal endpoint', async () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [createGoal({ id: 1, title: 'Ship roadmap' })],
    };
    const http = {
      get: vi.fn(() => of(response)),
    };
    const service = new GoalsApiService(http as any);

    const result = await firstValueFrom(
      service.searchGoalsForPicker({ search: '   ', page: 2, pageSize: 15 })
    );

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/goals/?page=2&page_size=15');
    expect(result).toBe(response);
  });
});

function createGoal(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 1,
    uuid: overrides.uuid ?? `goal-${overrides.id ?? 1}`,
    title: overrides.title ?? 'Goal',
    description: overrides.description ?? null,
    created_at: overrides.created_at ?? '2026-03-30T10:00:00.000Z',
    scale: overrides.scale ?? null,
    tasks: overrides.tasks ?? [],
    stories: overrides.stories ?? [],
    subgoals:
      overrides.subgoals ?? {
        items: [],
        total_count: 0,
        completed_count: 0,
        is_draft: false,
      },
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'active',
    strategies: overrides.strategies ?? [],
    milestones:
      overrides.milestones ?? {
        items: [],
        total_count: 0,
        completed_count: 0,
        is_draft: false,
      },
    tags: overrides.tags ?? [],
    tag_ids: overrides.tag_ids,
  };
}

function createTag(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Tag',
    slug: overrides.slug ?? String(overrides.title ?? 'tag').toLowerCase(),
    color: overrides.color ?? '#2563eb',
    description: overrides.description ?? null,
    tasks: overrides.tasks ?? [],
  };
}
