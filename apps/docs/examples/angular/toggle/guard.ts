import { Component, signal } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlToggle, SlToggleIcon } from '@slotted/angular/toggle';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-guard',
  imports: [SlGlyph, SlInline, SlStack, SlText, SlToggle, SlToggleIcon],
  template: `
    <div slStack [gap]="2">
      <div slInline>
        <button slToggle (pressedChange)="lock($event)">
          <span slToggleIcon><svg slGlyph name="lock"></svg></span>
          Lock period
        </button>
      </div>
      <span slText size="sm" tone="muted">{{ notice() }}</span>
    </div>
  `,
})
export class ToggleGuard {
  readonly notice = signal('Locking freezes the entries of March 2026.');

  lock(request: { value: boolean; cancel(): void }) {
    if (request.value) {
      this.notice.set('March 2026 is locked.');
      return;
    }

    request.cancel();
    this.notice.set('A locked period is reopened by the finance approver.');
  }
}
