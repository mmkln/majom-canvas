import type { AppRuntime } from '../../../../app-runtime/index.ts';
import {
  ActionButton,
  emptyStateBodyClass,
  emptyStateTitleClass,
  InteractiveRow,
  pageTitleClass,
  PillBadge,
  rowMetaClass,
  SectionTitle,
  SegmentedSwitch,
  Surface,
  TextField,
  timestampTextClass,
} from './primitives/index.ts';
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
    this.element.className = 'mx-auto flex w-full max-w-[1180px] flex-col gap-5';
    this.render();
  }

  public update(options: LearningStudioHomeViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const sortedCourses = this.getSortedCourses();
    const visibleCourses = this.getVisibleCourses(sortedCourses);
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-4';
    wrapper.dataset.role = 'learning-studio-home';

    wrapper.append(this.renderTopBlock());

    if (this.options.courses.length === 0) {
      wrapper.append(this.renderEmptyState());
    } else {
      wrapper.append(this.renderCourseLibrarySection(visibleCourses));
    }

    this.element.replaceChildren(wrapper);
  }

  private renderTopBlock(): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = Surface({
      tone: 'card',
      padding: 'section',
      dataRole: 'learning-studio-home-top-block',
    });

    const createManual = ActionButton({
      label: i18n.t('learningStudio.home.createCourse'),
      icon: 'plus',
      iconSize: 15,
      iconStrokeWidth: 2.1,
      dataRole: 'learning-studio-home-create-manual',
      onClick: () => {
        this.options.onCreateManual();
      },
    });

    const content = document.createElement('div');
    content.className = 'flex min-w-0 flex-col';

    const headingRow = document.createElement('div');
    headingRow.className =
      'flex flex-wrap items-center justify-between gap-3 md:flex-nowrap';

    const title = document.createElement('h1');
    title.className = pageTitleClass;
    title.textContent = i18n.t('learningStudio.home.title');

    headingRow.append(title, createManual);
    content.append(headingRow);
    section.append(content);
    return section;
  }

  private renderLibraryControls(): HTMLElement {
    const { i18n } = this.options.runtime;
    const layout = document.createElement('div');
    layout.className = 'flex flex-wrap items-center gap-3 md:justify-end';
    layout.dataset.role = 'learning-studio-home-controls';

    const searchField = TextField({
      type: 'search',
      icon: 'magnifying-glass',
      iconSize: 15,
      iconStrokeWidth: 1.7,
      iconClassName: 'text-slate-300',
      tone: 'muted',
      size: 'sm',
      quietUntilFocus: true,
      rounded: 'full',
      value: this.searchQuery,
      placeholder: i18n.t('learningStudio.home.searchPlaceholder'),
      ariaLabel: i18n.t('learningStudio.home.searchLabel'),
      className: 'min-w-[188px] md:max-w-[300px]',
      inputClassName: 'placeholder:text-slate-300',
      dataRole: 'learning-studio-home-search',
      onInput: (value) => {
        this.searchQuery = value;
        this.render();
      },
    });

    const filters = SegmentedSwitch<LearningStudioHomeLifecycleFilter>({
      value: this.lifecycleFilter,
      dataRole: 'learning-studio-home-filter-switcher',
      onChange: (value) => {
        this.lifecycleFilter = value;
        this.render();
      },
      items: [
        {
          label: i18n.t('learningStudio.home.filterAll'),
          value: 'all',
          dataRole: 'learning-studio-home-filter-all',
        },
        {
          label: i18n.t('learningStudio.home.filterDrafts'),
          value: 'draft',
          dataRole: 'learning-studio-home-filter-draft',
        },
        {
          label: i18n.t('learningStudio.home.filterPublished'),
          value: 'published',
          dataRole: 'learning-studio-home-filter-published',
        },
        {
          label: i18n.t('learningStudio.home.filterArchived'),
          value: 'archived',
          dataRole: 'learning-studio-home-filter-archived',
        },
      ],
    });

    layout.append(searchField, filters);
    return layout;
  }

  private renderEmptyState(): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = Surface({
      tone: 'card',
      className: 'px-5 py-12 text-center md:px-6',
      dataRole: 'learning-studio-home-empty',
    });

    const title = document.createElement('h2');
    title.className = emptyStateTitleClass;
    title.textContent = i18n.t('learningStudio.home.emptyTitle');

    const body = document.createElement('p');
    body.className = emptyStateBodyClass;
    body.textContent = i18n.t('learningStudio.home.emptyBody');

    const cta = ActionButton({
      label: i18n.t('learningStudio.home.createCourse'),
      icon: 'plus',
      iconSize: 15,
      iconStrokeWidth: 2.1,
      className: 'mt-6',
      dataRole: 'learning-studio-home-empty-create',
      onClick: () => {
        this.options.onCreateManual();
      },
    });

    section.append(title, body, cta);
    return section;
  }

  private renderCourseLibrarySection(
    courses: LearningStudioHomeCourseCard[]
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = Surface({
      tone: 'card',
      padding: 'section',
      dataRole: 'learning-studio-home-library-section',
    });

    const header = document.createElement('div');
    header.className =
      'flex flex-col gap-3 pb-2 md:flex-row md:items-center md:justify-between';

    header.append(
      SectionTitle({
        text: i18n.t('learningStudio.home.sectionTitle'),
        level: 2,
        tone: 'muted',
        className: 'md:shrink-0',
      }),
      this.renderLibraryControls()
    );
    section.append(header);

    if (courses.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'py-12 text-center';
      empty.dataset.role = 'learning-studio-home-no-results';

      const emptyTitle = document.createElement('h3');
      emptyTitle.className = emptyStateTitleClass;
      emptyTitle.textContent = i18n.t('learningStudio.home.noResultsTitle');

      const emptyBody = document.createElement('p');
      emptyBody.className = emptyStateBodyClass;
      emptyBody.textContent = i18n.t('learningStudio.home.noResultsBody');

      const reset = ActionButton({
        label: i18n.t('learningStudio.home.viewAll'),
        tone: 'subtle',
        size: 'md',
        className: 'mt-6',
        dataRole: 'learning-studio-home-reset-filters',
        onClick: () => {
          this.searchQuery = '';
          this.lifecycleFilter = 'all';
          this.render();
        },
      });

      empty.append(emptyTitle, emptyBody, reset);
      section.append(empty);
      return section;
    }

    const list = document.createElement('div');
    list.className = 'mt-4 grid gap-2';
    list.dataset.role = 'learning-studio-home-grid';

    const formatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    courses.forEach((course) => {
      const row = InteractiveRow({
        className: 'flex items-start gap-4 px-3 py-4',
        dataRole: `learning-studio-course-card-${course.id}`,
        onClick: () => {
          this.options.onOpenCourse(course.id);
        },
      });

      const statusBar = document.createElement('div');
      statusBar.className = `mt-1 h-12 w-1.5 shrink-0 rounded-full ${this.getCourseStatusBarClass(
        course.lifecycleState
      )}`;

      const content = document.createElement('div');
      content.className = 'min-w-0 flex-1';

      const header = document.createElement('div');
      header.className =
        'flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between';

      const heading = document.createElement('div');
      heading.className = 'min-w-0 md:max-w-2xl';

      const courseTitle = document.createElement('h3');
      courseTitle.className =
        'text-[15px] font-semibold tracking-tight text-slate-950';
      courseTitle.textContent =
        course.title.trim().length > 0
          ? course.title
          : i18n.t('learningStudio.home.courseTitleFallback');

      const description = document.createElement('p');
      description.className = 'mt-1.5 text-[13px] leading-6 text-slate-500';
      description.textContent =
        course.description.trim().length > 0
          ? course.description
          : i18n.t('learningStudio.home.courseDescriptionFallback');

      heading.append(courseTitle, description);

      const side = document.createElement('div');
      side.className =
        'flex shrink-0 items-start gap-2.5 md:flex-col md:items-end md:text-right';

      const status = PillBadge({
        label: i18n.t(`learningStudio.status.${course.lifecycleState}`),
        tone: this.getCourseStatusBadgeTone(course.lifecycleState),
        size: 'sm',
        uppercase: true,
        dataRole: 'learning-studio-home-course-status',
      });

      const updated = document.createElement('span');
      updated.className = timestampTextClass;
      updated.textContent = i18n.t('learningStudio.home.updatedAt', {
        date: formatter.format(new Date(course.updatedAt)),
      });

      side.append(status, updated);
      header.append(heading, side);

      const meta = document.createElement('div');
      meta.className = 'mt-2.5 flex flex-wrap items-center gap-2.5';

      [
        i18n.t('learningStudio.home.courseStatsModules', {
          count: String(course.moduleCount),
        }),
        i18n.t('learningStudio.home.courseStatsUnits', {
          count: String(course.unitCount),
        }),
      ].forEach((text) => {
        const item = document.createElement('span');
        item.className = rowMetaClass;
        item.textContent = text;
        meta.append(item);
      });

      content.append(header, meta);
      row.append(statusBar, content);
      list.append(row);
    });

    section.append(list);
    return section;
  }

  private getCourseStatusBadgeTone(
    state: LearningStudioHomeCourseCard['lifecycleState']
  ): 'info' | 'success' | 'danger' {
    switch (state) {
      case 'published':
        return 'success';
      case 'archived':
        return 'danger';
      case 'draft':
      default:
        return 'info';
    }
  }

  private getCourseStatusBarClass(
    state: LearningStudioHomeCourseCard['lifecycleState']
  ): string {
    switch (state) {
      case 'published':
        return 'bg-emerald-400';
      case 'archived':
        return 'bg-rose-400';
      case 'draft':
      default:
        return 'bg-sky-400';
    }
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
