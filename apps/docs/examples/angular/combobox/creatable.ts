import { Component, signal } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const CATEGORIES = ['Apparel', 'Bags', 'Home', 'Kitchen', 'Stationery', 'Outdoor'];

@Component({
  selector: 'app-combobox-creatable',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Category</label>
      <sl-combobox
        creatable
        placeholder="Type “Garden” to add it"
        [(value)]="value"
        (create)="create($event.query)"
      >
        @for (category of categories(); track category) {
          <sl-combobox-item [value]="category" [label]="category" />
        }
      </sl-combobox>
      <span slFieldDescription>{{ categories().length }} categories</span>
    </div>
  `,
})
export class ComboboxCreatable {
  protected readonly categories = signal(CATEGORIES);
  protected readonly value = signal<string | null>(null);

  protected create(query: string) {
    this.categories.update((held) => [...held, query]);
    this.value.set(query);
  }
}
