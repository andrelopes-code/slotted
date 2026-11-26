import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-basic',
  imports: [SlGlyph, SlToggle, SlToggleIcon],
  template: `
    <button slToggle>
      <span slToggleIcon><svg slGlyph name="pin"></svg></span>
      Pin header
    </button>
  `,
})
export class ToggleBasic {}
