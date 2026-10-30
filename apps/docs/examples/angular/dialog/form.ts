import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

function nameError(value: string): string {
  return value.trim() === '' ? 'Enter the contact’s full name.' : '';
}

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address the contact reads.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like ana@contoso.com.';
  return '';
}

@Component({
  selector: 'app-dialog-form',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldError,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton [slDialogTrigger]="dialog">Add contact</button>
      <sl-dialog #dialog="slDialog" [open]="open()" (openChange)="toggle($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>New contact</h2>
          <p slDialogDescription>Contoso Foods, Seattle.</p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <form id="new-contact" novalidate (submit)="submit($event)">
            <div slStack [gap]="4">
              <div slField required [invalid]="errors()?.name ? true : undefined">
                <label slFieldLabel>Full name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    autocomplete="name"
                    [value]="name()"
                    (valueChange)="name.set($event.value)"
                  />
                </div>
                <span slFieldError live="polite" reserve>{{ errors()?.name }}</span>
              </div>
              <div slField required [invalid]="errors()?.email ? true : undefined">
                <label slFieldLabel>Email</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    autocomplete="email"
                    type="email"
                    [value]="email()"
                    (valueChange)="email.set($event.value)"
                  />
                </div>
                <span slFieldError live="polite" reserve>{{ errors()?.email }}</span>
              </div>
            </div>
          </form>
        </div>
        <footer slDialogFooter>
          <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
            Cancel
          </button>
          <button slButton type="submit" form="new-contact">Add contact</button>
        </footer>
      </sl-dialog>
      @if (added(); as message) {
        <span slText role="status" size="sm" tone="muted">{{ message }}</span>
      }
    </div>
  `,
})
export class DialogForm {
  readonly open = signal(false);
  readonly name = signal('');
  readonly email = signal('');
  readonly submitted = signal(false);
  readonly added = signal<string | null>(null);
  readonly errors = computed(() =>
    this.submitted() ? { name: nameError(this.name()), email: emailError(this.email()) } : null,
  );

  toggle(next: boolean): void {
    if (next) {
      this.name.set('');
      this.email.set('');
      this.submitted.set(false);
    }
    this.open.set(next);
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    if (nameError(this.name()) !== '' || emailError(this.email()) !== '') return;
    this.added.set(`${this.name().trim()} was added to Contoso Foods.`);
    this.open.set(false);
  }
}
