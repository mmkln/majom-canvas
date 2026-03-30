import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { GoalsApiService } from './goals-api-service.ts';

describe('GoalsApiService picker search', () => {
  it('delegates blank searches to the regular paginated goal endpoint', async () => {
    const response = createPage([createGoal({ id: 1, title: 'Ship roadmap' })]);
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

  it('passes selected tag ids through picker search requests', async () => {
    const response = createPage([createGoal({ id: 1, title: 'Ship roadmap' })]);
    const http = {
      get: vi.fn(() => of(response)),
    };
    const service = new GoalsApiService(http as any);

    await firstValueFrom(
      service.searchGoalsForPicker({
        search: 'focus',
        page: 1,
        pageSize: 30,
        tags: [12, 27],
      })
    );

    expect(http.get).toHaveBeenCalledWith(
      '/goals/?page=1&page_size=30&search=focus&tags=12%2C27'
    );
  });

  it('supports explicit tag filters in the regular goals endpoint', async () => {
    const response = createPage([]);
    const http = {
      get: vi.fn(() => of(response)),
    };
    const service = new GoalsApiService(http as any);

    await firstValueFrom(
      service.fetchGoals({
        page: 1,
        pageSize: 20,
        tags: [12, 27],
        tagSlugs: ['health', 'productivity'],
      })
    );

    expect(http.get).toHaveBeenCalledWith(
      '/goals/?page=1&page_size=20&tags=12%2C27&tag_slugs=health%2Cproductivity'
    );
  });
});

function createPage(results: any[], overrides: Partial<any> = {}) {
  return {
    count: overrides.count ?? results.length,
    next: overrides.next ?? null,
    previous: overrides.previous ?? null,
    results,
  };
}

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
