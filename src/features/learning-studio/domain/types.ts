export type LearningStudioRoute =
  | 'home'
  | 'overview'
  | 'build'
  | 'learn'
  | 'access'
  | 'settings';

export type LearningCourseStatus = 'draft' | 'published' | 'archived';

export type LearningLessonType = 'lesson' | 'exercise' | 'checkpoint';

export type LearningStudioSelectedElementKind = 'course' | 'module' | 'lesson';

export type LearningProgressState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'review';

export type LearningLessonSequencingState = {
  lessonId: string;
  courseId: string;
  progressState: LearningProgressState;
  isLocked: boolean;
  blockingPrerequisiteIds: string[];
};

export type LearningCourse = {
  id: string;
  title: string;
  description: string;
  audience: string;
  outcomes: string[];
  status: LearningCourseStatus;
  createdAt: string;
  updatedAt: string;
  moduleIds: string[];
};

export type LearningCourseModule = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessonIds: string[];
};

export type LearningLesson = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  type: LearningLessonType;
  prerequisiteIds: string[];
};

export type LearningLessonLearnerState = {
  lessonId: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  type: LearningLessonType;
  prerequisiteIds: string[];
  blockedByLessonIds: string[];
  progressState: LearningProgressState;
  isLocked: boolean;
  isCompleted: boolean;
};

export type LearningCourseLearnerSnapshot = {
  courseId: string;
  learnerRef: string;
  focusedLessonId: string | null;
  nextAvailableLessonId: string | null;
  lessons: LearningLessonLearnerState[];
};

export type LearningCourseLearnerProgressSummary = {
  courseId: string;
  learnerRef: string;
  totalLessons: number;
  completedLessons: number;
  availableLessons: number;
  lockedLessons: number;
  inProgressLessons: number;
  reviewLessons: number;
  completionPercentage: number;
  isCompleted: boolean;
};

export type LearningRecommendedLearnerStep = {
  courseId: string;
  learnerRef: string;
  lessonId: string;
  moduleId: string;
  title: string;
  description: string;
  type: LearningLessonType;
  progressState: LearningProgressState;
  isLocked: boolean;
};

export type LearningModuleLayout = {
  moduleId: string;
  x: number;
  y: number;
};

export type Enrollment = {
  id: string;
  courseId: string;
  learnerRef: string;
  status: 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
};

export type CourseAccessGrant = {
  id: string;
  courseId: string;
  learnerRef: string;
  createdAt: string;
  revokedAt: string | null;
};

export type LearnerProgress = {
  id: string;
  courseId: string;
  learnerRef: string;
  lessonId: string;
  state: LearningProgressState;
  updatedAt: string;
};

export type LearningSession = {
  id: string;
  courseId: string;
  learnerRef: string;
  lessonId: string | null;
  startedAt: string;
  completedAt: string | null;
};

export type LearningStudioLocalStateV1 = {
  version: 1;
  courses: LearningCourse[];
  modules: LearningCourseModule[];
  lessons: LearningLesson[];
  moduleLayouts: LearningModuleLayout[];
  enrollments: Enrollment[];
  accessGrants: CourseAccessGrant[];
  learnerProgress: LearnerProgress[];
  learningSessions: LearningSession[];
  updatedAt: string;
};

export type LearningStudioUiStateV1 = {
  version: 1;
  route: LearningStudioRoute;
  selectedCourseId: string | null;
  selectedElementKind: LearningStudioSelectedElementKind | null;
  selectedElementId: string | null;
  focusedLessonId: string | null;
  selectedLearnerRef: string;
  updatedAt: string;
};

export function createEmptyLearningStudioState(): LearningStudioLocalStateV1 {
  return {
    version: 1,
    courses: [],
    modules: [],
    lessons: [],
    moduleLayouts: [],
    enrollments: [],
    accessGrants: [],
    learnerProgress: [],
    learningSessions: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyLearningStudioUiState(): LearningStudioUiStateV1 {
  return {
    version: 1,
    route: 'home',
    selectedCourseId: null,
    selectedElementKind: null,
    selectedElementId: null,
    focusedLessonId: null,
    selectedLearnerRef: 'local-learner',
    updatedAt: new Date().toISOString(),
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
  };
}
