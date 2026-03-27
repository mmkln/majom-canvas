import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { LocalStorageLearningStudioRepository } from './data/LocalStorageLearningStudioRepository.ts';
import {
  createDefaultLearningModuleLayout,
  createEmptyLearningStudioState,
  createEmptyLearningStudioUiState,
  type LearningCourseLearnerProgressSummary,
  type LearningCourseLearnerSnapshot,
  type LearningCourse,
  type LearningCourseModule,
  type LearningLesson,
  type LearningLessonLearnerState,
  type LearningRecommendedLearnerStep,
  type LearningLessonType,
  type LearningProgressState,
  type LearnerProgress,
  type LearningStudioLocalStateV1,
  type LearningStudioRoute,
  type LearningStudioSelectedElementKind,
  type LearningStudioUiStateV1,
} from './domain/types.ts';
import { LearningStudioRootView } from './ui/components/LearningStudioRootView.ts';

type LearningStudioAppOptions = {
  runtime?: AppRuntime;
  repository?: LocalStorageLearningStudioRepository;
};

export class LearningStudioApp {
  private readonly runtime: AppRuntime;
  private readonly repository: LocalStorageLearningStudioRepository;
  private root: HTMLDivElement | null = null;
  private view: LearningStudioRootView | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private state: LearningStudioLocalStateV1 = createEmptyLearningStudioState();
  private uiState: LearningStudioUiStateV1 = createEmptyLearningStudioUiState();

  constructor(options: LearningStudioAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.repository =
      options.repository ?? new LocalStorageLearningStudioRepository();
  }

  public mount(parent: HTMLElement): void {
    if (this.root) return;
    this.state = this.normalizeState(this.repository.loadState());
    this.uiState = this.normalizeUiState(this.repository.loadUiState());
    this.ensurePersistedSkeleton();

    const root = document.createElement('div');
    root.className = 'h-full w-full';
    root.dataset.module = 'learning-studio';

    this.view = new LearningStudioRootView({
      runtime: this.runtime,
      state: this.state,
      uiState: this.uiState,
      onCreateManualCourse: () => this.createCourse(false),
      onCreateAiCourse: () => this.createCourse(true),
      onCreateModule: (courseId) => this.createModule(courseId),
      onCreateLesson: (moduleId, type) => this.createLesson(moduleId, type),
      onRouteChange: (route) => this.setRoute(route),
      onSelectCourse: (courseId, route) => this.selectCourse(courseId, route),
      onSelectElement: (kind, id) => this.selectElement(kind, id),
      onUpdateCourse: (courseId, patch) => this.updateCourse(courseId, patch),
      onUpdateModule: (moduleId, patch) => this.updateModule(moduleId, patch),
      onUpdateLesson: (lessonId, patch) => this.updateLesson(lessonId, patch),
      onUpdateLessonPrerequisites: (lessonId, prerequisiteIds) =>
        this.setLessonPrerequisites(lessonId, prerequisiteIds),
      onMoveModule: (moduleId, dx, dy) => this.moveModule(moduleId, dx, dy),
      onFocusLesson: (lessonId) => this.focusLesson(lessonId),
      onSetLessonProgress: (lessonId, state) =>
        this.setLessonProgress(lessonId, state),
      onInviteLearner: (courseId) => this.inviteLearner(courseId),
      onCopyShareLink: (courseId) => this.copyShareLink(courseId),
      onRevokeAccess: (courseId, learnerRef) =>
        this.revokeLearnerAccess(courseId, learnerRef),
      onPublishCourse: (courseId) => this.publishCourse(courseId),
      onArchiveCourse: (courseId) => this.archiveCourse(courseId),
      onDuplicateCourse: (courseId) => this.duplicateCourse(courseId),
      getCourseLearnerSnapshot: (courseId, learnerRef) =>
        this.getCourseLearnerSnapshot(courseId, learnerRef),
      getCourseLearnerProgressSummary: (courseId, learnerRef) =>
        this.getCourseLearnerProgressSummary(courseId, learnerRef),
      getRecommendedNextLearnerStep: (courseId, learnerRef) =>
        this.getRecommendedNextLearnerStep(courseId, learnerRef),
      getLessonLearnerState: (lessonId, learnerRef) =>
        this.getLessonLearnerState(lessonId, learnerRef),
    });
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
    this.view = null;
    this.root?.remove();
    this.root = null;
  }

  public setLessonPrerequisites(
    lessonId: string,
    prerequisiteIds: string[]
  ): void {
    const courseId = this.getCourseIdForLesson(lessonId);
    if (!courseId) return;
    this.updateLesson(lessonId, {
      prerequisiteIds: this.normalizePrerequisiteIds(lessonId, prerequisiteIds),
    });
    if (
      this.uiState.route === 'learn' &&
      this.uiState.selectedCourseId === courseId &&
      this.uiState.focusedLessonId === lessonId &&
      this.getLessonLearnerState(lessonId)?.isLocked
    ) {
      const nextAvailableLessonId =
        this.getNextAvailableLessonId(courseId, this.uiState.selectedLearnerRef, lessonId) ??
        this.getFirstAvailableLessonId(courseId, this.uiState.selectedLearnerRef);
      this.uiState = this.normalizeUiState({
        ...this.uiState,
        focusedLessonId: nextAvailableLessonId,
        selectedElementKind: nextAvailableLessonId ? 'lesson' : 'course',
        selectedElementId: nextAvailableLessonId ?? courseId,
        updatedAt: new Date().toISOString(),
      });
      this.persistUiState();
      this.render();
    }
  }

