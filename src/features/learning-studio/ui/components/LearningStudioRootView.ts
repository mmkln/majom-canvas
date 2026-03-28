import type { AppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioBuildStageView } from './LearningStudioBuildStageView.ts';
import { LearningStudioCourseShellView } from './LearningStudioCourseShellView.ts';
import { LearningStudioHomeView } from './LearningStudioHomeView.ts';
import { LearningStudioOverviewView } from './LearningStudioOverviewView.ts';
import { LearningStudioPreviewView } from './LearningStudioPreviewView.ts';
import type { LearningStudioScreenModel } from './LearningStudioScreenModels.ts';

type LearningStudioRootViewOptions = {
  runtime: AppRuntime;
  screen: LearningStudioScreenModel;
  onCreateManual: () => void;
  onOpenCourse: (courseId: string) => void;
  onBackHome: () => void;
  onBackOverview: (() => void) | null;
  onOpenStage: (route: 'overview' | 'build' | 'preview') => void;
  onSaveOverview: (payload: {
    title: string;
    description: string;
  }) => void;
  onAddModule: () => void;
  onOpenPreview: () => void;
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
  onSelectPreviewLesson: (unitId: string) => void;
};

type LearningStudioScreenInstance = {
  key: string;
  element: HTMLElement;
  destroy?: () => void;
  update?: (options: LearningStudioRootViewOptions) => void;
};

export class LearningStudioRootView {
  public readonly element: HTMLDivElement;
  private readonly content: HTMLElement;
  private currentScreen: LearningStudioScreenInstance | null = null;

  constructor(private options: LearningStudioRootViewOptions) {
    this.element = document.createElement('div');
    this.element.className =
      'flex h-full w-full flex-col overflow-hidden bg-white text-slate-900';
    this.content = document.createElement('main');
    this.element.append(this.content);
    this.render();
  }

  public update(options: LearningStudioRootViewOptions): void {
    this.options = options;
    this.render();
  }

  public destroy(): void {
    this.currentScreen?.destroy?.();
    this.currentScreen = null;
  }

  private render(): void {
    const immersiveCanvasStage =
      this.options.screen.kind === 'build' ||
      this.options.screen.kind === 'preview';
    const overviewStage = this.options.screen.kind === 'overview';
    this.content.className = immersiveCanvasStage
      ? 'min-h-0 flex-1 overflow-hidden'
      : overviewStage
        ? 'min-h-0 flex-1 overflow-auto'
        : 'min-h-0 flex-1 overflow-auto px-6 py-6 md:px-8';

    const nextKey = this.getScreenKey(this.options.screen);
    if (this.currentScreen?.key === nextKey && this.currentScreen.update) {
      this.currentScreen.update(this.options);
      return;
    }

    const nextScreen = this.renderScreen();
    this.currentScreen?.destroy?.();
    this.currentScreen = nextScreen;
    this.content.replaceChildren(nextScreen.element);
  }

  private getScreenKey(screen: LearningStudioScreenModel): string {
    switch (screen.kind) {
      case 'home':
        return 'home';
      case 'overview':
        return `overview:${screen.course.courseId}`;
      case 'build':
        return `build:${screen.build.course.courseId}`;
      case 'preview':
        return `preview:${screen.preview.course.courseId}`;
    }
  }

