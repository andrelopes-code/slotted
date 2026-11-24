import { Component } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription } from '@slotted/angular/alert';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-variants',
  imports: [SlAlert, SlAlertContent, SlAlertDescription, SlInline, SlLink, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <span slText>
        Review the <a slLink href="#history">payment history</a> before the due date.
      </span>
      <div slInline [gap]="3">
        <span slText size="sm" tone="muted">Invoice</span>
        <a slLink href="#invoice" underline="hover" variant="neutral">INV-2026-08-0041</a>
      </div>
      <section slAlert tone="accent" variant="solid">
        <div slAlertContent>
          <p slAlertDescription>
            Your trial ends in three days.
            <a slLink href="#plans" variant="inverse">Choose a plan</a>
          </p>
        </div>
      </section>
    </div>
  `,
})
export class LinkVariants {}
