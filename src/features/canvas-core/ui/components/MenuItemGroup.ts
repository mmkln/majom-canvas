import { createIcon } from '../icons.ts';

type MenuItemGroupOptions = {
  id: string;
  label: string;
  items: HTMLElement[];
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
};

export class MenuItemGroup {
  private readonly root: HTMLDivElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly chevronWrap: HTMLSpanElement;
  private readonly itemsWrap: HTMLDivElement;
  private expanded: boolean;
  private readonly onToggle?: (expanded: boolean) => void;

  constructor(options: MenuItemGroupOptions) {
    this.expanded = options.expanded ?? true;
    this.onToggle = options.onToggle;

    this.root = document.createElement('div');
    this.root.className = 'flex flex-col';

    this.chevronWrap = document.createElement('span');
    this.chevronWrap.className =
      'inline-flex items-center justify-center text-slate-500';
    this.renderChevron();

    this.toggleButton = document.createElement('button');
    this.toggleButton.type = 'button';
    this.toggleButton.className =
      'flex w-full items-center justify-between px-4 py-1.5 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:bg-indigo-50 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-inset';
    this.toggleButton.addEventListener('click', () => {
      this.setExpanded(!this.expanded);
      this.onToggle?.(this.expanded);
    });

    const label = document.createElement('span');
    label.className = 'truncate';
    label.textContent = options.label;
    this.toggleButton.append(label, this.chevronWrap);
    this.toggleButton.setAttribute('aria-expanded', this.expanded.toString());

    this.itemsWrap = document.createElement('div');
    this.itemsWrap.id = this.getItemsWrapId(options.id);
    this.itemsWrap.className = 'flex flex-col';
    this.toggleButton.setAttribute('aria-controls', this.itemsWrap.id);

    this.setItems(options.items);
    this.setExpanded(this.expanded);
    this.root.append(this.toggleButton, this.itemsWrap);
  }

  public getElement(): HTMLDivElement {
    return this.root;
  }

  public setItems(items: HTMLElement[]): void {
    this.itemsWrap.replaceChildren(...items);
  }

  public setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    this.itemsWrap.classList.toggle('hidden', !expanded);
    this.toggleButton.setAttribute('aria-expanded', expanded.toString());
    this.renderChevron();
  }

  private getItemsWrapId(id: string): string {
    return `canvas-menu-group-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  private renderChevron(): void {
    const icon = createIcon(this.expanded ? 'chevron-up' : 'chevron-down', {
      size: 14,
      strokeWidth: 2,
    });
    icon.setAttribute('aria-hidden', 'true');
    this.chevronWrap.replaceChildren(icon);
  }
}
