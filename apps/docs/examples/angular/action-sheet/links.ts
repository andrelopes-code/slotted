import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-action-sheet-links',
  imports: [SL_ACTION_SHEET, SlButton, SlGlyph],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Open</button>
    <sl-action-sheet #sheet="slActionSheet">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Order SO-10482</h2>
      </header>
      <div slActionSheetList>
        <a slActionSheetItem href="#order-SO-10482">Order page</a>
        <a slActionSheetItem href="#customer-northwind">Customer profile</a>
        <a
          slActionSheetItem
          href="https://example.com/carriers/track/1Z999AA10123456784"
          rel="noreferrer"
          target="_blank"
        >
          <span slActionSheetItemIcon><svg slGlyph name="external"></svg></span>
          Carrier tracking
        </a>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetLinks {}
