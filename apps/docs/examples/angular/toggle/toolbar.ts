import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';
import { SlToolbar, SlToolbarSeparator } from '@slotted/angular/toolbar';

@Component({
  selector: 'app-toggle-toolbar',
  imports: [SlGlyph, SlToggle, SlToggleIcon, SlToolbar, SlToolbarSeparator],
  template: `
    <div slToolbar aria-label="Order table view">
      <button slToggle defaultPressed variant="ghost">
        <span slToggleIcon><svg slGlyph name="pin"></svg></span>
        Pin header
      </button>
      <button slToggle variant="ghost">
        <span slToggleIcon><svg slGlyph name="star"></svg></span>
        Starred only
      </button>
      <div slToolbarSeparator></div>
      <button slToggle variant="ghost">
        <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
        Wrap lines
      </button>
    </div>
  `,
})
export class ToggleToolbar {}
