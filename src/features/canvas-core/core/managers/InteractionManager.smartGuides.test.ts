import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER } from '../../adapters/CanvasRuntimeSemanticsAdapter.ts';
import { PlanningCanvasAlignmentAdapter } from '../../adapters/planning/PlanningCanvasAlignmentAdapter.ts';
import type { AlignmentLineVisual } from '../alignment/types.ts';
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

type StoryHarness = {
  scene: Scene;
  manager: InteractionManager;
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
  const manager = new InteractionManager(
    canvas,
    scene,
    panZoom,
    DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER
  );
  const movingTask = new TaskElement({ id: 'moving', x: 100, y: 100 });
  scene.addElement(movingTask);
  return { scene, manager, movingTask, canvas, panZoom };
}

function createPlanningHarness(): Harness {
  const canvas = {
    width: 1200,
    height: 800,
    style: { cursor: 'default' },
  } as unknown as HTMLCanvasElement;
  const scene = new Scene();
  const panZoom = new PanZoomManager(canvas);
  panZoom.scale = 1;
  const manager = new InteractionManager(
    canvas,
    scene,
    panZoom,
    DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER,
    new PlanningCanvasAlignmentAdapter()
  );
  const movingTask = new TaskElement({ id: 'moving', x: 470, y: 100 });
  scene.addElement(movingTask);
  return { scene, manager, movingTask, canvas, panZoom };
}

function createStoryHarness(): StoryHarness {
  const canvas = {
    width: 1200,
    height: 800,
    style: { cursor: 'default' },
  } as unknown as HTMLCanvasElement;
  const scene = new Scene();
  const panZoom = new PanZoomManager(canvas);
  panZoom.scale = 1;
  const manager = new InteractionManager(
    canvas,
    scene,
    panZoom,
    DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER
  );
  return { scene, manager, canvas, panZoom };
}

function beginDrag(manager: InteractionManager, task: TaskElement): void {
  manager.handleMouseDown(
    { button: 0, shiftKey: false } as MouseEvent,
    task.x + 10,
    task.y + 10
  );
}

function beginResize(
  manager: InteractionManager,
  story: StoryElement,
  panZoom: PanZoomManager
): void {
  const handle = story.getResizeHandles(panZoom)[0]!;
  manager.handleMouseDown(
    { button: 0, shiftKey: false } as MouseEvent,
    handle.x,
    handle.y
  );
}

