import { FloatingMenuController } from './FloatingMenuController.ts';

type HudAnchoredSide = 'right' | 'left' | 'auto';
type HudAnchoredResolvedSide = 'right' | 'left';
type HudAnchoredVertical = 'bottom' | 'top' | 'center';
export type HudAnchoredPlacement =
  | 'auto'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'left-start'
  | 'left'
  | 'left-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'top-start'
  | 'top'
  | 'top-end';
export type HudAnchoredResolvedPlacement = Exclude<
  HudAnchoredPlacement,
  'auto'
>;
type HudAnchoredAlign = 'start' | 'center' | 'end';
type HudAnchoredPrimary = 'right' | 'left' | 'bottom' | 'top';
type HudAnchoredMode = 'legacy' | 'modern';
type HudAnchoredPositioning = 'container' | 'viewport';

type HudAnchoredMenuOptions = {
  container: HTMLElement;
  panel: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  positioning?: HudAnchoredPositioning;
  portalTarget?: HTMLElement;
};

type HudAnchoredMenuOpenOptions = {
  anchor: HTMLElement;
  placement?: HudAnchoredPlacement;
  fallbackPlacements?: HudAnchoredResolvedPlacement[];
  side?: HudAnchoredSide;
  fallbackSide?: HudAnchoredResolvedSide;
  vertical?: HudAnchoredVertical;
  fallbackVertical?: HudAnchoredVertical;
  gap?: number;
  margin?: number;
  matchAnchorWidth?: boolean;
  lockPlacementAfterOpen?: boolean;
};

export class HudAnchoredMenu {
  private readonly container: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly onOpenChange?: (open: boolean) => void;
  private readonly positioning: HudAnchoredPositioning;
  private readonly portalTarget: HTMLElement;
  private readonly originalParent: ParentNode | null;
  private readonly originalNextSibling: ChildNode | null;
  private readonly menuController: FloatingMenuController;
  private mode: HudAnchoredMode = 'legacy';
  private open = false;
  private anchor: HTMLElement | null = null;
  private legacyPlacement: {
    side: HudAnchoredSide;
    fallbackSide: HudAnchoredResolvedSide;
    vertical: HudAnchoredVertical;
    fallbackVertical: HudAnchoredVertical;
    gap: number;
    margin: number;
    matchAnchorWidth: boolean;
    lockPlacementAfterOpen: boolean;
  } = {
    side: 'right',
    fallbackSide: 'left',
    vertical: 'bottom',
    fallbackVertical: 'top',
    gap: 4,
    margin: 8,
    matchAnchorWidth: false,
    lockPlacementAfterOpen: false,
  };
  private modernPlacement: {
    placement: HudAnchoredPlacement;
    fallbackPlacements: HudAnchoredResolvedPlacement[];
    gap: number;
    margin: number;
    matchAnchorWidth: boolean;
    lockPlacementAfterOpen: boolean;
  };
  private mounted = false;
  private resolvedSide: HudAnchoredResolvedSide | null = null;
  private resolvedVertical: HudAnchoredVertical | null = null;
  private resolvedPlacement: HudAnchoredResolvedPlacement | null = null;

  constructor(options: HudAnchoredMenuOptions) {
    this.container = options.container;
    this.panel = options.panel;
    this.positioning = options.positioning ?? 'container';
    this.portalTarget = options.portalTarget ?? document.body;
    this.originalParent = this.panel.parentNode;
    this.originalNextSibling = this.panel.nextSibling;
    this.container.setAttribute('data-component', 'HudAnchoredMenu');
    this.panel.setAttribute('data-component', 'HudAnchoredMenuPanel');
    this.panel.classList.add('z-40');
    this.panel.style.position =
      this.positioning === 'viewport' ? 'fixed' : 'absolute';
    this.onOpenChange = options.onOpenChange;
    this.open = !this.panel.classList.contains('hidden');
    this.modernPlacement = {
      placement: 'right-start',
      fallbackPlacements: this.getDefaultFallbackPlacements('right-start'),
      gap: 4,
      margin: 8,
      matchAnchorWidth: false,
      lockPlacementAfterOpen: false,
    };

    this.menuController = new FloatingMenuController({
      isOpen: () => this.open,
      setOpen: (open) => this.setOpen(open),
      containsTarget: (target) =>
        this.container.contains(target) || this.panel.contains(target),
    });
  }

