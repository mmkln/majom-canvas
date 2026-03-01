import {
  AnchoredMenu,
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
import type { HudOverlayCoordinator } from '../HudOverlayCoordinator.ts';
import { MobileBottomSheet } from '../MobileBottomSheet.ts';
import { MenuItemGroup } from './MenuItemGroup.ts';

type CanvasGroup = { id: string; name: string };
type CanvasItem = {
  id: string;
  name: string;
  isFavorite: boolean;
  group: CanvasGroup | null;
};

export type CanvasBoardSelectorLayoutMode = 'desktop' | 'mobile';

type CanvasBoardSelectorOptions = {
  layoutMode?: CanvasBoardSelectorLayoutMode;
  containerClassName?: string;
  overlayCoordinator?: HudOverlayCoordinator;
};

export class CanvasBoardSelector {
  private static readonly OVERLAY_OWNER_ID = 'canvas-board-selector';
  private static readonly GROUP_COLLAPSE_STORAGE_KEY =
    'canvas-board-selector-collapsed-groups-v1';
  private readonly hideSelectedCheckInCanvasItems = true;
  private readonly container: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly titleWrap: HTMLDivElement;
  private readonly titleText: HTMLButtonElement;
  private titleInput: HTMLInputElement | null = null;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly dropdown: HTMLDivElement;
  private readonly listWrap: HTMLDivElement;
  private readonly itemActionsMenu: HTMLDivElement;
  private readonly createBtn: HTMLButtonElement;
  private readonly emptyRow: HTMLDivElement;
  private isEditingTitle = false;
  private currentTitle = 'My Canvas';
  private canvases: CanvasItem[] = [];
  private activeCanvasId: string | null = null;
  private activeItemActionsCanvasId: string | null = null;
  private createGroupInputCanvasId: string | null = null;
  private createGroupInput: HTMLInputElement | null = null;
  private renameCanvasInputCanvasId: string | null = null;
  private renameCanvasInput: HTMLInputElement | null = null;
  private readonly groupExpandedState = new Map<string, boolean>();
  private canvasListHandler: ((event: Event) => void) | null = null;
  private canvasTitleHandler: ((event: Event) => void) | null = null;
  private canvasFavoriteToggleFailedHandler: ((event: Event) => void) | null =
    null;
  private canvasGroupUpdateFailedHandler: ((event: Event) => void) | null =
    null;
  private readonly dropdownController: Dropdown;
  private readonly itemActionsMenuController: AnchoredMenu;
  private layoutMode: CanvasBoardSelectorLayoutMode;
  private containerClassName: string;
  private readonly selectorSheet: MobileBottomSheet;
  private readonly detailsSheet: MobileBottomSheet;
  private readonly overlayCoordinator: HudOverlayCoordinator | null;

  constructor(options: CanvasBoardSelectorOptions = {}) {
    this.layoutMode = options.layoutMode ?? 'desktop';
    this.containerClassName = options.containerClassName ?? '';
    this.overlayCoordinator = options.overlayCoordinator ?? null;
    this.selectorSheet = new MobileBottomSheet('picker', 'CanvasBoardSelector');
    this.detailsSheet = new MobileBottomSheet('info', 'CanvasBoardSelector');
    this.container = document.createElement('div');
    this.container.className = this.resolveContainerClassName();

    this.header = createSurface({
      className: 'inline-flex items-center gap-1 p-1.5',
    });

    this.titleWrap = document.createElement('div');
    this.titleWrap.className = 'inline-flex items-center gap-1';

    const titleIconWrap = document.createElement('span');
    titleIconWrap.className =
      'inline-flex h-9 pl-1.5 items-center justify-center text-slate-400/70';
    const titleIcon = createIcon('map', { size: 22, strokeWidth: 1.8 });
    titleIcon.setAttribute('aria-hidden', 'true');
    titleIconWrap.appendChild(titleIcon);

    this.titleText = createTextButton({
      tone: 'soft',
      text: this.currentTitle,
      title: this.resolveTitleButtonTitle(),
      onClick: (event) => this.handleTitleClick(event),
    });
    this.titleWrap.append(titleIconWrap, this.titleText);

    this.toggleBtn = createIconButton({
      icon: 'chevron-down',
      title: 'Select canvas',
      onClick: (event) => {
        event.stopPropagation();
        this.setDropdownOpen(!this.isDropdownOpen());
      },
    });

    this.header.append(this.titleWrap, this.toggleBtn);

    this.dropdown = createSurface({
      elevated: true,
      className: this.resolveDropdownClassName(),
    });

    this.listWrap = document.createElement('div');
    this.listWrap.className = 'min-h-0 flex-1 overflow-y-auto overscroll-contain';

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

    this.itemActionsMenu = createSurface({
      elevated: true,
      className: this.resolveItemActionsMenuClassName(),
    });
    this.itemActionsMenu.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    this.dropdown.append(this.listWrap, divider, this.createBtn);
    this.container.append(this.header, this.dropdown, this.itemActionsMenu);
    this.itemActionsMenuController = new AnchoredMenu({
      container: this.container,
      panel: this.itemActionsMenu,
      onOpenChange: (open) => {
        if (!open) {
          this.resetItemActionsMenuState();
        }
      },
    });

    this.dropdownController = new Dropdown({
      container: this.container,
      panel: this.dropdown,
      onOpenChange: (open) => {
        if (this.layoutMode === 'mobile') return;
        this.toggleBtn.classList.toggle('bg-indigo-50', open);
        this.toggleBtn.classList.toggle('text-indigo-700', open);
        if (!open) {
          this.closeItemActionsMenu();
        }
      },
    });
    this.applyLayoutState();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.loadCollapsedGroupsFromStorage();

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
          groupId?: string | null;
          groupName?: string | null;
        }>;
        activeId?: string | null;
      }>;
      const rawCanvases = customEvent.detail?.canvases;
      const parsedCanvases = Array.isArray(rawCanvases)
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
            group: this.parseCanvasGroup({
              groupId: canvas?.groupId,
              groupName: canvas?.groupName,
            }),
          }))
        : [];
      this.canvases = parsedCanvases;
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

    this.canvasGroupUpdateFailedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string;
        previousGroupId?: string | null;
        previousGroupName?: string | null;
      }>;
      const id = customEvent.detail?.id;
      if (!id) return;
      this.updateItem(id, {
        groupId: customEvent.detail?.previousGroupId ?? null,
        groupName: customEvent.detail?.previousGroupName ?? null,
      });
    };
    window.addEventListener(
      'canvasGroupUpdateFailed',
      this.canvasGroupUpdateFailedHandler
    );
    this.itemActionsMenuController.mount();
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
    if (this.canvasGroupUpdateFailedHandler) {
      window.removeEventListener(
        'canvasGroupUpdateFailed',
        this.canvasGroupUpdateFailedHandler
      );
      this.canvasGroupUpdateFailedHandler = null;
    }
    this.closeItemActionsMenu();
    this.itemActionsMenuController.unmount();
    this.dropdownController.unmount();
    this.overlayCoordinator?.close(CanvasBoardSelector.OVERLAY_OWNER_ID);
    this.selectorSheet.close();
    this.detailsSheet.close();
    this.container.remove();
  }

  public setLayoutMode(mode: CanvasBoardSelectorLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.closeAllMobileOverlays();
    this.layoutMode = mode;
    this.setDropdownOpen(false);
    this.container.className = this.resolveContainerClassName();
    this.dropdown.className = this.resolveDropdownClassName();
    this.itemActionsMenu.className = this.resolveItemActionsMenuClassName();
    this.applyLayoutState();
  }

  public setContainerClassName(className: string): void {
    this.containerClassName = className.trim();
    this.container.className = this.resolveContainerClassName();
  }

  private setDropdownOpen(open: boolean): void {
    if (this.layoutMode === 'mobile') {
      if (open) {
        if (this.selectorSheet.isOpen()) return;
        this.closeItemActionsMenu();
        this.overlayCoordinator?.open({
          ownerId: CanvasBoardSelector.OVERLAY_OWNER_ID,
          kind: 'board-selector',
          onForceClose: () => this.closeAllMobileOverlays(),
        });
        this.selectorSheet.open({
          content: this.dropdown,
          ariaLabel: 'Canvas selector',
          zIndex: 240,
          onRequestClose: () => this.setDropdownOpen(false),
          containerClassName:
            'max-h-[min(82dvh,38rem)] px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        });
        this.toggleBtn.classList.add('bg-indigo-50', 'text-indigo-700');
        return;
      }
      if (!this.selectorSheet.isOpen()) return;
      this.selectorSheet.close();
      this.overlayCoordinator?.close(
        CanvasBoardSelector.OVERLAY_OWNER_ID,
        'board-selector'
      );
      this.toggleBtn.classList.remove('bg-indigo-50', 'text-indigo-700');
      return;
    }
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
    this.closeItemActionsMenu();
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

    const groupedCanvases = new Map<
      string,
      { id: string; name: string; canvases: CanvasItem[] }
    >();
    const ungroupedCanvases: CanvasItem[] = [];

    sortedCanvases.forEach((canvas) => {
      if (!canvas.group) {
        ungroupedCanvases.push(canvas);
        return;
      }
      const existingGroup = groupedCanvases.get(canvas.group.id);
      if (existingGroup) {
        existingGroup.canvases.push(canvas);
        return;
      }
      groupedCanvases.set(canvas.group.id, {
        id: canvas.group.id,
        name: canvas.group.name,
        canvases: [canvas],
      });
    });

    this.pruneGroupExpandedState(new Set(groupedCanvases.keys()));

    groupedCanvases.forEach((group) => {
      const groupRows = group.canvases.map((canvas) =>
        this.createCanvasRow(canvas)
      );
      const menuGroup = new MenuItemGroup({
        id: group.id,
        label: group.name,
        items: groupRows,
        expanded: this.groupExpandedState.get(group.id) ?? true,
        onToggle: (expanded) => {
          if (expanded) {
            this.groupExpandedState.delete(group.id);
          } else {
            this.groupExpandedState.set(group.id, false);
          }
          this.saveCollapsedGroupsToStorage();
        },
      });
      this.listWrap.appendChild(menuGroup.getElement());
    });

    ungroupedCanvases.forEach((canvas) => {
      this.listWrap.appendChild(this.createCanvasRow(canvas));
    });
  }

  private createCanvasRow(canvas: CanvasItem): HTMLDivElement {
    const isActive = canvas.id === this.activeCanvasId;
    const isUnavailable = canvas.id.startsWith('missing-id-');
    return createSplitDropdownItem({
      label: canvas.name,
      variant: isActive ? 'selected' : 'default',
      tone: 'default',
      primaryTransparent: !isActive,
      leading: this.createCanvasLeadingIcon(isActive),
      hideSelectedTrailing: this.hideSelectedCheckInCanvasItems,
      trailing: isActive ? this.createCheckIcon() : null,
      className: `min-w-0 ${canvas.group ? 'pl-6' : ''}`,
      disabled: isUnavailable,
      secondaryIcon: canvas.isFavorite ? 'star-solid' : 'star',
      secondaryLabel: canvas.isFavorite
        ? 'Remove from favourites'
        : 'Add to favourites',
      secondaryTone: canvas.isFavorite ? 'favorite-active' : 'favorite-inactive',
      secondaryPressed: canvas.isFavorite,
      secondaryDisabled: isUnavailable,
      secondaryRevealOnHover: !canvas.isFavorite,
      tertiaryIcon: 'ellipsis-vertical',
      tertiaryLabel: `Canvas actions for ${canvas.name}`,
      tertiaryDisabled: isUnavailable,
      tertiaryRevealOnHover: true,
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
      onTertiaryClick: (event, button) => {
        event.preventDefault();
        event.stopPropagation();
        if (isUnavailable) return;
        if (this.activeItemActionsCanvasId === canvas.id) {
          this.closeItemActionsMenu();
          return;
        }
        this.openItemActionsMenu(canvas, button);
      },
    });
  }

  private createPlusIcon(): HTMLSpanElement {
    const plusWrap = document.createElement('span');
    plusWrap.className =
      'inline-flex items-center justify-center text-indigo-600';
    const plus = createIcon('plus', { size: 14, strokeWidth: 2 });
    plus.setAttribute('aria-hidden', 'true');
    plusWrap.appendChild(plus);
    return plusWrap;
  }

  private createCheckIcon(): HTMLSpanElement {
    const check = document.createElement('span');
    check.className =
      'ml-auto inline-flex items-center justify-center text-indigo-700';
    const icon = createIcon('check', { size: 14, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    check.appendChild(icon);
    return check;
  }

  private createCanvasLeadingIcon(
    isActive: boolean,
  ): HTMLSpanElement {
    const wrap = document.createElement('span');
    const toneClass = isActive
        ? 'text-indigo-500'
        : 'text-slate-400/70';
    wrap.className = `inline-flex items-center justify-center ${toneClass}`;
    const icon = createIcon('map', { size: 18, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    return wrap;
  }

  private openItemActionsMenu(
    canvas: CanvasItem,
    anchorButton: HTMLButtonElement
  ): void {
    if (this.layoutMode === 'mobile') {
      this.setDropdownOpen(false);
      this.activeItemActionsCanvasId = canvas.id;
      this.createGroupInputCanvasId = null;
      this.createGroupInput = null;
      this.renameCanvasInputCanvasId = null;
      this.renameCanvasInput = null;
      this.renderItemActionsMenu(canvas);
      this.overlayCoordinator?.open({
        ownerId: CanvasBoardSelector.OVERLAY_OWNER_ID,
        kind: 'board-details',
        payload: { canvasId: canvas.id },
        onForceClose: () => this.closeAllMobileOverlays(),
      });
      this.itemActionsMenu.classList.remove('hidden');
      this.detailsSheet.open({
        content: this.itemActionsMenu,
        ariaLabel: 'Canvas details',
        zIndex: 241,
        onRequestClose: () => this.closeItemActionsMenu(),
        containerClassName:
          'max-h-[min(74dvh,30rem)] px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      });
      return;
    }

    this.activeItemActionsCanvasId = canvas.id;
    this.createGroupInputCanvasId = null;
    this.createGroupInput = null;
    this.renameCanvasInputCanvasId = null;
    this.renameCanvasInput = null;
    this.renderItemActionsMenu(canvas);
    this.itemActionsMenuController.openAt({
      anchor: anchorButton,
      placement: 'right-start',
      fallbackPlacements: ['left-start', 'right', 'left', 'bottom-end', 'top-end'],
      gap: 4,
      margin: 8,
      lockPlacementAfterOpen: true,
    });
  }

  private closeItemActionsMenu(): void {
    if (this.layoutMode === 'mobile') {
      this.resetItemActionsMenuState();
      this.detailsSheet.close();
      this.overlayCoordinator?.close(
        CanvasBoardSelector.OVERLAY_OWNER_ID,
        'board-details'
      );
      return;
    }
    this.resetItemActionsMenuState();
    this.itemActionsMenuController.close();
  }

  private resetItemActionsMenuState(): void {
    this.activeItemActionsCanvasId = null;
    this.createGroupInputCanvasId = null;
    this.createGroupInput = null;
    this.renameCanvasInputCanvasId = null;
    this.renameCanvasInput = null;
    this.itemActionsMenu.replaceChildren();
    this.itemActionsMenu.style.top = '';
    this.itemActionsMenu.style.left = '';
  }

  private renderItemActionsMenu(canvas: CanvasItem): void {
    this.itemActionsMenu.replaceChildren();

    if (this.renameCanvasInputCanvasId === canvas.id) {
      this.itemActionsMenu.appendChild(
        this.createRenameCanvasInputRow(canvas.id, canvas.name)
      );
    } else {
      const renameItem = createDropdownItem({
        label: 'Rename canvas',
        onClick: (event) => {
          event.stopPropagation();
          this.handleRenameCanvasRequest(canvas.id);
        },
      });
      this.itemActionsMenu.appendChild(renameItem);
    }

    this.itemActionsMenu.appendChild(createDivider({ tone: 'soft' }));

    const moveTargets = this.getUniqueGroups().filter(
      (group) => group.id !== canvas.group?.id
    );

    moveTargets.forEach((group) => {
      const item = createDropdownItem({
        label: `Move to ${group.name}`,
        onClick: (event) => {
          event.stopPropagation();
          this.applyGroupUpdate(canvas.id, {
            groupId: group.id,
            groupName: group.name,
          });
        },
      });
      this.itemActionsMenu.appendChild(item);
    });

    if (canvas.group) {
      const removeItem = createDropdownItem({
        label: 'Remove from group',
        onClick: (event) => {
          event.stopPropagation();
          this.applyGroupUpdate(canvas.id, {
            groupId: null,
            groupName: null,
          });
        },
      });
      this.itemActionsMenu.appendChild(removeItem);
    }

    if (this.createGroupInputCanvasId === canvas.id) {
      this.itemActionsMenu.appendChild(this.createNewGroupInputRow(canvas.id));
    } else {
      const newGroupItem = createDropdownItem({
        label: 'Create group',
        onClick: (event) => {
          event.stopPropagation();
          this.handleCreateGroupRequest(canvas.id);
        },
      });
      this.itemActionsMenu.appendChild(newGroupItem);
    }

    this.itemActionsMenu.appendChild(createDivider({ tone: 'soft' }));

    const deleteItem = createDropdownItem({
      label: 'Delete canvas',
      variant: 'danger',
      onClick: (event) => {
        event.stopPropagation();
        window.dispatchEvent(
          new CustomEvent('canvasDeleteRequested', {
            detail: { id: canvas.id },
          })
        );
        this.closeItemActionsMenu();
      },
    });
    this.itemActionsMenu.appendChild(deleteItem);
  }

  private getUniqueGroups(): CanvasGroup[] {
    const groups = new Map<string, CanvasGroup>();
    this.canvases.forEach((canvas) => {
      if (!canvas.group) return;
      if (!groups.has(canvas.group.id)) {
        groups.set(canvas.group.id, canvas.group);
      }
    });
    return Array.from(groups.values());
  }

  private handleCreateGroupRequest(canvasId: string): void {
    this.renameCanvasInputCanvasId = null;
    this.renameCanvasInput = null;
    this.createGroupInputCanvasId = canvasId;
    const canvas = this.canvases.find((item) => item.id === canvasId);
    if (!canvas) {
      this.closeItemActionsMenu();
      return;
    }
    this.renderItemActionsMenu(canvas);
    this.repositionItemActionsMenu();
  }

  private handleRenameCanvasRequest(canvasId: string): void {
    this.createGroupInputCanvasId = null;
    this.createGroupInput = null;
    this.renameCanvasInputCanvasId = canvasId;
    const canvas = this.canvases.find((item) => item.id === canvasId);
    if (!canvas) {
      this.closeItemActionsMenu();
      return;
    }
    this.renderItemActionsMenu(canvas);
    this.repositionItemActionsMenu();
  }

  private createNewGroupInputRow(canvasId: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'px-3 py-2';

    const input = createInputBase({
      variant: 'inline',
      value: '',
      type: 'text',
    });
    input.placeholder = 'New group name';
    input.classList.add('w-full');
    row.appendChild(input);
    this.createGroupInput = input;

    const finishEdit = (apply: boolean): void => {
      if (this.createGroupInput !== input) return;
      const name = apply ? input.value.trim() : '';
      this.createGroupInput = null;
      this.createGroupInputCanvasId = null;

      if (name.length > 0) {
        const existingGroup = this.getUniqueGroups().find(
          (group) => group.name.toLowerCase() === name.toLowerCase()
        );
        const targetGroup = existingGroup ?? {
          id: this.generateGroupId(name),
          name,
        };
        this.applyGroupUpdate(canvasId, {
          groupId: targetGroup.id,
          groupName: targetGroup.name,
        });
        return;
      }

      const canvas = this.canvases.find((item) => item.id === canvasId);
      if (!canvas || this.activeItemActionsCanvasId !== canvasId) {
        this.closeItemActionsMenu();
        return;
      }
      this.renderItemActionsMenu(canvas);
      this.repositionItemActionsMenu();
    };

    input.addEventListener('blur', () => finishEdit(true));
    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishEdit(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finishEdit(false);
      }
    });

    window.setTimeout(() => {
      if (this.createGroupInput !== input) return;
      input.focus();
      input.select();
    }, 0);

    return row;
  }

  private createRenameCanvasInputRow(
    canvasId: string,
    currentName: string
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'px-3 py-2';

    const input = createInputBase({
      variant: 'inline',
      value: currentName,
      type: 'text',
    });
    input.placeholder = 'Canvas name';
    input.classList.add('w-full');
    row.appendChild(input);
    this.renameCanvasInput = input;

    const finishEdit = (apply: boolean): void => {
      if (this.renameCanvasInput !== input) return;
      const nextName = apply ? input.value.trim() : '';
      const previousName = currentName.trim();
      this.renameCanvasInput = null;
      this.renameCanvasInputCanvasId = null;

      if (nextName.length > 0 && nextName !== previousName) {
        window.dispatchEvent(
          new CustomEvent('canvasRenameRequested', {
            detail: {
              id: canvasId,
              name: nextName,
            },
          })
        );
        this.closeItemActionsMenu();
        return;
      }

      const canvas = this.canvases.find((item) => item.id === canvasId);
      if (!canvas || this.activeItemActionsCanvasId !== canvasId) {
        this.closeItemActionsMenu();
        return;
      }
      this.renderItemActionsMenu(canvas);
      this.repositionItemActionsMenu();
    };

    input.addEventListener('blur', () => finishEdit(true));
    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishEdit(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finishEdit(false);
      }
    });

    window.setTimeout(() => {
      if (this.renameCanvasInput !== input) return;
      input.focus();
      input.select();
    }, 0);

    return row;
  }

  private generateGroupId(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const base = normalized || 'group';
    const taken = new Set(this.getUniqueGroups().map((group) => group.id));
    if (!taken.has(base)) return base;
    let counter = 2;
    let candidate = `${base}-${counter}`;
    while (taken.has(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }
    return candidate;
  }

  private applyGroupUpdate(
    id: string,
    nextGroup: { groupId: string | null; groupName: string | null }
  ): void {
    const currentCanvas = this.canvases.find((canvas) => canvas.id === id);
    if (!currentCanvas) {
      this.closeItemActionsMenu();
      return;
    }

    const previousGroup = currentCanvas.group;
    const previousGroupId = previousGroup?.id ?? null;
    const previousGroupName = previousGroup?.name ?? null;
    const parsedGroup = this.parseCanvasGroup(nextGroup);
    if (
      previousGroupId === (parsedGroup?.id ?? null) &&
      previousGroupName === (parsedGroup?.name ?? null)
    ) {
      this.closeItemActionsMenu();
      return;
    }

    this.updateItem(id, nextGroup);
    this.closeItemActionsMenu();
    window.dispatchEvent(
      new CustomEvent('canvasGroupUpdated', {
        detail: {
          id,
          groupId: parsedGroup?.id ?? null,
          groupName: parsedGroup?.name ?? null,
          previousGroupId,
          previousGroupName,
        },
      })
    );
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

  private updateItem(
    id: string,
    updates: { groupId: string | null; groupName: string | null }
  ): void {
    const group = this.parseCanvasGroup(updates);
    let changed = false;
    this.canvases = this.canvases.map((canvas) => {
      if (canvas.id !== id) return canvas;
      const currentGroupId = canvas.group?.id ?? null;
      const currentGroupName = canvas.group?.name ?? null;
      const nextGroupId = group?.id ?? null;
      const nextGroupName = group?.name ?? null;
      if (currentGroupId === nextGroupId && currentGroupName === nextGroupName) {
        return canvas;
      }
      changed = true;
      return {
        ...canvas,
        group,
      };
    });
    if (changed) {
      this.renderCanvasList();
    }
  }

  private parseCanvasGroup(input: {
    groupId?: string | null;
    groupName?: string | null;
  }): CanvasGroup | null {
    const groupId =
      typeof input.groupId === 'string' ? input.groupId.trim() : '';
    const groupName =
      typeof input.groupName === 'string' ? input.groupName.trim() : '';
    if (!groupId && !groupName) return null;
    return {
      id: groupId || groupName,
      name: groupName || groupId,
    };
  }

  private loadCollapsedGroupsFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(
        CanvasBoardSelector.GROUP_COLLAPSE_STORAGE_KEY
      );
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      this.groupExpandedState.clear();
      parsed.forEach((id) => {
        if (typeof id !== 'string') return;
        const trimmedId = id.trim();
        if (!trimmedId) return;
        this.groupExpandedState.set(trimmedId, false);
      });
    } catch (error) {
      console.warn('Failed to restore collapsed groups from localStorage', error);
    }
  }

  private saveCollapsedGroupsToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const collapsedGroupIds = Array.from(this.groupExpandedState.entries())
        .filter(([, expanded]) => expanded === false)
        .map(([id]) => id);
      if (collapsedGroupIds.length === 0) {
        window.localStorage.removeItem(
          CanvasBoardSelector.GROUP_COLLAPSE_STORAGE_KEY
        );
        return;
      }
      window.localStorage.setItem(
        CanvasBoardSelector.GROUP_COLLAPSE_STORAGE_KEY,
        JSON.stringify(collapsedGroupIds)
      );
    } catch (error) {
      console.warn('Failed to persist collapsed groups to localStorage', error);
    }
  }

  private pruneGroupExpandedState(validGroupIds: Set<string>): void {
    let changed = false;
    Array.from(this.groupExpandedState.keys()).forEach((groupId) => {
      if (validGroupIds.has(groupId)) return;
      this.groupExpandedState.delete(groupId);
      changed = true;
    });
    if (changed) {
      this.saveCollapsedGroupsToStorage();
    }
  }

  private resolveContainerClassName(): string {
    if (this.containerClassName.length > 0) {
      return this.containerClassName;
    }
    return this.layoutMode === 'mobile'
      ? 'relative'
      : 'absolute left-4 top-4 z-20';
  }

  private resolveDropdownClassName(): string {
    if (this.layoutMode === 'mobile') {
      return 'hidden flex min-h-0 w-full flex-col overflow-hidden p-0';
    }
    return 'mt-1 hidden grid max-h-[70vh] w-[300px] grid-rows-[minmax(0,1fr)_auto_auto] overflow-hidden';
  }

  private resolveItemActionsMenuClassName(): string {
    if (this.layoutMode === 'mobile') {
      return 'hidden w-full overflow-y-auto p-0';
    }
    return 'absolute left-0 top-0 z-40 hidden min-w-[220px] overflow-hidden';
  }

  private applyLayoutState(): void {
    const mobileClasses = [
      'border-transparent',
      'bg-transparent',
      'shadow-none',
      'backdrop-blur-0',
      'rounded-none',
      'p-0',
    ];
    this.header.classList.toggle('gap-2', this.layoutMode === 'mobile');
    mobileClasses.forEach((className) => {
      this.header.classList.toggle(className, this.layoutMode === 'mobile');
      this.dropdown.classList.toggle(className, this.layoutMode === 'mobile');
      this.itemActionsMenu.classList.toggle(
        className,
        this.layoutMode === 'mobile'
      );
    });
    this.titleText.classList.toggle(
      'max-w-[min(48vw,14rem)]',
      this.layoutMode === 'mobile'
    );
    this.titleText.classList.toggle('truncate', this.layoutMode === 'mobile');
    this.titleText.title = this.resolveTitleButtonTitle();
    this.titleText.setAttribute('aria-label', this.resolveTitleButtonTitle());
  }

  private handleTitleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.layoutMode === 'mobile') {
      this.setDropdownOpen(!this.isDropdownOpen());
      return;
    }
    this.startTitleEdit();
  }

  private resolveTitleButtonTitle(): string {
    return this.layoutMode === 'mobile'
      ? 'Select canvas'
      : 'Click to edit title';
  }

  private closeAllMobileOverlays(): void {
    this.setDropdownOpen(false);
    this.closeItemActionsMenu();
  }

  private isDropdownOpen(): boolean {
    return this.layoutMode === 'mobile'
      ? this.selectorSheet.isOpen()
      : this.dropdownController.isOpen();
  }

  private repositionItemActionsMenu(): void {
    if (this.layoutMode === 'mobile') return;
    this.itemActionsMenuController.reposition();
  }

}
