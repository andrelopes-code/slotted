import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-variants',
  imports: [SlButton, SlInline],
  template: `
    <div slInline [gap]="2">
      <button slButton>Publish invoice</button>
      <button slButton tone="secondary" variant="outline">Save draft</button>
      <button slButton tone="secondary" variant="ghost">Discard</button>
    </div>
  `,
})
export class ButtonVariants {}
