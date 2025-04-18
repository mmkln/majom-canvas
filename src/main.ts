// main.ts
import { App } from './App.ts';
import { LocalStorageDataProvider } from './core/data/LocalStorageDataProvider.ts';

document.addEventListener('DOMContentLoaded', () => {
  const dataProvider = new LocalStorageDataProvider();
  const app = new App(dataProvider);
  app.init();
});
