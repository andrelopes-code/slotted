import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';

@Component({
  selector: 'app-badge-link',
  imports: [SlBadge],
  template: `<a slBadge href="#backordered" tone="warning" variant="outline">Backordered</a>`,
})
export class BadgeLink {}
