import { BootOrchestrator } from './bootstrap/BootOrchestrator.ts';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('myCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element not found');
  }

  const orchestrator = new BootOrchestrator({ canvas });
  orchestrator.start();
});
