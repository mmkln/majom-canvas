// src/core/Component.ts
interface ComponentProps {
  className?: string;
}

abstract class Component<T extends ComponentProps> {
  protected element: HTMLElement;

  constructor(protected props: T) {
    this.element = this.createElement();
    this.attachComponentName(this.element);
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
    this.attachComponentName(newElement);
    this.element.replaceWith(newElement);
    this.element = newElement;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  protected getComponentName(): string {
    return this.constructor.name;
  }

  private attachComponentName(element: HTMLElement): void {
    element.setAttribute('data-component', this.getComponentName());
  }
}

export { Component, ComponentProps };