  public toggleLessonPrerequisite(
    lessonId: string,
    prerequisiteId: string,
    enabled?: boolean
  ): void {
    const lesson = this.state.lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    const shouldEnable = enabled ?? !lesson.prerequisiteIds.includes(prerequisiteId);
    const prerequisiteIds = shouldEnable
      ? [...lesson.prerequisiteIds, prerequisiteId]
      : lesson.prerequisiteIds.filter((id) => id !== prerequisiteId);
    this.setLessonPrerequisites(lessonId, prerequisiteIds);
  }

  public getCourseLearnerSnapshot(
    courseId: string,
    learnerRef: string = this.uiState.selectedLearnerRef
  ): LearningCourseLearnerSnapshot | null {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return null;
    const lessons = this.getOrderedLessonsForCourse(courseId).map((lesson) =>
      this.getLessonLearnerState(lesson.id, learnerRef)
    );
    const focusedLessonId =
      this.uiState.selectedCourseId === courseId
        ? this.uiState.focusedLessonId
        : this.getFirstAvailableLessonId(courseId, learnerRef);
    const nextAvailableLessonId = this.getNextAvailableLessonId(
      courseId,
      learnerRef,
      focusedLessonId
    );

    return {
      courseId,
      learnerRef,
      focusedLessonId,
      nextAvailableLessonId,
      lessons: lessons.filter(
        (lesson): lesson is LearningLessonLearnerState => lesson !== null
      ),
    };
  }

  public getCourseLearnerProgressSummary(
    courseId: string,
    learnerRef: string = this.uiState.selectedLearnerRef
  ): LearningCourseLearnerProgressSummary | null {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return null;
    const lessons = this.getOrderedLessonsForCourse(courseId)
      .map((lesson) => this.getLessonLearnerState(lesson.id, learnerRef))
      .filter(
        (lesson): lesson is LearningLessonLearnerState => lesson !== null
      );

    const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
    const lockedLessons = lessons.filter((lesson) => lesson.isLocked).length;
    const availableLessons = lessons.filter(
      (lesson) => !lesson.isLocked && lesson.progressState === 'available'
    ).length;
    const inProgressLessons = lessons.filter(
      (lesson) => lesson.progressState === 'in_progress'
    ).length;
    const reviewLessons = lessons.filter(
      (lesson) => lesson.progressState === 'review'
    ).length;
    const totalLessons = lessons.length;

    return {
      courseId,
      learnerRef,
      totalLessons,
      completedLessons,
      availableLessons,
      lockedLessons,
      inProgressLessons,
      reviewLessons,
      completionPercentage:
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      isCompleted: totalLessons > 0 && completedLessons === totalLessons,
    };
  }

  public getRecommendedNextLearnerStep(
    courseId: string,
    learnerRef: string = this.uiState.selectedLearnerRef
  ): LearningRecommendedLearnerStep | null {
    const orderedLessons = this.getOrderedLessonsForCourse(courseId);
    if (orderedLessons.length === 0) return null;

    const focusedLessonId =
      this.uiState.selectedCourseId === courseId ? this.uiState.focusedLessonId : null;
    const focusedIndex =
      focusedLessonId === null
        ? -1
        : orderedLessons.findIndex((lesson) => lesson.id === focusedLessonId);

    const findUnfinishedAvailable = (
      lessons: LearningLesson[]
    ): LearningLessonLearnerState | null => {
      for (const lesson of lessons) {
        const learnerState = this.getLessonLearnerState(lesson.id, learnerRef);
        if (
          learnerState &&
          !learnerState.isLocked &&
          learnerState.progressState !== 'completed'
        ) {
          return learnerState;
        }
      }
      return null;
    };

    const nextAfterFocus =
      focusedIndex >= 0
        ? findUnfinishedAvailable(orderedLessons.slice(focusedIndex + 1))
        : null;
    const fallback = findUnfinishedAvailable(orderedLessons);
    const selected = nextAfterFocus ?? fallback;
    if (!selected) return null;

    return {
      courseId,
      learnerRef,
      lessonId: selected.lessonId,
      moduleId: selected.moduleId,
      title: selected.title,
      description: selected.description,
      type: selected.type,
      progressState: selected.progressState,
      isLocked: selected.isLocked,
    };
  }

