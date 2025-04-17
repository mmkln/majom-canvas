// src/core/EventEmitter.ts
type Listener<T> = (data: T) => void;

export class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  public on(listener: Listener<T>): void {
    this.listeners.push(listener);
  }

  public emit(data: T): void {
    this.listeners.forEach((listener) => listener(data));
  }
}
