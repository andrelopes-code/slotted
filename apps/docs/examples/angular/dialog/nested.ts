import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';

const CARRIERS = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
];

@Component({
  selector: 'app-dialog-nested',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldLabel,
    SlSelect,
    SlSelectItem,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="order">
      Open order SO-1182
    </button>
    <sl-dialog #order="slDialog">
      <header slDialogHeader>
        <h2 slDialogTitle>Order SO-1182</h2>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slDescriptionList>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Customer</dt>
            <dd slDescriptionListDescription>Contoso Foods</dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Carrier</dt>
            <dd slDescriptionListDescription>{{ carrierLabel() }}</dd>
          </div>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton tone="secondary" variant="outline" [slDialogTrigger]="change">
          Change carrier
        </button>
        <sl-dialog #change="slDialog" size="sm" [open]="changing()" (openChange)="toggle($event)">
          <header slDialogHeader>
            <h2 slDialogTitle>Change carrier</h2>
            <button slDialogClose></button>
          </header>
          <div slDialogBody>
            <div slField>
              <label slFieldLabel>Carrier</label>
              <sl-select [items]="carriers" [(value)]="draft">
                @for (option of carriers; track option.value) {
                  <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                }
              </sl-select>
            </div>
          </div>
          <footer slDialogFooter>
            <button slButton variant="ghost" tone="secondary" (click)="changing.set(false)">
              Cancel
            </button>
            <button slButton (click)="use()">Use carrier</button>
          </footer>
        </sl-dialog>
      </footer>
    </sl-dialog>
  `,
})
export class DialogNested {
  readonly carriers = CARRIERS;
  readonly carrier = signal<SelectSelection>('ups');
  readonly draft = signal<SelectSelection>('ups');
  readonly changing = signal(false);
  readonly carrierLabel = computed(
    () => CARRIERS.find((option) => option.value === this.carrier())?.label,
  );

  toggle(next: boolean): void {
    if (next) this.draft.set(this.carrier());
    this.changing.set(next);
  }

  use(): void {
    this.carrier.set(this.draft());
    this.changing.set(false);
  }
}
