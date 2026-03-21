type GlobalChatPanelOptions = {
  widthPx?: number;
};

export class GlobalChatPanel {
  private readonly container: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly widthPx: number;

  constructor(options: GlobalChatPanelOptions = {}) {
    this.widthPx = options.widthPx ?? 380;
    this.container = document.createElement('aside');
    this.container.id = 'workspace-chat-panel';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.right = '0';
    this.container.style.bottom = '0';
    this.container.style.width = `${this.widthPx}px`;
    this.container.style.zIndex = '38';
    this.container.style.borderLeft = '1px solid rgba(148, 163, 184, 0.4)';
    this.container.style.background = '#ffffff';
    this.container.style.display = 'none';
    this.container.style.boxShadow = '-8px 0 22px rgba(15, 23, 42, 0.08)';

    this.panel = document.createElement('div');
    this.panel.style.height = '100%';
    this.panel.style.display = 'flex';
    this.panel.style.flexDirection = 'column';
    this.panel.style.fontFamily = 'Poppins, sans-serif';

    const header = document.createElement('div');
    header.style.padding = '14px 16px';
    header.style.borderBottom = '1px solid rgba(226, 232, 240, 0.9)';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    const title = document.createElement('h2');
    title.textContent = 'AI Chat';
    title.style.fontSize = '14px';
    title.style.fontWeight = '700';
    title.style.color = '#0f172a';
    title.style.margin = '0';

    const status = document.createElement('span');
    status.textContent = 'Global';
    status.style.fontSize = '11px';
    status.style.fontWeight = '600';
    status.style.padding = '2px 8px';
    status.style.borderRadius = '999px';
    status.style.background = '#e2e8f0';
    status.style.color = '#334155';

    const body = document.createElement('div');
    body.style.flex = '1';
    body.style.padding = '18px 16px';
    body.style.display = 'flex';
    body.style.alignItems = 'flex-start';
    body.style.justifyContent = 'center';
    body.style.color = '#475569';
    body.style.fontSize = '13px';
    body.textContent =
      'Chat host is ready. Next step: connect provider + contextual actions.';

    header.append(title, status);
    this.panel.append(header, body);
    this.container.appendChild(this.panel);
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }

  public getWidthPx(): number {
    return this.widthPx;
  }
}
