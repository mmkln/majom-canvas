// main.ts
import CanvasManager from './CanvasManager.js';
import { tasks, dependencies } from './dummyData.js';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement | null;
if (!canvas) {
    throw new Error('Canvas element with id "myCanvas" not found.');
}

const canvasManager = new CanvasManager(canvas);
canvasManager.init();
canvasManager.loadData(tasks, dependencies);
canvasManager.initEditModal();

// Приклад кнопки редагування: редагування поточно вибраного вузла
document.getElementById('btn-edit')?.addEventListener('click', () => {
    // Тут для прикладу редагування викликається для останнього вузла (або реалізуйте вибір)
    if (canvasManager.circles.length > 0) {
        canvasManager.editNode(canvasManager.circles.length - 1);
    }
});

// Автоматичне завантаження, якщо є збережений стан
const savedState = localStorage.getItem('diagramState');
if (savedState) {
    const state = JSON.parse(savedState);
    canvasManager.loadState(state);
}

document.getElementById('btn-save')?.addEventListener('click', () => {
    // Наприклад, зберігаємо стан діаграми в localStorage
    const state = canvasManager.serialize();
    localStorage.setItem('diagramState', JSON.stringify(state));
    alert('Діаграму збережено!');
});

document.getElementById('search')?.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    canvasManager.search(input.value);
});

document.getElementById('btn-load')?.addEventListener('click', () => {
    const savedState = localStorage.getItem('diagramState');
    if (savedState) {
        const state = JSON.parse(savedState);
        canvasManager.loadState(state);
    } else {
        alert('Збережений стан не знайдено.');
    }
});
