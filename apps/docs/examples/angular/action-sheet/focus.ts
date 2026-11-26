import { Component, computed, ElementRef, viewChild } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-action-sheet-focus',
  imports: [SL_ACTION_SHEET, SlButton, SlInline],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slActionSheetTrigger]="sheet">Label actions</button>
      <sl-action-sheet
        #sheet="slActionSheet"
        [finalFocus]="nextNode()"
        [initialFocus]="reprintNode()"
      >
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Shipment SH-4471</h2>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="slip">Print packing slip</button>
          <button #reprint slActionSheetItem value="reprint">Reprint shipping label</button>
          <button slActionSheetItem value="void">Void shipping label</button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
      <button #next slButton variant="ghost">Scan next parcel</button>
    </div>
  `,
})
export class ActionSheetFocus {
  private readonly reprint = viewChild('reprint', { read: ElementRef<HTMLElement> });
  private readonly next = viewChild('next', { read: ElementRef<HTMLElement> });
  protected readonly reprintNode = computed(() => this.reprint()?.nativeElement);
  protected readonly nextNode = computed(() => this.next()?.nativeElement);
}
