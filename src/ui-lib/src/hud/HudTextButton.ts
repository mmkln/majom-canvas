import {
  HUD_DESTRUCTIVE_BUTTON_CLASS,
  HUD_TEXT_BUTTON_DANGER_CLASS,
  HUD_TEXT_BUTTON_SECONDARY_CLASS,
  HUD_TEXT_BUTTON_TERTIARY_CLASS,
  HUD_PRIMARY_BUTTON_CLASS,
} from './classNames.ts';
import {
  getHudButtonController,
  HudButtonBase,
  type HudButtonElement,
  type HudButtonState,
} from './HudButtonBase.ts';

export type HudTextButtonTone =
  | 'soft'
  | 'secondary'
  | 'primary'
  | 'destructive'
  | 'text'
  | 'danger';
export type HudTextButtonSize = 'sm' | 'md' | 'lg';
export type HudTextButtonElement = HudButtonElement;

type HudTextButtonOptions = {
  text?: string;
  html?: string;
  className?: string;
  tone?: HudTextButtonTone;
  size?: HudTextButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  title?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
};

export type HudTextButtonState = HudButtonState;

type HudTextButtonLoadingOptions = {
  text?: string;
};

const classByTone: Record<HudTextButtonTone, string> = {
  soft: HUD_TEXT_BUTTON_SECONDARY_CLASS,
  secondary: HUD_TEXT_BUTTON_SECONDARY_CLASS,
  primary: HUD_PRIMARY_BUTTON_CLASS,
  destructive: HUD_DESTRUCTIVE_BUTTON_CLASS,
  text: HUD_TEXT_BUTTON_TERTIARY_CLASS,
  danger: HUD_TEXT_BUTTON_DANGER_CLASS,
};

const classBySize: Record<HudTextButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-4 text-sm',
};

class HudTextButton extends HudButtonBase {
  constructor(options: HudTextButtonOptions) {
    const sizeClass = classBySize[options.size ?? 'md'];
    const widthClass = options.fullWidth ? 'w-full' : '';
    const className =
      `${classByTone[options.tone ?? 'soft']} ${sizeClass} ${widthClass} ${options.className ?? ''}`.trim();
    super({
      className,
      type: options.type,
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
    });
    const element = this.getElement();
    if (options.text !== undefined) {
      element.textContent = options.text;
    }
    if (options.html !== undefined) {
      element.innerHTML = options.html;
    }
    this.initializeState({
      loading: options.loading ?? false,
      loadingText: options.loadingText,
      disabled: options.disabled ?? false,
    });
  }

  protected renderLoadingContent(loadingText?: string): void {
    const element = this.getElement();
    element.innerHTML = '';
    element.classList.add('inline-flex', 'items-center', 'justify-center', 'gap-2');
    element.append(this.createSpinner(14));
    if (loadingText) {
      const label = document.createElement('span');
      label.textContent = loadingText;
      label.className = 'whitespace-nowrap';
      element.appendChild(label);
    }
  }

  protected onLoadingCleared(): void {
    this.getElement().classList.remove(
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2'
    );
  }
}

export function createHudTextButton(
  options: HudTextButtonOptions
): HudTextButtonElement {
  return new HudTextButton(options).getElement();
}

export function setHudTextButtonState(
  button: HTMLButtonElement,
  state: HudTextButtonState
): void {
  const controller = getHudButtonController(button);
  if (controller) {
    controller.setState(state);
    return;
  }
  if (state.disabled !== undefined) {
    button.disabled = state.disabled;
    if (state.disabled) {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }
  }
}

export function setHudTextButtonLoading(
  button: HTMLButtonElement,
  loading: boolean,
  options: HudTextButtonLoadingOptions = {}
): void {
  setHudTextButtonState(button, { loading, loadingText: options.text });
}
