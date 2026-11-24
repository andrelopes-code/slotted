import { Component } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-inline-message-marks',
  imports: [SlGlyph, SlIcon, SlInlineMessage, SlInlineMessageIcon, SlStack],
  template: `
    <div slStack [gap]="2">
      <p slInlineMessage mark="glyph" tone="warning">Carrier pickup moved to 14:00.</p>
      <p slInlineMessage mark="dot" tone="warning">Pallet 118 is missing a label.</p>
      <p slInlineMessage mark="none" tone="warning">Dock 3 closes at 18:00.</p>
      <p slInlineMessage hideIcon tone="warning">Two orders share one delivery slot.</p>
      <p slInlineMessage tone="warning">
        <span slInlineMessageIcon slIcon><svg slGlyph name="clock"></svg></span>
        Orders placed after 16:00 ship tomorrow.
      </p>
    </div>
  `,
})
export class InlineMessageMarks {}
