import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-count',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlStack, SlTextarea],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Gift message</label>
        <textarea
          slTextarea
          [rows]="2"
          maxlength="150"
          showCount
          defaultValue="Happy anniversary to the whole team at Alfreds Futterkiste."
        ></textarea>
        <span slFieldDescription>Printed on a card inside the box.</span>
      </div>
      <div slField>
        <label slFieldLabel>Product summary</label>
        <textarea
          slTextarea
          [rows]="3"
          countMax="120"
          showCount
          defaultValue="Hand-picked Darjeeling first flush, packed in resealable tins of 100 grams. Ships within two days."
        ></textarea>
        <span slFieldDescription>Search results cut summaries after 120 characters.</span>
      </div>
    </div>
  `,
})
export class TextareaCount {}
