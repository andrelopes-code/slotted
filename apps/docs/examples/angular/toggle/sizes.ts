import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-sizes',
  imports: [SlGlyph, SlInline, SlToggle, SlToggleIcon],
  template: `
    <div slInline align="center" [gap]="2">
      <button slToggle size="sm">
        <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
        Dense rows
      </button>
      <button slToggle size="md">
        <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
        Default rows
      </button>
      <button slToggle size="lg">
        <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
        Roomy rows
      </button>
    </div>
  `,
})
export class ToggleSizes {}
