import type { AppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningCanvasHostApi } from '../../canvas/LearningCanvasHostApi.ts';
import {
  LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
  type LearningCanvasEditorRequestedDetail,
} from '../../canvas/LearningCanvasEditorEvents.ts';
import { LearningStudioBuildDetailsModal } from './LearningStudioBuildDetailsModal.ts';
import { LearningStudioCanvasHostView } from './LearningStudioCanvasHostView.ts';
import type { LearningStudioBuildModel } from './LearningStudioScreenModels.ts';

type LearningStudioBuildStageViewOptions = {
  runtime: AppRuntime;
  build: LearningStudioBuildModel;
  hostApi: LearningCanvasHostApi;
  onAddModule: () => void;
  onSelectCourse: () => void;
  onSelectModule: (moduleId: string) => void;
  onSelectUnit: (unitId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onToggleModuleCollapse: (moduleId: string) => void;
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
  private canvasHost: LearningStudioCanvasHostView;
  private detailsModal: LearningStudioBuildDetailsModal | null = null;
  private canvasId: string;
  private pendingEditorTarget:
    | { kind: 'module'; id: string }
    | { kind: 'unit'; id: string }
    | null = null;
  private readonly editorRequestHandler = (event: Event): void => {
    const customEvent =
      event as CustomEvent<LearningCanvasEditorRequestedDetail>;
    const detail = customEvent.detail;
    if (!detail) return;
    this.openDetailsForTarget(detail);
  };

  constructor(private options: LearningStudioBuildStageViewOptions) {
    this.element = document.createElement('div');
    this.element.className = 'flex h-full min-h-0 w-full flex-col bg-slate-50';
    this.canvasId = options.hostApi.getDocument().canvasId;
    this.canvasHost = this.createCanvasHost(options.hostApi);
    window.addEventListener(
      LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
      this.editorRequestHandler
    );
    this.render();
  }

  public update(options: LearningStudioBuildStageViewOptions): void {
    const nextCanvasId = options.hostApi.getDocument().canvasId;
    const shouldRecreateCanvas = nextCanvasId !== this.canvasId;
    this.options = options;
    if (shouldRecreateCanvas) {
      this.canvasHost.destroy();
      this.canvasHost = this.createCanvasHost(options.hostApi);
      this.canvasId = nextCanvasId;
    }
    this.syncDetailsModal();
    this.render();
  }

  public destroy(): void {
    this.canvasHost.destroy();
    this.detailsModal?.destroy();
    this.detailsModal = null;
    window.removeEventListener(
      LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
      this.editorRequestHandler
    );
  }

  private render(): void {
    const stage = document.createElement('section');
    stage.className = 'flex h-full min-h-0 w-full flex-col';
    stage.dataset.role = 'learning-studio-build-stage';

    const workspaceRegion = document.createElement('section');
    workspaceRegion.className = 'flex min-h-0 min-w-0 flex-1 flex-col';
    workspaceRegion.append(
      this.renderWorkspaceHeader(),
      this.renderCanvasWorkspace()
    );
    stage.append(workspaceRegion);

    this.element.replaceChildren(stage);
  }

  private createCanvasHost(hostApi: LearningCanvasHostApi): LearningStudioCanvasHostView {
    return new LearningStudioCanvasHostView({
      runtime: this.options.runtime,
      route: 'build',
      hostApi,
    });
  }

  private createInspectorOptions(
    options: LearningStudioBuildStageViewOptions
  ): Omit<
    ConstructorParameters<typeof LearningStudioBuildDetailsModal>[0],
    'title' | 'onClose'
  > {
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

  private isTargetSelected(target: {
    kind: 'module';
    id: string;
  } | {
    kind: 'unit';
    id: string;
  }): boolean {
    return (
      this.options.build.selected?.kind === target.kind &&
      this.options.build.selected.id === target.id
    );
  }

  private openDetailsForTarget(target: {
    kind: 'module';
    id: string;
  } | {
    kind: 'unit';
    id: string;
  }): void {
    this.pendingEditorTarget = target;
    if (!this.isTargetSelected(target)) {
      if (target.kind === 'module') {
        this.options.onSelectModule(target.id);
      } else {
        this.options.onSelectUnit(target.id);
      }
      return;
    }
    this.ensureDetailsModal();
  }

  private ensureDetailsModal(): void {
    if (this.detailsModal) {
      this.detailsModal.update(this.createDetailsModalOptions());
      return;
    }
    this.detailsModal = new LearningStudioBuildDetailsModal(
      this.createDetailsModalOptions()
    );
  }

  private createDetailsModalOptions(): ConstructorParameters<
    typeof LearningStudioBuildDetailsModal
  >[0] {
    return {
      ...this.createInspectorOptions(this.options),
      title: this.options.runtime.i18n.t(
        'learningStudio.build.detailsModalTitle'
      ),
      onClose: () => {
        this.pendingEditorTarget = null;
        this.detailsModal?.destroy();
        this.detailsModal = null;
      },
    };
  }

  private syncDetailsModal(): void {
    if (
      this.pendingEditorTarget &&
      this.isTargetSelected(this.pendingEditorTarget)
    ) {
      this.ensureDetailsModal();
      return;
    }
    if (this.detailsModal) {
      this.detailsModal.update(this.createDetailsModalOptions());
    }
  }

  private renderWorkspaceHeader(): HTMLElement {
    const { i18n } = this.options.runtime;
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3';

    const meta = document.createElement('div');
    meta.className = 'min-w-0';

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-950';
    title.textContent = i18n.t('learningStudio.build.workspaceTitle');

    const hint = document.createElement('p');
    hint.className = 'mt-1 text-sm text-slate-600';
    hint.textContent = i18n.t('learningStudio.build.workspaceHint');

    meta.append(title, hint);

    const addModule = document.createElement('button');
    addModule.type = 'button';
    addModule.className =
      'inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800';
    addModule.dataset.role = 'learning-studio-build-add-module';
    addModule.textContent = i18n.t('learningStudio.build.addModuleCta');
    addModule.addEventListener('click', () => {
      this.options.onAddModule();
    });

    header.append(meta, addModule);
    return header;
  }

  private renderCanvasWorkspace(): HTMLElement {
    const workspace = document.createElement('div');
    workspace.className = 'relative min-h-0 min-w-0 flex-1 overflow-hidden';
    workspace.dataset.role = 'learning-studio-build-workspace';

    const canvasRegion = document.createElement('div');
    canvasRegion.className = 'relative h-full min-h-[520px] min-w-0 flex-1';
    canvasRegion.append(this.canvasHost.element);
    workspace.append(canvasRegion);

    if (this.options.build.modules.length === 0) {
      workspace.append(this.renderEmptyState());
    }

    return workspace;
  }

  private renderEmptyState(): HTMLElement {
    const { i18n } = this.options.runtime;
    const overlay = document.createElement('div');
    overlay.className =
      'pointer-events-none absolute inset-0 flex items-center justify-center px-6';
    overlay.dataset.role = 'learning-studio-build-empty';

    const content = document.createElement('div');
    content.className =
      'pointer-events-auto flex max-w-md flex-col items-center gap-3 text-center';

    const title = document.createElement('h4');
    title.className = 'text-xl font-semibold tracking-tight text-slate-950';
    title.textContent = i18n.t('learningStudio.build.emptyTitle');

    const body = document.createElement('p');
    body.className = 'text-sm leading-6 text-slate-600';
    body.textContent = i18n.t('learningStudio.build.emptyBody');

    const action = document.createElement('button');
    action.type = 'button';
    action.className =
      'inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800';
    action.dataset.role = 'learning-studio-build-empty-add-module';
    action.textContent = i18n.t('learningStudio.build.addModuleCta');
    action.addEventListener('click', () => {
      this.options.onAddModule();
    });

    content.append(title, body, action);
    overlay.append(content);
    return overlay;
  }
}
