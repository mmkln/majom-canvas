import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { FlowsApiService } from './flows-api-service.ts';
import {
  FocusStatus,
  FocusType,
  Priority,
  Status,
} from '../interfaces/index.ts';
import type { Flow } from '../interfaces/index.ts';
import type { HttpInterceptorClient } from './http-interceptor.ts';

describe('FlowsApiService', () => {
  it('loads flows from the backend list endpoint', async () => {
    const flows = [
      createFlow({ id: 1, title: 'Launch flow', status: Status.Active }),
    ];
    const get = vi.fn(() => of(flows));
    const service = new FlowsApiService({
      get,
    } as unknown as HttpInterceptorClient);

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
    const service = new FlowsApiService({
      get,
    } as unknown as HttpInterceptorClient);

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
    const service = new FlowsApiService({
      get,
    } as unknown as HttpInterceptorClient);

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
    const service = new FlowsApiService({
      post,
    } as unknown as HttpInterceptorClient);

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

  it('calls flow focus endpoints with camelCase payloads', async () => {
    const focus = createFocus();
    const get = vi.fn(() => of([focus]));
    const post = vi.fn(() => of(focus));
    const patch = vi.fn(() => of({ ...focus, title: 'Updated focus' }));
    const service = new FlowsApiService({
      get,
      post,
      patch,
    } as unknown as HttpInterceptorClient);

    await firstValueFrom(
      service.getFlowFocuses(7, {
        status: FocusStatus.Active,
        type: FocusType.Mission,
        includeArchived: false,
      })
    );
    await firstValueFrom(
      service.createFlowFocus(7, {
        type: FocusType.Mission,
        title: 'Build proof case',
        status: FocusStatus.Candidate,
        successCriteria: 'Case is documented.',
        evidenceRequired: 'Screenshots',
      })
    );
    await firstValueFrom(
      service.patchFlowFocus(focus.id, {
        title: 'Updated focus',
        closeReason: null,
      })
    );
    await firstValueFrom(
      service.activateFlowFocus(focus.id, {
        replaceActive: true,
        startDate: '2026-05-18',
      })
    );
    await firstValueFrom(
      service.completeFlowFocus(focus.id, {
        closeReason: 'Done enough.',
        endDate: '2026-05-18',
      })
    );

    expect(get).toHaveBeenCalledWith(
      '/flows/7/focuses/?status=active&type=mission&includeArchived=false'
    );
    expect(post).toHaveBeenNthCalledWith(1, '/flows/7/focuses/', {
      type: FocusType.Mission,
      title: 'Build proof case',
      status: FocusStatus.Candidate,
      successCriteria: 'Case is documented.',
      evidenceRequired: 'Screenshots',
    });
    expect(patch).toHaveBeenCalledWith(`/flow-focuses/${focus.id}/`, {
      title: 'Updated focus',
      closeReason: null,
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      `/flow-focuses/${focus.id}/activate/`,
      {
        replaceActive: true,
        startDate: '2026-05-18',
      }
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      `/flow-focuses/${focus.id}/complete/`,
      {
        closeReason: 'Done enough.',
        endDate: '2026-05-18',
      }
    );
  });
});

function createFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Flow',
    status: overrides.status ?? Status.Draft,
    meta: overrides.meta ?? null,
    tasks: overrides.tasks ?? [],
    currentFocus: overrides.currentFocus ?? null,
  };
}

function createFocus() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    flowId: '22222222-2222-4222-8222-222222222222',
    type: FocusType.Mission,
    title: 'Build proof case',
    description: '',
    status: FocusStatus.Active,
    startDate: null,
    endDate: null,
    successCriteria: 'Case is documented.',
    evidenceRequired: 'Screenshots',
    evidence: null,
    closeReason: null,
    isPrimary: true,
    createdAt: '2026-05-18T00:00:00Z',
    updatedAt: '2026-05-18T00:00:00Z',
  };
}
