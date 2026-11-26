import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-variants',
  imports: [SlGlyph, SlInline, SlStack, SlToggle, SlToggleIcon],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <button slToggle defaultPressed variant="outline">
          <span slToggleIcon><svg slGlyph name="pin"></svg></span>
          Pin header
        </button>
        <button slToggle variant="outline">
          <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
          Wrap lines
        </button>
      </div>
      <div slInline [gap]="2">
        <button slToggle defaultPressed variant="ghost">
          <span slToggleIcon><svg slGlyph name="bell"></svg></span>
          Notify me
        </button>
        <button slToggle variant="ghost">
          <span slToggleIcon><svg slGlyph name="star"></svg></span>
          Starred only
        </button>
      </div>
      <div slInline [gap]="2">
        <button slToggle defaultPressed variant="chips">Late pickups</button>
        <button slToggle variant="chips">Low stock</button>
      </div>
    </div>
  `,
})
export class ToggleVariants {}
