import { Component } from '@angular/core';
import { provideButtonDefaults, SlButton, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-defaults',
  imports: [SlButton, SlButtonStart, SlGlyph, SlInline],
  providers: [provideButtonDefaults({ size: 'sm', tone: 'secondary', variant: 'outline' })],
  template: `
    <div slInline [gap]="2">
      <button slButton>
        <span slButtonStart><svg slGlyph name="funnel"></svg></span>
        Filter
      </button>
      <button slButton>Columns</button>
      <button slButton>Export</button>
      <button slButton tone="accent" variant="solid">
        <span slButtonStart><svg slGlyph name="plus"></svg></span>
        New order
      </button>
    </div>
  `,
})
export class ButtonDefaults {}
