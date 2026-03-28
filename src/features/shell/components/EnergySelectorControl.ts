import {
  AnchoredMenu,
  createDivider as createHudDivider,
  createDropdownItem,
  createMenuHeader,
  createSidebarRailButton,
  createSurface,
  setIconButtonContent,
  setSidebarRailButtonActive,
} from '../../../ui-lib/src/hud/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import { ENERGY_LEVELS, EnergyLevel, type EnergyLevel } from '../energy.ts';
import { getEnergyLevelLabel } from '../energyPresentation.ts';
import { EnergyStatsModal } from './EnergyStatsModal.ts';

const CONTROL_TRANSITION = 'background-color 120ms ease, color 120ms ease';

export type EnergySelectorControlVariant = 'floating' | 'header' | 'sidebar';

type EnergySelectorControlOptions = {
  runtime?: AppRuntime;
  variant?: EnergySelectorControlVariant;
};

type ControlMetrics = {
  buttonSizePx: number;
  buttonRadiusPx: number;
  inactiveColor: string;
  hoverBackground: string;
  hoverColor: string;
};

type EnergyTone = {
  triggerBackground: string;
  triggerHoverBackground: string;
  triggerOpenBackground: string;
  optionBackground: string;
  optionHoverBackground: string;
  optionRing: string;
  accentText: string;
};

const CONTROL_METRICS: Record<
  Exclude<EnergySelectorControlVariant, 'sidebar'>,
  ControlMetrics
> = {
  floating: {
    buttonSizePx: 32,
    buttonRadiusPx: 9,
    inactiveColor: '#475569',
    hoverBackground: '#f8fafc',
    hoverColor: '#0f172a',
  },
  header: {
    buttonSizePx: 30,
    buttonRadiusPx: 8,
    inactiveColor: '#475569',
    hoverBackground: '#f8fafc',
    hoverColor: '#0f172a',
  },
};

const ENERGY_TONES: Record<EnergyLevel, EnergyTone> = {
  [EnergyLevel.VERY_LOW]: {
    triggerBackground: '#fffafb',
    triggerHoverBackground: '#fff3f6',
    triggerOpenBackground: '#ffe4ec',
    optionBackground: '#ffffff',
    optionHoverBackground: '#fff8fa',
    optionRing: '#fb7185',
    accentText: '#be123c',
  },
  [EnergyLevel.LOW]: {
    triggerBackground: '#fffbf6',
    triggerHoverBackground: '#fff4e8',
    triggerOpenBackground: '#fee7cf',
    optionBackground: '#ffffff',
    optionHoverBackground: '#fff9f2',
    optionRing: '#fb923c',
    accentText: '#c2410c',
  },
  [EnergyLevel.NEUTRAL]: {
    triggerBackground: '#f8fafc',
    triggerHoverBackground: '#f1f5f9',
    triggerOpenBackground: '#e2e8f0',
    optionBackground: '#ffffff',
    optionHoverBackground: '#f8fafc',
    optionRing: '#94a3b8',
    accentText: '#475569',
  },
  [EnergyLevel.HIGH]: {
    triggerBackground: '#f7fbff',
    triggerHoverBackground: '#edf5ff',
    triggerOpenBackground: '#dbeafe',
    optionBackground: '#ffffff',
    optionHoverBackground: '#f5f9ff',
    optionRing: '#60a5fa',
    accentText: '#1d4ed8',
  },
  [EnergyLevel.VERY_HIGH]: {
    triggerBackground: '#f8f8ff',
    triggerHoverBackground: '#eff1ff',
    triggerOpenBackground: '#e0e7ff',
    optionBackground: '#ffffff',
    optionHoverBackground: '#f7f7ff',
    optionRing: '#818cf8',
    accentText: '#4338ca',
  },
};

