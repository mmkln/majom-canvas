import { Button } from '../../../../ui-lib/src/components/Button.ts';
import type { AppRuntime } from '../../../../app-runtime/index.ts';

export type LearningStudioSettingsViewOptions = {
  runtime: AppRuntime;
  courseTitle: string;
  courseStatusLabel: string;
  courseDescription?: string;
  moduleCount: number;
  lessonCount: number;
  learnerCount: number;
  updatedAt: string;
  publishedAt?: string | null;
  onPublish?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
};

export class LearningStudioSettingsView {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioSettingsViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
    this.render();
  }

  public update(options: LearningStudioSettingsViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const { i18n } = this.options.runtime;

    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.className = 'text-lg font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.settings.title');
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm leading-6 text-slate-600';
    subtitle.textContent = i18n.t('learningStudio.settings.subtitle');
    header.append(title, subtitle);

    const overview = document.createElement('section');
    overview.className =
      'mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2';
    overview.append(
      this.createInfoBlock(
        i18n.t('learningStudio.settings.courseTitle'),
        this.options.courseTitle
      ),
      this.createInfoBlock(
        i18n.t('learningStudio.settings.courseStatus'),
        this.options.courseStatusLabel
      ),
      this.createInfoBlock(
        i18n.t('learningStudio.settings.moduleCount'),
        String(this.options.moduleCount)
      ),
      this.createInfoBlock(
        i18n.t('learningStudio.settings.lessonCount'),
        String(this.options.lessonCount)
      ),
      this.createInfoBlock(
        i18n.t('learningStudio.settings.learnerCount'),
        String(this.options.learnerCount)
      ),
      this.createInfoBlock(
        i18n.t('learningStudio.settings.updatedAt'),
        this.options.updatedAt
      )
    );

    if (this.options.courseDescription?.trim()) {
      const description = document.createElement('p');
      description.className =
        'mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600';
      description.textContent = this.options.courseDescription;
      overview.append(description);
    }

    if (this.options.publishedAt) {
      overview.append(
        this.createInfoBlock(
          i18n.t('learningStudio.settings.publishedAt'),
          this.options.publishedAt
        )
      );
    }

    const note = document.createElement('p');
    note.className = 'mt-4 text-sm leading-6 text-slate-600';
    note.textContent = i18n.t('learningStudio.settings.localPrototypeNotice');

    const actions = document.createElement('div');
    actions.className = 'mt-4 flex flex-wrap gap-2';
    const publishButton = new Button({
      text: i18n.t('learningStudio.settings.publishCta'),
      variant: 'accent',
      size: 'sm',
      onClick: () => this.options.onPublish?.(),
    });
    const archiveButton = new Button({
      text: i18n.t('learningStudio.settings.archiveCta'),
      variant: 'secondary',
      size: 'sm',
      onClick: () => this.options.onArchive?.(),
    });
    const duplicateButton = new Button({
      text: i18n.t('learningStudio.settings.duplicateCta'),
      variant: 'ghost',
      size: 'sm',
      onClick: () => this.options.onDuplicate?.(),
    });
    actions.append(
      publishButton.getElement(),
      archiveButton.getElement(),
      duplicateButton.getElement()
    );

    const caveat = document.createElement('section');
    caveat.className =
      'mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4';
    const caveatTitle = document.createElement('p');
    caveatTitle.className = 'text-sm font-semibold text-slate-950';
    caveatTitle.textContent = i18n.t('learningStudio.settings.caveatTitle');
    const caveatBody = document.createElement('p');
    caveatBody.className = 'mt-2 text-sm leading-6 text-slate-600';
    caveatBody.textContent = i18n.t('learningStudio.settings.caveatBody');
    caveat.append(caveatTitle, caveatBody);

    this.element.replaceChildren(header, overview, note, actions, caveat);
  }

  private createInfoBlock(label: string, value: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'rounded-xl border border-slate-200 bg-white px-3 py-3';
    const labelEl = document.createElement('p');
    labelEl.className = 'text-xs uppercase tracking-[0.14em] text-slate-500';
    labelEl.textContent = label;
    const valueEl = document.createElement('p');
    valueEl.className = 'mt-1 text-sm font-medium text-slate-900';
    valueEl.textContent = value;
    wrap.append(labelEl, valueEl);
    return wrap;
  }
}
