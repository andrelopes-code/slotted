import { Component, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-menu-keep-open',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlInline,
    SlMenu,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slMenuTriggerFor]="quantity">
        Adjust quantity
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #quantity>
        <button slMenuItem [closeOnSelect]="false" (select)="add(1)">Add 1 carton</button>
        <button slMenuItem [closeOnSelect]="false" (select)="add(10)">Add 10 cartons</button>
        <button slMenuItem [closeOnSelect]="false" (select)="add(-1)">Remove 1 carton</button>
        <hr slMenuSeparator />
        <button slMenuItem (select)="cartons.set(24)">Reset to ordered quantity</button>
      </sl-menu>
      <span slText size="sm" tone="muted">{{ cartons() }} cartons</span>
    </div>
  `,
})
export class MenuKeepOpen {
  protected readonly cartons = signal(24);

  protected add(count: number): void {
    this.cartons.update((current) => Math.max(0, current + count));
  }
}
