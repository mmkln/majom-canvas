// main.ts
import { App } from './App';
import { DataProvider } from './core/data/DataProvider';

document.addEventListener('DOMContentLoaded', () => {
  const dataProvider = new DataProvider();
  const app = new App(dataProvider);
  app.init();
});
