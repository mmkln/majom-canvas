import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { TasksApiService } from './tasks-api-service.ts';
import type { HttpInterceptorClient } from './http-interceptor.js';

describe('TasksApiService tag endpoints', () => {
  it('passes goal, story and status filters to task search requests', async () => {
    const response = {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
    const get = vi.fn(() => of(response));
    const http = {
      get,
    } as unknown as HttpInterceptorClient;
    const service = new TasksApiService(http);

    await firstValueFrom(
      service.fetchTasks({
        search: 'focus',
        page: 3,
        pageSize: 25,
        goal: 11,
        story: 22,
        status: 'completed',
      })
    );

    expect(get).toHaveBeenCalledWith(
      '/tasks/?goal=11&story=22&status=completed&page=3&page_size=25&search=focus'
    );
  });

  it('unwraps paginated tag responses', async () => {
    const get = vi.fn(() =>
      of({
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            title: 'Focus',
            slug: 'focus',
            color: '#2563eb',
            description: null,
            tasks: [101],
          },
          {
            id: 2,
            title: 'Strategy',
            slug: 'strategy',
            color: '#7c3aed',
            description: 'Strategic work',
            tasks: [],
          },
        ],
      })
    );
    const http = {
      get,
    } as unknown as HttpInterceptorClient;
    const service = new TasksApiService(http);

    const tags = await firstValueFrom(service.getTags());

    expect(get).toHaveBeenCalledWith('/tags/');
    expect(tags).toHaveLength(2);
    expect(tags[0]?.tasks).toEqual([101]);
  });

  it('creates, updates and deletes tags through the tag endpoints', async () => {
    const created = {
      id: 3,
      title: 'Health',
      slug: 'health',
      color: '#FF5722',
      description: 'Health and fitness goals',
      tasks: [],
    };
    const updated = {
      ...created,
      color: '#E91E63',
    };
    const post = vi.fn(() => of(created));
    const patch = vi.fn(() => of(updated));
    const deleteFn = vi.fn(() => of(undefined));
    const http = {
      post,
      patch,
      delete: deleteFn,
    } as unknown as HttpInterceptorClient;
    const service = new TasksApiService(http);

    await firstValueFrom(
      service.createTag({
        title: 'Health',
        color: '#FF5722',
        description: 'Health and fitness goals',
      })
    );
    await firstValueFrom(service.updateTag(3, { color: '#E91E63' }));
    await firstValueFrom(service.deleteTag(3));

    expect(post).toHaveBeenCalledWith('/tags/', {
      title: 'Health',
      color: '#FF5722',
      description: 'Health and fitness goals',
    });
    expect(patch).toHaveBeenCalledWith('/tags/3/', {
      color: '#E91E63',
    });
    expect(deleteFn).toHaveBeenCalledWith('/tags/3/');
  });
});
