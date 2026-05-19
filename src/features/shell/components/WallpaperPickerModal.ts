import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import {
  createBadge,
  createFormMessage,
  createInput,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../../ui-lib/src/hud/icons.ts';
import type { I18nService } from '../../../i18n/index.ts';
import type { Wallpaper } from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { resolveWallpaperUrl } from '../services/WallpaperService.ts';

type WallpaperPickerModalOptions = {
  i18n: Pick<I18nService, 't'>;
  wallpapers: Wallpaper[];
  currentWallpaperId?: string | number | null;
  selectedWallpaperId?: string | number | null;
  onUploadWallpaper?: (file: File) => Promise<Wallpaper>;
};

function normalizeWallpaperId(
  value: string | number | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function getWallpaperDisplayName(wallpaper: Wallpaper): string {
  const raw =
    wallpaper.image_file
      ?.split('/')
      .pop()
      ?.replace(/\.[a-z0-9]+$/i, '')
      .trim() ?? '';
  const cleaned = raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (
    cleaned.length >= 3 &&
    cleaned.length <= 36 &&
    !/^[0-9a-f-]{8,}$/i.test(cleaned)
  ) {
    return cleaned.replace(/\b\w/g, (match) => match.toUpperCase());
  }
  return `Wallpaper ${wallpaper.id}`;
}

function getWallpaperSearchText(wallpaper: Wallpaper): string {
  return [
    getWallpaperDisplayName(wallpaper),
    wallpaper.image_file ?? '',
    String(wallpaper.id),
  ]
    .join(' ')
    .toLowerCase();
}

function findWallpaperById(
  wallpapers: Wallpaper[],
  wallpaperId: string | null
): Wallpaper | null {
  if (!wallpaperId) return null;
  return wallpapers.find((item) => String(item.id) === wallpaperId) ?? null;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function upsertWallpaper(list: Wallpaper[], wallpaper: Wallpaper): Wallpaper[] {
  const nextList = list.filter((item) => item.id !== wallpaper.id);
  nextList.push(wallpaper);
  return nextList;
}

export function openWallpaperPickerModal(
  options: WallpaperPickerModalOptions
): Promise<string | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(
      normalizeWallpaperId(
        options.selectedWallpaperId ?? options.currentWallpaperId
      )
    );
  }

  return new Promise((resolve) => {
    const currentWallpaperId = normalizeWallpaperId(options.currentWallpaperId);
    let wallpapers = [...options.wallpapers];
    let selectedWallpaperId = normalizeWallpaperId(
      options.selectedWallpaperId ?? options.currentWallpaperId
    );
    let searchTerm = '';
    let uploadState: {
      uploading: boolean;
      error: string | null;
    } = {
      uploading: false,
      error: null,
    };
    let settled = false;

    const settle = (value: string | null): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const close = (): void => {
      overlay.remove();
    };

    const { overlay, container, header, body, footer } = createModalShell(
      options.i18n.t('profileSettings.appearance.pickerTitle'),
      {
        subtitle: options.i18n.t('profileSettings.appearance.pickerSubtitle'),
        onClose: () => {
          settle(null);
          close();
        },
        intent: 'form',
        zIndex: 300,
      }
    );

    container.style.width = 'min(72rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(72rem, calc(100vw - 2rem))';
    const subtitle = header.querySelector('p');
    if (subtitle instanceof HTMLParagraphElement) {
      subtitle.style.maxWidth = '38rem';
    }

    const layout = document.createElement('div');
    layout.className =
      'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start';

    const previewColumn = document.createElement('section');
    previewColumn.className = 'min-w-0';

    const browserColumn = document.createElement('section');
    browserColumn.className = 'min-w-0';

    const searchControl = createInput({
      type: 'search',
      placeholder: options.i18n.t(
        'profileSettings.appearance.searchPlaceholder'
      ),
      leadingIcon: 'magnifying-glass',
      inputClassName:
        'border-transparent bg-white/88 shadow-none hover:border-transparent hover:bg-white focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-indigo-200',
      value: searchTerm,
      onInput: (value) => {
        searchTerm = value;
        renderBrowser();
      },
    });
    searchControl.element.dataset.role = 'wallpaper-picker-search';

    const meta = document.createElement('div');
    meta.className = 'mt-2 text-[12px] leading-4 text-slate-500';

    const uploadMessageHost = document.createElement('div');
    uploadMessageHost.className = 'mt-2';

    const browserSurface = document.createElement('div');
    browserSurface.className =
      'rounded-[1.35rem] bg-slate-50/72 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]';

    const gridHost = document.createElement('div');
    gridHost.className =
      'mt-3 max-h-[min(48vh,32rem)] overflow-y-auto pr-1 sm:max-h-[min(52vh,34rem)]';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';
    fileInput.dataset.role = 'wallpaper-picker-upload-input';

    browserSurface.append(
      searchControl.element,
      meta,
      uploadMessageHost,
      gridHost,
      fileInput
    );
    browserColumn.appendChild(browserSurface);

    layout.append(previewColumn, browserColumn);
    body.appendChild(layout);

    const footerRow = createModalActionRow({ variant: 'form' });
    const cancelButton = createTextButton({
      text: options.i18n.t('common.cancel'),
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        settle(null);
        close();
      },
    });
    const applyButton = createTextButton({
      text: options.i18n.t('common.apply'),
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('medium'),
      disabled: true,
      onClick: () => {
        settle(selectedWallpaperId);
        close();
      },
    });
    applyButton.dataset.role = 'wallpaper-picker-apply';
    footerRow.append(cancelButton, applyButton);
    footer.appendChild(footerRow);

    const getFilteredWallpapers = (): Wallpaper[] => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return wallpapers;
      return wallpapers.filter((wallpaper) =>
        getWallpaperSearchText(wallpaper).includes(normalizedSearch)
      );
    };

    const renderUploadMessage = (): void => {
      if (!uploadState.error) {
        uploadMessageHost.replaceChildren();
        return;
      }
      const message = createFormMessage({ tone: 'error', className: 'block' });
      message.show(uploadState.error, 'error');
      uploadMessageHost.replaceChildren(message.element);
    };

    const renderPreview = (): void => {
      const selectedWallpaper =
        findWallpaperById(wallpapers, selectedWallpaperId) ??
        findWallpaperById(wallpapers, currentWallpaperId) ??
        wallpapers[0] ??
        null;

      const surface = document.createElement('div');
      surface.className =
        'overflow-hidden rounded-[1.5rem] bg-slate-50/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';

      if (!selectedWallpaper) {
        const empty = document.createElement('div');
        empty.className =
          'flex aspect-[16/10] items-center justify-center rounded-[1.1rem] bg-white/80 text-sm text-slate-500';
        empty.textContent = options.i18n.t('profileSettings.appearance.empty');
        surface.appendChild(empty);
        previewColumn.replaceChildren(surface);
        return;
      }

      const stage = document.createElement('div');
      stage.className =
        'aspect-[16/10] overflow-hidden rounded-[1.1rem] bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]';
      stage.style.backgroundImage = `url("${resolveWallpaperUrl(
        selectedWallpaper.image_file
      )}")`;
      stage.style.backgroundPosition = 'center';
      stage.style.backgroundRepeat = 'no-repeat';
      stage.style.backgroundSize = 'cover';

      const details = document.createElement('div');
      details.className =
        'mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between';

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0';

      const eyebrow = document.createElement('div');
      eyebrow.className =
        'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400';
      eyebrow.textContent = options.i18n.t(
        'profileSettings.appearance.preview'
      );

      const title = document.createElement('div');
      title.className =
        'text-[15px] font-semibold leading-6 tracking-tight text-slate-900';
      title.textContent =
        selectedWallpaperId === String(selectedWallpaper.id) &&
        selectedWallpaperId !== currentWallpaperId
          ? options.i18n.t('profileSettings.appearance.selected')
          : options.i18n.t('profileSettings.appearance.currentWallpaper');

      const supporting = document.createElement('div');
      supporting.className = 'text-sm leading-5 text-slate-500';
      supporting.textContent = options.i18n.t(
        'profileSettings.appearance.wallpaperCount',
        {
          count: String(wallpapers.length),
        }
      );

      textWrap.append(eyebrow, title, supporting);

      const badgeRow = document.createElement('div');
      badgeRow.className = 'flex flex-wrap items-center gap-2';
      if (currentWallpaperId === String(selectedWallpaper.id)) {
        badgeRow.appendChild(
          createBadge({
            label: options.i18n.t('profileSettings.appearance.current'),
            tone: 'neutral',
          })
        );
      }
      if (selectedWallpaperId === String(selectedWallpaper.id)) {
        badgeRow.appendChild(
          createBadge({
            label: options.i18n.t('profileSettings.appearance.selected'),
            tone: 'accent',
          })
        );
      }

      details.append(textWrap, badgeRow);
      surface.append(stage, details);
      previewColumn.replaceChildren(surface);
    };

    const handleWallpaperUpload = async (file: File): Promise<void> => {
      if (!options.onUploadWallpaper || uploadState.uploading) return;
      if (!isImageFile(file)) {
        uploadState = {
          uploading: false,
          error: options.i18n.t('profileSettings.appearance.uploadInvalid'),
        };
        renderUploadMessage();
        renderBrowser();
        return;
      }

      uploadState = { uploading: true, error: null };
      renderUploadMessage();
      renderBrowser();
      updateApplyState();

      try {
        const uploadedWallpaper = await options.onUploadWallpaper(file);
        if (settled) return;
        wallpapers = upsertWallpaper(wallpapers, uploadedWallpaper);
        selectedWallpaperId = String(uploadedWallpaper.id);
        searchTerm = '';
        searchControl.setValue('');
        uploadState = { uploading: false, error: null };
        renderUploadMessage();
        renderBrowser();
        renderPreview();
        updateApplyState();
      } catch (error) {
        if (settled) return;
        console.warn('Failed to upload wallpaper.', error);
        uploadState = {
          uploading: false,
          error: options.i18n.t('profileSettings.appearance.uploadError'),
        };
        renderUploadMessage();
        renderBrowser();
        updateApplyState();
      }
    };

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0] ?? null;
      fileInput.value = '';
      if (!file) return;
      void handleWallpaperUpload(file);
    });

    const createUploadTile = (): HTMLButtonElement => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.dataset.role = 'wallpaper-picker-upload';
      tile.disabled = uploadState.uploading;
      tile.className = [
        'group relative flex aspect-[16/9] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-white/72 px-3 text-center transition-[box-shadow,background-color] duration-150 ease-out',
        uploadState.uploading
          ? 'cursor-wait text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_3px_rgba(15,23,42,0.04)]'
          : 'text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_3px_rgba(15,23,42,0.04)] hover:bg-white hover:text-indigo-600 hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]',
      ].join(' ');
      const icon = createIcon(uploadState.uploading ? 'arrow-path' : 'plus', {
        size: 22,
        strokeWidth: 1.8,
      });
      icon.setAttribute('aria-hidden', 'true');
      if (uploadState.uploading) {
        icon.classList.add('animate-spin');
      }
      const label = document.createElement('span');
      label.className = 'text-sm font-semibold leading-5';
      label.textContent = uploadState.uploading
        ? options.i18n.t('profileSettings.appearance.uploading')
        : options.i18n.t('profileSettings.appearance.upload');
      tile.append(icon, label);
      tile.addEventListener('click', () => {
        if (uploadState.uploading) return;
        fileInput.click();
      });
      return tile;
    };

    const renderBrowser = (): void => {
      const filteredWallpapers = getFilteredWallpapers();
      meta.textContent = options.i18n.t(
        'profileSettings.appearance.searchResults',
        {
          visible: String(filteredWallpapers.length),
          total: String(wallpapers.length),
        }
      );

      const nextGrid = document.createElement('div');
      nextGrid.className = 'grid grid-cols-2 gap-2.5 xl:grid-cols-3';
      if (options.onUploadWallpaper) {
        nextGrid.appendChild(createUploadTile());
      }

      if (filteredWallpapers.length === 0) {
        const empty = document.createElement('div');
        empty.className =
          'col-span-full rounded-xl bg-white/78 px-3 py-5 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]';
        empty.textContent = options.i18n.t(
          wallpapers.length === 0 && searchTerm.trim().length === 0
            ? 'profileSettings.appearance.empty'
            : 'profileSettings.appearance.searchEmpty'
        );
        nextGrid.appendChild(empty);
        gridHost.replaceChildren(nextGrid);
        updateApplyState();
        renderPreview();
        return;
      }

      filteredWallpapers.forEach((wallpaper) => {
        const wallpaperId = String(wallpaper.id);
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.dataset.role = 'wallpaper-picker-option';
        tile.dataset.wallpaperId = wallpaperId;
        tile.title = getWallpaperDisplayName(wallpaper);
        tile.setAttribute(
          'aria-pressed',
          selectedWallpaperId === wallpaperId ? 'true' : 'false'
        );
        tile.className = [
          'group relative overflow-hidden rounded-xl bg-white/84 text-left transition-[box-shadow,background-color] duration-150 ease-out',
          selectedWallpaperId === wallpaperId
            ? 'ring-2 ring-indigo-300 shadow-[0_0_0_1px_rgba(99,102,241,0.16),0_8px_18px_rgba(99,102,241,0.14)]'
            : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_3px_rgba(15,23,42,0.04)] hover:bg-white hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]',
        ].join(' ');

        const image = document.createElement('div');
        image.className = 'aspect-[16/9] w-full bg-slate-100';
        image.style.backgroundImage = `url("${resolveWallpaperUrl(
          wallpaper.image_file
        )}")`;
        image.style.backgroundPosition = 'center';
        image.style.backgroundRepeat = 'no-repeat';
        image.style.backgroundSize = 'cover';

        if (currentWallpaperId === wallpaperId) {
          const currentBadge = createBadge({
            label: options.i18n.t('profileSettings.appearance.current'),
            tone: 'neutral',
            className:
              'pointer-events-none absolute left-2 top-2 z-10 bg-white/85 text-slate-600 backdrop-blur-[2px]',
          });
          tile.appendChild(currentBadge);
        }

        tile.append(image);
        tile.addEventListener('click', () => {
          selectedWallpaperId = wallpaperId;
          renderPreview();
          renderBrowser();
          updateApplyState();
        });
        nextGrid.appendChild(tile);
      });

      gridHost.replaceChildren(nextGrid);
      updateApplyState();
      renderPreview();
    };

    const updateApplyState = (): void => {
      applyButton.disabled =
        uploadState.uploading ||
        !selectedWallpaperId ||
        selectedWallpaperId === currentWallpaperId;
    };

    renderPreview();
    renderBrowser();
  });
}
