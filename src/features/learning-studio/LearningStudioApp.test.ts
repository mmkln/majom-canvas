// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../app-runtime/index.ts';
import {
  LEARNING_STUDIO_STATE_STORAGE_KEY,
  LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
  LocalStorageLearningStudioRepository,
} from './data/LocalStorageLearningStudioRepository.ts';
import { LearningStudioApp } from './LearningStudioApp.ts';

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

describe('LearningStudioApp', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the Home screen and persists the normalized v2 skeleton', () => {
    const storage = createStorageMock();
    storage.setItem(
      'learning-studio-state-v1',
      JSON.stringify({
        version: 1,
        courses: [],
        modules: [],
        lessons: [],
        enrollments: [],
        accessGrants: [],
        learnerProgress: [],
        learningSessions: [],
        updatedAt: '2026-03-27T10:00:00.000Z',
      })
    );
    storage.setItem(
      'learning-studio-ui-state-v1',
      JSON.stringify({
        version: 1,
        route: 'authoring',
        selectedCourseId: null,
        selectedLearnerRef: 'local-learner',
        updatedAt: '2026-03-27T10:00:00.000Z',
      })
    );

    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);

    expect(parent.querySelector('[data-module="learning-studio"]')).not.toBeNull();
    expect(
      parent.querySelector('[data-role="learning-studio-home"]')
    ).not.toBeNull();
    expect(app.getStateSnapshot().version).toBe(2);
    expect(app.getUiStateSnapshot()).toEqual(
      expect.objectContaining({
        version: 2,
        route: 'home',
        mode: 'author',
      })
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      LEARNING_STUDIO_STATE_STORAGE_KEY,
      expect.any(String)
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      expect.any(String)
    );

    app.unmount();
    expect(parent.querySelector('[data-module="learning-studio"]')).toBeNull();
  });

  it('creates a course and opens the overview flow', () => {
    const repository = new LocalStorageLearningStudioRepository(
      createStorageMock() as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);

    (
      parent.querySelector(
        '[data-role="learning-studio-home-create-manual"]'
      ) as HTMLButtonElement
    ).click();

    expect(app.getStateSnapshot().courses).toHaveLength(1);
    expect(app.getStateSnapshot().drafts).toHaveLength(1);
    expect(app.getUiStateSnapshot().route).toBe('overview');
    expect(parent.querySelector('[data-role="learning-studio-overview"]')).not.toBeNull();
  });

  it('opens Build as a structured workspace and creates the first module', () => {
    const repository = new LocalStorageLearningStudioRepository(
      createStorageMock() as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);
    (
      parent.querySelector(
        '[data-role="learning-studio-home-create-manual"]'
      ) as HTMLButtonElement
    ).click();
    (
      parent.querySelector(
        '[data-role="learning-studio-shell-open-build"]'
      ) as HTMLButtonElement
    ).click();

    expect(parent.querySelector('[data-role="learning-studio-build-rail"]')).not.toBeNull();
    expect(
      parent.querySelector('[data-role="learning-studio-build-canvas-host"]')
    ).toBeNull();

    (
      parent.querySelector(
        '[data-role="learning-studio-build-empty-add-module"]'
      ) as HTMLButtonElement
    ).click();

    const content = app.getStateSnapshot().drafts[0]?.content;
    expect(content?.modules).toHaveLength(1);
    expect(
      parent.querySelector('[data-role="learning-studio-build-empty"]')
    ).toBeNull();
  });

  it('opens Preview as a read-only validation surface', () => {
    const repository = new LocalStorageLearningStudioRepository(
      createStorageMock() as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);
    (
      parent.querySelector(
        '[data-role="learning-studio-home-create-manual"]'
      ) as HTMLButtonElement
    ).click();
    (
      parent.querySelector(
        '[data-role="learning-studio-shell-open-preview"]'
      ) as HTMLButtonElement
    ).click();

    expect(
      parent.querySelector('[data-role="learning-studio-preview"]')
    ).not.toBeNull();
    expect(
      parent.querySelector('[data-role="learning-studio-preview-canvas-host"]')
    ).toBeNull();
  });

  it('keeps the selected build lesson focused when opening Preview', () => {
    const repository = new LocalStorageLearningStudioRepository(
      createStorageMock() as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);
    (
      parent.querySelector(
        '[data-role="learning-studio-home-create-manual"]'
      ) as HTMLButtonElement
    ).click();

    const internalApp = app as unknown as {
      addModule: () => void;
      addLesson: (moduleId: string) => void;
      selectUnit: (unitId: string) => void;
    };

    internalApp.addModule();
    const moduleId = app.getStateSnapshot().drafts[0]?.content.modules[0]?.id;
    expect(moduleId).toBeTruthy();

    internalApp.addLesson(moduleId!);
    const lessonId = app
      .getStateSnapshot()
      .drafts[0]?.content.units.find(
        (unit) => unit.type === 'lesson' && unit.parentLessonId === null
      )?.id;
    expect(lessonId).toBeTruthy();

    internalApp.selectUnit(lessonId!);
    (
      parent.querySelector(
        '[data-role="learning-studio-shell-open-preview"]'
      ) as HTMLButtonElement
    ).click();

    expect(
      parent.querySelector('[data-role="learning-studio-preview-lesson-view"]')
    ).not.toBeNull();
    expect(parent.textContent).toContain('Lesson 1');
  });

  it('edits structured lesson blocks through direct app mutations', () => {
    const repository = new LocalStorageLearningStudioRepository(
      createStorageMock() as unknown as Storage
    );
    const app = new LearningStudioApp({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      repository,
    });
    const parent = document.createElement('div');

    app.mount(parent);
    (
      parent.querySelector(
        '[data-role="learning-studio-home-create-manual"]'
      ) as HTMLButtonElement
    ).click();

    const internalApp = app as unknown as {
      addModule: () => void;
      addLesson: (moduleId: string) => void;
      addChildUnit: (
        lessonId: string,
        type: 'exercise' | 'checkpoint'
      ) => void;
      addLessonBlock: (
        unitId: string,
        type:
          | 'intro'
          | 'concept'
          | 'example'
          | 'instruction'
          | 'summary'
          | 'exercise_ref'
          | 'checkpoint_ref'
      ) => void;
      updateLessonBlockText: (
        unitId: string,
        blockId: string,
        text: string
      ) => void;
      moveLessonBlock: (
        unitId: string,
        blockId: string,
        direction: -1 | 1
      ) => void;
      removeLessonBlock: (unitId: string, blockId: string) => void;
      setLessonPrerequisite: (
        lessonId: string,
        prerequisiteLessonId: string,
        enabled: boolean
      ) => void;
    };

    internalApp.addModule();
    const moduleId = app.getStateSnapshot().drafts[0]?.content.modules[0]?.id;
    expect(moduleId).toBeTruthy();

    internalApp.addLesson(moduleId!);
    internalApp.addLesson(moduleId!);
    const lessons =
      app
        .getStateSnapshot()
        .drafts[0]?.content.units.filter(
          (unit) => unit.type === 'lesson' && unit.parentLessonId === null
        ) ?? [];
    expect(lessons).toHaveLength(2);

    const lessonId = lessons[0]?.id;
    expect(lessonId).toBeTruthy();

    internalApp.addChildUnit(lessonId!, 'exercise');
    internalApp.addChildUnit(lessonId!, 'checkpoint');
    internalApp.addLessonBlock(lessonId!, 'concept');
    internalApp.addLessonBlock(lessonId!, 'exercise_ref');

    let blocks =
      app
        .getStateSnapshot()
        .drafts[0]?.content.units.find((unit) => unit.id === lessonId)?.blocks ?? [];
    expect(blocks.map((block) => block.type)).toEqual([
      'concept',
      'exercise_ref',
    ]);

    const conceptId = blocks[0]?.id;
    const exerciseRefId = blocks[1]?.id;
    expect(conceptId).toBeTruthy();
    expect(exerciseRefId).toBeTruthy();

    internalApp.updateLessonBlockText(lessonId!, conceptId!, 'Core concept');
    internalApp.moveLessonBlock(lessonId!, exerciseRefId!, -1);
    internalApp.removeLessonBlock(lessonId!, conceptId!);
    internalApp.setLessonPrerequisite(lessons[1]!.id, lessons[0]!.id, true);

    blocks =
      app
        .getStateSnapshot()
        .drafts[0]?.content.units.find((unit) => unit.id === lessonId)?.blocks ?? [];
    const secondLesson = app
      .getStateSnapshot()
      .drafts[0]?.content.units.find((unit) => unit.id === lessons[1]!.id);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      order: 0,
      type: 'exercise_ref',
    });
    expect(secondLesson?.prerequisiteLessonIds).toEqual([lessons[0]!.id]);
  });
});
