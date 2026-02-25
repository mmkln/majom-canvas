import { ElementStatus } from '../elements/ElementStatus.ts';
import type { IconName } from './icons.ts';

export const STATUS_ORDER: readonly ElementStatus[] = [
  ElementStatus.Defined,
  ElementStatus.Pending,
  ElementStatus.InProgress,
  ElementStatus.Done,
];

export const STATUS_ICON_MAP: Readonly<Record<ElementStatus, IconName>> = {
  [ElementStatus.Done]: 'check',
  [ElementStatus.InProgress]: 'arrow-path',
  [ElementStatus.Pending]: 'status-pending',
  [ElementStatus.Defined]: 'map-pin',
};

export const STATUS_ICON_TONE_CLASS: Readonly<Record<ElementStatus, string>> = {
  [ElementStatus.Done]: 'text-emerald-600',
  [ElementStatus.InProgress]: 'text-blue-600',
  [ElementStatus.Pending]: 'text-amber-600',
  [ElementStatus.Defined]: 'text-slate-500',
};

export function getStatusLabel(status: ElementStatus): string {
  switch (status) {
    case ElementStatus.InProgress:
      return 'In progress';
    case ElementStatus.Pending:
      return 'Pending';
    case ElementStatus.Done:
      return 'Done';
    case ElementStatus.Defined:
    default:
      return 'Defined';
  }
}
