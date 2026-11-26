import { Component, signal } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-controlled',
  imports: [SlGlyph, SlInline, SlStack, SlText, SlToggle, SlToggleIcon],
  template: `
    <div slStack [gap]="2">
      <div slInline>
        <button slToggle [pressed]="wrap()" (pressedChange)="wrap.set($event.value)">
          <span slToggleIcon><svg slGlyph name="text-wrap"></svg></span>
          Wrap lines
        </button>
      </div>
      <span slText size="sm" tone="muted">
        {{
          wrap()
            ? 'Long order notes wrap onto further lines.'
            : 'Long order notes stay on one line.'
        }}
      </span>
    </div>
  `,
})
export class ToggleControlled {
  readonly wrap = signal(false);
}
