// ui/CanvasToolbar.ts
import { ComponentFactory } from '../ui-lib/src/index.ts';
import { Scene } from '../core/scene/Scene.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { notify } from '../core/services/NotificationService.ts';

/**
 * Canvas toolbar component with buttons for creating tasks, stories, and goals
 * Located at the top center of the canvas as specified in PROJECT.md
 */
export class CanvasToolbar {
  public readonly container: HTMLDivElement;

  constructor(private scene: Scene, private canvasManager: CanvasManager) {
    this.container = this.createToolbarContainer();
    this.addButtons();
  }

  /**
   * Create the toolbar container element
   */
  private createToolbarContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'canvas-toolbar';
    container.style.position = 'absolute';
    container.style.top = '12px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.display = 'flex';
    container.style.gap = '6px';
    container.style.padding = '6px';
    container.style.background = 'white';
    container.style.borderRadius = '10px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    container.style.zIndex = '100';
    return container;
  }

  /**
   * Add buttons to the toolbar
   */
  private addButtons(): void {
    // Select button
    const selectBtn = ComponentFactory.createButton({
      text: 'Select',
      variant: 'secondary',
      onClick: () => this.handleSelectMode(),
      tooltip: 'Select elements on canvas',
      size: 'lg',
    }).createElement();

    // Create Task button
    const createTaskBtn = ComponentFactory.createButton({
      text: 'Task',
      variant: 'secondary',
      onClick: () => this.createTask(),
      tooltip: 'Create a new task on canvas',
      size: 'lg',
    }).createElement();

    // Create Story button
    const createStoryBtn = ComponentFactory.createButton({
      text: 'Story',
      variant: 'secondary',
      onClick: () => this.createStory(),
      tooltip: 'Create a new story on canvas',
      size: 'lg',
    }).createElement();

    // Create Goal button
    const createGoalBtn = ComponentFactory.createButton({
      text: 'Goal',
      variant: 'secondary',
      onClick: () => this.createGoal(),
      tooltip: 'Create a new goal on canvas',
      size: 'lg',
    }).createElement();

    // Add buttons to container
    // this.container.appendChild(selectBtn);
    this.container.appendChild(createTaskBtn);
    this.container.appendChild(createStoryBtn);
    this.container.appendChild(createGoalBtn);
  }

  /**
   * Handle select mode
   */
  private handleSelectMode(): void {
    // Set mode to select (default interaction mode)
    console.log('Select mode activated');
    // Any specific logic for select mode can be implemented here
  }

  /**
   * Create a new task on the canvas
   */
  private createTask(): void {
    // Position in center of view
    const centerX = this.canvasManager.canvas.width / 2;
    const centerY = this.canvasManager.canvas.height / 2;

    // Convert to scene coordinates
    const panZoom = this.canvasManager.getPanZoomManager();
    const sceneX =
      (centerX + panZoom.scrollX) / panZoom.scale - TaskElement.width / 2;
    const sceneY =
      (centerY + panZoom.scrollY) / panZoom.scale - TaskElement.height / 2;

    // Create the task and set its position
    const task = new TaskElement({ x: sceneX, y: sceneY });

    // Add the adapter to the scene
    this.scene.addElement(task);
    this.scene.setSelected([task]);
    this.canvasManager.draw();
    notify('Task created', 'success');
  }

  /**
   * Create a new story on the canvas
   */
  private createStory(): void {
    // Create a new story at center of view
    const centerX = this.canvasManager.canvas.width / 2;
    const centerY = this.canvasManager.canvas.height / 2;
    const panZoom = this.canvasManager.getPanZoomManager();
    const sceneX =
      (centerX + panZoom.scrollX) / panZoom.scale - StoryElement.width / 2;
    const sceneY =
      (centerY + panZoom.scrollY) / panZoom.scale - StoryElement.height / 2;
    const story = new StoryElement({ x: sceneX, y: sceneY });
    this.scene.addElement(story);
    this.scene.setSelected([story]);
    this.canvasManager.draw();
    notify('Story created', 'success');
  }

  /**
   * Create a new goal on the canvas
   */
  private createGoal(): void {
    const centerX = this.canvasManager.canvas.width / 2;
    const centerY = this.canvasManager.canvas.height / 2;
    const panZoom = this.canvasManager.getPanZoomManager();
    const sceneX = (centerX + panZoom.scrollX) / panZoom.scale - 100;
    const sceneY = (centerY + panZoom.scrollY) / panZoom.scale - 60;
    const goal = new GoalElement({ x: sceneX, y: sceneY });
    this.scene.addElement(goal);
    this.scene.setSelected([goal]);
    this.canvasManager.draw();
    notify('Goal created', 'success');
  }

  /**
   * Mount the toolbar to the DOM
   */
  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  /**
   * Unmount the toolbar from the DOM
   */
  public unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
