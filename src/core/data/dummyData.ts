// dummyData.ts
import { Task, TaskDependency } from '../interfaces/interfaces.ts';

// Dummy data для задач
export const tasks: Task[] = [
  {
    id: '1',
    title: 'Підготувати специфікацію',
    description: 'Створити технічну документацію для нового проекту.',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2025-03-01'),
    x: 700,
    y: 100,
  },
  {
    id: '2',
    title: 'Розробка інтерфейсу',
    description: 'Створити прототип інтерфейсу користувача.',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date('2025-03-15'),
    x: 300,
    y: 150,
  },
  {
    id: '3',
    title: 'Впровадження API',
    description: 'Інтегрувати API для роботи з базою даних.',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2025-04-01'),
    x: 600,
    y: 400,
  },
  {
    id: '4',
    title: 'Тестування',
    description: 'Написати юніт-тести та провести інтеграційне тестування.',
    status: 'pending',
    priority: 'low',
    dueDate: new Date('2025-04-10'),
    x: 400,
    y: 350,
  },
  {
    id: '5',
    title: 'Тестування',
    description: 'Написати юніт-тести та провести інтеграційне тестування.',
    status: 'pending',
    priority: 'low',
    dueDate: new Date('2025-04-10'),
    x: 900,
    y: 390,
  },
];

// Dummy data для залежностей між задачами
export const dependencies: TaskDependency[] = [
  { fromTaskId: '1', toTaskId: '2', type: 'blocks' },
  { fromTaskId: '2', toTaskId: '3', type: 'dependsOn' },
  { fromTaskId: '3', toTaskId: '4', type: 'blocks' },
  { fromTaskId: '5', toTaskId: '1', type: 'blocks' },
  { fromTaskId: '5', toTaskId: '2', type: 'blocks' },
  { fromTaskId: '5', toTaskId: '3', type: 'blocks' },
];
