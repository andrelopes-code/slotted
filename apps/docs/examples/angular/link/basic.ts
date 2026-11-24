import { Component } from '@angular/core';
import { SlLink } from '@slotted/angular/link';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-basic',
  imports: [SlLink, SlText],
  template: `
    <span slText>
      Payment is due 30 days after the invoice date. Read the
      <a slLink href="#terms">terms of service</a> before you confirm the order.
    </span>
  `,
})
export class LinkBasic {}
