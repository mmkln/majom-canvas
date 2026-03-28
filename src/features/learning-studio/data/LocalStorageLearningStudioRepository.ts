import {
  createDefaultLearningModuleLayout,
  createEmptyLearningStudioState,
  createEmptyLearningStudioUiState,
  deriveLearningStudioMode,
  type LearningCompletionMethod,
  type LearningCourseAccessGrant,
  type LearningCourseContent,
  type LearningCourseDraft,
  type LearningCourseModule,
  type LearningCoursePublishedVersion,
  type LearningCourseRecord,
  type LearningCourseUnit,
  type LearningEnrollment,
  type LearningLearnerSessionRecord,
  type LearningLessonBlock,
  type LearningLessonTextBlockType,
  type LearningProgressRecord,
  type LearningProgressState,
  type LearningStudioLocalStateV2,
  type LearningStudioRoute,
  type LearningStudioUiStateV2,
} from '../domain/types.ts';

export const LEARNING_STUDIO_STATE_STORAGE_KEY = 'learning-studio-state';
export const LEARNING_STUDIO_UI_STATE_STORAGE_KEY = 'learning-studio-ui-state';

const LEGACY_LEARNING_STUDIO_STATE_STORAGE_KEYS = ['learning-studio-state-v1'];
const LEGACY_LEARNING_STUDIO_UI_STATE_STORAGE_KEYS = [
  'learning-studio-ui-state-v1',
];

type LegacyLearningStudioRoute =
  | 'home'
  | 'overview'
  | 'build'
  | 'learn'
  | 'access'
  | 'settings'
  | 'authoring'
  | 'learner';

type LegacyLearningCourseStatus = 'draft' | 'published' | 'archived';

type LegacyLearningLessonType = 'lesson' | 'exercise' | 'checkpoint';

type LegacyLearningProgressState = LearningProgressState;

type LegacyLearningStudioState = {
  version: 1;
  courses: Array<{
    id: string;
    title: string;
    description: string;
    audience: string;
    outcomes: string[];
    status: LegacyLearningCourseStatus;
    createdAt: string;
    updatedAt: string;
    moduleIds: string[];
  }>;
  modules: Array<{
    id: string;
    courseId: string;
    title: string;
    order: number;
    lessonIds: string[];
  }>;
  lessons: Array<{
    id: string;
    moduleId: string;
    title: string;
    description: string;
    order: number;
    type: LegacyLearningLessonType;
    prerequisiteIds: string[];
  }>;
  moduleLayouts?: Array<{
    moduleId: string;
    x: number;
    y: number;
  }>;
  enrollments: Array<{
    id: string;
    courseId: string;
    learnerRef: string;
    status: 'active' | 'revoked';
    createdAt: string;
    updatedAt: string;
  }>;
  accessGrants: Array<{
    id: string;
    courseId: string;
    learnerRef: string;
    createdAt: string;
    revokedAt: string | null;
  }>;
  learnerProgress: Array<{
    id: string;
    courseId: string;
    learnerRef: string;
    lessonId: string;
    state: LegacyLearningProgressState;
    updatedAt: string;
  }>;
  learningSessions: Array<{
    id: string;
    courseId: string;
    learnerRef: string;
    lessonId: string | null;
    startedAt: string;
    completedAt: string | null;
  }>;
  updatedAt: string;
};

type LegacyLearningStudioUiState = {
  version: 1;
  route: LegacyLearningStudioRoute;
  selectedCourseId: string | null;
  selectedElementKind?: 'course' | 'module' | 'lesson' | null;
  selectedElementId?: string | null;
  focusedLessonId?: string | null;
  selectedLearnerRef: string;
  updatedAt: string;
};

export class LocalStorageLearningStudioRepository {
  constructor(private readonly storage: Storage = localStorage) {}

  public loadState(): LearningStudioLocalStateV2 {
    const parsed = this.readJson([
      LEARNING_STUDIO_STATE_STORAGE_KEY,
      ...LEGACY_LEARNING_STUDIO_STATE_STORAGE_KEYS,
    ]);

    if (isLearningStudioStateV2(parsed)) {
      return parsed;
    }

    if (isLegacyLearningStudioState(parsed)) {
      return migrateLegacyLearningStudioState(parsed);
    }

    return createEmptyLearningStudioState();
  }