function getOverlayLines(
  manager: InteractionManager,
  kind?: AlignmentLineVisual['kind']
): AlignmentLineVisual[] {
  return manager
    .getSmartGuideOverlay()
    .visuals.filter(
      (visual): visual is AlignmentLineVisual =>
        visual.type === 'line' && (kind === undefined || visual.kind === kind)
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
    expect(getOverlayLines(manager).length).toBeGreaterThan(0);
    expect(manager.getSmartGuideOverlay().visuals.length).toBeGreaterThan(0);
  });

  it('shows guides but disables snap while Alt is pressed', () => {
    const { scene, manager, movingTask } = createHarness();
    const candidate = new TaskElement({ id: 'candidate', x: 500, y: 100 });
    scene.addElement(candidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(505, 110, { disableSmartSnap: true });

    expect(movingTask.x).toBe(495);
    expect(getOverlayLines(manager).length).toBeGreaterThan(0);
  });

  it('disables both guides and snap when smart guides are turned off', () => {
    const { scene, manager, movingTask } = createHarness();
    const candidate = new TaskElement({ id: 'candidate', x: 500, y: 100 });
    scene.addElement(candidate);
    manager.setSmartGuidesEnabled(false);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(505, 110);

    expect(movingTask.x).toBe(495);
    expect(getOverlayLines(manager)).toHaveLength(0);
    expect(manager.getSmartGuideOverlay().visuals).toHaveLength(0);
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
    expect(getOverlayLines(manager)).toHaveLength(0);
    expect(movingTask.x).toBe(456);
  });

  it('drops all selected tasks into a story when group drag targets it', () => {
    const { scene, manager, movingTask } = createHarness();
    const siblingTask = new TaskElement({ id: 'sibling', x: 430, y: 100 });
    const story = new StoryElement({
      id: 'story',
      x: 600,
      y: 50,
      width: 344,
      height: 240,
    });
    scene.addElement(siblingTask);
    scene.addElement(story);
    scene.setSelected([movingTask, siblingTask]);

    beginDrag(manager, siblingTask);
    manager.handleMouseMove(620, 110);

    expect(manager.getTaskDropPlaceholders()).toHaveLength(2);
    expect(
      manager
        .getTaskDropPlaceholders()
        .map((placeholder) => placeholder.taskId)
        .sort()
    ).toEqual(['moving', 'sibling']);

    manager.handleMouseUp();

    expect(story.tasks.map((task) => task.id).sort()).toEqual([
      'moving',
      'sibling',
    ]);
  });

  it('keeps smart guide coordinates in scene space with zoom and scroll', () => {
    const { scene, manager, movingTask, panZoom } = createHarness();
    panZoom.scale = 2;
    panZoom.setScroll(400, 200);
    const candidate = new TaskElement({ id: 'candidate', x: 378, y: 100 });
    scene.addElement(candidate);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(386, 110);

    const vertical = getOverlayLines(manager).find((guide) => guide.axis === 'x');
    expect(vertical).toBeDefined();
    expect(vertical?.position).toBe(378);
    expect(vertical?.start).toBe(100);
    expect(vertical?.end).toBe(212);
    expect(movingTask.x).toBe(378);
  });

  it('snaps a dragged task into equal spacing between two neighbors', () => {
    const { scene, manager, movingTask } = createHarness();
    const left = new TaskElement({ id: 'left', x: 150, y: 100 });
    const right = new TaskElement({ id: 'right', x: 900, y: 100 });
    scene.addElement(left);
    scene.addElement(right);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(530, 110);

    expect(movingTask.x).toBe(525);
    const spacingRails = getOverlayLines(manager, 'spacing').filter(
      (guide) => guide.axis === 'y'
    );
    expect(spacingRails).toHaveLength(2);
    expect(
      spacingRails.map((guide) => ({
        position: guide.position,
        start: guide.start,
        end: guide.end,
      }))
    ).toEqual([
      { position: 86, start: 422, end: 525 },
      { position: 86, start: 797, end: 900 },
    ]);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter((visual) => visual.type === 'band')
    ).toHaveLength(0);
  });

  it('flips horizontal spacing rails below the element when there is no room above', () => {
    const { scene, manager, movingTask } = createHarness();
    movingTask.y = 8;
    const left = new TaskElement({ id: 'left', x: 150, y: 8 });
    const right = new TaskElement({ id: 'right', x: 900, y: 8 });
    scene.addElement(left);
    scene.addElement(right);

    beginDrag(manager, movingTask);
    manager.handleMouseMove(530, 18);

    expect(movingTask.x).toBe(525);
    expect(
      getOverlayLines(manager, 'spacing')
        .filter((guide) => guide.axis === 'y')
        .map((guide) => guide.position)
    ).toEqual([134, 134]);
  });

  it('does not use spacing guides when spacing preferences are disabled', () => {
    const { scene, manager, movingTask } = createHarness();
    const left = new TaskElement({ id: 'left', x: 150, y: 100 });
    const right = new TaskElement({ id: 'right', x: 900, y: 100 });
    scene.addElement(left);
    scene.addElement(right);
    manager.setSmartGuidePreferences({ showSpacingGuides: false });

    beginDrag(manager, movingTask);
    manager.handleMouseMove(530, 110);

    expect(movingTask.x).toBe(520);
    expect(getOverlayLines(manager, 'spacing')).toHaveLength(0);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter((visual) => visual.type === 'band')
    ).toHaveLength(0);
  });

  it('snaps a dragged element to the viewport center when no stronger local target exists', () => {
    const { manager, movingTask } = createHarness();

    beginDrag(manager, movingTask);
    manager.handleMouseMove(470, 110);

    expect(movingTask.x).toBe(464);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter(
          (visual) =>
            visual.type === 'line' && visual.kind === 'viewport-center'
        )
    ).toHaveLength(1);
  });

  it('does not use viewport-center guides when viewport-center preference is disabled', () => {
    const { manager, movingTask } = createHarness();
    manager.setSmartGuidePreferences({ showViewportCenterGuides: false });

    beginDrag(manager, movingTask);
    manager.handleMouseMove(470, 110);

    expect(movingTask.x).toBe(460);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter(
          (visual) =>
            visual.type === 'line' && visual.kind === 'viewport-center'
        )
    ).toHaveLength(0);
  });

  it('offers a container snap for a task inside a story in planning mode', () => {
    const { scene, manager, movingTask } = createPlanningHarness();
    const story = new StoryElement({
      id: 'story',
      x: 450,
      y: 50,
      width: 344,
      height: 240,
    });
    story.addTask(movingTask);
    scene.addElement(story);
    movingTask.x = 448;

    const snap = (manager as any).updateSmartGuidesForElements([movingTask]);

    expect(snap.snapOffsetX).toBe(2);
    expect(getOverlayLines(manager, 'container')).toHaveLength(1);
  });

  it('does not offer container snap when container preference is disabled', () => {
    const { scene, manager, movingTask } = createPlanningHarness();
    const story = new StoryElement({
      id: 'story',
      x: 450,
      y: 50,
      width: 344,
      height: 240,
    });
    story.addTask(movingTask);
    scene.addElement(story);
    manager.setSmartGuidePreferences({ showContainerGuides: false });
    movingTask.x = 448;

    const snap = (manager as any).updateSmartGuidesForElements([movingTask]);

    expect(snap.snapOffsetX).toBe(0);
    expect(getOverlayLines(manager, 'container')).toHaveLength(0);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter(
          (visual) => visual.type === 'line' && visual.kind === 'container'
        )
    ).toHaveLength(0);
  });

  it('snaps a resized story edge when smart guides are enabled', () => {
    const { scene, manager, panZoom } = createStoryHarness();
    const story = new StoryElement({
      id: 'story',
      x: 100,
      y: 50,
      width: 344,
      height: 240,
    });
    const candidate = new StoryElement({
      id: 'candidate',
      x: 500,
      y: 50,
      width: 344,
      height: 240,
    });
    scene.addElement(story);
    scene.addElement(candidate);

    beginResize(manager, story, panZoom);
    manager.handleMouseMove(504, 289);

    expect(story.width).toBe(400);
    expect(story.height).toBe(240);
    expect(
      getOverlayLines(manager)
        .filter((guide) => guide.axis === 'x')
        .map((guide) => guide.position)
    ).toContain(500);
    expect(manager.getSmartGuideOverlay().visuals.length).toBeGreaterThan(0);
  });

  it('shows resize guides but keeps raw size while Alt disables smart snap', () => {
    const { scene, manager, panZoom } = createStoryHarness();
    const story = new StoryElement({
      id: 'story',
      x: 100,
      y: 50,
      width: 344,
      height: 240,
    });
    const candidate = new StoryElement({
      id: 'candidate',
      x: 500,
      y: 50,
      width: 344,
      height: 240,
    });
    scene.addElement(story);
    scene.addElement(candidate);

    beginResize(manager, story, panZoom);
    manager.handleMouseMove(504, 289, { disableSmartSnap: true });

    expect(story.width).toBe(405);
    expect(getOverlayLines(manager).length).toBeGreaterThan(0);
  });

  it('snaps a resized story to the viewport center when center alignment wins', () => {
    const { scene, manager, panZoom } = createStoryHarness();
    const story = new StoryElement({
      id: 'story',
      x: 450,
      y: 50,
      width: 344,
      height: 240,
    });
    scene.addElement(story);

    beginResize(manager, story, panZoom);
    manager.handleMouseMove(753, 289);

    expect(story.width).toBe(300);
    expect(
      manager
        .getSmartGuideOverlay()
        .visuals.filter(
          (visual) =>
            visual.type === 'line' && visual.kind === 'viewport-center'
        )
    ).toHaveLength(1);
  });
});
