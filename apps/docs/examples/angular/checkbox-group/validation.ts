import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupError, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-group-validation',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlCheckbox,
    SlCheckboxGroup,
    SlFieldGroup,
    SlFieldGroupError,
    SlFieldGroupLegend,
    SlInline,
    SlStack,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <fieldset slFieldGroup required>
          <legend slFieldGroupLegend>Send shipping confirmations by</legend>
          <span slFieldGroupError live="polite" reserve>{{
            missing ? 'Choose at least one channel.' : ''
          }}</span>
          <div slCheckboxGroup [formControl]="channels" [invalid]="missing ? true : undefined">
            <div slCheckbox value="email">Email</div>
            <div slCheckbox value="sms">Text message</div>
            <div slCheckbox value="in-app">In-app notification</div>
          </div>
        </fieldset>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Save preferences</button>
          @if (submitted() && channels.valid) {
            <span role="status">Preferences saved.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class CheckboxGroupValidation {
  /* The group is the form control and its validator: inside a required field
     group, an empty selection fails with { required: true }. */
  readonly channels = new FormControl<readonly string[]>([], { nonNullable: true });
  readonly submitted = signal(false);

  get missing(): boolean {
    return this.submitted() && this.channels.invalid;
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
}
