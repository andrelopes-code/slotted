import { Component, signal } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import type { ActionSheetSelectEvent } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';

@Component({
  selector: 'app-action-sheet-loading',
  imports: [SL_ACTION_SHEET, SlButton, SlGlyph],
  template: `
    <button slButton variant="outline" [slActionSheetTrigger]="sheet">October invoices</button>
    <sl-action-sheet #sheet="slActionSheet" [(open)]="open">
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>October invoices</h2>
        <p slActionSheetMessage>142 invoices, $318,450.00.</p>
      </header>
      <div slActionSheetList>
        <button
          slActionSheetItem
          value="export"
          [loading]="exporting()"
          (select)="handleExport($event)"
        >
          <span slActionSheetItemIcon><svg slGlyph name="file-spreadsheet"></svg></span>
          Export as CSV
        </button>
        <button slActionSheetItem value="summary">
          <span slActionSheetItemIcon><svg slGlyph name="file-text"></svg></span>
          Print summary
        </button>
      </div>
      <div slActionSheetFooter><button slActionSheetCancel></button></div>
    </sl-action-sheet>
  `,
})
export class ActionSheetLoading {
  protected readonly open = signal(false);
  protected readonly exporting = signal(false);

  protected handleExport(event: ActionSheetSelectEvent): void {
    event.preventDefault();
    this.exporting.set(true);
    setTimeout(() => {
      this.exporting.set(false);
      this.open.set(false);
    }, 2500);
  }
}
