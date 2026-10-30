import { Component, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import type { ChangeRequest } from '@slotted/core/state';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-menu-controlled',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlInline, SlMenu, SlMenuItem, SlMenuTrigger, SlText],
  template: `
    <div slInline align="center" wrap="wrap" [gap]="3">
      <button slButton variant="outline" [slMenuTriggerFor]="bulk">
        Bulk actions
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #bulk [(open)]="open" (openChangeRequest)="record($event)">
        <button slMenuItem>Mark 12 orders as packed</button>
        <button slMenuItem>Print 12 packing slips</button>
        <button slMenuItem>Export selection</button>
      </sl-menu>
      <button slButton variant="ghost" (click)="open.set(true)">Open from code</button>
      <span slText size="sm" tone="muted">{{ last() }}</span>
    </div>
  `,
})
export class MenuControlled {
  protected readonly open = signal(false);
  protected readonly last = signal('Closed');

  protected record(request: ChangeRequest<boolean>): void {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}`);
  }
}
