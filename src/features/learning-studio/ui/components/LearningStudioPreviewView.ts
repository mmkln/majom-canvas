import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type {
  LearningStudioPreviewFocusedLesson,
  LearningStudioPreviewModel,
} from './LearningStudioScreenModels.ts';
import { LearningStudioPreviewMapView } from './LearningStudioPreviewMapView.ts';

type LearningStudioPreviewViewOptions = {
  runtime: AppRuntime;
  preview: LearningStudioPreviewModel;
  onSelectLesson: (lessonId: string) => void;
};

export class LearningStudioPreviewView {
  public readonly element: HTMLDivElement;
  private surfaceMode: 'focus' | 'map' = 'focus';
  private mapView: LearningStudioPreviewMapView | null = null;

  constructor(private options: LearningStudioPreviewViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'flex h-full min-h-0 w-full flex-col bg-white lg:flex-row';
    this.render();
  }

  public update(options: LearningStudioPreviewViewOptions): void {
    this.options = options;
    this.render();
  }

  public destroy(): void {
    this.mapView?.destroy();
    this.mapView = null;
  }

  private render(): void {
    this.mapView?.destroy();
    this.mapView = null;

    const layout = document.createElement('div');
    layout.className =
      this.surfaceMode === 'map'
        ? 'flex h-full min-h-0 w-full flex-col bg-slate-100'
        : 'flex h-full min-h-0 w-full flex-col lg:flex-row';
    layout.dataset.role = 'learning-studio-preview';

    if (this.surfaceMode === 'map') {
      layout.append(this.renderImmersiveMapSurface());
      this.element.replaceChildren(layout);
      return;
    }

    const rail = document.createElement('aside');
    rail.className =
      'flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50 lg:w-[320px] lg:border-b-0 lg:border-r';
    rail.dataset.role = 'learning-studio-preview-rail';

    const note = document.createElement('div');
    note.className = 'space-y-1 border-b border-slate-200 px-4 py-3 text-xs text-slate-600';

    const noteTitle = document.createElement('p');
    noteTitle.className = 'font-semibold uppercase tracking-[0.12em] text-slate-700';
    noteTitle.textContent = this.options.runtime.i18n.t(
      'learningStudio.stage.previewEmphasis'
    );

    const noteBody = document.createElement('p');
    noteBody.textContent = this.options.runtime.i18n.t(
      'learningStudio.stage.previewBody'
    );

    note.append(
      noteTitle,
      noteBody,
      this.renderMapSummary(),
      this.renderSurfaceModeSwitch()
    );
    rail.append(note, this.renderLessonRail());

    const focus = document.createElement('section');
    focus.className = 'min-h-0 min-w-0 flex-1 overflow-hidden';
    focus.dataset.role = 'learning-studio-preview-focus';
    focus.append(this.renderSurface());

    layout.append(rail, focus);
    this.element.replaceChildren(layout);
  }

  private renderImmersiveMapSurface(): HTMLElement {
    const wrapper = document.createElement('section');
    wrapper.className = 'flex h-full min-h-0 flex-col';
    wrapper.dataset.role = 'learning-studio-preview-map-surface';

    const header = document.createElement('div');
    header.className =
      'flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-5';

    const copy = document.createElement('div');
    copy.className = 'min-w-0 space-y-1';

    const title = document.createElement('h2');
    title.className = 'text-sm font-semibold uppercase tracking-[0.12em] text-slate-600';
    title.textContent = this.options.runtime.i18n.t('learningStudio.learner.mapTitle');

    const body = document.createElement('p');
    body.className = 'text-sm text-slate-600';
    body.textContent = this.options.runtime.i18n.t(
      'learningStudio.preview.mapFullscreenBody'
    );

    copy.append(title, body);

    if (this.options.preview.focusedLesson !== null) {
      const selection = document.createElement('p');
      selection.className = 'text-xs font-medium text-slate-500';
      selection.textContent = this.options.runtime.i18n.t(
        'learningStudio.preview.mapSelection',
        {
          title: this.options.preview.focusedLesson.title,
        }
      );
      copy.append(selection);
    }

    const controls = document.createElement('div');
    controls.className = 'flex shrink-0 items-center gap-2';
    controls.append(
      this.createSurfaceModeButton('focus', 'learningStudio.preview.modeFocus'),
      this.createSurfaceModeButton('map', 'learningStudio.preview.modeMap')
    );

    header.append(copy, controls);

    const bodyRegion = document.createElement('div');
    bodyRegion.className = 'min-h-0 flex-1 overflow-hidden';
    this.mapView = new LearningStudioPreviewMapView({
      runtime: this.options.runtime,
      preview: this.options.preview,
      onSelectLesson: (lessonId) => {
        this.options.onSelectLesson(lessonId);
      },
      immersive: true,
    });
    bodyRegion.append(this.mapView.element);

    wrapper.append(header, bodyRegion);
    return wrapper;
  }

