import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { LocalStorageLearningStudioRepository } from './data/LocalStorageLearningStudioRepository.ts';
import {
  createDefaultLearningModuleLayout,
  createEmptyLearningCourseContent,
  createEmptyLearningStudioState,
  createEmptyLearningStudioUiState,
  deriveLearningStudioMode,
  type LearningCourseContent,
  type LearningCourseDraft,
  type LearningCourseModule,
  type LearningCoursePublishedVersion,
  type LearningCourseRecord,
  type LearningCourseUnit,
  type LearningLessonBlock,
  type LearningLessonTextBlockType,
  type LearningEnrollment,
  type LearningProgressState,
  type LearningStudioLocalStateV2,
  type LearningStudioUiStateV2,
  type LearningUnitType,
} from './domain/types.ts';
import { LearningStudioRootView } from './ui/components/LearningStudioRootView.ts';
import type {
  LearningStudioBuildInspectorModel,
  LearningStudioBuildModel,
  LearningStudioHomeCourseCard,
  LearningStudioOverviewModel,
  LearningStudioPreviewModel,
  LearningStudioScreenModel,
} from './ui/components/LearningStudioScreenModels.ts';
import type {
  LearningCanvasDocument,
  LearningCanvasHostApi,
  LearningCanvasSelection,
} from './canvas/LearningCanvasHostApi.ts';

type LearningStudioAppOptions = {
  runtime?: AppRuntime;
  repository?: LocalStorageLearningStudioRepository;
};

type CourseOverviewSavePayload = {
  title: string;
  description: string;
};

export class LearningStudioApp {
  private readonly runtime: AppRuntime;
  private readonly repository: LocalStorageLearningStudioRepository;
  private root: HTMLDivElement | null = null;
  private view: LearningStudioRootView | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private state: LearningStudioLocalStateV2 = createEmptyLearningStudioState();
  private uiState: LearningStudioUiStateV2 = createEmptyLearningStudioUiState();

  constructor(options: LearningStudioAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.repository =
      options.repository ?? new LocalStorageLearningStudioRepository();
  }

