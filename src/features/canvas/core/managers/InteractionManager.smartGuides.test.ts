import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import { InteractionManager } from './InteractionManager.ts';
import { Scene } from '../scene/Scene.ts';

type Harness = {
  scene: Scene;
  manager: InteractionManager;
  movingTask: TaskElement;
  canvas: HTMLCanvasElement;
  panZoom: PanZoomManager;
};

function createHarness(): Harness {
  const canvas = {
    width: 1200,
    height: 800,
    style: { cursor: 'default' },
  } as unknown as HTMLCanvasElement;
  const scene = new Scene();
  const panZoom = new PanZoomManager(canvas);
  panZoom.scale = 1;
  const manager = new InteractionManager(canvas, scene, panZoom);
  const movingTask = new TaskElement({ id: 'moving', x: 100, y: 100 });
  scene.addElement(movingTask);
  return { scene, manager, movingTask, canvas, panZoom };
}

function beginDrag(manager: InteractionManager, task: TaskElement): void {
  manager.handleMouseDown(
    { button: 0, shiftKey: false } as MouseEvent,
    task.x + 10,
    task.y + 10
  );
}

describe('InteractionManager smart guides integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('snaps dragged element when smart guides are enabled', () => {
    const { scene, manager, movingTask } = createHarness();
    const candidate = new TaskElement({ id: 'candidate', x: 500, y: 100 });
    scene.addElement(candidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(505, 110);

    expect(movingTask.x).toBe(500);
    expect(manager.getSmartGuideLines().length).toBeGreaterThan(0);
  });

  it('shows guides but disables snap while Alt is pressed', () => {
    const { scene, manager, movingTask } = createHarness();
    const candidate = new TaskElement({ id: 'candidate', x: 500, y: 100 });
    scene.addElement(candidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(505, 110, { disableSmartSnap: true });

    expect(movingTask.x).toBe(495);
    expect(manager.getSmartGuideLines().length).toBeGreaterThan(0);
  });

  it('disables both guides and snap when smart guides are turned off', () => {
    const { scene, manager, movingTask } = createHarness();
    const candidate = new TaskElement({ id: 'candidate', x: 500, y: 100 });
    scene.addElement(candidate);
    manager.setSmartGuidesEnabled(false);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(505, 110);

    expect(movingTask.x).toBe(495);
    expect(manager.getSmartGuideLines()).toHaveLength(0);
  });

  it('suppresses smart guide snap when task drop preview is active', () => {
    const { scene, manager, movingTask } = createHarness();
    const story = new StoryElement({
      id: 'story',
      x: 450,
      y: 50,
      width: 344,
      height: 240,
    });
    const alignmentCandidate = new TaskElement({
      id: 'candidate',
      x: 462,
      y: 100,
    });
    scene.addElement(story);
    scene.addElement(alignmentCandidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(466, 110);

    expect(manager.getTaskDropPlaceholders().length).toBeGreaterThan(0);
    expect(manager.getSmartGuideLines()).toHaveLength(0);
    expect(movingTask.x).toBe(456);
  });

  it('keeps smart guide coordinates in scene space with zoom and scroll', () => {
    const { scene, manager, movingTask, panZoom } = createHarness();
    panZoom.scale = 2;
    panZoom.setScroll(400, 200);
    const candidate = new TaskElement({ id: 'candidate', x: 378, y: 100 });
    scene.addElement(candidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(386, 110);

    const vertical = manager
      .getSmartGuideLines()
      .find((guide) => guide.orientation === 'vertical');
    expect(vertical).toBeDefined();
    expect(vertical?.position).toBe(378);
    expect(vertical?.start).toBe(100);
    expect(vertical?.end).toBe(212);
    expect(movingTask.x).toBe(378);
  });
});
