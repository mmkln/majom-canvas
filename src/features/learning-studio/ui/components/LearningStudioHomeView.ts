import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningStudioHomeCourseCard } from './LearningStudioScreenModels.ts';

type LearningStudioHomeLifecycleFilter =
  | 'all'
  | 'draft'
  | 'published'
  | 'archived';

type LearningStudioHomeViewOptions = {
  runtime: AppRuntime;
  courses: LearningStudioHomeCourseCard[];
  onCreateManual: () => void;
  onOpenCourse: (courseId: string) => void;
};

export class LearningStudioHomeView {
  public readonly element: HTMLDivElement;
  private searchQuery = '';
  private lifecycleFilter: LearningStudioHomeLifecycleFilter = 'all';

  constructor(private options: LearningStudioHomeViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'mx-auto flex w-full max-w-7xl flex-col gap-6';
    this.render();
  }

  public update(options: LearningStudioHomeViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const { i18n } = this.options.runtime;
    const sortedCourses = this.getSortedCourses();
    const visibleCourses = this.getVisibleCourses(sortedCourses);
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-5';
    wrapper.dataset.role = 'learning-studio-home';

    const hero = document.createElement('section');
    hero.className = 'flex flex-wrap items-end justify-between gap-4';

    const heroCopy = document.createElement('div');
    heroCopy.className = 'space-y-2';

    const title = document.createElement('h2');
    title.className = 'text-3xl font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.home.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'max-w-3xl text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.home.subtitle');

    heroCopy.append(title, subtitle);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3';

    const createManual = document.createElement('button');
    createManual.type = 'button';
    createManual.className =
      'inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800';
    createManual.dataset.role = 'learning-studio-home-create-manual';
    createManual.textContent = i18n.t('learningStudio.actions.createManual');
    createManual.addEventListener('click', () => {
      this.options.onCreateManual();
    });

    actions.append(createManual);
    hero.append(heroCopy, actions);

    wrapper.append(hero);

    if (this.options.courses.length === 0) {
      wrapper.append(this.renderEmptyState());
    } else {
      wrapper.append(this.renderLibraryControls());
      if (visibleCourses.length === 0) {
        wrapper.append(this.renderNoResultsState());
      } else {
        wrapper.append(this.renderCourseGrid(visibleCourses));
      }
    }

    this.element.replaceChildren(wrapper);
  }

  private renderLibraryControls(): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className =
      'flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4';
    section.dataset.role = 'learning-studio-home-controls';

