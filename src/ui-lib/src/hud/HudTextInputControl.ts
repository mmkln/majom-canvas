import { createHudIconButton } from './HudIconButton.ts';
import {
  createHudInputBase,
  setHudInputState,
  type HudInputVariant,
} from './HudInput.ts';
import { createIcon, type IconName } from './icons.ts';

export type HudInputKind = 'text' | 'password' | 'email' | 'phone';

export type HudInputOptions = {
  kind?: HudInputKind;
  variant?: HudInputVariant;
  className?: string;
  inputClassName?: string;
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
  passwordToggle?: boolean;
};

type HudInputState = {
  disabled?: boolean;
  invalid?: boolean;
};

export type HudInput = {
  element: HTMLElement;
  input: HTMLInputElement;
  setState: (state: HudInputState) => void;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
};

const kindDefaults: Record<
  HudInputKind,
  { type: string; autoComplete?: string; inputMode?: string }
> = {
  text: { type: 'text' },
  password: { type: 'password', autoComplete: 'current-password' },
  email: { type: 'email', autoComplete: 'email', inputMode: 'email' },
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
};

export function createHudInput(options: HudInputOptions = {}): HudInput {
  const kind = options.kind ?? 'text';
  const defaults = kindDefaults[kind];
  const input = createHudInputBase({
    variant: options.variant ?? 'default',
    className: options.inputClassName,
    type: options.type ?? defaults.type,
    value: options.value,
    placeholder: options.placeholder,
    name: options.name,
    id: options.id,
    autoFocus: options.autoFocus,
    autoComplete: options.autoComplete ?? defaults.autoComplete,
    required: options.required,
    minLength: options.minLength,
    maxLength: options.maxLength,
    pattern: options.pattern,
    disabled: options.disabled,
    invalid: options.invalid,
    onInput: options.onInput,
    onChange: options.onChange,
    onKeyDown: options.onKeyDown,
  });

  if (defaults.inputMode) {
    input.inputMode = defaults.inputMode as HTMLInputElement['inputMode'];
  }

  const shouldRenderPasswordToggle =
    kind === 'password' && options.passwordToggle !== false;

  if (!shouldRenderPasswordToggle) {
    if (options.className) {
      input.className = `${input.className} ${options.className}`.trim();
    }
    input.setAttribute('data-component', 'HudInput');
    return {
      element: input,
      input,
      setState: (state) => setHudInputState(input, state),
      getValue: () => input.value,
      setValue: (value) => {
        input.value = value;
      },
      focus: () => input.focus(),
    };
  }

  input.className = `${input.className} pr-11`.trim();

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-component', 'HudInput');
  wrapper.className = `relative ${options.className ?? ''}`.trim();

  const toggleButton = createHudIconButton({
    icon: 'eye',
    tone: 'text',
    size: 'sm',
    iconSize: 14,
    iconStrokeWidth: 1.8,
    ariaLabel: 'Show password',
    type: 'button',
    className:
      'absolute right-1 top-1/2 -translate-y-1/2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  });
  toggleButton.setAttribute('aria-pressed', 'false');
  toggleButton.title = 'Show password';

  const setToggleIcon = (iconName: IconName): void => {
    toggleButton.innerHTML = '';
    const icon = createIcon(iconName, { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    toggleButton.appendChild(icon);
  };

  const syncToggleState = (): void => {
    const isPasswordVisible = input.type === 'text';
    setToggleIcon(isPasswordVisible ? 'eye-slash' : 'eye');
    toggleButton.setAttribute(
      'aria-label',
      isPasswordVisible ? 'Hide password' : 'Show password'
    );
    toggleButton.setAttribute(
      'aria-pressed',
      isPasswordVisible ? 'true' : 'false'
    );
    toggleButton.title = isPasswordVisible ? 'Hide password' : 'Show password';
  };

  toggleButton.addEventListener('click', () => {
    if (input.disabled) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    syncToggleState();
  });

  wrapper.append(input, toggleButton);
  syncToggleState();

  return {
    element: wrapper,
    input,
    setState: (state) => {
      setHudInputState(input, state);
      if (state.disabled !== undefined) {
        toggleButton.disabled = state.disabled;
      }
    },
    getValue: () => input.value,
    setValue: (value) => {
      input.value = value;
    },
    focus: () => input.focus(),
  };
}

// Backward-compatible aliases.
export type HudTextInputKind = HudInputKind;
export type HudTextInputControl = HudInput;
export const createHudTextInputControl = createHudInput;
