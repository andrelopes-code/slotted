import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
  type DialogChangeRequest,
} from '@slotted/angular/dialog';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

const CARRIERS = [
  { value: 'ups', label: 'UPS Ground', description: '3–5 business days' },
  { value: 'fedex', label: 'FedEx 2Day', description: '2 business days' },
  { value: 'usps', label: 'USPS Priority Mail', description: '1–3 business days' },
];

function weightError(value: string): string {
  if (value.trim() === '') return 'Enter the total weight of the packages.';
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0) return 'Enter a weight above 0, such as 18.4.';
  return '';
}

@Component({
  selector: 'app-dialog-create-shipment',
  imports: [
    SlButton,
    SlCheckbox,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton [slDialogTrigger]="dialog">Create shipment</button>
      <sl-dialog #dialog="slDialog" size="lg" [(open)]="open" (openChangeRequest)="guard($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>Create a shipment</h2>
          <p slDialogDescription>
            Order SO-1182 for Contoso Foods: 6 items to 1200 Pike St, Seattle.
          </p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <form id="create-shipment" novalidate (submit)="submit($event)">
            <div slStack [gap]="5">
              <div slField>
                <label slFieldLabel>Carrier</label>
                <sl-select name="carrier" [items]="carriers" [(value)]="carrier">
                  @for (option of carriers; track option.value) {
                    <sl-select-item [value]="option.value" [description]="option.description">
                      {{ option.label }}
                    </sl-select-item>
                  }
                </sl-select>
              </div>
              <div slField required [invalid]="error() !== '' ? true : undefined">
                <label slFieldLabel>Weight in kilograms</label>
                <span slFieldDescription>All packages together, as weighed at the dock.</span>
                <div slTextField>
                  <input
                    slTextFieldInput
                    inputmode="decimal"
                    name="weight"
                    [value]="weight()"
                    (valueChange)="weight.set($event.value)"
                  />
                </div>
                <span slFieldError live="polite" reserve>{{ error() }}</span>
              </div>
              <div slCheckbox defaultChecked name="notify">
                Email the tracking number to the customer
              </div>
            </div>
          </form>
        </div>
        <footer slDialogFooter>
          <button
            slButton
            variant="ghost"
            tone="secondary"
            [disabled]="saving()"
            (click)="open.set(false)"
          >
            Cancel
          </button>
          <button
            slButton
            form="create-shipment"
            type="submit"
            [loading]="saving()"
            [messages]="{ loading: 'Creating shipment' }"
          >
            Create shipment
          </button>
        </footer>
      </sl-dialog>
      @if (created(); as message) {
        <span slText role="status" size="sm" tone="muted">{{ message }}</span>
      }
    </div>
  `,
})
export class DialogCreateShipment {
  readonly carriers = CARRIERS;
  readonly open = signal(false);
  readonly carrier = signal<SelectSelection>('ups');
  readonly weight = signal('');
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly created = signal<string | null>(null);
  readonly error = computed(() => (this.submitted() ? weightError(this.weight()) : ''));

  guard(request: DialogChangeRequest): void {
    if (!request.value && this.saving()) {
      request.cancel();
      return;
    }
    if (request.value) {
      this.weight.set('');
      this.submitted.set(false);
    }
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (weightError(this.weight()) !== '') return;
    this.saving.set(true);
    setTimeout(() => {
      const label = CARRIERS.find((option) => option.value === this.carrier())?.label;
      this.saving.set(false);
      this.created.set(`Shipment SH-4472 created with ${label}.`);
      this.open.set(false);
    }, 1200);
  }
}
