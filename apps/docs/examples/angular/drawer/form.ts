import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

const TERMS = [
  { value: 'due', label: 'Due on receipt' },
  { value: 'net-15', label: 'Net 15' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-60', label: 'Net 60' },
];

const CUSTOMER = { name: 'Contoso Foods', email: 'ap@contoso.com', terms: 'net-30' };

const termsLabel = (value: string) => TERMS.find((option) => option.value === value)?.label;

function nameError(value: string): string {
  return value.trim() === '' ? 'Enter the name printed on invoices.' : '';
}

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address invoices are sent to.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like ap@contoso.com.';
  return '';
}

@Component({
  selector: 'app-drawer-form',
  imports: [
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlField,
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
      <span slText role="status" size="sm" tone="muted">
        {{ customer().name }}, {{ customer().email }}, {{ termsLabel(customer().terms) }}
      </span>
      <button slButton [slDrawerTrigger]="drawer">Edit customer</button>
      <sl-drawer #drawer="slDrawer" [open]="open()" (openChange)="toggle($event)">
        <header slDrawerHeader>
          <h2 slDrawerTitle>Edit customer</h2>
          <p slDrawerDescription>Account C-0042, customer since March 2021.</p>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <form id="edit-customer" novalidate (submit)="submit($event)">
            <div slStack [gap]="4">
              <div slField required [invalid]="errors()?.name ? true : undefined">
                <label slFieldLabel>Company name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    autocomplete="organization"
                    [value]="name()"
                    (valueChange)="name.set($event.value)"
                  />
                </div>
                <span slFieldError live="polite" reserve>{{ errors()?.name }}</span>
              </div>
              <div slField required [invalid]="errors()?.email ? true : undefined">
                <label slFieldLabel>Billing email</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    type="email"
                    [value]="email()"
                    (valueChange)="email.set($event.value)"
                  />
                </div>
                <span slFieldError live="polite" reserve>{{ errors()?.email }}</span>
              </div>
              <div slField>
                <label slFieldLabel>Payment terms</label>
                <sl-select [items]="terms" [(value)]="term">
                  @for (option of terms; track option.value) {
                    <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                  }
                </sl-select>
              </div>
            </div>
          </form>
        </div>
        <footer slDrawerFooter>
          <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
            Cancel
          </button>
          <button slButton type="submit" form="edit-customer">Save customer</button>
        </footer>
      </sl-drawer>
    </div>
  `,
})
export class DrawerForm {
  readonly terms = TERMS;
  readonly termsLabel = termsLabel;
  readonly open = signal(false);
  readonly customer = signal(CUSTOMER);
  readonly name = signal(CUSTOMER.name);
  readonly email = signal(CUSTOMER.email);
  readonly term = signal<string | null>(CUSTOMER.terms);
  readonly submitted = signal(false);
  readonly errors = computed(() =>
    this.submitted() ? { name: nameError(this.name()), email: emailError(this.email()) } : null,
  );

  toggle(next: boolean): void {
    if (next) {
      this.name.set(this.customer().name);
      this.email.set(this.customer().email);
      this.term.set(this.customer().terms);
      this.submitted.set(false);
    }
    this.open.set(next);
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (nameError(this.name()) !== '' || emailError(this.email()) !== '') return;
    this.customer.set({
      name: this.name().trim(),
      email: this.email().trim(),
      terms: this.term() ?? this.customer().terms,
    });
    this.open.set(false);
  }
}
