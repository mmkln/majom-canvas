import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { FlowsApiService } from './flows-api-service.ts';
import { Priority, Status } from '../interfaces/index.ts';
import type { Flow } from '../interfaces/index.ts';
import type { HttpInterceptorClient } from './http-interceptor.ts';

describe('FlowsApiService', () => {
  it('loads flows from the backend list endpoint', async () => {
    const flows = [
      createFlow({ id: 1, title: 'Launch flow', status: Status.Active }),
    ];
    const get = vi.fn(() => of(flows));
    const service = new FlowsApiService(
      { get } as unknown as HttpInterceptorClient
    );

    const result = await firstValueFrom(service.getFlows());

    expect(get).toHaveBeenCalledWith('/flows/');
    expect(result).toEqual(flows);
  });

  it('unwraps paginated flow responses when pagination is enabled', async () => {
    const flows = [createFlow({ id: 2, title: 'Draft flow' })];
    const get = vi.fn(() =>
      of({
        count: 1,
        next: null,
        previous: null,
        results: flows,
      })
    );
    const service = new FlowsApiService(
      { get } as unknown as HttpInterceptorClient
    );

    const result = await firstValueFrom(service.getFlows());

    expect(result).toEqual(flows);
  });

  it('creates, updates, patches and deletes flows through flow endpoints', async () => {
    const created = createFlow({ id: 7, title: 'Automation flow' });
    const updated = createFlow({
      ...created,
      title: 'Updated automation flow',
      status: Status.Active,
    });
    const post = vi.fn(() => of(created));
    const put = vi.fn(() => of(updated));
    const patch = vi.fn(() => of(updated));
    const deleteFn = vi.fn(() => of(undefined));
    const service = new FlowsApiService({
      post,
      put,
      patch,
      delete: deleteFn,
    } as unknown as HttpInterceptorClient);

    await firstValueFrom(
      service.createFlow({
        title: 'Automation flow',
        status: Status.Draft,
        meta: { view: 'columns' },
      })
    );
    await firstValueFrom(
      service.updateFlow(7, {
        title: 'Updated automation flow',
        status: Status.Active,
        meta: { view: 'timeline' },
      })
    );
    await firstValueFrom(
      service.patchFlow(7, { status: Status.Archived, meta: null })
    );
    await firstValueFrom(service.deleteFlow(7));

    expect(post).toHaveBeenCalledWith('/flows/', {
      title: 'Automation flow',
      status: Status.Draft,
      meta: { view: 'columns' },
    });
    expect(put).toHaveBeenCalledWith('/flows/7/', {
      title: 'Updated automation flow',
      status: Status.Active,
      meta: { view: 'timeline' },
    });
    expect(patch).toHaveBeenCalledWith('/flows/7/', {
      status: Status.Archived,
      meta: null,
    });
    expect(deleteFn).toHaveBeenCalledWith('/flows/7/');
  });

  it('loads incomplete flow tasks through the flow task projection endpoint', async () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 11,
          uuid: 'task-11',
          title: 'Open task',
          status: Status.Active,
          priority: 'medium',
          due_date: null,
          is_completed: false,
        },
      ],
    };
    const get = vi.fn(() => of(response));
    const service = new FlowsApiService(
      { get } as unknown as HttpInterceptorClient
    );

    const result = await firstValueFrom(
      service.getFlowTasks(7, {
        isCompleted: false,
        page: 1,
        pageSize: 50,
      })
    );

    expect(get).toHaveBeenCalledWith(
      '/flows/7/tasks/?is_completed=false&page=1&page_size=50'
    );
    expect(result.results[0]?.is_completed).toBe(false);
  });

  it('creates a task linked to the flow through the task endpoint', async () => {
    const response = {
      id: 22,
      uuid: 'task-22',
      title: 'Draft outreach',
      status: Status.Draft,
      priority: Priority.Lowest,
      due_date: null,
      is_completed: false,
    };
    const post = vi.fn(() => of(response));
    const service = new FlowsApiService(
      { post } as unknown as HttpInterceptorClient
    );

    const result = await firstValueFrom(
      service.createFlowTask(7, {
        title: 'Draft outreach',
        description: '',
        is_standalone: true,
      })
    );

    expect(post).toHaveBeenCalledWith('/tasks/', {
      title: 'Draft outreach',
      description: '',
      is_standalone: true,
      flow_ids: [7],
    });
    expect(result).toEqual(response);
  });

  it('loads and patches full task details through task endpoints', async () => {
    const task = {
      id: 22,
      uuid: '00000000-0000-4000-8000-000000000022',
      title: 'Draft outreach',
      description: 'Call the lead',
      created_at: new Date(),
      start_date: null,
      due_date: null,
      resolved_date: null,
      estimate: 0,
      subtasks: [],
      priority: Priority.Medium,
      status: Status.Active,
      tags: [],
      challenge: null,
      goal: null,
      strategy: null,
      is_completed: false,
      is_standalone: true,
      relations: [],
      flows: [],
      story: null,
    };
    const get = vi.fn(() => of(task));
    const patch = vi.fn(() => of({ ...task, title: 'Updated outreach' }));
    const service = new FlowsApiService({
      get,
      patch,
    } as unknown as HttpInterceptorClient);

    await firstValueFrom(service.getTask(task.uuid));
    const updated = await firstValueFrom(
      service.patchTask(task.uuid, {
        title: 'Updated outreach',
        goal_id: 7,
        story_id: 17,
      })
    );

    expect(get).toHaveBeenCalledWith(`/tasks/${task.uuid}/`);
    expect(patch).toHaveBeenCalledWith(`/tasks/${task.uuid}/`, {
      title: 'Updated outreach',
      goal_id: 7,
      story_id: 17,
    });
    expect(updated.title).toBe('Updated outreach');
  });
});

function createFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Flow',
    status: overrides.status ?? Status.Draft,
    meta: overrides.meta ?? null,
    tasks: overrides.tasks ?? [],
  };
}
