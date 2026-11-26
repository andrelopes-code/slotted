import { Component, signal } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-action-sheet-modal',
  imports: [SL_ACTION_SHEET, SlButton, SlInline],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slActionSheetTrigger]="sheet">Dock 3 actions</button>
      <sl-action-sheet #sheet="slActionSheet" [modal]="false">
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Dock 3 receiving</h2>
          <p slActionSheetMessage>Keep scanning while this sheet stays open.</p>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem tone="warning" value="damaged">Flag damaged parcel</button>
          <button slActionSheetItem value="inspection">Hold for inspection</button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
      <button slButton (click)="scanned.update((count) => count + 1)">
        Scan parcel ({{ scanned() }})
      </button>
    </div>
  `,
})
export class ActionSheetModal {
  protected readonly scanned = signal(0);
}
