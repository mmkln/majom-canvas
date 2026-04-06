import {
  AnchoredMenu,
  createDropdownItem,
  createSurface,
} from '../hud/index.ts';
import {
  HUD_SELECTION_PANEL_CLASS,
  HUD_SELECTION_STATE_ROW_CLASS,
  HUD_SELECTION_STATE_ROW_ERROR_CLASS,
  HUD_SELECTION_TRIGGER_CLASS,
  HUD_SELECTION_TRIGGER_MD_CLASS,
  HUD_SELECTION_TRIGGER_SM_CLASS,
} from '../hud/classNames.ts';
import { createIcon } from '../hud/icons.ts';

type DropdownSelectBaseOptions<T> = {
  size?: 'sm' | 'md';
  value?: T | null;
  placeholder: string;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  portalTarget?: HTMLElement;
  renderTriggerLeading?: (item: T | null) => HTMLElement | null;
  renderTriggerTrailing?: (item: T | null) => HTMLElement | null;
  renderOptionLeading?: (item: T) => HTMLElement | null;
  renderOptionTrailing?: (item: T, selected: boolean) => HTMLElement | null;
  onOpenChange?: (open: boolean) => void;
};

type DropdownStateMessageTone = 'default' | 'error';

const TRIGGER_CLASS_BY_SIZE = {
  sm: HUD_SELECTION_TRIGGER_SM_CLASS,
  md: HUD_SELECTION_TRIGGER_MD_CLASS,
} as const;

export class DropdownSelectBase<T> {
  public readonly element: HTMLDivElement;
  public readonly contentElement: HTMLDivElement;

  private readonly trigger: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly controller: AnchoredMenu;
  private selected: T | null;
  private items: T[] = [];
  private stateMessage: { message: string; tone: DropdownStateMessageTone } | null =
    null;

  constructor(private readonly options: DropdownSelectBaseOptions<T>) {
    this.selected = options.value ?? null;

    this.element = document.createElement('div');
    this.element.className = ['relative', options.className ?? '']
      .filter(Boolean)
      .join(' ');

    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = [
      HUD_SELECTION_TRIGGER_CLASS,
      TRIGGER_CLASS_BY_SIZE[options.size ?? 'md'],
    ].join(' ');
    this.trigger.setAttribute('aria-expanded', 'false');
    if (options.ariaLabel) {
      this.trigger.setAttribute('aria-label', options.ariaLabel);
    }
    this.trigger.disabled = options.disabled ?? false;

    this.panel = createSurface({
      elevated: true,
      className: `absolute left-0 top-0 z-40 hidden min-w-[260px] ${HUD_SELECTION_PANEL_CLASS}`,
    });
    this.panel.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    this.contentElement = document.createElement('div');
    this.panel.appendChild(this.contentElement);

    this.controller = new AnchoredMenu({
      container: this.trigger,
      panel: this.panel,
      positioning: 'viewport',
      portalTarget: options.portalTarget,
      onOpenChange: (open) => {
        this.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        this.renderTrigger();
        this.options.onOpenChange?.(open);
      },
    });
    this.controller.mount();

    this.trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.controller.isOpen()) {
        this.controller.close();
        return;
      }
      this.controller.openAt({
        anchor: this.trigger,
        placement: 'bottom-start',
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        gap: 8,
        margin: 12,
        matchAnchorWidth: true,
        lockPlacementAfterOpen: true,
      });
      this.render();
    });

    this.element.append(this.trigger, this.panel);
    this.render();
  }

  public setSelected(value: T | null): void {
    this.selected = value;
    this.render();
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.trigger.disabled = disabled;
  }

  public setItems(items: T[]): void {
    this.items = items;
    this.render();
  }

  public setStateMessage(
    message: string | null,
    tone: DropdownStateMessageTone = 'default'
  ): void {
    this.stateMessage = message ? { message, tone } : null;
    this.render();
  }

  public setPanelHeader(header: HTMLElement | null): void {
    this.panel.innerHTML = '';
    if (header) {
      this.panel.appendChild(header);
    }
    this.panel.appendChild(this.contentElement);
    this.render();
  }

  public destroy(): void {
    this.controller.close();
    this.controller.unmount();
  }

  private render(): void {
    this.renderTrigger();
    this.renderContent();
  }

  private renderTrigger(): void {
    this.trigger.innerHTML = '';

    const leading = this.options.renderTriggerLeading?.(this.selected) ?? null;
    if (leading) this.trigger.appendChild(leading);

    const label = document.createElement('div');
    label.className = this.selected
      ? 'min-w-0 flex-1 truncate text-sm font-medium text-slate-800'
      : 'min-w-0 flex-1 truncate text-sm text-slate-500';
    label.textContent = this.selected
      ? this.options.getLabel(this.selected)
      : this.options.placeholder;

    const chevron = createIcon(
      this.controller.isOpen() ? 'chevron-up' : 'chevron-down',
      {
        size: 16,
        strokeWidth: 1.9,
      }
    );
    chevron.className.baseVal = 'shrink-0 text-slate-400';
    chevron.setAttribute('aria-hidden', 'true');

    const triggerTrailing =
      this.options.renderTriggerTrailing?.(this.selected) ?? null;
    if (triggerTrailing) {
      triggerTrailing.classList.add('ml-auto');
    }

    this.trigger.append(label);
    if (triggerTrailing) {
      this.trigger.appendChild(triggerTrailing);
    } else {
      chevron.classList.add('ml-auto');
    }
    this.trigger.appendChild(chevron);
  }

  private renderContent(): void {
    this.contentElement.innerHTML = '';
    const visibleItems = this.items;

    if (visibleItems.length === 0) {
      if (!this.stateMessage) return;
      this.contentElement.appendChild(
        this.stateMessage.tone === 'error'
          ? this.createErrorRow(this.stateMessage.message)
          : this.createStateRow(this.stateMessage.message)
      );
      return;
    }

    visibleItems.forEach((item) => {
      const selected = this.options.getKey(item) === this.getSelectedKey();
      const row = createDropdownItem({
        label: this.options.getLabel(item),
        leading: this.options.renderOptionLeading?.(item) ?? null,
        trailing:
          this.options.renderOptionTrailing?.(item, selected) ?? null,
        active: selected,
        onClick: (event) => {
          event.stopPropagation();
          if (selected) {
            this.controller.close();
            this.render();
            return;
          }
          this.selected = item;
          this.options.onSelect(item);
          this.controller.close();
          this.render();
        },
      });
      row.classList.add('w-full', '!rounded-none');
      row.setAttribute(
        'data-dropdown-select-item',
        this.options.getKey(item)
      );
      this.contentElement.appendChild(row);
    });
  }

  private getSelectedKey(): string | null {
    return this.selected ? this.options.getKey(this.selected) : null;
  }

  private createStateRow(message: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = HUD_SELECTION_STATE_ROW_CLASS;
    row.textContent = message;
    return row;
  }

  private createErrorRow(message: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = HUD_SELECTION_STATE_ROW_ERROR_CLASS;
    row.textContent = message;
    return row;
  }
}
