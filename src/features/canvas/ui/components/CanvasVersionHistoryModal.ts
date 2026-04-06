import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import type { CanvasSnapshotVersionListItemDTO } from '../../../../majom-wrapper/data-access/canvas-snapshot-dto.ts';
import { createTextButton } from '../primitives/index.ts';

type CanvasVersionHistoryModalOptions = {
  canvasTitle?: string;
  loadVersions: () => Promise<CanvasSnapshotVersionListItemDTO[]>;
  restoreVersion: (versionId: string) => Promise<void>;
  runtime?: AppRuntime;
};

function getVersionSourceLabel(
  source: CanvasSnapshotVersionListItemDTO['source'],
  runtime: AppRuntime
): string {
  const i18n = runtime.i18n;
  switch (source) {
    case 'autosave':
      return i18n.t('canvasHistory.source.autosave');
    case 'restore':
      return i18n.t('canvasHistory.source.restore');
    case 'system':
      return i18n.t('canvasHistory.source.system');
    case 'manual-save':
    default:
      return i18n.t('canvasHistory.source.manualSave');
  }
}

function formatVersionTimestamp(
  value: string,
  runtime: AppRuntime
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return runtime.i18n.formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function openCanvasVersionHistoryModal(
  options: CanvasVersionHistoryModalOptions
): void {
  const runtime = options.runtime ?? createAppRuntime();
  const i18n = runtime.i18n;
  let closed = false;
  let restoringVersionId: string | null = null;
  let versions: CanvasSnapshotVersionListItemDTO[] = [];
  let loadError = false;

  const close = (): void => {
    if (closed) return;
    closed = true;
    overlay.remove();
  };

  const { overlay, container, body, footer } = createModalShell(
    i18n.t('canvasHistory.title'),
    {
      subtitle: options.canvasTitle
        ? i18n.t('canvasHistory.subtitleWithCanvas', {
            canvasTitle: options.canvasTitle,
          })
        : i18n.t('canvasHistory.subtitle'),
      onClose: close,
      zIndex: 260,
    }
  );

  const content = document.createElement('div');
  content.className = 'flex flex-col gap-3';
  body.appendChild(content);

  const actionsRow = createModalActionRow({ variant: 'confirm' });
  const closeButton = createTextButton({
    text: i18n.t('canvasHistory.close'),
    tone: 'text',
    size: 'md',
    className: getModalActionButtonClass('default'),
    onClick: close,
  });
  actionsRow.appendChild(closeButton);
  footer.appendChild(actionsRow);

  const renderLoading = (): void => {
    content.innerHTML = '';
    const loading = document.createElement('p');
    loading.className = 'text-sm text-slate-500';
    loading.textContent = i18n.t('canvasHistory.loading');
    content.appendChild(loading);
  };

  const renderError = (): void => {
    content.innerHTML = '';
    const message = document.createElement('p');
    message.className =
      'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
    message.textContent = i18n.t('canvasHistory.loadFailed');
    const reloadButton = createTextButton({
      text: i18n.t('canvasHistory.reload'),
      tone: 'secondary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        void loadVersions();
      },
    });
    content.append(message, reloadButton);
  };

  const renderEmpty = (): void => {
    content.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'text-sm text-slate-500';
    message.textContent = i18n.t('canvasHistory.empty');
    content.appendChild(message);
  };

  const renderVersions = (): void => {
    content.innerHTML = '';
    if (versions.length === 0) {
      renderEmpty();
      return;
    }

    const list = document.createElement('div');
    list.className = 'flex flex-col gap-2';

    versions.forEach((version) => {
      const item = document.createElement('div');
      item.className =
        'flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3';

      const meta = document.createElement('div');
      meta.className = 'min-w-0 flex-1';

      const topRow = document.createElement('div');
      topRow.className = 'flex flex-wrap items-center gap-x-2 gap-y-1';

      const timestamp = document.createElement('span');
      timestamp.className = 'text-sm font-medium text-slate-900';
      timestamp.textContent = formatVersionTimestamp(version.created_at, runtime);

      const source = document.createElement('span');
      source.className =
        'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600';
      source.textContent = getVersionSourceLabel(version.source, runtime);

      topRow.append(timestamp, source);

      const summary = document.createElement('p');
      summary.className = 'mt-1 text-sm text-slate-600';
      summary.textContent = i18n.t('canvasHistory.summary', {
        nodes: String(version.summary.nodeCount ?? 0),
        relations: String(version.summary.relationCount ?? 0),
      });

      meta.append(topRow, summary);

      const restoreButton = createTextButton({
        text:
          restoringVersionId === version.id
            ? i18n.t('canvasHistory.restoring')
            : i18n.t('canvasHistory.restore'),
        tone: 'secondary',
        size: 'md',
        className: getModalActionButtonClass('default'),
        disabled:
          restoringVersionId !== null && restoringVersionId !== version.id,
        onClick: () => {
          void handleRestore(version.id);
        },
      });
      restoreButton.disabled = restoringVersionId !== null;
      restoreButton.loading = restoringVersionId === version.id;

      item.append(meta, restoreButton);
      list.appendChild(item);
    });

    content.appendChild(list);
  };

  const loadVersions = async (): Promise<void> => {
    loadError = false;
    renderLoading();
    try {
      versions = await options.loadVersions();
      if (closed) return;
      renderVersions();
    } catch (error) {
      if (closed) return;
      loadError = true;
      console.error('Failed to load canvas version history', error);
      renderError();
    }
  };

  const handleRestore = async (versionId: string): Promise<void> => {
    restoringVersionId = versionId;
    if (!loadError) {
      renderVersions();
    }
    try {
      await options.restoreVersion(versionId);
      close();
    } catch (error) {
      console.error('Failed to restore canvas version', error);
      restoringVersionId = null;
      const message = document.createElement('p');
      message.className =
        'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      message.textContent = i18n.t('canvasHistory.restoreFailed');
      if (!loadError) {
        renderVersions();
        content.prepend(message);
      } else {
        renderError();
        content.prepend(message);
      }
    }
  };

  renderLoading();
  void loadVersions();
}
