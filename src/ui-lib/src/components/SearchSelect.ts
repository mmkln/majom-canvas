// src/components/SearchSelect.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { Input } from './Input.ts';
import { ComponentFactory } from '../core/ComponentFactory.ts';
import { EventEmitter } from '../core/EventEmitter.ts';
import {
  HUD_DROPDOWN_CLASS,
  HUD_MENU_ITEM_BASE_CLASS,
  HUD_MENU_ITEM_DEFAULT_CLASS,
  HUD_MENU_ITEM_SELECTED_CLASS,
} from '../hud/classNames.ts';

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
  private readonly selectEmitter = new EventEmitter<string>();
  private selectedValue: string | null;

  constructor(readonly props: SearchSelectProps) {
    super(props);
    this.selectedValue = props.selectedValue ?? null;
    if (props.onSelect) {
      this.onSelect(props.onSelect);
    }
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
      variant: 'default',
      value: initialLabel,
      placeholder: this.props.placeholder ?? 'Search items...',
      onInput: (value: string) => this.filterItems(value),
    });

    // If a selectedValue is provided, filter list to that item
    if (this.props.selectedValue) {
      this.filteredItems = this.props.items.filter(
        (item) => item.value === this.props.selectedValue
      );
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
      HUD_DROPDOWN_CLASS,
      'absolute left-0 top-full z-60 mt-2 max-h-60 w-full overflow-y-auto p-1',
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
        'px-4 py-3 text-center text-sm leading-5 text-slate-500'
      );
      this.listContainer.appendChild(noItemsMessage);
    } else {
      this.filteredItems.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'list-none';

        const option = document.createElement('button');
        option.type = 'button';
        option.className = twMerge(
          HUD_MENU_ITEM_BASE_CLASS,
          item.value === this.selectedValue
            ? HUD_MENU_ITEM_SELECTED_CLASS
            : HUD_MENU_ITEM_DEFAULT_CLASS
        );
        option.textContent = item.label;
        option.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });
        option.addEventListener('click', () => {
          this.selectItem(item);
        });

        li.appendChild(option);
        this.listContainer.appendChild(li);
      });
    }

    this.updateListVisibility();
  }

  private selectItem(item: SelectItem): void {
    // При виборі встановлюємо у інпут значення label,
    // але callback отримує value елемента.
    this.filterInput.setValue(item.label);
    this.selectedValue = item.value;
    this.isListVisible = false;
    this.selectEmitter.emit(item.value);
    this.renderItems();
    this.updateListVisibility();
  }

  private updateListVisibility(): void {
    this.listContainer.className = twMerge(
      HUD_DROPDOWN_CLASS,
      'absolute left-0 top-full z-60 mt-2 max-h-60 w-full overflow-y-auto p-1',
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
