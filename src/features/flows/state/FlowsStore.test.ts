import { describe, expect, it, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import {
  Priority,
  Status,
  type Flow,
} from '../../../majom-wrapper/interfaces/index.ts';
import { FlowsStore } from './FlowsStore.ts';

describe('FlowsStore', () => {
  it('loads and sorts flows through the single API owner', async () => {
    const flows = [
      createFlow({ id: 2, title: 'Beta' }),
      createFlow({ id: 1, title: 'Alpha' }),
    ];
    const api = {
      getFlows: vi.fn(() => of(flows)),
      getFlowTasks: vi.fn((flowId: number) =>
        of({
          count: 1,
          next: null,
          previous: null,
          results: [createTask({ id: flowId * 10, title: `Task ${flowId}` })],
        })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);

    await store.load();

    expect(api.getFlows).toHaveBeenCalledTimes(1);
    expect(api.getFlowTasks).toHaveBeenCalledWith(1, {
      isCompleted: false,
      page: 1,
      pageSize: 50,
    });
    expect(store.snapshot.status).toBe('ready');
    expect(store.snapshot.columns.map((column) => column.flow.title)).toEqual([
      'Alpha',
      'Beta',
    ]);
    expect(store.snapshot.columns[0]?.tasks[0]?.title).toBe('Task 1');
  });

  it('publishes a load error state when the backend request fails', async () => {
    const store = new FlowsStore({
      getFlows: vi.fn(() => throwError(() => new Error('network'))),
      getFlowTasks: vi.fn(),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    });

    await store.load();

    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.error).toBe('flows.errors.load');
  });

  it('patches flow settings and keeps columns sorted by title', async () => {
    const api = {
      getFlows: vi.fn(() =>
        of([
          createFlow({ id: 1, title: 'Alpha' }),
          createFlow({ id: 2, title: 'Beta' }),
        ])
      ),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(() =>
        of(
          createFlow({
            id: 2,
            title: 'Aardvark',
            meta: { presentation: { color: 'rose' } },
          })
        )
      ),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    await store.patchFlow(2, {
      title: 'Aardvark',
      meta: { presentation: { color: 'rose' } },
    });

    expect(api.patchFlow).toHaveBeenCalledWith(2, {
      title: 'Aardvark',
      meta: { presentation: { color: 'rose' } },
    });
    expect(store.snapshot.columns.map((column) => column.flow.title)).toEqual([
      'Aardvark',
      'Alpha',
    ]);
  });

  it('publishes patched flow meta before the backend response resolves', async () => {
    const flows = [
      createFlow({ id: 1, title: 'Alpha', meta: { presentation: { collapsed: false } } }),
    ];
    const patchResponse = new Subject<Flow>();
    const api = {
      getFlows: vi.fn(() => of(flows)),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(() => patchResponse),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    const patchPromise = store.patchFlow(1, {
      meta: { presentation: { collapsed: true } },
    });

    expect(store.snapshot.columns[0]?.flow.meta).toEqual({
      presentation: { collapsed: true },
    });

    patchResponse.next(createFlow({
      id: 1,
      title: 'Alpha',
      meta: { presentation: { collapsed: true } },
    }));
    patchResponse.complete();
    await patchPromise;
  });

  it('orders flows by persisted meta pos when present', async () => {
    const api = {
      getFlows: vi.fn(() =>
        of([
          createFlow({ id: 1, title: 'Alpha', meta: { pos: 2048 } }),
          createFlow({ id: 2, title: 'Beta', meta: { pos: 1024 } }),
        ])
      ),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);

    await store.load();

    expect(store.snapshot.columns.map((column) => column.flow.id)).toEqual([
      2, 1,
    ]);
  });

  it('persists reordered flow columns through meta pos patches', async () => {
    const flows = [
      createFlow({ id: 1, title: 'Alpha', meta: { existing: 'one' } }),
      createFlow({ id: 2, title: 'Beta', meta: { existing: 'two' } }),
      createFlow({ id: 3, title: 'Gamma', meta: { existing: 'three' } }),
    ];
    const api = {
      getFlows: vi.fn(() => of(flows)),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn((flowId: number, patch: Partial<Flow>) =>
        of({
          ...flows.find((flow) => flow.id === flowId)!,
          ...patch,
        })
      ),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    await store.reorderFlowColumns(3, 0);

    expect(api.patchFlow).toHaveBeenCalledWith(3, {
      meta: { existing: 'three', pos: 1024 },
    });
    expect(api.patchFlow).toHaveBeenCalledWith(1, {
      meta: { existing: 'one', pos: 2048 },
    });
    expect(api.patchFlow).toHaveBeenCalledWith(2, {
      meta: { existing: 'two', pos: 3072 },
    });
    expect(store.snapshot.columns.map((column) => column.flow.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it('publishes reordered columns before backend pos patches resolve', async () => {
    const flows = [
      createFlow({ id: 1, title: 'Alpha', meta: { existing: 'one' } }),
      createFlow({ id: 2, title: 'Beta', meta: { existing: 'two' } }),
      createFlow({ id: 3, title: 'Gamma', meta: { existing: 'three' } }),
    ];
    const patchResponses = new Map<number, Subject<Flow>>();
    const api = {
      getFlows: vi.fn(() => of(flows)),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn((flowId: number) => {
        const response = new Subject<Flow>();
        patchResponses.set(flowId, response);
        return response;
      }),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    const reorderPromise = store.reorderFlowColumns(3, 0);

    expect(store.snapshot.columns.map((column) => column.flow.id)).toEqual([
      3, 1, 2,
    ]);

    for (const flow of flows) {
      const response = patchResponses.get(flow.id);
      if (!response) continue;
      response.next(flow);
      response.complete();
    }
    await reorderPromise;
  });

  it('creates a flow and loads its initial open tasks', async () => {
    const created = createFlow({ id: 4, title: 'Delta' });
    const api = {
      getFlows: vi.fn(() => of([createFlow({ id: 1, title: 'Alpha' })])),
      getFlowTasks: vi.fn((flowId: number) =>
        of({
          count: flowId === 4 ? 1 : 0,
          next: null,
          previous: null,
          results:
            flowId === 4 ? [createTask({ id: 40, title: 'First task' })] : [],
        })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(() => of(created)),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    await store.createFlow({ title: 'Delta' });

    expect(api.createFlow).toHaveBeenCalledWith({ title: 'Delta' });
    expect(api.getFlowTasks).toHaveBeenCalledWith(4, {
      isCompleted: false,
      page: 1,
      pageSize: 50,
    });
    expect(store.snapshot.columns.map((column) => column.flow.title)).toEqual([
      'Alpha',
      'Delta',
    ]);
    expect(store.snapshot.columns[1]?.tasks[0]?.title).toBe('First task');
  });

  it('creates a task for a flow and appends it to the open task list', async () => {
    const api = {
      getFlows: vi.fn(() => of([createFlow({ id: 1, title: 'Alpha' })])),
      getFlowTasks: vi.fn(() =>
        of({
          count: 1,
          next: null,
          previous: null,
          results: [createTask({ id: 10, title: 'Existing task' })],
        })
      ),
      createFlowTask: vi.fn(() =>
        of(createTask({ id: 11, title: 'New task' }))
      ),
      getTask: vi.fn(),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    await store.createFlowTask(1, '  New task  ');

    expect(api.createFlowTask).toHaveBeenCalledWith(1, {
      title: 'New task',
      description: '',
      is_standalone: true,
    });
    expect(store.snapshot.columns[0]?.tasks.map((task) => task.title)).toEqual(
      ['Existing task', 'New task']
    );
    expect(store.snapshot.columns[0]?.openTaskCount).toBe(2);
  });

  it('loads full task details for a flow task edit modal', async () => {
    const api = {
      getFlows: vi.fn(() => of([createFlow({ id: 1, title: 'Alpha' })])),
      getFlowTasks: vi.fn(() =>
        of({ count: 0, next: null, previous: null, results: [] })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(() =>
        of(createFullTask({ title: 'Loaded task', description: 'Details' }))
      ),
      patchTask: vi.fn(),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    const task = await store.loadFlowTask(1, 'task-1');

    expect(api.getTask).toHaveBeenCalledWith('task-1');
    expect(task.description).toBe('Details');
  });

  it('patches a flow task and removes it from open tasks when completed', async () => {
    const api = {
      getFlows: vi.fn(() => of([createFlow({ id: 1, title: 'Alpha' })])),
      getFlowTasks: vi.fn(() =>
        of({
          count: 1,
          next: null,
          previous: null,
          results: [createTask({ id: 10, uuid: 'task-10', title: 'Open task' })],
        })
      ),
      createFlowTask: vi.fn(),
      getTask: vi.fn(),
      patchTask: vi.fn(() =>
        of(
          createFullTask({
            id: 10,
            uuid: 'task-10',
            title: 'Done task',
            status: Status.Completed,
            is_completed: true,
          })
        )
      ),
      createFlow: vi.fn(),
      patchFlow: vi.fn(),
      deleteFlow: vi.fn(),
    };
    const store = new FlowsStore(api);
    await store.load();

    await store.patchFlowTask(1, 'task-10', {
      status: Status.Completed,
      goalId: 7,
      storyId: 17,
    });

    expect(api.patchTask).toHaveBeenCalledWith('task-10', {
      status: Status.Completed,
      is_completed: true,
      goal_id: 7,
      story_id: 17,
    });
    expect(store.snapshot.columns[0]?.tasks).toEqual([]);
    expect(store.snapshot.columns[0]?.openTaskCount).toBe(0);
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

function createTask(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 1,
    uuid: overrides.uuid ?? `task-${overrides.id ?? 1}`,
    title: overrides.title ?? 'Task',
    status: overrides.status ?? Status.Active,
    priority: overrides.priority ?? Priority.Medium,
    due_date: overrides.due_date ?? null,
    is_completed: overrides.is_completed ?? false,
  };
}

function createFullTask(overrides: Partial<any> = {}) {
  return {
    ...createTask(overrides),
    description: overrides.description ?? '',
    created_at: new Date(),
    start_date: null,
    resolved_date: null,
    estimate: 0,
    subtasks: [],
    tags: [],
    challenge: null,
    goal: null,
    strategy: null,
    is_standalone: true,
    relations: [],
    flows: [],
    story: null,
  };
}
