import { Scene } from '../../core/scene/Scene.ts';
import { environment } from '../../config/environment.js';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.js';
import { TasksApiService } from '../../majom-wrapper/data-access/tasks-api-service.js';
import { StoriesApiService } from '../../majom-wrapper/data-access/stories-api-service.js';
import { GoalsApiService } from '../../majom-wrapper/data-access/goals-api-service.js';

/**
 * PaletteMenu: a draggable palette to add new Task, Story, or Goal elements.
 */
export class PaletteMenu {
  private container: HTMLElement;
  private panel: HTMLElement;
  private isOpen = false;

  constructor(private scene: Scene) {
    this.container = document.createElement('div');
    this.container.className = 'absolute top-4 left-4 z-20 bg-white p-2 rounded shadow-lg';
    // Toggle button
    const toggle = document.createElement('button');
    toggle.textContent = '+ Add Element';
    toggle.className = 'bg-blue-600 text-white px-3 py-1 rounded focus:outline-none hover:bg-blue-700';
    this.container.appendChild(toggle);

    // Panel with search and lists
    this.panel = document.createElement('div');
    this.panel.className = 'mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-64 max-h-96 overflow-auto';
    this.panel.style.display = 'none';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search...';
    search.className = 'border border-gray-300 rounded px-2 py-1 w-full mb-2 focus:outline-none';
    this.panel.appendChild(search);

    ['Task', 'Story', 'Goal'].forEach(type => {
      const section = document.createElement('div');
      section.className = 'mb-4';
      const title = document.createElement('h3');
      title.className = 'font-semibold text-gray-700 mb-1';
      title.textContent = type + 's';
      section.appendChild(title);
      const list = document.createElement('ul');
      list.className = `list-disc pl-5 space-y-1 h-32 overflow-y-auto palette-${type.toLowerCase()}`;
      section.appendChild(list);
      this.panel.appendChild(section);
    });

    this.container.appendChild(this.panel);

    // Toggle panel visibility
    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.panel.style.display = this.isOpen ? 'block' : 'none';
    });

    const http = new HttpInterceptorClient(environment.apiUrl);
    const tasksApi = new TasksApiService(http);
    const storiesApi = new StoriesApiService(http);
    const goalsApi = new GoalsApiService(http);

    const listMap = {
      task: this.panel.querySelector('.palette-task') as HTMLUListElement,
      story: this.panel.querySelector('.palette-story') as HTMLUListElement,
      goal: this.panel.querySelector('.palette-goal') as HTMLUListElement,
    };

    tasksApi.getTasks().subscribe(tasks => {
      console.log('tasks response:', tasks);
      tasks.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t.title;
        li.draggable = true;
        li.addEventListener('dragstart', (e: DragEvent) => {
          const dt = e.dataTransfer;
          if (!dt) return;
          dt.setData('application/json', JSON.stringify({ type: 'task', dto: t }));
          dt.effectAllowed = 'copy';
        });
        listMap.task.appendChild(li);
      });
    });
    storiesApi.getStories().subscribe(stories => {
      console.log('stories response:', stories);
      stories.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s.title;
        li.draggable = true;
        li.addEventListener('dragstart', (e: DragEvent) => {
          const dt = e.dataTransfer;
          if (!dt) return;
          dt.setData('application/json', JSON.stringify({ type: 'story', dto: s }));
          dt.effectAllowed = 'copy';
        });
        listMap.story.appendChild(li);
      });
    });
    goalsApi.getGoals().subscribe(goals => {
      console.log('goals response:', goals);
      goals.forEach(g => {
        const li = document.createElement('li');
        li.textContent = g.title;
        li.draggable = true;
        li.addEventListener('dragstart', (e: DragEvent) => {
          const dt = e.dataTransfer;
          if (!dt) return;
          dt.setData('application/json', JSON.stringify({ type: 'goal', dto: g }));
          dt.effectAllowed = 'copy';
        });
        listMap.goal.appendChild(li);
      });
    });

    search.addEventListener('input', () => {
      const term = search.value.toLowerCase();
      [listMap.task, listMap.story, listMap.goal].forEach(list => {
        Array.from(list.children).forEach(child => {
          const el = child as HTMLElement;
          const text = el.textContent || '';
          el.style.display = text.toLowerCase().includes(term) ? '' : 'none';
        });
      });
    });
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
