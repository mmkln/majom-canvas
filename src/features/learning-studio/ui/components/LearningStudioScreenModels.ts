import type { LearningCourseMapModel } from '../../map/index.ts';

export type LearningStudioHomeCourseCard = {
  id: string;
  title: string;
  description: string;
  lifecycleState: 'draft' | 'published' | 'archived';
  moduleCount: number;
  unitCount: number;
  updatedAt: string;
};

export type LearningStudioOverviewStructureModule = {
  id: string;
  title: string;
  lessonCount: number;
  exerciseCount: number;
  checkpointCount: number;
  warning?: 'needs_lessons' | null;
};

export type LearningStudioOverviewReadinessIssue =
  | {
      kind: 'missing_title';
    }
  | {
      kind: 'missing_description';
    }
  | {
      kind: 'missing_modules';
    }
  | {
      kind: 'modules_need_lessons';
      count: number;
    }
  | {
      kind: 'lessons_need_descriptions';
      count: number;
    };

export type LearningStudioOverviewModel = {
  courseId: string;
  draftId: string | null;
  title: string;
  description: string;
  audience: string;
  outcomes: string[];
  lifecycleState: 'draft' | 'published' | 'archived';
  moduleCount: number;
  unitCount: number;
  latestPublishedVersionId: string | null;
  updatedAt: string;
  structure: LearningStudioOverviewStructureModule[];
  nextRecommendedRoute: 'build' | 'preview';
  hasUnpublishedChanges?: boolean;
  activeEnrollmentCount?: number;
  readinessIssues?: LearningStudioOverviewReadinessIssue[];
};

export type LearningStudioBuildChildUnit = {
  id: string;
  title: string;
  type: 'exercise' | 'checkpoint';
  order: number;
  selected: boolean;
};

export type LearningStudioBuildLesson = {
  id: string;
  title: string;
  description: string;
  type: 'lesson';
  order: number;
  selected: boolean;
  missingDescription: boolean;
  prerequisiteIssue: boolean;
  childUnits: LearningStudioBuildChildUnit[];
};

export type LearningStudioBuildModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  selected: boolean;
  collapsed: boolean;
  missingLessons: boolean;
  childUnitCount: number;
  lessons: LearningStudioBuildLesson[];
};

export type LearningStudioBuildLessonBlock =
  | {
      id: string;
      order: number;
      type: 'intro' | 'concept' | 'example' | 'instruction' | 'summary';
      text: string;
    }
  | {
      id: string;
      order: number;
      type: 'exercise_ref' | 'checkpoint_ref';
      refUnitId: string;
    };

export type LearningStudioBuildInspectorModel =
  | {
      kind: 'course';
      title: string;
      description: string;
      moduleCount: number;
      unitCount: number;
      missingModules: boolean;
      missingDescriptions: number;
    }
  | {
      kind: 'module';
      id: string;
      title: string;
      description: string;
      lessonCount: number;
    }
  | {
      kind: 'unit';
      id: string;
      title: string;
      description: string;
      objective: string;
      type: 'lesson' | 'exercise' | 'checkpoint';
      prerequisiteLessonIds: string[];
      availablePrerequisites: Array<{
        id: string;
        title: string;
      }>;
      blocks: LearningStudioBuildLessonBlock[];
      availableExerciseRefs: Array<{
        id: string;
        title: string;
      }>;
      availableCheckpointRefs: Array<{
        id: string;
        title: string;
      }>;
    };

export type LearningStudioBuildModel = {
  course: LearningStudioOverviewModel;
  modules: LearningStudioBuildModule[];
  selected:
    | { kind: 'course'; id: string }
    | { kind: 'module'; id: string }
    | { kind: 'unit'; id: string }
    | null;
  inspector: LearningStudioBuildInspectorModel;
};

export type LearningStudioPreviewLesson = {
  id: string;
  moduleId: string;
  title: string;
  status: 'locked' | 'available' | 'completed';
  selected: boolean;
  hasWarnings: boolean;
};

export type LearningStudioPreviewModule = {
  id: string;
  title: string;
  lessons: LearningStudioPreviewLesson[];
};

export type LearningStudioPreviewFocusedLesson = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  description: string;
  objective: string;
  status: 'locked' | 'available' | 'completed';
  prerequisiteTitles: string[];
  blockedByTitles: string[];
  warnings: string[];
  blocks: LearningStudioPreviewLessonBlock[];
};

export type LearningStudioPreviewModel = {
  course: LearningStudioOverviewModel;
  modules: LearningStudioPreviewModule[];
  map: LearningCourseMapModel;
  focusedLesson: LearningStudioPreviewFocusedLesson | null;
  nextRecommendedLessonId: string | null;
  sandboxMode: true;
};

export type LearningStudioPreviewLessonBlock =
  | {
      id: string;
      order: number;
      type: 'intro' | 'concept' | 'example' | 'instruction' | 'summary';
      text: string;
    }
  | {
      id: string;
      order: number;
      type: 'exercise_ref' | 'checkpoint_ref';
      refUnitId: string;
      refTitle: string;
      broken: boolean;
    };

export type LearningStudioScreenModel =
  | {
      kind: 'home';
      courses: LearningStudioHomeCourseCard[];
    }
  | {
      kind: 'overview';
      course: LearningStudioOverviewModel;
    }
  | {
      kind: 'build';
      build: LearningStudioBuildModel;
    }
  | {
      kind: 'preview';
      preview: LearningStudioPreviewModel;
    };
