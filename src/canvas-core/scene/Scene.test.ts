import { describe, expect, it } from 'vitest';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import {
  ConnectionLineType,
  DefaultConnectionRelationType,
  type IConnection,
  type ConnectionPoint,
} from '../interfaces/connection.ts';
import { Scene } from './Scene.ts';

type TestNode = ICanvasElement & IConnectable & { kind: 'node' };
type TestEdge = ICanvasElement &
  IConnection & {
    kind: 'edge';
  };
type TestElement = TestNode | TestEdge;

const createNode = (id: string): TestNode => ({
  id,
  kind: 'node',
  x: 0,
  y: 0,
  selected: false,
  zIndex: 1,
  draw: () => undefined,
  contains: () => true,
  getNearestPoint: () => ({ x: 0, y: 0 }),
  getConnectionPoints: () =>
    [{ x: 0, y: 0, angle: 0, direction: 'right' }] as ConnectionPoint[],
  drawAnchors: () => undefined,
  drawConnectionLine: () => undefined,
});

const createEdge = (id: string, fromId: string, toId: string): TestEdge => ({
  id,
  kind: 'edge',
  selected: false,
  zIndex: 0,
  fromId,
  toId,
  lineType: ConnectionLineType.SShaped,
  relationType: DefaultConnectionRelationType.RelatesTo,
  draw: () => undefined,
  isNearPoint: () => false,
  setLineType: () => undefined,
});

describe('canvas-core Scene', () => {
  it('manages selection and emits updates', () => {
    const scene = new Scene<TestElement>();
    const a = createNode('a');
    const b = createNode('b');
    scene.addElements([a, b]);

    scene.setSelected([a]);
    expect(scene.getSelectedElements().map((element) => element.id)).toEqual(['a']);

    scene.addToSelected([b]);
    expect(scene.getSelectedElements().map((element) => element.id).sort()).toEqual([
      'a',
      'b',
    ]);

    scene.removeFromSelected([a]);
    expect(scene.getSelectedElements().map((element) => element.id)).toEqual(['b']);
  });

  it('tracks focus and highlights safely across removals', () => {
    const scene = new Scene<TestElement>();
    const node = createNode('node-1');
    scene.addElement(node);
    scene.setFocusedElementById(node.id);
    scene.setHighlightedElementById(node.id, true);

    scene.removeElements([node]);

    expect(scene.getFocusedElementId()).toBe(null);
    expect(scene.getHighlightedElementIds()).toEqual([]);
  });

  it('exposes connectables and connections via type guards', () => {
    const scene = new Scene<TestElement>();
    const nodeA = createNode('node-a');
    const nodeB = createNode('node-b');
    const edge = createEdge('edge-1', nodeA.id, nodeB.id);
    scene.addElements([nodeA, nodeB, edge]);

    expect(scene.getConnectables().map((element) => element.id).sort()).toEqual([
      'node-a',
      'node-b',
    ]);
    expect(scene.getConnections().map((element) => element.id)).toEqual(['edge-1']);
  });
});
