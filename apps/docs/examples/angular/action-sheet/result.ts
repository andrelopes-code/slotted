import { Component, signal } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import type { ActionSheetChangeRequest } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-action-sheet-result',
  imports: [SL_ACTION_SHEET, SlButton, SlInline, SlText],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slActionSheetTrigger]="sheet">Ticket</button>
      <sl-action-sheet
        #sheet="slActionSheet"
        [(open)]="open"
        (openChangeRequest)="handleRequest($event)"
      >
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Support ticket T-3306</h2>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="assign">Assign to me</button>
          <button slActionSheetItem value="escalate">Escalate to billing</button>
          <button slActionSheetItem value="resolve">Mark as resolved</button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
      <span slText size="sm">Last request: {{ last() }}</span>
    </div>
  `,
})
export class ActionSheetResult {
  protected readonly open = signal(false);
  protected readonly last = signal('none');

  protected handleRequest(request: ActionSheetChangeRequest): void {
    this.last.set(
      request.result === undefined ? request.reason : `${request.reason}: ${request.result}`,
    );
  }
}
