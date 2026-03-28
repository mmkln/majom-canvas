import { FloatingMenuController } from './FloatingMenuController.ts';
import {
  HUD_SUBMENU_PANEL_CLASS,
  HUD_SUBMENU_TRIGGER_OPEN_CLASS,
} from './classNames.ts';

export type HudSubmenuPlacement = 'right-start' | 'left-start';
export type HudSubmenuOpenMode = 'click' | 'hover-or-click';

export type HudSubmenuOptions = {
  trigger: HTMLElement;
  panel: HTMLElement;
  placement?: HudSubmenuPlacement;
  fallbackPlacement?: HudSubmenuPlacement;
  openMode?: HudSubmenuOpenMode;
  gap?: number;
  margin?: number;
  closeDelayMs?: number;
  panelZIndex?: number;
  beforeOpen?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export class HudSubmenu {
  private open = false;
  private readonly placement: HudSubmenuPlacement;
  private readonly fallbackPlacement: HudSubmenuPlacement;
  private readonly openMode: HudSubmenuOpenMode;
  private readonly gap: number;
  private readonly margin: number;
  private readonly closeDelayMs: number;
  private readonly beforeOpen?: () => void;
  private readonly onOpenChange?: (open: boolean) => void;
  private readonly controller: FloatingMenuController;
  private closeTimeoutId: number | null = null;
  private destroyed = false;

  constructor(
    private readonly options: HudSubmenuOptions
  ) {
    this.placement = options.placement ?? 'right-start';
    this.fallbackPlacement =
      options.fallbackPlacement ??
      (this.placement === 'right-start' ? 'left-start' : 'right-start');
    this.openMode = options.openMode ?? 'click';
    this.gap = options.gap ?? 4;
    this.margin = options.margin ?? 8;
    this.closeDelayMs = options.closeDelayMs ?? 120;
    this.beforeOpen = options.beforeOpen;
    this.onOpenChange = options.onOpenChange;

    this.options.panel.setAttribute('data-component', 'HudSubmenuPanel');
    this.options.panel.className =
      `${HUD_SUBMENU_PANEL_CLASS} ${this.options.panel.className}`.trim();
    this.options.trigger.setAttribute('aria-haspopup', 'menu');
    this.options.trigger.setAttribute('aria-expanded', 'false');
    if (typeof options.panelZIndex === 'number') {
      this.options.panel.style.zIndex = `${options.panelZIndex}`;
    }

    this.controller = new FloatingMenuController({
      isOpen: () => this.open,
      setOpen: (open) => {
        if (!open) {
          this.close();
        }
      },
      containsTarget: (target) =>
        this.options.trigger.contains(target) || this.options.panel.contains(target),
    });

    this.controller.mount();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, true);
    this.options.trigger.addEventListener('click', this.onTriggerClick);
    this.options.trigger.addEventListener('focus', this.onTriggerFocus);
    this.options.trigger.addEventListener('focusout', this.onTriggerFocusOut);
    this.options.trigger.addEventListener('keydown', this.onTriggerKeyDown);
    this.options.panel.addEventListener('mousedown', this.onPanelMouseDown);
    this.options.panel.addEventListener('focusout', this.onPanelFocusOut);
    this.options.panel.addEventListener('keydown', this.onPanelKeyDown);

    if (this.openMode === 'hover-or-click') {
      this.options.trigger.addEventListener('mouseenter', this.onTriggerMouseEnter);
      this.options.trigger.addEventListener('mouseleave', this.onTriggerMouseLeave);
      this.options.panel.addEventListener('mouseenter', this.onPanelMouseEnter);
      this.options.panel.addEventListener('mouseleave', this.onPanelMouseLeave);
    }
  }

  public isOpen(): boolean {
    return this.open;
  }

  public openMenu(): void {
    this.clearCloseTimer();
    this.beforeOpen?.();
    if (!this.options.panel.isConnected) {
      document.body.appendChild(this.options.panel);
    }
    this.open = true;
    this.options.panel.classList.remove('hidden');
    this.options.trigger.setAttribute('aria-expanded', 'true');
    this.options.trigger.classList.add(...HUD_SUBMENU_TRIGGER_OPEN_CLASS.split(' '));
    this.positionPanel();
    this.onOpenChange?.(true);
  }

  public close(): void {
    if (!this.open) return;
    this.clearCloseTimer();
    this.open = false;
    this.options.panel.classList.add('hidden');
    this.options.panel.style.visibility = '';
    this.options.trigger.setAttribute('aria-expanded', 'false');
    this.options.trigger.classList.remove(
      ...HUD_SUBMENU_TRIGGER_OPEN_CLASS.split(' ')
    );
    this.onOpenChange?.(false);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearCloseTimer();
    this.close();
    this.controller.unmount();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll, true);
    this.options.trigger.removeEventListener('click', this.onTriggerClick);
    this.options.trigger.removeEventListener('focus', this.onTriggerFocus);
    this.options.trigger.removeEventListener('focusout', this.onTriggerFocusOut);
    this.options.trigger.removeEventListener('keydown', this.onTriggerKeyDown);
    this.options.panel.removeEventListener('mousedown', this.onPanelMouseDown);
    this.options.panel.removeEventListener('focusout', this.onPanelFocusOut);
    this.options.panel.removeEventListener('keydown', this.onPanelKeyDown);
    if (this.openMode === 'hover-or-click') {
      this.options.trigger.removeEventListener(
        'mouseenter',
        this.onTriggerMouseEnter
      );
      this.options.trigger.removeEventListener(
        'mouseleave',
        this.onTriggerMouseLeave
      );
      this.options.panel.removeEventListener(
        'mouseenter',
        this.onPanelMouseEnter
      );
      this.options.panel.removeEventListener(
        'mouseleave',
        this.onPanelMouseLeave
      );
    }
    this.options.panel.remove();
  }

  private readonly onResize = (): void => {
    this.positionPanel();
  };

  private readonly onScroll = (): void => {
    this.positionPanel();
  };

  private readonly onTriggerClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (this.openMode === 'click' && this.open) {
      this.close();
      return;
    }
    this.openMenu();
  };

  private readonly onTriggerMouseEnter = (): void => {
    this.openMenu();
  };

  private readonly onTriggerMouseLeave = (): void => {
    this.scheduleClose();
  };

  private readonly onTriggerFocus = (): void => {
    if (this.openMode !== 'hover-or-click') {
      return;
    }
    this.openMenu();
  };

  private readonly onTriggerFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && this.options.panel.contains(relatedTarget)) {
      return;
    }
    this.scheduleClose();
  };

  private readonly onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowRight'
    ) {
      event.preventDefault();
      this.openMenu();
      this.focusFirstItem();
      return;
    }
    if (event.key === 'Escape' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.close();
    }
  };

  private readonly onPanelMouseEnter = (): void => {
    this.clearCloseTimer();
  };

  private readonly onPanelMouseLeave = (): void => {
    this.scheduleClose();
  };

  private readonly onPanelMouseDown = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  private readonly onPanelFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget === this.options.trigger ||
      (relatedTarget instanceof Node && this.options.panel.contains(relatedTarget))
    ) {
      return;
    }
    this.scheduleClose();
  };

  private readonly onPanelKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    this.close();
    this.options.trigger.focus();
  };

  private clearCloseTimer(): void {
    if (this.closeTimeoutId === null) return;
    window.clearTimeout(this.closeTimeoutId);
    this.closeTimeoutId = null;
  }

  private scheduleClose(): void {
    this.clearCloseTimer();
    this.closeTimeoutId = window.setTimeout(() => {
      this.close();
    }, this.closeDelayMs);
  }

  private focusFirstItem(): void {
    const firstFocusable = this.options.panel.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }

  private positionPanel(): void {
    if (!this.open) return;
    if (!document.body.contains(this.options.trigger)) {
      this.close();
      return;
    }

    const triggerRect = this.options.trigger.getBoundingClientRect();
    const panelSize = this.measurePanel();
    const placement = this.resolvePlacement(triggerRect, panelSize.width);

    this.positionFixedElement({
      anchorX:
        placement === 'right-start'
          ? triggerRect.right + this.gap
          : triggerRect.left - this.gap,
      anchorY: triggerRect.top,
      alignX: placement === 'right-start' ? 'left' : 'right',
      alignY: 'top',
      width: panelSize.width,
      height: panelSize.height,
    });
  }

  private resolvePlacement(
    triggerRect: DOMRect,
    panelWidth: number
  ): HudSubmenuPlacement {
    const fitsRight =
      triggerRect.right + this.gap + panelWidth <= window.innerWidth - this.margin;
    const fitsLeft =
      triggerRect.left - this.gap - panelWidth >= this.margin;

    if (this.placement === 'right-start') {
      if (fitsRight || !fitsLeft) {
        return 'right-start';
      }
      return this.fallbackPlacement;
    }

    if (fitsLeft || !fitsRight) {
      return 'left-start';
    }
    return this.fallbackPlacement;
  }

  private measurePanel(): { width: number; height: number } {
    const rect = this.options.panel.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }

    const wasHidden = this.options.panel.classList.contains('hidden');
    const previousVisibility = this.options.panel.style.visibility;
    const previousPointerEvents = this.options.panel.style.pointerEvents;
    if (wasHidden) {
      this.options.panel.classList.remove('hidden');
    }
    this.options.panel.style.visibility = 'hidden';
    this.options.panel.style.pointerEvents = 'none';
    const measured = this.options.panel.getBoundingClientRect();
    this.options.panel.style.visibility = previousVisibility;
    this.options.panel.style.pointerEvents = previousPointerEvents;
    if (wasHidden) {
      this.options.panel.classList.add('hidden');
    }
    return { width: measured.width, height: measured.height };
  }

  private positionFixedElement(args: {
    anchorX: number;
    anchorY: number;
    alignX: 'left' | 'right';
    alignY: 'top';
    width: number;
    height: number;
  }): void {
    let left = args.alignX === 'left' ? args.anchorX : args.anchorX - args.width;
    let top = args.anchorY;

    const maxLeft = Math.max(this.margin, window.innerWidth - args.width - this.margin);
    const maxTop = Math.max(this.margin, window.innerHeight - args.height - this.margin);
    left = Math.min(Math.max(left, this.margin), maxLeft);
    top = Math.min(Math.max(top, this.margin), maxTop);

    this.options.panel.style.left = `${Math.round(left)}px`;
    this.options.panel.style.top = `${Math.round(top)}px`;
  }
}
