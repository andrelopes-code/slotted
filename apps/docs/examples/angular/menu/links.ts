import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuItem,
  SlMenuItemIcon,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

@Component({
  selector: 'app-menu-links',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuItemIcon,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="open">
      Open
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #open>
      <a slMenuItem href="#order-SO-10482">Order page</a>
      <a slMenuItem href="#customer-northwind">Customer profile</a>
      <hr slMenuSeparator />
      <a
        slMenuItem
        href="https://example.com/carriers/track/1Z999AA10123456784"
        rel="noreferrer"
        target="_blank"
      >
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="external"></svg></span
        ></span>
        Carrier tracking
      </a>
    </sl-menu>
  `,
})
export class MenuLinks {}
