import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import {
  SlSelect,
  SlSelectItem,
  type SelectOption,
  type SelectSelection,
} from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

const CARRIERS: SelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
];

const labelOf = (options: SelectOption[], value: SelectSelection) =>
  options.find((option) => option.value === value)?.label;

@Component({
  selector: 'app-select-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlText,
  ],
  template: `
    <form novalidate [formGroup]="form" (ngSubmit)="submit()" (reset)="clear()">
      <div slStack [gap]="5">
        <div slField required [invalid]="missing() ? true : undefined">
          <label slFieldLabel>Fulfilment warehouse</label>
          <sl-select
            name="warehouse"
            placeholder="Choose a warehouse"
            formControlName="warehouse"
            [items]="warehouses"
          >
            @for (warehouse of warehouses; track warehouse.value) {
              <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
            }
          </sl-select>
          <span slFieldError live="polite" reserve>{{
            missing() ? 'Choose the warehouse that ships this order.' : ''
          }}</span>
        </div>
        <div slField>
          <label slFieldLabel>Carrier</label>
          <sl-select name="carrier" formControlName="carrier" [items]="carriers">
            @for (carrier of carriers; track carrier.value) {
              <sl-select-item [value]="carrier.value">{{ carrier.label }}</sl-select-item>
            }
          </sl-select>
        </div>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save</button>
          <button slButton type="reset" tone="secondary" variant="outline">Reset</button>
          @if (saved(); as message) {
            <span slText size="sm" tone="muted">{{ message }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class SelectForm {
  protected readonly warehouses = WAREHOUSES;
  protected readonly carriers = CARRIERS;
  protected readonly form = new FormGroup({
    warehouse: new FormControl<SelectSelection>(null, Validators.required),
    carrier: new FormControl<SelectSelection>('ups', { nonNullable: true }),
  });
  private readonly warehouse = toSignal(this.form.controls.warehouse.valueChanges, {
    initialValue: this.form.controls.warehouse.value,
  });
  private readonly submitted = signal(false);
  protected readonly missing = computed(() => this.submitted() && this.warehouse() === null);
  protected readonly saved = signal<string | null>(null);

  protected submit(): void {
    this.submitted.set(true);
    const { warehouse, carrier } = this.form.getRawValue();
    this.saved.set(
      this.form.valid
        ? `Ships from ${labelOf(WAREHOUSES, warehouse)} by ${labelOf(CARRIERS, carrier)}.`
        : null,
    );
  }

  protected clear(): void {
    this.submitted.set(false);
    this.saved.set(null);
  }
}
