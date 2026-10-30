import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const PEOPLE = [
  { id: 'avery', name: 'Avery Collins' },
  { id: 'kenji', name: 'Kenji Watanabe' },
  { id: 'lucia', name: 'Lucía Fernández' },
  { id: 'ruth', name: 'Ruth Adeyemi' },
  { id: 'tomasz', name: 'Tomasz Nowak' },
];

@Component({
  selector: 'app-combobox-controlled',
  imports: [SlButton, SlCombobox, SlComboboxItem, SlField, SlFieldLabel, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Reviewer</label>
        <sl-combobox placeholder="Search people" [(inputValue)]="text" [(value)]="value">
          @for (person of people; track person.id) {
            <sl-combobox-item [value]="person.id" [label]="person.name" />
          }
        </sl-combobox>
      </div>
      <div slInline [gap]="3" align="center">
        <button slButton size="sm" variant="outline" (click)="assignToMe()">Assign to me</button>
        <span slText size="sm" tone="muted"
          >Text “{{ text() }}” · Value {{ value() ?? 'none' }}</span
        >
      </div>
    </div>
  `,
})
export class ComboboxControlled {
  protected readonly people = PEOPLE;
  protected readonly text = signal('');
  protected readonly value = signal<string | null>(null);

  protected assignToMe() {
    this.value.set('ruth');
    this.text.set('Ruth Adeyemi');
  }
}