  public mount(parent: HTMLElement): void {
    if (this.root) return;

    this.state = this.normalizeState(this.repository.loadState());
    this.uiState = this.normalizeUiState(
      this.repository.loadUiState(),
      this.state
    );
    this.persist();

    const root = document.createElement('div');
    root.className = 'h-full w-full';
    root.dataset.module = 'learning-studio';

    this.view = new LearningStudioRootView(this.buildViewOptions());
    root.appendChild(this.view.element);
    parent.appendChild(root);
    this.root = root;

    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.render();
    });
  }

  public unmount(): void {
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.view?.destroy();
    this.view = null;
    this.root?.remove();
    this.root = null;
  }

  public getStateSnapshot(): LearningStudioLocalStateV2 {
    return structuredClone(this.state);
  }

  public getUiStateSnapshot(): LearningStudioUiStateV2 {
    return structuredClone(this.uiState);
  }

  private render(): void {
    this.view?.update(this.buildViewOptions());
  }

  private buildViewOptions(): ConstructorParameters<typeof LearningStudioRootView>[0] {
    return {
      runtime: this.runtime,
      screen: this.buildScreenModel(),
      onCreateManual: () => this.createCourse(),
      onOpenCourse: (courseId: string) => this.openCourseOverview(courseId),
      onBackHome: () => this.navigateHome(),
      onBackOverview: this.uiState.selectedCourseId
        ? () => this.openRoute('overview')
        : null,
      onOpenStage: (route) => this.openRoute(route),
      onOpenPreview: () => this.openRoute('preview'),
      onSaveOverview: (payload) => this.saveCourseOverview(payload),
      onAddModule: () => this.addModule(),
      onSelectCourse: () => this.selectCourseContext(),
      onSelectModule: (moduleId: string) => this.selectModule(moduleId),
      onSelectUnit: (unitId: string) => this.selectUnit(unitId),
      onAddLesson: (moduleId: string) => this.addLesson(moduleId),
      onAddExercise: (lessonId: string) => this.addChildUnit(lessonId, 'exercise'),
      onAddCheckpoint: (lessonId: string) =>
        this.addChildUnit(lessonId, 'checkpoint'),
      onMoveModule: (moduleId: string, direction: -1 | 1) =>
        this.moveModule(moduleId, direction),
      onToggleModuleCollapse: (moduleId: string) =>
        this.toggleModuleCollapse(moduleId),
      onMoveLesson: (lessonId: string, direction: -1 | 1) =>
        this.moveLesson(lessonId, direction),
      onMoveChildUnit: (unitId: string, direction: -1 | 1) =>
        this.moveChildUnit(unitId, direction),
      onUpdateModuleTitle: (moduleId: string, title: string) =>
        this.updateModuleTitle(moduleId, title),
      onUpdateModuleDescription: (moduleId: string, description: string) =>
        this.updateModuleDescription(moduleId, description),
      onUpdateUnitTitle: (unitId: string, title: string) =>
        this.updateUnitTitle(unitId, title),
      onUpdateUnitDescription: (unitId: string, description: string) =>
        this.updateUnitDescription(unitId, description),
      onUpdateUnitObjective: (unitId: string, objective: string) =>
        this.updateUnitObjective(unitId, objective),
      onTogglePrerequisite: (unitId: string, prerequisiteId: string) =>
        this.togglePrerequisite(unitId, prerequisiteId),
      onAddLessonBlock: (unitId, type) => this.addLessonBlock(unitId, type),
      onUpdateLessonBlockType: (unitId, blockId, type) =>
        this.updateLessonBlockType(unitId, blockId, type),
      onUpdateLessonBlockText: (unitId, blockId, text) =>
        this.updateLessonBlockText(unitId, blockId, text),
      onUpdateLessonBlockReference: (unitId, blockId, refUnitId) =>
        this.updateLessonBlockReference(unitId, blockId, refUnitId),
      onMoveLessonBlock: (unitId, blockId, direction) =>
        this.moveLessonBlock(unitId, blockId, direction),
      onRemoveLessonBlock: (unitId, blockId) =>
        this.removeLessonBlock(unitId, blockId),
      onSelectPreviewLesson: (unitId) => this.selectPreviewLesson(unitId),
      resolveCanvasHostApi: (route) => this.resolveCanvasHostApi(route),
    };
  }

  private buildScreenModel(): LearningStudioScreenModel {
    if (this.uiState.route === 'home') {
      return {
        kind: 'home',
        courses: this.buildHomeCourseCards(),
      };
    }

    const overview = this.buildOverviewModel(this.uiState.selectedCourseId);
    if (this.uiState.route === 'overview' && overview) {
      return {
        kind: 'overview',
        course: overview,
      };
    }

    if (this.uiState.route === 'build' && overview) {
      return {
        kind: 'build',
        build: this.buildBuildModel(overview),
      };
    }

    if (this.uiState.route === 'preview' && overview) {
      return {
        kind: 'preview',
        preview: this.buildPreviewModel(overview),
      };
    }

    return {
      kind: 'home',
      courses: this.buildHomeCourseCards(),
    };
  }

  private buildHomeCourseCards(): LearningStudioHomeCourseCard[] {
    return this.state.courses
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((course) => {
        const content = this.getPrimaryAuthoringContent(course);
        return {
          id: course.id,
          title: content.title,
          description: content.description,
          lifecycleState: course.lifecycleState,
          moduleCount: content.modules.length,
          unitCount: content.units.length,
          updatedAt: course.updatedAt,
        };
      });
  }

  private buildOverviewModel(courseId: string | null): LearningStudioOverviewModel | null {
    const course = this.findCourse(this.state, courseId);
    if (!course) return null;

    const draft = this.findDraftForCourse(course);
    const content = draft?.content ?? this.getPrimaryAuthoringContent(course);
    const structure = content.modules
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((module) => {
        const units = content.units.filter((unit) => unit.moduleId === module.id);
        return {
          id: module.id,
          title: module.title,
          lessonCount: units.filter((unit) => unit.type === 'lesson').length,
          exerciseCount: units.filter((unit) => unit.type === 'exercise').length,
          checkpointCount: units.filter((unit) => unit.type === 'checkpoint').length,
        };
      });

    const basicsReady =
      content.title.trim().length > 0 &&
      content.description.trim().length > 0;
    const structureReady =
      content.modules.length > 0 &&
      content.units.some((unit) => unit.type === 'lesson' || unit.type === 'exercise');
    const previewReady = basicsReady && structureReady;

    return {
      courseId: course.id,
      draftId: draft?.id ?? null,
      title: content.title,
      description: content.description,
      audience: content.audience,
      outcomes: content.outcomes,
      lifecycleState: course.lifecycleState,
      moduleCount: content.modules.length,
      unitCount: content.units.length,
      latestPublishedVersionId: course.latestPublishedVersionId,
      updatedAt: course.updatedAt,
      structure,
      nextRecommendedRoute:
        !basicsReady || !structureReady ? 'build' : 'preview',
    };
  }

  private buildBuildModel(course: LearningStudioOverviewModel): LearningStudioBuildModel {
    const courseRecord = this.findCourse(this.state, course.courseId);
    const content = courseRecord
      ? this.getPrimaryAuthoringContent(courseRecord)
      : createEmptyLearningCourseContent();

    const topLevelLessons = this.getTopLevelLessons(content);
    const topLevelLessonIds = new Set(topLevelLessons.map((lesson) => lesson.id));
    const selectedModuleId =
      this.uiState.selectedElementKind === 'module' ? this.uiState.selectedElementId : null;
    const selectedUnitId =
      this.uiState.selectedElementKind === 'lesson' ? this.uiState.selectedElementId : null;

    const modules = content.modules
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((module) => {
        const layout = content.moduleLayouts.find(
          (candidate) => candidate.moduleId === module.id
        );
        const lessons = this.getModuleLessons(content, module).map((lesson) => {
          const childUnits = content.units
            .filter((unit) => unit.parentLessonId === lesson.id)
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((unit) => ({
              id: unit.id,
              title: unit.title,
              type: unit.type as 'exercise' | 'checkpoint',
              order: unit.order,
              selected: selectedUnitId === unit.id,
            }));
          const lessonSelected =
            selectedUnitId === lesson.id ||
            childUnits.some((unit) => unit.selected);
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            type: 'lesson' as const,
            order: lesson.order,
            selected: lessonSelected,
            missingDescription: lesson.description.trim().length === 0,
            prerequisiteIssue: lesson.prerequisiteLessonIds.some(
              (prerequisiteId) => !topLevelLessonIds.has(prerequisiteId)
            ),
            childUnits,
          };
        });
        const moduleSelected =
          selectedModuleId === module.id || lessons.some((lesson) => lesson.selected);

        return {
          id: module.id,
          title: module.title,
          description: module.description,
          order: module.order,
          selected: moduleSelected,
          collapsed: layout?.collapsed ?? false,
          missingLessons: lessons.length === 0,
          childUnitCount: lessons.reduce(
            (total, lesson) => total + lesson.childUnits.length,
            0
          ),
          lessons,
        };
      });

    const selectedUnit =
      selectedUnitId != null
        ? content.units.find((unit) => unit.id === selectedUnitId) ?? null
        : null;
    const selectedModule =
      selectedModuleId != null
        ? content.modules.find((module) => module.id === selectedModuleId) ?? null
        : null;
    const availableExerciseRefs =
      selectedUnit?.type === 'lesson'
        ? content.units
            .filter(
              (unit) =>
                unit.parentLessonId === selectedUnit.id && unit.type === 'exercise'
            )
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((unit) => ({
              id: unit.id,
              title:
                unit.title.trim().length > 0
                  ? unit.title
                  : this.runtime.i18n.t('learningStudio.lesson.defaultExerciseTitle'),
            }))
        : [];
    const availableCheckpointRefs =
      selectedUnit?.type === 'lesson'
        ? content.units
            .filter(
              (unit) =>
                unit.parentLessonId === selectedUnit.id &&
                unit.type === 'checkpoint'
            )
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((unit) => ({
              id: unit.id,
              title:
                unit.title.trim().length > 0
                  ? unit.title
                  : this.runtime.i18n.t('learningStudio.lesson.defaultCheckpointTitle'),
            }))
        : [];

    const inspector: LearningStudioBuildInspectorModel = selectedUnit
      ? {
          kind: 'unit',
          id: selectedUnit.id,
          title: selectedUnit.title,
          description: selectedUnit.description,
          objective: selectedUnit.objective,
          type: selectedUnit.type,
          prerequisiteLessonIds: selectedUnit.prerequisiteLessonIds,
          availablePrerequisites: topLevelLessons
            .filter((lesson) => lesson.id !== selectedUnit.id)
            .map((lesson) => ({
              id: lesson.id,
              title:
                lesson.title.trim().length > 0
                  ? lesson.title
                  : this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle'),
            })),
          blocks: selectedUnit.blocks.map((block) =>
            'text' in block
              ? {
                  id: block.id,
                  order: block.order,
                  type: block.type,
                  text: block.text,
                }
              : {
                  id: block.id,
                  order: block.order,
                  type: block.type,
                  refUnitId: block.refUnitId,
                }
          ),
          availableExerciseRefs,
          availableCheckpointRefs,
        }
      : selectedModule
        ? {
            kind: 'module',
            id: selectedModule.id,
            title: selectedModule.title,
            description: selectedModule.description,
            lessonCount: this.getModuleLessons(content, selectedModule).length,
          }
        : {
            kind: 'course',
            title: course.title,
            description: course.description,
            moduleCount: content.modules.length,
            unitCount: content.units.length,
            missingModules: content.modules.length === 0,
            missingDescriptions: content.units.filter(
              (unit) => unit.description.trim().length === 0
            ).length,
          };

    const selected =
      selectedUnit != null
        ? ({ kind: 'unit', id: selectedUnit.id } as const)
        : selectedModule != null
          ? ({ kind: 'module', id: selectedModule.id } as const)
          : ({ kind: 'course', id: course.courseId } as const);

    return {
      course,
      modules,
      selected,
      inspector,
    };
  }

  private buildPreviewModel(
    course: LearningStudioOverviewModel
  ): LearningStudioPreviewModel {
    const courseRecord = this.findCourse(this.state, course.courseId);
    const content = courseRecord
      ? this.getPrimaryAuthoringContent(courseRecord)
      : createEmptyLearningCourseContent();
    const lessonById = new Map(
      this.getTopLevelLessons(content)
        .filter((lesson) => lesson.type === 'lesson')
        .map((lesson) => [lesson.id, lesson] as const)
    );
    const focusedLessonId = resolvePreviewFocusedLessonId(
      lessonById,
      this.uiState.preview.focusedUnitId,
      this.uiState.preview.sandboxProgress
    );

    const modules = content.modules
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((module) => ({
        id: module.id,
        title: module.title,
        lessons: this.getModuleLessons(content, module)
          .filter((lesson) => lesson.type === 'lesson')
          .map((lesson) => {
            const warningKeys = getPreviewLessonWarningKeys(lesson, content);
            return {
              id: lesson.id,
              moduleId: module.id,
              title:
                lesson.title.trim().length > 0
                  ? lesson.title
                  : this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle'),
              status: getPreviewLessonStatus(
                lesson,
                this.uiState.preview.sandboxProgress
              ),
              selected: focusedLessonId === lesson.id,
              hasWarnings: warningKeys.length > 0,
            };
          }),
      }))
      .filter((module) => module.lessons.length > 0);

    const focusedLesson =
      focusedLessonId !== null ? lessonById.get(focusedLessonId) ?? null : null;

    return {
      course,
      modules,
      focusedLesson:
        focusedLesson === null
          ? null
          : this.buildPreviewFocusedLesson(content, focusedLesson),
      nextRecommendedLessonId: resolvePreviewRecommendedLessonId(
        lessonById,
        this.uiState.preview.sandboxProgress
      ),
      sandboxMode: true,
    };
  }

  private buildPreviewFocusedLesson(
    content: LearningCourseContent,
    lesson: LearningCourseUnit
  ) {
    const module = content.modules.find((candidate) => candidate.id === lesson.moduleId);
    const lessonById = new Map(
      this.getTopLevelLessons(content).map((candidate) => [candidate.id, candidate] as const)
    );
    const blockedByTitles = lesson.prerequisiteLessonIds
      .filter((prerequisiteId) => {
        const prerequisite = lessonById.get(prerequisiteId);
        return (
          prerequisite !== undefined &&
          !isPreviewProgressCompleted(
            this.uiState.preview.sandboxProgress[prerequisiteId]
          )
        );
      })
      .map((prerequisiteId) => {
        const prerequisite = lessonById.get(prerequisiteId);
        return prerequisite?.title.trim().length
          ? prerequisite.title
          : this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle');
      });
    const warnings = getPreviewLessonWarningKeys(lesson, content).map((key) =>
      this.runtime.i18n.t(key)
    );

    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      moduleTitle: module?.title.trim().length
        ? module.title
        : this.runtime.i18n.t('learningStudio.module.defaultTitle'),
      title:
        lesson.title.trim().length > 0
          ? lesson.title
          : this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle'),
      description: lesson.description,
      objective: lesson.objective,
      status: getPreviewLessonStatus(lesson, this.uiState.preview.sandboxProgress),
      prerequisiteTitles: lesson.prerequisiteLessonIds
        .map((prerequisiteId) => lessonById.get(prerequisiteId) ?? null)
        .filter((prerequisite): prerequisite is LearningCourseUnit => prerequisite !== null)
        .map((prerequisite) =>
          prerequisite.title.trim().length > 0
            ? prerequisite.title
            : this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle')
        ),
      blockedByTitles,
      warnings,
      blocks: lesson.blocks
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((block) => {
          if ('text' in block) {
            return {
              id: block.id,
              order: block.order,
              type: block.type,
              text: block.text,
            };
          }

          const referencedUnit = content.units.find(
            (candidate) =>
              candidate.id === block.refUnitId &&
              candidate.parentLessonId === lesson.id &&
              candidate.type ===
                (block.type === 'exercise_ref' ? 'exercise' : 'checkpoint')
          );

          return {
            id: block.id,
            order: block.order,
            type: block.type,
            refUnitId: block.refUnitId,
            refTitle:
              referencedUnit?.title.trim().length
                ? referencedUnit.title
                : referencedUnit?.type === 'checkpoint'
                  ? this.runtime.i18n.t(
                      'learningStudio.lesson.defaultCheckpointTitle'
                    )
                  : referencedUnit?.type === 'exercise'
                    ? this.runtime.i18n.t(
                        'learningStudio.lesson.defaultExerciseTitle'
                      )
                    : this.runtime.i18n.t(
                        'learningStudio.build.blockReferenceUnavailable'
                      ),
            broken: referencedUnit === undefined,
          };
        }),
    };
  }

  private createCourse(): void {
    const now = new Date().toISOString();
    const courseId = createEntityId('course');
    const draftId = createEntityId('draft');

    const course: LearningCourseRecord = {
      id: courseId,
      ownerRef: 'local-author',
      lifecycleState: 'draft',
      activeDraftId: draftId,
      latestPublishedVersionId: null,
      createdAt: now,
      updatedAt: now,
    };

    const draft: LearningCourseDraft = {
      id: draftId,
      courseId,
      revision: 1,
      content: createEmptyLearningCourseContent(),
      lastPreviewedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.state = this.normalizeState({
      ...this.state,
      courses: [course, ...this.state.courses],
      drafts: [draft, ...this.state.drafts],
      updatedAt: now,
    });
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'overview',
        selectedCourseId: courseId,
        selectedDraftId: draftId,
        selectedPublishedVersionId: null,
        selectedEnrollmentId: null,
        selectedElementKind: 'course',
        selectedElementId: courseId,
        inspectorPanel: 'course',
        updatedAt: now,
      },
      this.state
    );
    this.persistAndRender();
  }

  private openCourseOverview(courseId: string): void {
    const course = this.findCourse(this.state, courseId);
    if (!course) {
      this.navigateHome();
      return;
    }

    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'overview',
        selectedCourseId: course.id,
        selectedDraftId: this.resolveDraftId(this.state, course, null),
        selectedPublishedVersionId: this.resolvePublishedVersionId(
          this.state,
          course,
          null
        ),
        selectedEnrollmentId: null,
        selectedElementKind: 'course',
        selectedElementId: course.id,
        inspectorPanel: 'course',
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private saveCourseOverview(payload: CourseOverviewSavePayload): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    const selectedDraft = selectedCourse
      ? this.findDraftForCourse(selectedCourse)
      : null;
    if (!selectedCourse || !selectedDraft) return;

    const now = new Date().toISOString();
    const nextDrafts = this.state.drafts.map((draft) =>
      draft.id === selectedDraft.id
        ? {
            ...draft,
            content: {
              ...draft.content,
              title: payload.title,
              description: payload.description,
            },
            updatedAt: now,
          }
        : draft
    );

    const nextCourses = this.state.courses.map((course) =>
      course.id === selectedCourse.id
        ? {
            ...course,
            updatedAt: now,
          }
        : course
    );

    this.state = this.normalizeState({
      ...this.state,
      courses: nextCourses,
      drafts: nextDrafts,
      updatedAt: now,
    });
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'overview',
        updatedAt: now,
      },
      this.state
    );
    this.persistAndRender();
  }

  private navigateHome(): void {
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'home',
        selectedCourseId: null,
        selectedDraftId: null,
        selectedPublishedVersionId: null,
        selectedEnrollmentId: null,
        selectedElementKind: null,
        selectedElementId: null,
        inspectorPanel: 'none',
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private openRoute(route: 'overview' | 'build' | 'preview'): void {
    const selectedCourseId = this.uiState.selectedCourseId;
    const previewFocusedUnitId =
      route === 'preview' && this.uiState.selectedElementKind === 'lesson'
        ? this.uiState.selectedElementId
        : this.uiState.preview.focusedUnitId;
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route,
        selectedElementKind:
          route === 'build' && selectedCourseId ? 'course' : this.uiState.selectedElementKind,
        selectedElementId:
          route === 'build' && selectedCourseId ? selectedCourseId : this.uiState.selectedElementId,
        inspectorPanel:
          route === 'build' && selectedCourseId ? 'course' : this.uiState.inspectorPanel,
        preview: {
          ...this.uiState.preview,
          focusedUnitId: previewFocusedUnitId,
          updatedAt: route === 'preview' ? new Date().toISOString() : this.uiState.preview.updatedAt,
        },
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private selectPreviewLesson(unitId: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;
    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const isPreviewLesson = this.getTopLevelLessons(content).some(
      (lesson) => lesson.type === 'lesson' && lesson.id === unitId
    );
    if (!isPreviewLesson) {
      return;
    }

    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'preview',
        preview: {
          ...this.uiState.preview,
          focusedUnitId: unitId,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private selectCourseContext(): void {
    const selectedCourseId = this.uiState.selectedCourseId;
    if (!selectedCourseId) return;
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'build',
        selectedElementKind: 'course',
        selectedElementId: selectedCourseId,
        inspectorPanel: 'course',
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private selectModule(moduleId: string): void {
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'build',
        selectedElementKind: 'module',
        selectedElementId: moduleId,
        inspectorPanel: 'module',
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private selectUnit(unitId: string): void {
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'build',
        selectedElementKind: 'lesson',
        selectedElementId: unitId,
        inspectorPanel: 'lesson',
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private addModule(position?: { x?: number; y?: number }): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const nextIndex = this.getPrimaryAuthoringContent(selectedCourse).modules.length;
    const moduleId = createEntityId('module');
    const now = new Date().toISOString();
    const defaultLayout = createDefaultLearningModuleLayout(moduleId, nextIndex);

    this.updateDraftContent(
      selectedCourse.id,
      (content) => ({
        ...content,
        modules: [
          ...content.modules,
          {
            id: moduleId,
            title: `${this.runtime.i18n.t('learningStudio.module.defaultTitle')} ${nextIndex + 1}`,
            description: '',
            order: nextIndex,
            lessonIds: [],
          },
        ],
        moduleLayouts: [
          ...content.moduleLayouts,
          {
            ...defaultLayout,
            x:
              typeof position?.x === 'number' && Number.isFinite(position.x)
                ? position.x
                : defaultLayout.x,
            y:
              typeof position?.y === 'number' && Number.isFinite(position.y)
                ? position.y
                : defaultLayout.y,
          },
        ],
      }),
      {
        route: 'build',
        selectedElementKind: 'module',
        selectedElementId: moduleId,
        inspectorPanel: 'module',
        updatedAt: now,
      }
    );
  }

  private addLesson(moduleId: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const module = content.modules.find((item) => item.id === moduleId);
    if (!module) return;

    const lessonId = createEntityId('unit');
    const now = new Date().toISOString();
    const nextOrder = module.lessonIds.length;

    this.updateDraftContent(
      selectedCourse.id,
      (currentContent) => ({
        ...currentContent,
        modules: currentContent.modules.map((item) =>
          item.id === moduleId
            ? {
                ...item,
                lessonIds: [...item.lessonIds, lessonId],
              }
            : item
        ),
        units: [
          ...currentContent.units,
          createUnit({
            id: lessonId,
            moduleId,
            parentLessonId: null,
            order: nextOrder,
            type: 'lesson',
            title: `${this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle')} ${nextOrder + 1}`,
            now,
          }),
        ],
      }),
      {
        route: 'build',
        selectedElementKind: 'lesson',
        selectedElementId: lessonId,
        inspectorPanel: 'lesson',
        updatedAt: now,
      }
    );
  }

  private addChildUnit(
    lessonId: string,
    type: 'exercise' | 'checkpoint'
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const lesson = content.units.find(
      (unit) => unit.id === lessonId && unit.parentLessonId === null
    );
    if (!lesson) return;

    const siblingUnits = content.units.filter((unit) => unit.parentLessonId === lessonId);
    const nextOrder = siblingUnits.length;
    const unitId = createEntityId('unit');
    const now = new Date().toISOString();
    const defaultTitleKey =
      type === 'exercise'
        ? 'learningStudio.lesson.defaultExerciseTitle'
        : 'learningStudio.lesson.defaultCheckpointTitle';

    this.updateDraftContent(
      selectedCourse.id,
      (currentContent) => ({
        ...currentContent,
        units: [
          ...currentContent.units,
          createUnit({
            id: unitId,
            moduleId: lesson.moduleId,
            parentLessonId: lessonId,
            order: nextOrder,
            type,
            title: `${this.runtime.i18n.t(defaultTitleKey)} ${nextOrder + 1}`,
            now,
          }),
        ],
      }),
      {
        route: 'build',
        selectedElementKind: 'lesson',
        selectedElementId: unitId,
        inspectorPanel: 'lesson',
        updatedAt: now,
      }
    );
  }

  private moveModule(moduleId: string, direction: -1 | 1): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => {
      const orderedModules = content.modules
        .slice()
        .sort((left, right) => left.order - right.order);
      const currentIndex = orderedModules.findIndex((module) => module.id === moduleId);
      const targetIndex = currentIndex + direction;
      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= orderedModules.length
      ) {
        return content;
      }

      const [module] = orderedModules.splice(currentIndex, 1);
      orderedModules.splice(targetIndex, 0, module);

      return {
        ...content,
        modules: orderedModules.map((item, index) => ({
          ...item,
          order: index,
        })),
      };
    });
  }

  private toggleModuleCollapse(moduleId: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const module = content.modules.find((item) => item.id === moduleId);
    if (!module) return;

    const nextCollapsed = !(
      content.moduleLayouts.find((layout) => layout.moduleId === moduleId)?.collapsed ??
      false
    );
    const selectedUnit =
      this.uiState.selectedElementKind === 'lesson' &&
      this.uiState.selectedElementId !== null
        ? content.units.find((unit) => unit.id === this.uiState.selectedElementId) ?? null
        : null;
    const shouldResetSelection =
      nextCollapsed &&
      selectedUnit !== null &&
      selectedUnit.moduleId === moduleId;

    this.updateDraftContent(
      selectedCourse.id,
      (draftContent) => ({
        ...draftContent,
        moduleLayouts: draftContent.modules.map((candidate, index) => {
          const existingLayout =
            draftContent.moduleLayouts.find(
              (layout) => layout.moduleId === candidate.id
            ) ?? createDefaultLearningModuleLayout(candidate.id, index);
          return candidate.id === moduleId
            ? {
                ...existingLayout,
                collapsed: nextCollapsed,
              }
            : existingLayout;
        }),
      }),
      shouldResetSelection
        ? {
            route: 'build',
            selectedElementKind: 'module',
            selectedElementId: moduleId,
            inspectorPanel: 'module',
          }
        : {
            route: 'build',
          }
    );
  }

  private moveLesson(lessonId: string, direction: -1 | 1): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => {
      const parentModule = content.modules.find((module) =>
        module.lessonIds.includes(lessonId)
      );
      if (!parentModule) return content;

      const lessonIds = parentModule.lessonIds.slice();
      const currentIndex = lessonIds.indexOf(lessonId);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= lessonIds.length) {
        return content;
      }

      const [movedLesson] = lessonIds.splice(currentIndex, 1);
      lessonIds.splice(targetIndex, 0, movedLesson);

      return {
        ...content,
        modules: content.modules.map((module) =>
          module.id === parentModule.id
            ? {
                ...module,
                lessonIds,
              }
            : module
        ),
        units: content.units.map((unit) => {
          if (unit.parentLessonId !== null || unit.moduleId !== parentModule.id) {
            return unit;
          }
          const nextOrder = lessonIds.indexOf(unit.id);
          return nextOrder >= 0
            ? {
                ...unit,
                order: nextOrder,
              }
            : unit;
        }),
      };
    });
  }

  private moveChildUnit(unitId: string, direction: -1 | 1): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => {
      const unit = content.units.find((item) => item.id === unitId);
      if (!unit || unit.parentLessonId === null) return content;

      const siblings = content.units
        .filter((item) => item.parentLessonId === unit.parentLessonId)
        .slice()
        .sort((left, right) => left.order - right.order);
      const currentIndex = siblings.findIndex((item) => item.id === unitId);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
        return content;
      }

      const [movedUnit] = siblings.splice(currentIndex, 1);
      siblings.splice(targetIndex, 0, movedUnit);
      const orderById = new Map(
        siblings.map((item, index) => [item.id, index] as const)
      );

      return {
        ...content,
        units: content.units.map((item) =>
          item.parentLessonId === unit.parentLessonId && orderById.has(item.id)
            ? {
                ...item,
                order: orderById.get(item.id)!,
              }
            : item
        ),
      };
    });
  }

  private updateModuleTitle(moduleId: string, title: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      modules: content.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              title,
            }
          : module
      ),
    }));
  }

  private updateModuleDescription(moduleId: string, description: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      modules: content.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              description,
            }
          : module
      ),
    }));
  }

  private updateUnitTitle(unitId: string, title: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              title,
            }
          : unit
      ),
    }));
  }

  private updateUnitDescription(unitId: string, description: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              description,
            }
          : unit
      ),
    }));
  }

  private updateUnitObjective(unitId: string, objective: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              objective,
            }
          : unit
      ),
    }));
  }

  private togglePrerequisite(unitId: string, prerequisiteId: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse || unitId === prerequisiteId) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const unit = content.units.find((candidate) => candidate.id === unitId);
    const enabled = !unit?.prerequisiteLessonIds.includes(prerequisiteId);
    this.setLessonPrerequisite(unitId, prerequisiteId, enabled);
  }

  private setLessonPrerequisite(
    unitId: string,
    prerequisiteId: string,
    enabled: boolean
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse || unitId === prerequisiteId) return;
    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const unit = content.units.find((candidate) => candidate.id === unitId);
    const prerequisite = content.units.find(
      (candidate) => candidate.id === prerequisiteId
    );
    if (
      unit?.type !== 'lesson' ||
      unit.parentLessonId !== null ||
      prerequisite?.type !== 'lesson' ||
      prerequisite.parentLessonId !== null
    ) {
      return;
    }

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) => {
        if (unit.id !== unitId || unit.type !== 'lesson') {
          return unit;
        }
        const nextIds = enabled
          ? Array.from(new Set([...unit.prerequisiteLessonIds, prerequisiteId]))
          : unit.prerequisiteLessonIds.filter((id) => id !== prerequisiteId);
        return {
          ...unit,
          prerequisiteLessonIds: nextIds,
        };
      }),
    }));
  }

  private addLessonBlock(
    unitId: string,
    type: LearningLessonBlock['type']
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const lesson = content.units.find(
      (unit) => unit.id === unitId && unit.type === 'lesson'
    );
    if (!lesson) return;

    const nextBlock = createLessonBlock(type, lesson, content);
    if (!nextBlock) return;

    this.updateDraftContent(selectedCourse.id, (currentContent) => ({
      ...currentContent,
      units: currentContent.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              blocks: normalizeLessonBlocks([...unit.blocks, nextBlock]),
            }
          : unit
      ),
    }));
  }

  private updateLessonBlockType(
    unitId: string,
    blockId: string,
    type: LearningLessonBlock['type']
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const lesson = content.units.find(
      (unit) => unit.id === unitId && unit.type === 'lesson'
    );
    if (!lesson) return;

    this.updateDraftContent(selectedCourse.id, (currentContent) => ({
      ...currentContent,
      units: currentContent.units.map((unit) => {
        if (unit.id !== unitId || unit.type !== 'lesson') {
          return unit;
        }
        const currentBlock = unit.blocks.find((block) => block.id === blockId);
        if (!currentBlock) {
          return unit;
        }
        const nextBlock = convertLessonBlockType(type, currentBlock, unit, currentContent);
        if (!nextBlock) {
          return unit;
        }
        return {
          ...unit,
          blocks: normalizeLessonBlocks(
            unit.blocks.map((block) => (block.id === blockId ? nextBlock : block))
          ),
        };
      }),
    }));
  }

  private updateLessonBlockText(
    unitId: string,
    blockId: string,
    text: string
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) => {
        if (unit.id !== unitId || unit.type !== 'lesson') {
          return unit;
        }
        return {
          ...unit,
          blocks: unit.blocks.map((block) =>
            block.id === blockId && 'text' in block
              ? {
                  ...block,
                  text,
                }
              : block
          ),
        };
      }),
    }));
  }

  private updateLessonBlockReference(
    unitId: string,
    blockId: string,
    refUnitId: string
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    const content = this.getPrimaryAuthoringContent(selectedCourse);
    const lesson = content.units.find(
      (unit) => unit.id === unitId && unit.type === 'lesson'
    );
    if (!lesson) return;

    this.updateDraftContent(selectedCourse.id, (currentContent) => ({
      ...currentContent,
      units: currentContent.units.map((unit) => {
        if (unit.id !== unitId || unit.type !== 'lesson') {
          return unit;
        }

        return {
          ...unit,
          blocks: unit.blocks.map((block) => {
            if (block.id !== blockId || 'text' in block) {
              return block;
            }
            const expectedType =
              block.type === 'exercise_ref' ? 'exercise' : 'checkpoint';
            const validRef = currentContent.units.some(
              (candidate) =>
                candidate.id === refUnitId &&
                candidate.parentLessonId === unitId &&
                candidate.type === expectedType
            );
            return validRef
              ? {
                  ...block,
                  refUnitId,
                }
              : block;
          }),
        };
      }),
    }));
  }

  private moveLessonBlock(
    unitId: string,
    blockId: string,
    direction: -1 | 1
  ): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) => {
        if (unit.id !== unitId || unit.type !== 'lesson') {
          return unit;
        }
        const index = unit.blocks.findIndex((block) => block.id === blockId);
        if (index < 0) {
          return unit;
        }
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= unit.blocks.length) {
          return unit;
        }
        const nextBlocks = unit.blocks.slice();
        const [moved] = nextBlocks.splice(index, 1);
        nextBlocks.splice(nextIndex, 0, moved);
        return {
          ...unit,
          blocks: normalizeLessonBlocks(nextBlocks),
        };
      }),
    }));
  }

  private removeLessonBlock(unitId: string, blockId: string): void {
    const selectedCourse = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!selectedCourse) return;

    this.updateDraftContent(selectedCourse.id, (content) => ({
      ...content,
      units: content.units.map((unit) =>
        unit.id === unitId && unit.type === 'lesson'
          ? {
              ...unit,
              blocks: normalizeLessonBlocks(
                unit.blocks.filter((block) => block.id !== blockId)
              ),
            }
          : unit
      ),
    }));
  }

  private updateDraftContent(
    courseId: string,
    updater: (content: LearningCourseContent) => LearningCourseContent,
    uiPatch: Partial<LearningStudioUiStateV2> = {}
  ): void {
    const selectedCourse = this.findCourse(this.state, courseId);
    const selectedDraft = selectedCourse
      ? this.findDraftForCourse(selectedCourse)
      : null;
    if (!selectedCourse || !selectedDraft) return;

    const now = new Date().toISOString();
    const nextDrafts = this.state.drafts.map((draft) =>
      draft.id === selectedDraft.id
        ? {
            ...draft,
            content: updater(draft.content),
            updatedAt: now,
          }
        : draft
    );
    const nextCourses = this.state.courses.map((course) =>
      course.id === selectedCourse.id
        ? {
            ...course,
            updatedAt: now,
          }
        : course
    );

    this.state = this.normalizeState({
      ...this.state,
      courses: nextCourses,
      drafts: nextDrafts,
      updatedAt: now,
    });
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        selectedCourseId: courseId,
        selectedDraftId: selectedDraft.id,
        ...uiPatch,
        updatedAt: now,
      },
      this.state
    );
    this.persistAndRender();
  }

  private resolveCanvasHostApi(
    route: 'build' | 'preview'
  ): LearningCanvasHostApi | null {
    const document = this.buildCanvasDocument(route);
    if (!document) return null;
    return {
      getDocument: () => {
        const nextDocument = this.buildCanvasDocument(route);
        return nextDocument ?? document;
      },
      saveContent: (nextContent) => {
        if (route !== 'build') return;
        this.saveCanvasDraftContent(document.courseId, nextContent);
      },
      commands: {
        createModule: (position) => {
          if (route !== 'build') return;
          this.addModule({
            x: position?.sceneX,
            y: position?.sceneY,
          });
        },
        createLesson: (moduleId) => {
          if (route !== 'build') return;
          this.addLesson(moduleId);
        },
        createExercise: (lessonId) => {
          if (route !== 'build') return;
          this.addChildUnit(lessonId, 'exercise');
        },
        createCheckpoint: (lessonId) => {
          if (route !== 'build') return;
          this.addChildUnit(lessonId, 'checkpoint');
        },
        setLessonPrerequisite: (lessonId, prerequisiteLessonId, enabled) => {
          if (route !== 'build') return;
          this.setLessonPrerequisite(lessonId, prerequisiteLessonId, enabled);
        },
      },
      selection: {
        setSelection: (selection) => {
          if (route !== 'build') return;
          this.syncCanvasSelection(selection);
        },
      },
    };
  }

  private syncCanvasSelection(selection: LearningCanvasSelection): void {
    const nextKind =
      selection.kind === 'course'
        ? 'course'
        : selection.kind === 'module'
          ? 'module'
          : 'lesson';
    const nextPanel =
      selection.kind === 'course'
        ? 'course'
        : selection.kind === 'module'
          ? 'module'
          : 'lesson';

    if (
      this.uiState.route === 'build' &&
      this.uiState.selectedElementKind === nextKind &&
      this.uiState.selectedElementId === selection.id &&
      this.uiState.inspectorPanel === nextPanel
    ) {
      return;
    }

    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        route: 'build',
        selectedElementKind: nextKind,
        selectedElementId: selection.id,
        inspectorPanel: nextPanel,
        updatedAt: new Date().toISOString(),
      },
      this.state
    );
    this.persistAndRender();
  }

  private buildCanvasDocument(
    route: 'build' | 'preview'
  ): LearningCanvasDocument | null {
    const course = this.findCourse(this.state, this.uiState.selectedCourseId);
    if (!course) return null;
    const draft = this.findDraftForCourse(course);
    const content = this.getPrimaryAuthoringContent(course);
    return {
      canvasId: `learning-course:${course.id}:${route}`,
      courseId: course.id,
      draftId: draft?.id ?? null,
      mode: route,
      title: content.title.trim().length > 0 ? content.title : 'Untitled course',
      content: structuredClone(content),
      selection:
        route === 'build'
          ? this.uiState.selectedElementKind === 'module' &&
            this.uiState.selectedElementId
            ? {
                kind: 'module',
                id: this.uiState.selectedElementId,
              }
            : this.uiState.selectedElementKind === 'lesson' &&
                this.uiState.selectedElementId
              ? {
                  kind: 'unit',
                  id: this.uiState.selectedElementId,
                }
              : {
                  kind: 'course',
                  id: course.id,
                }
          : null,
    };
  }

  private saveCanvasDraftContent(
    courseId: string,
    nextContent: LearningCourseContent
  ): void {
    const selectedCourse = this.findCourse(this.state, courseId);
    const selectedDraft = selectedCourse
      ? this.findDraftForCourse(selectedCourse)
      : null;
    if (!selectedCourse || !selectedDraft) return;

    const now = new Date().toISOString();
    this.state = this.normalizeState({
      ...this.state,
      courses: this.state.courses.map((course) =>
        course.id === selectedCourse.id
          ? {
              ...course,
              updatedAt: now,
            }
          : course
      ),
      drafts: this.state.drafts.map((draft) =>
        draft.id === selectedDraft.id
          ? {
              ...draft,
              content: structuredClone(nextContent),
              updatedAt: now,
            }
          : draft
      ),
      updatedAt: now,
    });
    this.uiState = this.normalizeUiState(
      {
        ...this.uiState,
        selectedCourseId: courseId,
        selectedDraftId: selectedDraft.id,
        updatedAt: now,
      },
      this.state
    );
    this.persist();
  }

  private persistAndRender(): void {
    this.persist();
    this.render();
  }

  private persist(): void {
    this.repository.saveState(this.state);
    this.repository.saveUiState(this.uiState);
  }

  private normalizeState(
    state: LearningStudioLocalStateV2
  ): LearningStudioLocalStateV2 {
    return {
      ...createEmptyLearningStudioState(),
      ...state,
      version: 2,
      courses: state.courses.slice(),
      drafts: state.drafts.slice(),
      publishedVersions: state.publishedVersions.slice(),
      accessGrants: state.accessGrants.slice(),
      enrollments: state.enrollments.slice(),
      progressRecords: state.progressRecords.slice(),
      learnerSessions: state.learnerSessions.slice(),
    };
  }

  private normalizeUiState(
    uiState: LearningStudioUiStateV2,
    state: LearningStudioLocalStateV2
  ): LearningStudioUiStateV2 {
    const nextState = createEmptyLearningStudioUiState();
    const nextUiState: LearningStudioUiStateV2 = {
      ...nextState,
      ...uiState,
      version: 2,
      preview: {
        ...nextState.preview,
        ...uiState.preview,
        sandboxProgress: { ...uiState.preview.sandboxProgress },
      },
      learner: {
        ...nextState.learner,
        ...uiState.learner,
      },
    };

    const selectedEnrollment = this.findEnrollment(
      state,
      nextUiState.selectedEnrollmentId
    );
    const selectedCourse = this.findCourse(
      state,
      selectedEnrollment?.courseId ?? nextUiState.selectedCourseId
    );

    if (!selectedCourse) {
      nextUiState.selectedCourseId = null;
      nextUiState.selectedDraftId = null;
      nextUiState.selectedPublishedVersionId = null;
      nextUiState.selectedElementKind = null;
      nextUiState.selectedElementId = null;
      nextUiState.inspectorPanel = 'none';
      nextUiState.preview.focusedUnitId = null;
      if (
        nextUiState.route === 'overview' ||
        nextUiState.route === 'build' ||
        nextUiState.route === 'preview'
      ) {
        nextUiState.route = 'home';
      }
    } else {
      nextUiState.selectedDraftId = this.resolveDraftId(
        state,
        selectedCourse,
        nextUiState.selectedDraftId
      );
      nextUiState.selectedPublishedVersionId = this.resolvePublishedVersionId(
        state,
        selectedCourse,
        nextUiState.selectedPublishedVersionId
      );

      if (nextUiState.route === 'build') {
        const content = this.getContentForCourseState(state, selectedCourse);
        const hasSelectedModule =
          nextUiState.selectedElementKind === 'module' &&
          nextUiState.selectedElementId !== null &&
          content.modules.some((module) => module.id === nextUiState.selectedElementId);
        const hasSelectedUnit =
          nextUiState.selectedElementKind === 'lesson' &&
          nextUiState.selectedElementId !== null &&
          content.units.some((unit) => unit.id === nextUiState.selectedElementId);

        if (!hasSelectedModule && !hasSelectedUnit) {
          nextUiState.selectedElementKind = 'course';
          nextUiState.selectedElementId = selectedCourse.id;
          nextUiState.inspectorPanel = 'course';
        }
      }

      const previewLessons = this.getTopLevelLessons(
        this.getContentForCourseState(state, selectedCourse)
      ).filter((lesson) => lesson.type === 'lesson');
      const previewLessonById = new Map(
        previewLessons.map((lesson) => [lesson.id, lesson] as const)
      );
      nextUiState.preview.focusedUnitId = resolvePreviewFocusedLessonId(
        previewLessonById,
        nextUiState.preview.focusedUnitId,
        nextUiState.preview.sandboxProgress
      );
    }

    if (!selectedEnrollment) {
      nextUiState.selectedEnrollmentId = null;
      nextUiState.learner = {
        ...nextUiState.learner,
        courseId: null,
        enrollmentId: null,
      };
      if (
        nextUiState.route === 'learner_home' ||
        nextUiState.route === 'learner_lesson' ||
        nextUiState.route === 'learner_completion'
      ) {
        nextUiState.route = 'home';
      }
    } else {
      nextUiState.selectedCourseId = selectedEnrollment.courseId;
      nextUiState.selectedPublishedVersionId = selectedEnrollment.publishedVersionId;
      nextUiState.activeLearnerRef = selectedEnrollment.learnerRef;
      nextUiState.learner = {
        ...nextUiState.learner,
        courseId: selectedEnrollment.courseId,
        enrollmentId: selectedEnrollment.id,
      };
    }

    nextUiState.mode = deriveLearningStudioMode(nextUiState.route);
    return nextUiState;
  }

  private getPrimaryAuthoringContent(course: LearningCourseRecord): LearningCourseContent {
    return this.getContentForCourseState(this.state, course);
  }

  private getContentForCourseState(
    state: LearningStudioLocalStateV2,
    course: LearningCourseRecord
  ): LearningCourseContent {
    return (
      this.findDraftForCourseFromState(state, course)?.content ??
      this.findPublishedVersionForCourseFromState(state, course)?.content ??
      createEmptyLearningCourseContent()
    );
  }

  private getTopLevelLessons(content: LearningCourseContent): LearningCourseUnit[] {
    return content.units
      .filter((unit) => unit.parentLessonId === null)
      .slice()
      .sort((left, right) => left.order - right.order);
  }

  private getModuleLessons(
    content: LearningCourseContent,
    module: LearningCourseModule
  ): LearningCourseUnit[] {
    const topLevelUnits = content.units.filter(
      (unit) => unit.moduleId === module.id && unit.parentLessonId === null
    );
    if (module.lessonIds.length > 0) {
      return module.lessonIds
        .map((lessonId) => topLevelUnits.find((unit) => unit.id === lessonId) ?? null)
        .filter((unit): unit is LearningCourseUnit => unit !== null);
    }
    return topLevelUnits.slice().sort((left, right) => left.order - right.order);
  }

  private findDraftForCourse(course: LearningCourseRecord): LearningCourseDraft | null {
    return this.findDraftForCourseFromState(this.state, course);
  }

  private findDraftForCourseFromState(
    state: LearningStudioLocalStateV2,
    course: LearningCourseRecord
  ): LearningCourseDraft | null {
    return (
      state.drafts.find((draft) => draft.id === course.activeDraftId) ??
      state.drafts.find((draft) => draft.courseId === course.id) ??
      null
    );
  }

  private findPublishedVersionForCourse(
    course: LearningCourseRecord
  ): LearningCoursePublishedVersion | null {
    return this.findPublishedVersionForCourseFromState(this.state, course);
  }

  private findPublishedVersionForCourseFromState(
    state: LearningStudioLocalStateV2,
    course: LearningCourseRecord
  ): LearningCoursePublishedVersion | null {
    if (course.latestPublishedVersionId) {
      const preferred = state.publishedVersions.find(
        (version) => version.id === course.latestPublishedVersionId
      );
      if (preferred) return preferred;
    }
    return (
      state.publishedVersions.find((version) => version.courseId === course.id) ??
      null
    );
  }

  private resolveDraftId(
    state: LearningStudioLocalStateV2,
    course: LearningCourseRecord,
    preferredDraftId: string | null
  ): string | null {
    if (
      preferredDraftId &&
      state.drafts.some(
        (draft) => draft.id === preferredDraftId && draft.courseId === course.id
      )
    ) {
      return preferredDraftId;
    }
    return (
      state.drafts.find((draft) => draft.id === course.activeDraftId)?.id ?? null
    );
  }

  private resolvePublishedVersionId(
    state: LearningStudioLocalStateV2,
    course: LearningCourseRecord,
    preferredVersionId: string | null
  ): string | null {
    if (
      preferredVersionId &&
      state.publishedVersions.some(
        (version) =>
          version.id === preferredVersionId && version.courseId === course.id
      )
    ) {
      return preferredVersionId;
    }
    return course.latestPublishedVersionId;
  }

  private findCourse(
    state: LearningStudioLocalStateV2,
    courseId: string | null
  ): LearningCourseRecord | null {
    if (!courseId) return null;
    return state.courses.find((course) => course.id === courseId) ?? null;
  }

  private findEnrollment(
    state: LearningStudioLocalStateV2,
    enrollmentId: string | null
  ): LearningEnrollment | null {
    if (!enrollmentId) return null;
    return (
      state.enrollments.find((enrollment) => enrollment.id === enrollmentId) ??
      null
    );
  }
}

