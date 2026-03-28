import type { AppRuntime } from '../../../../app-runtime/index.ts';
import {
  createBadge,
  createTextButton,
} from '../../../../ui-lib/src/hud/index.ts';
import type { LearningStudioOverviewModel } from './LearningStudioScreenModels.ts';

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
      : 'mx-auto flex w-full max-w-[1480px] flex-col gap-4';
    wrapper.dataset.role = 'learning-studio-course-shell';

    wrapper.append(this.renderHeader(), this.options.content);
    this.element.replaceChildren(wrapper);
  }

  private renderHeader(): HTMLElement {
    const { i18n } = this.options.runtime;
    const { course } = this.options;
    const immersive = this.options.immersive === true;

    const card = document.createElement('section');
    card.className =
      'border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:px-4';
    card.dataset.role = 'learning-studio-course-shell-header';

    const row = document.createElement('div');
    row.className =
      'flex min-w-0 items-center justify-between gap-3 overflow-x-auto';

    const left = document.createElement('div');
    left.className = 'flex min-w-0 items-center gap-2';

    const breadcrumbRow = document.createElement('div');
    breadcrumbRow.className = 'flex shrink-0 items-center gap-2';

    const back = createTextButton({
      text: i18n.t('learningStudio.stage.backHome'),
      tone: 'text',
      size: 'xs',
      onClick: () => {
        this.options.onBackHome();
      },
    });
    back.dataset.role = 'learning-studio-shell-back-home';

    const status = createBadge({
      label: i18n.t(`learningStudio.status.${course.lifecycleState}`),
      tone: 'neutral',
    });

    breadcrumbRow.append(back, status);

    const title = document.createElement('h2');
    title.className =
      'min-w-0 truncate text-sm font-semibold tracking-tight text-slate-950 md:text-base';
    title.textContent =
      course.title.trim().length > 0
        ? course.title
        : i18n.t('learningStudio.home.courseTitleFallback');
    title.title = title.textContent;

    left.append(breadcrumbRow, title);

    const stageRail = document.createElement('div');
    stageRail.className = 'flex shrink-0 items-center gap-2';

    const stageRailButtons = document.createElement('div');
    stageRailButtons.className = 'flex shrink-0 items-center gap-2';
    stageRailButtons.append(
      this.createStageButton(
        i18n.t('learningStudio.shell.overview'),
        'learning-studio-shell-open-overview',
        this.options.currentStage === 'overview',
        () => this.options.onOpenStage('overview')
      ),
      this.createStageButton(
        i18n.t('learningStudio.shell.build'),
        'learning-studio-shell-open-build',
        this.options.currentStage === 'build',
        () => this.options.onOpenStage('build')
      ),
      this.createStageButton(
        i18n.t('learningStudio.shell.preview'),
        'learning-studio-shell-open-preview',
        this.options.currentStage === 'preview',
        () => this.options.onOpenStage('preview')
      )
    );

    stageRail.append(stageRailButtons);

    row.append(left, stageRail);
    card.append(row);
    return card;
  }

  private createStageButton(
    label: string,
    dataRole: string,
    active: boolean,
    onClick: () => void
  ): HTMLButtonElement {
    const button = createTextButton({
      text: label,
      tone: active ? 'primary' : 'text',
      size: 'sm',
      onClick,
    });
    button.dataset.role = dataRole;
    return button;
  }
}
