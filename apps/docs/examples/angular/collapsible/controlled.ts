import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-collapsible-controlled',
  imports: [
    SlButton,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <button slButton size="sm" variant="outline" (click)="open.set(true)">
          Show pick list
        </button>
        <button slButton size="sm" variant="outline" (click)="open.set(false)">
          Hide pick list
        </button>
      </div>

      <div
        slCollapsible
        variant="framed"
        [(open)]="open"
        (openChangeRequest)="reason.set($event.reason)"
      >
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Pick list for wave 12</button>
        </div>
        <div slCollapsiblePanel>42 lines across 9 orders, starting at aisle B.</div>
      </div>

      <span slText size="sm" tone="muted">
        Reason of the last request from the trigger: {{ reason() }}.
      </span>
    </div>
  `,
})
export class CollapsibleControlled {
  protected readonly open = signal(false);
  protected readonly reason = signal('none yet');
}
