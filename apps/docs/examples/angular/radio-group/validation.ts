import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlFieldGroup, SlFieldGroupError, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-radio-group-validation',
  imports: [
    ReactiveFormsModule,
    SlButton,
    SlFieldGroup,
    SlFieldGroupError,
    SlFieldGroupLegend,
    SlInline,
    SlRadio,
    SlRadioGroup,
    SlStack,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <div slStack [gap]="4">
        <fieldset slFieldGroup required>
          <legend slFieldGroupLegend>Return reason</legend>
          <span slFieldGroupError live="polite" reserve>{{
            missing ? 'Choose why the order is coming back.' : ''
          }}</span>
          <div slRadioGroup [formControl]="reason" [invalid]="missing ? true : undefined">
            <div slRadio value="damaged">Damaged in transit</div>
            <div slRadio value="wrong-item">Wrong item shipped</div>
            <div slRadio value="not-needed">No longer needed</div>
          </div>
        </fieldset>
        <div slInline [gap]="3" align="center">
          <button slButton type="submit">Request return</button>
          @if (submitted() && reason.valid) {
            <span role="status">Return requested.</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class RadioGroupValidation {
  /* The group is the form control and its validator: inside a required field
     group, an empty value fails with { required: true }. */
  readonly reason = new FormControl<string | null>(null);
  readonly submitted = signal(false);

  get missing(): boolean {
    return this.submitted() && this.reason.invalid;
  }

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
}
