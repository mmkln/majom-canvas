import { Scene } from '../scene/Scene.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import type { Story } from '../../../../majom-wrapper/interfaces/index.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { historyService } from './HistoryService.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';

export class AddExistingStoryService {
  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {}

  public addOrFocus(story: Story, sceneX: number, sceneY: number): void {
    const existing = this.getExistingStory(story);
    if (existing) {
      this.scene.setSelected([existing]);
      this.canvasManager.centerOnScenePoint(
        existing.x + existing.width / 2,
        existing.y + existing.height / 2
      );
      this.canvasManager.draw();
      return;
    }

    const normalizedPriority =
      story.priority === 'low' ||
      story.priority === 'medium' ||
      story.priority === 'high'
        ? story.priority
        : 'medium';

    const rawGoalId =
      story.goal_id ??
      (story.goal && Number.isFinite(story.goal.id) ? story.goal.id : null);
    const goalBackendId =
      typeof rawGoalId === 'number' && Number.isFinite(rawGoalId)
        ? rawGoalId
        : null;

    const storyElement = new StoryElement({
      id: story.uuid ?? String(story.id),
      backendId: story.id,
      uuid: story.uuid,
      title: story.title,
      description: story.description,
      status: mapStatus(story.status),
      priority: normalizedPriority,
      goalBackendId,
      x: sceneX - StoryElement.width / 2,
      y: sceneY - StoryElement.height / 2,
    });

    historyService.execute(new AddElementCommand(this.scene, storyElement));
    this.scene.setSelected([storyElement]);
    this.canvasManager.draw();
  }

  public isOnCanvas(story: Story): boolean {
    return this.getExistingStory(story) !== null;
  }

  public focusExisting(story: Story): boolean {
    const existing = this.getExistingStory(story);
    if (!existing) return false;
    this.scene.setSelected([existing]);
    this.canvasManager.centerOnScenePoint(
      existing.x + existing.width / 2,
      existing.y + existing.height / 2
    );
    this.canvasManager.draw();
    return true;
  }

  public getExistingStory(story: Story): StoryElement | null {
    const sceneStories = this.scene
      .getElements()
      .filter(
        (element): element is StoryElement => element instanceof StoryElement
      );

    const storyId = String(story.id);
    return (
      sceneStories.find((existing) => {
        if (story.uuid && existing.uuid === story.uuid) return true;
        if (story.uuid && existing.id === story.uuid) return true;
        if (
          Number.isFinite(existing.backendId) &&
          String(existing.backendId) === storyId
        ) {
          return true;
        }
        return existing.id === storyId;
      }) ?? null
    );
  }
}
