import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-badge-sizes',
  imports: [SlBadge, SlInline],
  template: `
    <div slInline align="center" [gap]="3">
      <span slBadge size="sm" tone="info">Small</span>
      <span slBadge size="md" tone="info">Medium</span>
      <span slBadge size="lg" tone="info">Large</span>
    </div>
  `,
})
export class BadgeSizes {}
