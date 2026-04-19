import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { StoriesApiService } from './stories-api-service.ts';
import type { HttpInterceptorClient } from './http-interceptor.js';

describe('StoriesApiService filters', () => {
  it('passes goal and search filters to the stories endpoint', async () => {
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
    const service = new StoriesApiService(http);

    await firstValueFrom(
      service.fetchStories({
        page: 2,
        pageSize: 30,
        search: 'launch',
        goal: 17,
      })
    );

    expect(get).toHaveBeenCalledWith(
      '/stories/?page=2&page_size=30&search=launch&goal=17'
    );
  });
});
