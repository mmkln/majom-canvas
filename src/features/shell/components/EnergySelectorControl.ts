import { createIcon } from '../../canvas/ui/icons.ts';
import {
  AnchoredMenu,
  createDivider as createHudDivider,
  createDropdownItem,
  createMenuControlRow,
  createSidebarRailButton,
  createSurface,
  PAGE_EYEBROW_CLASS,
  setSidebarRailButtonActive,
} from '../../../ui-lib/src/hud/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import { ENERGY_LEVELS, type EnergyLevel } from '../energy.ts';
import { getEnergyLevelLabel, getEnergyVisual } from '../energyPresentation.ts';
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
        'absolute left-0 top-0 z-40 hidden min-w-[188px] overflow-hidden !rounded-xl',
    });
    this.energyMenuPanel.setAttribute('role', 'menu');

    this.energyMenuController = new AnchoredMenu({
      container: this.element,
      panel: this.energyMenuPanel,
      onOpenChange: (open) => {
        this.energyButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          this.renderEnergyMenuItems();
        }
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
      this.variant === 'sidebar' ? 18 : 16
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
      button.style.background = metrics.hoverBackground;
      button.style.color = metrics.hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
      button.style.color = metrics.inactiveColor;
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
      this.variant === 'sidebar' ? 18 : 16
    );

    if (this.variant === 'sidebar') {
      setSidebarRailButtonActive(this.energyButton, false);
    } else {
      this.energyButton.dataset.active = 'false';
      this.energyButton.style.background = 'transparent';
    }
  }

  private renderEnergyMenuItems(): void {
    const energyState = this.runtime.getEnergyState();
    const headerRow = createMenuControlRow({
      control: this.createEnergyMenuHeading(),
      className: '!pb-1 !pt-3',
    });
    const items = ENERGY_LEVELS.map((level) => {
      const item = createDropdownItem({
        label: this.getEnergyLabel(level),
        variant: energyState.level === level ? 'selected' : 'default',
        disabled: energyState.saving,
        leading: this.createMenuItemIcon(level),
        trailing:
          energyState.level === level
            ? this.createSelectedEnergyTrailing()
            : null,
        onClick: (event) => {
          event.stopPropagation();
          this.energyMenuController.close();
          void this.runtime.setEnergyLevel(level).catch((error) => {
            console.warn('Failed to update energy level.', error);
          });
        },
      });
      item.dataset.energyLevel = level;
      return item;
    });
    const statsItem = createDropdownItem({
      label: this.i18n.t('workspaceControls.openEnergyStats'),
      onClick: (event) => {
        event.stopPropagation();
        this.energyMenuController.close();
        this.energyStatsModal.open();
      },
    });
    statsItem.dataset.role = 'energy-stats-button';
    this.energyMenuPanel.replaceChildren(
      headerRow,
      ...items,
      createHudDivider({ inset: false, tone: 'soft' }),
      statsItem
    );
    if (this.energyMenuController.isOpen()) {
      this.energyMenuController.reposition();
    }
  }

  private createEnergyMenuHeading(): HTMLSpanElement {
    const heading = document.createElement('span');
    heading.className = PAGE_EYEBROW_CLASS;
    heading.style.marginBottom = '0';
    heading.textContent = this.i18n.t('workspaceControls.energyMenuTitle');
    return heading;
  }

  private createMenuItemIcon(level: EnergyLevel): HTMLSpanElement {
    const leading = document.createElement('span');
    leading.className = 'inline-flex items-center justify-center';
    leading.appendChild(this.createEnergyVisual(level, 16));
    return leading;
  }

  private createSelectedEnergyTrailing(): HTMLSpanElement {
    const trailing = document.createElement('span');
    trailing.className =
      'ml-auto inline-flex items-center justify-center text-indigo-600';
    const icon = createIcon('check', {
      size: 14,
      strokeWidth: 2,
    });
    icon.setAttribute('aria-hidden', 'true');
    trailing.appendChild(icon);
    return trailing;
  }

  private setEnergyButtonVisual(
    button: HTMLButtonElement,
    level: EnergyLevel | null,
    sizePx: number
  ): void {
    button.replaceChildren(this.createEnergyVisual(level, sizePx));
  }

  private createEnergyVisual(
    level: EnergyLevel | null,
    sizePx: number
  ): HTMLImageElement {
    const visual = getEnergyVisual(level);
    const image = document.createElement('img');
    image.src = visual.webp;
    image.alt = visual.alt;
    image.width = sizePx;
    image.height = sizePx;
    image.decoding = 'async';
    image.draggable = false;
    image.setAttribute('aria-hidden', 'true');
    image.setAttribute('data-energy-emoji', visual.alt);
    image.style.display = 'block';
    image.style.width = `${sizePx}px`;
    image.style.height = `${sizePx}px`;
    image.style.objectFit = 'contain';
    image.style.flexShrink = '0';
    return image;
  }

  private getEnergyLabel(level: EnergyLevel): string {
    return getEnergyLevelLabel(this.i18n, level);
  }

  private getEnergyButtonTitle(level: EnergyLevel | null): string {
    if (!level) {
      return this.i18n.t('workspaceControls.selectEnergy');
    }
    return this.i18n.t('workspaceControls.energyCurrent', {
      level: this.getEnergyLabel(level),
    });
  }
}
