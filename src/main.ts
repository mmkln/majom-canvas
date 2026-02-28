import { BootOrchestrator } from './bootstrap/BootOrchestrator.ts';

document.addEventListener('DOMContentLoaded', () => {
  const orchestrator = new BootOrchestrator();
  orchestrator.start();
});
