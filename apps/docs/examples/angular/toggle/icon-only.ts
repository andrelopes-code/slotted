import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-icon-only',
  imports: [SlGlyph, SlInline, SlToggle, SlToggleIcon],
  template: `
    <div slInline [gap]="2">
      <button slToggle aria-label="Pin header">
        <span slToggleIcon><svg slGlyph name="pin"></svg></span>
      </button>
      <button slToggle aria-label="Starred only" defaultPressed>
        <span slToggleIcon><svg slGlyph name="star"></svg></span>
      </button>
      <button slToggle aria-label="Notify me">
        <span slToggleIcon><svg slGlyph name="bell"></svg></span>
      </button>
    </div>
  `,
})
export class ToggleIconOnly {}
