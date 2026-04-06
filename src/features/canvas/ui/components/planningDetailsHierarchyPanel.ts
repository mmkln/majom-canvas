import {
  createPlanningEntityIcon,
  type PlanningEntityIconKind,
} from './PlanningEntityIcon.ts';

export const HIERARCHY_PANEL_SECTION_CLASS =
  'min-h-0 min-w-0 overflow-hidden border-t border-slate-200/80 pt-4 md:border-t-0 md:pt-0';

export const HIERARCHY_PANEL_HEADER_CLASS =
  'flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 pt-4 pb-3 md:px-5 md:pt-5';

export const HIERARCHY_PANEL_LIST_CLASS =
  'mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 md:px-5 md:pb-5';

type HierarchyEmptyTone = 'neutral' | 'error';

export function createHierarchyEmptyState(
  message: string,
  tone: HierarchyEmptyTone = 'neutral'
): HTMLDivElement {
  const element = document.createElement('div');
  element.className =
    tone === 'error'
      ? 'rounded-lg border border-dashed border-rose-200/80 bg-rose-50/70 px-4 py-4 text-sm leading-6 text-rose-600'
      : 'rounded-lg border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-500';
  element.textContent = message;
  return element;
}

export function getHierarchyRowClass(options?: {
  interactive?: boolean;
  selected?: boolean;
}): string {
  const interactive = options?.interactive ?? false;
  const selected = options?.selected ?? false;
  const baseClass =
    'group flex items-start gap-3 rounded-lg px-3 py-3 ring-1 ring-inset outline-none transition-[background-color,box-shadow,border-color]';

  if (selected) {
    return `${baseClass} cursor-pointer bg-blue-50/80 shadow-[0_1px_2px_rgba(59,130,246,0.08)] ring-blue-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-200`;
  }

  if (interactive) {
    return `${baseClass} cursor-pointer bg-slate-50/70 ring-slate-200/80 hover:bg-white hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-300`;
  }

  return `${baseClass} bg-slate-50/70 ring-slate-200/80`;
}

export function createHierarchyRowIcon(
  kind: PlanningEntityIconKind
): HTMLSpanElement {
  return createPlanningEntityIcon({
    kind,
    variant: 'ghost',
    size: 'sm',
    className:
      'rounded-lg bg-white/85 ring-1 ring-inset ring-slate-200/80 shadow-none',
  });
}

export function styleHierarchyActionButton(
  button: HTMLButtonElement
): HTMLButtonElement {
  button.classList.add(
    'opacity-0',
    'transition-opacity',
    'duration-150',
    'group-hover:opacity-100',
    'group-focus-within:opacity-100',
    'focus-visible:opacity-100'
  );
  return button;
}

export const HIERARCHY_STATUS_BADGE_CLASS =
  'w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-normal';
