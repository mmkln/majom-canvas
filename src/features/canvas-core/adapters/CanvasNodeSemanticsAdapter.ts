import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { Scene } from '../core/scene/Scene.ts';
import type { IStructuredCanvasNode } from '../elements/interfaces/structuredCanvasNode.ts';

export type CanvasSceneNode = IStructuredCanvasNode & {
  uuid?: string;
  backendId?: number | string;
};

export type CanvasPersistRef = {
  entityKind: string;
  entityId: string;
  layoutType?: string;
  layoutUuid?: string;
  backendId?: string | number;
};

export type CanvasNodeRecord = {
  id: string;
  kind: string;
  persistRef?: CanvasPersistRef;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  description: string;
  containerId?: string | null;
  parentId?: string | null;
  childIds?: string[];
  meta?: Record<string, unknown>;
};

export type CanvasLayoutRecord = {
  nodeId: string;
  kind: string;
  persistRef: CanvasPersistRef;
  x: number;
  y: number;
  meta?: Record<string, unknown>;
};

export interface CanvasNodeSemanticsAdapter {
  isElement(element: ICanvasElement): element is CanvasSceneNode;
  getElements(elements: ICanvasElement[]): CanvasSceneNode[];
  getSceneElements(scene: Scene): CanvasSceneNode[];
  materializeNode(record: CanvasNodeRecord): CanvasSceneNode;
  materializeNodes(records: CanvasNodeRecord[]): CanvasSceneNode[];
  replaceSceneElements(scene: Scene, elements: CanvasSceneNode[]): void;
  toNodeRecord(node: CanvasSceneNode, scene?: Scene): CanvasNodeRecord;
  toNodeRecords(nodes: CanvasSceneNode[], scene?: Scene): CanvasNodeRecord[];
  toLayoutRecord(
    scene: Scene,
    node: CanvasSceneNode
  ): CanvasLayoutRecord | null;
  getLayoutPersistenceKind(element: CanvasSceneNode): string | null;
  getLayoutPersistenceMeta(
    scene: Scene,
    element: CanvasSceneNode
  ): Record<string, unknown>;
}
