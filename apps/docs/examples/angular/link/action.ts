import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlLink } from '@slotted/angular/link';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-action',
  imports: [SlButton, SlLink, SlText],
  template: `
    <span slText>
      Invoice INV-2026-08-0041 was sent to the buyer on September 3.
      <a slLink href="#invoice">View the invoice</a>
      or <button slButton inline type="button">send it again</button>.
    </span>
  `,
})
export class LinkAction {}
