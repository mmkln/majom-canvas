import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import type { IconName } from './icons.ts';

export const ROUTINE_STATUS_ORDER: readonly Array<
  Status.Active | Status.Archived
> = [Status.Active, Status.Archived];

export const ROUTINE_STATUS_ICON_MAP: Record<
  Status.Active | Status.Archived,
  IconName
> = {
  [Status.Active]: 'check-circle',
  [Status.Archived]: 'archive-box',
};

export const ROUTINE_STATUS_ICON_TONE_CLASS: Record<
  Status.Active | Status.Archived,
  string
> = {
  [Status.Active]: 'text-blue-600',
  [Status.Archived]: 'text-slate-500',
};

export function getRoutineStatusLabel(
  status: Status.Active | Status.Archived,
  i18n?: Pick<I18nService, 't'>
): string {
  if (status === Status.Archived) {
    return i18n?.t('routineStatus.archived') ?? 'Archived';
  }
  return i18n?.t('routineStatus.active') ?? 'Active';
}
