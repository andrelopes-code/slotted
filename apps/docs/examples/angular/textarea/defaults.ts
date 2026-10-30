import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { provideTextareaDefaults, SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-defaults',
  imports: [SlField, SlFieldLabel, SlStack, SlTextarea],
  providers: [provideTextareaDefaults({ variant: 'subtle', resize: 'none' })],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Reply to the customer</label>
        <textarea slTextarea [rows]="2" defaultValue="Your refund was issued today."></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Internal note</label>
        <textarea slTextarea [rows]="2" defaultValue="Refund approved by finance."></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Escalation summary</label>
        <textarea
          slTextarea
          variant="outline"
          [rows]="2"
          defaultValue="Second refund request this quarter."
        ></textarea>
      </div>
    </div>
  `,
})
export class TextareaDefaults {}
