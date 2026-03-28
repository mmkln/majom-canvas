import type { KanbanColumnId, KanbanHabitCard } from '../../types.ts';
import type { KanbanViewHandlers } from './types.ts';
import { Checkbox } from '../../../../ui-lib/src/components/Checkbox.ts';

type HabitListComponentOptions = {
  columnId: KanbanColumnId;
  habits: KanbanHabitCard[];
  completedHabitsCollapsed: Set<KanbanColumnId>;
  handlers: KanbanViewHandlers;
  onLocalStateChange: () => void;
};

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
  path.setAttribute('d', collapsed ? 'm6 9 6 6 6-6' : 'm18 15-6-6-6 6');
  svg.appendChild(path);
  return svg;
}

export class HabitListComponent {
  public dueItemList: KanbanHabitCard[] = [];
  public completedItemList: KanbanHabitCard[] = [];
  private loading = false;

  constructor(private readonly options: HabitListComponentOptions) {
    this.sortItems(this.options.habits);
  }

  public sortItems(habits: KanbanHabitCard[] = this.options.habits): void {
    this.dueItemList = habits.filter((habit) => habit.isDueToday);
    this.completedItemList = habits.filter((habit) => !habit.isDueToday);
  }

  public toggleCompletedList(): void {
    if (this.isCompletedCollapsed()) {
      this.options.completedHabitsCollapsed.delete(this.options.columnId);
    } else {
      this.options.completedHabitsCollapsed.add(this.options.columnId);
    }
    this.options.onLocalStateChange();
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public async onHabitComplete(
    habitCard: KanbanHabitCard,
    completed: boolean
  ): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.options.onLocalStateChange();
    try {
      let ok = false;
      try {
        ok = await this.options.handlers.onHabitToggle(
          habitCard.habitUuid,
          completed
        );
      } catch {
        ok = false;
      }
      if (ok) {
        this.options.handlers.onHabitUpdate();
      }
    } finally {
      this.loading = false;
      this.options.onLocalStateChange();
    }
  }

  public async onHabitTitleChange(
    habitCard: KanbanHabitCard,
    title: string
  ): Promise<void> {
    const next = title.trim();
    if (this.loading || !next || next === habitCard.title) return;
    this.loading = true;
    this.options.onLocalStateChange();
    try {
      let ok = false;
      try {
        ok = await this.options.handlers.onHabitTitlePatch(
          habitCard.habitUuid,
          next
        );
      } catch {
        ok = false;
      }
      if (ok) {
        this.options.handlers.onHabitUpdate();
      }
    } finally {
      this.loading = false;
      this.options.onLocalStateChange();
    }
  }

  public render(): HTMLElement {
    this.sortItems();

    const section = document.createElement('section');
    section.className = 'kb-stack';

    const wrap = document.createElement('div');
    wrap.className = 'kb-habit-list group';
    if (this.loading) {
      wrap.classList.add('is-loading');
    }

    const header = document.createElement('div');
    header.className = 'kb-habit-header';
    const title = document.createElement('h4');
    title.className = 'kb-habit-header-title';
    title.textContent = 'Routines';
    header.appendChild(title);
    wrap.appendChild(header);

    this.dueItemList.forEach((habitCard) => {
      wrap.appendChild(this.renderItem(habitCard, true));
    });

    if (this.completedItemList.length > 0) {
      const toggleRow = document.createElement('button');
      toggleRow.type = 'button';
      toggleRow.className = 'kb-habit-completed-toggle';
      toggleRow.disabled = this.loading;
      const collapsed = this.isCompletedCollapsed();
      const label = document.createElement('span');
      label.textContent = `Completed (${this.completedItemList.length})`;
      toggleRow.append(label, createChevronIcon(collapsed));
      toggleRow.addEventListener('click', () => {
        this.toggleCompletedList();
      });
      wrap.appendChild(toggleRow);

      if (!collapsed) {
        this.completedItemList.forEach((habitCard) => {
          wrap.appendChild(this.renderItem(habitCard, false));
        });
      }
    }

    section.appendChild(wrap);
    return section;
  }

  private renderItem(habitCard: KanbanHabitCard, isDue: boolean): HTMLElement {
    const row = document.createElement('article');
    row.className = isDue ? 'kb-habit-row kb-habit-row-due' : 'kb-habit-row';
    if (!isDue) {
      row.classList.add('done');
    }

    const checkbox = new Checkbox({
      checked: !habitCard.isDueToday,
      disabled: this.loading,
      label: habitCard.title,
      stopPropagation: true,
    });
    checkbox.onChange((checked) => {
      void this.onHabitComplete(habitCard, checked);
    });

    const titleInput = document.createElement('input');
    titleInput.className = isDue
      ? 'kb-habit-title kb-habit-title-due'
      : 'kb-habit-title';
    titleInput.value = habitCard.title;
    titleInput.disabled = this.loading;
    titleInput.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      titleInput.blur();
    });
    titleInput.addEventListener('blur', () => {
      void this.onHabitTitleChange(habitCard, titleInput.value);
    });

    row.append(checkbox.getElement(), titleInput);
    return row;
  }

  private isCompletedCollapsed(): boolean {
    return this.options.completedHabitsCollapsed.has(this.options.columnId);
  }
}
