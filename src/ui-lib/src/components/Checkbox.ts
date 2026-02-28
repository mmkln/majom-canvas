import { EventEmitter } from '../core/EventEmitter.ts';

export interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  stopPropagation?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
}

const BASE_LABEL_CLASS = 'select-none';
const BASE_INPUT_CLASS = 'sr-only';
const BASE_INDICATOR_CLASS =
  'w-4 h-4 flex items-center justify-center border-2 rounded-full transition duration-150 ease-in-out';
const UNCHECKED_ENABLED_CLASS =
  'border-gray-400 hover:border-gray-500 bg-white';
const UNCHECKED_DISABLED_CLASS = 'border-gray-300 bg-gray-100';
const CHECKED_ENABLED_CLASS =
  'bg-blue-600 border-blue-600';
const CHECKED_DISABLED_CLASS = 'bg-gray-300 border-gray-300';
const CHECKMARK_WRAPPER_CLASS = 'text-white';
const CHECKMARK_SVG_CLASS = 'w-3 h-3';
const INDICATOR_FOCUS_CLASS = 'ring-2 ring-blue-500 ring-offset-1';

export class Checkbox {
  private readonly changeEmitter = new EventEmitter<boolean>();
  private cvaChange: (checked: boolean) => void = () => undefined;
  private cvaTouch: () => void = () => undefined;
  private className = '';
  private checkedValue = false;
  private disabledValue = false;
  private labelValue = '';
  private ariaLabelValue = '';
  private stopPropagationValue = false;
  private focused = false;
  private root: HTMLLabelElement | null = null;
  private input: HTMLInputElement | null = null;
  private indicator: HTMLDivElement | null = null;
  private checkmarkWrapper: HTMLSpanElement | null = null;

  constructor(props: CheckboxProps = {}) {
    this.checkedValue = props.checked ?? false;
    this.disabledValue = props.disabled ?? false;
    this.labelValue = props.label ?? '';
    this.ariaLabelValue = props.ariaLabel ?? '';
    this.stopPropagationValue = props.stopPropagation ?? false;
    this.className = props.className ?? '';
    if (props.onChange) {
      this.onChange(props.onChange);
    }
  }

  public get checked(): boolean {
    return this.checkedValue;
  }

  public get disabled(): boolean {
    return this.disabledValue;
  }

  public get label(): string {
    return this.labelValue;
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.getElement());
  }

  public getElement(): HTMLLabelElement {
    return this.ensureElement();
  }

  private createElement(): HTMLLabelElement {
    const root = document.createElement('label');
    root.addEventListener('click', (event) => {
      if (this.stopPropagationValue) {
        event.stopPropagation();
      }
    });

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = BASE_INPUT_CLASS;
    input.addEventListener('focus', () => {
      this.focused = true;
      this.syncDom();
    });
    input.addEventListener('blur', () => {
      this.focused = false;
      this.syncDom();
    });
    input.addEventListener('change', () => {
      this.toggleChecked();
    });

    const indicator = document.createElement('div');

    const checkmarkWrapper = document.createElement('span');
    checkmarkWrapper.className = CHECKMARK_WRAPPER_CLASS;
    checkmarkWrapper.appendChild(this.createCheckmarkIcon());

    indicator.appendChild(checkmarkWrapper);
    root.append(input, indicator);

    this.root = root;
    this.input = input;
    this.indicator = indicator;
    this.checkmarkWrapper = checkmarkWrapper;
    this.syncDom();

    return root;
  }

  public onChange(listener: (checked: boolean) => void): void {
    this.changeEmitter.on(listener);
  }

  public writeValue(value: unknown): void {
    this.setChecked(value === true);
  }

  public registerOnChange(fn: (checked: boolean) => void): void {
    this.cvaChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.cvaTouch = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabledValue = isDisabled;
    this.syncDom();
  }

  public getIndicatorClassName(): string {
    const classNames = [BASE_INDICATOR_CLASS, this.resolveIndicatorStateClass()];
    if (this.focused && !this.disabled) {
      classNames.push(INDICATOR_FOCUS_CLASS);
    }
    return classNames.join(' ');
  }

  public getRootClassName(): string {
    const classNames = [BASE_LABEL_CLASS];
    if (this.className) {
      classNames.push(this.className);
    }
    classNames.push(this.disabled ? 'cursor-not-allowed' : 'cursor-pointer');
    return classNames.join(' ');
  }

  public getResolvedAriaLabel(): string | null {
    const value = this.ariaLabelValue || this.labelValue;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  public toggleChecked(): void {
    if (this.disabled) {
      this.syncDom();
      return;
    }

    const next = !this.checked;
    this.setChecked(next);
    this.cvaChange(next);
    this.cvaTouch();
    this.changeEmitter.emit(next);
  }

  public setChecked(checked: boolean): void {
    this.checkedValue = checked;
    this.syncDom();
  }

  public isChecked(): boolean {
    return this.checked;
  }

  private syncDom(): void {
    if (
      !this.root ||
      !this.input ||
      !this.indicator ||
      !this.checkmarkWrapper
    ) {
      return;
    }

    this.root.className = this.getRootClassName();

    this.input.checked = this.checked;
    this.input.disabled = this.disabled;
    const ariaLabel = this.getResolvedAriaLabel();
    if (ariaLabel) {
      this.input.setAttribute('aria-label', ariaLabel);
    } else {
      this.input.removeAttribute('aria-label');
    }
    this.indicator.className = this.getIndicatorClassName();
    this.checkmarkWrapper.style.display = this.checked ? '' : 'none';
  }

  private ensureElement(): HTMLLabelElement {
    if (this.root) return this.root;
    return this.createElement();
  }

  private resolveIndicatorStateClass(): string {
    if (this.checked && this.disabled) return CHECKED_DISABLED_CLASS;
    if (this.checked && !this.disabled) return CHECKED_ENABLED_CLASS;
    if (!this.checked && this.disabled) return UNCHECKED_DISABLED_CLASS;
    return UNCHECKED_ENABLED_CLASS;
  }

  private createCheckmarkIcon(): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('class', CHECKMARK_SVG_CLASS);
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(ns, 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M4.5 12.75l6 6 9-13.5');
    svg.appendChild(path);

    return svg;
  }
}
