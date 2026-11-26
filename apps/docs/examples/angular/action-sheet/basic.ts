import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-action-sheet-basic',
  imports: [SL_ACTION_SHEET, SlButton, SlGlyph],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Order actions</button>
    <sl-action-sheet #sheet="slActionSheet">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Order SO-20418</h2>
        <p slActionSheetMessage>Harbor Freight Supply, 12 lines, $4,820.00.</p>
      </header>
      <div slActionSheetList>
        <button slActionSheetItem value="copy">
          <span slActionSheetItemIcon><svg slGlyph name="copy"></svg></span>
          Copy order link
        </button>
        <button slActionSheetItem value="invoice">
          <span slActionSheetItemIcon><svg slGlyph name="download"></svg></span>
          Download invoice
        </button>
        <button slActionSheetItem value="edit">
          <span slActionSheetItemIcon><svg slGlyph name="pencil"></svg></span>
          Edit order
        </button>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetBasic {}
