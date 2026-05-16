import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type {
  FlowCreatePayload,
  FlowsApiService,
  FlowTaskListItem,
  FlowUpdatePayload,
} from '../../../majom-wrapper/data-access/flows-api-service.ts';
import type {
  Flow,
  PlatformTask,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  normalizeTaskEditModel,
  normalizeTaskEditPatch,
  taskEditPatchToPlatformTaskPatch,
  type TaskEditModel,
  type TaskEditPatch,
} from '../../tasks/index.ts';
import {
  compareFlowsForDisplay,
  resolveFlowColumnPosPatches,
  writeFlowColumnPos,
} from '../domain/flowColumnPosition.ts';
import type { FlowColumn, FlowsState } from '../domain/types.ts';

const FLOW_TASK_PAGE_SIZE = 50;

const INITIAL_STATE: FlowsState = {
  columns: [],
  status: 'idle',
  error: null,
};

function normalizeFlows(flows: Flow[]): Flow[] {
  return [...flows].sort(compareFlowsForDisplay);
}

export class FlowsStore {
  private readonly stateSubject = new BehaviorSubject<FlowsState>(
    INITIAL_STATE
  );
  public readonly state$ = this.stateSubject.asObservable();
  private loadVersion = 0;
  private reorderVersion = 0;
  private readonly flowPatchVersions = new Map<Flow['id'], number>();

  constructor(
    private readonly api: Pick<
      FlowsApiService,
      | 'getFlows'
      | 'getFlowTasks'
      | 'createFlowTask'
      | 'getTask'
      | 'patchTask'
      | 'createFlow'
      | 'patchFlow'
      | 'deleteFlow'
    >
  ) {}

  public get snapshot(): FlowsState {
    return this.stateSubject.value;
  }

  public destroy(): void {
    this.loadVersion += 1;
    this.stateSubject.complete();
  }

  public async load(): Promise<void> {
    const version = ++this.loadVersion;
    this.patchState({ status: 'loading', error: null });
    try {
      const flows = normalizeFlows(await firstValueFrom(this.api.getFlows()));
      if (version !== this.loadVersion) return;
      this.patchState({
        columns: flows.map(createLoadingColumn),
        status: 'ready',
        error: null,
      });
      await Promise.all(
        flows.map((flow) => this.loadColumnTasks(flow, version))
      );
    } catch {
      if (version !== this.loadVersion) return;
      this.patchState({
        status: 'error',
        error: 'flows.errors.load',
      });
    }
  }

  public async patchFlow(
    flowId: Flow['id'],
    patch: FlowUpdatePayload
  ): Promise<void> {
    const previousColumn =
      this.snapshot.columns.find((column) => column.flow.id === flowId) ?? null;
    const requestVersion = (this.flowPatchVersions.get(flowId) ?? 0) + 1;
    this.flowPatchVersions.set(flowId, requestVersion);

    if (previousColumn) {
      this.replaceFlow(applyFlowPatch(previousColumn.flow, patch));
    }

    try {
      const updated = await firstValueFrom(this.api.patchFlow(flowId, patch));
      if (this.flowPatchVersions.get(flowId) === requestVersion) {
        this.replaceFlow(updated);
      }
    } catch (error) {
      if (
        previousColumn &&
        this.flowPatchVersions.get(flowId) === requestVersion
      ) {
        this.replaceFlow(previousColumn.flow);
      }
      throw error;
    }
  }

  public async createFlow(payload: FlowCreatePayload): Promise<void> {
    const created = await firstValueFrom(this.api.createFlow(payload));
    const version = this.loadVersion;
    this.patchState({
      columns: normalizeColumns([
        ...this.snapshot.columns,
        createLoadingColumn(created),
      ]),
    });
    await this.loadColumnTasks(created, version);
  }

  public async createFlowTask(
    flowId: Flow['id'],
    title: string
  ): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    const created = await firstValueFrom(
      this.api.createFlowTask(flowId, {
        title: normalizedTitle,
        description: '',
        is_standalone: true,
      })
    );
    const column = this.snapshot.columns.find(
      (candidate) => candidate.flow.id === flowId
    );
    if (!column) return;

