import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-visually-hidden-count',
  imports: [SlGlyph, SlInline, SlStack, SlText, SlVisuallyHidden],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <svg slGlyph name="bell"></svg>
        <span slText numeric="tabular" weight="semibold">3</span>
        <span slVisuallyHidden>unread notifications</span>
      </div>
      <p slText size="sm" tone="muted">
        Visible: a bell and 3. Read aloud: 3 unread notifications.
      </p>
    </div>
  `,
})
export class VisuallyHiddenCount {}
