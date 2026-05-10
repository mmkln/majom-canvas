import type { Flow } from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowTaskListItem } from '../../../majom-wrapper/data-access/flows-api-service.ts';

export type FlowsRequestStatus = 'idle' | 'loading' | 'ready' | 'error';
export type FlowColumnTaskStatus = 'idle' | 'loading' | 'ready' | 'error';

export type FlowColumn = {
  flow: Flow;
  tasks: FlowTaskListItem[];
  taskStatus: FlowColumnTaskStatus;
  taskError: string | null;
  openTaskCount: number;
};

export type FlowsState = {
  columns: FlowColumn[];
  status: FlowsRequestStatus;
  error: string | null;
};
