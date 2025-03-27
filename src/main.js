// main.ts
import CanvasManager from '../managers/CanvasManager.js';
const canvas = document.getElementById('myCanvas');
if (!canvas) {
    throw new Error('Canvas element with id "myCanvas" not found.');
}
const canvasManager = new CanvasManager(canvas);
canvasManager.init();
