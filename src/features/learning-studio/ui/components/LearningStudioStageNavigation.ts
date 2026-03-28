type LearningStudioStageNavigationStage = 'overview' | 'build' | 'preview';

type LearningStudioStageNavigationItem = {
  label: string;
  dataRole: string;
  stage: LearningStudioStageNavigationStage;
};

type LearningStudioStageNavigationOptions = {
  items: LearningStudioStageNavigationItem[];
  activeStage: LearningStudioStageNavigationStage;
  onSelectStage: (stage: LearningStudioStageNavigationStage) => void;
};

export class LearningStudioStageNavigation {
  public readonly element: HTMLDivElement;

  constructor(private options: LearningStudioStageNavigationOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-50/90 p-0.5';
    this.element.dataset.role = 'learning-studio-course-shell-stage-rail';
    this.render();
  }

  public update(options: LearningStudioStageNavigationOptions): void {
    this.options = options;
    this.render();
  }

  private render(): void {
    const buttons = this.options.items.map((item) =>
      this.createStageButton(item)
    );
    this.element.replaceChildren(...buttons);
  }

  private createStageButton(
    item: LearningStudioStageNavigationItem
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.role = item.dataRole;
    button.dataset.active =
      this.options.activeStage === item.stage ? 'true' : 'false';
    button.className =
      'inline-flex min-w-[84px] items-center justify-center rounded-full px-3.5 py-2 text-[13px] transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 ' +
      (this.options.activeStage === item.stage
        ? 'bg-white text-slate-950 font-semibold'
        : 'bg-transparent font-medium text-slate-400 hover:bg-white/70 hover:text-slate-700');
    button.textContent = item.label;
    button.addEventListener('click', () => {
      this.options.onSelectStage(item.stage);
    });
    return button;
  }
}
