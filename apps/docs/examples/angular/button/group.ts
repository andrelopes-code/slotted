import { Component } from '@angular/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlButtonGroup } from '@slotted/angular/button-group';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-button-group',
  imports: [SlButton, SlButtonGroup, SlGlyph, SlIconButton],
  template: `
    <div slButtonGroup aria-label="Invoice actions" tone="secondary" variant="outline">
      <button slButton>Edit</button>
      <button slButton>Duplicate</button>
      <button slButton>Send</button>
      <button slIconButton aria-label="More invoice actions">
        <svg slGlyph name="ellipsis"></svg>
      </button>
    </div>
  `,
})
export class ButtonGroupExample {}
