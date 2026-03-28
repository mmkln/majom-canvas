import type { LearningCourseContent } from '../domain/types.ts';

export type LearningCanvasMode = 'build' | 'preview';

export type LearningCanvasDocument = {
  canvasId: string;
  courseId: string;
  draftId: string | null;
  mode: LearningCanvasMode;
  title: string;
  content: LearningCourseContent;
  selection: LearningCanvasSelection | null;
};

export type LearningCanvasCommandApi = {
  createModule(position?: { sceneX?: number; sceneY?: number }): void;
  createLesson(moduleId: string): void;
  createExercise(lessonId: string): void;
  createCheckpoint(lessonId: string): void;
  setLessonPrerequisite(
    lessonId: string,
    prerequisiteLessonId: string,
    enabled: boolean
  ): void;
};

export type LearningCanvasSelection =
  | { kind: 'course'; id: string }
  | { kind: 'module'; id: string }
  | { kind: 'unit'; id: string };

export type LearningCanvasSelectionApi = {
  setSelection(selection: LearningCanvasSelection): void;
};

export type LearningCanvasHostApi = {
  getDocument(): LearningCanvasDocument;
  saveContent(nextContent: LearningCourseContent): void;
  commands: LearningCanvasCommandApi;
  selection: LearningCanvasSelectionApi;
};
