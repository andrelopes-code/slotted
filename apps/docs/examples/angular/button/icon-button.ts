import { Component } from '@angular/core';
import { SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-icon-button',
  imports: [SlGlyph, SlIconButton, SlInline],
  template: `
    <div slInline align="center" [gap]="2">
      <button slIconButton aria-label="Copy invoice number">
        <svg slGlyph name="copy"></svg>
      </button>
      <button slIconButton aria-label="Refresh balances" variant="outline">
        <svg slGlyph name="rotate-ccw"></svg>
      </button>
      <button slIconButton aria-label="Delete draft" tone="danger">
        <svg slGlyph name="trash"></svg>
      </button>
      <button slIconButton aria-label="Add note" shape="circle" tone="accent" variant="solid">
        <svg slGlyph name="plus"></svg>
      </button>
    </div>
  `,
})
export class ButtonIconButton {}
