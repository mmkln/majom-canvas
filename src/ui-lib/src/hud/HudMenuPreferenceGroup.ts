import {
  HUD_MENU_PREFERENCE_GROUP_BODY_CLASS,
  HUD_MENU_PREFERENCE_GROUP_BODY_DENSITY_COMPACT_CLASS,
  HUD_MENU_PREFERENCE_GROUP_BODY_DENSITY_DEFAULT_CLASS,
  HUD_MENU_PREFERENCE_GROUP_BODY_INSET_MD_CLASS,
  HUD_MENU_PREFERENCE_GROUP_BODY_INSET_SM_CLASS,
  HUD_MENU_PREFERENCE_GROUP_CLASS,
  HUD_MENU_PREFERENCE_GROUP_SUMMARY_CLASS,
  HUD_MENU_PREFERENCE_GROUP_SUMMARY_DEFAULT_CLASS,
  HUD_MENU_PREFERENCE_GROUP_SUMMARY_DISABLED_CLASS,
  HUD_MENU_PREFERENCE_GROUP_SUMMARY_EXPANDED_CLASS,
} from './classNames.ts';
import { createIcon } from './icons.ts';

export type HudMenuPreferenceGroupOptions = {
  label: string;
  description?: string;
  control?: HTMLElement | null;
  children?: HTMLElement[];
  className?: string;
  bodyClassName?: string;
  expanded?: boolean;
  disabled?: boolean;
  inset?: 'sm' | 'md';
  density?: 'default' | 'compact';
  onExpandedChange?: (expanded: boolean, event: Event) => void;
};

export type HudMenuPreferenceGroupHandle = {
  element: HTMLDivElement;
  isExpanded: () => boolean;
  setExpanded: (expanded: boolean, event?: Event) => void;
};

let preferenceGroupId = 0;

export function createHudMenuPreferenceGroup(
  options: HudMenuPreferenceGroupOptions
): HudMenuPreferenceGroupHandle {
  const expandedState = {
    value: options.expanded ?? true,
  };
  const root = document.createElement('div');
  root.setAttribute('data-component', 'HudMenuPreferenceGroup');
  root.className =
    `${HUD_MENU_PREFERENCE_GROUP_CLASS} ${options.className ?? ''}`.trim();

  const summary = document.createElement('div');
  summary.setAttribute('data-slot', 'summary');
  summary.setAttribute('role', 'button');
  summary.tabIndex = options.disabled ? -1 : 0;
  summary.className = HUD_MENU_PREFERENCE_GROUP_SUMMARY_CLASS;

  const body = document.createElement('div');
  body.setAttribute('data-slot', 'body');
  const bodyId = `hud-menu-preference-group-body-${preferenceGroupId += 1}`;
  body.id = bodyId;

  const insetClass =
    options.inset === 'sm'
      ? HUD_MENU_PREFERENCE_GROUP_BODY_INSET_SM_CLASS
      : HUD_MENU_PREFERENCE_GROUP_BODY_INSET_MD_CLASS;
  const densityClass =
    options.density === 'compact'
      ? HUD_MENU_PREFERENCE_GROUP_BODY_DENSITY_COMPACT_CLASS
      : HUD_MENU_PREFERENCE_GROUP_BODY_DENSITY_DEFAULT_CLASS;
  body.className =
    `${HUD_MENU_PREFERENCE_GROUP_BODY_CLASS} ${insetClass} ${densityClass} ${options.bodyClassName ?? ''}`.trim();
  body.setAttribute('role', 'group');

  const content = document.createElement('span');
  content.className = 'flex min-w-0 flex-1 flex-col gap-0.5';

  const label = document.createElement('span');
  label.className = 'truncate text-sm font-normal leading-5';
  label.textContent = options.label;
  content.appendChild(label);

  const description = typeof options.description === 'string'
    ? options.description.trim()
    : '';
  if (description.length > 0) {
    const descriptionEl = document.createElement('span');
    descriptionEl.className = 'text-[13px] font-normal leading-5 text-slate-500';
    descriptionEl.textContent = description;
    content.appendChild(descriptionEl);
  }

  const trailing = document.createElement('span');
  trailing.className = 'ml-auto inline-flex shrink-0 items-center gap-2 pl-3';

  const controlWrap = document.createElement('span');
  controlWrap.className = 'inline-flex shrink-0 items-center';
  if (options.control) {
    options.control.classList.add('shrink-0');
    controlWrap.appendChild(options.control);
    trailing.appendChild(controlWrap);
  }

  const chevron = createIcon('chevron-down', {
    size: 15,
    strokeWidth: 1.9,
  });
  chevron.classList.add('shrink-0', 'text-slate-400', 'transition-transform', 'duration-150');
  chevron.setAttribute('aria-hidden', 'true');
  trailing.appendChild(chevron);

  summary.append(content, trailing);
  root.append(summary, body);

  (options.children ?? []).forEach((child) => {
    body.appendChild(child);
  });

  const applyExpandedState = (): void => {
    summary.setAttribute('aria-expanded', expandedState.value ? 'true' : 'false');
    summary.setAttribute('aria-controls', bodyId);
    summary.className = [
      HUD_MENU_PREFERENCE_GROUP_SUMMARY_CLASS,
      expandedState.value
        ? HUD_MENU_PREFERENCE_GROUP_SUMMARY_EXPANDED_CLASS
        : HUD_MENU_PREFERENCE_GROUP_SUMMARY_DEFAULT_CLASS,
      options.disabled ? HUD_MENU_PREFERENCE_GROUP_SUMMARY_DISABLED_CLASS : '',
    ]
      .filter(Boolean)
      .join(' ');
    body.classList.toggle('hidden', !expandedState.value);
    chevron.style.transform = expandedState.value ? 'rotate(0deg)' : 'rotate(-90deg)';
  };

  const setExpanded = (expanded: boolean, event?: Event): void => {
    if (expandedState.value === expanded) return;
    expandedState.value = expanded;
    applyExpandedState();
    options.onExpandedChange?.(expandedState.value, event ?? new Event('toggle'));
  };

  const handleToggle = (event: Event): void => {
    if (options.disabled) return;
    const target = event.target;
    if (target instanceof Node && controlWrap.contains(target)) {
      return;
    }
    setExpanded(!expandedState.value, event);
  };

  summary.addEventListener('click', handleToggle);
  summary.addEventListener('keydown', (event) => {
    if (options.disabled) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleToggle(event);
  });

  applyExpandedState();

  return {
    element: root,
    isExpanded: () => expandedState.value,
    setExpanded,
  };
}
