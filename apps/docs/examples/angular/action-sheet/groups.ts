import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';

@Component({
  selector: 'app-action-sheet-groups',
  imports: [SL_ACTION_SHEET, SlButton],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Shipment</button>
    <sl-action-sheet #sheet="slActionSheet">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Shipment SH-4471</h2>
      </header>
      <div slActionSheetList>
        <div slActionSheetGroup>
          <div slActionSheetGroupLabel>Notify</div>
          <button slActionSheetItem value="email-carrier">Email the carrier</button>
          <button slActionSheetItem value="text-consignee">Text the consignee</button>
        </div>
        <hr slActionSheetSeparator />
        <div slActionSheetGroup>
          <div slActionSheetGroupLabel>Documents</div>
          <button slActionSheetItem value="bill-of-lading">Download bill of lading</button>
          <button slActionSheetItem value="packing-slip">Print packing slip</button>
        </div>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetGroups {}
