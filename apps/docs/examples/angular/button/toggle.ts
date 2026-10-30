import { Component, signal } from '@angular/core';
import { SlButtonStart, SlIconButton, SlToggleButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-button-toggle',
  imports: [SlButtonStart, SlGlyph, SlIconButton, SlInline, SlStack, SlText, SlToggleButton],
  template: `
    <div slStack [gap]="2">
      <div slInline align="center" [gap]="2">
        <button
          slToggleButton
          [pressed]="autoRefresh()"
          (pressedChange)="autoRefresh.set($event.value)"
        >
          Auto-refresh
        </button>
        <button slToggleButton defaultPressed>
          <span slButtonStart><svg slGlyph name="pin"></svg></span>
          Pin to dashboard
        </button>
        <button slIconButton aria-label="Mark as priority" [defaultPressed]="false">
          <svg slGlyph name="star"></svg>
        </button>
      </div>
      <span slText size="sm" tone="muted">
        {{ autoRefresh() ? 'Balances refresh every 30 seconds.' : 'Balances refresh on demand.' }}
      </span>
    </div>
  `,
})
export class ButtonToggle {
  readonly autoRefresh = signal(true);
}
