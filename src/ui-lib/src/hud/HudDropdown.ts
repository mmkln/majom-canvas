import { FloatingMenuController } from './FloatingMenuController.ts';

type HudDropdownOptions = {
  container: HTMLElement;
  panel: HTMLElement;
  onOpenChange?: (open: boolean) => void;
};

export class HudDropdown {
  private readonly container: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly onOpenChange?: (open: boolean) => void;
  private readonly menuController: FloatingMenuController;
  private open: boolean;

  constructor(options: HudDropdownOptions) {
    this.container = options.container;
    this.panel = options.panel;
    this.container.setAttribute('data-component', 'HudDropdown');
    this.panel.setAttribute('data-component', 'HudDropdownPanel');
    this.onOpenChange = options.onOpenChange;
    this.open = !this.panel.classList.contains('hidden');

    this.menuController = new FloatingMenuController({
      isOpen: () => this.open,
      setOpen: (open) => this.setOpen(open),
      containsTarget: (target) => this.container.contains(target),
    });
  }

  public mount(): void {
    this.menuController.mount();
  }

  public unmount(): void {
    this.menuController.unmount();
  }

  public isOpen(): boolean {
    return this.open;
  }

  public toggle(): void {
    this.setOpen(!this.open);
  }

  public setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    this.panel.classList.toggle('hidden', !open);
    this.onOpenChange?.(open);
  }
}
