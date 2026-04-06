import { createIcon, type IconName } from '../icons.ts';

export type PlanningEntityIconKind = 'goal' | 'story' | 'task';
export type PlanningEntityIconVariant = 'solid' | 'ghost';
export type PlanningEntityIconSize = 'sm' | 'md';

type PlanningEntityIconOptions = {
  kind: PlanningEntityIconKind;
  variant?: PlanningEntityIconVariant;
  size?: PlanningEntityIconSize;
  className?: string;
};

const ICON_BY_KIND: Record<PlanningEntityIconKind, IconName> = {
  goal: 'goal-circle',
  story: 'book-open',
  task: 'check-box',
};

const SOLID_TONE_BY_KIND: Record<PlanningEntityIconKind, string> = {
  goal: 'bg-violet-600 text-white',
  story: 'bg-blue-600 text-white',
  task: 'bg-emerald-600 text-white',
};

const GHOST_TONE_BY_KIND: Record<PlanningEntityIconKind, string> = {
  goal: 'bg-transparent text-violet-600',
  story: 'bg-transparent text-blue-600',
  task: 'bg-transparent text-emerald-600',
};

const SHELL_CLASS_BY_SIZE: Record<PlanningEntityIconSize, string> = {
  sm: 'h-7 w-7 rounded-sm',
  md: 'h-8 w-8 rounded-md',
};

const ICON_SIZE_BY_SIZE: Record<PlanningEntityIconSize, number> = {
  sm: 15,
  md: 17,
};

export function createPlanningEntityIcon(
  options: PlanningEntityIconOptions
): HTMLSpanElement {
  const kind = options.kind;
  const variant = options.variant ?? 'ghost';
  const size = options.size ?? 'md';
  const shell = document.createElement('span');
  shell.setAttribute('data-component', 'PlanningEntityIcon');
  shell.setAttribute('data-entity-kind', kind);
  shell.setAttribute('data-entity-variant', variant);
  const toneClass =
    variant === 'solid' ? SOLID_TONE_BY_KIND[kind] : GHOST_TONE_BY_KIND[kind];
  shell.className =
    `inline-flex shrink-0 items-center justify-center ${SHELL_CLASS_BY_SIZE[size]} ${toneClass} ${options.className ?? ''}`.trim();

  const icon = createIcon(ICON_BY_KIND[kind], {
    size: ICON_SIZE_BY_SIZE[size],
    strokeWidth: 1.9,
  });
  icon.setAttribute('aria-hidden', 'true');
  icon.className.baseVal = 'shrink-0';
  shell.appendChild(icon);

  return shell;
}
