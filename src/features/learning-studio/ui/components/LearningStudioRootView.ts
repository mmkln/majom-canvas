import { Button } from '../../../../ui-lib/src/components/Button.ts';
import { Checkbox } from '../../../../ui-lib/src/components/Checkbox.ts';
import { Input } from '../../../../ui-lib/src/components/Input.ts';
import { Textarea } from '../../../../ui-lib/src/components/Textarea.ts';
import type { AppRuntime } from '../../../../app-runtime/index.ts';
import {
  LearningStudioAccessView,
  type LearningStudioAccessParticipant,
} from './LearningStudioAccessView.ts';
import { LearningStudioSettingsView } from './LearningStudioSettingsView.ts';
import type {
  LearningCourse,
  LearningCourseLearnerProgressSummary,
  LearningCourseLearnerSnapshot,
  LearningCourseModule,
  LearningLesson,
  LearningLessonLearnerState,
  LearningLessonType,
  LearningRecommendedLearnerStep,
  LearningProgressState,
  LearningStudioLocalStateV1,
  LearningStudioRoute,
  LearningStudioSelectedElementKind,
  LearningStudioUiStateV1,
} from '../../domain/types.ts';

type LearningStudioRootViewOptions = {
  runtime: AppRuntime;
  state: LearningStudioLocalStateV1;
  uiState: LearningStudioUiStateV1;
  onCreateManualCourse: () => void;
  onCreateAiCourse: () => void;
  onCreateModule: (courseId: string) => void;
  onCreateLesson: (moduleId: string, type: LearningLessonType) => void;
  onRouteChange: (route: LearningStudioRoute) => void;
  onSelectCourse: (courseId: string, route?: LearningStudioRoute) => void;
  onSelectElement: (
    kind: LearningStudioSelectedElementKind,
    id: string
  ) => void;
  onUpdateCourse: (
    courseId: string,
    patch: Partial<Pick<LearningCourse, 'title' | 'description' | 'audience'>>
  ) => void;
  onUpdateModule: (
    moduleId: string,
    patch: Partial<Pick<LearningCourseModule, 'title'>>
  ) => void;
  onUpdateLesson: (
    lessonId: string,
    patch: Partial<Pick<LearningLesson, 'title' | 'description' | 'type'>>
  ) => void;
  onUpdateLessonPrerequisites?: (
    lessonId: string,
    prerequisiteIds: string[]
  ) => void;
  onMoveModule: (moduleId: string, dx: number, dy: number) => void;
  onFocusLesson: (lessonId: string) => void;
  onSetLessonProgress: (
    lessonId: string,
    state: LearningProgressState
  ) => void;
  onInviteLearner?: (courseId: string) => void;
  onCopyShareLink?: (courseId: string) => void;
  onRevokeAccess?: (courseId: string, learnerRef: string) => void;
  onPublishCourse?: (courseId: string) => void;
  onArchiveCourse?: (courseId: string) => void;
  onDuplicateCourse?: (courseId: string) => void;
  getCourseLearnerSnapshot?: (
    courseId: string,
    learnerRef?: string
  ) => LearningCourseLearnerSnapshot | null;
  getCourseLearnerProgressSummary?: (
    courseId: string,
    learnerRef?: string
  ) => LearningCourseLearnerProgressSummary | null;
  getRecommendedNextLearnerStep?: (
    courseId: string,
    learnerRef?: string
  ) => LearningRecommendedLearnerStep | null;
  getLessonLearnerState?: (
    lessonId: string,
    learnerRef?: string
  ) => LearningLessonLearnerState | null;
};

