import type { CanvasLayoutRecord, CanvasSceneNode } from '../../canvas-core/adapters/CanvasNodeSemanticsAdapter.ts';
import type { IConnection } from '../../canvas-core/core/interfaces/connection.ts';
import type { LearningCourseContent } from '../domain/types.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import {
  buildLearningCanvasScene,
  mergeElementsIntoLearningContent,
  type LearningCanvasSceneSnapshot,
} from './learningCanvasMapping.ts';
import type { LearningUnitNode } from './LearningUnitNode.ts';
import {
  isLearningModuleNode,
  isLearningUnitNode as isLearningCanvasUnitNode,
} from './learningCanvasNodes.ts';

export class LearningCanvasContentStore {
  constructor(private readonly hostApi: LearningCanvasHostApi) {}

  public getSnapshot(): LearningCanvasSceneSnapshot {
    const document = this.hostApi.getDocument();
    return buildLearningCanvasScene(document.content, document.selection);
  }

  public saveCanvasTitle(name: string): void {
    this.updateBuildContent((content) => ({
      ...content,
      title: name,
    }));
  }

  public patchElement(
    element: CanvasSceneNode,
    patch: Record<string, unknown>
  ): void {
    this.updateBuildContent((content) => {
      if (isLearningModuleNode(element)) {
        return {
          ...content,
          modules: content.modules.map((module) =>
            module.id === element.id
              ? {
                  ...module,
                  title:
                    typeof patch.title === 'string' ? patch.title : module.title,
                  description:
                    typeof patch.description === 'string'
                      ? patch.description
                      : module.description,
                }
              : module
          ),
        };
      }

      if (!isLearningCanvasUnitNode(element)) {
        return content;
      }

      return {
        ...content,
        units: content.units.map((unit) =>
          unit.id === element.id
            ? {
                ...unit,
                title: typeof patch.title === 'string' ? patch.title : unit.title,
                description:
                  typeof patch.description === 'string'
                    ? patch.description
                    : unit.description,
              }
            : unit
        ),
      };
    });
  }

  public deleteElement(element: CanvasSceneNode): void {
    this.updateBuildContent((content) => {
      if (isLearningModuleNode(element)) {
        return {
          ...content,
          modules: content.modules.filter((module) => module.id !== element.id),
          units: content.units.filter((unit) => unit.moduleId !== element.id),
          moduleLayouts: content.moduleLayouts.filter(
            (layout) => layout.moduleId !== element.id
          ),
        };
      }

      if (!isLearningCanvasUnitNode(element)) {
        return content;
      }

      const removedUnit = content.units.find((unit) => unit.id === element.id);
      if (!removedUnit) return content;

      const removedIds = new Set<string>([removedUnit.id]);
      if (removedUnit.parentLessonId === null) {
        content.units.forEach((unit) => {
          if (unit.parentLessonId === removedUnit.id) {
            removedIds.add(unit.id);
          }
        });
      }

      return {
        ...content,
        modules: content.modules.map((module) => ({
          ...module,
          lessonIds: module.lessonIds.filter((lessonId) => !removedIds.has(lessonId)),
        })),
        units: content.units
          .filter((unit) => !removedIds.has(unit.id))
          .map((unit) =>
            unit.parentLessonId === null
              ? {
                  ...unit,
                  prerequisiteLessonIds: unit.prerequisiteLessonIds.filter(
                    (lessonId) => !removedIds.has(lessonId)
                  ),
                }
              : unit
          ),
      };
    });
  }

  public hasRelationChanges(connections: IConnection[]): boolean {
    const existingIds = new Set(
      this.getSnapshot().connections.map((connection) => connection.id)
    );
    if (existingIds.size !== connections.length) return true;
    return connections.some((connection) => !existingIds.has(connection.id));
  }

  public saveStructure(
    elements: CanvasSceneNode[],
    connections: IConnection[]
  ): void {
    this.updateBuildContent((content) =>
      mergeElementsIntoLearningContent(
        content,
        elements.filter(isLearningModuleNode),
        elements.filter(
          (element): element is LearningUnitNode =>
            isLearningCanvasUnitNode(element)
        ),
        connections
      )
    );
  }

  public saveModuleLayouts(changes: CanvasLayoutRecord[]): void {
    this.updateBuildContent((content) => {
      if (changes.length === 0) {
        return content;
      }

      const layoutByModuleId = new Map(
        changes
          .filter(
            (change): change is CanvasLayoutRecord =>
              change.persistRef.layoutType === 'module' &&
              typeof change.persistRef.entityId === 'string' &&
              change.persistRef.entityId.length > 0
          )
          .map((change) => [change.persistRef.entityId, change] as const)
      );
      if (layoutByModuleId.size === 0) return content;

      return {
        ...content,
        moduleLayouts: content.modules.map((module, index) => {
          const existing =
            content.moduleLayouts.find((layout) => layout.moduleId === module.id) ??
            {
              moduleId: module.id,
              x: 64 + (index % 2) * 820,
              y: 64 + Math.floor(index / 2) * 420,
              collapsed: false,
            };
          const change = layoutByModuleId.get(module.id);
          if (!change) return existing;
          return {
            ...existing,
            x: typeof change.x === 'number' ? change.x : existing.x,
            y: typeof change.y === 'number' ? change.y : existing.y,
          };
        }),
      };
    });
  }

  private updateBuildContent(
    update: (content: LearningCourseContent) => LearningCourseContent
  ): void {
    const document = this.hostApi.getDocument();
    if (document.mode !== 'build') return;
    this.hostApi.saveContent(update(document.content));
  }
}
