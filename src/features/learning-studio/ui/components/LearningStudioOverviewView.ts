import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningStudioOverviewModel } from './LearningStudioScreenModels.ts';

type LearningStudioOverviewSavePayload = {
  title: string;
  description: string;
};

type LearningStudioOverviewViewOptions = {
  runtime: AppRuntime;
  course: LearningStudioOverviewModel;
  onOpenStage: (route: 'build' | 'preview') => void;
  onSaveOverview: (payload: LearningStudioOverviewSavePayload) => void;
};

export class LearningStudioOverviewView {
  public readonly element: HTMLDivElement;
  private basicsExpanded: boolean | null = null;

  constructor(private options: LearningStudioOverviewViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'mx-auto flex w-full max-w-7xl flex-col gap-6';
    this.render();
  }

  public update(options: LearningStudioOverviewViewOptions): void {
    if (this.options.course.courseId !== options.course.courseId) {
      this.basicsExpanded = null;
    }
    this.options = options;
    this.render();
  }

  private render(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-5';
    wrapper.dataset.role = 'learning-studio-overview';

    wrapper.append(this.renderMainGrid());
    this.element.replaceChildren(wrapper);
  }

  private renderMainGrid(): HTMLElement {
    const grid = document.createElement('section');
    grid.className = 'grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]';

    const main = document.createElement('div');
    main.className = 'overflow-hidden rounded-[24px] bg-white';
    main.append(this.renderStructureCard(), this.renderBasicsCard());

    const right = document.createElement('aside');
    right.className = 'xl:sticky xl:top-4 xl:self-start xl:border-l xl:border-slate-200 xl:pl-5';
    right.append(this.renderNextStepCard());

    grid.append(main, right);
    return grid;
  }

