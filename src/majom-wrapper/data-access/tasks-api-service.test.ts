import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { TasksApiService } from './tasks-api-service.ts';

describe('TasksApiService tag endpoints', () => {
  it('unwraps paginated tag responses', async () => {
    const http = {
      get: vi.fn(() =>
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
      ),
    };
    const service = new TasksApiService(http as any);

    const tags = await firstValueFrom(service.getTags());

    expect(http.get).toHaveBeenCalledWith('/tags/');
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
    const http = {
      post: vi.fn(() => of(created)),
      patch: vi.fn(() => of(updated)),
      delete: vi.fn(() => of(undefined)),
    };
    const service = new TasksApiService(http as any);

    await firstValueFrom(
      service.createTag({
        title: 'Health',
        color: '#FF5722',
        description: 'Health and fitness goals',
      })
    );
    await firstValueFrom(service.updateTag(3, { color: '#E91E63' }));
    await firstValueFrom(service.deleteTag(3));

    expect(http.post).toHaveBeenCalledWith('/tags/', {
      title: 'Health',
      color: '#FF5722',
      description: 'Health and fitness goals',
    });
    expect(http.patch).toHaveBeenCalledWith('/tags/3/', {
      color: '#E91E63',
    });
    expect(http.delete).toHaveBeenCalledWith('/tags/3/');
  });
});
