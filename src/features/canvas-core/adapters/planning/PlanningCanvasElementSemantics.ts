import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import type { Scene } from '../../core/scene/Scene.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeSemanticsAdapter,
  CanvasNodeRecord,
  CanvasSceneNode,
} from '../CanvasNodeSemanticsAdapter.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import {
  emitAiAssistantContextChanged,
  type AiAssistantCanvasSnapshot,
  type AiAssistantSelectionItem,
} from '../../../ai-assistant/aiAssistantEvents.ts';
import type { PlanningCanvasHierarchy } from './PlanningCanvasRelationSemantics.ts';
import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';

export type PlanningCanvasElement = TaskElement | StoryElement | GoalElement;
export type PlanningCanvasElementKind = 'task' | 'story' | 'goal';
export type PlanningCanvasViewportBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export class PlanningCanvasElementSemantics
  implements CanvasNodeSemanticsAdapter
{
  public isElement(element: ICanvasElement): element is PlanningCanvasElement {
    return isPlanningElement(element);
  }

  public getElements(elements: ICanvasElement[]): PlanningCanvasElement[] {
    return elements.filter((element): element is PlanningCanvasElement =>
      this.isElement(element)
    );
  }

  public getSceneElements(scene: Scene): PlanningCanvasElement[] {
    return this.getElements(scene.getElements());
  }

  public materializeNode(record: CanvasNodeRecord): PlanningCanvasElement {
    const meta = record.meta ?? {};
    const status =
      (meta.status as ElementStatus | undefined) ?? ElementStatus.Defined;
    const priority = (meta.priority as UiPriority | undefined) ?? 'low';
    switch (record.kind) {
      case 'task':
        return new TaskElement({
          id: record.id,
          uuid: record.persistRef?.layoutUuid,
          backendId: record.persistRef?.backendId as number | undefined,
          x: record.x,
          y: record.y,
          title: record.title,
          description: record.description,
          status,
          priority,
          dueDate:
            typeof meta.dueDate === 'string' ? new Date(meta.dueDate) : null,
        });
      case 'story':
        return new StoryElement({
          id: record.id,
          uuid: record.persistRef?.layoutUuid,
          backendId: record.persistRef?.backendId as number | undefined,
          x: record.x,
          y: record.y,
          width: record.width,
          height: record.height,
          title: record.title,
          description: record.description,
          status,
          priority,
          tasks: [],
          goalBackendId:
            typeof meta.goalBackendId === 'number' ? meta.goalBackendId : null,
        });
      case 'goal':
        return new GoalElement({
          id: record.id,
          uuid: record.persistRef?.layoutUuid,
          backendId: record.persistRef?.backendId as number | undefined,
          x: record.x,
          y: record.y,
          title: record.title,
          description: record.description,
          status,
          priority,
          scale: typeof meta.scale === 'number' ? meta.scale : undefined,
          width: record.width,
          height: record.height,
        });
      default:
        throw new Error(`Unsupported planning record kind: ${record.kind}`);
    }
  }

  public materializeNodes(records: CanvasNodeRecord[]): PlanningCanvasElement[] {
    const elements = records.map((record) => this.materializeNode(record));
    const tasksById = new Map(
      elements
        .filter((element): element is TaskElement => element instanceof TaskElement)
        .map((task) => [task.id, task] as const)
    );
    records.forEach((record, index) => {
      const element = elements[index];
      if (!(element instanceof StoryElement)) return;
      const childIds = record.childIds ?? [];
      element.replaceOrderedLayoutChildren(
        childIds
          .map((childId) => tasksById.get(childId))
          .filter((task): task is TaskElement => Boolean(task))
      );
    });
    return elements;
  }

  public getSelectedElements(scene: Scene): PlanningCanvasElement[] {
    return this.getElements(scene.getSelectedElements());
  }

  public getFocusedElementId(scene: Scene): string | null {
    const focusedId = scene.getFocusedElementId();
    if (!focusedId) return null;
    const focused = scene.getElements().find((element) => element.id === focusedId);
    return focused && this.isElement(focused) ? focused.id : null;
  }

  public getKind(element: PlanningCanvasElement): PlanningCanvasElementKind {
    if (element instanceof TaskElement) {
      return 'task';
    }
    if (element instanceof StoryElement) {
      return 'story';
    }
    return 'goal';
  }

  public getLayoutMeta(
    scene: Scene,
    element: PlanningCanvasElement
  ): Record<string, unknown> {
    const sharedMeta = {
      focused: scene.isFocused(element),
      highlighted: scene.isHighlighted(element),
    };
    if (element instanceof StoryElement) {
      return {
        width: element.width,
        height: element.height,
        ...sharedMeta,
      };
    }
    if (element instanceof GoalElement) {
      return {
        scale: element.scale,
        ...sharedMeta,
      };
    }
    return sharedMeta;
  }

  public replaceSceneElements(
    scene: Scene,
    elements: PlanningCanvasElement[]
  ): void {
    scene.replaceElements(isPlanningElement, elements);
  }

  public toNodeRecord(
    element: PlanningCanvasElement,
    scene?: Scene
  ): CanvasNodeRecord {
    const kind = this.getKind(element);
    const baseRecord: CanvasNodeRecord = {
      id: element.id,
      kind,
      persistRef: {
        entityKind: kind,
        entityId: element.id,
        layoutType: kind,
        layoutUuid: element.uuid,
        backendId: element.backendId,
      },
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      title: element.title,
      description: element.description ?? '',
      meta: {
        status: element.status,
        priority: element.priority,
        focused: scene ? scene.isFocused(element) : undefined,
        highlighted: scene ? scene.isHighlighted(element) : undefined,
      },
    };
    if (element instanceof TaskElement) {
      return {
        ...baseRecord,
        meta: {
          ...baseRecord.meta,
          dueDate: element.dueDate ? element.dueDate.toISOString() : null,
        },
      };
    }
    if (element instanceof StoryElement) {
      return {
        ...baseRecord,
        childIds: element.getOrderedLayoutChildren().map((task) => task.id),
        meta: {
          ...baseRecord.meta,
          goalBackendId: element.goalBackendId,
        },
      };
    }
    return {
      ...baseRecord,
      meta: {
        ...baseRecord.meta,
        scale: element.scale,
      },
    };
  }

  public toNodeRecords(
    nodes: PlanningCanvasElement[],
    scene?: Scene
  ): CanvasNodeRecord[] {
    return nodes.map((node) => this.toNodeRecord(node, scene));
  }

  public toLayoutRecord(
    scene: Scene,
    element: PlanningCanvasElement
  ): CanvasLayoutRecord | null {
    const layoutType = this.getLayoutPersistenceKind(element);
    if (!layoutType) return null;
    return {
      nodeId: element.id,
      kind: this.getKind(element),
      persistRef: {
        entityKind: this.getKind(element),
        entityId: element.id,
        layoutType,
        layoutUuid: element.uuid,
        backendId: element.backendId,
      },
      x: element.x,
      y: element.y,
      meta: this.getLayoutPersistenceMeta(scene, element),
    };
  }

  public getLayoutPersistenceKind(
    element: CanvasSceneNode
  ): PlanningCanvasElementKind | null {
    return this.isElement(element) ? this.getKind(element) : null;
  }

  public getLayoutPersistenceMeta(
    scene: Scene,
    element: CanvasSceneNode
  ): Record<string, unknown> {
    if (!this.isElement(element)) {
      return {};
    }
    return this.getLayoutMeta(scene, element);
  }

  public mapSelectionItem(
    element: PlanningCanvasElement
  ): AiAssistantSelectionItem {
    if (element instanceof GoalElement) {
      return {
        id: element.id,
        kind: 'goal',
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
      };
    }

    if (element instanceof StoryElement) {
      return {
        id: element.id,
        kind: 'story',
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
        childCount: element.tasks.length,
      };
    }

    return {
      id: element.id,
      kind: 'task',
      title: element.title,
      description: element.description ?? '',
      status: element.status,
      priority: element.priority,
    };
  }

  public buildElementRefMap(
    elements: PlanningCanvasElement[]
  ): Map<string, string> {
    const refToPlanningId = new Map<string, string>();
    elements.forEach((element) => {
      refToPlanningId.set(element.id, element.id);
      if (element.uuid) {
        refToPlanningId.set(element.uuid, element.id);
      }
    });
    return refToPlanningId;
  }

  public buildSnapshotSummary(
    elements: PlanningCanvasElement[],
    selectedElements: PlanningCanvasElement[]
  ): AiAssistantCanvasSnapshot['summary'] {
    return {
      goalCount: elements.filter((element) => this.getKind(element) === 'goal')
        .length,
      storyCount: elements.filter((element) => this.getKind(element) === 'story')
        .length,
      taskCount: elements.filter((element) => this.getKind(element) === 'task')
        .length,
      selectedCount: selectedElements.length,
    };
  }

  public getHighlightedElementIds(
    scene: Scene,
    elements: PlanningCanvasElement[]
  ): string[] {
    return scene
      .getHighlightedElementIds()
      .filter((id) => elements.some((element) => element.id === id));
  }

  public buildViewport(
    elements: PlanningCanvasElement[],
    bounds: PlanningCanvasViewportBounds
  ): AiAssistantCanvasSnapshot['viewport'] {
    return {
      ...bounds,
      visibleElementIds: elements
        .filter((element) => {
          const right = element.x + element.width;
          const bottom = element.y + element.height;
          return (
            right >= bounds.minX &&
            element.x <= bounds.maxX &&
            bottom >= bounds.minY &&
            element.y <= bounds.maxY
          );
        })
        .map((element) => element.id),
    };
  }

  public getHierarchyParentId(
    element: PlanningCanvasElement,
    hierarchy: PlanningCanvasHierarchy
  ): string | null {
    if (element instanceof GoalElement) {
      return hierarchy.goalParentById.get(element.id) ?? null;
    }
    if (element instanceof StoryElement) {
      return hierarchy.storyParentById.get(element.id) ?? null;
    }
    return hierarchy.taskParentById.get(element.id) ?? null;
  }

  public getHierarchyChildIds(
    element: PlanningCanvasElement,
    hierarchy: PlanningCanvasHierarchy
  ): string[] {
    if (element instanceof GoalElement) {
      return hierarchy.goalChildIds.get(element.id) ?? [];
    }
    if (element instanceof StoryElement) {
      return hierarchy.storyChildIds.get(element.id) ?? [];
    }
    return [];
  }

  public emitEmptyAiAssistantContext(): void {
    const emptySnapshot: AiAssistantCanvasSnapshot = {
      canvasId: null,
      canvasTitle: '',
      summary: {
        goalCount: 0,
        storyCount: 0,
        taskCount: 0,
        selectedCount: 0,
      },
      selectionIds: [],
      focusId: null,
      highlightedIds: [],
      elements: [],
      connections: [],
      viewport: null,
      recentActivity: [],
    };
    emitAiAssistantContextChanged(emptySnapshot);
  }
}

export const planningCanvasElementSemantics =
  new PlanningCanvasElementSemantics();
