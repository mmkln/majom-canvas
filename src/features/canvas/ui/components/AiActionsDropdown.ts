import { createIcon, type IconName } from '../icons.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createSurface,
  createTextButton,
  setTextButtonState,
} from '../primitives/index.ts';

export type AiActionsDropdownItem = {
  id: string;
  label: string;
  icon: IconName;
  hint?: string;
  onSelect: () => void;
};

type AiActionsDropdownOptions = {
  triggerLabel?: string;
  openLabel?: string;
  unavailableLabel?: string;
};

export class AiActionsDropdown {
  public readonly element: HTMLDivElement;

  private readonly triggerBtn: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly menuController: AnchoredMenu;
  private readonly triggerLabel: string;
  private readonly openLabel: string;
  private readonly unavailableLabel: string;
  private items: AiActionsDropdownItem[] = [];

  constructor(options: AiActionsDropdownOptions = {}) {
    this.element = document.createElement('div');
    this.element.className = 'inline-flex items-center';
    this.triggerLabel = options.triggerLabel?.trim() || 'AI';
    this.openLabel = options.openLabel?.trim() || 'Open AI actions';
    this.unavailableLabel =
      options.unavailableLabel?.trim() || 'AI actions unavailable';

    this.triggerBtn = createTextButton({
      tone: 'text',
      size: 'sm',
      className:
        'inline-flex items-center justify-between gap-1.5 !rounded-md !px-2.5 !text-[12px]',
    });
    this.triggerBtn.setAttribute('aria-haspopup', 'menu');
    this.triggerBtn.setAttribute('aria-expanded', 'false');

    const triggerLeft = document.createElement('span');
    triggerLeft.className = 'inline-flex min-w-0 items-center gap-1.5';
    const label = document.createElement('span');
    label.className = 'truncate';
    label.textContent = this.triggerLabel;
    const leading = createIcon('chat-bubble-left', {
      size: 14,
      strokeWidth: 1.8,
    });
    leading.classList.add('shrink-0');
    leading.setAttribute('aria-hidden', 'true');
    triggerLeft.append(leading, label);

    const trailing = createIcon('chevron-down', {
      size: 14,
      strokeWidth: 1.9,
    });
    trailing.classList.add('shrink-0');
    trailing.setAttribute('aria-hidden', 'true');
    this.triggerBtn.append(triggerLeft, trailing);

    this.panel = createSurface({
      elevated: true,
      className:
        'fixed left-0 top-0 z-[120] hidden min-w-[196px] max-w-[240px] overflow-hidden !rounded-xl',
    });
    this.panel.setAttribute('role', 'menu');
    this.element.append(this.triggerBtn, this.panel);

    this.menuController = new AnchoredMenu({
      container: this.element,
      panel: this.panel,
      positioning: 'viewport',
      onOpenChange: (open) => {
        this.triggerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        this.triggerBtn.classList.toggle('bg-slate-100', open);
        this.triggerBtn.classList.toggle('text-slate-800', open);
        if (open) {
          this.renderOptions();
        }
      },
    });
    this.menuController.mount();

    this.triggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.items.length === 0) return;
      if (this.menuController.isOpen()) {
        this.menuController.close();
        return;
      }
      this.renderOptions();
      this.menuController.openAt({
        anchor: this.triggerBtn,
        placement: 'bottom-start',
        fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
        gap: 8,
        margin: 8,
      });
    });
    this.triggerBtn.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    this.triggerBtn.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    this.panel.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    this.panel.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    this.syncTriggerState();
  }

  public setItems(items: AiActionsDropdownItem[]): void {
    this.items = items;
    this.renderOptions();
    this.syncTriggerState();
    if (this.items.length === 0) {
      this.menuController.close();
      return;
    }
    if (this.menuController.isOpen()) {
      this.menuController.reposition();
    }
  }

  public close(): void {
    this.menuController.close();
  }

  public reposition(): void {
    this.menuController.reposition();
  }

  public destroy(): void {
    this.menuController.close();
    this.menuController.unmount();
    this.panel.remove();
  }

  private syncTriggerState(): void {
    setTextButtonState(this.triggerBtn, {
      disabled: this.items.length === 0,
    });
    const label =
      this.items.length > 0 ? this.openLabel : this.unavailableLabel;
    this.triggerBtn.title = label;
    this.triggerBtn.setAttribute('aria-label', label);
  }

  private renderOptions(): void {
    this.panel.innerHTML = '';
    this.items.forEach((item) => {
      const icon = createIcon(item.icon, {
        size: 14,
        strokeWidth: 1.8,
      });
      icon.classList.add('shrink-0', 'text-slate-500');
      icon.setAttribute('aria-hidden', 'true');

      const option = createDropdownItem({
        label: item.label,
        hint: item.hint,
        leading: icon,
        className: '!py-3.5 !text-[12px]',
        onClick: (event) => {
          event.stopPropagation();
          this.menuController.close();
          item.onSelect();
        },
      });
      option.setAttribute('role', 'menuitem');
      option.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      this.panel.appendChild(option);
    });
  }
}
