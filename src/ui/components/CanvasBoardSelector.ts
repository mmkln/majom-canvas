import {
  createHudIconButton,
  createHudTextButton,
  HudDropdown,
  createHudSurface,
} from '../primitives/index.ts';
import { HUD_INLINE_INPUT_CLASS } from '../primitives/hudClassNames.ts';
import { createIcon } from '../icons.ts';

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
  private isEditingTitle = false;
  private currentTitle = 'My Canvas';
  private canvases: CanvasItem[] = [];
  private activeCanvasId: string | null = null;
  private canvasListHandler: ((event: Event) => void) | null = null;
  private canvasTitleHandler: ((event: Event) => void) | null = null;
  private readonly dropdownController: HudDropdown;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'absolute left-4 top-4 z-20';

    this.header = createHudSurface({
      className: 'inline-flex items-center gap-1 px-2 py-1',
    });

    this.titleWrap = document.createElement('div');
    this.titleWrap.className = 'min-w-[120px]';

    this.titleText = createHudTextButton({
      tone: 'soft',
      text: this.currentTitle,
      title: 'Click to edit title',
      onClick: (event) => {
        event.stopPropagation();
        this.startTitleEdit();
      },
    });
    this.titleWrap.appendChild(this.titleText);

    this.toggleBtn = createHudIconButton({
      icon: 'chevron-down',
      title: 'Select canvas',
      onClick: (event) => {
        event.stopPropagation();
        this.dropdownController.toggle();
      },
    });

    this.header.append(this.titleWrap, this.toggleBtn);

    this.dropdown = createHudSurface({
      elevated: true,
      className: 'mt-1 hidden w-[260px] overflow-hidden',
    });

    const boardsHeader = document.createElement('div');
    boardsHeader.className =
      'px-4 pt-4 pb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400';
    boardsHeader.textContent = 'Boards';

    this.listWrap = document.createElement('div');
    this.listWrap.className = 'flex flex-col';

    this.emptyRow = document.createElement('div');
    this.emptyRow.className = 'px-4 py-3 text-sm text-slate-400';
    this.emptyRow.textContent = 'No boards yet';
    this.listWrap.appendChild(this.emptyRow);

    const divider = document.createElement('div');
    divider.className = 'mx-2 border-t border-slate-100';

    this.createBtn = document.createElement('button');
    this.createBtn.type = 'button';
    this.createBtn.className =
      'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50';
    this.createBtn.innerHTML =
      '<span class="inline-flex items-center gap-1"><span class="text-lg leading-none">+</span><span>New board</span></span>';
    this.createBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('canvasCreateRequested'));
      this.setDropdownOpen(false);
    });

    this.dropdown.append(boardsHeader, this.listWrap, divider, this.createBtn);
    this.container.append(this.header, this.dropdown);

    this.dropdownController = new HudDropdown({
      container: this.container,
      panel: this.dropdown,
      onOpenChange: (open) => {
        this.toggleBtn.classList.toggle('bg-indigo-50', open);
        this.toggleBtn.classList.toggle('text-indigo-700', open);
      },
    });
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
      const rawCanvases = customEvent.detail?.canvases;
      this.canvases = Array.isArray(rawCanvases)
        ? rawCanvases.map((canvas, index) => ({
          id:
            typeof canvas?.id === 'string' && canvas.id.length > 0
              ? canvas.id
              : `missing-id-${index}`,
          name:
            typeof canvas?.name === 'string' && canvas.name.trim().length > 0
              ? canvas.name
              : 'New canvas',
        }))
        : [];
      this.activeCanvasId = customEvent.detail?.activeId ?? null;
      this.renderCanvasList();
    };
    window.addEventListener('canvasListUpdated', this.canvasListHandler);
    this.dropdownController.mount();
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
    this.dropdownController.unmount();
    this.container.remove();
  }

  private setDropdownOpen(open: boolean): void {
    this.dropdownController.setOpen(open);
  }

  private startTitleEdit(): void {
    if (this.isEditingTitle) return;
    this.isEditingTitle = true;
    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.value = this.currentTitle;
    this.titleInput.className = HUD_INLINE_INPUT_CLASS;
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
      row.style.cssText = isActive
        ? 'background: #e9edff; color: #3b4fd9; font-weight: 500;'
        : 'color: #475569; font-weight: 400;';

      const label = document.createElement('span');
      label.className = 'truncate';
      label.textContent = canvas.name;
      row.appendChild(label);

      if (isActive) {
        row.appendChild(this.createCheckIcon());
      }

      row.addEventListener('click', () => {
        if (canvas.id.startsWith('missing-id-')) return;
        window.dispatchEvent(
          new CustomEvent('canvasSelected', {
            detail: { id: canvas.id, name: canvas.name },
          })
        );
        this.setDropdownOpen(false);
      });

      this.listWrap.appendChild(row);
    });
  }

  private createCheckIcon(): HTMLSpanElement {
    const check = document.createElement('span');
    check.className = 'ml-auto inline-flex items-center justify-center text-indigo-700';
    const icon = createIcon('check', { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    check.appendChild(icon);
    return check;
  }
}
