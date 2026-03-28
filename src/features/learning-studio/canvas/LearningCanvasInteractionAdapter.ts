import type {
  CanvasActionExecutionContext,
  CanvasActionGroup,
  CanvasCreationContext,
  CanvasContextMenuContext,
  CanvasInteractionAdapter,
  CanvasActionDefinition,
  CanvasSelectionActionContext,
} from '../../canvas-core/adapters/CanvasInteractionAdapter.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';

const ACTION_IDS = {
  createModule: 'learning.create.module',
  addLesson: 'learning.module.add-lesson',
  addExercise: 'learning.lesson.add-exercise',
  addCheckpoint: 'learning.lesson.add-checkpoint',
} as const;

const PREREQUISITE_ACTION_PREFIX = 'learning.lesson.prerequisite:';

export class LearningCanvasInteractionAdapter
  implements CanvasInteractionAdapter
{
  constructor(private readonly hostApi: LearningCanvasHostApi) {}

  public getCreationActions(_context: CanvasCreationContext): CanvasActionGroup[] {
    if (!this.isEditable()) {
      return [];
    }
    return [
      {
        id: 'learning-creation',
        title: 'Course',
        actions: [
          {
            id: ACTION_IDS.createModule,
            label: 'Add module',
            icon: 'plus',
            tone: 'primary',
          },
        ],
      },
    ];
  }

  public getContextMenuActions(
    context: CanvasContextMenuContext
  ): CanvasActionGroup[] {
    if (!this.isEditable() || context.target == null) {
      return [];
    }

    return [
      ...this.getActionsForTarget(context.target),
      ...this.getPrerequisiteActionGroups(context.target),
    ];
  }

  public getSelectionActions(
    context: CanvasSelectionActionContext
  ): CanvasActionGroup[] {
    if (!this.isEditable() || context.selectedElements.length !== 1) {
      return [];
    }
    return this.getActionsForTarget(context.selectedElements[0] ?? null);
  }

  public executeAction(context: CanvasActionExecutionContext): void {
    switch (context.actionId) {
      case ACTION_IDS.createModule:
        this.hostApi.commands.createModule({
          sceneX: context.sceneX,
          sceneY: context.sceneY,
        });
        this.requestCanvasRefresh();
        return;
      case ACTION_IDS.addLesson:
        if (context.target instanceof LearningModuleNode) {
          this.hostApi.commands.createLesson(context.target.id);
          this.requestCanvasRefresh();
        }
        return;
      case ACTION_IDS.addExercise: {
        const lessonId = this.resolveTopLevelLessonId(context.target);
        if (lessonId) {
          this.hostApi.commands.createExercise(lessonId);
          this.requestCanvasRefresh();
        }
        return;
      }
      case ACTION_IDS.addCheckpoint: {
        const lessonId = this.resolveTopLevelLessonId(context.target);
        if (lessonId) {
          this.hostApi.commands.createCheckpoint(lessonId);
          this.requestCanvasRefresh();
        }
        return;
      }
      default:
        if (context.actionId.startsWith(PREREQUISITE_ACTION_PREFIX)) {
          const spec = this.parsePrerequisiteAction(context.actionId);
          if (spec) {
            this.hostApi.commands.setLessonPrerequisite(
              spec.lessonId,
              spec.prerequisiteLessonId,
              spec.enabled
            );
            this.requestCanvasRefresh();
          }
        }
        return;
    }
  }

  private getActionsForTarget(target: unknown): CanvasActionGroup[] {
    if (target instanceof LearningModuleNode) {
      return [
        {
          id: `learning-module-actions:${target.id}`,
          title: 'Module',
          actions: [
            {
              id: ACTION_IDS.addLesson,
              label: 'Add lesson',
              icon: 'plus',
              tone: 'primary',
            },
          ],
        },
      ];
    }

    const lessonId = this.resolveTopLevelLessonId(target);
    if (!lessonId) {
      return [];
    }

    return [
      {
        id: `learning-lesson-actions:${lessonId}`,
        title: 'Lesson',
        actions: [
          {
            id: ACTION_IDS.addExercise,
            label: 'Add exercise',
            icon: 'plus',
          },
          {
            id: ACTION_IDS.addCheckpoint,
            label: 'Add checkpoint',
            icon: 'plus',
          },
        ],
      },
    ];
  }

  private resolveTopLevelLessonId(target: unknown): string | null {
    if (!(target instanceof LearningLessonNode)) {
      return null;
    }
    if (target.parentLessonId !== null) {
      return null;
    }
    return target.id;
  }

  private getPrerequisiteActionGroups(target: unknown): CanvasActionGroup[] {
    const lessonId = this.resolveTopLevelLessonId(target);
    if (!lessonId) {
      return [];
    }

    const document = this.hostApi.getDocument();
    const targetLesson = document.content.units.find(
      (unit) =>
        unit.id === lessonId &&
        unit.type === 'lesson' &&
        unit.parentLessonId === null
    );
    if (!targetLesson) {
      return [];
    }

    const availableLessons = document.content.units
      .filter(
        (unit) =>
          unit.type === 'lesson' &&
          unit.parentLessonId === null &&
          unit.id !== lessonId
      )
      .slice()
      .sort((left, right) => left.order - right.order);

    if (availableLessons.length === 0) {
      return [];
    }

    const prerequisiteIds = new Set(targetLesson.prerequisiteLessonIds);

    return [
      {
        id: `learning-lesson-prerequisites:${lessonId}`,
        title: 'Prerequisites',
        actions: availableLessons.map((lesson): CanvasActionDefinition => {
          const enabled = prerequisiteIds.has(lesson.id);
          return {
            id: this.buildPrerequisiteActionId({
              lessonId,
              prerequisiteLessonId: lesson.id,
              enabled: !enabled,
            }),
            label:
              lesson.title.trim().length > 0 ? lesson.title : 'Untitled lesson',
            icon: enabled ? 'check' : 'link',
            tone: enabled ? 'default' : 'primary',
          };
        }),
      },
    ];
  }

  private buildPrerequisiteActionId(spec: {
    lessonId: string;
    prerequisiteLessonId: string;
    enabled: boolean;
  }): string {
    return `${PREREQUISITE_ACTION_PREFIX}${JSON.stringify(spec)}`;
  }

  private parsePrerequisiteAction(actionId: string): {
    lessonId: string;
    prerequisiteLessonId: string;
    enabled: boolean;
  } | null {
    const payload = actionId.slice(PREREQUISITE_ACTION_PREFIX.length);
    if (payload.length === 0) {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as {
        lessonId?: unknown;
        prerequisiteLessonId?: unknown;
        enabled?: unknown;
      };
      if (
        typeof parsed.lessonId !== 'string' ||
        typeof parsed.prerequisiteLessonId !== 'string' ||
        typeof parsed.enabled !== 'boolean'
      ) {
        return null;
      }
      return {
        lessonId: parsed.lessonId,
        prerequisiteLessonId: parsed.prerequisiteLessonId,
        enabled: parsed.enabled,
      };
    } catch {
      return null;
    }
  }

  private isEditable(): boolean {
    return this.hostApi.getDocument().mode === 'build';
  }

  private requestCanvasRefresh(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new Event('refreshCanvasData'));
  }
}