function createEntityId(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createUnit(args: {
  id: string;
  moduleId: string;
  parentLessonId: string | null;
  order: number;
  type: LearningUnitType;
  title: string;
  now: string;
}): LearningCourseUnit {
  return {
    id: args.id,
    moduleId: args.moduleId,
    parentLessonId: args.parentLessonId,
    order: args.order,
    type: args.type,
    title: args.title,
    description: '',
    objective: '',
    estimatedDurationMinutes: null,
    prerequisiteLessonIds: [],
    blocks: [],
    createdAt: args.now,
    updatedAt: args.now,
  };
}

function normalizeLessonBlocks(
  blocks: LearningLessonBlock[]
): LearningLessonBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    order: index,
  }));
}

function createLessonBlock(
  type: LearningLessonBlock['type'],
  lesson: LearningCourseUnit,
  content: LearningCourseContent
): LearningLessonBlock | null {
  const id = createEntityId('block');
  const order = lesson.blocks.length;

  if (isLearningLessonTextBlockType(type)) {
    return {
      id,
      order,
      type,
      text: '',
    };
  }

  const refUnitId = getDefaultReferenceUnitId(type, lesson.id, content);
  if (!refUnitId) {
    return null;
  }

  return {
    id,
    order,
    type,
    refUnitId,
  };
}

