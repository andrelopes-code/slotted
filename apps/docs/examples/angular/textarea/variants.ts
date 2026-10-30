import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-variants',
  imports: [SlField, SlFieldLabel, SlStack, SlTextarea],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Return reason</label>
        <textarea
          slTextarea
          variant="outline"
          [rows]="2"
          defaultValue="Two jars arrived with broken seals."
        ></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Warehouse note</label>
        <textarea
          slTextarea
          variant="subtle"
          [rows]="2"
          defaultValue="Restock on shelf B4 after inspection."
        ></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Picker comment</label>
        <textarea
          slTextarea
          variant="plain"
          [rows]="2"
          defaultValue="Counted twice, 46 units on hand."
        ></textarea>
      </div>
    </div>
  `,
})
export class TextareaVariants {}
