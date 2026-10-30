import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-sizes',
  imports: [SlField, SlFieldLabel, SlStack, SlTextarea],
  template: `
    <div slStack [gap]="5">
      <div slField size="sm">
        <label slFieldLabel>Line item note</label>
        <textarea
          slTextarea
          [rows]="2"
          defaultValue="Pack the glass bottles separately."
        ></textarea>
      </div>
      <div slField size="md">
        <label slFieldLabel>Order note</label>
        <textarea
          slTextarea
          [rows]="2"
          defaultValue="The customer asked for delivery before noon on Friday."
        ></textarea>
      </div>
      <div slField size="lg">
        <label slFieldLabel>Message to the supplier</label>
        <textarea
          slTextarea
          [rows]="2"
          defaultValue="Please confirm the revised quantities by Wednesday."
        ></textarea>
      </div>
    </div>
  `,
})
export class TextareaSizes {}
