import { createIcon } from '../../canvas/ui/icons.ts';

export type NotesDesktopModalView = {
  root: HTMLDivElement;
  sidebarTitle: HTMLHeadingElement;
  sidebarHeaderActions: HTMLDivElement;
  sidebarListHost: HTMLDivElement;
  editorMetaHost: HTMLDivElement;
  editorActionsHost: HTMLDivElement;
  editorContentHost: HTMLDivElement;
};

export function createNotesDesktopModalView(options: {
  sidebarTitle: string;
}): NotesDesktopModalView {
  const root = document.createElement('div');
  root.setAttribute('data-component', 'NotesDesktopModalView');
  root.className =
    'grid h-full min-h-0 grid-cols-[20.5rem_1px_minmax(0,1fr)] bg-white';

  const sidebar = document.createElement('section');
  sidebar.setAttribute('data-component', 'NotesDesktopSidebar');
  sidebar.className = 'flex min-h-0 flex-col overflow-hidden bg-white';

  const sidebarHeader = document.createElement('div');
  sidebarHeader.setAttribute('data-component', 'NotesDesktopSidebarHeader');
  sidebarHeader.className = 'flex items-center justify-between gap-3 px-4 py-4';

  const sidebarTitle = document.createElement('h3');
  sidebarTitle.setAttribute('data-component', 'NotesDesktopSidebarTitle');
  sidebarTitle.className =
    'min-w-0 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500';
  const sidebarTitleIcon = createIcon('document', {
    size: 14,
    strokeWidth: 1.9,
  });
  sidebarTitleIcon.classList.add('shrink-0');
  sidebarTitleIcon.setAttribute('aria-hidden', 'true');
  const sidebarTitleText = document.createElement('span');
  sidebarTitleText.className = 'min-w-0 truncate';
  sidebarTitleText.textContent = options.sidebarTitle;
  sidebarTitle.append(sidebarTitleIcon, sidebarTitleText);

  const sidebarHeaderActions = document.createElement('div');
  sidebarHeaderActions.setAttribute(
    'data-component',
    'NotesDesktopSidebarHeaderActions'
  );
  sidebarHeaderActions.className = 'flex shrink-0 items-center gap-2';

  sidebarHeader.append(sidebarTitle, sidebarHeaderActions);

  const sidebarDivider = document.createElement('div');
  sidebarDivider.setAttribute(
    'data-component',
    'NotesDesktopSidebarDivider'
  );
  sidebarDivider.className = 'border-t border-slate-200';

  const sidebarListHost = document.createElement('div');
  sidebarListHost.setAttribute('data-component', 'NotesDesktopSidebarList');
  sidebarListHost.className = 'min-h-0 flex-1 overflow-y-auto py-2';

  sidebar.append(sidebarHeader, sidebarDivider, sidebarListHost);

  const contentDivider = document.createElement('div');
  contentDivider.setAttribute('data-component', 'NotesDesktopContentDivider');
  contentDivider.className = 'bg-slate-200';
  contentDivider.setAttribute('aria-hidden', 'true');

  const editor = document.createElement('section');
  editor.setAttribute('data-component', 'NotesDesktopEditor');
  editor.className = 'flex min-h-0 min-w-0 flex-col overflow-hidden bg-white';

  const editorHeader = document.createElement('div');
  editorHeader.setAttribute('data-component', 'NotesDesktopEditorHeader');
  editorHeader.className =
    'flex items-center justify-between gap-4 px-5 py-4 md:px-6';

  const editorMetaHost = document.createElement('div');
  editorMetaHost.setAttribute('data-component', 'NotesDesktopEditorMeta');
  editorMetaHost.className = 'min-w-0 flex-1';

  const editorActionsHost = document.createElement('div');
  editorActionsHost.setAttribute(
    'data-component',
    'NotesDesktopEditorActions'
  );
  editorActionsHost.className = 'flex shrink-0 items-center gap-2';

  editorHeader.append(editorMetaHost, editorActionsHost);

  const editorDivider = document.createElement('div');
  editorDivider.setAttribute(
    'data-component',
    'NotesDesktopEditorDivider'
  );
  editorDivider.className = 'hidden';

  const editorContentHost = document.createElement('div');
  editorContentHost.setAttribute(
    'data-component',
    'NotesDesktopEditorContent'
  );
  editorContentHost.className = 'flex min-h-0 flex-1 overflow-hidden';

  editor.append(editorHeader, editorDivider, editorContentHost);
  root.append(sidebar, contentDivider, editor);

  return {
    root,
    sidebarTitle,
    sidebarHeaderActions,
    sidebarListHost,
    editorMetaHost,
    editorActionsHost,
    editorContentHost,
  };
}
