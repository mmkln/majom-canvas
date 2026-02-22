type CanvasItem = { id: string; name: string };

export class CanvasBoardSelector {
  private readonly container: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly titleWrap: HTMLDivElement;
  private readonly titleText: HTMLButtonElement;
  private titleInput: HTMLInputElement | null = null;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly dropdown: HTMLDivElement;
  private readonly listWrap: HTMLDivElement;
  private readonly createBtn: HTMLButtonElement;
  private readonly emptyRow: HTMLDivElement;
  private isDropdownOpen = false;
  private isEditingTitle = false;
  private currentTitle = 'My Canvas';
  private canvases: CanvasItem[] = [];
  private activeCanvasId: string | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private canvasListHandler: ((event: Event) => void) | null = null;
  private canvasTitleHandler: ((event: Event) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'absolute left-4 top-4 z-20';

    this.header = document.createElement('div');
    this.header.className =
      'inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white/95 px-2 py-1 shadow-sm';

    this.titleWrap = document.createElement('div');
    this.titleWrap.className = 'min-w-[120px]';

    this.titleText = document.createElement('button');
    this.titleText.type = 'button';
    this.titleText.className =
      'truncate rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50';
    this.titleText.textContent = this.currentTitle;
    this.titleText.title = 'Click to edit title';
    this.titleText.addEventListener('click', (event) => {
      event.stopPropagation();
      this.startTitleEdit();
    });
    this.titleWrap.appendChild(this.titleText);

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.type = 'button';
    this.toggleBtn.className =
      'rounded-lg p-2 text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600';
    this.toggleBtn.title = 'Select canvas';
    this.toggleBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    this.toggleBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setDropdownOpen(!this.isDropdownOpen);
    });

    this.header.append(this.titleWrap, this.toggleBtn);

    this.dropdown = document.createElement('div');
    this.dropdown.className =
      'mt-2 hidden w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl';
    this.dropdown.style.display = 'none';

    const boardsHeader = document.createElement('div');
    boardsHeader.className =
      'px-4 pt-4 pb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-400';
    boardsHeader.textContent = 'Boards';

    this.listWrap = document.createElement('div');

    this.emptyRow = document.createElement('div');
    this.emptyRow.className = 'px-3 py-2 text-sm text-gray-400';
    this.emptyRow.textContent = 'No boards yet';
    this.listWrap.appendChild(this.emptyRow);

    const divider = document.createElement('div');
    divider.className = 'border-t border-gray-100';

    this.createBtn = document.createElement('button');
    this.createBtn.type = 'button';
    this.createBtn.className =
      'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50';
    this.createBtn.innerHTML =
      '<span class="text-lg leading-none">+</span><span class="text-base">New board</span>';
    this.createBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('canvasCreateRequested'));
      this.setDropdownOpen(false);
    });

    this.dropdown.append(boardsHeader, this.listWrap, divider, this.createBtn);
    this.container.append(this.header, this.dropdown);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);

    this.canvasTitleHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ title?: string }>;
      const title = customEvent.detail?.title;
      if (typeof title !== 'string') return;
      this.currentTitle = title;
      if (this.titleInput) {
        this.titleInput.value = title;
      }
      this.titleText.textContent = title;
    };
    window.addEventListener('canvasTitleChanged', this.canvasTitleHandler);

    this.canvasListHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        canvases?: CanvasItem[];
        activeId?: string | null;
      }>;
      this.canvases = customEvent.detail?.canvases ?? [];
      this.activeCanvasId = customEvent.detail?.activeId ?? null;
      this.renderCanvasList();
    };
    window.addEventListener('canvasListUpdated', this.canvasListHandler);

    this.outsideHandler = (event: MouseEvent) => {
      if (!this.isDropdownOpen) return;
      const target = event.target as Node;
      if (!this.container.contains(target)) {
        this.setDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);
  }

  public unmount(): void {
    if (this.canvasTitleHandler) {
      window.removeEventListener('canvasTitleChanged', this.canvasTitleHandler);
      this.canvasTitleHandler = null;
    }
    if (this.canvasListHandler) {
      window.removeEventListener('canvasListUpdated', this.canvasListHandler);
      this.canvasListHandler = null;
    }
    if (this.outsideHandler) {
      window.removeEventListener('mousedown', this.outsideHandler);
      this.outsideHandler = null;
    }
    this.container.remove();
  }

  private setDropdownOpen(open: boolean): void {
    this.isDropdownOpen = open;
    this.dropdown.style.display = open ? 'block' : 'none';
    this.toggleBtn.style.color = open ? '#4f46e5' : '';
  }

  private startTitleEdit(): void {
    if (this.isEditingTitle) return;
    this.isEditingTitle = true;
    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.value = this.currentTitle;
    this.titleInput.className =
      'w-full rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-800 focus:border-indigo-300 focus:outline-none';
    this.titleWrap.replaceChild(this.titleInput, this.titleText);
    this.titleInput.focus();
    this.titleInput.select();

    const finishEdit = (apply: boolean): void => {
      if (!this.titleInput) return;
      const nextTitle = apply
        ? this.titleInput.value.trim() || 'New canvas'
        : this.currentTitle;
      this.currentTitle = nextTitle;
      this.titleText.textContent = nextTitle;
      this.titleWrap.replaceChild(this.titleText, this.titleInput);
      this.titleInput = null;
      this.isEditingTitle = false;
      if (apply) {
        window.dispatchEvent(
          new CustomEvent('canvasTitleEdited', { detail: { title: nextTitle } })
        );
      }
    };

    this.titleInput.addEventListener('blur', () => finishEdit(true));
    this.titleInput.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishEdit(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finishEdit(false);
      }
    });
  }

  private renderCanvasList(): void {
    this.listWrap.innerHTML = '';
    if (this.canvases.length === 0) {
      this.listWrap.appendChild(this.emptyRow);
      return;
    }

    this.canvases.forEach((canvas) => {
      const isActive = canvas.id === this.activeCanvasId;
      const row = document.createElement('button');
      row.type = 'button';
      row.className =
        'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-indigo-50';
      // row.style.color = isActive ? '#3b4fd9' : '#475569';
      // row.style.background = isActive ? '#e9edff' : 'transparent';
      // row.style.fontWeight = isActive ? '600' : '500';
      row.style.cssText = isActive ? 'background: #e9edff; color: #3b4fd9; font-weight: 500;' : 'color: #475569; font-weight: 400;';
      row.textContent = canvas.name;
      row.addEventListener('click', () => {
        window.dispatchEvent(
          new CustomEvent('canvasSelected', {
            detail: { id: canvas.id, name: canvas.name },
          })
        );
        this.setDropdownOpen(false);
      });

      if (isActive) {
        const check = document.createElement('span');
        check.className =
          'ml-3 inline-flex h-4 w-4 items-center justify-center rounded bg-indigo-600 text-[11px] text-white';
        check.textContent = '✓';
        row.appendChild(check);
      }

      this.listWrap.appendChild(row);
    });
  }
}
