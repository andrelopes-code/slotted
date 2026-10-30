import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-number-field-handle',
  imports: [SlButton, SlField, SlFieldLabel, SlInline, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slField>
        <label slFieldLabel>Cases of Chang</label>
        <div slNumberField>
          <input slNumberFieldInput #cases="slNumberFieldInput" defaultValue="4" min="0" max="48" />
        </div>
      </div>
      <div slInline [gap]="2">
        <button slButton variant="outline" (click)="cases.decrement()">Remove a case</button>
        <button slButton variant="outline" (click)="cases.increment()">Add a case</button>
      </div>
    </div>
  `,
})
export class NumberFieldHandleExample {}
