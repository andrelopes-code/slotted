import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-badge-shapes',
  imports: [SlBadge, SlInline, SlStack, SlText, SlVisuallyHidden],
  template: `
    <div slStack [gap]="3">
      <div slInline align="center" [gap]="3">
        <span slBadge shape="pill" tone="warning">Backordered</span>
        <span slText size="sm" tone="muted">pill</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge shape="square" tone="warning">Backordered</span>
        <span slText size="sm" tone="muted">square</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge shape="dot" tone="success" variant="solid">
          <span slVisuallyHidden>Online</span>
        </span>
        <span slText>Carrier API</span>
      </div>
    </div>
  `,
})
export class BadgeShapes {}
