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
  leadingIcon?: IconName;
  leadingIconClassName?: string;
  trailingIcon?: IconName;
  trailingIconClassName?: string;
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
  searchClearButton?: boolean;
  searchClearLabel?: string;
  passwordToggleLabels?: {
    show: string;
    hide: string;
  };
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
  const inputType = options.type ?? defaults.type;
  const input = createHudInputBase({
    variant: options.variant ?? 'default',
    className: options.inputClassName,
    type: inputType,
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
  const shouldRenderSearchClearButton =
    inputType === 'search' && options.searchClearButton !== false;
  const shouldRenderLeadingIcon = Boolean(options.leadingIcon);
  const shouldRenderTrailingIcon =
    Boolean(options.trailingIcon) &&
    !shouldRenderPasswordToggle &&
    !shouldRenderSearchClearButton;

  if (
    !shouldRenderPasswordToggle &&
    !shouldRenderSearchClearButton &&
    !shouldRenderLeadingIcon &&
    !shouldRenderTrailingIcon
  ) {
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

  if (shouldRenderLeadingIcon) {
    input.className = `${input.className} pl-10`.trim();
  }
  if (shouldRenderTrailingIcon) {
    input.className = `${input.className} pr-10`.trim();
  }
  if (shouldRenderSearchClearButton) {
    input.className = `${input.className} pr-11`.trim();
    input.setAttribute('data-hud-search-clear', 'custom');
  }
  if (shouldRenderPasswordToggle) {
    input.className = `${input.className} pr-11`.trim();
  }

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-component', 'HudInput');
  wrapper.className = `relative ${options.className ?? ''}`.trim();

  const createAdornment = (
    iconName: IconName,
    side: 'leading' | 'trailing',
    className?: string
  ): HTMLSpanElement => {
    const adornment = document.createElement('span');
    adornment.className = [
      'pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400',
      side === 'leading' ? 'left-3' : 'right-3',
      className ?? '',
    ]
      .join(' ')
      .trim();
    adornment.setAttribute('aria-hidden', 'true');
    const icon = createIcon(iconName, { size: 15, strokeWidth: 1.9 });
    icon.setAttribute('focusable', 'false');
    adornment.appendChild(icon);
    return adornment;
  };

  if (options.leadingIcon) {
    wrapper.appendChild(
      createAdornment(
        options.leadingIcon,
        'leading',
        options.leadingIconClassName
      )
    );
  }

  if (options.trailingIcon && !shouldRenderPasswordToggle) {
    wrapper.appendChild(
      createAdornment(
        options.trailingIcon,
        'trailing',
        options.trailingIconClassName
      )
    );
  }

  let toggleButton: HTMLButtonElement | null = null;
  let searchClearButton: HTMLButtonElement | null = null;
  const passwordToggleLabels = {
    show: options.passwordToggleLabels?.show ?? 'Show password',
    hide: options.passwordToggleLabels?.hide ?? 'Hide password',
  };
  const searchClearLabel = options.searchClearLabel ?? 'Clear search';
  const setToggleIcon = (iconName: IconName): void => {
    if (!toggleButton) return;
    toggleButton.innerHTML = '';
    const icon = createIcon(iconName, { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    toggleButton.appendChild(icon);
  };

  const syncToggleState = (): void => {
    if (!toggleButton) return;
    const isPasswordVisible = input.type === 'text';
    setToggleIcon(isPasswordVisible ? 'eye-slash' : 'eye');
    toggleButton.setAttribute(
      'aria-label',
      isPasswordVisible ? passwordToggleLabels.hide : passwordToggleLabels.show
    );
    toggleButton.setAttribute(
      'aria-pressed',
      isPasswordVisible ? 'true' : 'false'
    );
    toggleButton.title = isPasswordVisible
      ? passwordToggleLabels.hide
      : passwordToggleLabels.show;
  };

  if (shouldRenderPasswordToggle) {
    toggleButton = createHudIconButton({
      icon: 'eye',
      tone: 'text',
      size: 'sm',
      iconSize: 14,
      iconStrokeWidth: 1.8,
      ariaLabel: passwordToggleLabels.show,
      type: 'button',
      className:
        'absolute right-1 top-1/2 -translate-y-1/2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    });
    toggleButton.setAttribute('aria-pressed', 'false');
    toggleButton.title = passwordToggleLabels.show;
    toggleButton.addEventListener('click', () => {
      if (input.disabled) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      syncToggleState();
    });
  }

  const syncSearchClearState = (): void => {
    if (!searchClearButton) return;
    searchClearButton.style.display =
      !input.disabled && input.value.length > 0 ? '' : 'none';
  };

  if (shouldRenderSearchClearButton) {
    searchClearButton = createHudIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      iconSize: 14,
      iconStrokeWidth: 1.8,
      title: searchClearLabel,
      ariaLabel: searchClearLabel,
      type: 'button',
      className:
        'absolute right-1 top-1/2 -translate-y-1/2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    });
    searchClearButton.addEventListener('click', () => {
      if (input.disabled || input.value.length === 0) return;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      syncSearchClearState();
    });
    input.addEventListener('input', syncSearchClearState);
  }

  wrapper.appendChild(input);
  if (searchClearButton) {
    wrapper.appendChild(searchClearButton);
    syncSearchClearState();
  }
  if (toggleButton) {
    wrapper.appendChild(toggleButton);
    syncToggleState();
  }

  return {
    element: wrapper,
    input,
    setState: (state) => {
      setHudInputState(input, state);
      syncSearchClearState();
      if (toggleButton && state.disabled !== undefined) {
        toggleButton.disabled = state.disabled;
      }
    },
    getValue: () => input.value,
    setValue: (value) => {
      input.value = value;
      syncSearchClearState();
    },
    focus: () => input.focus(),
  };
}

// Backward-compatible aliases.
export type HudTextInputKind = HudInputKind;
export type HudTextInputControl = HudInput;
export const createHudTextInputControl = createHudInput;
