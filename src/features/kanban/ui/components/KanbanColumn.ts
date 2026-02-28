import type {
  KanbanColumnId,
  KanbanColumnState,
  KanbanStoryGroup,
  KanbanTaskCard,
} from '../../types.ts';
import type { KanbanViewHandlers } from './types.ts';
import { HabitListComponent } from './HabitList.ts';
import { renderKanbanTaskCard } from './TaskCard.ts';

type KanbanColumnRenderOptions = {
  handlers: KanbanViewHandlers;
  collapsedColumns: Set<KanbanColumnId>;
  completedHabitsCollapsed: Set<KanbanColumnId>;
  onColumnCollapseToggle: (columnId: KanbanColumnId) => void;
  onLocalStateChange: () => void;
};

function formatTime(value: Date | null): string {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function createSectionTitle(text: string): HTMLElement {
  const title = document.createElement('div');
  title.className = 'kb-section-title';
  title.textContent = text;
  return title;
}

function createChevronIcon(collapsed: boolean): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute(
    'd',
    collapsed ? 'm6 9 6 6 6-6' : 'm18 15-6-6-6 6'
  );
  svg.appendChild(path);
  return svg;
}

function createColumnCollapseIcon(collapsed: boolean): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6');
  svg.appendChild(path);
  return svg;
}

function renderEventsSection(
  events: KanbanColumnState['sections']['events']
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'kb-stack';
  section.appendChild(createSectionTitle('Events'));
  events.forEach((eventCard) => {
    const eventEl = document.createElement('article');
    eventEl.className = 'kb-event';
    const title = document.createElement('div');
    title.className = 'kb-event-title';
    title.textContent = eventCard.title;
    const time = document.createElement('div');
    time.className = 'kb-event-time';
    time.textContent = `${formatTime(eventCard.startTime)} - ${formatTime(eventCard.endTime)}`;
    eventEl.append(title, time);
    section.appendChild(eventEl);
  });
  return section;
}

function renderStoryGroupsSection(
  columnId: KanbanColumnId,
  groups: KanbanStoryGroup[],
  options: KanbanColumnRenderOptions
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'kb-stack';
  section.appendChild(createSectionTitle('Story Groups'));

  groups.forEach((group) => {
    const groupEl = document.createElement('article');
    groupEl.className = 'kb-story-group';
    const groupHeader = document.createElement('header');
    groupHeader.className = 'kb-story-header';

    const title = document.createElement('h3');
    title.className = 'kb-story-title';
    title.textContent = group.title;

    const right = document.createElement('div');
    right.className = 'kb-story-header-actions';
    const meta = document.createElement('span');
    meta.className = 'kb-story-meta';
    meta.textContent = `${group.completedCount}/${group.totalCount}`;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'kb-story-toggle';
    toggleBtn.title = group.collapsed ? 'Expand story group' : 'Collapse story group';
    toggleBtn.setAttribute(
      'aria-label',
      group.collapsed ? 'Expand story group' : 'Collapse story group'
    );
    toggleBtn.appendChild(createChevronIcon(group.collapsed));
    toggleBtn.addEventListener('click', () => {
      options.handlers.onStoryGroupToggle(columnId, group.storyKey);
    });

    right.append(meta, toggleBtn);
    groupHeader.append(title, right);
    groupEl.appendChild(groupHeader);

    const body = document.createElement('div');
    body.className = 'kb-story-body';
    const visibleTasks = group.collapsed ? group.tasks.slice(0, 1) : group.tasks;
    visibleTasks.forEach((taskCard) => {
      body.appendChild(
        renderKanbanTaskCard(taskCard, options.handlers, { isInGroup: true })
      );
    });
    groupEl.appendChild(body);

    section.appendChild(groupEl);
  });

  return section;
}

function renderTaskListSection(
  title: string,
  tasks: KanbanTaskCard[],
  options: KanbanColumnRenderOptions
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'kb-stack';
  section.appendChild(createSectionTitle(title));
  tasks.forEach((taskCard) => {
    section.appendChild(renderKanbanTaskCard(taskCard, options.handlers));
  });
  return section;
}

function renderHabitsSection(
  columnId: KanbanColumnId,
  habits: KanbanColumnState['sections']['habits'],
  options: KanbanColumnRenderOptions
): HTMLElement {
  const component = new HabitListComponent({
    columnId,
    habits,
    completedHabitsCollapsed: options.completedHabitsCollapsed,
    handlers: options.handlers,
    onLocalStateChange: options.onLocalStateChange,
  });
  return component.render();
}

