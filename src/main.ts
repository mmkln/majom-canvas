// main.ts
import { App } from './App.ts';
import { DataProvider } from './core/data/DataProvider.ts';

document.addEventListener('DOMContentLoaded', () => {
  const dataProvider = new DataProvider();
  const app = new App(dataProvider);
  app.init();
});
