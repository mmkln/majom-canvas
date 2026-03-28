import { createIcon, type IconName } from '../icons.ts';
import {
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
  private readonly triggerLabel: string;
  private readonly openLabel: string;
  private readonly unavailableLabel: string;
  private items: AiActionsDropdownItem[] = [];
  private open = false;

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
    document.body.appendChild(this.panel);
    this.element.append(this.triggerBtn);

    this.triggerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.items.length === 0) return;
      this.setOpen(!this.open);
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

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousedown', this.onDocumentMouseDown);
    window.addEventListener('keydown', this.onWindowKeyDown);
    this.syncTriggerState();
  }

  public setItems(items: AiActionsDropdownItem[]): void {
    this.items = items;
    this.renderOptions();
    this.syncTriggerState();
    if (this.items.length === 0) {
      this.setOpen(false);
      return;
    }
    if (this.open) {
      this.positionDropdown();
    }
  }

  public close(): void {
    this.setOpen(false);
  }

  public reposition(): void {
    if (!this.open) return;
    this.positionDropdown();
  }

  public destroy(): void {
    this.setOpen(false);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousedown', this.onDocumentMouseDown);
    window.removeEventListener('keydown', this.onWindowKeyDown);
    this.panel.remove();
  }

  private readonly onWindowResize = (): void => {
    if (!this.open) return;
    this.positionDropdown();
  };

  private readonly onDocumentMouseDown = (event: MouseEvent): void => {
    if (!this.open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.element.contains(target)) return;
    if (this.panel.contains(target)) return;
    this.setOpen(false);
  };

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.open) return;
    if (event.key !== 'Escape') return;
    this.setOpen(false);
  };

  private setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    this.panel.classList.toggle('hidden', !open);
    this.triggerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.triggerBtn.classList.toggle('bg-slate-100', open);
    this.triggerBtn.classList.toggle('text-slate-800', open);
    if (open) {
      this.positionDropdown();
    }
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
          this.setOpen(false);
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

  private positionDropdown(): void {
    const anchorGap = 8;
    const viewportPadding = 8;
    this.panel.style.maxHeight = '';
    this.panel.style.overflowY = 'hidden';

    const triggerRect = this.triggerBtn.getBoundingClientRect();
    const panelRect = this.panel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - panelWidth - viewportPadding
    );
    let left = triggerRect.left;
    if (left + panelWidth > window.innerWidth - viewportPadding) {
      left = triggerRect.right - panelWidth;
    }
    left = Math.min(Math.max(left, viewportPadding), maxLeft);

    const spaceBelow =
      window.innerHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;

    const openUpward = panelHeight > spaceBelow && spaceAbove > spaceBelow;
    let top = triggerRect.bottom + anchorGap;
    if (openUpward) {
      top = Math.max(
        viewportPadding,
        triggerRect.top - panelHeight - anchorGap
      );
    }

    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    if (panelHeight > availableSpace) {
      this.panel.style.maxHeight = `${Math.max(120, Math.floor(availableSpace))}px`;
      this.panel.style.overflowY = 'auto';
    }

    this.panel.style.left = `${Math.round(left)}px`;
    this.panel.style.top = `${Math.round(top)}px`;
  }
}
