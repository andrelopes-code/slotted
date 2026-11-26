import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-action-sheet-tones',
  imports: [SL_ACTION_SHEET, SlButton, SlGlyph],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Purchase order</button>
    <sl-action-sheet #sheet="slActionSheet">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Purchase order PO-7731</h2>
        <p slActionSheetMessage>Northwind Traders, 18 lines, due 14 October.</p>
      </header>
      <div slActionSheetList>
        <button slActionSheetItem tone="danger" value="void">
          <span slActionSheetItemIcon><svg slGlyph name="trash"></svg></span>
          Void purchase order
        </button>
        <button slActionSheetItem tone="warning" value="hold">
          <span slActionSheetItemIcon><svg slGlyph name="pause"></svg></span>
          Put payments on hold
        </button>
        <button slActionSheetItem tone="success" value="approve">
          <span slActionSheetItemIcon><svg slGlyph name="circle-check"></svg></span>
          Approve for purchasing
        </button>
        <button slActionSheetItem tone="accent" value="reassign">
          <span slActionSheetItemIcon><svg slGlyph name="person"></svg></span>
          Reassign buyer
        </button>
        <button slActionSheetItem tone="secondary" value="archive">
          <span slActionSheetItemIcon><svg slGlyph name="file-archive"></svg></span>
          Archive order
        </button>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetTones {}
