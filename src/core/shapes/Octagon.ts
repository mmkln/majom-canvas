// core/shapes/Octagon.ts

import { IShape } from '../interfaces/shape';

export default class Octagon implements IShape {
  private static nextId = 0;
  public id: number;
  public x: number;
  public y: number;
  public radius: number;
  public fillColor: string;
  public strokeColor: string;
  public lineWidth: number;

  constructor(
    x: number,
    y: number,
    radius: number = 50,
    fillColor: string = '#0baef6',
    strokeColor: string = '#f3c92f',
    lineWidth: number = 1
  ) {
    this.id = Octagon.nextId++;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.lineWidth = lineWidth;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const sides = 8; // Восьмикутник
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2; // Починаємо з верхньої точки
      const px = this.x + this.radius * Math.cos(angle);
      const py = this.y + this.radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }

  contains(px: number, py: number): boolean {
    // Для спрощення використовуємо перевірку, чи точка всередині описаного кола
    // Для точнішого hit-test можна реалізувати перевірку всередині багатокутника
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  onDoubleClick?(): void {
    console.log(`Double clicked on hexagon ${this.id}`);
  }
}
