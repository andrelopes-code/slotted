import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-visually-hidden-basic',
  imports: [SlButton, SlGlyph, SlInline, SlVisuallyHidden],
  template: `
    <div slInline>
      <button slButton tone="danger" variant="outline">
        <svg slGlyph name="trash"></svg>
        <span slVisuallyHidden>Delete invoice INV-20418</span>
      </button>
    </div>
  `,
})
export class VisuallyHiddenBasic {}
