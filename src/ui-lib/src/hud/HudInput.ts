import {
  HUD_INPUT_BASE_CLASS,
  HUD_INPUT_DEFAULT_CLASS,
  HUD_INPUT_INLINE_CLASS,
} from './classNames.ts';

export type HudInputVariant = 'default' | 'inline';

export type HudInputBaseOptions = {
  variant?: HudInputVariant;
  className?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
  invalid?: boolean;
  onInput?: (value: string, event: Event) => void;
  onChange?: (value: string, event: Event) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
};

const classByVariant: Record<HudInputVariant, string> = {
  default: HUD_INPUT_DEFAULT_CLASS,
  inline: HUD_INPUT_INLINE_CLASS,
};

export function createHudInputBase(
  options: HudInputBaseOptions = {}
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = options.type ?? 'text';
  if (options.value !== undefined) input.value = options.value;
  if (options.placeholder !== undefined) input.placeholder = options.placeholder;
  if (options.name !== undefined) input.name = options.name;
  if (options.id !== undefined) input.id = options.id;
  if (options.autoFocus) input.autofocus = true;
  if (options.autoComplete !== undefined) input.autocomplete = options.autoComplete;
  if (options.required) input.required = true;
  if (options.minLength !== undefined) input.minLength = options.minLength;
  if (options.maxLength !== undefined) input.maxLength = options.maxLength;
  if (options.pattern !== undefined) input.pattern = options.pattern;
  if (options.disabled) input.disabled = true;
  if (options.invalid) {
    input.setAttribute('aria-invalid', 'true');
  }

  const variant = options.variant ?? 'default';
  input.className =
    `${HUD_INPUT_BASE_CLASS} ${classByVariant[variant]} ${options.className ?? ''}`.trim();

  if (options.onInput) {
    input.addEventListener('input', (event) => {
      options.onInput?.(input.value, event);
    });
  }
  if (options.onChange) {
    input.addEventListener('change', (event) => {
      options.onChange?.(input.value, event);
    });
  }
  if (options.onKeyDown) {
    input.addEventListener('keydown', options.onKeyDown);
  }

  return input;
}

export type HudInputBaseState = {
  disabled?: boolean;
  invalid?: boolean;
};

export function setHudInputState(
  input: HTMLInputElement,
  state: HudInputBaseState
): void {
  if (state.disabled !== undefined) {
    input.disabled = state.disabled;
  }
  if (state.invalid !== undefined) {
    if (state.invalid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.setAttribute('aria-invalid', 'false');
    }
  }
}

// Backward-compatible alias for direct imports from this file.
export const createHudInput = createHudInputBase;
