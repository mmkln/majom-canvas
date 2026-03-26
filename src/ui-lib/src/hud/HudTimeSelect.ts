import {
  HUD_SELECT_BASE_CLASS,
  HUD_SELECT_DEFAULT_CLASS,
  HUD_SELECT_INLINE_CLASS,
} from './classNames.ts';

export type HudTimeSelectVariant = 'default' | 'inline';

export type HudTimeSelectOptions = {
  variant?: HudTimeSelectVariant;
  className?: string;
  stepMinutes?: number;
  minMinute?: number;
  maxMinute?: number;
  selectedMinute?: number;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  onChange?: (minute: number, event: Event) => void;
};

export type HudTimeSelectState = {
  disabled?: boolean;
  invalid?: boolean;
};

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_STEP_MINUTES = 15;

function clampMinute(value: number): number {
  return Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(value)));
}

function normalizeStep(stepMinutes: number | undefined): number {
  if (
    typeof stepMinutes !== 'number' ||
    Number.isNaN(stepMinutes) ||
    stepMinutes <= 0
  ) {
    return DEFAULT_STEP_MINUTES;
  }
  return Math.max(1, Math.floor(stepMinutes));
}

function formatMinuteLabel(minute: number): string {
  const clampedMinute = clampMinute(minute);
  const hours = Math.floor(clampedMinute / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(clampedMinute % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildTimeOptionMinutes(options: HudTimeSelectOptions): number[] {
  const stepMinutes = normalizeStep(options.stepMinutes);
  const rawMinMinute = clampMinute(options.minMinute ?? 0);
  const rawMaxMinute = clampMinute(options.maxMinute ?? MINUTES_PER_DAY);
  const minMinute = Math.min(rawMinMinute, rawMaxMinute);
  const maxMinute = Math.max(rawMinMinute, rawMaxMinute);
  const minuteValues: number[] = [];

  for (let minute = minMinute; minute <= maxMinute; minute += stepMinutes) {
    minuteValues.push(minute);
  }
  if (minuteValues[minuteValues.length - 1] !== maxMinute) {
    minuteValues.push(maxMinute);
  }

  if (typeof options.selectedMinute === 'number') {
    const selectedMinute = clampMinute(options.selectedMinute);
    if (
      selectedMinute >= minMinute &&
      selectedMinute <= maxMinute &&
      !minuteValues.includes(selectedMinute)
    ) {
      minuteValues.push(selectedMinute);
    }
  }

  return minuteValues.sort((a, b) => a - b);
}

export function createHudTimeSelect(
  options: HudTimeSelectOptions = {}
): HTMLSelectElement {
  const select = document.createElement('select');
  select.setAttribute('data-component', 'HudTimeSelect');
  select.className = [
    HUD_SELECT_BASE_CLASS,
    options.variant === 'inline'
      ? HUD_SELECT_INLINE_CLASS
      : HUD_SELECT_DEFAULT_CLASS,
    options.className ?? '',
  ]
    .join(' ')
    .trim();

  if (options.name) select.name = options.name;
  if (options.id) select.id = options.id;
  if (options.disabled) select.disabled = true;
  if (options.invalid) {
    select.setAttribute('aria-invalid', 'true');
  }

  buildTimeOptionMinutes(options).forEach((minute) => {
    const option = document.createElement('option');
    option.value = String(minute);
    option.textContent = formatMinuteLabel(minute);
    if (minute === options.selectedMinute) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  if (
    typeof options.selectedMinute === 'number' &&
    Array.from(select.options).some(
      (option) => option.value === String(options.selectedMinute)
    )
  ) {
    select.value = String(options.selectedMinute);
  }

  if (options.onChange) {
    select.addEventListener('change', (event) => {
      options.onChange?.(Number(select.value), event);
    });
  }

  return select;
}

export function setHudTimeSelectState(
  select: HTMLSelectElement,
  state: HudTimeSelectState
): void {
  if (state.disabled !== undefined) {
    select.disabled = state.disabled;
  }
  if (state.invalid !== undefined) {
    if (state.invalid) {
      select.setAttribute('aria-invalid', 'true');
    } else {
      select.setAttribute('aria-invalid', 'false');
    }
  }
}
