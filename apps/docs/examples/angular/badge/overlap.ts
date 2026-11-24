import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge, SlBadgeAnchor } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-badge-overlap',
  imports: [SlAvatar, SlBadge, SlBadgeAnchor, SlInline, SlStack, SlText, SlVisuallyHidden],
  template: `
    <div slInline [gap]="8">
      <div slStack [gap]="2">
        <span slBadgeAnchor overlap="rectangle" placement="bottom-end">
          <span slAvatar name="Marta Okafor" size="lg"></span>
          <span slBadge shape="dot" size="sm" tone="success" variant="solid">
            <span slVisuallyHidden>Online</span>
          </span>
        </span>
        <span slText size="sm" tone="muted">rectangle</span>
      </div>
      <div slStack [gap]="2">
        <span slBadgeAnchor overlap="circle" placement="bottom-end">
          <span slAvatar name="Marta Okafor" size="lg"></span>
          <span slBadge shape="dot" size="sm" tone="success" variant="solid">
            <span slVisuallyHidden>Online</span>
          </span>
        </span>
        <span slText size="sm" tone="muted">circle</span>
      </div>
      <div slStack [gap]="2">
        <span slBadgeAnchor overlap="circle" placement="bottom-end" [offset]="{ x: 2, y: 2 }">
          <span slAvatar name="Marta Okafor" size="lg"></span>
          <span slBadge shape="dot" size="sm" tone="success" variant="solid">
            <span slVisuallyHidden>Online</span>
          </span>
        </span>
        <span slText size="sm" tone="muted">circle, offset 2px</span>
      </div>
    </div>
  `,
})
export class BadgeOverlap {}
