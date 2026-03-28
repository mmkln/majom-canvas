import { describe, expect, it, vi } from 'vitest';

import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningCanvasInteractionAdapter } from './LearningCanvasInteractionAdapter.ts';
import { createEmptyLearningCourseContent } from '../domain/types.ts';
import Connection from '../../canvas-core/core/shapes/Connection.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
} from '../../canvas-core/core/interfaces/connection.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';

function createHostApi(
  overrides: Partial<LearningCanvasHostApi['commands']> = {},
  mode: 'build' | 'preview' = 'build'
): LearningCanvasHostApi {
  return {
    getDocument: () => ({
      canvasId: 'canvas-1',
      courseId: 'course-1',
      draftId: 'draft-1',
      mode,
      title: 'Course',
      content: {
        ...createEmptyLearningCourseContent(),
        modules: [
          {
            id: 'module-1',
            title: 'Module 1',
            description: '',
            order: 0,
            lessonIds: ['lesson-1', 'lesson-2'],
          },
        ],
        units: [
          {
            id: 'lesson-1',
            moduleId: 'module-1',
            parentLessonId: null,
            type: 'lesson',
            title: 'Lesson 1',
            description: '',
            objective: '',
            estimatedDurationMinutes: null,
            order: 0,
            prerequisiteLessonIds: [],
            blocks: [],
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'lesson-2',
            moduleId: 'module-1',
            parentLessonId: null,
            type: 'lesson',
            title: '',
            description: '',
            objective: '',
            estimatedDurationMinutes: null,
            order: 1,
            prerequisiteLessonIds: [],
            blocks: [],
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'exercise-1',
            moduleId: 'module-1',
            parentLessonId: 'lesson-1',
            type: 'exercise',
            title: 'Exercise 1',
            description: '',
            objective: '',
            estimatedDurationMinutes: null,
            order: 0,
            prerequisiteLessonIds: [],
            blocks: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
      selection: null,
    }),
    saveContent: () => {},
    commands: {
      createModule: vi.fn(),
      createLesson: vi.fn(),
      createExercise: vi.fn(),
      createCheckpoint: vi.fn(),
      setLessonPrerequisite: vi.fn(),
      ...overrides,
    },
    selection: {
      setSelection: vi.fn(),
    },
  };
}

describe('LearningCanvasInteractionAdapter', () => {
  it('returns build creation action for module creation', () => {
    const adapter = new LearningCanvasInteractionAdapter(createHostApi());

    const groups = adapter.getCreationActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      sceneX: 100,
      sceneY: 120,
      selectedElements: [],
    });

    expect(groups).toEqual([
      {
        id: 'learning-creation',
        title: 'Course',
        actions: [
          {
            id: 'learning.create.module',
            label: 'Add module',
            icon: 'plus',
            tone: 'primary',
          },
        ],
      },
    ]);
  });

  it('returns module and lesson actions from current bridge nodes', () => {
    const adapter = new LearningCanvasInteractionAdapter(createHostApi());
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
    const childNode = new LearningExerciseNode({
      id: 'exercise-1',
      title: 'Exercise 1',
      moduleId: 'module-1',
      parentLessonId: 'lesson-1',
    });

    const moduleGroups = adapter.getContextMenuActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      sceneX: 0,
      sceneY: 0,
      target: moduleNode,
      selectedElements: [],
    });
    const lessonGroups = adapter.getSelectionActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      selectedElements: [lessonNode],
    });
    const childGroups = adapter.getSelectionActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      selectedElements: [childNode],
    });

    expect(moduleGroups?.[0]?.actions.map((action) => action.id)).toEqual([
      'learning.module.add-lesson',
    ]);
    expect(lessonGroups?.[0]?.actions.map((action) => action.id)).toEqual([
      'learning.lesson.add-exercise',
      'learning.lesson.add-checkpoint',
    ]);
    expect(childGroups).toEqual([]);
  });

  it('adds prerequisite actions to the lesson context menu', () => {
    const adapter = new LearningCanvasInteractionAdapter(createHostApi());
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      title: 'Lesson 1',
      moduleId: 'module-1',
      parentLessonId: null,
    });

    const groups = adapter.getContextMenuActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      sceneX: 0,
      sceneY: 0,
      target: lessonNode,
      selectedElements: [lessonNode],
    });

    expect(groups?.map((group) => group.title)).toContain('Prerequisites');
    expect(
      groups
        ?.find((group) => group.title === 'Prerequisites')
        ?.actions.map((action) => ({
          label: action.label,
          icon: action.icon,
        }))
    ).toEqual([
      {
        label: 'Untitled lesson',
        icon: 'link',
      },
    ]);
  });

  it('executes host commands for creation actions', () => {
    const commands = {
      createModule: vi.fn(),
      createLesson: vi.fn(),
      createExercise: vi.fn(),
      createCheckpoint: vi.fn(),
      setLessonPrerequisite: vi.fn(),
    };
    const adapter = new LearningCanvasInteractionAdapter(createHostApi(commands));
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

    adapter.executeAction({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      actionId: 'learning.create.module',
      target: null,
      selectedElements: [],
      sceneX: 140,
      sceneY: 220,
    });
    adapter.executeAction({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      actionId: 'learning.module.add-lesson',
      target: moduleNode,
      selectedElements: [moduleNode],
    });
    adapter.executeAction({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      actionId: 'learning.lesson.add-exercise',
      target: lessonNode,
      selectedElements: [lessonNode],
    });
    adapter.executeAction({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      actionId: 'learning.lesson.add-checkpoint',
      target: lessonNode,
      selectedElements: [lessonNode],
    });

    expect(commands.createModule).toHaveBeenCalledWith({
      sceneX: 140,
      sceneY: 220,
    });
    expect(commands.createLesson).toHaveBeenCalledWith('module-1');
    expect(commands.createExercise).toHaveBeenCalledWith('lesson-1');
    expect(commands.createCheckpoint).toHaveBeenCalledWith('lesson-1');
  });

  it('executes prerequisite actions for lessons', () => {
    const commands = {
      createModule: vi.fn(),
      createLesson: vi.fn(),
      createExercise: vi.fn(),
      createCheckpoint: vi.fn(),
      setLessonPrerequisite: vi.fn(),
    };
    const adapter = new LearningCanvasInteractionAdapter(createHostApi(commands));
    const lessonNode = new LearningLessonNode({
      id: 'lesson-1',
      title: 'Lesson 1',
      moduleId: 'module-1',
      parentLessonId: null,
    });

    const groups = adapter.getContextMenuActions?.({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      sceneX: 0,
      sceneY: 0,
      target: lessonNode,
      selectedElements: [lessonNode],
    });
    const actionId = groups
      ?.find((group) => group.title === 'Prerequisites')
      ?.actions[0]?.id;

    expect(actionId).toBeTruthy();

    adapter.executeAction({
      scene: {} as never,
      canvasManager: {} as never,
      runtime: {} as never,
      actionId: actionId!,
      target: lessonNode,
      selectedElements: [lessonNode],
    });

    expect(commands.setLessonPrerequisite).toHaveBeenCalledWith(
      'lesson-1',
      'lesson-2',
      true
    );
  });

  it('does not expose prerequisite actions for a prerequisite connection yet', () => {
    const adapter = new LearningCanvasInteractionAdapter(createHostApi());
    const connection = new Connection(
      'lesson-2',
      'lesson-1',
      'learning-prerequisite:lesson-2:lesson-1',
      ConnectionLineType.SShaped,
      ConnectionRelationType.Blocks
    );

    expect(
      adapter.getContextMenuActions?.({
        scene: {} as never,
        canvasManager: {} as never,
        runtime: {} as never,
        sceneX: 0,
        sceneY: 0,
        target: connection,
        selectedElements: [],
      })
    ).toEqual([]);
  });

  it('is read-only in preview mode', () => {
    const adapter = new LearningCanvasInteractionAdapter(createHostApi({}, 'preview'));
    const moduleNode = new LearningModuleNode({
      id: 'module-1',
      title: 'Module 1',
    });

    expect(
      adapter.getCreationActions?.({
        scene: {} as never,
        canvasManager: {} as never,
        runtime: {} as never,
        sceneX: 0,
        sceneY: 0,
        selectedElements: [],
      })
    ).toEqual([]);
    expect(
      adapter.getContextMenuActions?.({
        scene: {} as never,
        canvasManager: {} as never,
        runtime: {} as never,
        sceneX: 0,
        sceneY: 0,
        target: moduleNode,
        selectedElements: [moduleNode],
      })
    ).toEqual([]);
  });
});
