import { Component } from '@angular/core';
import { provideBadgeDefaults, SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-badge-defaults',
  imports: [SlBadge, SlInline, SlStack, SlText],
  providers: [
    provideBadgeDefaults({ locale: 'de-DE', max: false, size: 'sm', variant: 'outline' }),
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <span slBadge tone="info">Pending</span>
        <span slBadge tone="success">Approved</span>
        <span slBadge size="md" tone="danger" variant="solid">Rejected</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge tone="secondary" [count]="12480"></span>
        <span slText>Units in stock</span>
      </div>
    </div>
  `,
})
export class BadgeDefaults {}
