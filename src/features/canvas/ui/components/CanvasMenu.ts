import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';
import { emitCanvasAutosaveToggled } from '../../core/canvasAutosaveLifecycle.ts';
import {
  AnchoredMenu,
  createDivider,
  createDropdownItem,
  createIconButton,
  createMenuControlRow,
  createMenuHeader,
  createSurface,
  createToggleSwitch,
  Submenu,
} from '../primitives/index.ts';
import { openTopbarDropdown } from './topbarDropdownLayout.ts';
import { type I18nService } from '../../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import { createIcon } from '../../../../ui-lib/src/hud/icons.ts';

type CanvasMenuOptions = {
  containerClassName?: string;
  runtime?: AppRuntime;
  hidden?: boolean;
  initialAnimationsEnabled?: boolean;
  onAnimationsToggle?: (enabled: boolean) => void;
  initialSmartGuidesEnabled?: boolean;
  onSmartGuidesToggle?: (enabled: boolean) => void;
  initialSpacingGuidesEnabled?: boolean;
  onSpacingGuidesToggle?: (enabled: boolean) => void;
  initialContainerGuidesEnabled?: boolean;
  onContainerGuidesToggle?: (enabled: boolean) => void;
  initialViewportCenterGuidesEnabled?: boolean;
  onViewportCenterGuidesToggle?: (enabled: boolean) => void;
};

export class CanvasMenu {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly container: HTMLDivElement;
  private readonly menuButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: AnchoredMenu;
  private readonly hidden: boolean;
  private guideOptionsSubmenu: Submenu | null = null;
  private readonly animationsToggleHandler: ((enabled: boolean) => void) | null;
  private readonly smartGuidesToggleHandler:
    | ((enabled: boolean) => void)
    | null;
  private readonly spacingGuidesToggleHandler:
    | ((enabled: boolean) => void)
    | null;
  private readonly containerGuidesToggleHandler:
    | ((enabled: boolean) => void)
    | null;
  private readonly viewportCenterGuidesToggleHandler:
    | ((enabled: boolean) => void)
    | null;
  private animationsEnabled: boolean;
  private smartGuidesEnabled: boolean;
  private spacingGuidesEnabled: boolean;
  private containerGuidesEnabled: boolean;
  private viewportCenterGuidesEnabled: boolean;
  private autosaveEnabled: boolean;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private mounted = false;

  constructor(
    _authService?: unknown,
    _userApiService?: unknown,
    options: CanvasMenuOptions = {}
  ) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.hidden = options.hidden ?? false;
    this.container = document.createElement('div');
    this.container.className =
      options.containerClassName ?? 'relative z-30 flex items-center';