  public saveState(state: LearningStudioLocalStateV2): void {
    this.storage.setItem(
      LEARNING_STUDIO_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  public loadUiState(): LearningStudioUiStateV2 {
    const parsed = this.readJson([
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      ...LEGACY_LEARNING_STUDIO_UI_STATE_STORAGE_KEYS,
    ]);

    if (isLearningStudioUiStateV2(parsed)) {
      return parsed;
    }

    if (isLegacyLearningStudioUiState(parsed)) {
      return migrateLegacyLearningStudioUiState(parsed);
    }

    return createEmptyLearningStudioUiState();
  }

  public saveUiState(state: LearningStudioUiStateV2): void {
    this.storage.setItem(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  private readJson(keys: string[]): unknown {
    for (const key of keys) {
      try {
        const raw = this.storage.getItem(key);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

function migrateLegacyLearningStudioState(
  legacy: LegacyLearningStudioState
): LearningStudioLocalStateV2 {
  const nextState = createEmptyLearningStudioState();
  const now = legacy.updatedAt;
  const versionNeededByCourseId = new Set<string>();

  legacy.courses.forEach((course) => {
    if (course.status !== 'draft') {
      versionNeededByCourseId.add(course.id);
    }
  });
  legacy.enrollments.forEach((enrollment) => {
    versionNeededByCourseId.add(enrollment.courseId);
  });
  legacy.learnerProgress.forEach((progress) => {
    versionNeededByCourseId.add(progress.courseId);
  });
  legacy.learningSessions.forEach((session) => {
    versionNeededByCourseId.add(session.courseId);
  });

  const courseVersionIdByCourseId = new Map<string, string>();
  const lessonById = new Map(legacy.lessons.map((lesson) => [lesson.id, lesson]));
  const modulesByCourseId = groupBy(legacy.modules, (module) => module.courseId);
  const layoutsByModuleId = new Map(
    (legacy.moduleLayouts ?? []).map((layout) => [layout.moduleId, layout])
  );

  legacy.courses.forEach((course) => {
    const content = migrateLegacyCourseContent(
      course,
      modulesByCourseId.get(course.id) ?? [],
      lessonById,
      layoutsByModuleId
    );
    const draftId = `draft:${course.id}:1`;
    const versionId = versionNeededByCourseId.has(course.id)
      ? `version:${course.id}:1`
      : null;

    nextState.courses.push({
      id: course.id,
      ownerRef: 'local-owner',
      lifecycleState: course.status,
      activeDraftId: draftId,
      latestPublishedVersionId: versionId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
    nextState.drafts.push({
      id: draftId,
      courseId: course.id,
      revision: 1,
      content,
      lastPreviewedAt: null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
    if (versionId) {
      courseVersionIdByCourseId.set(course.id, versionId);
      nextState.publishedVersions.push({
        id: versionId,
        courseId: course.id,
        versionNumber: 1,
        sourceDraftId: draftId,
        content,
        publishedAt: course.updatedAt,
      });
    }
  });

  nextState.accessGrants = legacy.accessGrants.map((grant) => ({
    id: grant.id,
    courseId: grant.courseId,
    learnerRef: grant.learnerRef,
    grantedAt: grant.createdAt,
    revokedAt: grant.revokedAt,
  }));

  const enrollmentKey = (courseId: string, learnerRef: string) =>
    `${courseId}::${learnerRef}`;
  const enrollmentIdByKey = new Map<string, string>();

  legacy.enrollments.forEach((enrollment) => {
    const publishedVersionId = courseVersionIdByCourseId.get(enrollment.courseId);
    if (!publishedVersionId) return;

    const startedAt = findLegacyStartedAt(
      legacy,
      enrollment.courseId,
      enrollment.learnerRef
    );
    nextState.enrollments.push({
      id: enrollment.id,
      courseId: enrollment.courseId,
      publishedVersionId,
      learnerRef: enrollment.learnerRef,
      status: enrollment.status,
      createdAt: enrollment.createdAt,
      startedAt,
      updatedAt: enrollment.updatedAt,
    });
    enrollmentIdByKey.set(
      enrollmentKey(enrollment.courseId, enrollment.learnerRef),
      enrollment.id
    );
  });

  collectLegacyLearnerPairs(legacy).forEach(({ courseId, learnerRef, startedAt }) => {
    const key = enrollmentKey(courseId, learnerRef);
    if (enrollmentIdByKey.has(key)) return;
    const publishedVersionId = courseVersionIdByCourseId.get(courseId);
    if (!publishedVersionId) return;

    const syntheticEnrollmentId = `enrollment:${courseId}:${learnerRef}`;
    nextState.enrollments.push({
      id: syntheticEnrollmentId,
      courseId,
      publishedVersionId,
      learnerRef,
      status: 'active',
      createdAt: startedAt,
      startedAt,
      updatedAt: startedAt,
    });
    enrollmentIdByKey.set(key, syntheticEnrollmentId);
  });

  nextState.progressRecords = legacy.learnerProgress
    .map<LearningProgressRecord | null>((progress) => {
      const key = enrollmentKey(progress.courseId, progress.learnerRef);
      const enrollmentId = enrollmentIdByKey.get(key);
      const publishedVersionId = courseVersionIdByCourseId.get(progress.courseId);
      if (!enrollmentId || !publishedVersionId) return null;

      return {
        id: progress.id,
        enrollmentId,
        publishedVersionId,
        unitId: progress.lessonId,
        state: progress.state,
        completionMethod: mapLegacyCompletionMethod(progress.state),
        startedAt:
          progress.state === 'available' || progress.state === 'locked'
            ? null
            : progress.updatedAt,
        completedAt:
          progress.state === 'completed' || progress.state === 'review'
            ? progress.updatedAt
            : null,
        reviewRequestedAt:
          progress.state === 'review' ? progress.updatedAt : null,
        lastOpenedAt:
          progress.state === 'locked' ? null : progress.updatedAt,
        updatedAt: progress.updatedAt,
      };
    })
    .filter((record): record is LearningProgressRecord => record !== null);

  nextState.learnerSessions = legacy.learningSessions
    .map<LearningLearnerSessionRecord | null>((session) => {
      const key = enrollmentKey(session.courseId, session.learnerRef);
      const enrollmentId = enrollmentIdByKey.get(key);
      const publishedVersionId = courseVersionIdByCourseId.get(session.courseId);
      if (!enrollmentId || !publishedVersionId) return null;

      return {
        id: session.id,
        enrollmentId,
        courseId: session.courseId,
        publishedVersionId,
        focusedUnitId: session.lessonId,
        lastOpenedUnitId: session.lessonId,
        startedAt: session.startedAt,
        updatedAt: session.completedAt ?? session.startedAt,
      };
    })
    .filter((record): record is LearningLearnerSessionRecord => record !== null);

  nextState.updatedAt = now;
  return nextState;
}

function migrateLegacyCourseContent(
  course: LegacyLearningStudioState['courses'][number],
  legacyModules: LegacyLearningStudioState['modules'],
  lessonById: Map<string, LegacyLearningStudioState['lessons'][number]>,
  layoutsByModuleId: Map<
    string,
    NonNullable<LegacyLearningStudioState['moduleLayouts']>[number]
  >
): LearningCourseContent {
  const modules = legacyModules
    .slice()
    .sort((left, right) => left.order - right.order)
    .map<LearningCourseModule>((module) => {
      const lessonIds = module.lessonIds.filter((lessonId) =>
        lessonById.has(lessonId)
      );
      return {
        id: module.id,
        title: module.title,
        description: '',
        order: module.order,
        lessonIds,
      };
    });

  const allLegacyLessons = Array.from(lessonById.values());
  const fallbackLessons = legacyModules.reduce<
    LegacyLearningStudioState['lessons']
  >((items, module) => {
    items.push(
      ...allLegacyLessons.filter(
        (lesson: LegacyLearningStudioState['lessons'][number]) =>
          lesson.moduleId === module.id
      )
    );
    return items;
  }, []);
  const units = modules.reduce<LearningCourseUnit[]>(
    (items, module: LearningCourseModule) => {
      const orderedLegacyLessons =
        module.lessonIds.length > 0
          ? module.lessonIds
              .map(
                (lessonId: string) => lessonById.get(lessonId) ?? null
              )
              .filter(
                (
                  lesson
                ): lesson is LegacyLearningStudioState['lessons'][number] =>
                  lesson !== null
              )
          : fallbackLessons
              .filter(
                (lesson: LegacyLearningStudioState['lessons'][number]) =>
                  lesson.moduleId === module.id
              )
              .sort(
                (
                  left: LegacyLearningStudioState['lessons'][number],
                  right: LegacyLearningStudioState['lessons'][number]
                ) => left.order - right.order
              );

      items.push(
        ...orderedLegacyLessons.map(
          (
            lesson: LegacyLearningStudioState['lessons'][number],
            lessonIndex: number
          ) => ({
            id: lesson.id,
            moduleId: module.id,
            parentLessonId: null,
            order: Number.isFinite(lesson.order) ? lesson.order : lessonIndex,
            type: lesson.type,
            title: lesson.title,
            description: lesson.description,
            objective: '',
            estimatedDurationMinutes: null,
            prerequisiteLessonIds: lesson.prerequisiteIds.filter(
              (prerequisiteId: string) => prerequisiteId.length > 0
            ),
            blocks: createLegacyLessonBlocks(lesson),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          })
        )
      );

      return items;
    },
    []
  );

  const moduleLayouts = modules.map((module, index) => {
    const defaultLayout = createDefaultLearningModuleLayout(module.id, index);
    const legacyLayout = layoutsByModuleId.get(module.id);
    return {
      moduleId: module.id,
      x: legacyLayout?.x ?? defaultLayout.x,
      y: legacyLayout?.y ?? defaultLayout.y,
      collapsed: false,
    };
  });

  return {
    title: course.title,
    description: course.description,
    audience: course.audience,
    outcomes: course.outcomes,
    estimatedDurationMinutes: null,
    modules,
    units,
    moduleLayouts,
  };
}

function createLegacyLessonBlocks(
  lesson: LegacyLearningStudioState['lessons'][number]
): LearningLessonBlock[] {
  const text = lesson.description.trim();
  if (text.length === 0) return [];

  const type: LearningLessonTextBlockType =
    lesson.type === 'lesson' ? 'concept' : 'instruction';

  return [
    {
      id: `block:${lesson.id}:0`,
      order: 0,
      type,
      text,
    },
  ];
}

function collectLegacyLearnerPairs(
  legacy: LegacyLearningStudioState
): Array<{ courseId: string; learnerRef: string; startedAt: string }> {
  const pairs = new Map<string, { courseId: string; learnerRef: string; startedAt: string }>();

  const rememberPair = (
    courseId: string,
    learnerRef: string,
    startedAt: string | null | undefined
  ) => {
    if (!startedAt) return;
    const key = `${courseId}::${learnerRef}`;
    const existing = pairs.get(key);
    if (!existing || startedAt < existing.startedAt) {
      pairs.set(key, { courseId, learnerRef, startedAt });
    }
  };

  legacy.enrollments.forEach((enrollment) => {
    rememberPair(enrollment.courseId, enrollment.learnerRef, enrollment.createdAt);
  });
  legacy.learnerProgress.forEach((progress) => {
    rememberPair(progress.courseId, progress.learnerRef, progress.updatedAt);
  });
  legacy.learningSessions.forEach((session) => {
    rememberPair(session.courseId, session.learnerRef, session.startedAt);
  });

  return Array.from(pairs.values());
}

function findLegacyStartedAt(
  legacy: LegacyLearningStudioState,
  courseId: string,
  learnerRef: string
): string | null {
  const timestamps = [
    ...legacy.enrollments
      .filter(
        (enrollment) =>
          enrollment.courseId === courseId &&
          enrollment.learnerRef === learnerRef
      )
      .map((enrollment) => enrollment.createdAt),
    ...legacy.learnerProgress
      .filter(
        (progress) =>
          progress.courseId === courseId && progress.learnerRef === learnerRef
      )
      .map((progress) => progress.updatedAt),
    ...legacy.learningSessions
      .filter(
        (session) =>
          session.courseId === courseId && session.learnerRef === learnerRef
      )
      .map((session) => session.startedAt),
  ].filter((timestamp): timestamp is string => typeof timestamp === 'string');

  if (timestamps.length === 0) return null;
  return timestamps.slice().sort()[0] ?? null;
}

function mapLegacyCompletionMethod(
  state: LegacyLearningProgressState
): LearningCompletionMethod | null {
  if (state === 'completed' || state === 'review') return 'manual';
  if (state === 'in_progress') return 'auto_progress_to_in_progress';
  return null;
}

function migrateLegacyLearningStudioUiState(
  legacy: LegacyLearningStudioUiState
): LearningStudioUiStateV2 {
  const route = mapLegacyRoute(legacy.route);
  return {
    ...createEmptyLearningStudioUiState(),
    route,
    mode: deriveLearningStudioMode(route),
    selectedCourseId: legacy.selectedCourseId,
    selectedDraftId: null,
    selectedPublishedVersionId: null,
    selectedEnrollmentId: null,
    activeLearnerRef: legacy.selectedLearnerRef,
    selectedElementKind: legacy.selectedElementKind ?? null,
    selectedElementId: legacy.selectedElementId ?? null,
    preview: {
      focusedUnitId: legacy.focusedLessonId ?? null,
      sandboxProgress: {},
      updatedAt: null,
    },
    updatedAt: legacy.updatedAt,
  };
}

function mapLegacyRoute(route: LegacyLearningStudioRoute): LearningStudioRoute {
  switch (route) {
    case 'overview':
      return 'overview';
    case 'build':
    case 'authoring':
      return 'build';
    case 'learn':
    case 'learner':
      return 'preview';
    case 'access':
    case 'settings':
      return 'overview';
    case 'home':
    default:
      return 'home';
  }
}

function isLearningStudioStateV2(
  value: unknown
): value is LearningStudioLocalStateV2 {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 2 &&
    typeof value.updatedAt === 'string' &&
    isObjectArray(value.courses) &&
    isObjectArray(value.drafts) &&
    isObjectArray(value.publishedVersions) &&
    isObjectArray(value.accessGrants) &&
    isObjectArray(value.enrollments) &&
    isObjectArray(value.progressRecords) &&
    isObjectArray(value.learnerSessions)
  );
}

function isLearningStudioUiStateV2(
  value: unknown
): value is LearningStudioUiStateV2 {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 2 &&
    isLearningStudioRoute(value.route) &&
    (value.mode === 'author' ||
      value.mode === 'preview' ||
      value.mode === 'learner') &&
    isNullableString(value.selectedCourseId) &&
    isNullableString(value.selectedDraftId) &&
    isNullableString(value.selectedPublishedVersionId) &&
    isNullableString(value.selectedEnrollmentId) &&
    isNullableString(value.activeLearnerRef) &&
    (value.selectedElementKind === null ||
      value.selectedElementKind === 'course' ||
      value.selectedElementKind === 'module' ||
      value.selectedElementKind === 'lesson' ||
      value.selectedElementKind === 'block') &&
    isNullableString(value.selectedElementId) &&
    (value.inspectorPanel === 'none' ||
      value.inspectorPanel === 'course' ||
      value.inspectorPanel === 'module' ||
      value.inspectorPanel === 'lesson') &&
    isPlainObject(value.preview) &&
    isPlainObject(value.learner) &&
    typeof value.updatedAt === 'string'
  );
}

function isLegacyLearningStudioState(
  value: unknown
): value is LegacyLearningStudioState {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 1 &&
    typeof value.updatedAt === 'string' &&
    isObjectArray(value.courses) &&
    isObjectArray(value.modules) &&
    isObjectArray(value.lessons) &&
    (value.moduleLayouts === undefined || isObjectArray(value.moduleLayouts)) &&
    isObjectArray(value.enrollments) &&
    isObjectArray(value.accessGrants) &&
    isObjectArray(value.learnerProgress) &&
    isObjectArray(value.learningSessions)
  );
}

function isLegacyLearningStudioUiState(
  value: unknown
): value is LegacyLearningStudioUiState {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 1 &&
    typeof value.route === 'string' &&
    typeof value.selectedLearnerRef === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isLearningStudioRoute(value: unknown): value is LearningStudioRoute {
  return (
    value === 'home' ||
    value === 'overview' ||
    value === 'build' ||
    value === 'preview' ||
    value === 'learner_home' ||
    value === 'learner_lesson' ||
    value === 'learner_completion'
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isObjectArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function groupBy<T>(
  items: T[],
  keySelector: (item: T) => string
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keySelector(item);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
      return;
    }
    grouped.set(key, [item]);
  });
  return grouped;
}
