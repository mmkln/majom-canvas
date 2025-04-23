// interfaces.ts

// Інтерфейс задачі (Task)
import { ElementStatus } from '../../elements/ElementStatus.js';

export interface ITask {
  id: string; // Унікальний ідентифікатор задачі
  title: string; // Назва задачі
  description: string; // Короткий опис задачі
  status: ElementStatus; // Статус виконання
  priority: 'low' | 'medium' | 'high'; // Пріоритет задачі
  dueDate: Date; // Кінцевий термін виконання
  x: number; // Координата X на полотні
  y: number; // Координата Y на полотні
}

// Інтерфейс залежності між задачами (TaskDependency)
export interface TaskDependency {
  fromTaskId: string; // Ідентифікатор задачі, яка блокує чи впливає
  toTaskId: string; // Ідентифікатор задачі, на яку впливає
  type: 'blocks' | 'dependsOn'; // Тип залежності (наприклад, "блокує" або "залежить")
}

/**
 * Інтерфейс для збереження Story в LocalStorage
 */
export interface IStory {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  description: string;
  status: ElementStatus;
  priority: 'low' | 'medium' | 'high';
  tasks: string[]; // id задач, що належать цій Story
}

/**
 * Interface for saving Goal in LocalStorage
 */
export interface IGoal {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  status: ElementStatus;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  links: string[];
}

/**
 * Інтерфейс збереження стану перегляду (зум/скрол)
 */
export interface IViewState {
  scrollX: number;
  scrollY: number;
  scale: number;
}
