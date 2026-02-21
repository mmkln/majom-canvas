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
  private titleEl: HTMLElement;
  private titleInput: HTMLInputElement | null = null;
  private canvasSelect: HTMLSelectElement;
  private canvasListListener: ((event: Event) => void) | null = null;
  private isOpen = false;
  private titleListener: ((event: Event) => void) | null = null;
  private isEditingTitle = false;
  private currentTitle = 'New canvas';

  constructor(private scene: Scene) {
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-4 left-4 z-20 bg-white p-2 rounded shadow-lg';
    this.titleEl = document.createElement('div');
    this.titleEl.className =
      'text-lg font-semibold text-gray-900 leading-tight mb-1 cursor-text';
    this.titleEl.textContent = this.currentTitle;
    this.container.appendChild(this.titleEl);
    const canvasRow = document.createElement('div');
    canvasRow.className = 'flex items-center gap-2 mt-1';
    this.canvasSelect = document.createElement('select');
    this.canvasSelect.className =
      'w-full text-sm border border-gray-200 rounded px-2 py-1 bg-white';
    this.canvasSelect.disabled = true;
    const createBtn = document.createElement('button');
    createBtn.textContent = 'New';
    createBtn.className =
      'bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200 hover:bg-gray-200';
    canvasRow.append(this.canvasSelect, createBtn);
    this.container.appendChild(canvasRow);
    // Toggle button
    const toggle = document.createElement('button');
    toggle.textContent = '+ Add Element';
    toggle.className =
      'bg-blue-600 text-white px-3 py-1 rounded focus:outline-none hover:bg-blue-700 mt-1';
    this.container.appendChild(toggle);

    // Panel with search and lists
    this.panel = document.createElement('div');
    this.panel.className =
      'mt-2 bg-white border border-gray-300 rounded shadow-lg p-2 w-64 max-h-96 overflow-auto';
    this.panel.style.display = 'none';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search...';
    search.className =
      'border border-gray-300 rounded px-2 py-1 w-full mb-2 focus:outline-none';
    this.panel.appendChild(search);

    ['Task', 'Story', 'Goal'].forEach((type) => {
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

    let paletteLoaded = false;

    // Toggle panel visibility
    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.panel.style.display = this.isOpen ? 'block' : 'none';
      if (this.isOpen && !paletteLoaded) {
        loadPalette();
        paletteLoaded = true;
      }
    });
    this.titleEl.addEventListener('click', () => this.startTitleEdit());
    this.canvasSelect.addEventListener('change', () => {
      const id = this.canvasSelect.value;
      const name =
        this.canvasSelect.selectedOptions[0]?.textContent || 'New canvas';
      if (!id) return;
      window.dispatchEvent(
        new CustomEvent('canvasSelected', { detail: { id, name } })
      );
    });
    createBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('canvasCreateRequested'));
    });

    this.titleListener = (event: Event) => {
      const customEvent = event as CustomEvent<{ title?: string }>;
      const title = customEvent.detail?.title;
      if (typeof title === 'string') {
        this.currentTitle = title;
        if (this.titleInput) {
          this.titleInput.value = title;
        }
        this.titleEl.textContent = title;
      }
    };
    window.addEventListener('canvasTitleChanged', this.titleListener);
    this.canvasListListener = (event: Event) => {
      const customEvent = event as CustomEvent<{
        canvases?: Array<{ id: string; name: string }>;
        activeId?: string | null;
      }>;
      const canvases = customEvent.detail?.canvases || [];
      const activeId = customEvent.detail?.activeId || null;
      this.canvasSelect.innerHTML = '';
      if (canvases.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No canvases';
        this.canvasSelect.appendChild(opt);
        this.canvasSelect.disabled = true;
        return;
      }
      canvases.forEach((canvas) => {
        const opt = document.createElement('option');
        opt.value = canvas.id;
        opt.textContent = canvas.name;
        this.canvasSelect.appendChild(opt);
      });
      this.canvasSelect.disabled = false;
      if (activeId) {
        this.canvasSelect.value = activeId;
      }
    };
    window.addEventListener('canvasListUpdated', this.canvasListListener);

    const http = new HttpInterceptorClient(environment.apiUrl);
    const tasksApi = new TasksApiService(http);
    const storiesApi = new StoriesApiService(http);
    const goalsApi = new GoalsApiService(http);

    const listMap = {
      task: this.panel.querySelector('.palette-task') as HTMLUListElement,
      story: this.panel.querySelector('.palette-story') as HTMLUListElement,
      goal: this.panel.querySelector('.palette-goal') as HTMLUListElement,
    };

    const PAGE_SIZE = 50;
    let searchTimer: number | null = null;
    const clearLists = () => {
      listMap.task.innerHTML = '';
      listMap.story.innerHTML = '';
      listMap.goal.innerHTML = '';
    };
    const renderListItem = (
      list: HTMLUListElement,
      type: 'task' | 'story' | 'goal',
      dto: any
    ) => {
      const li = document.createElement('li');
      li.textContent = dto.title;
      li.draggable = true;
      li.addEventListener('dragstart', (e: DragEvent) => {
        const dt = e.dataTransfer;
        if (!dt) return;
        dt.setData('application/json', JSON.stringify({ type, dto }));
        dt.effectAllowed = 'copy';
      });
      list.appendChild(li);
    };
    const loadPalette = (term: string = '') => {
      const searchTerm = term.trim();
      clearLists();
      tasksApi
        .fetchTasks({
          page: 1,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
        })
        .subscribe((res) => {
          res.results.forEach((t) => renderListItem(listMap.task, 'task', t));
        });
      storiesApi
        .fetchStories({
          page: 1,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
        })
        .subscribe((res) => {
          res.results.forEach((s) => renderListItem(listMap.story, 'story', s));
        });
      goalsApi
        .fetchGoals({
          page: 1,
          pageSize: PAGE_SIZE,
          search: searchTerm || undefined,
        })
        .subscribe((res) => {
          res.results.forEach((g) => renderListItem(listMap.goal, 'goal', g));
        });
    };
    search.addEventListener('input', () => {
      const term = search.value;
      if (searchTimer) {
        window.clearTimeout(searchTimer);
      }
      searchTimer = window.setTimeout(() => {
        if (!paletteLoaded) {
          paletteLoaded = true;
        }
        loadPalette(term);
      }, 300);
    });
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    if (this.titleListener) {
      window.removeEventListener('canvasTitleChanged', this.titleListener);
      this.titleListener = null;
    }
    if (this.canvasListListener) {
      window.removeEventListener('canvasListUpdated', this.canvasListListener);
      this.canvasListListener = null;
    }
    this.container.remove();
  }

  private startTitleEdit(): void {
    if (this.isEditingTitle) return;
    this.isEditingTitle = true;
    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.value = this.currentTitle;
    this.titleInput.className =
      'w-full text-lg font-semibold text-gray-900 leading-tight px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300';
    this.titleEl.replaceWith(this.titleInput);
    this.titleInput.focus();
    this.titleInput.select();
    const finishEdit = (apply: boolean): void => {
      if (!this.titleInput) return;
      const nextTitle = apply
        ? this.titleInput.value.trim() || 'New canvas'
        : this.currentTitle;
      this.currentTitle = nextTitle;
      this.titleEl.textContent = nextTitle;
      this.titleInput.replaceWith(this.titleEl);
      this.titleInput = null;
      this.isEditingTitle = false;
      if (apply) {
        window.dispatchEvent(
          new CustomEvent('canvasTitleEdited', { detail: { title: nextTitle } })
        );
      }
    };
    this.titleInput.addEventListener('blur', () => finishEdit(true));
    this.titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });
  }
}
