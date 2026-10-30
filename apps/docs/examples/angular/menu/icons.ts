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
  selector: 'app-menu-icons',
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
    <button slButton variant="outline" [slMenuTriggerFor]="invoice">
      Invoice INV-2041
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #invoice>
      <button slMenuItem shortcut="Mod+D">
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="copy"></svg></span
        ></span>
        Duplicate
      </button>
      <button slMenuItem shortcut="Mod+Enter">
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="external"></svg></span
        ></span>
        Open in new tab
      </button>
      <button slMenuItem shortcut="Mod+P">
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="file-text"></svg></span
        ></span>
        Print
      </button>
      <button slMenuItem>
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="pin"></svg></span
        ></span>
        Pin to dashboard
      </button>
      <button slMenuItem shortcut="Shift+Mod+R">Rename…</button>
      <hr slMenuSeparator />
      <button slMenuItem shortcut="Mod+Backspace" tone="danger">
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="trash"></svg></span
        ></span>
        Delete draft
      </button>
    </sl-menu>
  `,
})
export class MenuIcons {}