  private renderScreen(): LearningStudioScreenInstance {
    switch (this.options.screen.kind) {
      case 'home':
        return {
          key: 'home',
          element: new LearningStudioHomeView({
            runtime: this.options.runtime,
            courses: this.options.screen.courses,
            onCreateManual: this.options.onCreateManual,
            onOpenCourse: this.options.onOpenCourse,
          }).element,
        };
      case 'overview':
        return {
          key: `overview:${this.options.screen.course.courseId}`,
          element: new LearningStudioCourseShellView({
            runtime: this.options.runtime,
            course: this.options.screen.course,
            currentStage: 'overview',
            onBackHome: this.options.onBackHome,
            onOpenStage: this.options.onOpenStage,
            content: new LearningStudioOverviewView({
              runtime: this.options.runtime,
              course: this.options.screen.course,
              onOpenStage: this.options.onOpenStage,
              onSaveOverview: this.options.onSaveOverview,
              onSelectModule: this.options.onSelectModule,
            }).element,
          }).element,
        };
      case 'build': {
        const buildStage = new LearningStudioBuildStageView({
          runtime: this.options.runtime,
          build: this.options.screen.build,
          onAddModule: this.options.onAddModule,
          onSelectCourse: this.options.onSelectCourse,
          onSelectModule: this.options.onSelectModule,
          onSelectUnit: this.options.onSelectUnit,
          onAddLesson: this.options.onAddLesson,
          onAddExercise: this.options.onAddExercise,
          onAddCheckpoint: this.options.onAddCheckpoint,
          onMoveModule: this.options.onMoveModule,
          onToggleModuleCollapse: this.options.onToggleModuleCollapse,
          onMoveLesson: this.options.onMoveLesson,
          onMoveChildUnit: this.options.onMoveChildUnit,
          onUpdateModuleTitle: this.options.onUpdateModuleTitle,
          onUpdateModuleDescription: this.options.onUpdateModuleDescription,
          onUpdateUnitTitle: this.options.onUpdateUnitTitle,
          onUpdateUnitDescription: this.options.onUpdateUnitDescription,
          onUpdateUnitObjective: this.options.onUpdateUnitObjective,
          onTogglePrerequisite: this.options.onTogglePrerequisite,
          onAddLessonBlock: this.options.onAddLessonBlock,
          onUpdateLessonBlockType: this.options.onUpdateLessonBlockType,
          onUpdateLessonBlockText: this.options.onUpdateLessonBlockText,
          onUpdateLessonBlockReference:
            this.options.onUpdateLessonBlockReference,
          onMoveLessonBlock: this.options.onMoveLessonBlock,
          onRemoveLessonBlock: this.options.onRemoveLessonBlock,
        });
        return {
          key: `build:${this.options.screen.build.course.courseId}`,
          element: new LearningStudioCourseShellView({
            runtime: this.options.runtime,
            course: this.options.screen.build.course,
            currentStage: 'build',
            onBackHome: this.options.onBackHome,
            onOpenStage: this.options.onOpenStage,
            content: buildStage.element,
            immersive: true,
          }).element,
          destroy: () => buildStage.destroy(),
          update: (options) => {
            if (options.screen.kind !== 'build') {
              return;
            }
            buildStage.update({
              runtime: options.runtime,
              build: options.screen.build,
              onAddModule: options.onAddModule,
              onSelectCourse: options.onSelectCourse,
              onSelectModule: options.onSelectModule,
              onSelectUnit: options.onSelectUnit,
              onAddLesson: options.onAddLesson,
              onAddExercise: options.onAddExercise,
              onAddCheckpoint: options.onAddCheckpoint,
              onMoveModule: options.onMoveModule,
              onToggleModuleCollapse: options.onToggleModuleCollapse,
              onMoveLesson: options.onMoveLesson,
              onMoveChildUnit: options.onMoveChildUnit,
              onUpdateModuleTitle: options.onUpdateModuleTitle,
              onUpdateModuleDescription: options.onUpdateModuleDescription,
              onUpdateUnitTitle: options.onUpdateUnitTitle,
              onUpdateUnitDescription: options.onUpdateUnitDescription,
              onUpdateUnitObjective: options.onUpdateUnitObjective,
              onTogglePrerequisite: options.onTogglePrerequisite,
              onAddLessonBlock: options.onAddLessonBlock,
              onUpdateLessonBlockType: options.onUpdateLessonBlockType,
              onUpdateLessonBlockText: options.onUpdateLessonBlockText,
              onUpdateLessonBlockReference:
                options.onUpdateLessonBlockReference,
              onMoveLessonBlock: options.onMoveLessonBlock,
              onRemoveLessonBlock: options.onRemoveLessonBlock,
            });
          },
        };
      }
      case 'preview': {
        const previewView = new LearningStudioPreviewView({
          runtime: this.options.runtime,
          preview: this.options.screen.preview,
          onSelectLesson: this.options.onSelectPreviewLesson,
        });
        return {
          key: `preview:${this.options.screen.preview.course.courseId}`,
          element: new LearningStudioCourseShellView({
            runtime: this.options.runtime,
            course: this.options.screen.preview.course,
            currentStage: 'preview',
            onBackHome: this.options.onBackHome,
            onOpenStage: this.options.onOpenStage,
            content: previewView.element,
            immersive: true,
          }).element,
          update: (options) => {
            if (options.screen.kind !== 'preview') {
              return;
            }
            previewView.update({
              runtime: options.runtime,
              preview: options.screen.preview,
              onSelectLesson: options.onSelectPreviewLesson,
            });
          },
        };
      }
    }
  }
}
