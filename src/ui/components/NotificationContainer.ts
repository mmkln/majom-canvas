import { notifications$ } from '../../core/services/NotificationService.ts';

// Container for in-app notifications
export class NotificationContainer {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 flex flex-col gap-2 z-80';
    document.body.appendChild(this.container);
    notifications$.subscribe(({ message, type }) => {
      const note = document.createElement('div');
      note.className = `px-4 py-2 rounded shadow text-white ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
      }`;
      note.textContent = message;
      this.container.appendChild(note);
      setTimeout(() => {
        this.container.removeChild(note);
      }, 3000);
    });
  }

  mount(parent: HTMLElement = document.body): void {
    // Already appended in constructor
  }

  unmount(): void {
    document.body.removeChild(this.container);
  }
}
