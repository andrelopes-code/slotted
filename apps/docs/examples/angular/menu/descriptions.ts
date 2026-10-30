import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuItemDescription, SlMenuTrigger } from '@slotted/angular/menu';

@Component({
  selector: 'app-menu-descriptions',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="refund">
      Refund
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #refund>
      <button slMenuItem>
        Full refund
        <span slMenuItemDescription>Returns $1,240.00 to the card used at checkout.</span>
      </button>
      <button slMenuItem>
        Partial refund…
        <span slMenuItemDescription>Choose the lines and the amount to return.</span>
      </button>
      <button slMenuItem>
        Store credit
        <span slMenuItemDescription>Adds $1,240.00 to the customer's account balance.</span>
      </button>
    </sl-menu>
  `,
})
export class MenuDescriptions {}