  private renderSurfaceModeSwitch(): HTMLElement {
    const switcher = document.createElement('div');
    switcher.className = 'flex items-center gap-2 pt-2';
    switcher.dataset.role = 'learning-studio-preview-mode-switch';

    switcher.append(
      this.createSurfaceModeButton('focus', 'learningStudio.preview.modeFocus'),
      this.createSurfaceModeButton('map', 'learningStudio.preview.modeMap')
    );

    return switcher;
  }

  private createSurfaceModeButton(
    mode: 'focus' | 'map',
    labelKey: 'learningStudio.preview.modeFocus' | 'learningStudio.preview.modeMap'
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      this.surfaceMode === mode
        ? 'rounded-full border border-sky-500 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700'
        : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50';
    button.dataset.role = `learning-studio-preview-mode-${mode}`;
    button.textContent = this.options.runtime.i18n.t(labelKey);
    button.addEventListener('click', () => {
      this.surfaceMode = mode;
      this.render();
    });
    return button;
  }

  private renderSurface(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'h-full min-h-0 overflow-auto px-5 py-5 lg:px-8 lg:py-7';
    wrapper.append(this.renderFocusedLesson());
    return wrapper;
  }

  private renderMapSummary(): HTMLElement {
    const summary = document.createElement('div');
    summary.className = 'space-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2';
    summary.dataset.role = 'learning-studio-preview-map-summary';

    const title = document.createElement('p');
    title.className =
      'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
    title.textContent = this.options.runtime.i18n.t('learningStudio.learner.mapTitle');

    const body = document.createElement('p');
    body.className = 'text-xs text-slate-600';
    body.textContent = this.options.runtime.i18n.t(
      'learningStudio.preview.mapSummary',
      {
        nodes: String(this.options.preview.map.nodes.length),
        edges: String(this.options.preview.map.edges.length),
      }
    );

    const mode = document.createElement('p');
    mode.className = 'text-xs text-slate-500';
    mode.textContent = this.options.runtime.i18n.t(
      this.options.preview.map.presentation.childUnitVisibility ===
        'all_child_units'
        ? 'learningStudio.preview.mapChildVisibilityAll'
        : this.options.preview.map.presentation.childUnitVisibility ===
            'important_only'
          ? 'learningStudio.preview.mapChildVisibilityImportant'
          : 'learningStudio.preview.mapChildVisibilityAuto'
    );

    summary.append(title, body, mode);
    return summary;
  }