  private inviteLearner(courseId: string): void {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return;
    const now = new Date().toISOString();
    const existingLearnerRefs = new Set(
      [
        ...this.state.accessGrants
          .filter((grant) => grant.courseId === courseId)
          .map((grant) => grant.learnerRef),
        ...this.state.enrollments
          .filter((enrollment) => enrollment.courseId === courseId)
          .map((enrollment) => enrollment.learnerRef),
      ].filter((value) => value.length > 0)
    );
    let nextIndex = existingLearnerRefs.size + 1;
    let learnerRef = `learner-${nextIndex}`;
    while (existingLearnerRefs.has(learnerRef)) {
      nextIndex += 1;
      learnerRef = `learner-${nextIndex}`;
    }

    this.state = {
      ...this.state,
      accessGrants: [
        ...this.state.accessGrants,
        {
          id: this.createId('grant'),
          courseId,
          learnerRef,
          createdAt: now,
          revokedAt: null,
        },
      ],
      enrollments: [
        ...this.state.enrollments,
        {
          id: this.createId('enrollment'),
          courseId,
          learnerRef,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      courses: this.state.courses.map((item) =>
        item.id === courseId
          ? {
              ...item,
              updatedAt: now,
            }
          : item
      ),
      updatedAt: now,
    };
    this.persistState();
    this.render();
  }

  private revokeLearnerAccess(courseId: string, learnerRef: string): void {
    const now = new Date().toISOString();
    this.state = {
      ...this.state,
      accessGrants: this.state.accessGrants.map((grant) =>
        grant.courseId === courseId &&
        grant.learnerRef === learnerRef &&
        grant.revokedAt === null
          ? {
              ...grant,
              revokedAt: now,
            }
          : grant
      ),
      enrollments: this.state.enrollments.map((enrollment) =>
        enrollment.courseId === courseId && enrollment.learnerRef === learnerRef
          ? {
              ...enrollment,
              status: 'revoked',
              updatedAt: now,
            }
          : enrollment
      ),
      courses: this.state.courses.map((item) =>
        item.id === courseId
          ? {
              ...item,
              updatedAt: now,
            }
          : item
      ),
      updatedAt: now,
    };
    this.persistState();
    this.render();
  }

  private copyShareLink(courseId: string): void {
    const shareLink = this.getCourseShareLink(courseId);
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      void navigator.clipboard.writeText(shareLink);
    }
  }

  private publishCourse(courseId: string): void {
    this.updateCourseStatus(courseId, 'published');
  }

  private archiveCourse(courseId: string): void {
    this.updateCourseStatus(courseId, 'archived');
  }

  private duplicateCourse(courseId: string): void {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return;
    const now = new Date().toISOString();
    const moduleIdMap = new Map<string, string>();
    const lessonIdMap = new Map<string, string>();
    const sourceModules = this.getOrderedModulesForCourse(courseId);
    const duplicatedModules = sourceModules.map((module, moduleIndex) => {
      const nextId = this.createId('module');
      moduleIdMap.set(module.id, nextId);
      return {
        ...module,
        id: nextId,
        courseId: '',
        order: moduleIndex,
        lessonIds: [],
      };
    });
    const duplicatedLessons = sourceModules.reduce<LearningLesson[]>(
      (accumulator, module) => {
        const nextModuleId = moduleIdMap.get(module.id);
        if (!nextModuleId) return accumulator;
        const nextLessons = this.state.lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .sort((left, right) => left.order - right.order)
          .map((lesson, lessonIndex) => {
            const nextLessonId = this.createId('lesson');
            lessonIdMap.set(lesson.id, nextLessonId);
            return {
              ...lesson,
              id: nextLessonId,
              moduleId: nextModuleId,
              order: lessonIndex,
              prerequisiteIds: [...lesson.prerequisiteIds],
            };
          });
        accumulator.push(...nextLessons);
        return accumulator;
      },
      []
    );

    const nextCourseId = this.createId('course');
    const duplicatedCourse: LearningCourse = {
      ...course,
      id: nextCourseId,
      title: `${course.title} (${this.runtime.i18n.t('learningStudio.settings.duplicateSuffix')})`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      moduleIds: duplicatedModules.map((module) => module.id),
    };

    const finalizedModules = duplicatedModules.map((module) => ({
      ...module,
      courseId: nextCourseId,
      lessonIds: duplicatedLessons
        .filter((lesson: LearningLesson) => lesson.moduleId === module.id)
        .map((lesson: LearningLesson) => lesson.id),
    }));
    const finalizedLessons = duplicatedLessons.map((lesson: LearningLesson) => ({
      ...lesson,
      prerequisiteIds: lesson.prerequisiteIds
        .map((prerequisiteId: string) => lessonIdMap.get(prerequisiteId) ?? null)
        .filter(
          (prerequisiteId: string | null): prerequisiteId is string =>
            prerequisiteId !== null
        ),
    }));
    const duplicatedLayouts = sourceModules.map((module, index) => {
      const nextModuleId = moduleIdMap.get(module.id);
      const sourceLayout = this.state.moduleLayouts.find(
        (layout) => layout.moduleId === module.id
      );
      return {
        moduleId: nextModuleId ?? this.createId('module'),
        x: (sourceLayout?.x ?? createDefaultLearningModuleLayout(module.id, index).x) + 48,
        y: (sourceLayout?.y ?? createDefaultLearningModuleLayout(module.id, index).y) + 48,
      };
    });

    this.state = {
      ...this.state,
      courses: [duplicatedCourse, ...this.state.courses],
      modules: [...finalizedModules, ...this.state.modules],
      lessons: [...finalizedLessons, ...this.state.lessons],
      moduleLayouts: [...duplicatedLayouts, ...this.state.moduleLayouts],
      updatedAt: now,
    };
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route: 'overview',
      selectedCourseId: nextCourseId,
      selectedElementKind: 'course',
      selectedElementId: nextCourseId,
      focusedLessonId: finalizedLessons[0]?.id ?? null,
      updatedAt: now,
    });
    this.persistState();
    this.persistUiState();
    this.render();
  }

  public getNextAvailableLessonId(
    courseId: string,
    learnerRef: string = this.uiState.selectedLearnerRef,
    afterLessonId: string | null = null
  ): string | null {
    return this.computeNextAvailableLessonId(courseId, learnerRef, afterLessonId);
  }

  public getLessonLearnerState(
    lessonId: string,
    learnerRef: string = this.uiState.selectedLearnerRef
  ): LearningLessonLearnerState | null {
    const lesson = this.state.lessons.find((item) => item.id === lessonId);
    if (!lesson) return null;
    const courseId = this.getCourseIdForLesson(lessonId);
    if (!courseId) return null;
    const blockedByLessonIds = lesson.prerequisiteIds.filter((prerequisiteId) => {
      const prerequisiteProgress = this.getLessonProgressRecord(
        prerequisiteId,
        learnerRef
      );
      return prerequisiteProgress?.state !== 'completed';
    });
    const isLocked = blockedByLessonIds.length > 0;
    const progressState = isLocked
      ? 'locked'
      : this.getLessonProgressRecord(lessonId, learnerRef)?.state ?? 'available';
    return {
      lessonId,
      courseId,
      moduleId: lesson.moduleId,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      prerequisiteIds: [...lesson.prerequisiteIds],
      blockedByLessonIds,
      progressState,
      isLocked,
      isCompleted: progressState === 'completed',
    };
  }

  private createCourse(aiSeeded: boolean): void {
    const now = new Date().toISOString();
    const courseCount = this.state.courses.length + 1;
    const untitledPrefix = aiSeeded
      ? this.runtime.i18n.t('learningStudio.course.aiPrefix')
      : this.runtime.i18n.t('learningStudio.course.manualPrefix');
    const course: LearningCourse = {
      id: this.createId('course'),
      title: `${untitledPrefix} ${courseCount}`,
      description: aiSeeded
        ? this.runtime.i18n.t('learningStudio.course.aiDescription')
        : '',
      audience: '',
      outcomes: [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      moduleIds: [],
    };

    this.state = {
      ...this.state,
      courses: [course, ...this.state.courses],
      updatedAt: now,
    };
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route: 'build',
      selectedCourseId: course.id,
      selectedElementKind: 'course',
      selectedElementId: course.id,
      focusedLessonId: null,
      updatedAt: now,
    });
    this.persistState();
    this.persistUiState();
    this.render();
  }

  private createModule(courseId: string): void {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return;
    const now = new Date().toISOString();
    const moduleCount = course.moduleIds.length + 1;
    const module: LearningCourseModule = {
      id: this.createId('module'),
      courseId,
      title: `${this.runtime.i18n.t('learningStudio.module.defaultTitle')} ${moduleCount}`,
      order: course.moduleIds.length,
      lessonIds: [],
    };

    this.state = {
      ...this.state,
      courses: this.state.courses.map((item) =>
        item.id === courseId
          ? {
              ...item,
              moduleIds: [...item.moduleIds, module.id],
              updatedAt: now,
            }
          : item
      ),
      modules: [...this.state.modules, module],
      moduleLayouts: [
        ...this.state.moduleLayouts,
        createDefaultLearningModuleLayout(module.id, course.moduleIds.length),
      ],
      updatedAt: now,
    };
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route: 'build',
      selectedCourseId: courseId,
      selectedElementKind: 'module',
      selectedElementId: module.id,
      updatedAt: now,
    });
    this.persistState();
    this.persistUiState();
    this.render();
  }

  private createLesson(moduleId: string, type: LearningLessonType): void {
    const module = this.state.modules.find((item) => item.id === moduleId);
    if (!module) return;
    const now = new Date().toISOString();
    const lessonCount = module.lessonIds.length + 1;
    const titleKey =
      type === 'exercise'
        ? 'learningStudio.lesson.defaultExerciseTitle'
        : type === 'checkpoint'
          ? 'learningStudio.lesson.defaultCheckpointTitle'
          : 'learningStudio.lesson.defaultLessonTitle';
    const lesson: LearningLesson = {
      id: this.createId('lesson'),
      moduleId,
      title: `${this.runtime.i18n.t(titleKey)} ${lessonCount}`,
      description: '',
      order: module.lessonIds.length,
      type,
      prerequisiteIds: [],
    };
    const courseId = module.courseId;

    this.state = {
      ...this.state,
      modules: this.state.modules.map((item) =>
        item.id === moduleId
          ? {
              ...item,
              lessonIds: [...item.lessonIds, lesson.id],
            }
          : item
      ),
      lessons: [...this.state.lessons, lesson],
      courses: this.state.courses.map((item) =>
        item.id === courseId
          ? {
              ...item,
              updatedAt: now,
            }
          : item
      ),
      updatedAt: now,
    };
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route: 'build',
      selectedCourseId: courseId,
      selectedElementKind: 'lesson',
      selectedElementId: lesson.id,
      focusedLessonId: lesson.id,
      updatedAt: now,
    });
    this.persistState();
    this.persistUiState();
    this.render();
  }

  private setRoute(route: LearningStudioRoute): void {
    const nextState: LearningStudioUiStateV1 = {
      ...this.uiState,
      route,
      updatedAt: new Date().toISOString(),
    };
    if ((route === 'overview' || route === 'build') && nextState.selectedCourseId) {
      nextState.selectedElementKind =
        nextState.selectedElementKind ?? 'course';
      nextState.selectedElementId =
        nextState.selectedElementId ?? nextState.selectedCourseId;
    }
    if (route === 'learn' && nextState.selectedCourseId) {
      nextState.focusedLessonId =
        nextState.focusedLessonId ??
        this.getFirstAvailableLessonId(nextState.selectedCourseId);
    }
    if (
      (route === 'access' || route === 'settings') &&
      nextState.selectedCourseId
    ) {
      nextState.selectedElementKind = 'course';
      nextState.selectedElementId = nextState.selectedCourseId;
    }
    this.uiState = this.normalizeUiState(nextState);
    this.persistUiState();
    this.render();
  }

  private selectCourse(
    courseId: string,
    route: LearningStudioRoute = 'overview'
  ): void {
    const firstLessonId = this.getFirstAvailableLessonId(courseId);
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route,
      selectedCourseId: courseId,
      selectedElementKind:
        route === 'learn' && firstLessonId ? 'lesson' : 'course',
      selectedElementId:
        route === 'learn' && firstLessonId ? firstLessonId : courseId,
      focusedLessonId: firstLessonId,
      updatedAt: new Date().toISOString(),
    });
    this.persistUiState();
    this.render();
  }

  private selectElement(
    kind: LearningStudioSelectedElementKind,
    id: string
  ): void {
    const courseId =
      kind === 'course'
        ? id
        : kind === 'module'
          ? this.getCourseIdForModule(id)
          : this.getCourseIdForLesson(id);
    if (!courseId) return;
    const focusedLessonId =
      kind === 'lesson' ? id : this.uiState.focusedLessonId;
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      selectedCourseId: courseId,
      selectedElementKind: kind,
      selectedElementId: id,
      focusedLessonId,
      updatedAt: new Date().toISOString(),
    });
    this.persistUiState();
    this.render();
  }

  private focusLesson(lessonId: string): void {
    const courseId = this.getCourseIdForLesson(lessonId);
    if (!courseId) return;
    this.uiState = this.normalizeUiState({
      ...this.uiState,
      route: 'learn',
      selectedCourseId: courseId,
      selectedElementKind: 'lesson',
      selectedElementId: lessonId,
      focusedLessonId: lessonId,
      updatedAt: new Date().toISOString(),
    });
    this.persistUiState();
    this.render();
  }

  private updateCourse(
    courseId: string,
    patch: Partial<Pick<LearningCourse, 'title' | 'description' | 'audience'>>
  ): void {
    const now = new Date().toISOString();
    this.state = {
      ...this.state,
      courses: this.state.courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              ...patch,
              updatedAt: now,
            }
          : course
      ),
      updatedAt: now,
    };
    this.persistState();
    this.render();
  }

  private updateModule(
    moduleId: string,
    patch: Partial<Pick<LearningCourseModule, 'title'>>
  ): void {
    const now = new Date().toISOString();
    this.state = {
      ...this.state,
      modules: this.state.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              ...patch,
            }
          : module
      ),
      courses: this.state.courses.map((course) =>
        this.getCourseIdForModule(moduleId) === course.id
          ? {
              ...course,
              updatedAt: now,
            }
          : course
      ),
      updatedAt: now,
    };
    this.persistState();
    this.render();
  }

  private updateLesson(
    lessonId: string,
    patch: Partial<
      Pick<LearningLesson, 'title' | 'description' | 'type' | 'prerequisiteIds'>
    >
  ): void {
    const now = new Date().toISOString();
    const courseId = this.getCourseIdForLesson(lessonId);
    this.state = {
      ...this.state,
      lessons: this.state.lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              ...patch,
            }
          : lesson
      ),
      courses: this.state.courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              updatedAt: now,
            }
          : course
      ),
      updatedAt: now,
    };
    this.persistState();
    if (courseId && this.uiState.route === 'learn') {
      this.uiState = this.normalizeUiState({
        ...this.uiState,
        updatedAt: now,
      });
      this.persistUiState();
    }
    this.render();
  }

  private moveModule(moduleId: string, dx: number, dy: number): void {
    this.state = {
      ...this.state,
      moduleLayouts: this.state.moduleLayouts.map((layout) =>
        layout.moduleId === moduleId
          ? {
              ...layout,
              x: Math.max(0, layout.x + dx),
              y: Math.max(0, layout.y + dy),
            }
          : layout
      ),
      updatedAt: new Date().toISOString(),
    };
    this.persistState();
    this.render();
  }

  public setLessonProgress(
    lessonId: string,
    progressState: LearningProgressState
  ): void {
    const courseId = this.getCourseIdForLesson(lessonId);
    if (!courseId) return;
    const learnerRef = this.uiState.selectedLearnerRef;
    const accessState = this.getLessonLearnerState(lessonId, learnerRef);
    if (!accessState) return;
    if (progressState === 'locked') return;
    if (accessState.isLocked) return;
    const now = new Date().toISOString();
    const existing = this.state.learnerProgress.find(
      (progress) =>
        progress.lessonId === lessonId && progress.learnerRef === learnerRef
    );

    this.state = {
      ...this.state,
      learnerProgress: existing
        ? this.state.learnerProgress.map((progress) =>
            progress.id === existing.id
              ? {
                  ...progress,
                  state: progressState,
                  updatedAt: now,
                }
              : progress
          )
        : [
            ...this.state.learnerProgress,
            {
              id: this.createId('progress'),
              courseId,
              learnerRef,
              lessonId,
              state: progressState,
              updatedAt: now,
            },
        ],
      updatedAt: now,
    };
    if (
      this.uiState.route === 'learn' &&
      this.uiState.selectedCourseId === courseId &&
      this.uiState.focusedLessonId === lessonId &&
      progressState === 'completed'
    ) {
      const nextAvailableLessonId = this.computeNextAvailableLessonId(
        courseId,
        learnerRef,
        lessonId
      );
      this.uiState = this.normalizeUiState({
        ...this.uiState,
        focusedLessonId: nextAvailableLessonId,
        selectedElementKind: nextAvailableLessonId ? 'lesson' : 'course',
        selectedElementId: nextAvailableLessonId ?? courseId,
        updatedAt: now,
      });
      this.persistUiState();
    }
    this.persistState();
    this.render();
  }

  private render(): void {
    if (!this.view) return;
    this.view.update({
      runtime: this.runtime,
      state: this.state,
      uiState: this.uiState,
      onCreateManualCourse: () => this.createCourse(false),
      onCreateAiCourse: () => this.createCourse(true),
      onCreateModule: (courseId) => this.createModule(courseId),
      onCreateLesson: (moduleId, type) => this.createLesson(moduleId, type),
      onRouteChange: (route) => this.setRoute(route),
      onSelectCourse: (courseId, route) => this.selectCourse(courseId, route),
      onSelectElement: (kind, id) => this.selectElement(kind, id),
      onUpdateCourse: (courseId, patch) => this.updateCourse(courseId, patch),
      onUpdateModule: (moduleId, patch) => this.updateModule(moduleId, patch),
      onUpdateLesson: (lessonId, patch) => this.updateLesson(lessonId, patch),
      onUpdateLessonPrerequisites: (lessonId, prerequisiteIds) =>
        this.setLessonPrerequisites(lessonId, prerequisiteIds),
      onMoveModule: (moduleId, dx, dy) => this.moveModule(moduleId, dx, dy),
      onFocusLesson: (lessonId) => this.focusLesson(lessonId),
      onSetLessonProgress: (lessonId, state) =>
        this.setLessonProgress(lessonId, state),
      onInviteLearner: (courseId) => this.inviteLearner(courseId),
      onCopyShareLink: (courseId) => this.copyShareLink(courseId),
      onRevokeAccess: (courseId, learnerRef) =>
        this.revokeLearnerAccess(courseId, learnerRef),
      onPublishCourse: (courseId) => this.publishCourse(courseId),
      onArchiveCourse: (courseId) => this.archiveCourse(courseId),
      onDuplicateCourse: (courseId) => this.duplicateCourse(courseId),
      getCourseLearnerSnapshot: (courseId, learnerRef) =>
        this.getCourseLearnerSnapshot(courseId, learnerRef),
      getCourseLearnerProgressSummary: (courseId, learnerRef) =>
        this.getCourseLearnerProgressSummary(courseId, learnerRef),
      getRecommendedNextLearnerStep: (courseId, learnerRef) =>
        this.getRecommendedNextLearnerStep(courseId, learnerRef),
      getLessonLearnerState: (lessonId, learnerRef) =>
        this.getLessonLearnerState(lessonId, learnerRef),
    });
  }

  private persistState(): void {
    this.repository.saveState(this.state);
  }

  private persistUiState(): void {
    this.repository.saveUiState(this.uiState);
  }

  private ensurePersistedSkeleton(): void {
    this.persistState();
    this.persistUiState();
  }

  private normalizeState(
    state: LearningStudioLocalStateV1
  ): LearningStudioLocalStateV1 {
    const now = new Date().toISOString();
    const normalizedCourses: LearningCourse[] = state.courses.map((course, index) => ({
      id: course.id,
      title: course.title,
      description: course.description ?? '',
      audience: course.audience ?? '',
      outcomes: Array.isArray(course.outcomes)
        ? course.outcomes.filter((item): item is string => typeof item === 'string')
        : [],
      status:
        course.status === 'published' || course.status === 'archived'
          ? course.status
          : 'draft',
      createdAt: course.createdAt ?? now,
      updatedAt: course.updatedAt ?? now,
      moduleIds: Array.isArray(course.moduleIds)
        ? course.moduleIds.filter((item): item is string => typeof item === 'string')
        : [],
    }));
    const normalizedModules: LearningCourseModule[] = state.modules.map((module, index) => ({
      id: module.id,
      courseId: module.courseId,
      title:
        module.title ||
        `${this.runtime.i18n.t('learningStudio.module.defaultTitle')} ${index + 1}`,
      order: Number.isFinite(module.order) ? module.order : index,
      lessonIds: Array.isArray(module.lessonIds)
        ? module.lessonIds.filter((item): item is string => typeof item === 'string')
        : [],
    }));
    const normalizedLessons: LearningLesson[] = state.lessons.map((lesson, index) => ({
      id: lesson.id,
      moduleId: lesson.moduleId,
      title:
        lesson.title ||
        `${this.runtime.i18n.t('learningStudio.lesson.defaultLessonTitle')} ${index + 1}`,
      description: lesson.description ?? '',
      order: Number.isFinite(lesson.order) ? lesson.order : index,
      type:
        lesson.type === 'exercise' || lesson.type === 'checkpoint'
          ? lesson.type
          : 'lesson',
      prerequisiteIds: Array.isArray(lesson.prerequisiteIds)
        ? lesson.prerequisiteIds.filter(
            (item): item is string => typeof item === 'string'
          )
        : [],
    }));
    const layoutByModuleId = new Map(
      (state.moduleLayouts ?? [])
        .filter(
          (layout): layout is { moduleId: string; x: number; y: number } =>
            typeof layout?.moduleId === 'string' &&
            typeof layout?.x === 'number' &&
            typeof layout?.y === 'number'
        )
        .map((layout) => [layout.moduleId, layout])
    );

    return {
      ...createEmptyLearningStudioState(),
      ...state,
      courses: normalizedCourses,
      modules: normalizedModules,
      lessons: normalizedLessons,
      moduleLayouts: normalizedModules.map((module, index) => {
        const layout = layoutByModuleId.get(module.id);
        return layout ?? createDefaultLearningModuleLayout(module.id, index);
      }),
      updatedAt: state.updatedAt ?? now,
    };
  }

  private normalizeUiState(
    state: LearningStudioUiStateV1
  ): LearningStudioUiStateV1 {
    const fallbackCourseId = this.state.courses[0]?.id ?? null;
    const selectedCourseId =
      state.selectedCourseId !== null &&
      this.state.courses.some((course) => course.id === state.selectedCourseId)
        ? state.selectedCourseId
        : fallbackCourseId;

    const selectedElementIsValid =
      state.selectedElementKind === 'course'
        ? this.state.courses.some((course) => course.id === state.selectedElementId)
        : state.selectedElementKind === 'module'
          ? this.state.modules.some((module) => module.id === state.selectedElementId)
          : state.selectedElementKind === 'lesson'
            ? this.state.lessons.some((lesson) => lesson.id === state.selectedElementId)
            : false;

    const focusedLessonId =
      state.focusedLessonId !== null &&
      this.state.lessons.some((lesson) => lesson.id === state.focusedLessonId)
        ? state.focusedLessonId
        : selectedCourseId
          ? this.getFirstAvailableLessonId(selectedCourseId, state.selectedLearnerRef)
          : null;

    const rawRoute = String((state as { route?: string }).route ?? 'home');
    const route: LearningStudioRoute =
      rawRoute === 'authoring'
        ? 'build'
        : rawRoute === 'learner'
          ? 'learn'
          : rawRoute === 'overview' ||
              rawRoute === 'build' ||
              rawRoute === 'learn' ||
              rawRoute === 'access' ||
              rawRoute === 'settings'
            ? rawRoute
            : 'home';

    const selectedElementKind =
      selectedElementIsValid && state.selectedElementKind !== undefined
        ? state.selectedElementKind
        : (route === 'overview' || route === 'build') && selectedCourseId
          ? 'course'
          : route === 'learn' && focusedLessonId
            ? 'lesson'
            : null;

    const selectedElementId =
      selectedElementIsValid && state.selectedElementId !== undefined
        ? state.selectedElementId
        : selectedElementKind === 'course'
          ? selectedCourseId
          : selectedElementKind === 'lesson'
            ? focusedLessonId
            : null;

    return {
      ...createEmptyLearningStudioUiState(),
      ...state,
      route,
      selectedCourseId,
      selectedElementKind,
      selectedElementId,
      focusedLessonId,
    };
  }

  private getCourseIdForModule(moduleId: string): string | null {
    return this.state.modules.find((module) => module.id === moduleId)?.courseId ?? null;
  }

  private getCourseShareLink(courseId: string): string {
    const base =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://local.majom';
    return `${base}/learning-studio/share/${courseId}`;
  }

  private updateCourseStatus(
    courseId: string,
    status: LearningCourse['status']
  ): void {
    const now = new Date().toISOString();
    this.state = {
      ...this.state,
      courses: this.state.courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              status,
              updatedAt: now,
            }
          : course
      ),
      updatedAt: now,
    };
    this.persistState();
    this.render();
  }

  private getCourseIdForLesson(lessonId: string): string | null {
    const lesson = this.state.lessons.find((item) => item.id === lessonId);
    if (!lesson) return null;
    return this.getCourseIdForModule(lesson.moduleId);
  }

  private getFirstAvailableLessonId(
    courseId: string,
    learnerRef: string = this.uiState.selectedLearnerRef
  ): string | null {
    return this.computeNextAvailableLessonId(courseId, learnerRef, null);
  }

  private getOrderedModulesForCourse(courseId: string): LearningCourseModule[] {
    const course = this.state.courses.find((item) => item.id === courseId);
    if (!course) return [];
    const modulesById = new Map(
      this.state.modules
        .filter((module) => module.courseId === courseId)
        .map((module) => [module.id, module])
    );
    return course.moduleIds
      .map((moduleId) => modulesById.get(moduleId))
      .filter((module): module is LearningCourseModule => Boolean(module))
      .sort((left, right) => left.order - right.order);
  }

  private getOrderedLessonsForCourse(courseId: string): LearningLesson[] {
    return this.getOrderedModulesForCourse(courseId).reduce<LearningLesson[]>(
      (accumulator, module) => {
        const lessons = this.state.lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .sort((left, right) => left.order - right.order);
        accumulator.push(...lessons);
        return accumulator;
      },
      []
    );
  }

  private getLessonProgressRecord(
    lessonId: string,
    learnerRef: string
  ): LearnerProgress | null {
    return (
      this.state.learnerProgress.find(
        (progress) =>
          progress.lessonId === lessonId && progress.learnerRef === learnerRef
      ) ?? null
    );
  }

  private normalizePrerequisiteIds(
    lessonId: string,
    prerequisiteIds: string[]
  ): string[] {
    const lesson = this.state.lessons.find((item) => item.id === lessonId);
    if (!lesson) return [];
    const courseId = this.getCourseIdForLesson(lessonId);
    if (!courseId) return [];
    const validLessonIds = new Set(
      this.getOrderedLessonsForCourse(courseId).map((item) => item.id)
    );
    const deduped: string[] = [];
    for (const prerequisiteId of prerequisiteIds) {
      if (
        typeof prerequisiteId !== 'string' ||
        prerequisiteId === lessonId ||
        !validLessonIds.has(prerequisiteId) ||
        deduped.includes(prerequisiteId)
      ) {
        continue;
      }
      if (this.doesPrerequisiteCreateCycle(lessonId, prerequisiteId)) {
        continue;
      }
      deduped.push(prerequisiteId);
    }
    return deduped;
  }

  private doesPrerequisiteCreateCycle(
    lessonId: string,
    prerequisiteId: string
  ): boolean {
    const visited = new Set<string>();
    const stack = [prerequisiteId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      if (current === lessonId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const lesson = this.state.lessons.find((item) => item.id === current);
      if (!lesson) continue;
      lesson.prerequisiteIds.forEach((nextId) => {
        if (!visited.has(nextId)) {
          stack.push(nextId);
        }
      });
    }
    return false;
  }

  private computeNextAvailableLessonId(
    courseId: string,
    learnerRef: string,
    afterLessonId: string | null
  ): string | null {
    const orderedLessons = this.getOrderedLessonsForCourse(courseId);
    const startIndex =
      afterLessonId === null
        ? 0
        : Math.max(0, orderedLessons.findIndex((lesson) => lesson.id === afterLessonId) + 1);
    for (let index = startIndex; index < orderedLessons.length; index += 1) {
      const lesson = orderedLessons[index];
      const accessState = this.getLessonLearnerState(lesson.id, learnerRef);
      if (!accessState || accessState.isLocked || accessState.isCompleted) {
        continue;
      }
      return lesson.id;
    }
    return null;
  }

  private createId(prefix: string): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
