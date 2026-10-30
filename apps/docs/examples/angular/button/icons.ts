import { Component } from '@angular/core';
import { SlButton, SlButtonEnd, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-icons',
  imports: [SlButton, SlButtonEnd, SlButtonStart, SlGlyph, SlInline],
  template: `
    <div slInline [gap]="2">
      <button slButton>
        <span slButtonStart><svg slGlyph name="plus"></svg></span>
        New order
      </button>
      <button slButton tone="secondary" variant="outline">
        <span slButtonStart><svg slGlyph name="upload"></svg></span>
        Import CSV
      </button>
      <button slButton tone="secondary" variant="ghost">
        Continue to payment
        <span slButtonEnd><svg slGlyph name="chevron-right"></svg></span>
      </button>
    </div>
  `,
})
export class ButtonIcons {}