    const searchField = document.createElement('label');
    searchField.className = 'min-w-[220px] flex-1 md:max-w-[360px]';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.value = this.searchQuery;
    searchInput.placeholder = i18n.t('learningStudio.home.searchPlaceholder');
    searchInput.setAttribute(
      'aria-label',
      i18n.t('learningStudio.home.searchLabel')
    );
    searchInput.dataset.role = 'learning-studio-home-search';
    searchInput.className =
      'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100';
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.render();
    });

    searchField.append(searchInput);

    const filters = document.createElement('div');
    filters.className = 'flex flex-wrap items-center gap-2';
    filters.append(
      this.createFilterButton(
        i18n.t('learningStudio.home.filterAll'),
        'all'
      ),
      this.createFilterButton(
        i18n.t('learningStudio.home.filterDrafts'),
        'draft'
      ),
      this.createFilterButton(
        i18n.t('learningStudio.home.filterPublished'),
        'published'
      ),
      this.createFilterButton(
        i18n.t('learningStudio.home.filterArchived'),
        'archived'
      )
    );

    section.append(searchField, filters);
    return section;
  }

  private renderEmptyState(): HTMLElement {
    const { i18n } = this.options.runtime;
    const empty = document.createElement('section');
    empty.className =
      'bg-white px-2 py-12 text-center';
    empty.dataset.role = 'learning-studio-home-empty';

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.home.emptyTitle');

    const body = document.createElement('p');
    body.className = 'mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600';
    body.textContent = i18n.t('learningStudio.home.emptyBody');

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className =
      'mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800';
    cta.dataset.role = 'learning-studio-home-empty-create';
    cta.textContent = i18n.t('learningStudio.actions.createManual');
    cta.addEventListener('click', () => {
      this.options.onCreateManual();
    });

    empty.append(title, body, cta);
    return empty;
  }

  private renderNoResultsState(): HTMLElement {
    const { i18n } = this.options.runtime;
    const empty = document.createElement('section');
    empty.className =
      'bg-white px-2 py-12 text-center';
    empty.dataset.role = 'learning-studio-home-no-results';

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.home.noResultsTitle');

    const body = document.createElement('p');
    body.className = 'mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600';
    body.textContent = i18n.t('learningStudio.home.noResultsBody');

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className =
      'mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50';
    reset.dataset.role = 'learning-studio-home-reset-filters';
    reset.textContent = i18n.t('learningStudio.home.viewAll');
    reset.addEventListener('click', () => {
      this.searchQuery = '';
      this.lifecycleFilter = 'all';
      this.render();
    });

    empty.append(title, body, reset);
    return empty;
  }

  private renderCourseGrid(courses: LearningStudioHomeCourseCard[]): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'flex flex-col';
    section.dataset.role = 'learning-studio-home-library-section';

    const grid = document.createElement('div');
    grid.className = 'overflow-hidden rounded-[24px] bg-white';
    grid.dataset.role = 'learning-studio-home-grid';

    const formatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    courses.forEach((course) => {
      const card = document.createElement('article');
      card.className =
        'group flex cursor-pointer flex-col gap-4 border-b border-slate-200 px-5 py-5 transition hover:bg-slate-50 last:border-b-0 md:flex-row md:items-start md:justify-between';
      card.dataset.role = `learning-studio-course-card-${course.id}`;
      card.addEventListener('click', () => {
        this.options.onOpenCourse(course.id);
      });

      const top = document.createElement('div');
      top.className = 'flex items-start justify-between gap-4';

      const status = document.createElement('span');
      status.className =
        'inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700';
      status.textContent = i18n.t(`learningStudio.status.${course.lifecycleState}`);

      const updated = document.createElement('span');
      updated.className = 'text-xs font-medium text-slate-400';
      updated.textContent = i18n.t('learningStudio.home.updatedAt', {
        date: formatter.format(new Date(course.updatedAt)),
      });

      top.append(status, updated);

      const heading = document.createElement('div');
      heading.className = 'space-y-2 md:max-w-2xl';

      const title = document.createElement('h3');
      title.className = 'text-xl font-semibold tracking-tight text-slate-950';
      title.textContent =
        course.title.trim().length > 0
          ? course.title
          : i18n.t('learningStudio.home.courseTitleFallback');

      const description = document.createElement('p');
      description.className = 'text-sm leading-6 text-slate-600';
      description.textContent =
        course.description.trim().length > 0
          ? course.description
          : i18n.t('learningStudio.home.courseDescriptionFallback');

      heading.append(title, description);

      const stats = document.createElement('div');
      stats.className = 'flex flex-wrap gap-2';

      [
        i18n.t('learningStudio.home.courseStatsModules', {
          count: String(course.moduleCount),
        }),
        i18n.t('learningStudio.home.courseStatsUnits', {
          count: String(course.unitCount),
        }),
      ].forEach((text) => {
        const item = document.createElement('span');
        item.className =
          'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700';
        item.textContent = text;
        stats.append(item);
      });

      const footer = document.createElement('div');
      footer.className =
        'flex items-center justify-between gap-3 md:min-w-[180px] md:flex-col md:items-end md:text-right';

      const guidance = document.createElement('p');
      guidance.className = 'text-xs uppercase tracking-[0.16em] text-slate-400';
      guidance.textContent = i18n.t('learningStudio.home.openCourseHint');

      const open = document.createElement('span');
      open.className = 'text-sm font-semibold text-slate-900';
      open.textContent = i18n.t('learningStudio.home.openCourseCta');

      footer.append(guidance, open);
      const main = document.createElement('div');
      main.className = 'min-w-0 flex-1 space-y-4';
      main.append(top, heading, stats);

      card.append(main, footer);
      grid.append(card);
    });

    section.append(grid);
    return section;
  }

  private createFilterButton(
    label: string,
    value: LearningStudioHomeLifecycleFilter
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ' +
      (this.lifecycleFilter === value
        ? 'bg-slate-950 text-white'
        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50');
    button.dataset.role = `learning-studio-home-filter-${value}`;
    button.textContent = label;
    button.addEventListener('click', () => {
      this.lifecycleFilter = value;
      this.render();
    });
    return button;
  }

  private getSortedCourses(): LearningStudioHomeCourseCard[] {
    return [...this.options.courses].sort((left, right) => {
      return (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
  }

  private getVisibleCourses(
    courses: LearningStudioHomeCourseCard[]
  ): LearningStudioHomeCourseCard[] {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      if (
        this.lifecycleFilter !== 'all' &&
        course.lifecycleState !== this.lifecycleFilter
      ) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const haystack = `${course.title} ${course.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }
}
