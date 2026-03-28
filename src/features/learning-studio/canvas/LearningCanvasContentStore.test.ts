import { describe, expect, it, vi } from 'vitest';
import Connection from '../../canvas-core/core/shapes/Connection.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
} from '../../canvas-core/core/interfaces/connection.ts';
import type { LearningCourseContent } from '../domain/types.ts';
import type {
  LearningCanvasDocument,
  LearningCanvasHostApi,
} from './LearningCanvasHostApi.ts';
import { LearningCanvasContentStore } from './LearningCanvasContentStore.ts';
import { buildLearningCanvasScene } from './learningCanvasMapping.ts';
import { isLearningModuleNode } from './learningCanvasNodes.ts';

function createContent(): LearningCourseContent {
  return {
    title: 'Course',
    description: 'Description',
    audience: 'Audience',
    outcomes: [],
    estimatedDurationMinutes: null,
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        description: 'First module',
        order: 0,
        lessonIds: ['lesson-1', 'lesson-2'],
      },
    ],
    units: [
      {
        id: 'lesson-1',
        moduleId: 'module-1',
        parentLessonId: null,
        order: 0,
        type: 'lesson',
        title: 'Lesson 1',
        description: 'Intro lesson',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'exercise-1',
        moduleId: 'module-1',
        parentLessonId: 'lesson-1',
        order: 0,
        type: 'exercise',
        title: 'Exercise 1',
        description: 'Practice',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: [],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
      {
        id: 'lesson-2',
        moduleId: 'module-1',
        parentLessonId: null,
        order: 1,
        type: 'lesson',
        title: 'Lesson 2',
        description: 'Second lesson',
        objective: '',
        estimatedDurationMinutes: null,
        prerequisiteLessonIds: ['lesson-1'],
        blocks: [],
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:00:00.000Z',
      },
    ],
    moduleLayouts: [
      {
        moduleId: 'module-1',
        x: 120,
        y: 160,
        collapsed: false,
      },
    ],
  };
}

function createHostApi(
  content: LearningCourseContent = createContent(),
  mode: LearningCanvasDocument['mode'] = 'build'
): {
  hostApi: LearningCanvasHostApi;
  saveContent: ReturnType<typeof vi.fn>;
  getContent: () => LearningCourseContent;
} {
  let document: LearningCanvasDocument = {
    canvasId: 'canvas-1',
    courseId: 'course-1',
    draftId: 'draft-1',
    mode,
    title: content.title,
    content,
    selection: null,
  };
  const saveContent = vi.fn((nextContent: LearningCourseContent) => {
    document = {
      ...document,
      title: nextContent.title,
      content: nextContent,
    };
  });
  return {
    hostApi: {
      getDocument: () => document,
      saveContent,
      commands: {
        createModule: vi.fn(),
        createLesson: vi.fn(),
        createExercise: vi.fn(),
        createCheckpoint: vi.fn(),
        setLessonPrerequisite: vi.fn(),
      },
      selection: {
        setSelection: vi.fn(),
      },
    },
    saveContent,
    getContent: () => document.content,
  };
}

describe('LearningCanvasContentStore', () => {
  it('patches module and unit text fields through host content', () => {
    const { hostApi, getContent } = createHostApi();
    const store = new LearningCanvasContentStore(hostApi);
    const snapshot = buildLearningCanvasScene(getContent());
    const moduleNode = snapshot.elements.find((element) => element.id === 'module-1');
    const lessonNode = snapshot.elements.find((element) => element.id === 'lesson-1');

    if (!moduleNode || !lessonNode) {
      throw new Error('Expected module and lesson nodes.');
    }

    store.patchElement(moduleNode, {
      title: 'Updated module',
      description: 'Updated module description',
    });
    store.patchElement(lessonNode, {
      title: 'Updated lesson',
      description: 'Updated lesson description',
    });

    expect(getContent().modules[0]).toMatchObject({
      title: 'Updated module',
      description: 'Updated module description',
    });
    expect(getContent().units.find((unit) => unit.id === 'lesson-1')).toMatchObject({
      title: 'Updated lesson',
      description: 'Updated lesson description',
    });
  });

  it('deletes a lesson subtree and clears prerequisite references', () => {
    const { hostApi, getContent } = createHostApi();
    const store = new LearningCanvasContentStore(hostApi);
    const snapshot = buildLearningCanvasScene(getContent());
    const lessonNode = snapshot.elements.find((element) => element.id === 'lesson-1');

    if (!lessonNode) {
      throw new Error('Expected lesson node.');
    }

    store.deleteElement(lessonNode);

    expect(getContent().modules[0]?.lessonIds).toEqual(['lesson-2']);
    expect(getContent().units.map((unit) => unit.id)).toEqual(['lesson-2']);
    expect(
      getContent().units.find((unit) => unit.id === 'lesson-2')?.prerequisiteLessonIds
    ).toEqual([]);
  });

  it('saves structure and prerequisites from canvas elements', () => {
    const { hostApi, getContent } = createHostApi();
    const store = new LearningCanvasContentStore(hostApi);
    const snapshot = buildLearningCanvasScene(getContent());
    const moduleNode = snapshot.elements.find((element) => element.id === 'module-1');
    const lesson1 = snapshot.elements.find((element) => element.id === 'lesson-1');
    const lesson2 = snapshot.elements.find((element) => element.id === 'lesson-2');
    const exercise = snapshot.elements.find((element) => element.id === 'exercise-1');

    if (
      !moduleNode ||
      !isLearningModuleNode(moduleNode) ||
      !lesson1 ||
      !lesson2 ||
      !exercise
    ) {
      throw new Error('Expected module and unit nodes.');
    }

    moduleNode.x = 480;
    moduleNode.y = 320;
    moduleNode.replaceOrderedLayoutChildren([
      lesson2 as any,
      lesson1 as any,
      exercise as any,
    ]);

    store.saveStructure(snapshot.elements, [
      new Connection(
        'lesson-2',
        'lesson-1',
        'learning-prerequisite:lesson-2:lesson-1',
        ConnectionLineType.SShaped,
        ConnectionRelationType.Blocks
      ),
    ]);

    expect(getContent().modules[0]?.lessonIds).toEqual(['lesson-2', 'lesson-1']);
    expect(getContent().moduleLayouts.find((layout) => layout.moduleId === 'module-1'))
      .toMatchObject({
        x: 480,
        y: 320,
      });
    expect(
      getContent().units.find((unit) => unit.id === 'lesson-1')?.prerequisiteLessonIds
    ).toEqual(['lesson-2']);
  });

  it('ignores mutations in preview mode', () => {
    const { hostApi, saveContent, getContent } = createHostApi(createContent(), 'preview');
    const store = new LearningCanvasContentStore(hostApi);
    const snapshot = buildLearningCanvasScene(getContent());
    const moduleNode = snapshot.elements.find((element) => element.id === 'module-1');

    if (!moduleNode) {
      throw new Error('Expected module node.');
    }

    store.patchElement(moduleNode, { title: 'Preview title' });
    store.saveCanvasTitle('Preview course');

    expect(saveContent).not.toHaveBeenCalled();
    expect(getContent().title).toBe('Course');
  });
});
