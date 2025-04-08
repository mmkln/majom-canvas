// src/core/Component.ts
interface ComponentProps {
  className?: string;
}

abstract class Component<T extends ComponentProps> {
  protected element: HTMLElement;

  constructor(protected props: T) {
    this.element = this.createElement();
  }

  protected abstract createElement(): HTMLElement;

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  public updateProps(newProps: Partial<T>): void {
    this.props = { ...this.props, ...newProps };
    this.update();
  }

  public update(): void {
    const newElement = this.createElement();
    this.element.replaceWith(newElement);
    this.element = newElement;
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

export { Component, ComponentProps };
