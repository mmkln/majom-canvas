import { describe, expect, it } from 'vitest';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { Scene } from '../scene/Scene.ts';
import { CanvasAlignmentSubjectProvider } from './CanvasAlignmentSubjectProvider.ts';

describe('CanvasAlignmentSubjectProvider', () => {
  it('builds scene-space viewport data and returns ranked visible subjects', () => {
    const canvas = {
      width: 1200,
      height: 800,
    } as HTMLCanvasElement;
    const scene = new Scene();
    const panZoom = new PanZoomManager(canvas);
    panZoom.scale = 2;
    panZoom.setScroll(400, 200);
    const movingTask = new TaskElement({ id: 'moving', x: 100, y: 100 });
    const candidate = new TaskElement({ id: 'candidate', x: 240, y: 120 });
    const hidden = new TaskElement({ id: 'hidden', x: 2000, y: 120 });
    scene.addElement(movingTask);
    scene.addElement(candidate);
    scene.addElement(hidden);
    const provider = new CanvasAlignmentSubjectProvider(canvas, scene, panZoom);

    const result = provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: false,
      viewportBuffer: 50,
      preferences: { showViewportCenterGuides: true },
    });

    expect(result.viewport).toMatchObject({
      left: 150,
      top: 50,
      right: 850,
      bottom: 550,
      centerX: 500,
      centerY: 300,
    });
    expect(result.movingSubject?.id).toBe('moving');
    expect(result.subjects.map((subject) => subject.id)).toEqual([
      'candidate',
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
    const candidate = new TaskElement({ id: 'candidate', x: 260, y: 120 });
    scene.addElement(movingTask);
    scene.addElement(candidate);
    const provider = new CanvasAlignmentSubjectProvider(canvas, scene, panZoom);

    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    const firstIndex = (provider as any).cachedReferenceIndex;

    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    const secondIndex = (provider as any).cachedReferenceIndex;

    expect(secondIndex).toBe(firstIndex);

    const otherTask = new TaskElement({ id: 'other', x: 320, y: 120 });
    scene.addElement(otherTask);
    provider.resolveSubjects({
      movingElements: [movingTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    const thirdIndex = (provider as any).cachedReferenceIndex;
    expect(thirdIndex).not.toBe(firstIndex);

    provider.resolveSubjects({
      movingElements: [otherTask],
      allowSnap: true,
      viewportBuffer: 50,
    });
    const fourthIndex = (provider as any).cachedReferenceIndex;
    expect(fourthIndex).not.toBe(thirdIndex);
  });
});
