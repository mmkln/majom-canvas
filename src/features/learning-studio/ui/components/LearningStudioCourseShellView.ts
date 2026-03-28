import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningStudioOverviewModel } from './LearningStudioScreenModels.ts';
import { LearningStudioStageNavigation } from './LearningStudioStageNavigation.ts';
import { ActionButton } from './primitives/index.ts';

type LearningStudioCourseShellStage =
  | 'overview'
  | 'build'
  | 'preview';

type LearningStudioCourseShellViewOptions = {
  runtime: AppRuntime;
  course: LearningStudioOverviewModel;
  currentStage: LearningStudioCourseShellStage;
  content: HTMLElement;
  onBackHome: () => void;
  onOpenStage: (route: LearningStudioCourseShellStage) => void;
  immersive?: boolean;
};

export class LearningStudioCourseShellView {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioCourseShellViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'flex h-full w-full flex-col';
    this.render();
  }

  public update(options: LearningStudioCourseShellViewOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const wrapper = document.createElement('div');
    wrapper.className = this.options.immersive
      ? 'flex h-full min-h-0 flex-col'
      : 'flex w-full flex-col gap-4';
    wrapper.dataset.role = 'learning-studio-course-shell';

    const contentRegion = document.createElement('div');
    contentRegion.className = this.options.immersive
      ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
      : 'min-w-0';
    contentRegion.dataset.role = 'learning-studio-course-shell-content';
    contentRegion.append(this.options.content);

    wrapper.append(this.renderHeader(), contentRegion);
    this.element.replaceChildren(wrapper);
  }

  private renderHeader(): HTMLElement {
    const { i18n } = this.options.runtime;
    const { course } = this.options;

    const card = document.createElement('section');
    card.className = 'bg-white px-3 py-2.5 md:px-4';
    card.dataset.role = 'learning-studio-course-shell-header';

    const row = document.createElement('div');
    row.className =
      'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3';
    row.dataset.role = 'learning-studio-course-shell-main-row';

    const left = document.createElement('div');
    left.className = 'flex min-w-0 items-center gap-2 justify-self-start';

    const breadcrumbRow = document.createElement('div');
    breadcrumbRow.className = 'flex shrink-0 items-center gap-2';

    const backLabel = i18n.t('learningStudio.stage.backHome');
    const back = ActionButton({
      label: backLabel,
      icon: 'arrow-left',
      tone: 'ghost',
      size: 'sm',
      className: '-ml-2 px-2.5 py-1.5 text-[13px] font-medium',
      dataRole: 'learning-studio-shell-back-home',
      onClick: () => {
        this.options.onBackHome();
      },
    });

    breadcrumbRow.append(back);

    if (this.options.currentStage !== 'overview') {
      const status = document.createElement('span');
      status.className =
        'text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300';
      status.textContent = i18n.t(`learningStudio.status.${course.lifecycleState}`);
      breadcrumbRow.append(status);
    }

    left.append(breadcrumbRow);

    const stageRail = document.createElement('div');
    stageRail.className = 'flex shrink-0 items-center justify-self-center';
    stageRail.append(
      new LearningStudioStageNavigation({
        items: [
          {
            label: i18n.t('learningStudio.shell.overview'),
            dataRole: 'learning-studio-shell-open-overview',
            stage: 'overview',
          },
          {
            label: i18n.t('learningStudio.shell.build'),
            dataRole: 'learning-studio-shell-open-build',
            stage: 'build',
          },
          {
            label: i18n.t('learningStudio.shell.preview'),
            dataRole: 'learning-studio-shell-open-preview',
            stage: 'preview',
          },
        ],
        activeStage: this.options.currentStage,
        onSelectStage: (stage) => this.options.onOpenStage(stage),
      }).element
    );

    const rightSpacer = document.createElement('div');
    rightSpacer.className = 'min-w-0 justify-self-end';
    rightSpacer.setAttribute('aria-hidden', 'true');

    row.append(left, stageRail, rightSpacer);
    card.append(row);
    return card;
  }
}
