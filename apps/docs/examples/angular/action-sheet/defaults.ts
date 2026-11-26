import { Component } from '@angular/core';
import { provideActionSheetDefaults, SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-action-sheet-defaults',
  imports: [SL_ACTION_SHEET, SlButton, SlInline],
  providers: [provideActionSheetDefaults({ closeOnSelect: false, outsidePress: 'none' })],
  template: `
    <div slInline [gap]="3">
      <button slButton variant="outline" [slActionSheetTrigger]="picking">Picking</button>
      <sl-action-sheet #picking="slActionSheet">
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Picking wave 22</h2>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="start">Start picking</button>
          <button slActionSheetItem value="pause">Pause the wave</button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
      <button slButton variant="outline" [slActionSheetTrigger]="packing">Packing</button>
      <sl-action-sheet #packing="slActionSheet" [closeOnSelect]="true">
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Packing bench 6</h2>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="print">Print labels</button>
          <button slActionSheetItem value="close">Close the bench</button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
    </div>
  `,
})
export class ActionSheetDefaults {}
