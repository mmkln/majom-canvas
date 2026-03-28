import { describe, expect, it } from 'vitest';
import type {
  CanvasAlignmentAdapter,
  CanvasAlignmentContext,
} from '../../adapters/CanvasAlignmentAdapter.ts';
import { createAlignmentSubject } from '../../adapters/CanvasAlignmentAdapterUtils.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { Scene } from '../scene/Scene.ts';
import { CanvasAlignmentSubjectProvider } from './CanvasAlignmentSubjectProvider.ts';

class StubAlignmentAdapter implements CanvasAlignmentAdapter {
  public lastContext: CanvasAlignmentContext | null = null;
  public referenceSubjectsCallCount: number = 0;

  public getMovingSubject(
    context: CanvasAlignmentContext
  ): ReturnType<CanvasAlignmentAdapter['getMovingSubject']> {
    this.lastContext = context;
    return createAlignmentSubject({
      id: '__moving__',
      bounds: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        left: 10,
        right: 110,
        top: 20,
        bottom: 70,
        centerX: 60,
        centerY: 45,
      },
      scopeKind: 'local',
      scopeId: null,
    });
  }

  public getReferenceSubjects(
    context: CanvasAlignmentContext
  ): ReturnType<CanvasAlignmentAdapter['getReferenceSubjects']> {
    this.lastContext = context;
    this.referenceSubjectsCallCount += 1;
    return [
      createAlignmentSubject({
        id: 'task-1',
        bounds: {
          x: 240,
          y: 120,
          width: 100,
          height: 50,
          left: 240,
          right: 340,
          top: 120,
          bottom: 170,
          centerX: 290,
          centerY: 145,
        },
      }),
    ];
  }

  public getVirtualSubjects(
    context: CanvasAlignmentContext
  ): ReturnType<NonNullable<CanvasAlignmentAdapter['getVirtualSubjects']>> {
    this.lastContext = context;
    return [
      createAlignmentSubject({
        id: 'viewport-center',
        bounds: {
          x: 500,
          y: 250,
          width: 0,
          height: 0,
          left: 500,
          right: 500,
          top: 250,
          bottom: 250,
          centerX: 500,
          centerY: 250,
        },
        role: 'virtual',
        scopeKind: 'viewport',
        scopeId: null,
      }),
    ];
  }
}

describe('CanvasAlignmentSubjectProvider', () => {
  it('builds scene-space viewport context and returns ranked normalized subjects', () => {
    const canvas = {
      width: 1200,
      height: 800,
    } as HTMLCanvasElement;
    const scene = new Scene();
    const panZoom = new PanZoomManager(canvas);
    panZoom.scale = 2;
    panZoom.setScroll(400, 200);
    const movingTask = new TaskElement({ id: 'moving', x: 100, y: 100 });
    scene.addElement(movingTask);
    const adapter = new StubAlignmentAdapter();
    const provider = new CanvasAlignmentSubjectProvider(
      canvas,
      scene,
      panZoom,
      adapter
    );

    const result = provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: false,
      viewportBuffer: 50,
    });

    expect(adapter.lastContext?.viewport).toMatchObject({
      left: 150,
      top: 50,
      right: 850,
      bottom: 550,
      centerX: 500,
      centerY: 300,
    });
    expect(adapter.lastContext?.preferences.snapEnabled).toBe(false);
    expect(adapter.lastContext?.movingElements).toEqual([movingTask]);
    expect(result.movingSubject?.bounds).toMatchObject({
      left: 10,
      right: 110,
      top: 20,
      bottom: 70,
    });
    expect(result.subjects.map((subject) => subject.id)).toEqual([
      'task-1',
      'viewport-center',
    ]);
  });

  it('reuses cached reference subjects while moving ids and scene version stay stable', () => {
    const canvas = {
      width: 1200,
      height: 800,
    } as HTMLCanvasElement;
    const scene = new Scene();
    const panZoom = new PanZoomManager(canvas);
    const movingTask = new TaskElement({ id: 'moving', x: 100, y: 100 });
    scene.addElement(movingTask);
    const adapter = new StubAlignmentAdapter();
    const provider = new CanvasAlignmentSubjectProvider(
      canvas,
      scene,
      panZoom,
      adapter
    );

    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });

    expect(adapter.referenceSubjectsCallCount).toBe(1);

    const otherTask = new TaskElement({ id: 'other', x: 300, y: 100 });
    scene.addElement(otherTask);
    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    expect(adapter.referenceSubjectsCallCount).toBe(2);

    provider.resolveSubjects({
      movingElements: [otherTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    expect(adapter.referenceSubjectsCallCount).toBe(3);
  });
});
