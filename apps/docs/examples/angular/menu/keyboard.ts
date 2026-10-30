import { Component, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import {
  SlMenu,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
  type MenuSelectEvent,
} from '@slotted/angular/menu';
import { SlText } from '@slotted/angular/typography';

const FORMATS = ['CSV', 'PDF', 'Excel'];

@Component({
  selector: 'app-menu-keyboard',
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
    <div slInline align="center" wrap="wrap" [gap]="3">
      <button slButton variant="outline" [slMenuTriggerFor]="order">
        Order
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #order>
        <button slMenuItem shortcut="Mod+E" (select)="ran('Edit order', $event)">Edit order</button>
        <button slMenuItem shortcut="Mod+D" (select)="ran('Duplicate', $event)">Duplicate</button>
        <button slMenuItem [slMenuTriggerFor]="exportAs">Export as</button>
        <sl-menu #exportAs>
          @for (format of formats; track format) {
            <button slMenuItem (select)="ran('Export as ' + format, $event)">{{ format }}</button>
          }
        </sl-menu>
        <hr slMenuSeparator />
        <button slMenuItem (select)="ran('Archive', $event)">Archive</button>
      </sl-menu>
      <span slText size="sm" tone="muted">{{ last() }}</span>
    </div>
  `,
})
export class MenuKeyboard {
  protected readonly formats = FORMATS;
  protected readonly last = signal('Focus Order, then press ArrowDown.');

  protected ran(command: string, event: MenuSelectEvent): void {
    this.last.set(`${command}, by ${event.reason}`);
  }
}