function convertLessonBlockType(
  type: LearningLessonBlock['type'],
  currentBlock: LearningLessonBlock,
  lesson: LearningCourseUnit,
  content: LearningCourseContent
): LearningLessonBlock | null {
  if (type === currentBlock.type) {
    return currentBlock;
  }

  if (isLearningLessonTextBlockType(type)) {
    return {
      id: currentBlock.id,
      order: currentBlock.order,
      type,
      text: 'text' in currentBlock ? currentBlock.text : '',
    };
  }

  const refUnitId = getDefaultReferenceUnitId(type, lesson.id, content);
  if (!refUnitId) {
    return null;
  }

  return {
    id: currentBlock.id,
    order: currentBlock.order,
    type,
    refUnitId,
  };
}

function getDefaultReferenceUnitId(
  type: Extract<LearningLessonBlock['type'], 'exercise_ref' | 'checkpoint_ref'>,
  lessonId: string,
  content: LearningCourseContent
): string | null {
  const unitType = type === 'exercise_ref' ? 'exercise' : 'checkpoint';
  const match = content.units
    .filter(
      (unit) => unit.parentLessonId === lessonId && unit.type === unitType
    )
    .slice()
    .sort((left, right) => left.order - right.order)[0];
  return match?.id ?? null;
}

function isLearningLessonTextBlockType(
  type: LearningLessonBlock['type']
): type is LearningLessonTextBlockType {
  return (
    type === 'intro' ||
    type === 'concept' ||
    type === 'example' ||
    type === 'instruction' ||
    type === 'summary'
  );
}

