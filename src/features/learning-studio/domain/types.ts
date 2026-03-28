export type LearningStudioRoute =
  | 'home'
  | 'overview'
  | 'build'
  | 'preview'
  | 'learner_home'
  | 'learner_lesson'
  | 'learner_completion';

export type LearningStudioMode = 'author' | 'preview' | 'learner';

export type LearningCourseLifecycleState = 'draft' | 'published' | 'archived';

export type LearningUnitType = 'lesson' | 'exercise' | 'checkpoint';

export type LearningProgressState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'review';

export type LearningCompletionMethod =
  | 'manual'
  | 'auto_progress_to_in_progress'
  | 'sandbox_preview';

export type LearningStudioSelectionKind =
  | 'course'
  | 'module'
  | 'lesson'
  | 'block';

export type LearningStudioInspectorPanel =
  | 'none'
  | 'course'
  | 'module'
  | 'lesson';

export type LearningLessonTextBlockType =
  | 'intro'
  | 'concept'
  | 'example'
  | 'instruction'
  | 'summary';

type LearningLessonTextBlock = {
  id: string;
  order: number;
  type: LearningLessonTextBlockType;
  text: string;
};

type LearningLessonExerciseReferenceBlock = {
  id: string;
  order: number;
  type: 'exercise_ref';
  refUnitId: string;
};

type LearningLessonCheckpointReferenceBlock = {
  id: string;
  order: number;
  type: 'checkpoint_ref';
  refUnitId: string;
};

export type LearningLessonBlock =
  | LearningLessonTextBlock
  | LearningLessonExerciseReferenceBlock
  | LearningLessonCheckpointReferenceBlock;

export type LearningModuleLayout = {
  moduleId: string;
  x: number;
  y: number;
  collapsed: boolean;
};

export type LearningCourseModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessonIds: string[];
};

export type LearningCourseUnit = {
  id: string;
  moduleId: string;
  parentLessonId: string | null;
  order: number;
  type: LearningUnitType;
  title: string;
  description: string;
  objective: string;
  estimatedDurationMinutes: number | null;
  prerequisiteLessonIds: string[];
  blocks: LearningLessonBlock[];
  createdAt: string;
  updatedAt: string;
};

export type LearningCourseContent = {
  title: string;
  description: string;
  audience: string;
  outcomes: string[];
  estimatedDurationMinutes: number | null;
  modules: LearningCourseModule[];
  units: LearningCourseUnit[];
  moduleLayouts: LearningModuleLayout[];
};

export type LearningCourseRecord = {
  id: string;
  ownerRef: string;
  lifecycleState: LearningCourseLifecycleState;
  activeDraftId: string;
  latestPublishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningCourseDraft = {
  id: string;
  courseId: string;
  revision: number;
  content: LearningCourseContent;
  lastPreviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningCoursePublishedVersion = {
  id: string;
  courseId: string;
  versionNumber: number;
  sourceDraftId: string;
  content: LearningCourseContent;
  publishedAt: string;
};

export type LearningCourseAccessGrant = {
  id: string;
  courseId: string;
  learnerRef: string;
  grantedAt: string;
  revokedAt: string | null;
};

export type LearningEnrollment = {
  id: string;
  courseId: string;
  publishedVersionId: string;
  learnerRef: string;
  status: 'active' | 'revoked';
  createdAt: string;
  startedAt: string | null;
  updatedAt: string;
};

export type LearningProgressRecord = {
  id: string;
  enrollmentId: string;
  publishedVersionId: string;
  unitId: string;
  state: LearningProgressState;
  completionMethod: LearningCompletionMethod | null;
  startedAt: string | null;
  completedAt: string | null;
  reviewRequestedAt: string | null;
  lastOpenedAt: string | null;
  updatedAt: string;
};

export type LearningLearnerSessionRecord = {
  id: string;
  enrollmentId: string;
  courseId: string;
  publishedVersionId: string;
  focusedUnitId: string | null;
  lastOpenedUnitId: string | null;
  startedAt: string;
  updatedAt: string;
};

export type LearningPreviewUiState = {
  focusedUnitId: string | null;
  sandboxProgress: Record<string, LearningProgressState>;
  updatedAt: string | null;
};

export type LearningLearnerUiState = {
  courseId: string | null;
  enrollmentId: string | null;
  focusedUnitId: string | null;
  lastResumeUnitId: string | null;
};

export type LearningStudioLocalStateV2 = {
  version: 2;
  courses: LearningCourseRecord[];
  drafts: LearningCourseDraft[];
  publishedVersions: LearningCoursePublishedVersion[];
  accessGrants: LearningCourseAccessGrant[];
  enrollments: LearningEnrollment[];
  progressRecords: LearningProgressRecord[];
  learnerSessions: LearningLearnerSessionRecord[];
  updatedAt: string;
};

export type LearningStudioUiStateV2 = {
  version: 2;
  route: LearningStudioRoute;
  mode: LearningStudioMode;
  selectedCourseId: string | null;
  selectedDraftId: string | null;
  selectedPublishedVersionId: string | null;
  selectedEnrollmentId: string | null;
  activeLearnerRef: string | null;
  selectedElementKind: LearningStudioSelectionKind | null;
  selectedElementId: string | null;
  inspectorPanel: LearningStudioInspectorPanel;
  preview: LearningPreviewUiState;
  learner: LearningLearnerUiState;
  updatedAt: string;
};

export function createEmptyLearningStudioState(): LearningStudioLocalStateV2 {
  return {
    version: 2,
    courses: [],
    drafts: [],
    publishedVersions: [],
    accessGrants: [],
    enrollments: [],
    progressRecords: [],
    learnerSessions: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyLearningStudioUiState(): LearningStudioUiStateV2 {
  return {
    version: 2,
    route: 'home',
    mode: 'author',
    selectedCourseId: null,
    selectedDraftId: null,
    selectedPublishedVersionId: null,
    selectedEnrollmentId: null,
    activeLearnerRef: 'local-learner',
    selectedElementKind: null,
    selectedElementId: null,
    inspectorPanel: 'none',
    preview: {
      focusedUnitId: null,
      sandboxProgress: {},
      updatedAt: null,
    },
    learner: {
      courseId: null,
      enrollmentId: null,
      focusedUnitId: null,
      lastResumeUnitId: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyLearningCourseContent(): LearningCourseContent {
  return {
    title: '',
    description: '',
    audience: '',
    outcomes: [],
    estimatedDurationMinutes: null,
    modules: [],
    units: [],
    moduleLayouts: [],
  };
}

export function createDefaultLearningModuleLayout(
  moduleId: string,
  index: number
): LearningModuleLayout {
  return {
    moduleId,
    x: 32 + (index % 3) * 300,
    y: 32 + Math.floor(index / 3) * 240,
    collapsed: false,
  };
}

export function deriveLearningStudioMode(
  route: LearningStudioRoute
): LearningStudioMode {
  if (route === 'preview') return 'preview';
  if (
    route === 'learner_home' ||
    route === 'learner_lesson' ||
    route === 'learner_completion'
  ) {
    return 'learner';
  }
  return 'author';
}
