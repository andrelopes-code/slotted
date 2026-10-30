import { Component } from '@angular/core';
import { SlButton, SlButtonEnd, SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import {
  SlSplitButton,
  SlSplitButtonMenuTrigger,
  SlSplitButtonPrimary,
} from '@slotted/angular/split-button';

@Component({
  selector: 'app-menu-triggers',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlIconButton,
    SlInline,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlSplitButton,
    SlSplitButtonMenuTrigger,
    SlSplitButtonPrimary,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slMenuTriggerFor]="exportMenu">
        Export
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #exportMenu>
        <button slMenuItem>CSV for spreadsheets</button>
        <button slMenuItem>PDF summary</button>
        <button slMenuItem>Accounting journal</button>
      </sl-menu>

      <button slIconButton aria-label="More actions for SO-10482" [slMenuTriggerFor]="more">
        <svg slGlyph name="ellipsis"></svg>
      </button>
      <sl-menu #more align="end">
        <button slMenuItem>Copy order number</button>
        <button slMenuItem>Add internal note</button>
        <button slMenuItem>Open customer</button>
      </sl-menu>

      <div slSplitButton>
        <button slSplitButtonPrimary>Ship order</button>
        <button
          slSplitButtonMenuTrigger
          aria-label="More ways to ship"
          [slMenuTriggerFor]="ship"
        ></button>
        <sl-menu #ship>
          <button slMenuItem>Ship and print label</button>
          <button slMenuItem>Ship part of the order…</button>
          <button slMenuItem>Schedule for tomorrow</button>
        </sl-menu>
      </div>
    </div>
  `,
})
export class MenuTriggers {}
