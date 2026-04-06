import { ElementStatus } from '../elements/ElementStatus.ts';
import type { IconName } from './icons.ts';
import type { I18nService } from '../../../i18n/index.ts';

export const STATUS_ORDER: readonly ElementStatus[] = [
  ElementStatus.Done,
  ElementStatus.InProgress,
  ElementStatus.Pending,
  ElementStatus.Defined,
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
  [ElementStatus.Pending]: 'text-yellow-600',
  [ElementStatus.Defined]: 'text-slate-500',
};

export const STATUS_BADGE_TONE_CLASS: Readonly<Record<ElementStatus, string>> = {
  [ElementStatus.Done]:
    'w-fit shrink-0 justify-start gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium tracking-normal text-emerald-700',
  [ElementStatus.InProgress]:
    'w-fit shrink-0 justify-start gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium tracking-normal text-blue-700',
  [ElementStatus.Pending]:
    'w-fit shrink-0 justify-start gap-1 rounded-md bg-yellow-50 px-2 py-0.5 text-[11px] font-medium tracking-normal text-yellow-700',
  [ElementStatus.Defined]:
    'w-fit shrink-0 justify-start gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium tracking-normal text-slate-600',
};

type StatusTranslationApi = Pick<I18nService, 't'>;

export function getStatusLabel(
  status: ElementStatus,
  i18n?: StatusTranslationApi
): string {
  switch (status) {
    case ElementStatus.InProgress:
      return i18n?.t('status.inProgress') ?? 'In progress';
    case ElementStatus.Pending:
      return i18n?.t('status.pending') ?? 'Pending';
    case ElementStatus.Done:
      return i18n?.t('status.done') ?? 'Done';
    case ElementStatus.Defined:
    default:
      return i18n?.t('status.defined') ?? 'Defined';
  }
}

export function getMixedStatusLabel(i18n?: StatusTranslationApi): string {
  return i18n?.t('status.mixed') ?? 'Mixed';
}
