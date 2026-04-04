import Connection from '../core/shapes/Connection.ts';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasPlanningElement } from '../elements/utils/planningElementCapabilities.ts';
import { isCanvasPlanningElement } from '../elements/utils/planningElementCapabilities.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { HabitElement } from '../elements/HabitElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import type {
  CanvasDraftConnectionRecord,
  CanvasDraftNodeRecord,
  CanvasDraftSnapshot,
} from './CanvasDraftRepository.ts';

type MaterializedCanvasDraft = {
  elements: CanvasPlanningElement[];
  connections: Connection[];
  focusedElementId: string | null;
  highlightedElementIds: string[];
};

export class CanvasDraftSerializer {
  public capture(
    canvasId: string,
    scene: Scene,
    baseCanvasMetaFingerprint: string | null = null
  ): CanvasDraftSnapshot {
    const elements = scene.getElements().filter(isCanvasPlanningElement);
    const nodes = elements.map((element) => this.toNodeRecord(element)).sort(compareNodes);
    const connections = scene
      .getConnections()
      .map((connection) => ({
        id: connection.id,
        fromId: connection.fromId,
        toId: connection.toId,
        lineType: connection.lineType,
        relationType: connection.relationType,
      }))
      .sort(compareConnections);

    return {
      version: 2,
      canvasId,
      savedAt: new Date().toISOString(),
      baseCanvasMetaFingerprint,
      fingerprint: this.computeFingerprint(
        nodes,
        connections,
        scene.getFocusedElementId(),
        scene.getHighlightedElementIds()
      ),
      nodes,
      connections,
      focusedElementId: scene.getFocusedElementId(),
      highlightedElementIds: [...scene.getHighlightedElementIds()].sort(),
    };
  }

  public materialize(snapshot: CanvasDraftSnapshot): MaterializedCanvasDraft {
    const elements = snapshot.nodes.map((node) => this.materializeNode(node));
    const tasksById = new Map(
      elements
        .filter((element): element is TaskElement => element instanceof TaskElement)
        .map((task) => [task.id, task] as const)
    );

    snapshot.nodes.forEach((node, index) => {
      if (node.kind !== 'story') return;
      const story = elements[index];
      if (!(story instanceof StoryElement)) return;
      story.tasks = node.taskIds
        .map((taskId) => tasksById.get(taskId))
        .filter((task): task is TaskElement => Boolean(task));
    });

    return {
      elements,
      connections: snapshot.connections.map(
        (connection) =>
          new Connection(
            connection.fromId,
            connection.toId,
            connection.id,
            connection.lineType,
            connection.relationType
          )
      ),
      focusedElementId: snapshot.focusedElementId,
      highlightedElementIds: [...snapshot.highlightedElementIds],
    };
  }

  public computeFingerprint(
    nodes: CanvasDraftNodeRecord[],
    connections: CanvasDraftConnectionRecord[],
    focusedElementId: string | null,
    highlightedElementIds: string[]
  ): string {
    return JSON.stringify({
      nodes: [...nodes].sort(compareNodes),
      connections: [...connections].sort(compareConnections),
      focusedElementId,
      highlightedElementIds: [...highlightedElementIds].sort(),
    });
  }

  private toNodeRecord(element: CanvasPlanningElement): CanvasDraftNodeRecord {
    if (element instanceof TaskElement) {
      return {
        kind: 'task',
        id: element.id,
        uuid: element.uuid,
        backendId: element.backendId,
        x: element.x,
        y: element.y,
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
        dueDate: element.dueDate?.toISOString() ?? null,
      };
    }
    if (element instanceof StoryElement) {
      return {
        kind: 'story',
        id: element.id,
        uuid: element.uuid,
        backendId: element.backendId,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
        taskIds: element.tasks.map((task) => task.id),
        goalBackendId: element.goalBackendId,
      };
    }
    if (element instanceof GoalElement) {
      return {
        kind: 'goal',
        id: element.id,
        uuid: element.uuid,
        backendId: element.backendId,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
        scale: element.scale,
        links: [...element.links],
        progress: element.progress,
        tagIds: [...(element.tagIds ?? [])],
        tags: [...(element.tags ?? [])],
      };
    }
    return {
      kind: 'habit',
      id: element.id,
      uuid: element.uuid,
      backendId: element.backendId,
      x: element.x,
      y: element.y,
      title: element.title,
      description: element.description ?? '',
      priority: element.priority,
      habitStatus: element.habitStatus,
      meta: element.meta ? { ...element.meta } : null,
      completedToday: element.completedToday,
      isDueToday: element.isDueToday,
      lastChecked: element.lastChecked?.toISOString() ?? null,
      completionHistory: [...element.completionHistory],
    };
  }

  private materializeNode(node: CanvasDraftNodeRecord): CanvasPlanningElement {
    switch (node.kind) {
      case 'task':
        return new TaskElement({
          id: node.id,
          uuid: node.uuid,
          backendId:
            typeof node.backendId === 'number' ? node.backendId : undefined,
          x: node.x,
          y: node.y,
          title: node.title,
          description: node.description,
          status: node.status,
          priority: node.priority,
          dueDate: node.dueDate ? new Date(node.dueDate) : null,
        });
      case 'story':
        return new StoryElement({
          id: node.id,
          uuid: node.uuid,
          backendId:
            typeof node.backendId === 'number' ? node.backendId : undefined,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          title: node.title,
          description: node.description,
          status: node.status,
          priority: node.priority,
          tasks: [],
          goalBackendId: node.goalBackendId,
        });
      case 'goal':
        return new GoalElement({
          id: node.id,
          uuid: node.uuid,
          backendId:
            typeof node.backendId === 'number' ? node.backendId : undefined,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          title: node.title,
          description: node.description,
          status: node.status,
          priority: node.priority,
          tags: [...node.tags],
          tagIds: [...node.tagIds],
          scale: node.scale,
        });
      case 'habit':
        return new HabitElement({
          id: node.id,
          uuid: node.uuid,
          backendId:
            typeof node.backendId === 'number' ||
            typeof node.backendId === 'string'
              ? node.backendId
              : undefined,
          x: node.x,
          y: node.y,
          title: node.title,
          description: node.description,
          priority: node.priority,
          habitStatus: node.habitStatus,
          meta: node.meta ? { ...node.meta } : null,
          completedToday: node.completedToday,
          isDueToday: node.isDueToday,
          lastChecked: node.lastChecked ? new Date(node.lastChecked) : null,
          completionHistory: [...node.completionHistory],
        });
    }
  }
}

function compareNodes(left: CanvasDraftNodeRecord, right: CanvasDraftNodeRecord): number {
  return left.id.localeCompare(right.id);
}

function compareConnections(
  left: CanvasDraftConnectionRecord,
  right: CanvasDraftConnectionRecord
): number {
  const leftKey = [
    left.fromId,
    left.toId,
    left.relationType,
    left.lineType,
    left.id,
  ].join('::');
  const rightKey = [
    right.fromId,
    right.toId,
    right.relationType,
    right.lineType,
    right.id,
  ].join('::');
  return leftKey.localeCompare(rightKey);
}
