import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlToggleGroup, SlToggleGroupIcon, SlToggleGroupItem } from '@slotted/angular/toggle-group';

@Component({
  selector: 'app-toggle-group-icons',
  imports: [SlGlyph, SlToggleGroup, SlToggleGroupIcon, SlToggleGroupItem],
  template: `
    <div slToggleGroup aria-label="Listing visibility" [defaultValue]="['shown']">
      <button slToggleGroupItem value="shown">
        <span slToggleGroupIcon><svg slGlyph name="eye"></svg></span>
        Shown
      </button>
      <button slToggleGroupItem value="hidden">
        <span slToggleGroupIcon><svg slGlyph name="eye-off"></svg></span>
        Hidden
      </button>
    </div>
  `,
})
export class ToggleGroupIcons {}
