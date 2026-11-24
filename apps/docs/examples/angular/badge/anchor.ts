import { Component } from '@angular/core';
import { SlBadge, SlBadgeAnchor } from '@slotted/angular/badge';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-badge-anchor',
  imports: [SlBadge, SlBadgeAnchor, SlButton, SlGlyph, SlIconButton, SlInline, SlVisuallyHidden],
  template: `
    <div slInline align="center" [gap]="8">
      <span slBadgeAnchor>
        <button slIconButton type="button" aria-label="Notifications">
          <svg slGlyph name="bell"></svg>
        </button>
        <span slBadge size="sm" tone="danger" variant="solid" [count]="7">
          <span slVisuallyHidden>unread notifications</span>
        </span>
      </span>
      <span slBadgeAnchor>
        <button slButton type="button" aria-describedby="inbox-count">Inbox</button>
        <span id="inbox-count" slBadge size="sm" tone="accent" variant="solid" [count]="128">
          <span slVisuallyHidden>unread messages</span>
        </span>
      </span>
    </div>
  `,
})
export class BadgeAnchored {}