const ENERGY_FILL_COLORS: Record<EnergyLevel, string> = {
  [EnergyLevel.VERY_LOW]: '#ef4444',
  [EnergyLevel.LOW]: '#f97316',
  [EnergyLevel.NEUTRAL]: '#f59e0b',
  [EnergyLevel.HIGH]: '#22c55e',
  [EnergyLevel.VERY_HIGH]: '#16a34a',
};

const ENERGY_HINT_EMOJI: Record<EnergyLevel, string> = {
  [EnergyLevel.VERY_LOW]: '💀',
  [EnergyLevel.LOW]: '🫩',
  [EnergyLevel.NEUTRAL]: '😐',
  [EnergyLevel.HIGH]: '😛',
  [EnergyLevel.VERY_HIGH]: '😎',
};

const BATTERY_BAR_TRANSITION =
  'background-color 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms cubic-bezier(0.22, 1, 0.36, 1)';

export class EnergySelectorControl {
  public readonly element: HTMLDivElement;

  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly variant: EnergySelectorControlVariant;
  private readonly energyStatsModal: EnergyStatsModal;
  private readonly energyButton: HTMLButtonElement;
  private readonly energyMenuPanel: HTMLDivElement;
  private readonly energyMenuController: AnchoredMenu;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private triggerHovered = false;
  private menuOpen = false;

