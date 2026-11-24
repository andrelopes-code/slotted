import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-link-underline',
  imports: [SlInline, SlLink, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="3">
        <span slText size="sm" tone="muted">always</span>
        <a slLink href="#register">Invoice register</a>
      </div>
      <div slInline [gap]="3">
        <span slText size="sm" tone="muted">hover</span>
        <a slLink href="#payments" underline="hover">Payment runs</a>
      </div>
      <div slInline [gap]="3">
        <span slText size="sm" tone="muted">none</span>
        <a slLink href="#suppliers" underline="none">Supplier directory</a>
      </div>
    </div>
  `,
})
export class LinkUnderline {}