  private renderLessonRail(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'min-h-0 flex-1 overflow-auto py-2';

    if (this.options.preview.modules.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'px-4 py-4 text-sm text-slate-500';
      empty.textContent = this.options.runtime.i18n.t(
        'learningStudio.build.readinessMissingLessons'
      );
      body.append(empty);
      return body;
    }

    this.options.preview.modules.forEach((module) => {
      const section = document.createElement('section');
      section.className = 'border-b border-slate-200/80 py-2 last:border-b-0';

      const title = document.createElement('h3');
      title.className =
        'px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500';
      title.textContent =
        module.title.trim().length > 0
          ? module.title
          : this.options.runtime.i18n.t('learningStudio.module.defaultTitle');

      const list = document.createElement('div');
      list.className = 'space-y-1';

      module.lessons.forEach((lesson) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = lesson.selected
          ? 'flex w-full items-start justify-between gap-3 border-l-2 border-sky-500 bg-white px-4 py-3 text-left'
          : 'flex w-full items-start justify-between gap-3 border-l-2 border-transparent px-4 py-3 text-left hover:bg-white/80';
        button.dataset.role = `learning-studio-preview-select-${lesson.id}`;
        button.addEventListener('click', () => {
          this.options.onSelectLesson(lesson.id);
        });

        const copy = document.createElement('div');
        copy.className = 'min-w-0 flex-1 space-y-1';

        const lessonTitle = document.createElement('p');
        lessonTitle.className = 'truncate text-sm font-medium text-slate-900';
        lessonTitle.textContent = lesson.title;

        const meta = document.createElement('p');
        meta.className = 'text-xs text-slate-500';
        meta.textContent = this.getProgressLabel(lesson.status);

        copy.append(lessonTitle, meta);

        button.append(copy);

        if (lesson.hasWarnings) {
          const warning = document.createElement('span');
          warning.className =
            'mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400';
          warning.setAttribute('aria-hidden', 'true');
          button.append(warning);
        }

        list.append(button);
      });

      section.append(title, list);
      body.append(section);
    });