  private renderBasicsCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const expanded = this.isBasicsExpanded();
    const card = document.createElement('section');
    card.className =
      'border-t border-slate-200 px-5 py-5';

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-4';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.overview.basicsTitle');
    header.append(title);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className =
      'shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
    toggle.dataset.role = 'learning-studio-overview-toggle-basics';
    toggle.textContent = i18n.t(
      expanded
        ? 'learningStudio.overview.hideBasicsCta'
        : 'learningStudio.overview.editBasicsCta'
    );
    toggle.addEventListener('click', () => {
      this.basicsExpanded = !expanded;
      this.render();
    });

    header.append(toggle);

    if (!expanded) {
      const summary = document.createElement('p');
      summary.className = 'mt-4 text-sm leading-6 text-slate-600';
      summary.dataset.role = 'learning-studio-overview-basics-summary';
      summary.textContent = this.options.course.description.trim().length > 0
        ? this.options.course.description
        : i18n.t('learningStudio.overview.basicsSummary');

      card.append(header, summary);
      return card;
    }

    const form = document.createElement('form');
    form.className = 'mt-6 grid gap-5';
    form.dataset.role = 'learning-studio-overview-form';

    const titleField = this.createField(
      i18n.t('learningStudio.fields.title'),
      'learning-studio-overview-title-input',
      'input'
    ) as HTMLInputElement;
    titleField.value = this.options.course.title;
    titleField.placeholder = i18n.t('learningStudio.placeholders.courseTitle');

    const descriptionField = this.createField(
      i18n.t('learningStudio.fields.description'),
      'learning-studio-overview-description-input',
      'textarea'
    ) as HTMLTextAreaElement;
    descriptionField.value = this.options.course.description;
    descriptionField.placeholder = i18n.t(
      'learningStudio.placeholders.courseDescription'
    );
    descriptionField.rows = 5;

    const footer = document.createElement('div');
    footer.className =
      'flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className =
      'inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800';
    save.dataset.role = 'learning-studio-overview-save';
    save.textContent = i18n.t('learningStudio.overview.saveCta');

    footer.append(save);
    form.append(
      titleField.parentElement!,
      descriptionField.parentElement!,
      footer
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextTitle = titleField.value.trim();
      const nextDescription = descriptionField.value.trim();
      this.basicsExpanded =
        nextTitle.length === 0 || nextDescription.length === 0;
      this.options.onSaveOverview({
        title: nextTitle,
        description: nextDescription,
      });
    });

    card.append(header, form);
    return card;
  }

  private isBasicsExpanded(): boolean {
    if (this.basicsExpanded !== null) {
      return this.basicsExpanded;
    }

    return (
      this.options.course.title.trim().length === 0 ||
      this.options.course.description.trim().length === 0
    );
  }

  private renderStructureCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = document.createElement('section');
    card.className =
      'px-5 py-5';

    const header = document.createElement('div');
    header.className = 'space-y-2';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.overview.structureTitle');

    const summary = document.createElement('p');
    summary.className = 'text-sm leading-6 text-slate-600';
    summary.textContent = [
      i18n.t('learningStudio.home.courseStatsModules', {
        count: String(this.options.course.moduleCount),
      }),
      i18n.t('learningStudio.home.courseStatsUnits', {
        count: String(this.options.course.unitCount),
      }),
    ].join(' · ');

    header.append(title, summary);
    card.append(header);

    if (this.options.course.structure.length === 0) {
      const empty = document.createElement('div');
      empty.className =
        'mt-5 px-1 py-6';

      const emptyTitle = document.createElement('h4');
      emptyTitle.className = 'text-base font-semibold text-slate-950';
      emptyTitle.textContent = i18n.t('learningStudio.overview.structureEmptyTitle');

      const emptyBody = document.createElement('p');
      emptyBody.className = 'mt-2 text-sm leading-6 text-slate-600';
      emptyBody.textContent = i18n.t('learningStudio.overview.structureEmptyBody');

      empty.append(emptyTitle, emptyBody);
      card.append(empty);
      return card;
    }

      const list = document.createElement('div');
    list.className = 'mt-5 overflow-hidden rounded-[20px] bg-slate-50/80';

    this.options.course.structure.forEach((module, index) => {
      const item = document.createElement('article');
      item.className =
        'border-b border-slate-200 px-5 py-4 last:border-b-0';

      const top = document.createElement('div');
      top.className = 'flex items-start justify-between gap-3';

      const title = document.createElement('h4');
      title.className = 'text-base font-semibold text-slate-950';
      title.textContent =
        module.title.trim().length > 0
          ? module.title
          : `${i18n.t('learningStudio.module.defaultTitle')} ${index + 1}`;

      top.append(title);

      if (module.lessonCount === 0) {
        const warning = document.createElement('span');
        warning.className =
          'shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800';
        warning.textContent = i18n.t('learningStudio.overview.moduleNeedsLessons');
        top.append(warning);
      }

      const stats = document.createElement('p');
      stats.className = 'mt-3 text-sm leading-6 text-slate-600';
      stats.textContent = [
        i18n.t('learningStudio.overview.moduleLessons', {
          count: String(module.lessonCount),
        }),
        i18n.t('learningStudio.overview.moduleExercises', {
          count: String(module.exerciseCount),
        }),
        i18n.t('learningStudio.overview.moduleCheckpoints', {
          count: String(module.checkpointCount),
        }),
      ].join(' · ');

      list.append(item);
      item.append(top, stats);
    });

    card.append(list);
    return card;
  }

  private renderNextStepCard(): HTMLElement {
    const { i18n } = this.options.runtime;
    const card = document.createElement('section');
    card.className = 'space-y-3';

    const title = document.createElement('h3');
    title.className =
      'text-xs font-semibold uppercase tracking-[0.16em] text-slate-500';
    title.textContent = i18n.t('learningStudio.overview.nextTitle');

    const stages: Record<
      'build' | 'preview',
      { title: string; body: string; cta: string }
    > = {
      build: {
        title: i18n.t('learningStudio.overview.nextBuildTitle'),
        body: i18n.t('learningStudio.overview.nextBuildBody'),
        cta: i18n.t('learningStudio.overview.buildCta'),
      },
      preview: {
        title: i18n.t('learningStudio.overview.nextLearnTitle'),
        body: i18n.t('learningStudio.overview.nextLearnBody'),
        cta: i18n.t('learningStudio.overview.learnCta'),
      },
    };

    const selectedStage = stages[this.options.course.nextRecommendedRoute];
    const panel = document.createElement('div');
    panel.className = 'space-y-3';

    const panelTitle = document.createElement('h4');
    panelTitle.className = 'text-lg font-semibold tracking-tight text-slate-950';
    panelTitle.textContent = selectedStage.title;

    const panelBody = document.createElement('p');
    panelBody.className = 'text-sm leading-6 text-slate-600';
    panelBody.textContent = selectedStage.body;

    const actionRow = document.createElement('div');
    actionRow.className = 'flex flex-wrap items-center gap-3 pt-1';

    const cta = this.createPrimaryAction(
      selectedStage.cta,
      'learning-studio-overview-next-step',
      () => this.options.onOpenStage(this.options.course.nextRecommendedRoute)
    );

    actionRow.append(cta);
    panel.append(panelTitle, panelBody, actionRow);
    card.append(title, panel);
    return card;
  }

  private createField(
    labelText: string,
    dataRole: string,
    kind: 'input' | 'textarea'
  ): HTMLInputElement | HTMLTextAreaElement {
    const field = document.createElement('label');
    field.className = 'grid gap-2';

    const text = document.createElement('span');
    text.className = 'text-sm font-medium text-slate-800';
    text.textContent = labelText;

    const control =
      kind === 'input'
        ? document.createElement('input')
        : document.createElement('textarea');

    control.className =
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
    control.dataset.role = dataRole;

    field.append(text, control);
    return control;
  }

  private createPrimaryAction(
    label: string,
    dataRole: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800';
    button.dataset.role = dataRole;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

}
