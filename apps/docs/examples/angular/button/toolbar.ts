import { Component } from '@angular/core';
import { SlButton, SlButtonStart, SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlToolbar, SlToolbarSeparator, SlToolbarSpacer } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-button-toolbar',
  imports: [
    SlButton,
    SlButtonStart,
    SlGlyph,
    SlIconButton,
    SlText,
    SlToolbar,
    SlToolbarSeparator,
    SlToolbarSpacer,
  ],
  template: `
    <div slToolbar aria-label="Order SO-1187">
      <button slButton tone="secondary" variant="ghost">
        <span slButtonStart><svg slGlyph name="file-text"></svg></span>
        Packing slip
      </button>
      <button slButton tone="secondary" variant="ghost">Duplicate</button>
      <div slToolbarSeparator></div>
      <button slIconButton aria-label="Copy order number">
        <svg slGlyph name="copy"></svg>
      </button>
      <button
        slIconButton
        aria-describedby="delete-reason"
        aria-label="Delete order"
        disabled
        focusableWhenDisabled
        tone="danger"
      >
        <svg slGlyph name="trash"></svg>
      </button>
      <div slToolbarSpacer></div>
      <span slText id="delete-reason" size="sm" tone="muted">
        Shipped orders cannot be deleted.
      </span>
    </div>
  `,
})
export class ButtonToolbar {}
