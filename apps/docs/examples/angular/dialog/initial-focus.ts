import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

const CUSTOMERS = [
  'Contoso Foods',
  'Fabrikam Grocers',
  'Northwind Traders',
  'Tailspin Market',
  'Wide World Importers',
  'Woodgrove Deli',
];

@Component({
  selector: 'app-dialog-initial-focus',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      Find a customer
    </button>
    <sl-dialog #dialog="slDialog" [initialFocus]="search" (openChange)="$event && query.set('')">
      <header slDialogHeader>
        <h2 slDialogTitle>Find a customer</h2>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slStack [gap]="4">
          <div slTextField>
            <input
              #search
              slTextFieldInput
              aria-label="Customer name"
              placeholder="Search by name"
              type="search"
              [value]="query()"
              (valueChange)="query.set($event.value)"
            />
          </div>
          <div slStack [gap]="2">
            @for (name of matches(); track name) {
              <span slText size="sm">{{ name }}</span>
            }
          </div>
        </div>
      </div>
    </sl-dialog>
  `,
})
export class DialogInitialFocus {
  readonly query = signal('');
  readonly matches = computed(() =>
    CUSTOMERS.filter((name) => name.toLowerCase().includes(this.query().toLowerCase())),
  );
}
