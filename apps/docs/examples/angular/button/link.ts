import { Component } from '@angular/core';
import { SlButtonEnd, SlButtonLink } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-button-link',
  imports: [SlButtonEnd, SlButtonLink, SlGlyph, SlInline],
  template: `
    <div slInline [gap]="2">
      <a slButtonLink href="/invoices/INV-2041">
        View invoice
        <span slButtonEnd><svg slGlyph name="chevron-right"></svg></span>
      </a>
      <a slButtonLink disabled href="/statements/2026-09.pdf" tone="secondary" variant="outline">
        Download statement
      </a>
    </div>
  `,
})
export class ButtonLinkExample {}
