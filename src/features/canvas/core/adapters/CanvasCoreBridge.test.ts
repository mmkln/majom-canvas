import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CanvasCoreBridge } from './CanvasCoreBridge.ts';

type TestElement = {
  id: string;
  selected: boolean;
  zIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fromId?: string;
  toId?: string;
  relationType?: string;
  lineType?: string;
  title?: string;
};

type TestState = {
  elements: TestElement[];
  selectedIds: string[];
  focusedId: string | null;
  highlightedIds: string[];
  elementsVersion: number;
};

function createBridgeFixture() {
  const sceneChanges = new Subject<void>();
  const focusChanges = new Subject<{
    previousId: string | null;
    currentId: string | null;
  }>();
  const highlightChanges = new Subject<{ addedIds: string[]; removedIds: string[] }>();
  const viewChanges = new Subject<{ scrollX: number; scrollY: number; scale: number }>();
  const historyChanges = new Subject<void>();

  const state: TestState = {
    elements: [
      {
        id: 'node-1',
        selected: true,
        zIndex: 2,
        x: 100,
        y: 200,
        width: 180,
        height: 60,
        title: 'Task A',
      },
      {
        id: 'edge-1',
        selected: false,
        zIndex: 1,
        fromId: 'node-1',
        toId: 'node-2',
        relationType: 'relates_to',
        lineType: 's-shaped',
      },
    ],
    selectedIds: ['node-1'],
    focusedId: 'node-1',
    highlightedIds: ['node-1'],
    elementsVersion: 7,
  };

  const scene = {
    changes: sceneChanges,
    focusChanges,
    highlightChanges,
    getElements: () => state.elements,
    getElementsVersion: () => state.elementsVersion,
    getSelectedElements: () =>
      state.elements.filter((element) => state.selectedIds.includes(element.id)),
    getFocusedElementId: () => state.focusedId,
    getHighlightedElementIds: () => state.highlightedIds,
  };

  const panZoom = {
    scrollX: 300,
    scrollY: 400,
    scale: 1.2,
    viewChanges,
  };

  let canUndo = false;
  let canRedo = false;
  let hasUnsavedChanges = false;
  let token = { branchId: 0, index: 0 };

  const history = {
    changes: historyChanges,
    canUndo: () => canUndo,
    canRedo: () => canRedo,
    hasUnsavedChanges: () => hasUnsavedChanges,
    getStateToken: () => token,
  };

  const bridge = new CanvasCoreBridge(scene, panZoom, history);

  return {
    bridge,
    sceneChanges,
    focusChanges,
    highlightChanges,
    viewChanges,
    historyChanges,
    state,
    setHistoryState: (next: {
      canUndo: boolean;
      canRedo: boolean;
      hasUnsavedChanges: boolean;
      token: { branchId: number; index: number };
    }) => {
      canUndo = next.canUndo;
      canRedo = next.canRedo;
      hasUnsavedChanges = next.hasUnsavedChanges;
      token = next.token;
    },
  };
}

describe('CanvasCoreBridge', () => {
  it('exports graph snapshot from legacy scene', () => {
    const fixture = createBridgeFixture();
    const snapshot = fixture.bridge.exportGraphSnapshot();

    expect(snapshot.nodes).toHaveLength(1);
    expect(snapshot.edges).toHaveLength(1);
    expect(snapshot.nodes[0]).toMatchObject({
      id: 'node-1',
      kind: 'object',
      bounds: { x: 100, y: 200, width: 180, height: 60 },
    });
    expect(snapshot.edges[0]).toMatchObject({
      id: 'edge-1',
      from: 'node-1',
      to: 'node-2',
      type: 'relates_to',
    });
    expect(snapshot.view).toEqual({
      scrollX: 300,
      scrollY: 400,
      scale: 1.2,
    });
  });

  it('emits typed bridge events for scene/view/history updates', () => {
    const fixture = createBridgeFixture();
    const events = {
      sceneChanged: 0,
      viewChanged: 0,
      historyChanged: 0,
      lastSelectedIds: [] as string[],
      lastHistoryToken: null as { branchId: number; index: number } | null,
    };

    fixture.bridge.events.on('sceneChanged', () => {
      events.sceneChanged += 1;
    });
    fixture.bridge.events.on('selectionChanged', (payload) => {
      events.lastSelectedIds = payload.selectedIds;
    });
    fixture.bridge.events.on('viewChanged', () => {
      events.viewChanged += 1;
    });
    fixture.bridge.events.on('historyChanged', (payload) => {
      events.historyChanged += 1;
      events.lastHistoryToken = payload.stateToken;
    });

    fixture.setHistoryState({
      canUndo: true,
      canRedo: false,
      hasUnsavedChanges: true,
      token: { branchId: 2, index: 5 },
    });
    fixture.bridge.start();

    fixture.state.selectedIds = ['node-1'];
    fixture.sceneChanges.next();
    fixture.viewChanges.next({ scrollX: 10, scrollY: 20, scale: 1.5 });
    fixture.setHistoryState({
      canUndo: true,
      canRedo: false,
      hasUnsavedChanges: true,
      token: { branchId: 2, index: 5 },
    });
    fixture.historyChanges.next();

    expect(events.sceneChanged).toBeGreaterThan(0);
    expect(events.lastSelectedIds).toEqual(['node-1']);
    expect(events.viewChanged).toBeGreaterThan(0);
    expect(events.historyChanged).toBeGreaterThan(0);
    expect(events.lastHistoryToken).toEqual({ branchId: 2, index: 5 });
  });

  it('stops subscriptions and clears listeners', () => {
    const fixture = createBridgeFixture();
    let sceneChangedCalls = 0;
    fixture.bridge.events.on('sceneChanged', () => {
      sceneChangedCalls += 1;
    });

    fixture.bridge.start();
    const beforeStop = sceneChangedCalls;
    fixture.bridge.stop();
    fixture.sceneChanges.next();

    expect(beforeStop).toBeGreaterThan(0);
    expect(sceneChangedCalls).toBe(beforeStop);
  });
});
