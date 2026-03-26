import {
  HudAnchoredMenu,
  type HudAnchoredPlacement,
  type HudAnchoredResolvedPlacement,
} from './HudAnchoredMenu.ts';
import { createHudDropdownItem } from './HudDropdownItem.ts';
import { createIcon } from './icons.ts';
import { createHudSurface } from './HudSurface.ts';
import {
  createHudTextButton,
  setHudTextButtonState,
  type HudTextButtonSize,
} from './HudTextButton.ts';

export type HudMenuButtonItem = {
  id: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export type HudMenuButtonVariant = 'default' | 'plain';

export type HudMenuButtonOptions = {
  label?: string;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  items?: HudMenuButtonItem[];
  size?: HudTextButtonSize;
  variant?: HudMenuButtonVariant;
  buttonClassName?: string;
  menuClassName?: string;
  placement?: HudAnchoredPlacement;
  fallbackPlacements?: HudAnchoredResolvedPlacement[];
  gap?: number;
  margin?: number;
  lockPlacementAfterOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const BUTTON_BASE_CLASS = '!rounded-lg inline-flex items-center gap-1.5';

const BUTTON_VARIANT_CLASS: Record<HudMenuButtonVariant, string> = {
  default:
    '!border !border-slate-200 !bg-slate-50 !font-semibold !text-slate-700 hover:!bg-white hover:!text-slate-800',
  plain:
    '!border-transparent !bg-transparent !font-medium !text-slate-600 hover:!bg-slate-100 hover:!text-slate-800',
};

const BUTTON_OPEN_CLASS: Record<
  HudMenuButtonVariant,
  { background: string; text: string }
> = {
  default: {
    background: '!bg-white',
    text: '!text-slate-800',
  },
  plain: {
    background: '!bg-slate-100',
    text: '!text-slate-800',
  },
};

const DEFAULT_MENU_CLASS =
  'absolute left-0 top-0 z-40 hidden min-w-[188px] overflow-hidden !rounded-xl';

export class HudMenuButton {
  public readonly element: HTMLDivElement;

  private readonly button: HTMLButtonElement;
  private readonly labelElement: HTMLSpanElement;
  private readonly chevron: SVGSVGElement;
  private readonly menuPanel: HTMLDivElement;
  private readonly menuController: HudAnchoredMenu;
  private readonly onOpenChange?: ((open: boolean) => void) | undefined;
  private readonly variant: HudMenuButtonVariant;
  private readonly placement: HudAnchoredPlacement;
  private readonly fallbackPlacements: HudAnchoredResolvedPlacement[];
  private readonly gap: number;
  private readonly margin: number;
  private readonly lockPlacementAfterOpen: boolean;
  private items: HudMenuButtonItem[] = [];

  constructor(options: HudMenuButtonOptions = {}) {
    this.onOpenChange = options.onOpenChange;
    this.variant = options.variant ?? 'default';
    this.placement = options.placement ?? 'bottom-start';
    this.fallbackPlacements = options.fallbackPlacements ?? [
      'bottom-end',
      'top-start',
      'top-end',
    ];
    this.gap = options.gap ?? 6;
    this.margin = options.margin ?? 8;
    this.lockPlacementAfterOpen = options.lockPlacementAfterOpen ?? true;

    this.element = document.createElement('div');
    this.element.className = 'relative inline-flex items-center';

    this.button = createHudTextButton({
      text: '',
      tone: 'text',
      size: options.size ?? 'sm',
      title: options.title,
      ariaLabel: options.ariaLabel,
      disabled: options.disabled,
      className:
        `${BUTTON_BASE_CLASS} ${BUTTON_VARIANT_CLASS[this.variant]} ${options.buttonClassName ?? ''}`.trim(),
      onClick: (event) => {
        event.stopPropagation();
        if (this.button.disabled) return;
        this.toggle();
      },
    });
    this.button.setAttribute('aria-haspopup', 'menu');
    this.button.setAttribute('aria-expanded', 'false');

    this.labelElement = document.createElement('span');
    this.labelElement.className = 'truncate';

    this.chevron = createIcon('chevron-down', {
      size: 14,
      strokeWidth: 1.9,
    });
    this.chevron.classList.add('shrink-0');
    this.chevron.setAttribute('aria-hidden', 'true');
    this.button.append(this.labelElement, this.chevron);

    this.menuPanel = createHudSurface({
      elevated: true,
      className: `${DEFAULT_MENU_CLASS} ${options.menuClassName ?? ''}`.trim(),
    });
    this.menuPanel.setAttribute('role', 'menu');

    this.menuController = new HudAnchoredMenu({
      container: this.element,
      panel: this.menuPanel,
      onOpenChange: (open) => {
        const openClasses = BUTTON_OPEN_CLASS[this.variant];
        this.button.setAttribute('aria-expanded', open ? 'true' : 'false');
        this.button.classList.toggle(openClasses.background, open);
        this.button.classList.toggle(openClasses.text, open);
        this.chevron.classList.toggle('rotate-180', open);
        if (open) {
          this.renderItems();
        }
        this.onOpenChange?.(open);
      },
    });

    this.element.append(this.button, this.menuPanel);
    this.setLabel(options.label ?? 'Menu');
    this.setItems(options.items ?? []);
  }

  public getButtonElement(): HTMLButtonElement {
    return this.button;
  }

  public mount(): void {
    this.menuController.mount();
  }

  public unmount(): void {
    this.menuController.close();
    this.menuController.unmount();
  }

  public close(): void {
    this.menuController.close();
  }

  public isOpen(): boolean {
    return this.menuController.isOpen();
  }

  public reposition(): void {
    this.menuController.reposition();
  }

  public setLabel(label: string): void {
    this.labelElement.textContent = label;
  }

  public setTitle(title: string): void {
    this.button.title = title;
  }

  public setAriaLabel(label: string): void {
    this.button.setAttribute('aria-label', label);
  }

  public setDisabled(disabled: boolean): void {
    setHudTextButtonState(this.button, { disabled });
    this.button.style.cursor = disabled ? 'default' : 'pointer';
    if (disabled) {
      this.close();
    }
  }

  public setItems(items: HudMenuButtonItem[]): void {
    this.items = items;
    this.renderItems();
    if (this.menuController.isOpen()) {
      this.menuController.reposition();
    }
  }

  private toggle(): void {
    if (this.menuController.isOpen()) {
      this.menuController.close();
      return;
    }

    this.renderItems();
    this.menuController.openAt({
      anchor: this.button,
      placement: this.placement,
      fallbackPlacements: this.fallbackPlacements,
      gap: this.gap,
      margin: this.margin,
      lockPlacementAfterOpen: this.lockPlacementAfterOpen,
    });
  }

  private renderItems(): void {
    const items = this.items.map((item) =>
      createHudDropdownItem({
        label: item.label,
        variant: item.active ? 'selected' : 'default',
        disabled: item.disabled ?? false,
        className: '!py-3 !text-[12px]',
        onClick: (event) => {
          event.stopPropagation();
          if (item.disabled) return;
          this.close();
          item.onSelect?.();
        },
      })
    );

    this.menuPanel.replaceChildren(...items);
  }
}
