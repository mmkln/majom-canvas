import {
  createDivider,
  createDropdownItem,
  createInputBase,
  createIconButton,
  createSplitDropdownItem,
  createTextButton,
  Dropdown,
  createSurface,
} from '../primitives/index.ts';
import { createIcon } from '../icons.ts';

type CanvasItem = { id: string; name: string; isFavorite: boolean };

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
  private canvasFavoriteToggleFailedHandler: ((event: Event) => void) | null =
    null;
  private readonly dropdownController: Dropdown;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'absolute left-4 top-4 z-20';

    this.header = createSurface({
      className: 'inline-flex items-center gap-1 p-1.5',
    });

    this.titleWrap = document.createElement('div');

    this.titleText = createTextButton({
      tone: 'soft',
      text: this.currentTitle,
      title: 'Click to edit title',
      onClick: (event) => {
        event.stopPropagation();
        this.startTitleEdit();
      },
    });
    this.titleWrap.appendChild(this.titleText);

    this.toggleBtn = createIconButton({
      icon: 'chevron-down',
      title: 'Select canvas',
      onClick: (event) => {
        event.stopPropagation();
        this.dropdownController.toggle();
      },
    });

    this.header.append(this.titleWrap, this.toggleBtn);

    this.dropdown = createSurface({
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

    const divider = createDivider({
      tone: 'soft',
    });

    this.createBtn = createDropdownItem({
      label: 'New board',
      variant: 'accent-create',
      leading: this.createPlusIcon(),
      onClick: () => {
        window.dispatchEvent(new CustomEvent('canvasCreateRequested'));
        this.setDropdownOpen(false);
      },
    });

    this.dropdown.append(boardsHeader, this.listWrap, divider, this.createBtn);
    this.container.append(this.header, this.dropdown);

    this.dropdownController = new Dropdown({
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
        canvases?: Array<{
          id?: string;
          name?: string;
          isFavorite?: boolean;
        }>;
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
          isFavorite: canvas?.isFavorite === true,
        }))
        : [];
      this.activeCanvasId = customEvent.detail?.activeId ?? null;
      this.renderCanvasList();
    };
    window.addEventListener('canvasListUpdated', this.canvasListHandler);

    this.canvasFavoriteToggleFailedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string;
        previousIsFavorite?: boolean;
      }>;
      const id = customEvent.detail?.id;
      const previousIsFavorite = customEvent.detail?.previousIsFavorite;
      if (!id || typeof previousIsFavorite !== 'boolean') return;
      this.setCanvasFavorite(id, previousIsFavorite);
    };
    window.addEventListener(
      'canvasFavoriteToggleFailed',
      this.canvasFavoriteToggleFailedHandler
    );
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
    if (this.canvasFavoriteToggleFailedHandler) {
      window.removeEventListener(
        'canvasFavoriteToggleFailed',
        this.canvasFavoriteToggleFailedHandler
      );
      this.canvasFavoriteToggleFailedHandler = null;
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
    this.titleInput = createInputBase({
      variant: 'inline',
      value: this.currentTitle,
      type: 'text',
    });
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

    const sortedCanvases = this.canvases
      .map((canvas, index) => ({ canvas, index }))
      .sort((left, right) => {
        const favoriteOrder =
          Number(right.canvas.isFavorite) - Number(left.canvas.isFavorite);
        if (favoriteOrder !== 0) return favoriteOrder;
        return left.index - right.index;
      })
      .map((entry) => entry.canvas);

    sortedCanvases.forEach((canvas) => {
      const isActive = canvas.id === this.activeCanvasId;
      const isUnavailable = canvas.id.startsWith('missing-id-');
      const row = createSplitDropdownItem({
        label: canvas.name,
        variant: isActive ? 'selected' : 'default',
        tone: 'default',
        primaryTransparent: !isActive,
        trailing: isActive ? this.createCheckIcon() : null,
        className: 'min-w-0',
        disabled: isUnavailable,
        secondaryIcon: canvas.isFavorite ? 'star-solid' : 'star',
        secondaryLabel: canvas.isFavorite
          ? 'Remove from favourites'
          : 'Add to favourites',
        secondaryTone: canvas.isFavorite
          ? 'favorite-active'
          : 'favorite-inactive',
        secondaryPressed: canvas.isFavorite,
        secondaryDisabled: isUnavailable,
        onPrimaryClick: () => {
          if (isUnavailable) return;
          window.dispatchEvent(
            new CustomEvent('canvasSelected', {
              detail: { id: canvas.id, name: canvas.name },
            })
          );
          this.setDropdownOpen(false);
        },
        onSecondaryClick: () => {
          if (isUnavailable) return;
          this.handleFavoriteToggle(canvas);
        },
      });
      this.listWrap.appendChild(row);
    });
  }

  private createPlusIcon(): HTMLSpanElement {
    const plusWrap = document.createElement('span');
    plusWrap.className = 'inline-flex items-center justify-center text-indigo-600';
    const plus = createIcon('plus', { size: 14, strokeWidth: 2 });
    plus.setAttribute('aria-hidden', 'true');
    plusWrap.appendChild(plus);
    return plusWrap;
  }

  private createCheckIcon(): HTMLSpanElement {
    const check = document.createElement('span');
    check.className = 'ml-auto inline-flex items-center justify-center text-indigo-700';
    const icon = createIcon('check', { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    check.appendChild(icon);
    return check;
  }

  private handleFavoriteToggle(canvas: CanvasItem): void {
    const nextIsFavorite = !canvas.isFavorite;
    this.setCanvasFavorite(canvas.id, nextIsFavorite);
    window.dispatchEvent(
      new CustomEvent('canvasFavoriteToggled', {
        detail: {
          id: canvas.id,
          isFavorite: nextIsFavorite,
          previousIsFavorite: canvas.isFavorite,
        },
      })
    );
  }

  private setCanvasFavorite(id: string, isFavorite: boolean): void {
    let changed = false;
    this.canvases = this.canvases.map((canvas) => {
      if (canvas.id !== id) return canvas;
      if (canvas.isFavorite === isFavorite) return canvas;
      changed = true;
      return { ...canvas, isFavorite };
    });
    if (changed) {
      this.renderCanvasList();
    }
  }

}
