import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import { ElementStatus } from './ElementStatus.ts';
import type { IconName } from '../ui/icons.ts';

export const ROUTINE_STATUS_ORDER: readonly ElementStatus[] = [
  ElementStatus.InProgress,
  ElementStatus.Done,
];

export const ROUTINE_STATUS_OPTIONS: Array<{
  value: ElementStatus;
  label: string;
}> = ROUTINE_STATUS_ORDER.map((status) => ({
  value: status,
  label: getRoutineStatusLabel(status),
}));

export function normalizeRoutineStatus(status: ElementStatus): ElementStatus {
  return status === ElementStatus.Done
    ? ElementStatus.Done
    : ElementStatus.InProgress;
}

export function getRoutineStatusLabel(status: ElementStatus): string {
  return status === ElementStatus.Done ? 'Archived' : 'Active';
}

export function getRoutineStatusIcon(status: ElementStatus): IconName {
  return status === ElementStatus.Done ? 'archive-box' : 'arrow-path';
}

export function getRoutineStatusIconToneClass(status: ElementStatus): string {
  return status === ElementStatus.Done ? '!text-slate-500' : '!text-blue-600';
}

export function getRoutineStatusChipPalette(status: ElementStatus): string {
  return status === ElementStatus.Done
    ? 'border-slate-200 bg-slate-100 text-slate-600'
    : 'border-blue-200 bg-blue-100 text-blue-700';
}

export function mapRoutineStatusToBackend(status: ElementStatus): Status {
  return status === ElementStatus.Done ? Status.Archived : Status.Active;
}
