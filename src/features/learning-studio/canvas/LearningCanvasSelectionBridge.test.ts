import { describe, expect, it, vi } from 'vitest';
import { Scene } from '../../canvas-core/core/scene/Scene.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import { LearningCanvasSelectionBridge } from './LearningCanvasSelectionBridge.ts';
import { createEmptyLearningCourseContent } from '../domain/types.ts';

function createHostApi(): LearningCanvasHostApi {
  return {
    getDocument: () => ({
      canvasId: 'canvas-1',
      courseId: 'course-1',
      draftId: 'draft-1',
      mode: 'build',
      title: 'Course',
      content: createEmptyLearningCourseContent(),
      selection: null,
    }),
    saveContent: () => {},
    commands: {
      createModule: () => {},
      createLesson: () => {},
      createExercise: () => {},
      createCheckpoint: () => {},
      setLessonPrerequisite: () => {},
    },
    selection: {
      setSelection: vi.fn(),
    },
  };
}

describe('LearningCanvasSelectionBridge', () => {
  it('maps scene selection into learning host selection states', () => {
    const scene = new Scene();
    const hostApi = createHostApi();
    const bridge = new LearningCanvasSelectionBridge(scene, hostApi);
    const moduleNode = new LearningModuleNode({
      id: 'module-1',
      title: 'Module 1',
    });
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      title: 'Lesson 1',
      moduleId: 'module-1',
      parentLessonId: null,
    });

    scene.addElement(moduleNode);
    scene.addElement(lessonNode);

    bridge.mount();
    scene.setSelected([moduleNode]);
    scene.setSelected([lessonNode]);
    scene.clearSelected();
    bridge.unmount();

    expect(hostApi.selection.setSelection).toHaveBeenCalledWith({
      kind: 'course',
      id: 'course-1',
    });
    expect(hostApi.selection.setSelection).toHaveBeenCalledWith({
      kind: 'module',
      id: 'module-1',
    });
    expect(hostApi.selection.setSelection).toHaveBeenCalledWith({
      kind: 'unit',
      id: 'lesson-1',
    });
  });
});
