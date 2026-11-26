import { Component, signal } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-reason',
  imports: [SlGlyph, SlInline, SlStack, SlText, SlToggle, SlToggleIcon],
  template: `
    <div slStack [gap]="2">
      <div slInline>
        <button slToggle (pressedChange)="reason.set($event.reason)">
          <span slToggleIcon><svg slGlyph name="rotate-cw"></svg></span>
          Auto-refresh
        </button>
      </div>
      <span slText size="sm" tone="muted">
        {{ reason() === null ? 'No change yet.' : 'Last change: ' + reason() + '.' }}
      </span>
    </div>
  `,
})
export class ToggleReason {
  readonly reason = signal<string | null>(null);
}
