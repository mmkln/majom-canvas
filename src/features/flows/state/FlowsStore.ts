import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type {
  FlowCreatePayload,
  FlowsApiService,
  FlowTaskListItem,
  FlowUpdatePayload,
} from '../../../majom-wrapper/data-access/flows-api-service.ts';
import type { Flow } from '../../../majom-wrapper/interfaces/index.ts';
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
      'getFlows' | 'getFlowTasks' | 'createFlow' | 'patchFlow' | 'deleteFlow'
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

function createLoadingColumn(flow: Flow): FlowColumn {
  return {
    flow,
    tasks: [],
    taskStatus: 'loading',
    taskError: null,
    openTaskCount: 0,
  };
}
