import {
  HUD_ICON_BUTTON_DANGER_CLASS,
  HUD_ICON_BUTTON_SIZE_LG_CLASS,
  HUD_ICON_BUTTON_SIZE_MD_CLASS,
  HUD_ICON_BUTTON_SIZE_SM_CLASS,
  HUD_ICON_BUTTON_SECONDARY_CLASS,
  HUD_ICON_BUTTON_TERTIARY_CLASS,
} from './classNames.ts';
import { createIcon, type IconName } from './icons.ts';
import { getHudButtonController, HudButtonBase } from './HudButtonBase.ts';

type HudIconButtonSize = 'sm' | 'md' | 'lg';
export type HudIconButtonTone = 'soft' | 'secondary' | 'text' | 'danger';

type HudIconButtonOptions = {
  icon: IconName;
  size?: HudIconButtonSize;
  tone?: HudIconButtonTone;
  iconSize?: number;
  iconStrokeWidth?: number;
  loading?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
};

const classBySize: Record<HudIconButtonSize, string> = {
  sm: HUD_ICON_BUTTON_SIZE_SM_CLASS,
  md: HUD_ICON_BUTTON_SIZE_MD_CLASS,
  lg: HUD_ICON_BUTTON_SIZE_LG_CLASS,
};

const classByTone: Record<HudIconButtonTone, string> = {
  soft: HUD_ICON_BUTTON_SECONDARY_CLASS,
  secondary: HUD_ICON_BUTTON_SECONDARY_CLASS,
  text: HUD_ICON_BUTTON_TERTIARY_CLASS,
  danger: HUD_ICON_BUTTON_DANGER_CLASS,
};

const iconSizeByButtonSize: Record<HudIconButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

class HudIconButton extends HudButtonBase {
  private loadingSize: number;
  private loadingStrokeWidth: number;

  constructor(options: HudIconButtonOptions) {
    const buttonSize = options.size ?? 'md';
    const tone = options.tone ?? 'soft';
    const className =
      `${classByTone[tone]} ${classBySize[buttonSize]} ${options.className ?? ''}`.trim();
    super({
      className,
      type: options.type,
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
    });
    const iconSize = options.iconSize ?? iconSizeByButtonSize[buttonSize];
    this.loadingSize = iconSize;
    this.loadingStrokeWidth = options.iconStrokeWidth ?? 2;

    const icon = createIcon(options.icon, {
      size: iconSize,
      strokeWidth: options.iconStrokeWidth,
    });
    icon.setAttribute('aria-hidden', 'true');
    this.getElement().appendChild(icon);

    this.initializeState({
      loading: options.loading ?? false,
      disabled: options.disabled ?? false,
    });
  }

  public setLoadingVisual(size?: number, strokeWidth?: number): void {
    if (size !== undefined) {
      this.loadingSize = size;
    }
    if (strokeWidth !== undefined) {
      this.loadingStrokeWidth = strokeWidth;
    }
  }

  protected renderLoadingContent(): void {
    const element = this.getElement();
    element.innerHTML = '';
    element.append(this.createSpinner(this.loadingSize, this.loadingStrokeWidth));
  }
}

export function createHudIconButton(
  options: HudIconButtonOptions
): HTMLButtonElement {
  return new HudIconButton(options).getElement();
}

type HudIconButtonLoadingOptions = {
  size?: number;
  strokeWidth?: number;
};

export function setHudIconButtonLoading(
  button: HTMLButtonElement,
  loading: boolean,
  options: HudIconButtonLoadingOptions = {}
): void {
  const controller = getHudButtonController(button);
  if (controller && controller instanceof HudIconButton) {
    controller.setLoadingVisual(options.size, options.strokeWidth);
    controller.setState({ loading });
    return;
  }
  if (!loading) {
    button.removeAttribute('aria-busy');
    button.removeAttribute('data-loading');
  }
}
