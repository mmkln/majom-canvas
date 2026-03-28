import type { AppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioBuildInspectorView } from './LearningStudioBuildInspectorView.ts';
import type {
  LearningStudioBuildChildUnit,
  LearningStudioBuildLesson,
  LearningStudioBuildModel,
  LearningStudioBuildModule,
} from './LearningStudioScreenModels.ts';

type LearningStudioBuildStageViewOptions = {
  runtime: AppRuntime;
  build: LearningStudioBuildModel;
  onAddModule: () => void;
  onSelectCourse: () => void;
  onSelectModule: (moduleId: string) => void;
  onSelectUnit: (unitId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onAddExercise: (lessonId: string) => void;
  onAddCheckpoint: (lessonId: string) => void;
  onMoveModule: (moduleId: string, direction: -1 | 1) => void;
  onToggleModuleCollapse: (moduleId: string) => void;
  onMoveLesson: (lessonId: string, direction: -1 | 1) => void;
  onMoveChildUnit: (unitId: string, direction: -1 | 1) => void;
  onUpdateModuleTitle: (moduleId: string, title: string) => void;
  onUpdateModuleDescription: (moduleId: string, description: string) => void;
  onUpdateUnitTitle: (unitId: string, title: string) => void;
  onUpdateUnitDescription: (unitId: string, description: string) => void;
  onUpdateUnitObjective: (unitId: string, objective: string) => void;
  onTogglePrerequisite: (unitId: string, prerequisiteId: string) => void;
  onAddLessonBlock: (
    unitId: string,
    type:
      | 'intro'
      | 'concept'
      | 'example'
      | 'instruction'
      | 'summary'
      | 'exercise_ref'
      | 'checkpoint_ref'
  ) => void;
  onUpdateLessonBlockType: (
    unitId: string,
    blockId: string,
    type:
      | 'intro'
      | 'concept'
      | 'example'
      | 'instruction'
      | 'summary'
      | 'exercise_ref'
      | 'checkpoint_ref'
  ) => void;
  onUpdateLessonBlockText: (
    unitId: string,
    blockId: string,
    text: string
  ) => void;
  onUpdateLessonBlockReference: (
    unitId: string,
    blockId: string,
    refUnitId: string
  ) => void;
  onMoveLessonBlock: (
    unitId: string,
    blockId: string,
    direction: -1 | 1
  ) => void;
  onRemoveLessonBlock: (unitId: string, blockId: string) => void;
};

export class LearningStudioBuildStageView {
  public readonly element: HTMLDivElement;
  private readonly inspector: LearningStudioBuildInspectorView;

  constructor(private options: LearningStudioBuildStageViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50';
    this.inspector = new LearningStudioBuildInspectorView(
      this.createInspectorOptions(options)
    );
    this.render();
  }

  public update(options: LearningStudioBuildStageViewOptions): void {
    this.options = options;
    this.inspector.update(this.createInspectorOptions(options));
    this.render();
  }

  public destroy(): void {}

  private createInspectorOptions(
    options: LearningStudioBuildStageViewOptions
  ): ConstructorParameters<typeof LearningStudioBuildInspectorView>[0] {
    return {
      runtime: options.runtime,
      build: options.build,
      onUpdateModuleTitle: options.onUpdateModuleTitle,
      onUpdateModuleDescription: options.onUpdateModuleDescription,
      onUpdateUnitTitle: options.onUpdateUnitTitle,
      onUpdateUnitDescription: options.onUpdateUnitDescription,
      onUpdateUnitObjective: options.onUpdateUnitObjective,
      onTogglePrerequisite: options.onTogglePrerequisite,
      onAddLessonBlock: options.onAddLessonBlock,
      onUpdateLessonBlockType: options.onUpdateLessonBlockType,
      onUpdateLessonBlockText: options.onUpdateLessonBlockText,
      onUpdateLessonBlockReference: options.onUpdateLessonBlockReference,
      onMoveLessonBlock: options.onMoveLessonBlock,
      onRemoveLessonBlock: options.onRemoveLessonBlock,
    };
  }

  private render(): void {
    const stage = document.createElement('section');
    stage.className = 'flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row';
    stage.dataset.role = 'learning-studio-build-stage';

    const rail = document.createElement('section');
    rail.className =
      'flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r';
    rail.dataset.role = 'learning-studio-build-rail';
    rail.append(this.renderRailHeader(), this.renderOutlinePane());

    const inspectorPane = document.createElement('aside');
    inspectorPane.className =
      'w-full shrink-0 border-t border-slate-200 bg-white lg:w-[360px] lg:border-t-0';
    inspectorPane.dataset.role = 'learning-studio-build-inspector-pane';
    inspectorPane.append(this.inspector.element);

    stage.append(rail, inspectorPane);
    this.element.replaceChildren(stage);
  }

  private renderRailHeader(): HTMLElement {
    const { i18n } = this.options.runtime;
    const header = document.createElement('header');
    header.className =
      'flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4';

    const copy = document.createElement('div');
    copy.className = 'space-y-1';

    const eyebrow = document.createElement('p');
    eyebrow.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    eyebrow.textContent = i18n.t('learningStudio.shell.build');

    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.build.workspaceTitle');

    const hint = document.createElement('p');
    hint.className = 'max-w-2xl text-sm leading-6 text-slate-600';
    hint.textContent = i18n.t('learningStudio.build.workspaceHint');

    copy.append(eyebrow, title, hint);

    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap items-center gap-2';
    actions.append(
      this.createPrimaryButton(
        'learning-studio-build-add-module',
        i18n.t('learningStudio.build.addModuleCta'),
        () => this.options.onAddModule()
      )
    );

    header.append(copy, actions);
    return header;
  }

  private renderOutlinePane(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'min-h-0 flex-1 overflow-auto px-5 py-5';
    body.dataset.role = 'learning-studio-build-workspace';

    body.append(this.renderCourseCard());

    if (this.options.build.modules.length === 0) {
      body.append(this.renderEmptyState());
      return body;
    }

    const outline = document.createElement('div');
    outline.className = 'mt-4 space-y-4';
    outline.dataset.role = 'learning-studio-build-outline';
    this.options.build.modules.forEach((module) => {
      outline.append(this.renderModule(module));
    });
    body.append(outline);
    return body;
  }

  private renderCourseCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const selected = this.options.build.selected?.kind === 'course';
    const card = document.createElement('article');
    card.className = [
      'rounded-2xl border px-4 py-4 shadow-sm transition',
      selected
        ? 'border-sky-400 bg-sky-50/70 shadow-sky-100'
        : 'border-slate-200 bg-white',
    ].join(' ');
    card.dataset.role = 'learning-studio-build-course-card';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full text-left';
    button.dataset.role = 'learning-studio-build-select-course';
    button.addEventListener('click', () => this.options.onSelectCourse());

    const meta = document.createElement('p');
    meta.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    meta.textContent = i18n.t('learningStudio.inspector.course');

    const title = document.createElement('h3');
    title.className = 'mt-1 text-base font-semibold text-slate-950';
    title.textContent = this.getCourseTitle();

    const description = document.createElement('p');
    description.className = 'mt-2 text-sm leading-6 text-slate-600';
    description.textContent =
      this.options.build.course.description.trim().length > 0
        ? this.options.build.course.description
        : i18n.t('learningStudio.overview.basicsSummary');

    const stats = document.createElement('p');
    stats.className = 'mt-3 text-xs text-slate-500';
    stats.textContent = [
      i18n.t('learningStudio.home.courseStatsModules', {
        count: String(this.options.build.course.moduleCount),
      }),
      i18n.t('learningStudio.home.courseStatsUnits', {
        count: String(this.options.build.course.unitCount),
      }),
    ].join(' · ');

    button.append(meta, title, description, stats);
    card.append(button);
    return card;
  }

  private renderEmptyState(): HTMLElement {
    const { i18n } = this.options.runtime;
    const state = document.createElement('div');
    state.className =
      'mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm';
    state.dataset.role = 'learning-studio-build-empty';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.emptyTitle');

    const body = document.createElement('p');
    body.className = 'mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600';
    body.textContent = i18n.t('learningStudio.build.emptyBody');

    const actions = document.createElement('div');
    actions.className = 'mt-5 flex justify-center';
    actions.append(
      this.createPrimaryButton(
        'learning-studio-build-empty-add-module',
        i18n.t('learningStudio.build.addModuleCta'),
        () => this.options.onAddModule()
      )
    );

    state.append(title, body, actions);
    return state;
  }

  private renderModule(module: LearningStudioBuildModule): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = document.createElement('article');
    card.className = [
      'rounded-2xl border bg-white p-4 shadow-sm transition',
      module.selected
        ? 'border-sky-300 shadow-sky-100'
        : 'border-slate-200',
    ].join(' ');
    card.dataset.role = `learning-studio-build-module-${module.id}`;

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-3';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'min-w-0 flex-1 text-left';
    selectButton.dataset.role = `learning-studio-build-select-module-${module.id}`;
    selectButton.addEventListener('click', () =>
      this.options.onSelectModule(module.id)
    );

    const label = document.createElement('p');
    label.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    label.textContent = i18n.t('learningStudio.module.defaultTitle');

    const title = document.createElement('h3');
    title.className = 'mt-1 text-base font-semibold text-slate-950';
    title.textContent = this.getModuleTitle(module);

    selectButton.append(label, title);
    if (module.description.trim().length > 0) {
      const description = document.createElement('p');
      description.className = 'mt-2 text-sm leading-6 text-slate-600';
      description.textContent = module.description;
      selectButton.append(description);
    }

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 flex-wrap justify-end gap-2';
    actions.append(
      this.createSecondaryButton(
        `learning-studio-build-move-module-up-${module.id}`,
        i18n.t('learningStudio.build.blockMoveUp'),
        () => this.options.onMoveModule(module.id, -1)
      ),
      this.createSecondaryButton(
        `learning-studio-build-move-module-down-${module.id}`,
        i18n.t('learningStudio.build.blockMoveDown'),
        () => this.options.onMoveModule(module.id, 1)
      ),
      this.createSecondaryButton(
        `learning-studio-build-add-lesson-${module.id}`,
        i18n.t('learningStudio.build.addLessonCta'),
        () => this.options.onAddLesson(module.id)
      ),
      this.createSecondaryButton(
        `learning-studio-build-toggle-module-${module.id}`,
        module.collapsed ? 'Expand' : 'Collapse',
        () => this.options.onToggleModuleCollapse(module.id)
      )
    );

    header.append(selectButton, actions);
    card.append(header);

    const meta = document.createElement('p');
    meta.className = 'mt-3 text-xs text-slate-500';
    meta.textContent = [
      i18n.t('learningStudio.overview.moduleLessons', {
        count: String(module.lessons.length),
      }),
      i18n.t('learningStudio.overview.moduleExercises', {
        count: String(
          module.lessons.reduce(
            (total, lesson) =>
              total +
              lesson.childUnits.filter((unit) => unit.type === 'exercise').length,
            0
          )
        ),
      }),
      i18n.t('learningStudio.overview.moduleCheckpoints', {
        count: String(
          module.lessons.reduce(
            (total, lesson) =>
              total +
              lesson.childUnits.filter((unit) => unit.type === 'checkpoint').length,
            0
          )
        ),
      }),
    ].join(' · ');
    card.append(meta);

    if (module.collapsed) {
      return card;
    }

    if (module.lessons.length === 0) {
      const empty = document.createElement('p');
      empty.className =
        'mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500';
      empty.textContent = i18n.t('learningStudio.build.readinessMissingLessons');
      card.append(empty);
      return card;
    }

    const lessons = document.createElement('div');
    lessons.className = 'mt-4 space-y-3';
    module.lessons.forEach((lesson) => {
      lessons.append(this.renderLesson(lesson));
    });
    card.append(lessons);
    return card;
  }

  private renderLesson(lesson: LearningStudioBuildLesson): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = document.createElement('article');
    card.className = [
      'rounded-xl border px-4 py-4 transition',
      lesson.selected
        ? 'border-sky-300 bg-sky-50/60'
        : 'border-slate-200 bg-slate-50/80',
    ].join(' ');
    card.dataset.role = `learning-studio-build-lesson-${lesson.id}`;

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-3';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'min-w-0 flex-1 text-left';
    selectButton.dataset.role = `learning-studio-build-select-unit-${lesson.id}`;
    selectButton.addEventListener('click', () =>
      this.options.onSelectUnit(lesson.id)
    );

    const label = document.createElement('p');
    label.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    label.textContent = i18n.t('learningStudio.inspector.lesson');

    const title = document.createElement('h4');
    title.className = 'mt-1 text-sm font-semibold text-slate-950';
    title.textContent = this.getLessonTitle(lesson);

    selectButton.append(label, title);
    if (lesson.description.trim().length > 0) {
      const description = document.createElement('p');
      description.className = 'mt-2 text-sm leading-6 text-slate-600';
      description.textContent = lesson.description;
      selectButton.append(description);
    }

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 flex-wrap justify-end gap-2';
    actions.append(
      this.createSecondaryButton(
        `learning-studio-build-move-lesson-up-${lesson.id}`,
        i18n.t('learningStudio.build.blockMoveUp'),
        () => this.options.onMoveLesson(lesson.id, -1)
      ),
      this.createSecondaryButton(
        `learning-studio-build-move-lesson-down-${lesson.id}`,
        i18n.t('learningStudio.build.blockMoveDown'),
        () => this.options.onMoveLesson(lesson.id, 1)
      ),
      this.createSecondaryButton(
        `learning-studio-build-add-exercise-${lesson.id}`,
        i18n.t('learningStudio.actions.addExercise'),
        () => this.options.onAddExercise(lesson.id)
      ),
      this.createSecondaryButton(
        `learning-studio-build-add-checkpoint-${lesson.id}`,
        i18n.t('learningStudio.actions.addCheckpoint'),
        () => this.options.onAddCheckpoint(lesson.id)
      )
    );

    header.append(selectButton, actions);
    card.append(header);

    const notes: string[] = [];
    if (lesson.missingDescription) {
      notes.push(i18n.t('learningStudio.overview.issueLessonsNeedDescriptions', {
        count: '1',
      }));
    }
    if (lesson.prerequisiteIssue) {
      notes.push(i18n.t('learningStudio.build.prerequisitesTitle'));
    }
    if (notes.length > 0) {
      const note = document.createElement('p');
      note.className = 'mt-3 text-xs text-amber-700';
      note.textContent = notes.join(' · ');
      card.append(note);
    }

    if (lesson.childUnits.length === 0) {
      return card;
    }

    const children = document.createElement('div');
    children.className = 'mt-3 space-y-2 border-l border-slate-200 pl-4';
    lesson.childUnits.forEach((child) => {
      children.append(this.renderChildUnit(child));
    });
    card.append(children);
    return card;
  }

  private renderChildUnit(child: LearningStudioBuildChildUnit): HTMLElement {
    const row = document.createElement('div');
    row.className = [
      'flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition',
      child.selected
        ? 'border-sky-300 bg-white shadow-sm'
        : 'border-slate-200 bg-white/80',
    ].join(' ');
    row.dataset.role = `learning-studio-build-child-${child.id}`;

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'min-w-0 flex-1 text-left';
    selectButton.dataset.role = `learning-studio-build-select-unit-${child.id}`;
    selectButton.addEventListener('click', () =>
      this.options.onSelectUnit(child.id)
    );

    const label = document.createElement('p');
    label.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    label.textContent = child.type === 'exercise' ? 'Exercise' : 'Checkpoint';

    const title = document.createElement('p');
    title.className = 'mt-1 truncate text-sm font-medium text-slate-900';
    title.textContent = this.getChildUnitTitle(child);

    selectButton.append(label, title);

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 gap-2';
    actions.append(
      this.createSecondaryButton(
        `learning-studio-build-move-child-up-${child.id}`,
        this.options.runtime.i18n.t('learningStudio.build.blockMoveUp'),
        () => this.options.onMoveChildUnit(child.id, -1)
      ),
      this.createSecondaryButton(
        `learning-studio-build-move-child-down-${child.id}`,
        this.options.runtime.i18n.t('learningStudio.build.blockMoveDown'),
        () => this.options.onMoveChildUnit(child.id, 1)
      )
    );

    row.append(selectButton, actions);
    return row;
  }

  private createPrimaryButton(
    dataRole: string,
    label: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800';
    button.dataset.role = dataRole;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private createSecondaryButton(
    dataRole: string,
    label: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
    button.dataset.role = dataRole;
    button.textContent = label;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  private getCourseTitle(): string {
    const title = this.options.build.course.title.trim();
    return title.length > 0
      ? title
      : this.options.runtime.i18n.t('learningStudio.home.courseTitleFallback');
  }

  private getModuleTitle(module: LearningStudioBuildModule): string {
    const title = module.title.trim();
    return title.length > 0
      ? title
      : this.options.runtime.i18n.t('learningStudio.module.defaultTitle');
  }

  private getLessonTitle(lesson: LearningStudioBuildLesson): string {
    const title = lesson.title.trim();
    return title.length > 0
      ? title
      : this.options.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle');
  }

  private getChildUnitTitle(child: LearningStudioBuildChildUnit): string {
    const title = child.title.trim();
    if (title.length > 0) {
      return title;
    }
    return child.type === 'exercise'
      ? this.options.runtime.i18n.t('learningStudio.lesson.defaultExerciseTitle')
      : this.options.runtime.i18n.t(
          'learningStudio.lesson.defaultCheckpointTitle'
        );
  }
}
