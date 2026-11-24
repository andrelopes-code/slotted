import { Component } from '@angular/core';
import { SlBadge, SlBadgeEnd, SlBadgeStart } from '@slotted/angular/badge';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-badge-glyphs',
  imports: [SlBadge, SlBadgeEnd, SlBadgeStart, SlGlyph, SlInline],
  template: `
    <div slInline [gap]="3">
      <span slBadge tone="warning">
        <span slBadgeStart><svg slGlyph name="clock"></svg></span>
        Due in 2 days
      </span>
      <span slBadge tone="info">
        Unassigned
        <span slBadgeEnd><svg slGlyph name="inbox"></svg></span>
      </span>
    </div>
  `,
})
export class BadgeGlyphs {}
