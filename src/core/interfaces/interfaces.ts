// interfaces.ts

// Інтерфейс задачі (Task)
export interface Task {
    id: number;             // Унікальний ідентифікатор задачі
    title: string;          // Назва задачі
    description: string;    // Короткий опис задачі
    status: 'pending' | 'in-progress' | 'done'; // Статус виконання
    priority: 'low' | 'medium' | 'high';         // Пріоритет задачі
    dueDate: Date;          // Кінцевий термін виконання
    x: number;              // Координата X на полотні
    y: number;              // Координата Y на полотні
}

// Інтерфейс залежності між задачами (TaskDependency)
export interface TaskDependency {
    fromTaskId: number;     // Ідентифікатор задачі, яка блокує чи впливає
    toTaskId: number;       // Ідентифікатор задачі, на яку впливає
    type: 'blocks' | 'dependsOn'; // Тип залежності (наприклад, "блокує" або "залежить")
}
