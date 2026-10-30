import { Component, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuEmpty, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';

const LABELS = ['Fragile', 'Gift wrap', 'Priority', 'Wholesale'];

@Component({
  selector: 'app-menu-loading',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlMenu, SlMenuEmpty, SlMenuItem, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="labelMenu">
      Labels
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #labelMenu [loading]="labels() === null" (openChange)="load($event)">
      @if (labels(); as loaded) {
        @for (label of loaded; track label) {
          <button slMenuCheckboxItem>{{ label }}</button>
        }
      } @else {
        <div slMenuEmpty>Loading labels…</div>
      }
    </sl-menu>
  `,
})
export class MenuLoading {
  protected readonly labels = signal<string[] | null>(null);
  private requested = false;

  protected load(open: boolean): void {
    if (!open || this.requested) return;
    this.requested = true;
    setTimeout(() => this.labels.set(LABELS), 1200);
  }
}
