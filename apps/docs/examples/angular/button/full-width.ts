import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-button-full-width',
  imports: [SlButton, SlStack],
  template: `
    <div slStack [gap]="2">
      <button slButton fullWidth>Pay $1,240.00</button>
      <button slButton fullWidth tone="secondary" variant="outline">Pay by bank transfer</button>
    </div>
  `,
})
export class ButtonFullWidth {}
