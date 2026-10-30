import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';

@Component({
  selector: 'app-menu-basic',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="actions">
      Order actions
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #actions>
      <button slMenuItem>View order</button>
      <button slMenuItem shortcut="Mod+E">Edit order</button>
      <button slMenuItem shortcut="Mod+D">Duplicate</button>
      <button slMenuItem shortcut="Mod+P">Print packing slip</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">Cancel order…</button>
    </sl-menu>
  `,
})
export class MenuBasic {}
