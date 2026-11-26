import { Component } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';

@Component({
  selector: 'app-action-sheet-policy',
  imports: [SL_ACTION_SHEET, SlButton],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">Adjust stock</button>
    <sl-action-sheet #sheet="slActionSheet" back="none" escape="none" outsidePress="none">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Inventory adjustment</h2>
        <p slActionSheetMessage>SKU 40-1182 in Reno: 140 on hand, 132 counted.</p>
      </header>
      <div slActionSheetList>
        <button slActionSheetItem value="apply">Apply adjustment of -8</button>
        <button slActionSheetItem value="recount">Request a recount</button>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetPolicy {}