function isPreviewProgressCompleted(
  progress: LearningProgressState | undefined
): boolean {
  return progress === 'completed' || progress === 'review';
}

function getPreviewLessonStatus(
  lesson: LearningCourseUnit,
  sandboxProgress: Record<string, LearningProgressState>
): 'locked' | 'available' | 'completed' {
  if (isPreviewProgressCompleted(sandboxProgress[lesson.id])) {
    return 'completed';
  }

  return lesson.prerequisiteLessonIds.every((prerequisiteId) =>
    isPreviewProgressCompleted(sandboxProgress[prerequisiteId])
  )
    ? 'available'
    : 'locked';
}

function resolvePreviewRecommendedLessonId(
  lessonById: ReadonlyMap<string, LearningCourseUnit>,
  sandboxProgress: Record<string, LearningProgressState>
): string | null {
  const lessons = Array.from(lessonById.values());
  const availableIncomplete = lessons.find(
    (lesson) => getPreviewLessonStatus(lesson, sandboxProgress) === 'available'
  );
  if (availableIncomplete) {
    return availableIncomplete.id;
  }
  const firstIncomplete = lessons.find(
    (lesson) => getPreviewLessonStatus(lesson, sandboxProgress) !== 'completed'
  );
  return firstIncomplete?.id ?? null;
}

