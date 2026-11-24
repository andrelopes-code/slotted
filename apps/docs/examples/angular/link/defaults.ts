import { Component } from '@angular/core';
import { SlLink, provideLinkDefaults } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-link-defaults',
  imports: [SlLink, SlStack],
  providers: [provideLinkDefaults({ underline: 'hover', variant: 'neutral' })],
  template: `
    <div slStack [gap]="2">
      <a slLink href="#inv-0041">INV-2026-08-0041</a>
      <a slLink href="#inv-0042">INV-2026-08-0042</a>
      <a slLink href="#inv-0043">INV-2026-08-0043</a>
      <a slLink href="#register" underline="always" variant="accent">Open the invoice register</a>
    </div>
  `,
})
export class LinkApplicationDefaults {}
