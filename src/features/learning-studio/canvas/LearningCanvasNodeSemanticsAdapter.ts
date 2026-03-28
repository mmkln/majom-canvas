import type { ICanvasElement } from '../../canvas-core/core/interfaces/canvasElement.ts';
import type { Scene } from '../../canvas-core/core/scene/Scene.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeSemanticsAdapter,
  CanvasNodeRecord,
  CanvasSceneNode,
} from '../../canvas-core/adapters/CanvasNodeSemanticsAdapter.ts';
import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import {
  isLearningModuleNode,
  isLearningUnitNode,
} from './learningCanvasNodes.ts';

export class LearningCanvasNodeSemanticsAdapter
  implements CanvasNodeSemanticsAdapter
{
  public isElement(element: ICanvasElement): element is CanvasSceneNode {
    return isLearningModuleNode(element) || isLearningUnitNode(element);
  }

  public getElements(elements: ICanvasElement[]): CanvasSceneNode[] {
    return elements.filter((element): element is CanvasSceneNode =>
      this.isElement(element)
    );
  }

  public getSceneElements(scene: Scene): CanvasSceneNode[] {
    return this.getElements(scene.getElements());
  }

  public materializeNode(record: CanvasNodeRecord): CanvasSceneNode {
    const meta = record.meta ?? {};
    if (record.kind === 'module') {
      return new LearningModuleNode({
        id: record.id,
        uuid: record.persistRef?.layoutUuid,
        backendId:
          typeof record.persistRef?.backendId === 'number'
            ? record.persistRef.backendId
            : undefined,
        x: record.x,
        y: record.y,
        width: record.width,
        height: record.height,
        title: record.title,
        description: record.description,
        status: meta.status as any,
        priority: meta.priority as any,
        units: [],
      });
    }

    const moduleId = this.requireStringField(
      record.containerId,
      'containerId',
      record
    );
    const common = {
      id: record.id,
      uuid: record.persistRef?.layoutUuid,
      backendId:
        typeof record.persistRef?.backendId === 'number'
          ? record.persistRef.backendId
          : undefined,
      x: record.x,
      y: record.y,
      title: record.title,
      description: record.description,
      status: meta.status as any,
      priority: meta.priority as any,
      dueDate: typeof meta.dueDate === 'string' ? new Date(meta.dueDate) : null,
      moduleId,
    };

    switch (record.kind) {
      case 'lesson':
        if (record.parentId != null) {
          throw new Error(
            `Lesson record ${record.id} cannot define parentId.`
          );
        }
        return new LearningLessonNode({
          ...common,
          parentLessonId: null,
          prerequisiteLessonIds: Array.isArray(meta.prerequisiteLessonIds)
            ? meta.prerequisiteLessonIds.filter(
                (value): value is string => typeof value === 'string'
              )
            : [],
        });
      case 'exercise':
        return new LearningExerciseNode({
          ...common,
          parentLessonId: this.requireStringField(
            record.parentId,
            'parentId',
            record
          ),
        });
      case 'checkpoint':
        return new LearningCheckpointNode({
          ...common,
          parentLessonId: this.requireStringField(
            record.parentId,
            'parentId',
            record
          ),
        });
      default:
        throw new Error(`Unsupported learning record kind: ${record.kind}`);
    }
  }

  public materializeNodes(records: CanvasNodeRecord[]): CanvasSceneNode[] {
    const elements = records.map((record) => this.materializeNode(record));
    const unitsById = new Map(
      elements
        .filter(isLearningUnitNode)
        .map((unit) => [unit.id, unit] as const)
    );
    records.forEach((record, index) => {
      const element = elements[index];
      if (!isLearningModuleNode(element)) return;
      element.replaceOrderedLayoutChildren(
        (record.childIds ?? [])
          .map((childId) => unitsById.get(childId))
          .filter(isLearningUnitNode)
      );
    });
    return elements;
  }

  public replaceSceneElements(scene: Scene, elements: CanvasSceneNode[]): void {
    scene.replaceElements((element) => this.isElement(element), elements);
  }

  public toNodeRecord(
    element: CanvasSceneNode,
    scene?: Scene
  ): CanvasNodeRecord {
    if (isLearningModuleNode(element)) {
      return {
        id: element.id,
        kind: 'module',
        persistRef: {
          entityKind: 'module',
          entityId: element.id,
          layoutType: 'module',
          layoutUuid: element.uuid,
          backendId: element.backendId,
        },
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        title: element.title,
        description: element.description,
        childIds: element.getOrderedLayoutChildren().map((child) => child.id),
        meta: {
          status: element.status,
          priority: element.priority,
          focused: scene ? scene.isFocused(element) : undefined,
          highlighted: scene ? scene.isHighlighted(element) : undefined,
        },
      };
    }
    if (!isLearningUnitNode(element)) {
      throw new Error(`Unsupported learning node kind: ${element.nodeKind}`);
    }
    const prerequisiteLessonIds =
      element.nodeKind === 'lesson' ? element.prerequisiteLessonIds : undefined;
    return {
      id: element.id,
      kind: element.nodeKind,
      persistRef: {
        entityKind: element.nodeKind,
        entityId: element.id,
        layoutUuid: element.uuid,
        backendId: element.backendId,
      },
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      title: element.title,
      description: element.description,
      containerId: element.moduleId,
      parentId: element.parentLessonId,
      meta: {
        status: element.status,
        priority: element.priority,
        dueDate: element.dueDate ? element.dueDate.toISOString() : null,
        prerequisiteLessonIds,
      },
    };
  }

  public toNodeRecords(
    nodes: CanvasSceneNode[],
    scene?: Scene
  ): CanvasNodeRecord[] {
    return nodes.map((node) => this.toNodeRecord(node, scene));
  }

  public toLayoutRecord(
    scene: Scene,
    element: CanvasSceneNode
  ): CanvasLayoutRecord | null {
    if (!isLearningModuleNode(element)) {
      return null;
    }
    return {
      nodeId: element.id,
      kind: 'module',
      persistRef: {
        entityKind: 'module',
        entityId: element.id,
        layoutType: 'module',
        layoutUuid: element.uuid,
        backendId: element.backendId,
      },
      x: element.x,
      y: element.y,
      meta: {
        width: element.width,
        height: element.height,
        focused: scene.isFocused(element),
        highlighted: scene.isHighlighted(element),
      },
    };
  }

  public getLayoutPersistenceKind(element: CanvasSceneNode): string | null {
    return isLearningModuleNode(element) ? 'module' : null;
  }

  public getLayoutPersistenceMeta(
    scene: Scene,
    element: CanvasSceneNode
  ): Record<string, unknown> {
    if (!isLearningModuleNode(element)) {
      return {};
    }
    return {
      width: element.width,
      height: element.height,
      focused: scene.isFocused(element),
      highlighted: scene.isHighlighted(element),
    };
  }

  private requireStringField(
    value: string | null | undefined,
    fieldName: 'containerId' | 'parentId',
    record: CanvasNodeRecord
  ): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    throw new Error(
      `Learning record ${record.id} is missing required ${fieldName}.`
    );
  }
}
