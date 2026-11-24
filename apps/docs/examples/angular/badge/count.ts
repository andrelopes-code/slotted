import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-badge-count',
  imports: [SlBadge, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline align="center" [gap]="3">
        <span slBadge tone="info" [count]="4"></span>
        <span slText>Open orders</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge tone="warning" [count]="128"></span>
        <span slText>Backorders, above the default ceiling of 99</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge tone="warning" [count]="1204" [max]="999"></span>
        <span slText>Pallets in transit, ceiling of 999</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge locale="de-DE" tone="success" [count]="1234567" [max]="false"></span>
        <span slText>Units shipped, no ceiling, de-DE digits</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge showZero tone="secondary" [count]="0"></span>
        <span slText>Open returns, zero shown</span>
      </div>
    </div>
  `,
})
export class BadgeCount {}
