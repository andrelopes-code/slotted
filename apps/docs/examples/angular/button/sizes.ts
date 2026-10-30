import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-sizes',
  imports: [SlButton, SlInline],
  template: `
    <div slInline align="center" [gap]="2">
      <button slButton size="sm">Add line item</button>
      <button slButton size="md">Add line item</button>
      <button slButton size="lg">Add line item</button>
    </div>
  `,
})
export class ButtonSizes {}