    this.menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      title: this.i18n.t('canvasMenu.openCanvasMenu'),
      ariaLabel: this.i18n.t('canvasMenu.openCanvasMenu'),
      onClick: (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      },
    });

    this.dropdownMenu = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-30 hidden w-72 overflow-hidden',
    });

    this.animationsEnabled = options.initialAnimationsEnabled ?? true;
    this.animationsToggleHandler = options.onAnimationsToggle ?? null;
    this.smartGuidesEnabled =
      options.initialSmartGuidesEnabled ??
      CanvasClientStorage.getCanvasSmartGuidesEnabled(false);
    this.smartGuidesToggleHandler = options.onSmartGuidesToggle ?? null;
    this.spacingGuidesEnabled =
      options.initialSpacingGuidesEnabled ??
      CanvasClientStorage.getCanvasSpacingGuidesEnabled(true);
    this.spacingGuidesToggleHandler = options.onSpacingGuidesToggle ?? null;
    this.containerGuidesEnabled =
      options.initialContainerGuidesEnabled ??
      CanvasClientStorage.getCanvasContainerGuidesEnabled(true);
    this.containerGuidesToggleHandler = options.onContainerGuidesToggle ?? null;
    this.viewportCenterGuidesEnabled =
      options.initialViewportCenterGuidesEnabled ??
      CanvasClientStorage.getCanvasViewportCenterGuidesEnabled(true);
    this.viewportCenterGuidesToggleHandler =
      options.onViewportCenterGuidesToggle ?? null;
    this.autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);

    this.dropdownController = new AnchoredMenu({
      container: this.container,
      panel: this.dropdownMenu,
      onOpenChange: (open) => {
        if (!open) {
          this.guideOptionsSubmenu?.close();
        }
        this.menuButton.classList.toggle('bg-indigo-50', open);
        this.menuButton.classList.toggle('text-indigo-700', open);
      },
    });
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.mounted) return;
    this.renderDropdownContent();
    this.container.replaceChildren(
      ...(this.hidden ? [] : [this.menuButton]),
      this.dropdownMenu
    );
    parent.appendChild(this.container);
    if (!this.hidden) {
      this.dropdownController.mount();
    }
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => {
        this.refreshTranslations();
      },
      { emitCurrent: true }
    );
    this.mounted = true;
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.setDropdownOpen(false);
    this.destroyGuideOptionsSubmenu();
    if (!this.hidden) {
      this.dropdownController.unmount();
    }
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.container.remove();
    this.mounted = false;
  }

  private renderDropdownContent(): void {
    this.destroyGuideOptionsSubmenu();
    this.dropdownMenu.innerHTML = '';

    const sectionTitle = createMenuHeader({
      title: this.i18n.t('canvasMenu.sectionTitle'),
    });

    const actions = document.createElement('div');
    const animationsToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.canvasAnimations'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.animationsEnabled,
        onChange: (checked) => this.handleAnimationsToggle(checked),
      }),
    });
    const autosaveToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.autosave'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.autosaveEnabled,
        onChange: (checked) => this.handleAutosaveToggle(checked),
      }),
    });
    const smartGuidesToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.alignmentGuides'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.smartGuidesEnabled,
        onChange: (checked) => this.handleSmartGuidesToggle(checked),
      }),
    });
    const guideOptionsSubmenuTrigger = createDropdownItem({
      label: this.i18n.t('canvasMenu.guideOptions'),
      trailing: this.createGuideOptionsTrailing(),
    });
    guideOptionsSubmenuTrigger.dataset.role = 'canvas-guide-options-trigger';
    const guideOptionsSubmenuPanel = createSurface({
      elevated: true,
      className: 'fixed hidden min-w-[15rem] overflow-hidden',
    });
    guideOptionsSubmenuPanel.dataset.role = 'canvas-guide-options-panel';
    guideOptionsSubmenuPanel.setAttribute('role', 'menu');
    guideOptionsSubmenuPanel.setAttribute(
      'aria-label',
      this.i18n.t('canvasMenu.guideOptions')
    );
    guideOptionsSubmenuPanel.append(
      createMenuHeader({
        title: this.i18n.t('canvasMenu.guideOptionsSectionTitle'),
      }),
      createMenuControlRow({
        control: createToggleSwitch({
          label: this.i18n.t('canvasMenu.spacingGuides'),
          labelClassName: '!font-normal',
          togglePosition: 'right',
          checked: this.spacingGuidesEnabled,
          disabled: !this.smartGuidesEnabled,
          onChange: (checked) => this.handleSpacingGuidesToggle(checked),
        }),
      }),
      createMenuControlRow({
        control: createToggleSwitch({
          label: this.i18n.t('canvasMenu.containerGuides'),
          labelClassName: '!font-normal',
          togglePosition: 'right',
          checked: this.containerGuidesEnabled,
          disabled: !this.smartGuidesEnabled,
          onChange: (checked) => this.handleContainerGuidesToggle(checked),
        }),
      }),
      createMenuControlRow({
        control: createToggleSwitch({
          label: this.i18n.t('canvasMenu.viewportCenterGuides'),
          labelClassName: '!font-normal',
          togglePosition: 'right',
          checked: this.viewportCenterGuidesEnabled,
          disabled: !this.smartGuidesEnabled,
          onChange: (checked) => this.handleViewportCenterGuidesToggle(checked),
        }),
      })
    );
    this.guideOptionsSubmenu = new Submenu({
      trigger: guideOptionsSubmenuTrigger,
      panel: guideOptionsSubmenuPanel,
      openMode: 'hover-or-click',
      placement: 'right-start',
      panelZIndex: 330,
    });
    const deleteCanvasButton = createDropdownItem({
      label: this.i18n.t('canvasMenu.deleteCanvas'),
      variant: 'danger',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDeleteRequested'));
      },
    });
    const duplicateCanvasButton = createDropdownItem({
      label: this.i18n.t('canvasMenu.duplicateCanvas'),
      variant: 'default',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDuplicateRequested'));
      },
    });
    const versionHistoryButton = createDropdownItem({
      label: this.i18n.t('canvasMenu.versionHistory'),
      variant: 'default',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasVersionHistoryRequested'));
      },
    });
    actions.append(
      animationsToggle,
      smartGuidesToggle,
      guideOptionsSubmenuTrigger,
      autosaveToggle,
      createDivider({ tone: 'soft' }),
      versionHistoryButton,
      duplicateCanvasButton,
      createDivider({ tone: 'soft' }),
      deleteCanvasButton
    );
    this.dropdownMenu.append(sectionTitle, actions);
    if (this.dropdownController.isOpen()) {
      this.dropdownController.reposition();
    }
  }

  private createGuideOptionsTrailing(): HTMLSpanElement {
    const trailing = document.createElement('span');
    trailing.className = 'ml-auto inline-flex items-center';
    const chevron = createIcon('chevron-right', {
      size: 14,
      strokeWidth: 1.9,
    });
    chevron.classList.add('shrink-0', 'text-slate-400');
    chevron.setAttribute('aria-hidden', 'true');
    trailing.appendChild(chevron);
    return trailing;
  }

  private destroyGuideOptionsSubmenu(): void {
    this.guideOptionsSubmenu?.destroy();
    this.guideOptionsSubmenu = null;
  }

  private toggleDropdown(): void {
    if (this.hidden) return;
    const willOpen = !this.dropdownController.isOpen();
    if (willOpen) {
      this.openDropdown();
      return;
    }
    this.dropdownController.close();
  }

  private setDropdownOpen(open: boolean): void {
    if (this.hidden) return;
    if (open) {
      this.openDropdown();
      return;
    }
    this.dropdownController.close();
  }

  private openDropdown(): void {
    openTopbarDropdown({
      controller: this.dropdownController,
      anchor: this.resolveDropdownAnchor(),
      align: 'end',
    });
  }

  private resolveDropdownAnchor(): HTMLElement {
    const surfaceAnchor = this.container.closest(
      '[data-component="HudSurface"]'
    );
    if (surfaceAnchor instanceof HTMLElement) {
      return surfaceAnchor;
    }
    return this.container;
  }

  private refreshTranslations(): void {
    this.menuButton.title = this.i18n.t('canvasMenu.openCanvasMenu');
    this.menuButton.setAttribute(
      'aria-label',
      this.i18n.t('canvasMenu.openCanvasMenu')
    );
    if (this.mounted) {
      this.renderDropdownContent();
    }
  }

  private handleAnimationsToggle(checked: boolean): void {
    if (this.animationsEnabled === checked) return;
    this.animationsEnabled = checked;
    this.animationsToggleHandler?.(this.animationsEnabled);
  }

  private handleAutosaveToggle(checked: boolean): void {
    if (this.autosaveEnabled === checked) return;
    this.autosaveEnabled = checked;
    CanvasClientStorage.setCanvasAutosaveEnabled(checked);
    emitCanvasAutosaveToggled(checked);
  }

  private handleSmartGuidesToggle(checked: boolean): void {
    if (this.smartGuidesEnabled === checked) return;
    this.smartGuidesEnabled = checked;
    CanvasClientStorage.setCanvasSmartGuidesEnabled(checked);
    this.smartGuidesToggleHandler?.(checked);
    if (this.mounted) {
      this.renderDropdownContent();
    }
  }

  private handleSpacingGuidesToggle(checked: boolean): void {
    if (this.spacingGuidesEnabled === checked) return;
    this.spacingGuidesEnabled = checked;
    CanvasClientStorage.setCanvasSpacingGuidesEnabled(checked);
    this.spacingGuidesToggleHandler?.(checked);
  }

  private handleContainerGuidesToggle(checked: boolean): void {
    if (this.containerGuidesEnabled === checked) return;
    this.containerGuidesEnabled = checked;
    CanvasClientStorage.setCanvasContainerGuidesEnabled(checked);
    this.containerGuidesToggleHandler?.(checked);
  }

  private handleViewportCenterGuidesToggle(checked: boolean): void {
    if (this.viewportCenterGuidesEnabled === checked) return;
    this.viewportCenterGuidesEnabled = checked;
    CanvasClientStorage.setCanvasViewportCenterGuidesEnabled(checked);
    this.viewportCenterGuidesToggleHandler?.(checked);
  }
}
