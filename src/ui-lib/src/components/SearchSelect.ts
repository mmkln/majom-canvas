// src/components/SearchSelect.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { Input } from './Input.ts';
import { ComponentFactory } from '../core/ComponentFactory.ts';
import { EventEmitter } from '../core/EventEmitter.ts';

export interface SelectItem {
  value: string;
  label: string;
}

export interface SearchSelectProps {
  items: SelectItem[];
  placeholder?: string;
  className?: string;
  onSelect?: (selectedItem: string) => void;
  selectedValue?: string;
}

export class SearchSelect extends Component<SearchSelectProps> {
  private filterInput!: Input;
  private listContainer!: HTMLUListElement;
  private filteredItems!: SelectItem[];
  private isListVisible: boolean = false;
  private selectEmitter!: EventEmitter<string>;

  constructor(readonly props: SearchSelectProps) {
    super(props);
  }

  protected createElement(): HTMLElement {
    // Initialize filtered list
    this.filteredItems = [...this.props.items];
    // Determine initial filter input value based on selectedValue
    const initialLabel = this.props.selectedValue
      ? this.props.items.find((item) => item.value === this.props.selectedValue)
          ?.label || ''
      : '';

    this.filterInput = ComponentFactory.createInput({
      value: initialLabel,
      placeholder: this.props.placeholder ?? 'Search items...',
      onChange: (value: string) => this.filterItems(value),
    });

    // If a selectedValue is provided, filter list to that item
    if (this.props.selectedValue) {
      this.filteredItems = this.props.items.filter(
        (item) => item.value === this.props.selectedValue
      );
    }

    if (this.props.onSelect) {
      if (!this.selectEmitter) {
        this.selectEmitter = new EventEmitter<string>();
      }
      this.onSelect(this.props.onSelect);
    }

    const container = document.createElement('div');
    container.className = twMerge(
      'relative flex flex-col gap-2',
      this.props.className || ''
    );

    const inputWrapper = document.createElement('div');
    this.filterInput.render(inputWrapper);
    container.appendChild(inputWrapper);

    this.listContainer = document.createElement('ul');
    this.listContainer.className = twMerge(
      'absolute z-60 top-full left-0 w-full flex flex-col gap-2 mt-1 bg-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto',
      this.isListVisible ? 'block' : 'hidden'
    );
    this.renderItems();
    container.appendChild(this.listContainer);

    this.filterInput.getElement().addEventListener('focus', () => {
      this.isListVisible = true;
      this.updateListVisibility();
    });

    this.filterInput.getElement().addEventListener('blur', () => {
      setTimeout(() => {
        this.isListVisible = false;
        this.updateListVisibility();
      }, 150);
    });

    return container;
  }

  private filterItems(filter: string): void {
    const lowerFilter = filter.toLowerCase();
    this.filteredItems = this.props.items.filter((item) =>
      item.label.toLowerCase().includes(lowerFilter)
    );
    this.isListVisible = true;
    this.renderItems();
  }

  private renderItems(): void {
    this.listContainer.innerHTML = '';

    if (this.filteredItems.length === 0) {
      const noItemsMessage = document.createElement('li');
      noItemsMessage.textContent = 'No items found';
      noItemsMessage.className = twMerge(
        'px-3 py-2 text-gray-500 italic text-center bg-white rounded-lg border-2 border-gray-200'
      );
      this.listContainer.appendChild(noItemsMessage);
    } else {
      this.filteredItems.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.label;
        li.className = twMerge(
          'px-3 py-2 text-gray-800 hover:bg-gray-200 cursor-pointer'
        );
        li.addEventListener('click', () => {
          this.selectItem(item);
        });
        this.listContainer.appendChild(li);
      });
    }

    this.updateListVisibility();
  }

  private selectItem(item: SelectItem): void {
    // При виборі встановлюємо у інпут значення label,
    // але callback отримує value елемента.
    this.filterInput.setValue(item.label);
    this.isListVisible = false;
    this.selectEmitter.emit(item.value);
    this.updateListVisibility();
  }

  private updateListVisibility(): void {
    this.listContainer.className = twMerge(
      'absolute z-60 top-full left-0 w-full flex flex-col gap-2 mt-1 bg-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto',
      this.isListVisible ? 'block' : 'hidden'
    );
  }

  public updateItems(newItems: SelectItem[]): void {
    this.props.items = newItems;
    this.filteredItems = [...newItems];
    this.filterItems(this.filterInput.getValue());
  }

  public onSelect(listener: (selectedItem: string) => void): void {
    this.selectEmitter.on(listener);
  }

  public getSelectedValue(): string {
    return this.filterInput.getValue();
  }
}