    this.patchColumn(flowId, {
      tasks: appendUniqueTask(column.tasks, created),
      taskStatus: 'ready',
      taskError: null,
      openTaskCount: created.is_completed
        ? column.openTaskCount
        : column.openTaskCount + 1,
    });
  }

  public async loadFlowTask(
    flowId: Flow['id'],
    taskRef: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>
  ): Promise<TaskEditModel> {
    if (!this.snapshot.columns.some((column) => column.flow.id === flowId)) {
      throw new Error('Flow column is not loaded.');
    }
    const task = await firstValueFrom(this.api.getTask(taskRef));
    return normalizeTaskEditModel(task);
  }

  public async patchFlowTask(
    flowId: Flow['id'],
    taskRef: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>,
    patch: TaskEditPatch
  ): Promise<TaskEditModel> {
    const normalizedPatch = normalizeTaskEditPatch(patch);
    const previousColumns = this.snapshot.columns;
    const previousColumn = previousColumns.find(
      (column) => column.flow.id === flowId
    );

    if (previousColumn) {
      this.patchColumn(
        flowId,
        applyTaskPatchToColumn(previousColumn, taskRef, normalizedPatch)
      );
    }

    try {
      const updated = await firstValueFrom(
        this.api.patchTask(
          taskRef,
          taskEditPatchToPlatformTaskPatch(normalizedPatch)
        )
      );
      const model = normalizeTaskEditModel(updated);
      const currentColumn = this.snapshot.columns.find(
        (column) => column.flow.id === flowId
      );
      if (currentColumn) {
        this.patchColumn(flowId, applyTaskModelToColumn(currentColumn, model));
      }
      return model;
    } catch (error) {
      this.patchState({ columns: previousColumns });
      throw error;
    }
  }

  public async reorderFlowColumns(
    flowId: Flow['id'],
    insertionIndex: number
  ): Promise<void> {
    const posPatches = resolveFlowColumnPosPatches(
      this.snapshot.columns,
      flowId,
      insertionIndex
    );
    if (posPatches.length === 0) return;

    const requestVersion = ++this.reorderVersion;
    const previousColumns = this.snapshot.columns;
    this.patchState({
      columns: applyFlowPosPatches(this.snapshot.columns, posPatches),
    });

    try {
      const updatedFlows = await Promise.all(
        posPatches.map(({ column, pos }) =>
          firstValueFrom(
            this.api.patchFlow(column.flow.id, {
              meta: writeFlowColumnPos(column.flow.meta, pos),
            })
          )
        )
      );
      if (requestVersion !== this.reorderVersion) return;
      const updatedById = new Map(
        updatedFlows.map((flow) => [flow.id, flow] as const)
      );
      this.patchState({
        columns: normalizeColumns(
          this.snapshot.columns.map((column) => {
            const updated = updatedById.get(column.flow.id);
            return updated ? { ...column, flow: updated } : column;
          })
        ),
      });
    } catch (error) {
      if (requestVersion === this.reorderVersion) {
        this.patchState({ columns: previousColumns });
      }
      throw error;
    }
  }

  public async deleteFlow(flowId: Flow['id']): Promise<void> {
    await firstValueFrom(this.api.deleteFlow(flowId));
    this.patchState({
      columns: this.snapshot.columns.filter(
        (column) => column.flow.id !== flowId
      ),
    });
  }

  private async loadColumnTasks(flow: Flow, version: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.getFlowTasks(flow.id, {
          isCompleted: false,
          page: 1,
          pageSize: FLOW_TASK_PAGE_SIZE,
        })
      );
      if (version !== this.loadVersion) return;
      this.patchColumn(flow.id, {
        tasks: response.results,
        taskStatus: 'ready',
        taskError: null,
        openTaskCount: response.count,
      });
    } catch {
      if (version !== this.loadVersion) return;
      this.patchColumn(flow.id, {
        taskStatus: 'error',
        taskError: 'flows.tasks.errors.load',
      });
    }
  }

  private patchColumn(
    flowId: Flow['id'],
    patch: Partial<Omit<FlowColumn, 'flow'>>
  ): void {
    this.patchState({
      columns: this.snapshot.columns.map((column) =>
        column.flow.id === flowId ? { ...column, ...patch } : column
      ),
    });
  }

  private replaceFlow(flow: Flow): void {
    this.patchState({
      columns: normalizeColumns(
        this.snapshot.columns.map((column) =>
          column.flow.id === flow.id ? { ...column, flow } : column
        )
      ),
    });
  }

  private patchState(patch: Partial<FlowsState>): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...patch,
    });
  }
}