  constructor(options: EnergySelectorControlOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.variant = options.variant ?? 'floating';
    this.energyStatsModal = new EnergyStatsModal(this.runtime);

    this.element = document.createElement('div');
    this.element.className =
      this.variant === 'sidebar'
        ? 'relative flex w-full justify-center'
        : 'relative inline-flex';

    this.energyButton = this.createTriggerButton();
    this.energyButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.energyButton.disabled) {
        return;
      }
      if (this.energyMenuController.isOpen()) {
        this.energyMenuController.close();
        return;
      }
      this.renderEnergyMenuItems();
      this.energyMenuController.openAt({
        anchor: this.energyButton,
        placement: this.variant === 'sidebar' ? 'right-start' : 'top-start',
        fallbackPlacements:
          this.variant === 'sidebar'
            ? ['right-end', 'left-start', 'left-end']
            : ['top-end', 'bottom-start', 'bottom-end'],
        gap: 6,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    this.energyMenuPanel = createSurface({
      elevated: true,
      className:
        'absolute left-0 top-0 z-40 hidden w-[248px] overflow-hidden !rounded-2xl',
    });
    this.energyMenuPanel.setAttribute('role', 'dialog');

    this.energyMenuController = new AnchoredMenu({
      container: this.element,
      panel: this.energyMenuPanel,
      onOpenChange: (open) => {
        this.menuOpen = open;
        this.energyButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          this.renderEnergyMenuItems();
        }
        this.syncEnergyButton();
      },
    });

    this.element.append(this.energyButton, this.energyMenuPanel);
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshFromRuntime(),
      { emitCurrent: true }
    );
    void this.runtime.ensureEnergyLoaded().catch((error) => {
      console.warn('Failed to initialize energy selector state.', error);
    });
    this.energyMenuController.mount();
  }

  public destroy(): void {
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.energyMenuController.close();
    this.energyMenuController.unmount();
    this.energyStatsModal.destroy();
  }

  private refreshFromRuntime(): void {
    this.energyMenuPanel.setAttribute(
      'aria-label',
      this.i18n.t('workspaceControls.energySelector')
    );
    this.syncEnergyButton();
    this.renderEnergyMenuItems();
  }

  private createTriggerButton(): HTMLButtonElement {
    const button =
      this.variant === 'sidebar'
        ? createSidebarRailButton({
            icon: 'bars-2',
            title: this.i18n.t('workspaceControls.selectEnergy'),
            ariaLabel: this.i18n.t('workspaceControls.selectEnergy'),
          })
        : this.createInlineButton();

    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    this.setEnergyButtonVisual(
      button,
      null,
      this.variant === 'sidebar' ? 20 : 16
    );
    return button;
  }

  private createInlineButton(): HTMLButtonElement {
    const metrics = CONTROL_METRICS[
      this.variant === 'header' ? 'header' : 'floating'
    ];
    const button = document.createElement('button');
    button.type = 'button';
    button.title = this.i18n.t('workspaceControls.selectEnergy');
    button.setAttribute(
      'aria-label',
      this.i18n.t('workspaceControls.selectEnergy')
    );
    button.style.border = 'none';
    button.style.borderRadius = `${metrics.buttonRadiusPx}px`;
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.width = `${metrics.buttonSizePx}px`;
    button.style.height = `${metrics.buttonSizePx}px`;
    button.style.padding = '0';
    button.style.cursor = 'pointer';
    button.style.background = 'transparent';
    button.style.color = metrics.inactiveColor;
    button.style.transition = CONTROL_TRANSITION;
    button.addEventListener('mouseenter', () => {
      this.triggerHovered = true;
      this.updateInlineButtonChrome(this.runtime.getEnergyState().level);
    });
    button.addEventListener('mouseleave', () => {
      this.triggerHovered = false;
      this.updateInlineButtonChrome(this.runtime.getEnergyState().level);
    });
    return button;
  }

  private syncEnergyButton(): void {
    const energyState = this.runtime.getEnergyState();
    const title = this.getEnergyButtonTitle(energyState.level);

    this.energyButton.title = title;
    this.energyButton.setAttribute('aria-label', title);
    this.energyButton.disabled = energyState.saving;
    this.energyButton.setAttribute(
      'aria-disabled',
      energyState.saving ? 'true' : 'false'
    );
    this.energyButton.style.opacity = energyState.saving ? '0.7' : '1';
    this.energyButton.style.cursor = energyState.saving ? 'default' : 'pointer';
    this.setEnergyButtonVisual(
      this.energyButton,
      energyState.level,
      this.variant === 'sidebar' ? 20 : 16
    );

    if (this.variant === 'sidebar') {
      setSidebarRailButtonActive(this.energyButton, false);
    } else {
      this.energyButton.dataset.active = 'false';
      this.updateInlineButtonChrome(energyState.level);
    }
  }

  private renderEnergyMenuItems(): void {
    const energyState = this.runtime.getEnergyState();
    const header = this.createPickerHeader(energyState.level);
    const options = this.createOptionGrid(energyState.level, energyState.saving);
    const statsItem = createDropdownItem({
      label: this.i18n.t('workspaceControls.openEnergyStats'),
      className: '!mt-0',
      onClick: (event) => {
        event.stopPropagation();
        this.energyMenuController.close();
        this.energyStatsModal.open();
      },
    });
    statsItem.dataset.role = 'energy-stats-button';
    this.energyMenuPanel.replaceChildren(
      header,
      options,
      createHudDivider({ inset: false, tone: 'soft' }),
      statsItem
    );
    if (this.energyMenuController.isOpen()) {
      this.energyMenuController.reposition();
    }
  }

  private createPickerHeader(level: EnergyLevel | null): HTMLDivElement {
    return createMenuHeader({
      title: this.i18n.t('workspaceControls.energyMenuTitle'),
      subtitle: this.i18n.t('workspaceControls.energyMenuSubtitle'),
      className: 'mb-2',
    });
  }

  private createOptionGrid(
    currentLevel: EnergyLevel | null,
    disabled: boolean
  ): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'flex flex-col gap-2.5 px-3 pb-3';

    const shell = document.createElement('div');
    shell.className = 'relative rounded-[20px] bg-slate-100/90 px-3 py-2.5';

    const terminal = document.createElement('div');
    terminal.setAttribute('aria-hidden', 'true');
    terminal.className =
      'pointer-events-none absolute right-[-4px] top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-slate-300/90';

    const rail = document.createElement('div');
    rail.className = 'grid grid-cols-5 items-end gap-1.5';

    const hint = document.createElement('div');
    hint.className = 'flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600';
    const hintEmoji = document.createElement('span');
    hintEmoji.className = 'text-base leading-none';
    const hintLabel = document.createElement('span');
    hint.append(hintEmoji, hintLabel);

    const buttons: Array<{ level: EnergyLevel; button: HTMLButtonElement }> = [];
    const fallbackLevel = currentLevel ?? EnergyLevel.NEUTRAL;

    const applyPreviewLevel = (level: EnergyLevel): void => {
      const fillColor = ENERGY_FILL_COLORS[level];
      const previewIndex = ENERGY_LEVELS.indexOf(level);
      buttons.forEach(({ level: buttonLevel, button }, index) => {
        const active = index <= previewIndex;
        button.style.background = active ? fillColor : 'rgba(226, 232, 240, 0.92)';
        button.style.boxShadow = 'none';
        button.style.opacity = active ? '1' : '0.82';
        button.style.transform = buttonLevel === level ? 'scaleY(1.03)' : 'none';
        button.style.filter = buttonLevel === level ? 'saturate(1.03)' : 'none';
        button.dataset.active = active ? 'true' : 'false';
        button.dataset.current = buttonLevel === level ? 'true' : 'false';
        button.dataset.ring = '';
      });
      hintEmoji.textContent = ENERGY_HINT_EMOJI[level];
      hintLabel.textContent = this.getEnergyLabel(level);
    };

    const resetPreview = (): void => {
      applyPreviewLevel(currentLevel ?? fallbackLevel);
    };

    ENERGY_LEVELS.forEach((level) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.energyLevel = level;
      button.disabled = disabled;
      button.title = `${ENERGY_HINT_EMOJI[level]} ${this.getEnergyLabel(level)}`;
      button.setAttribute('aria-label', this.getEnergyLabel(level));
      button.className =
        'h-14 min-w-0 self-end rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-default disabled:opacity-60';
      button.style.transition = BATTERY_BAR_TRANSITION;
      button.style.transformOrigin = 'center bottom';
      button.addEventListener('mouseenter', () => {
        if (button.disabled) return;
        applyPreviewLevel(level);
      });
      button.addEventListener('focus', () => {
        if (button.disabled) return;
        applyPreviewLevel(level);
      });
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.energyMenuController.close();
        this.applyOptimisticEnergySelection(level);
        void this.runtime.setEnergyLevel(level).catch((error) => {
          console.warn('Failed to update energy level.', error);
        });
      });
      buttons.push({ level, button });
      rail.appendChild(button);
    });

    shell.append(rail, terminal);
    group.append(shell, hint);
    shell.addEventListener('mouseleave', resetPreview);
    shell.addEventListener('focusout', (event) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && shell.contains(nextTarget)) {
        return;
      }
      resetPreview();
    });
    applyPreviewLevel(fallbackLevel);

    return group;
  }

  private setEnergyButtonVisual(
    button: HTMLButtonElement,
    level: EnergyLevel | null,
    sizePx: number
  ): void {
    const visual = this.createEnergyVisual(level, sizePx);
    if (this.variant === 'sidebar') {
      setIconButtonContent(button, visual);
      return;
    }
    button.replaceChildren(visual);
  }

  private applyOptimisticEnergySelection(level: EnergyLevel): void {
    const title = this.getEnergyCurrentText(level);
    this.energyButton.title = title;
    this.energyButton.setAttribute('aria-label', title);
    this.setEnergyButtonVisual(
      this.energyButton,
      level,
      this.variant === 'sidebar' ? 20 : 16
    );
    if (this.variant !== 'sidebar') {
      this.updateInlineButtonChrome(level);
    }
  }

  private updateInlineButtonChrome(level: EnergyLevel | null): void {
    if (this.variant === 'sidebar') {
      return;
    }
    const metrics = CONTROL_METRICS[
      this.variant === 'header' ? 'header' : 'floating'
    ];
    const tone = level ? ENERGY_TONES[level] : null;
    let background = 'transparent';
    if (this.menuOpen) {
      background = tone?.triggerOpenBackground ?? metrics.hoverBackground;
    } else if (this.triggerHovered) {
      background = tone?.triggerHoverBackground ?? metrics.hoverBackground;
    } else if (tone) {
      background = tone.triggerBackground;
    }
    this.energyButton.style.background = background;
    this.energyButton.style.color = this.menuOpen || this.triggerHovered
      ? metrics.hoverColor
      : metrics.inactiveColor;
  }

  private createEnergyVisual(
    level: EnergyLevel | null,
    sizePx: number
  ): SVGSVGElement {
    const resolvedLevel = level ?? EnergyLevel.NEUTRAL;
    const compact = sizePx >= 16;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('data-energy-glyph', resolvedLevel);
    svg.style.display = 'block';
    svg.style.width = `${sizePx}px`;
    svg.style.height = `${sizePx}px`;
    svg.style.flexShrink = '0';
    const outlineColor = compact ? '#64748b' : '#94a3b8';
    const emptyBarColor = compact ? '#cbd5e1' : '#e2e8f0';
    const fillColor = ENERGY_FILL_COLORS[resolvedLevel];
    const filledBars = Number.parseInt(resolvedLevel, 10);

    const appendRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      options: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        radius?: number;
        opacity?: number;
      }
    ): void => {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', `${x}`);
      rect.setAttribute('y', `${y}`);
      rect.setAttribute('width', `${width}`);
      rect.setAttribute('height', `${height}`);
      rect.setAttribute('rx', `${options.radius ?? 0}`);
      if (options.fill) {
        rect.setAttribute('fill', options.fill);
      }
      if (options.stroke) {
        rect.setAttribute('stroke', options.stroke);
      }
      if (options.strokeWidth) {
        rect.setAttribute('stroke-width', `${options.strokeWidth}`);
      }
      if (options.opacity !== undefined) {
        rect.setAttribute('opacity', `${options.opacity}`);
      }
      svg.appendChild(rect);
    };

    const shellX = compact ? 2.2 : 2.75;
    const shellY = compact ? 6 : 6.5;
    const shellWidth = compact ? 17.95 : 17.5;
    const shellHeight = compact ? 12 : 11;
    const shellRadius = compact ? 3.1 : 2.8;
    const shellStroke = compact ? 1.7 : 1.4;
    appendRect(shellX, shellY, shellWidth, shellHeight, {
      stroke: outlineColor,
      strokeWidth: shellStroke,
      radius: shellRadius,
    });
    appendRect(compact ? 20.55 : 20.7, compact ? 9 : 9.25, compact ? 1.95 : 1.7, compact ? 6 : 5.5, {
      fill: outlineColor,
      radius: compact ? 1 : 0.9,
      opacity: compact ? 1 : 0.9,
    });

    const barWidth = compact ? 2.28 : 2.2;
    const barGap = compact ? 0.6 : 0.7;
    const startX = compact ? 4.52 : 5;
    const barY = compact ? 8.1 : 8.8;
    const barHeight = compact ? 7.8 : 6.4;
    const barRadius = compact ? 1 : 0.9;
    for (let index = 0; index < 5; index += 1) {
      appendRect(startX + index * (barWidth + barGap), barY, barWidth, barHeight, {
        fill: index < filledBars ? fillColor : emptyBarColor,
        radius: barRadius,
        opacity: index < filledBars ? 1 : compact ? 0.92 : 1,
      });
    }

    return svg;
  }

  private getEnergyLabel(level: EnergyLevel): string {
    return getEnergyLevelLabel(this.i18n, level);
  }

  private getEnergyCurrentText(level: EnergyLevel): string {
    return this.i18n.t('workspaceControls.energyCurrent', {
      level: this.getEnergyLabel(level),
    });
  }

  private getEnergyButtonTitle(level: EnergyLevel | null): string {
    if (!level) {
      return this.i18n.t('workspaceControls.selectEnergy');
    }
    return this.getEnergyCurrentText(level);
  }
}