export function renderKanbanColumn(
  column: KanbanColumnState,
  options: KanbanColumnRenderOptions
): HTMLElement {
  const isCollapsed = options.collapsedColumns.has(column.id);
  const columnEl = document.createElement('section');
  columnEl.className =
    'kb-column relative overflow-hidden text-gray-600 w-[17.5rem]';
  if (isCollapsed) {
    columnEl.classList.add('kb-column-collapsed');
  }

  const headerWrap = document.createElement('header');
  headerWrap.className = 'kb-column-header-wrap sticky z-10 w-[17.5rem] h-4';
  if (isCollapsed) {
    headerWrap.classList.add('kb-column-header-wrap-collapsed');
  }

  const header = document.createElement('div');
  header.className =
    'kb-column-header flex items-center justify-between px-4 h-9 bg-gray-100 rounded-lg advanced-glass-effect text-black';
  if (isCollapsed) {
    header.classList.add('kb-column-header-collapsed');
  }
  const title = document.createElement('h2');
  title.className = 'kb-column-title font-medium text-sm';
  title.textContent = column.title;
  title.title = column.title;
  if (isCollapsed) {
    title.classList.add('kb-column-title-vertical');
  }

  const headerActions = document.createElement('div');
  headerActions.className = 'kb-column-actions flex gap-2 items-center';
  if (isCollapsed) {
    headerActions.classList.add('kb-column-actions-collapsed');
  }

  const progress = document.createElement('span');
  progress.className =
    'kb-column-count inline-flex justify-center items-center px-2 text-base font-medium rounded-full';
  progress.textContent = `${column.progress.completed}/${column.progress.total}`;

  const groups = column.sections.storyGroups;
  const groupsToggle = document.createElement('button');
  groupsToggle.type = 'button';
  groupsToggle.className = 'kb-header-toggle';
  groupsToggle.disabled = groups.length === 0;
  const allCollapsed = groups.length > 0 && groups.every((group) => group.collapsed);
  groupsToggle.title = allCollapsed ? 'Expand all story groups' : 'Collapse all story groups';
  groupsToggle.setAttribute(
    'aria-label',
    allCollapsed ? 'Expand all story groups' : 'Collapse all story groups'
  );
  groupsToggle.appendChild(createChevronIcon(allCollapsed));
  groupsToggle.addEventListener('click', () => {
    options.handlers.onStoryGroupsToggleAll(column.id, !allCollapsed);
  });

  const collapseToggle = document.createElement('button');
  collapseToggle.type = 'button';
  collapseToggle.className = 'kb-header-toggle kb-column-collapse-toggle';
  collapseToggle.title = isCollapsed ? 'Expand column' : 'Collapse column';
  collapseToggle.setAttribute(
    'aria-label',
    isCollapsed ? 'Expand column' : 'Collapse column'
  );
  collapseToggle.appendChild(createColumnCollapseIcon(isCollapsed));
  collapseToggle.addEventListener('click', () => {
    options.onColumnCollapseToggle(column.id);
  });

  if (isCollapsed) {
    headerActions.append(collapseToggle);
    header.append(headerActions, title);
  } else {
    headerActions.append(progress, groupsToggle, collapseToggle);
    header.append(title, headerActions);
  }
  headerWrap.appendChild(header);

  if (isCollapsed) {
    columnEl.appendChild(headerWrap);
    return columnEl;
  }

  const body = document.createElement('div');
  body.className = 'kb-column-body column overflow-y-auto pt-8';
  const sectionContainer = document.createElement('div');
  sectionContainer.className = 'kb-column-sections';

  if (column.sections.events.length > 0) {
    sectionContainer.appendChild(renderEventsSection(column.sections.events));
  }
  if (column.sections.storyGroups.length > 0) {
    sectionContainer.appendChild(
      renderStoryGroupsSection(column.id, column.sections.storyGroups, options)
    );
  }
  if (column.sections.tasks.length > 0) {
    sectionContainer.appendChild(
      renderTaskListSection('Tasks', column.sections.tasks, options)
    );
  }
  if (column.sections.challengeTasks.length > 0) {
    sectionContainer.appendChild(
      renderTaskListSection(
        'Challenge Tasks',
        column.sections.challengeTasks,
        options
      )
    );
  }
  if (column.sections.habits.length > 0) {
    sectionContainer.appendChild(
      renderHabitsSection(column.id, column.sections.habits, options)
    );
  }
  if (column.sections.completedTasks.length > 0) {
    sectionContainer.appendChild(
      renderTaskListSection('Completed', column.sections.completedTasks, options)
    );
  }

  const backdrop = document.createElement('div');
  backdrop.className =
    'kb-column-backdrop absolute z-[-1] w-[calc(100%-28px)] h-full rounded-[1.3rem] mx-3.5';
  body.appendChild(sectionContainer);
  columnEl.append(headerWrap, body, backdrop);
  return columnEl;
}