  public mount(): void {
    if (this.mounted) return;
    this.attachPanel();
    this.menuController.mount();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, true);
    this.mounted = true;
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.menuController.unmount();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll, true);
    this.restorePanel();
    this.mounted = false;
  }

  public isOpen(): boolean {
    return this.open;
  }

  public openAt(options: HudAnchoredMenuOpenOptions): void {
    this.attachPanel();
    this.anchor = options.anchor;
    const hasModernPlacement =
      typeof options.placement !== 'undefined' ||
      typeof options.fallbackPlacements !== 'undefined';

    if (hasModernPlacement) {
      const placement = options.placement ?? 'right-start';
      const fallbackPlacements = this.normalizeFallbackPlacements(
        options.fallbackPlacements ??
          this.getDefaultFallbackPlacements(this.normalizePlacement(placement)),
        this.normalizePlacement(placement)
      );
      this.mode = 'modern';
      this.modernPlacement = {
        placement,
        fallbackPlacements,
        gap: options.gap ?? 4,
        margin: options.margin ?? 8,
        matchAnchorWidth: options.matchAnchorWidth ?? false,
        lockPlacementAfterOpen: options.lockPlacementAfterOpen ?? false,
      };
    } else {
      this.mode = 'legacy';
      this.legacyPlacement = {
        side: options.side ?? 'right',
        fallbackSide: options.fallbackSide ?? 'left',
        vertical: options.vertical ?? 'bottom',
        fallbackVertical: options.fallbackVertical ?? 'top',
        gap: options.gap ?? 4,
        margin: options.margin ?? 8,
        matchAnchorWidth: options.matchAnchorWidth ?? false,
        lockPlacementAfterOpen: options.lockPlacementAfterOpen ?? false,
      };
    }

    this.resolvedSide = null;
    this.resolvedVertical = null;
    this.resolvedPlacement = null;
    this.setOpen(true);
    this.reposition();
  }

  public close(): void {
    this.setOpen(false);
  }

  public reposition(): void {
    if (!this.open || !this.anchor) return;
    if (!document.body.contains(this.anchor)) {
      this.close();
      return;
    }

    const { width: menuWidth, height: menuHeight } = this.measurePanel();
    const anchorRect = this.anchor.getBoundingClientRect();

    if (this.mode === 'modern') {
      this.repositionModern(anchorRect, menuWidth, menuHeight);
      return;
    }

    this.repositionLegacy(anchorRect, menuWidth, menuHeight);
  }

  private setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    this.panel.classList.toggle('hidden', !open);
    if (!open) {
      this.anchor = null;
      this.resolvedSide = null;
      this.resolvedVertical = null;
      this.resolvedPlacement = null;
      this.panel.style.width = '';
    }
    this.onOpenChange?.(open);
  }

  private attachPanel(): void {
    if (this.positioning !== 'viewport') return;
    if (this.panel.parentElement === this.portalTarget) return;
    this.portalTarget.appendChild(this.panel);
  }

  private restorePanel(): void {
    if (this.positioning !== 'viewport') return;
    if (!this.originalParent) return;
    if (
      this.originalNextSibling &&
      this.originalNextSibling.parentNode === this.originalParent
    ) {
      this.originalParent.insertBefore(this.panel, this.originalNextSibling);
      return;
    }
    this.originalParent.appendChild(this.panel);
  }

  private measurePanel(): { width: number; height: number } {
    const rect = this.panel.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }

    const wasHidden = this.panel.classList.contains('hidden');
    const previousVisibility = this.panel.style.visibility;
    const previousPointerEvents = this.panel.style.pointerEvents;
    if (wasHidden) {
      this.panel.classList.remove('hidden');
    }
    this.panel.style.visibility = 'hidden';
    this.panel.style.pointerEvents = 'none';
    const measured = this.panel.getBoundingClientRect();
    this.panel.style.visibility = previousVisibility;
    this.panel.style.pointerEvents = previousPointerEvents;
    if (wasHidden) {
      this.panel.classList.add('hidden');
    }
    return { width: measured.width, height: measured.height };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private readonly onResize = (): void => {
    this.reposition();
  };

  private readonly onScroll = (): void => {
    this.reposition();
  };

  private repositionLegacy(
    anchorRect: DOMRect,
    menuWidth: number,
    menuHeight: number
  ): void {
    const gap = this.legacyPlacement.gap;
    const margin = this.legacyPlacement.margin;
    const resolvedSide = this.resolveSide(anchorRect, menuWidth, gap, margin);
    const resolvedVertical = this.resolveVertical(
      anchorRect,
      menuHeight,
      gap,
      margin
    );
    const leftAbsolute =
      resolvedSide === 'right'
        ? anchorRect.right + gap
        : anchorRect.left - menuWidth - gap;
    const topAbsolute = this.getVerticalAbsolute(
      resolvedVertical,
      anchorRect,
      menuHeight,
      gap
    );

    this.applyAbsolutePosition({
      anchorRect,
      leftAbsolute,
      topAbsolute,
      menuWidth,
      menuHeight,
      margin,
      matchAnchorWidth: this.legacyPlacement.matchAnchorWidth,
    });
  }

  private repositionModern(
    anchorRect: DOMRect,
    menuWidth: number,
    menuHeight: number
  ): void {
    const gap = this.modernPlacement.gap;
    const margin = this.modernPlacement.margin;
    const placement = this.resolvePlacement(
      anchorRect,
      menuWidth,
      menuHeight,
      gap,
      margin
    );
    const coordinates = this.getCoordinatesForPlacement(
      placement,
      anchorRect,
      menuWidth,
      menuHeight,
      gap
    );

    this.applyAbsolutePosition({
      anchorRect,
      leftAbsolute: coordinates.leftAbsolute,
      topAbsolute: coordinates.topAbsolute,
      menuWidth,
      menuHeight,
      margin,
      matchAnchorWidth: this.modernPlacement.matchAnchorWidth,
    });
  }

  private applyAbsolutePosition(params: {
    anchorRect: DOMRect;
    leftAbsolute: number;
    topAbsolute: number;
    menuWidth: number;
    menuHeight: number;
    margin: number;
    matchAnchorWidth: boolean;
  }): void {
    const minLeftAbsolute = params.margin;
    const maxLeftAbsolute =
      window.innerWidth - params.margin - params.menuWidth;
    const minTopAbsolute = params.margin;
    const maxTopAbsolute =
      window.innerHeight - params.margin - params.menuHeight;
    const clampedLeftAbsolute = this.clamp(
      params.leftAbsolute,
      minLeftAbsolute,
      Math.max(minLeftAbsolute, maxLeftAbsolute)
    );
    const clampedTopAbsolute = this.clamp(
      params.topAbsolute,
      minTopAbsolute,
      Math.max(minTopAbsolute, maxTopAbsolute)
    );
    const left =
      this.positioning === 'viewport'
        ? clampedLeftAbsolute
        : clampedLeftAbsolute - this.container.getBoundingClientRect().left;
    const top =
      this.positioning === 'viewport'
        ? clampedTopAbsolute
        : clampedTopAbsolute - this.container.getBoundingClientRect().top;

    if (params.matchAnchorWidth) {
      this.panel.style.width = `${Math.round(params.anchorRect.width)}px`;
    } else {
      this.panel.style.width = '';
    }

    this.panel.style.left = `${Math.round(left)}px`;
    this.panel.style.top = `${Math.round(top)}px`;
  }

  private resolveSide(
    anchorRect: DOMRect,
    menuWidth: number,
    gap: number,
    margin: number
  ): HudAnchoredResolvedSide {
    if (this.legacyPlacement.lockPlacementAfterOpen && this.resolvedSide) {
      return this.resolvedSide;
    }

    let resolved: HudAnchoredResolvedSide;
    const fitsRight =
      anchorRect.right + gap + menuWidth <= window.innerWidth - margin;
    const fitsLeft = anchorRect.left - gap - menuWidth >= margin;
    if (this.legacyPlacement.side === 'auto') {
      if (fitsRight && !fitsLeft) {
        resolved = 'right';
      } else if (fitsLeft && !fitsRight) {
        resolved = 'left';
      } else {
        const rightSpace = window.innerWidth - margin - anchorRect.right - gap;
        const leftSpace = anchorRect.left - margin - gap;
        resolved = rightSpace >= leftSpace ? 'right' : 'left';
      }
    } else {
      const preferred = this.legacyPlacement.side;
      const fallback = this.legacyPlacement.fallbackSide;
      const fitsPreferred = preferred === 'right' ? fitsRight : fitsLeft;
      resolved = fitsPreferred ? preferred : fallback;
    }

    this.resolvedSide = resolved;
    return resolved;
  }

  private resolveVertical(
    anchorRect: DOMRect,
    menuHeight: number,
    gap: number,
    margin: number
  ): HudAnchoredVertical {
    if (this.legacyPlacement.lockPlacementAfterOpen && this.resolvedVertical) {
      return this.resolvedVertical;
    }

    const preferred = this.legacyPlacement.vertical;
    const fallback = this.legacyPlacement.fallbackVertical;
    const fitsPreferred = this.fitsVertical(
      preferred,
      anchorRect,
      menuHeight,
      gap,
      margin
    );
    const resolved = fitsPreferred ? preferred : fallback;
    this.resolvedVertical = resolved;
    return resolved;
  }

  private fitsVertical(
    vertical: HudAnchoredVertical,
    anchorRect: DOMRect,
    menuHeight: number,
    gap: number,
    margin: number
  ): boolean {
    if (vertical === 'bottom') {
      return (
        anchorRect.bottom + gap + menuHeight <= window.innerHeight - margin
      );
    }
    if (vertical === 'top') {
      return anchorRect.top - gap - menuHeight >= margin;
    }
    const centerTop = anchorRect.top + (anchorRect.height - menuHeight) / 2;
    return (
      centerTop >= margin &&
      centerTop + menuHeight <= window.innerHeight - margin
    );
  }

  private getVerticalAbsolute(
    vertical: HudAnchoredVertical,
    anchorRect: DOMRect,
    menuHeight: number,
    gap: number
  ): number {
    if (vertical === 'bottom') {
      return anchorRect.bottom + gap;
    }
    if (vertical === 'top') {
      return anchorRect.top - menuHeight - gap;
    }
    return anchorRect.top + (anchorRect.height - menuHeight) / 2;
  }

  private resolvePlacement(
    anchorRect: DOMRect,
    menuWidth: number,
    menuHeight: number,
    gap: number,
    margin: number
  ): HudAnchoredResolvedPlacement {
    if (this.modernPlacement.lockPlacementAfterOpen && this.resolvedPlacement) {
      return this.resolvedPlacement;
    }

    const candidates = this.buildPlacementCandidates(
      anchorRect,
      gap,
      this.modernPlacement.placement,
      this.modernPlacement.fallbackPlacements
    );

    let bestPlacement = candidates[0];
    let bestOverflow = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const { leftAbsolute, topAbsolute } = this.getCoordinatesForPlacement(
        candidate,
        anchorRect,
        menuWidth,
        menuHeight,
        gap
      );
      const overflow = this.calculateOverflow(
        leftAbsolute,
        topAbsolute,
        menuWidth,
        menuHeight,
        margin
      );
      if (overflow <= 0) {
        this.resolvedPlacement = candidate;
        return candidate;
      }
      if (overflow < bestOverflow) {
        bestOverflow = overflow;
        bestPlacement = candidate;
      }
    }

    this.resolvedPlacement = bestPlacement;
    return bestPlacement;
  }

  private buildPlacementCandidates(
    anchorRect: DOMRect,
    gap: number,
    placement: HudAnchoredPlacement,
    fallbackPlacements: HudAnchoredResolvedPlacement[]
  ): HudAnchoredResolvedPlacement[] {
    if (placement === 'auto') {
      return this.getAutoPlacements(anchorRect, gap);
    }
    const normalizedPlacement = this.normalizePlacement(placement);
    return this.normalizeFallbackPlacements(
      [normalizedPlacement, ...fallbackPlacements],
      null
    );
  }

  private getAutoPlacements(
    anchorRect: DOMRect,
    gap: number
  ): HudAnchoredResolvedPlacement[] {
    const margin = this.modernPlacement.margin;
    const spaces: Array<{ side: HudAnchoredPrimary; value: number }> = [
      {
        side: 'right',
        value: window.innerWidth - margin - anchorRect.right - gap,
      },
      { side: 'left', value: anchorRect.left - margin - gap },
      {
        side: 'bottom',
        value: window.innerHeight - margin - anchorRect.bottom - gap,
      },
      { side: 'top', value: anchorRect.top - margin - gap },
    ];
    spaces.sort((left, right) => right.value - left.value);

    const candidates: HudAnchoredResolvedPlacement[] = [];
    spaces.forEach((entry) => {
      candidates.push(`${entry.side}-start`, entry.side, `${entry.side}-end`);
    });

    return this.normalizeFallbackPlacements(candidates, null);
  }

  private getDefaultFallbackPlacements(
    preferredPlacement: HudAnchoredResolvedPlacement
  ): HudAnchoredResolvedPlacement[] {
    const parsed = this.parsePlacement(preferredPlacement);
    const oppositeSide = this.getOppositeSide(parsed.side);
    const oppositeAlign = this.getOppositeAlign(parsed.align);
    const defaults: HudAnchoredResolvedPlacement[] = [
      this.composePlacement(oppositeSide, parsed.align),
      this.composePlacement(parsed.side, 'center'),
      this.composePlacement(oppositeSide, 'center'),
      this.composePlacement(parsed.side, oppositeAlign),
      this.composePlacement(oppositeSide, oppositeAlign),
      ...this.getCrossAxisFallbacks(parsed.side),
    ];
    return this.normalizeFallbackPlacements(defaults, preferredPlacement);
  }

  private getCrossAxisFallbacks(
    side: HudAnchoredPrimary
  ): HudAnchoredResolvedPlacement[] {
    if (side === 'left' || side === 'right') {
      return [
        'bottom-start',
        'bottom',
        'bottom-end',
        'top-start',
        'top',
        'top-end',
      ];
    }

    return [
      'right-start',
      'right',
      'right-end',
      'left-start',
      'left',
      'left-end',
    ];
  }

  private normalizeFallbackPlacements(
    placements: HudAnchoredPlacement[],
    exclude: HudAnchoredResolvedPlacement | null
  ): HudAnchoredResolvedPlacement[] {
    const unique = new Set<HudAnchoredResolvedPlacement>();
    placements.forEach((placement) => {
      if (placement === 'auto') return;
      const normalized = this.normalizePlacement(placement);
      if (exclude && normalized === exclude) return;
      unique.add(normalized);
    });
    return Array.from(unique);
  }

  private normalizePlacement(
    placement: HudAnchoredPlacement
  ): HudAnchoredResolvedPlacement {
    if (placement === 'auto') {
      return 'right-start';
    }
    return placement;
  }

  private parsePlacement(placement: HudAnchoredResolvedPlacement): {
    side: HudAnchoredPrimary;
    align: HudAnchoredAlign;
  } {
    const [baseSide, suffix] = placement.split('-') as [
      HudAnchoredPrimary,
      HudAnchoredAlign | undefined,
    ];
    const align: HudAnchoredAlign = suffix ?? 'center';
    return { side: baseSide, align };
  }

  private composePlacement(
    side: HudAnchoredPrimary,
    align: HudAnchoredAlign
  ): HudAnchoredResolvedPlacement {
    if (align === 'center') {
      return side;
    }
    return `${side}-${align}`;
  }

  private getOppositeSide(side: HudAnchoredPrimary): HudAnchoredPrimary {
    if (side === 'right') return 'left';
    if (side === 'left') return 'right';
    if (side === 'top') return 'bottom';
    return 'top';
  }

  private getOppositeAlign(align: HudAnchoredAlign): HudAnchoredAlign {
    if (align === 'start') return 'end';
    if (align === 'end') return 'start';
    return 'center';
  }

  private getCoordinatesForPlacement(
    placement: HudAnchoredResolvedPlacement,
    anchorRect: DOMRect,
    menuWidth: number,
    menuHeight: number,
    gap: number
  ): { leftAbsolute: number; topAbsolute: number } {
    const parsed = this.parsePlacement(placement);

    if (parsed.side === 'right') {
      return {
        leftAbsolute: anchorRect.right + gap,
        topAbsolute: this.getAlignedTop(anchorRect, menuHeight, parsed.align),
      };
    }
    if (parsed.side === 'left') {
      return {
        leftAbsolute: anchorRect.left - menuWidth - gap,
        topAbsolute: this.getAlignedTop(anchorRect, menuHeight, parsed.align),
      };
    }
    if (parsed.side === 'bottom') {
      return {
        leftAbsolute: this.getAlignedLeft(anchorRect, menuWidth, parsed.align),
        topAbsolute: anchorRect.bottom + gap,
      };
    }

    return {
      leftAbsolute: this.getAlignedLeft(anchorRect, menuWidth, parsed.align),
      topAbsolute: anchorRect.top - menuHeight - gap,
    };
  }

  private getAlignedTop(
    anchorRect: DOMRect,
    menuHeight: number,
    align: HudAnchoredAlign
  ): number {
    if (align === 'start') return anchorRect.top;
    if (align === 'end') return anchorRect.bottom - menuHeight;
    return anchorRect.top + (anchorRect.height - menuHeight) / 2;
  }

  private getAlignedLeft(
    anchorRect: DOMRect,
    menuWidth: number,
    align: HudAnchoredAlign
  ): number {
    if (align === 'start') return anchorRect.left;
    if (align === 'end') return anchorRect.right - menuWidth;
    return anchorRect.left + (anchorRect.width - menuWidth) / 2;
  }

  private calculateOverflow(
    leftAbsolute: number,
    topAbsolute: number,
    menuWidth: number,
    menuHeight: number,
    margin: number
  ): number {
    const leftOverflow = Math.max(0, margin - leftAbsolute);
    const rightOverflow = Math.max(
      0,
      leftAbsolute + menuWidth - (window.innerWidth - margin)
    );
    const topOverflow = Math.max(0, margin - topAbsolute);
    const bottomOverflow = Math.max(
      0,
      topAbsolute + menuHeight - (window.innerHeight - margin)
    );

    return leftOverflow + rightOverflow + topOverflow + bottomOverflow;
  }
}
