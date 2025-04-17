// src/core/UIManager.ts
import { Component } from './Component.ts';

export class UIManager {
  private components: Component<any>[] = [];
  private container: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container with ID ${containerId} not found`);
    this.container = container;
  }

  public addComponent(component: Component<any>): void {
    this.components.push(component);
    component.render(this.container);
  }

  public clear(): void {
    this.components = [];
    this.container.innerHTML = '';
  }

  public updateAll(): void {
    this.components.forEach((component) => component.update());
  }
}