    return body;
  }

  private renderFocusedLesson(): HTMLElement {
    const lesson = this.options.preview.focusedLesson;
    const { i18n } = this.options.runtime;

    if (lesson === null) {
      const empty = document.createElement('div');
      empty.className = 'space-y-2';

      const title = document.createElement('h2');
      title.className = 'text-lg font-semibold text-slate-950';
      title.textContent = i18n.t('learningStudio.shell.preview');

      const body = document.createElement('p');
      body.className = 'max-w-2xl text-sm leading-6 text-slate-600';
      body.textContent = i18n.t('learningStudio.build.readinessMissingLessons');

      empty.append(title, body);
      return empty;
    }

    const article = document.createElement('article');
    article.className = 'mx-auto flex w-full max-w-3xl flex-col gap-6';
    article.dataset.role = 'learning-studio-preview-lesson-view';

    const header = document.createElement('header');
    header.className = 'space-y-3 border-b border-slate-200 pb-5';

    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap items-center gap-3 text-xs text-slate-500';

    const moduleLabel = document.createElement('span');
    moduleLabel.className = 'font-medium uppercase tracking-[0.12em] text-slate-500';
    moduleLabel.textContent = lesson.moduleTitle;

    const status = document.createElement('span');
    status.className = 'font-medium text-slate-600';
    status.textContent = this.getProgressLabel(lesson.status);

    meta.append(moduleLabel, status);

    const title = document.createElement('h1');
    title.className = 'text-2xl font-semibold tracking-tight text-slate-950';
    title.textContent = lesson.title;

    header.append(meta, title);

    if (lesson.description.trim().length > 0) {
      const description = document.createElement('p');
      description.className = 'max-w-2xl text-sm leading-6 text-slate-600';
      description.textContent = lesson.description;
      header.append(description);
    }

    if (lesson.objective.trim().length > 0) {
      const objective = document.createElement('p');
      objective.className = 'max-w-2xl text-sm leading-6 text-slate-700';
      objective.textContent = lesson.objective;
      header.append(objective);
    }

    article.append(header);

    const supporting = this.renderSupportingNotes(lesson);
    if (supporting !== null) {
      article.append(supporting);
    }

    article.append(this.renderBlocks(lesson));
    return article;
  }

  private renderSupportingNotes(
    lesson: LearningStudioPreviewFocusedLesson
  ): HTMLElement | null {
    const { i18n } = this.options.runtime;
    const notes = document.createElement('section');
    notes.className = 'space-y-4';
    let hasContent = false;

    if (lesson.prerequisiteTitles.length > 0) {
      hasContent = true;
      const prereqs = document.createElement('div');
      prereqs.className = 'space-y-1';

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold uppercase tracking-[0.12em] text-slate-500';
      title.textContent = i18n.t('learningStudio.build.prerequisitesTitle');

      const value = document.createElement('p');
      value.className = 'text-sm leading-6 text-slate-600';
      value.textContent = lesson.prerequisiteTitles.join(', ');

      prereqs.append(title, value);
      notes.append(prereqs);
    }

    if (lesson.blockedByTitles.length > 0) {
      hasContent = true;
      const blocked = document.createElement('div');
      blocked.className = 'space-y-1 border-l-2 border-amber-300 pl-3';

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold uppercase tracking-[0.12em] text-amber-700';
      title.textContent = i18n.t('learningStudio.preview.blockedBy');

      const value = document.createElement('p');
      value.className = 'text-sm leading-6 text-amber-800';
      value.textContent = lesson.blockedByTitles.join(', ');

      blocked.append(title, value);
      notes.append(blocked);
    }

    if (lesson.warnings.length > 0) {
      hasContent = true;
      const warnings = document.createElement('div');
      warnings.className = 'space-y-2 border-l-2 border-rose-200 pl-3';

      const title = document.createElement('p');
      title.className = 'text-xs font-semibold uppercase tracking-[0.12em] text-rose-700';
      title.textContent = i18n.t('learningStudio.preview.warningsTitle');

      const list = document.createElement('ul');
      list.className = 'space-y-1 text-sm leading-6 text-rose-800';

      lesson.warnings.forEach((warning) => {
        const item = document.createElement('li');
        item.textContent = warning;
        list.append(item);
      });

      warnings.append(title, list);
      notes.append(warnings);
    }

    return hasContent ? notes : null;
  }

  private renderBlocks(
    lesson: LearningStudioPreviewFocusedLesson
  ): HTMLElement {
    const { i18n } = this.options.runtime;
    const section = document.createElement('section');
    section.className = 'space-y-5';
    section.dataset.role = `learning-studio-preview-blocks-${lesson.id}`;

    if (lesson.blocks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm leading-6 text-slate-500';
      empty.textContent = i18n.t('learningStudio.preview.warningMissingContent');
      section.append(empty);
      return section;
    }

    lesson.blocks.forEach((block) => {
      const row = document.createElement('section');
      row.className = 'space-y-2 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0';

      const label = document.createElement('p');
      label.className = 'text-xs font-semibold uppercase tracking-[0.12em] text-slate-500';
      label.textContent = this.getBlockLabel(block.type);

      row.append(label);

      if ('text' in block) {
        const text = document.createElement('p');
        text.className = 'whitespace-pre-wrap text-sm leading-7 text-slate-800';
        text.textContent = block.text.trim().length > 0 ? block.text : '—';
        row.append(text);
      } else {
        const ref = document.createElement('p');
        ref.className = block.broken
          ? 'text-sm leading-6 text-rose-700'
          : 'text-sm leading-6 text-slate-800';
        ref.textContent = block.refTitle;
        row.append(ref);
      }

      section.append(row);
    });

    return section;
  }

  private getProgressLabel(
    status: 'locked' | 'available' | 'completed'
  ): string {
    const { i18n } = this.options.runtime;
    if (status === 'completed') {
      return i18n.t('learningStudio.progress.completed');
    }
    if (status === 'locked') {
      return i18n.t('learningStudio.progress.locked');
    }
    return i18n.t('learningStudio.progress.available');
  }

  private getBlockLabel(type: string): string {
    const { i18n } = this.options.runtime;
    switch (type) {
      case 'intro':
        return i18n.t('learningStudio.build.blockTypeIntro');
      case 'concept':
        return i18n.t('learningStudio.build.blockTypeConcept');
      case 'example':
        return i18n.t('learningStudio.build.blockTypeExample');
      case 'instruction':
        return i18n.t('learningStudio.build.blockTypeInstruction');
      case 'summary':
        return i18n.t('learningStudio.build.blockTypeSummary');
      case 'exercise_ref':
        return i18n.t('learningStudio.build.blockTypeExerciseRef');
      case 'checkpoint_ref':
      default:
        return i18n.t('learningStudio.build.blockTypeCheckpointRef');
    }
  }
}
