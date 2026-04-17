import { describe, expect, it } from 'vitest';
import { CanvasDataService } from './CanvasDataService.ts';
import { StoryElement } from '../../features/canvas/elements/StoryElement.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';

describe('CanvasDataService layout persistence filtering', () => {
  it('includes changed story layout when no dirty keys are tracked', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 320,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        meta: expect.objectContaining({
          height: 320,
        }),
      }),
    ]);
  });

  it('includes changed story layout when the same story key is tracked as dirty', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const story = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([story]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 320,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        meta: expect.objectContaining({
          height: 320,
        }),
      }),
    ]);
  });

  it('clears a tracked dirty key when the tracked entry is unchanged', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const story = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([story]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([]);
    expect((service as any).positionDirtyKeys.size).toBe(0);
  });

  it('does not drop changed story layout when another dirty key is already tracked', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedTask = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      x: 40,
      y: 60,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedTask]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 320,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        meta: expect.objectContaining({
          height: 320,
        }),
      }),
    ]);
  });

  it('does not drop changed task coordinates when an unrelated story key is tracked', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedStory = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedStory]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
      }),
    ]);
  });

  it('keeps both same-key and unrelated existing changes in one mixed batch', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const trackedStory = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([trackedStory]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 320,
          focused: false,
          highlighted: false,
        },
      },
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        meta: expect.objectContaining({
          height: 320,
        }),
      }),
      expect.objectContaining({
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
      }),
    ]);
  });

  it('still includes a new layout entry when unrelated dirty keys are tracked', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedTask = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      x: 40,
      y: 60,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedTask]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-new',
        x: 200,
        y: 240,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-new',
      }),
    ]);
  });

  it('returns a mixed batch where both new and existing changes survive', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedTask = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      x: 40,
      y: 60,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedTask]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 320,
          focused: false,
          highlighted: false,
        },
      },
      {
        element_type: 'story',
        element_uuid: 'story-uuid-new',
        x: 200,
        y: 240,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        meta: expect.objectContaining({
          height: 320,
        }),
      }),
      expect.objectContaining({
        element_type: 'story',
        element_uuid: 'story-uuid-new',
      }),
    ]);
  });

  it('keeps an unrelated existing change even when the tracked entry in the same batch is unchanged', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const trackedStory = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([trackedStory]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
      }),
    ]);
    expect((service as any).positionDirtyKeys.size).toBe(0);
  });

  it('keeps multiple unrelated existing changes when the dirty set tracks a different element', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedStory = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-2',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-2',
        x: 80,
        y: 90,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedStory]);

    const changed = service.filterPositionUpdates([
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
      {
        element_type: 'task',
        element_uuid: 'task-uuid-2',
        x: 280,
        y: 320,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(changed).toEqual([
      expect.objectContaining({
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
      }),
      expect.objectContaining({
        element_type: 'task',
        element_uuid: 'task-uuid-2',
        x: 280,
        y: 320,
      }),
    ]);
  });

  it('does not consume the unrelated dirty key when a different existing change is filtered', () => {
    const service = new CanvasDataService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const unrelatedStory = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });

    (service as any).updatePositionRegistry([
      {
        id: 'pos-story-1',
        canvas: 'canvas-1',
        element_type: 'story',
        element_uuid: 'story-uuid-1',
        x: 100,
        y: 120,
        meta: {
          width: 760,
          height: 220,
          focused: false,
          highlighted: false,
        },
      },
      {
        id: 'pos-task-1',
        canvas: 'canvas-1',
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 40,
        y: 60,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    service.markPositionsDirty([unrelatedStory]);

    service.filterPositionUpdates([
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
        x: 180,
        y: 220,
        meta: {
          focused: false,
          highlighted: false,
        },
      },
    ]);

    expect(Array.from((service as any).positionDirtyKeys)).toEqual([
      'story:uuid:story-uuid-1',
    ]);
  });
});
