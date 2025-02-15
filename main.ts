// main.ts
import CanvasManager from './CanvasManager.js';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement | null;
if (!canvas) {
    throw new Error('Canvas element with id "myCanvas" not found.');
}

const canvasManager = new CanvasManager(canvas);
canvasManager.init();
