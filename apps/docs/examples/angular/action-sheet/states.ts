import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-action-sheet-states',
  imports: [SL_ACTION_SHEET, SlButton, SlGlyph],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Invoice</button>
    <sl-action-sheet #sheet="slActionSheet">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Invoice INV-9302</h2>
      </header>
      <div slActionSheetList>
        <button slActionSheetItem value="approve">
          <span slActionSheetItemIcon><svg slGlyph name="circle-check"></svg></span>
          Approve invoice
          <span slActionSheetItemDescription>Needs a second approver above $5,000.</span>
        </button>
        <button slActionSheetItem disabled value="send">
          <span slActionSheetItemIcon><svg slGlyph name="upload"></svg></span>
          Send to accounting
          <span slActionSheetItemDescription>Available after approval.</span>
        </button>
        <button slActionSheetItem value="pdf">
          <span slActionSheetItemIcon><svg slGlyph name="download"></svg></span>
          Download PDF
        </button>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetStates {}
