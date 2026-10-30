import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV' },
  { code: 'CMH', city: 'Columbus, OH' },
  { code: 'SAV', city: 'Savannah, GA' },
];

@Component({
  selector: 'app-combobox-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlCombobox,
    SlComboboxItem,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div slStack [gap]="4">
        <div slField required [invalid]="missing()">
          <label slFieldLabel>Fulfil from</label>
          <sl-combobox
            formControlName="warehouse"
            placeholder="Search warehouses"
            (valueChange)="$event && missing.set(false)"
          >
            @for (warehouse of warehouses; track warehouse.code) {
              <sl-combobox-item [value]="warehouse.code" [label]="warehouse.city" />
            }
          </sl-combobox>
          @if (missing()) {
            <span slFieldError>Choose the warehouse that ships this order.</span>
          }
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Create transfer</button>
          @if (submitted(); as line) {
            <span slText size="sm" tone="muted">Submitted {{ line }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class ComboboxForm {
  protected readonly warehouses = WAREHOUSES;
  protected readonly form = new FormGroup({
    warehouse: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly missing = signal(false);
  protected readonly submitted = signal<string | null>(null);

  protected submit() {
    const warehouse = this.form.value.warehouse;
    this.missing.set(this.form.invalid);
    this.submitted.set(this.form.valid ? `warehouse=${warehouse}` : null);
  }
}