function resolvePreviewFocusedLessonId(
  lessonById: ReadonlyMap<string, LearningCourseUnit>,
  preferredLessonId: string | null,
  sandboxProgress: Record<string, LearningProgressState>
): string | null {
  if (preferredLessonId && lessonById.has(preferredLessonId)) {
    return preferredLessonId;
  }
  return resolvePreviewRecommendedLessonId(lessonById, sandboxProgress);
}

type LearningStudioPreviewWarningKey =
  | 'learningStudio.preview.warningMissingContent'
  | 'learningStudio.preview.warningBrokenExerciseRef'
  | 'learningStudio.preview.warningBrokenCheckpointRef';

function getPreviewLessonWarningKeys(
  lesson: LearningCourseUnit,
  content: LearningCourseContent
): LearningStudioPreviewWarningKey[] {
  const warnings = new Set<LearningStudioPreviewWarningKey>();
  const hasMeaningfulTextBlock = lesson.blocks.some(
    (block) => 'text' in block && block.text.trim().length > 0
  );

  if (!hasMeaningfulTextBlock) {
    warnings.add('learningStudio.preview.warningMissingContent');
  }

  const hasBrokenExerciseReference = lesson.blocks.some(
    (block) =>
      !('text' in block) &&
      block.type === 'exercise_ref' &&
      !content.units.some(
        (unit) =>
          unit.id === block.refUnitId &&
          unit.parentLessonId === lesson.id &&
          unit.type === 'exercise'
      )
  );
  if (hasBrokenExerciseReference) {
    warnings.add('learningStudio.preview.warningBrokenExerciseRef');
  }

  const hasBrokenCheckpointReference = lesson.blocks.some(
    (block) =>
      !('text' in block) &&
      block.type === 'checkpoint_ref' &&
      !content.units.some(
        (unit) =>
          unit.id === block.refUnitId &&
          unit.parentLessonId === lesson.id &&
          unit.type === 'checkpoint'
      )
  );
  if (hasBrokenCheckpointReference) {
    warnings.add('learningStudio.preview.warningBrokenCheckpointRef');
  }

  return Array.from(warnings);
}
