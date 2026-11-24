import { Component } from '@angular/core';
import { SlBadge, SlBadgeAnchor } from '@slotted/angular/badge';
import { SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-badge-placement',
  imports: [
    SlBadge,
    SlBadgeAnchor,
    SlGlyph,
    SlIconButton,
    SlInline,
    SlStack,
    SlText,
    SlVisuallyHidden,
  ],
  template: `
    <div slInline [gap]="8">
      @for (placement of placements; track placement) {
        <div slStack [gap]="2">
          <span slBadgeAnchor [placement]="placement">
            <button slIconButton type="button" aria-label="Open inbox">
              <svg slGlyph name="inbox"></svg>
            </button>
            <span slBadge shape="dot" size="sm" tone="danger" variant="solid">
              <span slVisuallyHidden>New messages</span>
            </span>
          </span>
          <span slText size="sm" tone="muted">{{ placement }}</span>
        </div>
      }
    </div>
  `,
})
export class BadgePlacement {
  protected readonly placements = ['top-end', 'top-start', 'bottom-end', 'bottom-start'] as const;
}