export class LearningStudioRootView {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioRootViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'flex h-full w-full flex-col overflow-hidden bg-slate-50 text-slate-900';
    this.render();
  }

  public update(options: LearningStudioRootViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const { i18n } = this.options.runtime;

    const header = document.createElement('header');
    header.className =
      'border-b border-slate-200 bg-white px-6 py-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]';

    const headerTop = document.createElement('div');
    headerTop.className =
      'flex flex-col gap-4 md:flex-row md:items-start md:justify-between';

    const heading = document.createElement('div');
    heading.className = 'space-y-1';

    const eyebrow = document.createElement('p');
    eyebrow.className =
      'text-xs font-semibold uppercase tracking-[0.24em] text-sky-700';
    eyebrow.textContent = i18n.t('learningStudio.eyebrow');

    const title = document.createElement('h1');
    title.className = 'text-2xl font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'max-w-3xl text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.subtitle');

    heading.append(eyebrow, title, subtitle);
    headerTop.append(heading);
    header.append(headerTop);

    const content = document.createElement('main');
    content.className = 'min-h-0 flex-1 overflow-auto px-6 py-6';
    content.append(this.renderRedesignPlaceholder());
    this.element.replaceChildren(header, content);
  }

  private renderRedesignPlaceholder(): HTMLElement {
    const { i18n } = this.options.runtime;
    const wrapper = document.createElement('section');
    wrapper.className = 'mx-auto flex min-h-[70vh] w-full max-w-4xl items-center';

    const card = document.createElement('article');
    card.className =
      'w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_45px_rgba(15,23,42,0.08)] md:p-10';
    card.dataset.role = 'learning-studio-redesign-placeholder';

    const badge = document.createElement('p');
    badge.className =
      'inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-900';
    badge.textContent = i18n.t('learningStudio.redesign.badge');

    const title = document.createElement('h2');
    title.className =
      'mt-6 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl';
    title.textContent = i18n.t('learningStudio.redesign.title');

    const body = document.createElement('p');
    body.className = 'mt-4 max-w-3xl text-base leading-7 text-slate-600';
    body.textContent = i18n.t('learningStudio.redesign.body');

    const notes = document.createElement('div');
    notes.className = 'mt-8 grid gap-3 md:grid-cols-2';

    [
      i18n.t('learningStudio.redesign.noteJourney'),
      i18n.t('learningStudio.redesign.noteAuthoring'),
      i18n.t('learningStudio.redesign.notePreview'),
      i18n.t('learningStudio.redesign.noteCanvas'),
    ].forEach((text) => {
      const item = document.createElement('div');
      item.className =
        'rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700';
      item.textContent = text;
      notes.append(item);
    });

    const footer = document.createElement('p');
    footer.className = 'mt-8 text-sm leading-6 text-slate-500';
    footer.textContent = i18n.t('learningStudio.redesign.footer');

    card.append(badge, title, body, notes, footer);
    wrapper.append(card);
    return wrapper;
  }

  private renderExperienceRail(
    selectedCourse: LearningCourse | null
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const aside = document.createElement('aside');
    aside.className = 'space-y-4 xl:sticky xl:top-6 xl:self-start';

    const startCard = this.createSurfaceCard();
    startCard.classList.add('space-y-4');
    const startHeader = document.createElement('div');
    startHeader.className = 'space-y-1';
    const startTitle = document.createElement('h2');
    startTitle.className = 'text-base font-semibold text-slate-950';
    startTitle.textContent = i18n.t('learningStudio.title');
    const startBody = document.createElement('p');
    startBody.className = 'text-sm leading-6 text-slate-600';
    startBody.textContent = i18n.t('learningStudio.subtitle');
    startHeader.append(startTitle, startBody);

    const startActions = document.createElement('div');
    startActions.className = 'grid gap-2';
    const createManualButton = new Button({
      text: i18n.t('learningStudio.actions.createManual'),
      variant: 'accent',
      onClick: () => this.options.onCreateManualCourse(),
      className: 'w-full justify-center',
    });
    const createAiButton = new Button({
      text: i18n.t('learningStudio.actions.createAi'),
      variant: 'secondary',
      onClick: () => this.options.onCreateAiCourse(),
      className: 'w-full justify-center',
    });
    createManualButton.getElement().dataset.role =
      'learning-studio-rail-create-manual';
    createAiButton.getElement().dataset.role = 'learning-studio-rail-create-ai';
    startActions.append(
      createManualButton.getElement(),
      createAiButton.getElement()
    );
    startCard.append(startHeader, startActions);
    aside.append(startCard);

    aside.append(this.renderCourseLibraryCard(selectedCourse));

    if (selectedCourse && this.options.uiState.route !== 'home') {
      aside.append(this.renderSelectedCourseSummaryCard(selectedCourse));
    }

    return aside;
  }

  private renderSelectedCourseSummaryCard(
    selectedCourse: LearningCourse
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = this.createSurfaceCard();
    card.classList.add('space-y-4');

    const header = document.createElement('div');
    header.className = 'space-y-2';
    const label = document.createElement('p');
    label.className = 'text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';
    label.textContent = i18n.t('learningStudio.inspector.course');
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = selectedCourse.title;
    const description = document.createElement('p');
    description.className = 'text-sm leading-6 text-slate-600';
    description.textContent =
      selectedCourse.description.trim() ||
      i18n.t('learningStudio.home.courseDescriptionFallback');
    header.append(
      label,
      title,
      this.createMetaBadge(this.getCourseStatusLabel(selectedCourse.status)),
      description
    );

    const stats = document.createElement('div');
    stats.className = 'grid gap-3 grid-cols-3';
    [
      [
        i18n.t('learningStudio.summary.modules'),
        String(this.getModulesForCourse(selectedCourse.id).length),
      ],
      [
        i18n.t('learningStudio.summary.lessons'),
        String(this.getLessonsForCourse(selectedCourse.id).length),
      ],
      [
        i18n.t('learningStudio.settings.learnerCount'),
        String(this.getActiveLearnerCount(selectedCourse.id)),
      ],
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement('div');
      item.className = 'rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3';
      const labelEl = document.createElement('p');
      labelEl.className = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500';
      labelEl.textContent = labelText;
      const valueEl = document.createElement('p');
      valueEl.className = 'mt-1 text-lg font-semibold text-slate-950';
      valueEl.textContent = valueText;
      item.append(labelEl, valueEl);
      stats.append(item);
    });

    card.append(header, stats);
    return card;
  }

  private renderCourseLibraryCard(
    selectedCourse: LearningCourse | null
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = this.createSurfaceCard();
    card.classList.add('space-y-3');

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className =
      'text-sm font-semibold uppercase tracking-[0.14em] text-slate-500';
    title.textContent = i18n.t('learningStudio.home.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.home.subtitle');
    header.append(title, subtitle);

    const homeButton = new Button({
      text: i18n.t('learningStudio.home.viewAll'),
      variant: this.options.uiState.route === 'home' ? 'accent' : 'secondary',
      onClick: () => this.options.onRouteChange('home'),
      className: 'w-full justify-start',
    });
    homeButton.getElement().dataset.role = 'learning-studio-nav-home';

    const list = document.createElement('div');
    list.className = 'space-y-2';
    if (this.options.state.courses.length === 0) {
      const empty = document.createElement('p');
      empty.className =
        'rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm leading-6 text-slate-600';
      empty.textContent = i18n.t('learningStudio.home.emptyTitle');
      list.append(empty);
    } else {
      this.options.state.courses.forEach((course) => {
        const button = new Button({
          variant:
            selectedCourse?.id === course.id &&
            this.options.uiState.route !== 'home'
              ? 'accent'
              : 'secondary',
          onClick: () => this.options.onSelectCourse(course.id, 'overview'),
          className:
            'h-auto w-full justify-start px-4 py-3 text-left whitespace-normal',
          children: this.createCourseLibraryButtonContent(course),
        });
        button.getElement().dataset.role = `learning-studio-course-${course.id}`;
        list.append(button.getElement());
      });
    }

    card.append(header, homeButton.getElement(), list);
    return card;
  }

  private createCourseLibraryButtonContent(course: LearningCourse): HTMLElement {
    const content = document.createElement('div');
    content.className = 'flex min-w-0 flex-col items-start gap-1';
    const title = document.createElement('span');
    title.className = 'text-sm font-semibold';
    title.textContent = course.title;
    const subtitle = document.createElement('span');
    subtitle.className = 'whitespace-normal text-xs leading-5 text-slate-500';
    subtitle.textContent = [
      this.getCourseStatusLabel(course.status),
      this.options.runtime.i18n.t('learningStudio.home.courseStats', {
        modules: String(this.getModulesForCourse(course.id).length),
        lessons: String(this.getLessonsForCourse(course.id).length),
      }),
    ].join(' · ');
    content.append(title, subtitle);
    return content;
  }

  private getRouteDescription(
    route: LearningStudioRoute,
    selectedCourse: LearningCourse | null
  ): string {
    const { i18n } = this.options.runtime;
    switch (route) {
      case 'overview':
        return i18n.t('learningStudio.overview.subtitle');
      case 'build':
        return i18n.t('learningStudio.authoring.canvasBody');
      case 'learn':
        return i18n.t('learningStudio.learner.subtitle');
      case 'access':
        return selectedCourse
          ? i18n.t('learningStudio.access.subtitle', {
              courseTitle: selectedCourse.title,
            })
          : i18n.t('learningStudio.access.emptyBody');
      case 'settings':
        return selectedCourse
          ? i18n.t('learningStudio.settings.subtitle')
          : i18n.t('learningStudio.settings.emptyBody');
      case 'home':
      default:
        return i18n.t('learningStudio.home.subtitle');
    }
  }

  private getCreatorRouteLabel(route: LearningStudioRoute): string {
    const { i18n } = this.options.runtime;
    switch (route) {
      case 'learn':
        return i18n.t('learningStudio.overview.learnCta');
      case 'access':
        return i18n.t('learningStudio.overview.shareCta');
      case 'build':
        return i18n.t('learningStudio.nav.build');
      case 'overview':
        return i18n.t('learningStudio.nav.overview');
      case 'settings':
        return i18n.t('learningStudio.nav.settings');
      case 'home':
      default:
        return i18n.t('learningStudio.nav.home');
    }
  }

  private renderCourseStageShell(
    selectedCourse: LearningCourse,
    stage: Exclude<LearningStudioRoute, 'home'>,
    content: HTMLElement
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = 'space-y-4';
    section.append(this.renderCourseStageHeader(selectedCourse, stage), content);
    return section;
  }

  private renderCourseStageHeader(
    selectedCourse: LearningCourse,
    stage: Exclude<LearningStudioRoute, 'home'>
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = this.createSurfaceCard();
    card.classList.add('space-y-4');
    card.dataset.role = `learning-studio-stage-${stage}`;

    const top = document.createElement('div');
    top.className =
      'flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between';

    const heading = document.createElement('div');
    heading.className = 'space-y-2';
    const eyebrow = document.createElement('p');
    eyebrow.className =
      'text-xs font-semibold uppercase tracking-[0.14em] text-sky-700';
    eyebrow.textContent = this.getCreatorRouteLabel(stage);
    const title = document.createElement('h2');
    title.className = 'text-2xl font-semibold tracking-tight text-slate-950';
    title.textContent = selectedCourse.title;
    const description = document.createElement('p');
    description.className = 'max-w-3xl text-sm leading-6 text-slate-600';
    description.textContent = this.getRouteDescription(stage, selectedCourse);
    heading.append(eyebrow, title, description);

    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap items-center gap-2 xl:justify-end';
    if (stage === 'overview') {
      actions.append(
        new Button({
          text: i18n.t('learningStudio.overview.buildCta'),
          variant: 'accent',
          onClick: () => this.options.onRouteChange('build'),
        }).getElement(),
        new Button({
          text: i18n.t('learningStudio.overview.learnCta'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('learn'),
        }).getElement()
      );
    } else if (stage === 'build') {
      const addModuleButton = new Button({
        text: i18n.t('learningStudio.actions.addModule'),
        variant: 'accent',
        onClick: () => this.options.onCreateModule(selectedCourse.id),
      });
      addModuleButton.getElement().dataset.role = 'learning-studio-header-add-module';
      actions.append(
        addModuleButton.getElement(),
        new Button({
          text: i18n.t('learningStudio.overview.learnCta'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('learn'),
        }).getElement()
      );
    } else if (stage === 'learn') {
      actions.append(
        new Button({
          text: i18n.t('learningStudio.overview.buildCta'),
          variant: 'accent',
          onClick: () => this.options.onRouteChange('build'),
        }).getElement(),
        new Button({
          text: i18n.t('learningStudio.overview.shareCta'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('access'),
        }).getElement()
      );
    } else if (stage === 'access') {
      actions.append(
        new Button({
          text: i18n.t('learningStudio.nav.overview'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('overview'),
        }).getElement(),
        new Button({
          text: i18n.t('learningStudio.nav.settings'),
          variant: 'ghost',
          onClick: () => this.options.onRouteChange('settings'),
        }).getElement()
      );
    } else if (stage === 'settings') {
      actions.append(
        new Button({
          text: i18n.t('learningStudio.nav.overview'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('overview'),
        }).getElement(),
        new Button({
          text: i18n.t('learningStudio.overview.shareCta'),
          variant: 'ghost',
          onClick: () => this.options.onRouteChange('access'),
        }).getElement()
      );
    }
    top.append(heading, actions);

    const metaRow = document.createElement('div');
    metaRow.className = 'flex flex-wrap gap-2';
    metaRow.append(
      this.createMetaBadge(this.getCourseStatusLabel(selectedCourse.status)),
      this.createStatusPill(
        i18n.t('learningStudio.home.courseStats', {
          modules: String(this.getModulesForCourse(selectedCourse.id).length),
          lessons: String(this.getLessonsForCourse(selectedCourse.id).length),
        }),
        'muted'
      )
    );
    if (selectedCourse.audience.trim().length > 0) {
      metaRow.append(
        this.createStatusPill(selectedCourse.audience.trim(), 'muted')
      );
    }

    const workflow = document.createElement('div');
    workflow.className =
      'flex flex-col gap-3 border-t border-slate-200 pt-4 xl:flex-row xl:items-center xl:justify-between';

    const primary = document.createElement('div');
    primary.className = 'flex flex-wrap gap-2';
    (['overview', 'build', 'learn'] as const).forEach((route) => {
      const button = new Button({
        text: this.getCreatorRouteLabel(route),
        variant: stage === route ? 'accent' : 'secondary',
        size: 'sm',
        onClick: () => this.options.onRouteChange(route),
      });
      button.getElement().dataset.role = `learning-studio-nav-${route}`;
      primary.append(button.getElement());
    });

    const secondary = document.createElement('div');
    secondary.className = 'flex flex-wrap gap-2';
    (['access', 'settings'] as const).forEach((route) => {
      const button = new Button({
        text: this.getCreatorRouteLabel(route),
        variant: stage === route ? 'accent' : 'ghost',
        size: 'sm',
        onClick: () => this.options.onRouteChange(route),
      });
      button.getElement().dataset.role = `learning-studio-nav-${route}`;
      secondary.append(button.getElement());
    });

    workflow.append(primary, secondary);
    card.append(top, metaRow, workflow);
    return card;
  }

  private renderHomeView(): HTMLElement {
    const { i18n } = this.options.runtime;
    const { state } = this.options;
    const section = document.createElement('div');
    section.className = 'space-y-4';

    if (state.courses.length === 0) {
      const emptyCard = this.createPlaceholderCard(
        i18n.t('learningStudio.home.emptyTitle'),
        i18n.t('learningStudio.home.emptyBody')
      );
      const actions = document.createElement('div');
      actions.className = 'mt-4 flex flex-wrap gap-2';
      const createManualButton = new Button({
        text: i18n.t('learningStudio.actions.createManual'),
        variant: 'accent',
        size: 'sm',
        onClick: () => this.options.onCreateManualCourse(),
      });
      const createAiButton = new Button({
        text: i18n.t('learningStudio.actions.createAi'),
        variant: 'secondary',
        size: 'sm',
        onClick: () => this.options.onCreateAiCourse(),
      });
      createManualButton.getElement().dataset.role =
        'learning-studio-empty-create-manual';
      createAiButton.getElement().dataset.role =
        'learning-studio-empty-create-ai';
      actions.append(
        createManualButton.getElement(),
        createAiButton.getElement()
      );
      emptyCard.append(actions);
      section.append(emptyCard);
      return section;
    }

    const heading = this.createSurfaceCard();
    heading.classList.add('space-y-4');
    const headingCopy = document.createElement('div');
    headingCopy.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.home.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.home.subtitle');
    headingCopy.append(title, subtitle);
    const headingActions = document.createElement('div');
    headingActions.className = 'flex flex-wrap gap-2';
    const createManualButton = new Button({
      text: i18n.t('learningStudio.actions.createManual'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onCreateManualCourse(),
    });
    const createAiButton = new Button({
      text: i18n.t('learningStudio.actions.createAi'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onCreateAiCourse(),
    });
    headingActions.append(
      createManualButton.getElement(),
      createAiButton.getElement()
    );
    heading.append(headingCopy, headingActions);
    section.append(heading);

    const list = document.createElement('div');
    list.className = 'grid gap-4 xl:grid-cols-2';
    state.courses.forEach((course) => {
      list.append(this.createCourseCard(course));
    });
    section.append(list);
    return section;
  }

  private renderOverviewView(selectedCourse: LearningCourse | null): HTMLElement {
    const { i18n } = this.options.runtime;
    if (!selectedCourse) {
      return this.createPlaceholderCard(
        i18n.t('learningStudio.overview.emptyTitle'),
        i18n.t('learningStudio.overview.emptyBody')
      );
    }

    const section = document.createElement('div');
    section.className = 'space-y-4';

    const insightGrid = document.createElement('div');
    insightGrid.className = 'grid gap-4 xl:grid-cols-3';
    [
      [
        i18n.t('learningStudio.summary.modules'),
        String(this.getModulesForCourse(selectedCourse.id).length),
        i18n.t('learningStudio.summary.modulesHint'),
      ],
      [
        i18n.t('learningStudio.summary.lessons'),
        String(this.getLessonsForCourse(selectedCourse.id).length),
        i18n.t('learningStudio.summary.lessonsHint'),
      ],
      [
        i18n.t('learningStudio.settings.learnerCount'),
        String(this.getActiveLearnerCount(selectedCourse.id)),
        i18n.t('learningStudio.overview.learnerHint'),
      ],
    ].forEach(([label, value, helper]) => {
      insightGrid.append(this.createSummaryCard(label, value, helper));
    });
    section.append(insightGrid);

    const contentGrid = document.createElement('div');
    contentGrid.className = 'grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]';

    const structure = this.createSurfaceCard();
    structure.classList.add('space-y-4');
    const structureHeader = document.createElement('div');
    structureHeader.className = 'space-y-1';
    const structureTitle = document.createElement('h3');
    structureTitle.className = 'text-lg font-semibold text-slate-950';
    structureTitle.textContent = i18n.t('learningStudio.overview.structureTitle');
    const structureSubtitle = document.createElement('p');
    structureSubtitle.className = 'text-sm leading-6 text-slate-600';
    structureSubtitle.textContent = i18n.t('learningStudio.overview.structureSubtitle');
    structureHeader.append(structureTitle, structureSubtitle);

    const moduleList = document.createElement('div');
    moduleList.className = 'space-y-3';
    const modules = this.getModulesForCourse(selectedCourse.id);
    if (modules.length === 0) {
      moduleList.append(
        this.createPlaceholderCard(
          i18n.t('learningStudio.overview.structureEmptyTitle'),
          i18n.t('learningStudio.overview.structureEmptyBody')
        )
      );
    } else {
      modules.forEach((module) => {
        const moduleCard = document.createElement('article');
        moduleCard.className =
          'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';
        const moduleTop = document.createElement('div');
        moduleTop.className = 'flex flex-wrap items-start justify-between gap-3';
        const moduleHeading = document.createElement('div');
        moduleHeading.className = 'space-y-1';
        const moduleTitle = document.createElement('h4');
        moduleTitle.className = 'text-base font-semibold text-slate-950';
        moduleTitle.textContent = module.title;
        const moduleMeta = document.createElement('p');
        moduleMeta.className = 'text-sm text-slate-600';
        moduleMeta.textContent = i18n.t('learningStudio.overview.moduleLessons', {
          count: String(this.getLessonsForModule(module.id).length),
        });
        moduleHeading.append(moduleTitle, moduleMeta);
        const openBuild = new Button({
          text: i18n.t('learningStudio.overview.openModuleCta'),
          variant: 'secondary',
          size: 'sm',
          onClick: () => {
            this.options.onRouteChange('build');
            this.options.onSelectElement('module', module.id);
          },
        });
        moduleTop.append(moduleHeading, openBuild.getElement());

        const lessons = document.createElement('div');
        lessons.className = 'mt-3 flex flex-wrap gap-2';
        this.getLessonsForModule(module.id).forEach((lesson) => {
          lessons.append(
            this.createStatusPill(this.getLessonTypeLabel(lesson.type), 'muted')
          );
        });
        moduleCard.append(moduleTop, lessons);
        moduleList.append(moduleCard);
      });
    }

    structure.append(structureHeader, moduleList);

    const nextCard = this.createSurfaceCard();
    nextCard.classList.add('space-y-4');
    const nextHeader = document.createElement('div');
    nextHeader.className = 'space-y-1';
    const nextTitle = document.createElement('h3');
    nextTitle.className = 'text-lg font-semibold text-slate-950';
    nextTitle.textContent = i18n.t('learningStudio.overview.nextTitle');
    const nextSubtitle = document.createElement('p');
    nextSubtitle.className = 'text-sm leading-6 text-slate-600';
    nextSubtitle.textContent = i18n.t('learningStudio.overview.nextSubtitle');
    nextHeader.append(nextTitle, nextSubtitle);

    const nextActions = document.createElement('div');
    nextActions.className = 'space-y-3';
    [
      {
        title: i18n.t('learningStudio.overview.nextBuildTitle'),
        body: i18n.t('learningStudio.overview.nextBuildBody'),
        action: new Button({
          text: i18n.t('learningStudio.overview.buildCta'),
          variant: 'accent',
          onClick: () => this.options.onRouteChange('build'),
          className: 'w-full justify-center',
        }).getElement(),
      },
      {
        title: i18n.t('learningStudio.overview.nextLearnTitle'),
        body: i18n.t('learningStudio.overview.nextLearnBody'),
        action: new Button({
          text: i18n.t('learningStudio.overview.learnCta'),
          variant: 'secondary',
          onClick: () => this.options.onRouteChange('learn'),
          className: 'w-full justify-center',
        }).getElement(),
      },
      {
        title: i18n.t('learningStudio.overview.nextManageTitle'),
        body: i18n.t('learningStudio.overview.nextManageBody'),
        action: new Button({
          text: i18n.t('learningStudio.overview.manageCta'),
          variant: 'ghost',
          onClick: () => this.options.onRouteChange('settings'),
          className: 'w-full justify-center',
        }).getElement(),
      },
    ].forEach(({ title: stepTitleText, body: stepBodyText, action }) => {
      const item = document.createElement('article');
      item.className = 'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';
      const stepTitle = document.createElement('p');
      stepTitle.className = 'text-sm font-semibold text-slate-950';
      stepTitle.textContent = stepTitleText;
      const stepBody = document.createElement('p');
      stepBody.className = 'mt-1 text-sm leading-6 text-slate-600';
      stepBody.textContent = stepBodyText;
      item.append(stepTitle, stepBody, action);
      nextActions.append(item);
    });

    nextCard.append(nextHeader, nextActions);

    contentGrid.append(structure, nextCard);
    section.append(contentGrid);

    return this.renderCourseStageShell(selectedCourse, 'overview', section);
  }

  private renderAuthoringView(selectedCourse: LearningCourse | null): HTMLElement {
    const { i18n } = this.options.runtime;
    if (!selectedCourse) {
      return this.createPlaceholderCard(
        i18n.t('learningStudio.authoring.emptyTitle'),
        i18n.t('learningStudio.authoring.emptyBody')
      );
    }

    const modules = this.getModulesForCourse(selectedCourse.id);
    const selectedModule = this.getSelectedModule();
    const selectedLesson = this.getSelectedLesson();

    const wrapper = document.createElement('div');
    wrapper.className = 'grid gap-4 2xl:grid-cols-[300px_minmax(0,1fr)]';

    const mainColumn = document.createElement('div');
    mainColumn.className = 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]';
    mainColumn.append(
      this.renderAuthoringCanvas(selectedCourse, modules),
      this.renderAuthoringInspector(selectedCourse, selectedModule, selectedLesson)
    );

    wrapper.append(
      this.renderAuthoringOutline(selectedCourse, modules),
      mainColumn
    );
    return this.renderCourseStageShell(selectedCourse, 'build', wrapper);
  }

  private renderAuthoringOutline(
    selectedCourse: LearningCourse,
    modules: LearningCourseModule[]
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = this.createSurfaceCard();
    card.classList.add('space-y-4');

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.authoring.outlineTitle');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.authoring.outlineSubtitle');
    header.append(title, subtitle);

    const list = document.createElement('div');
    list.className = 'space-y-3';

    if (modules.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600';
      empty.textContent = i18n.t('learningStudio.authoring.outlineEmpty');
      list.append(empty);
    } else {
      modules.forEach((module) => {
        const moduleWrap = document.createElement('div');
        moduleWrap.className =
          'rounded-xl border border-slate-200 bg-slate-50/80 p-3';

        const moduleButton = new Button({
          text: module.title,
          variant:
            this.options.uiState.selectedElementKind === 'module' &&
            this.options.uiState.selectedElementId === module.id
              ? 'accent'
              : 'secondary',
          size: 'sm',
          onClick: () => this.options.onSelectElement('module', module.id),
        });
        moduleWrap.append(moduleButton.getElement());

        const lessons = this.getLessonsForModule(module.id);
        const lessonsList = document.createElement('div');
        lessonsList.className = 'mt-3 space-y-2 pl-2';
        lessons.forEach((lesson) => {
        const lessonButton = new Button({
          text: `${this.getLessonTypeLabel(lesson.type)} · ${lesson.title}${this.getLessonPrerequisiteSuffix(
            lesson
          )}`,
          variant:
            this.options.uiState.selectedElementKind === 'lesson' &&
            this.options.uiState.selectedElementId === lesson.id
                ? 'accent'
                : 'ghost',
            size: 'sm',
            onClick: () => this.options.onSelectElement('lesson', lesson.id),
          });
          lessonsList.append(lessonButton.getElement());
        });

        moduleWrap.append(lessonsList);
        list.append(moduleWrap);
      });
    }

    card.append(header, list);
    return card;
  }

  private renderAuthoringCanvas(
    selectedCourse: LearningCourse,
    modules: LearningCourseModule[]
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const shell = this.createSurfaceCard();
    shell.classList.add('space-y-4');

    const header = document.createElement('div');
    header.className = 'space-y-1';

    const heading = document.createElement('div');
    heading.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.authoring.canvasTitle');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.authoring.canvasBody');
    heading.append(title, subtitle);

    header.append(heading);

    const workspace = document.createElement('div');
    workspace.className = 'space-y-4';
    workspace.dataset.role = 'learning-studio-authoring-workspace';

    const courseOverview = document.createElement('section');
    courseOverview.className =
      'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';
    const courseTitle = document.createElement('h3');
    courseTitle.className = 'text-lg font-semibold text-slate-950';
    courseTitle.textContent = selectedCourse.title;
    const courseMeta = document.createElement('p');
    courseMeta.className = 'mt-2 text-sm leading-6 text-slate-600';
    courseMeta.textContent =
      selectedCourse.description.trim() ||
      i18n.t('learningStudio.home.courseDescriptionFallback');
    const courseStats = document.createElement('div');
    courseStats.className = 'mt-4 grid gap-3 md:grid-cols-3';
    [
      [
        i18n.t('learningStudio.summary.modules'),
        String(modules.length),
        i18n.t('learningStudio.summary.modulesHint'),
      ],
      [
        i18n.t('learningStudio.summary.lessons'),
        String(this.getLessonsForCourse(selectedCourse.id).length),
        i18n.t('learningStudio.summary.lessonsHint'),
      ],
      [
        i18n.t('learningStudio.fields.audience'),
        selectedCourse.audience.trim() || i18n.t('learningStudio.authoring.emptyAudience'),
        i18n.t('learningStudio.authoring.audienceHint'),
      ],
    ].forEach(([label, value, helper]) => {
      courseStats.append(this.createSummaryCard(label, value, helper));
    });
    courseOverview.append(courseTitle, courseMeta, courseStats);

    workspace.append(courseOverview);

    if (modules.length === 0) {
      const empty = this.createPlaceholderCard(
        i18n.t('learningStudio.authoring.canvasTitle'),
        i18n.t('learningStudio.authoring.canvasEmpty')
      );
      const emptyActions = document.createElement('div');
      emptyActions.className = 'mt-4 flex flex-wrap gap-2';
      const emptyCreateButton = new Button({
        text: i18n.t('learningStudio.actions.addModule'),
        variant: 'accent',
        size: 'sm',
        onClick: () => this.options.onCreateModule(selectedCourse.id),
      });
      emptyActions.append(emptyCreateButton.getElement());
      empty.append(emptyActions);
      workspace.append(empty);
    } else {
      modules.forEach((module, index) => {
        workspace.append(this.createModuleCanvasCard(module, index));
      });
    }

    const addModuleCard = document.createElement('article');
    addModuleCard.className =
      'rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5';
    const addModuleTitle = document.createElement('h3');
    addModuleTitle.className = 'text-base font-semibold text-slate-950';
    addModuleTitle.textContent = i18n.t('learningStudio.authoring.addModuleTitle');
    const addModuleBody = document.createElement('p');
    addModuleBody.className = 'mt-2 text-sm leading-6 text-slate-600';
    addModuleBody.textContent = i18n.t('learningStudio.authoring.addModuleBody');
    const addModuleActions = document.createElement('div');
    addModuleActions.className = 'mt-4';
    const addAnotherModuleButton = new Button({
      text: i18n.t('learningStudio.actions.addModule'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onCreateModule(selectedCourse.id),
    });
    addModuleActions.append(addAnotherModuleButton.getElement());
    addModuleCard.append(addModuleTitle, addModuleBody, addModuleActions);
    workspace.append(addModuleCard);

    shell.append(header, workspace);
    return shell;
  }

  private renderAuthoringInspector(
    selectedCourse: LearningCourse,
    selectedModule: LearningCourseModule | null,
    selectedLesson: LearningLesson | null
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = this.createSurfaceCard();
    card.classList.add('space-y-4');

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.authoring.inspectorTitle');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.authoring.inspectorSubtitle');
    header.append(title, subtitle);

    card.append(header);

    if (selectedLesson) {
      card.append(this.renderLessonInspector(selectedLesson));
      return card;
    }
    if (selectedModule) {
      card.append(this.renderModuleInspector(selectedModule));
      return card;
    }
    card.append(this.renderCourseInspector(selectedCourse));
    return card;
  }

  private renderCourseInspector(selectedCourse: LearningCourse): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('div');
    section.className = 'space-y-4';

    const badge = this.createMetaBadge(i18n.t('learningStudio.inspector.course'));
    section.append(badge);

    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.title'),
        new Input({
          value: selectedCourse.title,
          placeholder: i18n.t('learningStudio.placeholders.courseTitle'),
          onInput: (value) =>
            this.options.onUpdateCourse(selectedCourse.id, { title: value }),
        }).getElement()
      )
    );
    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.description'),
        new Textarea({
          value: selectedCourse.description,
          rows: 5,
          placeholder: i18n.t('learningStudio.placeholders.courseDescription'),
          onInput: (value) =>
            this.options.onUpdateCourse(selectedCourse.id, {
              description: value,
            }),
        }).getElement()
      )
    );
    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.audience'),
        new Input({
          value: selectedCourse.audience,
          placeholder: i18n.t('learningStudio.placeholders.courseAudience'),
          onInput: (value) =>
            this.options.onUpdateCourse(selectedCourse.id, { audience: value }),
        }).getElement()
      )
    );

    return section;
  }

  private renderModuleInspector(selectedModule: LearningCourseModule): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('div');
    section.className = 'space-y-4';

    const badge = this.createMetaBadge(i18n.t('learningStudio.inspector.module'));
    section.append(badge);

    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.moduleTitle'),
        new Input({
          value: selectedModule.title,
          placeholder: i18n.t('learningStudio.placeholders.moduleTitle'),
          onInput: (value) =>
            this.options.onUpdateModule(selectedModule.id, { title: value }),
        }).getElement()
      )
    );

    const lessonCount = document.createElement('p');
    lessonCount.className = 'text-sm leading-6 text-slate-600';
    lessonCount.textContent = i18n.t('learningStudio.authoring.lessonCount', {
      count: String(this.getLessonsForModule(selectedModule.id).length),
    });

    section.append(lessonCount);
    return section;
  }

  private renderLessonInspector(selectedLesson: LearningLesson): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('div');
    section.className = 'space-y-4';

    const badge = this.createMetaBadge(i18n.t('learningStudio.inspector.lesson'));
    section.append(badge);

    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.lessonTitle'),
        new Input({
          value: selectedLesson.title,
          placeholder: i18n.t('learningStudio.placeholders.lessonTitle'),
          onInput: (value) =>
            this.options.onUpdateLesson(selectedLesson.id, { title: value }),
        }).getElement()
      )
    );

    section.append(
      this.createLabeledInput(
        i18n.t('learningStudio.fields.lessonDescription'),
        new Textarea({
          value: selectedLesson.description,
          rows: 6,
          placeholder: i18n.t('learningStudio.placeholders.lessonDescription'),
          onInput: (value) =>
            this.options.onUpdateLesson(selectedLesson.id, {
              description: value,
            }),
        }).getElement()
      )
    );

    const typeTitle = document.createElement('p');
    typeTitle.className = 'text-sm font-medium text-slate-700';
    typeTitle.textContent = i18n.t('learningStudio.fields.lessonType');

    const typeRow = document.createElement('div');
    typeRow.className = 'flex flex-wrap gap-2';
    (['lesson', 'exercise', 'checkpoint'] as const).forEach((type) => {
      const button = new Button({
        text: this.getLessonTypeLabel(type),
        variant: selectedLesson.type === type ? 'accent' : 'secondary',
        size: 'sm',
        onClick: () =>
          this.options.onUpdateLesson(selectedLesson.id, { type }),
      });
      typeRow.append(button.getElement());
    });

    const prerequisites = this.renderLessonPrerequisitesEditor(selectedLesson);
    const previewActions = document.createElement('div');
    previewActions.className = 'flex flex-wrap gap-2';
    const previewButton = new Button({
      text: i18n.t('learningStudio.overview.learnCta'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onFocusLesson(selectedLesson.id),
    });
    previewActions.append(previewButton.getElement());

    section.append(typeTitle, typeRow, prerequisites, previewActions);
    return section;
  }

  private renderLearnerView(selectedCourse: LearningCourse | null): HTMLElement {
    const { i18n } = this.options.runtime;
    if (!selectedCourse) {
      return this.createPlaceholderCard(
        i18n.t('learningStudio.learner.emptyTitle'),
        i18n.t('learningStudio.learner.emptyBody')
      );
    }

    const modules = this.getModulesForCourse(selectedCourse.id);
    const learnerSnapshot = this.getCourseLearnerSnapshot(selectedCourse.id);
    const progressSummary = this.getCourseLearnerProgressSummary(selectedCourse.id);
    const recommendedStep = this.getRecommendedNextLearnerStep(selectedCourse.id);
    const focusedLessonId =
      learnerSnapshot?.focusedLessonId ?? this.options.uiState.focusedLessonId;
    const focusedLesson =
      this.options.state.lessons.find(
        (lesson) => lesson.id === focusedLessonId
      ) ?? null;
    const wrapper = document.createElement('div');
    wrapper.className = 'grid gap-4 2xl:grid-cols-[340px_minmax(0,1fr)]';

    const mapCard = this.createSurfaceCard();
    mapCard.classList.add('space-y-4');
    const mapHeader = document.createElement('div');
    mapHeader.className = 'space-y-1';
    const mapTitle = document.createElement('h2');
    mapTitle.className = 'text-lg font-semibold text-slate-950';
    mapTitle.textContent = i18n.t('learningStudio.learner.mapTitle');
    const mapSubtitle = document.createElement('p');
    mapSubtitle.className = 'text-sm text-slate-600';
    mapSubtitle.textContent = i18n.t('learningStudio.learner.mapSubtitle');
    mapHeader.append(mapTitle, mapSubtitle);

    if (progressSummary) {
      mapCard.append(mapHeader, this.renderLearnerProgressOverview(progressSummary));
    } else {
      mapCard.append(mapHeader);
    }

    const mapList = document.createElement('div');
    mapList.className = 'space-y-4';
    modules.forEach((module) => {
      const moduleCard = document.createElement('article');
      moduleCard.className =
        'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';

      const moduleTitle = document.createElement('h3');
      moduleTitle.className = 'text-base font-semibold text-slate-950';
      moduleTitle.textContent = module.title;
      const lessons = this.getLessonsForModule(module.id);
      const lessonsList = document.createElement('div');
      lessonsList.className = 'mt-3 space-y-2';
      lessons.forEach((lesson) => {
        const lessonStatus = this.getLessonLearnerStatus(lesson);
        const lessonButton = new Button({
          text: `${this.getLessonTypeLabel(lesson.type)} · ${lesson.title}${this.getLessonPrerequisiteSuffix(
            lesson
          )}`,
          variant:
            this.options.uiState.focusedLessonId === lesson.id
              ? 'accent'
              : 'secondary',
          size: 'sm',
          onClick: () => this.options.onFocusLesson(lesson.id),
        });
        lessonButton.getElement().classList.add('w-full', 'justify-between');
        lessonsList.append(lessonButton.getElement());

        const metaRow = document.createElement('div');
        metaRow.className = 'px-1 pb-2';
        metaRow.append(this.createStatusPill(lessonStatus.label, lessonStatus.tone));
        lessonsList.append(metaRow);
      });
      moduleCard.append(moduleTitle, lessonsList);
      mapList.append(moduleCard);
    });
    mapCard.append(mapList);

    const focusCard = this.createSurfaceCard();
    focusCard.classList.add('space-y-4');
    const focusHeader = document.createElement('div');
    focusHeader.className = 'space-y-1';
    const focusTitle = document.createElement('h2');
    focusTitle.className = 'text-lg font-semibold text-slate-950';
    focusTitle.textContent = i18n.t('learningStudio.learner.title');
    const focusSubtitle = document.createElement('p');
    focusSubtitle.className = 'text-sm text-slate-600';
    focusSubtitle.textContent = i18n.t('learningStudio.learner.subtitle');
    focusHeader.append(focusTitle, focusSubtitle);
    focusCard.append(focusHeader);
    focusCard.append(this.renderRecommendedNextStep(selectedCourse.id, recommendedStep));

    if (!focusedLesson) {
      focusCard.append(
        this.createPlaceholderCard(
          i18n.t('learningStudio.learner.focusEmptyTitle'),
          i18n.t('learningStudio.learner.focusEmptyBody')
        )
      );
    } else {
      const typeBadge = this.createMetaBadge(
        this.getLessonTypeLabel(focusedLesson.type)
      );
      const title = document.createElement('h3');
      title.className = 'text-2xl font-semibold tracking-tight text-slate-950';
      title.textContent = focusedLesson.title;
      const description = document.createElement('p');
      description.className = 'text-sm leading-6 text-slate-600';
      description.textContent =
        focusedLesson.description.trim() ||
        i18n.t('learningStudio.learner.noLessonDescription');

      const focusedLessonState = this.resolveLessonLearnerState(focusedLesson.id);
      const progressState =
        focusedLessonState?.progressState ??
        this.getLessonProgressState(focusedLesson.id);
      const progressBadge = this.createMetaBadge(
        `${i18n.t('learningStudio.learner.progressLabel')}: ${this.getProgressStateLabel(
          progressState
        )}`
      );
      const lockInfo = this.getLessonLockInfo(focusedLesson);
      const prerequisiteSummary = this.renderPrerequisiteSummary(
        focusedLesson,
        lockInfo
      );
      const progressActions = document.createElement('div');
      progressActions.className = 'flex flex-wrap gap-2';

      if (!lockInfo.locked) {
        ([
          ['in_progress', 'learningStudio.actions.markInProgress'],
          ['completed', 'learningStudio.actions.markCompleted'],
          ['review', 'learningStudio.actions.markReview'],
        ] as const).forEach(([state, key]) => {
          const button = new Button({
            text: i18n.t(key),
            variant: progressState === state ? 'accent' : 'secondary',
            size: 'sm',
            onClick: () =>
              this.options.onSetLessonProgress(focusedLesson.id, state),
          });
          button.getElement().dataset.role = `learning-studio-progress-${state}`;
          progressActions.append(button.getElement());
        });
      } else {
        const note = document.createElement('p');
        note.className =
          'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900';
        note.textContent = this.renderPrerequisiteLockMessage(lockInfo);
        progressActions.append(note);
      }

      focusCard.append(
        typeBadge,
        title,
        description,
        progressBadge,
        prerequisiteSummary,
        progressActions
      );
    }

    wrapper.append(mapCard, focusCard);
    return this.renderCourseStageShell(selectedCourse, 'learn', wrapper);
  }

  private renderAccessView(selectedCourse: LearningCourse | null): HTMLElement {
    const { i18n } = this.options.runtime;
    if (!selectedCourse) {
      return this.createPlaceholderCard(
        i18n.t('learningStudio.access.emptyTitle'),
        i18n.t('learningStudio.access.emptyBody')
      );
    }

    const accessView = new LearningStudioAccessView({
      runtime: this.options.runtime,
      courseTitle: selectedCourse.title,
      shareLink: this.getCourseShareLink(selectedCourse.id),
      participants: this.getCourseParticipants(selectedCourse.id),
      onInviteLearner: () => this.options.onInviteLearner?.(selectedCourse.id),
      onCopyShareLink: () => this.options.onCopyShareLink?.(selectedCourse.id),
      onRevokeAccess: (participantId) =>
        this.options.onRevokeAccess?.(selectedCourse.id, participantId),
    });
    return this.renderCourseStageShell(selectedCourse, 'access', accessView.element);
  }

  private renderSettingsView(selectedCourse: LearningCourse | null): HTMLElement {
    const { i18n } = this.options.runtime;
    if (!selectedCourse) {
      return this.createPlaceholderCard(
        i18n.t('learningStudio.settings.emptyTitle'),
        i18n.t('learningStudio.settings.emptyBody')
      );
    }

    const settingsView = new LearningStudioSettingsView({
      runtime: this.options.runtime,
      courseTitle: selectedCourse.title,
      courseStatusLabel: this.getCourseStatusLabel(selectedCourse.status),
      courseDescription: selectedCourse.description,
      moduleCount: this.getModulesForCourse(selectedCourse.id).length,
      lessonCount: this.getLessonsForCourse(selectedCourse.id).length,
      learnerCount: this.getActiveLearnerCount(selectedCourse.id),
      updatedAt: this.formatTimestamp(selectedCourse.updatedAt),
      publishedAt:
        selectedCourse.status === 'published'
          ? this.formatTimestamp(selectedCourse.updatedAt)
          : null,
      onPublish: () => this.options.onPublishCourse?.(selectedCourse.id),
      onArchive: () => this.options.onArchiveCourse?.(selectedCourse.id),
      onDuplicate: () => this.options.onDuplicateCourse?.(selectedCourse.id),
    });
    return this.renderCourseStageShell(selectedCourse, 'settings', settingsView.element);
  }

  private createCourseCard(course: LearningCourse): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = document.createElement('article');
    card.className =
      'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className =
      'w-full rounded-2xl text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-200';
    preview.addEventListener('click', () =>
      this.options.onSelectCourse(course.id, 'overview')
    );

    const titleWrap = document.createElement('div');
    titleWrap.className = 'space-y-2';
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = course.title;
    const status = this.createMetaBadge(this.getCourseStatusLabel(course.status));
    titleWrap.append(title, status);

    const description = document.createElement('p');
    description.className = 'mt-3 text-sm leading-6 text-slate-600';
    description.textContent =
      course.description.trim() ||
      i18n.t('learningStudio.home.courseDescriptionFallback');

    const stats = document.createElement('p');
    stats.className = 'mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500';
    stats.textContent = i18n.t('learningStudio.home.courseStats', {
      modules: String(this.getModulesForCourse(course.id).length),
      lessons: String(this.getLessonsForCourse(course.id).length),
    });
    const updatedAt = document.createElement('p');
    updatedAt.className = 'mt-2 text-xs text-slate-500';
    updatedAt.textContent = `${i18n.t('learningStudio.settings.updatedAt')}: ${this.formatTimestamp(
      course.updatedAt
    )}`;

    preview.append(titleWrap, description, stats, updatedAt);

    const actions = document.createElement('div');
    actions.className = 'mt-4 flex flex-wrap gap-2';
    const openButton = new Button({
      text: i18n.t('learningStudio.home.openCourseCta'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onSelectCourse(course.id, 'overview'),
    });
    const continueButton = new Button({
      text: i18n.t('learningStudio.overview.buildCta'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onSelectCourse(course.id, 'build'),
    });
    actions.append(
      openButton.getElement(),
      continueButton.getElement()
    );

    card.append(preview, actions);
    return card;
  }

  private createModuleCanvasCard(
    module: LearningCourseModule,
    index: number
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const lessons = this.getLessonsForModule(module.id);

    const card = document.createElement('article');
    card.className =
      'rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]';
    card.dataset.role = 'learning-studio-module-card';

    if (
      this.options.uiState.selectedElementKind === 'module' &&
      this.options.uiState.selectedElementId === module.id
    ) {
      card.classList.add('border-sky-300', 'ring-2', 'ring-sky-100');
    }

    const top = document.createElement('div');
    top.className = 'flex flex-wrap items-start justify-between gap-3';

    const heading = document.createElement('button');
    heading.type = 'button';
    heading.className =
      'min-w-0 text-left text-lg font-semibold text-slate-950 outline-none transition hover:text-sky-700';
    heading.textContent = module.title;
    heading.addEventListener('click', () =>
      this.options.onSelectElement('module', module.id)
    );

    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap gap-2';
    meta.append(
      this.createMetaBadge(
        i18n.t('learningStudio.authoring.lessonCount', {
          count: String(lessons.length),
        })
      ),
      this.createStatusPill(`#${index + 1}`, 'muted')
    );
    top.append(heading, meta);

    const lessonList = document.createElement('div');
    lessonList.className = 'mt-5 grid gap-3 lg:grid-cols-2';
    if (lessons.length === 0) {
      const empty = document.createElement('p');
      empty.className =
        'rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 lg:col-span-2';
      empty.textContent = i18n.t('learningStudio.authoring.lessonsEmpty');
      lessonList.append(empty);
    } else {
      lessons.forEach((lesson) => {
        const lessonCard = document.createElement('article');
        lessonCard.className =
          'rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-sky-300 hover:bg-white';
        if (
          this.options.uiState.selectedElementKind === 'lesson' &&
          this.options.uiState.selectedElementId === lesson.id
        ) {
          lessonCard.classList.add('border-sky-300', 'bg-sky-50/70');
        }

        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'w-full space-y-2 text-left';
        selectButton.addEventListener('click', () =>
          this.options.onSelectElement('lesson', lesson.id)
        );

        const lessonMeta = document.createElement('div');
        lessonMeta.className = 'flex flex-wrap items-center gap-2';
        lessonMeta.append(
          this.createStatusPill(this.getLessonTypeLabel(lesson.type), 'muted')
        );
        if (lesson.prerequisiteIds.length > 0) {
          lessonMeta.append(
            this.createStatusPill(
              i18n.t('learningStudio.authoring.prerequisiteCount', {
                count: String(lesson.prerequisiteIds.length),
              }),
              'warning'
            )
          );
        }

        const title = document.createElement('p');
        title.className = 'text-sm font-semibold text-slate-950';
        title.textContent = lesson.title;

        const description = document.createElement('p');
        description.className = 'text-sm leading-6 text-slate-600';
        description.textContent =
          lesson.description.trim() ||
          i18n.t('learningStudio.learner.noLessonDescription');

        selectButton.append(lessonMeta, title, description);

        const actions = document.createElement('div');
        actions.className = 'mt-4 flex flex-wrap gap-2';
        const openButton = new Button({
          text: i18n.t('learningStudio.actions.openAuthoring'),
          variant: 'secondary',
          size: 'sm',
          onClick: () => this.options.onSelectElement('lesson', lesson.id),
        });
        actions.append(openButton.getElement());

        lessonCard.append(selectButton, actions);
        lessonList.append(lessonCard);
      });
    }

    const actions = document.createElement('div');
    actions.className = 'mt-5 flex flex-wrap gap-2';
    const addLessonButton = new Button({
      text: i18n.t('learningStudio.actions.addLesson'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onCreateLesson(module.id, 'lesson'),
    });
    addLessonButton.getElement().dataset.role = 'learning-studio-add-lesson';
    const addExerciseButton = new Button({
      text: i18n.t('learningStudio.actions.addExercise'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onCreateLesson(module.id, 'exercise'),
    });
    actions.append(addLessonButton.getElement(), addExerciseButton.getElement());

    card.append(top, lessonList, actions);
    return card;
  }

  private createSummaryCard(
    label: string,
    value: string,
    helper: string
  ): HTMLElement {
    const card = document.createElement('article');
    card.className =
      'rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    const labelEl = document.createElement('p');
    labelEl.className = 'text-sm font-medium text-slate-500';
    labelEl.textContent = label;
    const valueEl = document.createElement('p');
    valueEl.className = 'mt-2 text-3xl font-semibold tracking-tight text-slate-950';
    valueEl.textContent = value;
    const helperEl = document.createElement('p');
    helperEl.className = 'mt-2 text-sm leading-5 text-slate-600';
    helperEl.textContent = helper;
    card.append(labelEl, valueEl, helperEl);
    return card;
  }

  private createSurfaceCard(): HTMLDivElement {
    const card = document.createElement('div');
    card.className =
      'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    return card;
  }

  private createPlaceholderCard(titleText: string, bodyText: string): HTMLElement {
    const card = document.createElement('article');
    card.className =
      'rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = titleText;
    const body = document.createElement('p');
    body.className = 'mt-2 max-w-2xl text-sm leading-6 text-slate-600';
    body.textContent = bodyText;
    card.append(title, body);
    return card;
  }

  private createLabeledInput(labelText: string, control: HTMLElement): HTMLElement {
    const field = document.createElement('label');
    field.className = 'block space-y-2';
    const label = document.createElement('span');
    label.className = 'block text-sm font-medium text-slate-700';
    label.textContent = labelText;
    field.append(label, control);
    return field;
  }

  private createMetaBadge(text: string): HTMLSpanElement {
    const badge = document.createElement('span');
    badge.className =
      'inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700';
    badge.textContent = text;
    return badge;
  }

  private setLessonPrerequisites(
    lessonId: string,
    prerequisiteIds: string[]
  ): void {
    if (this.options.onUpdateLessonPrerequisites) {
      this.options.onUpdateLessonPrerequisites(lessonId, prerequisiteIds);
      return;
    }

    this.options.onUpdateLesson(
      lessonId,
      { prerequisiteIds } as unknown as Partial<
        Pick<LearningLesson, 'title' | 'description' | 'type'>
      >
    );
  }

  private getLessonById(lessonId: string): LearningLesson | null {
    return (
      this.options.state.lessons.find((lesson) => lesson.id === lessonId) ?? null
    );
  }

  private getPrerequisiteLessons(lesson: LearningLesson): LearningLesson[] {
    const prerequisiteIds = new Set(lesson.prerequisiteIds);
    return this.options.state.lessons.filter((candidate) =>
      prerequisiteIds.has(candidate.id)
    );
  }

  private getCourseLearnerSnapshot(
    courseId: string
  ): LearningCourseLearnerSnapshot | null {
    return (
      this.options.getCourseLearnerSnapshot?.(
        courseId,
        this.options.uiState.selectedLearnerRef
      ) ?? null
    );
  }

  private getCourseLearnerProgressSummary(
    courseId: string
  ): LearningCourseLearnerProgressSummary | null {
    return (
      this.options.getCourseLearnerProgressSummary?.(
        courseId,
        this.options.uiState.selectedLearnerRef
      ) ?? null
    );
  }

  private getRecommendedNextLearnerStep(
    courseId: string
  ): LearningRecommendedLearnerStep | null {
    return (
      this.options.getRecommendedNextLearnerStep?.(
        courseId,
        this.options.uiState.selectedLearnerRef
      ) ?? null
    );
  }

  private resolveLessonLearnerState(
    lesson: LearningLesson | string
  ): LearningLessonLearnerState | null {
    const lessonId = typeof lesson === 'string' ? lesson : lesson.id;
    return (
      this.options.getLessonLearnerState?.(
        lessonId,
        this.options.uiState.selectedLearnerRef
      ) ?? null
    );
  }

  private getLessonPrerequisiteSuffix(lesson: LearningLesson): string {
    const count = lesson.prerequisiteIds.length;
    return count > 0
      ? ` · ${this.options.runtime.i18n.t('learningStudio.authoring.prerequisiteCount', {
          count: String(count),
        })}`
      : '';
  }

  private getLessonLockInfo(lesson: LearningLesson): {
    locked: boolean;
    prerequisiteLessons: LearningLesson[];
    missingPrerequisiteLessons: LearningLesson[];
  } {
    const prerequisiteLessons = this.getPrerequisiteLessons(lesson);
    const learnerState = this.resolveLessonLearnerState(lesson);
    if (learnerState) {
      const blockedByLessonIds = new Set(learnerState.blockedByLessonIds);
      return {
        locked: learnerState.isLocked,
        prerequisiteLessons,
        missingPrerequisiteLessons: prerequisiteLessons.filter((prerequisite) =>
          blockedByLessonIds.has(prerequisite.id)
        ),
      };
    }
    const missingPrerequisiteLessons = prerequisiteLessons.filter(
      (prerequisite) => this.getLessonProgressState(prerequisite.id) !== 'completed'
    );
    return {
      locked: missingPrerequisiteLessons.length > 0,
      prerequisiteLessons,
      missingPrerequisiteLessons,
    };
  }

  private renderPrerequisiteLockMessage(lockInfo: {
    locked: boolean;
    missingPrerequisiteLessons: LearningLesson[];
  }): string {
    const { i18n } = this.options.runtime;
    if (!lockInfo.locked) {
      return i18n.t('learningStudio.learner.readyBody');
    }
    const missingTitles = lockInfo.missingPrerequisiteLessons.map(
      (lesson) => lesson.title
    );
    return i18n.t('learningStudio.learner.lockedBody', {
      lessons: missingTitles.join(', '),
    });
  }

  private getLessonLearnerStatus(lesson: LearningLesson): {
    label: string;
    tone: 'good' | 'warning' | 'muted';
    locked: boolean;
  } {
    const learnerState = this.resolveLessonLearnerState(lesson);
    const lockInfo = this.getLessonLockInfo(lesson);
    if (learnerState?.isCompleted || this.getLessonProgressState(lesson.id) === 'completed') {
      return {
        label: this.options.runtime.i18n.t('learningStudio.learner.lessonCompleted'),
        tone: 'good',
        locked: false,
      };
    }
    if (learnerState?.isLocked ?? lockInfo.locked) {
      return {
        label: this.options.runtime.i18n.t('learningStudio.learner.lessonLocked'),
        tone: 'warning',
        locked: true,
      };
    }

    const progressState =
      learnerState?.progressState ?? this.getLessonProgressState(lesson.id);
    if (progressState === 'in_progress') {
      return {
        label: this.options.runtime.i18n.t('learningStudio.learner.lessonInProgress'),
        tone: 'warning',
        locked: false,
      };
    }
    if (progressState === 'review') {
      return {
        label: this.options.runtime.i18n.t('learningStudio.learner.lessonReview'),
        tone: 'warning',
        locked: false,
      };
    }

    return {
      label: this.options.runtime.i18n.t('learningStudio.learner.lessonAvailable'),
      tone: 'muted',
      locked: false,
    };
  }

  private groupLessonsByModule(
    lessons: LearningLesson[]
  ): Array<{ module: LearningCourseModule; lessons: LearningLesson[] }> {
    const moduleById = new Map(
      this.options.state.modules.map((module) => [module.id, module])
    );
    const grouped = new Map<string, LearningLesson[]>();
    lessons.forEach((lesson) => {
      const list = grouped.get(lesson.moduleId) ?? [];
      list.push(lesson);
      grouped.set(lesson.moduleId, list);
    });

    return Array.from(grouped.entries())
      .map(([moduleId, moduleLessons]) => ({
        module:
          moduleById.get(moduleId) ?? {
            id: moduleId,
            courseId: '',
            title: moduleId,
            order: 0,
            lessonIds: [],
          },
        lessons: moduleLessons,
      }))
      .sort((left, right) => left.module.order - right.module.order);
  }

  private createStatusPill(
    text: string,
    tone: 'default' | 'good' | 'warning' | 'muted' = 'default'
  ): HTMLSpanElement {
    const pill = document.createElement('span');
    const toneClassMap: Record<typeof tone, string> = {
      default: 'bg-slate-100 text-slate-700',
      good: 'bg-emerald-50 text-emerald-700',
      warning: 'bg-amber-50 text-amber-700',
      muted: 'bg-slate-100 text-slate-500',
    };
    pill.className =
      `inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${toneClassMap[tone]}`;
    pill.textContent = text;
    return pill;
  }

  private renderLessonPrerequisitesEditor(lesson: LearningLesson): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.authoring.prerequisitesTitle');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.authoring.prerequisitesSubtitle');
    header.append(title, subtitle);

    const lockInfo = this.getLessonLockInfo(lesson);
    const summaryRow = document.createElement('div');
    summaryRow.className = 'flex flex-wrap items-center gap-2';
    summaryRow.append(
      this.createStatusPill(
        i18n.t('learningStudio.authoring.prerequisiteCount', {
          count: String(lockInfo.prerequisiteLessons.length),
        }),
        lockInfo.locked ? 'warning' : 'good'
      )
    );
    summaryRow.append(
      this.createStatusPill(
        lockInfo.locked
          ? i18n.t('learningStudio.learner.lessonLocked')
          : i18n.t('learningStudio.learner.lessonAvailable'),
        lockInfo.locked ? 'warning' : 'good'
      )
    );

    const body = document.createElement('div');
    body.className = 'space-y-4';
    const courseId = this.getCourseIdForLesson(lesson.id);
    const availableLessons = courseId
      ? this.getLessonsForCourse(courseId).filter((candidate) => candidate.id !== lesson.id)
      : [];

    if (availableLessons.length === 0) {
      const empty = document.createElement('p');
      empty.className =
        'rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-600';
      empty.textContent = i18n.t('learningStudio.authoring.prerequisitesEmpty');
      body.append(empty);
    } else {
      const groupedByModule = this.groupLessonsByModule(availableLessons);
      groupedByModule.forEach(({ module, lessons }) => {
        const group = document.createElement('section');
        group.className = 'space-y-2';
        const groupTitle = document.createElement('h4');
        groupTitle.className = 'text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';
        groupTitle.textContent = module.title;
        group.append(groupTitle);

        const list = document.createElement('div');
        list.className = 'space-y-2';
        lessons.forEach((candidate) => {
          const checked = lesson.prerequisiteIds.includes(candidate.id);
          const row = document.createElement('div');
          row.className =
            'flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3';

          const checkbox = new Checkbox({
            checked,
            ariaLabel: i18n.t('learningStudio.authoring.prerequisiteToggleAria', {
              title: candidate.title,
            }),
            onChange: (nextChecked) => {
              const nextIds = new Set(lesson.prerequisiteIds);
              if (nextChecked) {
                nextIds.add(candidate.id);
              } else {
                nextIds.delete(candidate.id);
              }
              this.setLessonPrerequisites(lesson.id, Array.from(nextIds));
            },
          });

          const content = document.createElement('div');
          content.className = 'min-w-0 space-y-1';
          const candidateTitle = document.createElement('p');
          candidateTitle.className = 'text-sm font-medium text-slate-900';
          candidateTitle.textContent = candidate.title;
          const candidateMeta = document.createElement('p');
          candidateMeta.className = 'text-xs text-slate-500';
          candidateMeta.textContent = [
            this.getLessonTypeLabel(candidate.type),
            this.getLessonPrerequisiteSuffix(candidate).replace(/^ · /, ''),
          ]
            .filter((value) => value.length > 0)
            .join(' · ');
          content.append(candidateTitle, candidateMeta);

          row.append(checkbox.getElement(), content);
          list.append(row);
        });
        group.append(list);
        body.append(group);
      });
    }

    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap gap-2';
    if (lesson.prerequisiteIds.length > 0) {
      const clearButton = new Button({
        text: i18n.t('learningStudio.authoring.prerequisitesClear'),
        variant: 'secondary',
        size: 'sm',
        onClick: () => this.setLessonPrerequisites(lesson.id, []),
      });
      actions.append(clearButton.getElement());
    }
    const helper = document.createElement('p');
    helper.className = 'text-sm leading-6 text-slate-600';
    helper.textContent = lockInfo.locked
      ? i18n.t('learningStudio.authoring.prerequisitesLockedNote')
      : i18n.t('learningStudio.authoring.prerequisitesHelp');

    section.append(header, summaryRow, helper, body, actions);
    return section;
  }

  private renderPrerequisiteSummary(
    lesson: LearningLesson,
    lockInfo: {
      locked: boolean;
      missingPrerequisiteLessons: LearningLesson[];
      prerequisiteLessons: LearningLesson[];
    }
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const summary = document.createElement('section');
    summary.className =
      'rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3';

    const header = document.createElement('div');
    header.className = 'flex flex-wrap items-center gap-2';
    header.append(
      this.createStatusPill(
        lockInfo.locked
          ? i18n.t('learningStudio.learner.lessonLocked')
          : i18n.t('learningStudio.learner.lessonAvailable'),
        lockInfo.locked ? 'warning' : 'good'
      ),
      this.createStatusPill(
        i18n.t('learningStudio.authoring.prerequisiteCount', {
          count: String(lockInfo.prerequisiteLessons.length),
        }),
        lockInfo.locked ? 'warning' : 'good'
      )
    );

    const title = document.createElement('p');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.learner.prerequisitesTitle');

    const body = document.createElement('div');
    body.className = 'space-y-2';
    if (lockInfo.prerequisiteLessons.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm leading-6 text-slate-600';
      empty.textContent = i18n.t('learningStudio.learner.prerequisitesNone');
      body.append(empty);
    } else {
      lockInfo.prerequisiteLessons.forEach((prerequisite) => {
        const row = document.createElement('div');
        row.className =
          'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2';
        const label = document.createElement('div');
        label.className = 'min-w-0';
        const prerequisiteTitle = document.createElement('p');
        prerequisiteTitle.className = 'text-sm font-medium text-slate-900';
        prerequisiteTitle.textContent = prerequisite.title;
        const prerequisiteMeta = document.createElement('p');
        prerequisiteMeta.className = 'text-xs text-slate-500';
        prerequisiteMeta.textContent = this.getLessonTypeLabel(prerequisite.type);
        label.append(prerequisiteTitle, prerequisiteMeta);

        const jumpButton = new Button({
          text: i18n.t('learningStudio.learner.jumpToPrerequisite'),
          variant: 'secondary',
          size: 'sm',
          onClick: () => this.options.onFocusLesson(prerequisite.id),
        });
        row.append(label, jumpButton.getElement());
        body.append(row);
      });
    }

    if (lockInfo.locked) {
      const missing = document.createElement('p');
      missing.className = 'text-sm leading-6 text-amber-900';
      missing.textContent = this.renderPrerequisiteLockMessage(lockInfo);
      body.prepend(missing);
    }

    summary.append(header, title, body);
    return summary;
  }

  private getSelectedModule(): LearningCourseModule | null {
    if (this.options.uiState.selectedElementKind !== 'module') return null;
    return (
      this.options.state.modules.find(
        (module) => module.id === this.options.uiState.selectedElementId
      ) ?? null
    );
  }

  private getSelectedLesson(): LearningLesson | null {
    if (this.options.uiState.selectedElementKind !== 'lesson') return null;
    return (
      this.options.state.lessons.find(
        (lesson) => lesson.id === this.options.uiState.selectedElementId
      ) ?? null
    );
  }

  private getCourseParticipants(courseId: string): LearningStudioAccessParticipant[] {
    const activeEnrollmentByLearnerRef = new Map(
      this.options.state.enrollments
        .filter(
          (enrollment) =>
            enrollment.courseId === courseId && enrollment.status === 'active'
        )
        .map((enrollment) => [enrollment.learnerRef, enrollment])
    );
    const participantByLearnerRef = new Map<string, LearningStudioAccessParticipant>();

    this.options.state.accessGrants
      .filter((grant) => grant.courseId === courseId)
      .forEach((grant) => {
        const activeEnrollment = activeEnrollmentByLearnerRef.get(grant.learnerRef);
        participantByLearnerRef.set(grant.learnerRef, {
          id: grant.learnerRef,
          name: this.getLearnerDisplayName(grant.learnerRef),
          email: `${grant.learnerRef}@local.majom`,
          role: 'learner',
          status:
            grant.revokedAt !== null
              ? 'revoked'
              : activeEnrollment
                ? 'active'
                : 'pending',
          joinedAt: activeEnrollment?.createdAt ?? grant.createdAt,
        });
      });

    this.options.state.enrollments
      .filter((enrollment) => enrollment.courseId === courseId)
      .forEach((enrollment) => {
        if (participantByLearnerRef.has(enrollment.learnerRef)) return;
        participantByLearnerRef.set(enrollment.learnerRef, {
          id: enrollment.learnerRef,
          name: this.getLearnerDisplayName(enrollment.learnerRef),
          email: `${enrollment.learnerRef}@local.majom`,
          role: 'learner',
          status: enrollment.status === 'revoked' ? 'revoked' : 'active',
          joinedAt: enrollment.createdAt,
        });
      });

    return Array.from(participantByLearnerRef.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  getCourseIdForLesson(lessonId: string): string | null {
    const lesson = this.options.state.lessons.find((candidate) => candidate.id === lessonId);
    if (!lesson) return null;
    return this.options.state.modules.find((module) => module.id === lesson.moduleId)?.courseId ?? null;
  }

  private getModulesForCourse(courseId: string): LearningCourseModule[] {
    return this.options.state.modules
      .filter((module) => module.courseId === courseId)
      .sort((left, right) => left.order - right.order);
  }

  private getLessonsForCourse(courseId: string): LearningLesson[] {
    return this.getModulesForCourse(courseId).reduce<LearningLesson[]>(
      (accumulator, module) => {
        accumulator.push(...this.getLessonsForModule(module.id));
        return accumulator;
      },
      []
    );
  }

  private getLessonsForModule(moduleId: string): LearningLesson[] {
    return this.options.state.lessons
      .filter((lesson) => lesson.moduleId === moduleId)
      .sort((left, right) => left.order - right.order);
  }

  private getCourseShareLink(courseId: string): string {
    const base =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://local.majom';
    return `${base}/learning-studio/share/${courseId}`;
  }

  private getActiveLearnerCount(courseId: string): number {
    return this.options.state.enrollments.filter(
      (enrollment) =>
        enrollment.courseId === courseId && enrollment.status === 'active'
    ).length;
  }

  private getLearnerDisplayName(learnerRef: string): string {
    return learnerRef
      .split(/[-_]/)
      .filter((segment) => segment.length > 0)
      .map((segment) => segment[0].toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private formatTimestamp(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  }

  private getLessonProgressState(lessonId: string): LearningProgressState {
    const learnerState = this.resolveLessonLearnerState(lessonId);
    if (learnerState) {
      return learnerState.progressState;
    }
    return (
      this.options.state.learnerProgress.find(
        (progress) =>
          progress.lessonId === lessonId &&
          progress.learnerRef === this.options.uiState.selectedLearnerRef
      )?.state ?? 'available'
    );
  }

  private getCourseStatusLabel(status: LearningCourse['status']): string {
    const { i18n } = this.options.runtime;
    switch (status) {
      case 'published':
        return i18n.t('learningStudio.status.published');
      case 'archived':
        return i18n.t('learningStudio.status.archived');
      case 'draft':
      default:
        return i18n.t('learningStudio.status.draft');
    }
  }

  private getLessonTypeLabel(type: LearningLessonType): string {
    const { i18n } = this.options.runtime;
    if (type === 'exercise') return i18n.t('learningStudio.type.exercise');
    if (type === 'checkpoint') return i18n.t('learningStudio.type.checkpoint');
    return i18n.t('learningStudio.type.lesson');
  }

  private getProgressStateLabel(state: LearningProgressState): string {
    const { i18n } = this.options.runtime;
    switch (state) {
      case 'locked':
        return i18n.t('learningStudio.progress.locked');
      case 'in_progress':
        return i18n.t('learningStudio.progress.inProgress');
      case 'completed':
        return i18n.t('learningStudio.progress.completed');
      case 'review':
        return i18n.t('learningStudio.progress.review');
      case 'available':
      default:
        return i18n.t('learningStudio.progress.available');
    }
  }

  private renderLearnerProgressOverview(
    summary: LearningCourseLearnerProgressSummary
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'grid gap-3 md:grid-cols-4';

    [
      [
        i18n.t('learningStudio.learner.completionTitle'),
        `${summary.completionPercentage}%`,
        i18n.t('learningStudio.learner.completionBody', {
          completed: String(summary.completedLessons),
          total: String(summary.totalLessons),
        }),
      ],
      [
        i18n.t('learningStudio.learner.availableTitle'),
        String(summary.availableLessons),
        i18n.t('learningStudio.learner.availableBody'),
      ],
      [
        i18n.t('learningStudio.learner.inProgressTitle'),
        String(summary.inProgressLessons + summary.reviewLessons),
        i18n.t('learningStudio.learner.inProgressBody'),
      ],
      [
        i18n.t('learningStudio.learner.lockedTitle'),
        String(summary.lockedLessons),
        summary.isCompleted
          ? i18n.t('learningStudio.learner.courseCompleted')
          : i18n.t('learningStudio.learner.lockedBodyShort'),
      ],
    ].forEach(([label, value, helper]) => {
      section.append(this.createSummaryCard(label, value, helper));
    });

    return section;
  }

  private renderRecommendedNextStep(
    courseId: string,
    recommendedStep: LearningRecommendedLearnerStep | null
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const wrap = document.createElement('section');
    wrap.className =
      'rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3';

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.learner.nextStepTitle');

    if (!recommendedStep) {
      const summary = this.getCourseLearnerProgressSummary(courseId);
      const body = document.createElement('p');
      body.className = 'text-sm leading-6 text-slate-600';
      body.textContent = summary?.isCompleted
        ? i18n.t('learningStudio.learner.courseCompleted')
        : i18n.t('learningStudio.learner.nextStepEmpty');
      wrap.append(title, body);
      return wrap;
    }

    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap gap-2';
    meta.append(
      this.createStatusPill(this.getLessonTypeLabel(recommendedStep.type)),
      this.createStatusPill(
        this.getProgressStateLabel(recommendedStep.progressState),
        recommendedStep.progressState === 'completed' ? 'good' : 'muted'
      )
    );

    const stepTitle = document.createElement('p');
    stepTitle.className = 'text-base font-semibold text-slate-950';
    stepTitle.textContent = recommendedStep.title;

    const body = document.createElement('p');
    body.className = 'text-sm leading-6 text-slate-600';
    body.textContent =
      recommendedStep.description.trim() ||
      i18n.t('learningStudio.learner.nextStepFallbackBody');

    const action = new Button({
      text: i18n.t('learningStudio.learner.openNextStep'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onFocusLesson(recommendedStep.lessonId),
    });

    wrap.append(title, meta, stepTitle, body, action.getElement());
    return wrap;
  }
}
