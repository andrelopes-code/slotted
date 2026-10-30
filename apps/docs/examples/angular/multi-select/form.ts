import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
];

const CHANNELS: MultiSelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
];

@Component({
  selector: 'app-multi-select-form',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlMultiSelect,
    SlMultiSelectItem,
    SlStack,
    SlText,
  ],
  template: `
    <form novalidate [formGroup]="form" (ngSubmit)="submit()" (reset)="clear()">
      <div slStack [gap]="5">
        <div slField required [invalid]="missing() ? true : undefined">
          <label slFieldLabel>Stocking warehouses</label>
          <sl-multi-select
            name="warehouses"
            placeholder="Add a warehouse"
            formControlName="warehouses"
            [items]="warehouses"
            (valueChange)="missing.set(false)"
          >
            @for (warehouse of warehouses; track warehouse.value) {
              <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
            }
          </sl-multi-select>
          <span slFieldError live="polite" reserve>{{
            missing() ? 'Choose at least one warehouse to stock this product.' : ''
          }}</span>
        </div>
        <div slField>
          <label slFieldLabel>Sales channels</label>
          <sl-multi-select name="channels" formControlName="channels" [items]="channels">
            @for (channel of channels; track channel.value) {
              <sl-multi-select-item [value]="channel.value" [label]="channel.label" />
            }
          </sl-multi-select>
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
export class MultiSelectForm {
  protected readonly warehouses = WAREHOUSES;
  protected readonly channels = CHANNELS;
  /* The control's own Validator reports required, so none is written here. */
  protected readonly form = new FormGroup({
    warehouses: new FormControl<readonly string[]>([], { nonNullable: true }),
    channels: new FormControl<readonly string[]>(['web'], { nonNullable: true }),
  });
  protected readonly missing = signal(false);
  protected readonly saved = signal<string | null>(null);

  protected submit(): void {
    this.missing.set(this.form.controls.warehouses.invalid);
    const { warehouses } = this.form.getRawValue();
    this.saved.set(
      this.form.valid
        ? `Saved with ${warehouses.length} of ${WAREHOUSES.length} warehouses.`
        : null,
    );
  }

  protected clear(): void {
    this.missing.set(false);
    this.saved.set(null);
  }
}
