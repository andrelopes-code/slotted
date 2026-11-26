import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-states',
  imports: [SlGlyph, SlInline, SlToggle, SlToggleIcon],
  template: `
    <div slInline [gap]="2">
      <button slToggle>
        <span slToggleIcon><svg slGlyph name="pin"></svg></span>
        Pin header
      </button>
      <button slToggle defaultPressed>
        <span slToggleIcon><svg slGlyph name="bell"></svg></span>
        Notify me
      </button>
      <button slToggle disabled>
        <span slToggleIcon><svg slGlyph name="star"></svg></span>
        Starred only
      </button>
      <button slToggle defaultPressed disabled>
        <span slToggleIcon><svg slGlyph name="funnel"></svg></span>
        Carrier filter
      </button>
    </div>
  `,
})
export class ToggleStates {}