function normalizeColumns(columns: FlowColumn[]): FlowColumn[] {
  return [...columns].sort((left, right) =>
    compareFlowsForDisplay(left.flow, right.flow)
  );
}

function applyFlowPatch(flow: Flow, patch: FlowUpdatePayload): Flow {
  return {
    ...flow,
    ...patch,
  };
}

function applyFlowPosPatches(
  columns: FlowColumn[],
  posPatches: Array<{ column: FlowColumn; pos: number }>
): FlowColumn[] {
  const posByFlowId = new Map(
    posPatches.map(({ column, pos }) => [column.flow.id, pos] as const)
  );
  return normalizeColumns(
    columns.map((column) => {
      const pos = posByFlowId.get(column.flow.id);
      return pos === undefined
        ? column
        : {
            ...column,
            flow: {
              ...column.flow,
              meta: writeFlowColumnPos(column.flow.meta, pos),
            },
          };
    })
  );
}

function appendUniqueTask(
  tasks: FlowTaskListItem[],
  task: FlowTaskListItem
): FlowTaskListItem[] {
  if (tasks.some((candidate) => candidate.id === task.id)) {
    return tasks;
  }
  return [...tasks, task];
}

function getTaskRef(task: Pick<FlowTaskListItem, 'id' | 'uuid'>): string {
  return String(task.uuid ?? task.id);
}

function isSameTask(
  task: Pick<FlowTaskListItem, 'id' | 'uuid'>,
  ref: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>
): boolean {
  return getTaskRef(task) === String(ref) || String(task.id) === String(ref);
}

function applyTaskPatchToColumn(
  column: FlowColumn,
  taskRef: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>,
  patch: TaskEditPatch
): Partial<Omit<FlowColumn, 'flow'>> {
  const previousTask = column.tasks.find((task) => isSameTask(task, taskRef));
  if (!previousTask) return {};
  const nextTask = applyTaskPatchToListItem(previousTask, patch);
  if (nextTask.is_completed) {
    return {
      tasks: column.tasks.filter((task) => !isSameTask(task, taskRef)),
      openTaskCount: Math.max(0, column.openTaskCount - 1),
    };
  }
  return {
    tasks: column.tasks.map((task) =>
      isSameTask(task, taskRef) ? nextTask : task
    ),
  };
}

function applyTaskModelToColumn(
  column: FlowColumn,
  task: TaskEditModel
): Partial<Omit<FlowColumn, 'flow'>> {
  const taskRef = task.uuid ?? task.id;
  const exists = column.tasks.some((candidate) => isSameTask(candidate, taskRef));
  if (task.isCompleted) {
    return {
      tasks: column.tasks.filter((candidate) => !isSameTask(candidate, taskRef)),
      openTaskCount: exists
        ? Math.max(0, column.openTaskCount - 1)
        : column.openTaskCount,
    };
  }
  const listItem = taskEditModelToListItem(task);
  return {
    tasks: exists
      ? column.tasks.map((candidate) =>
          isSameTask(candidate, taskRef) ? listItem : candidate
        )
      : [...column.tasks, listItem],
    openTaskCount: exists ? column.openTaskCount : column.openTaskCount + 1,
  };
}

function applyTaskPatchToListItem(
  task: FlowTaskListItem,
  patch: TaskEditPatch
): FlowTaskListItem {
  return {
    ...task,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
    ...(patch.isCompleted !== undefined
      ? { is_completed: patch.isCompleted }
      : {}),
  };
}

function taskEditModelToListItem(task: TaskEditModel): FlowTaskListItem {
  return {
    id: task.id,
    uuid: task.uuid,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    is_completed: task.isCompleted,
  };
}

function createLoadingColumn(flow: Flow): FlowColumn {
  return {
    flow,
    tasks: [],
    taskStatus: 'loading',
    taskError: null,
    openTaskCount: 0,
  };
}
