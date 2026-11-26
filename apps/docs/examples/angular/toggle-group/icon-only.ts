import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlToggleGroup, SlToggleGroupIcon, SlToggleGroupItem } from '@slotted/angular/toggle-group';

@Component({
  selector: 'app-toggle-group-icon-only',
  imports: [SlGlyph, SlToggleGroup, SlToggleGroupIcon, SlToggleGroupItem],
  template: `
    <div slToggleGroup aria-label="Order flags" multiple [defaultValue]="['starred']">
      <button slToggleGroupItem value="starred" aria-label="Starred">
        <span slToggleGroupIcon><svg slGlyph name="star"></svg></span>
      </button>
      <button slToggleGroupItem value="pinned" aria-label="Pinned">
        <span slToggleGroupIcon><svg slGlyph name="pin"></svg></span>
      </button>
      <button slToggleGroupItem value="watching" aria-label="Watching">
        <span slToggleGroupIcon><svg slGlyph name="bell"></svg></span>
      </button>
    </div>
  `,
})
export class ToggleGroupIconOnly {}
