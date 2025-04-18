import { Story } from '../../elements/Story.ts';
import { Task } from '../../elements/Task.ts';

/**
 * Utility for handling story-task containment and movement
 */
export class ContainmentManager {
  /**
   * Shift a story and all its contained tasks by dx/dy
   */
  static shiftStoryAndTasks(story: Story, dx: number, dy: number): void {
    story.x += dx;
    story.y += dy;
    story.tasks.forEach(t => {
      t.x += dx;
      t.y += dy;
    });
  }

  /**
   * Add or remove a task from stories based on its position
   */
  static updateTaskContainment(task: Task, stories: Story[]): void {
    stories.forEach(story => {
      const inside = story.contains(task.x, task.y);
      const inStory = story.tasks.some(t => t.id === task.id);
      if (inside && !inStory) {
        story.addTask(task);
      } else if (!inside && inStory) {
        story.removeTask(task.id);
      }
    });
  }
}
