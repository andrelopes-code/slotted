import { Component, computed, signal } from '@angular/core';
import { SL_ACTION_SHEET } from '@slotted/angular/action-sheet';
import type { ActionSheetSelectEvent } from '@slotted/angular/action-sheet';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-action-sheet-keep-open',
  imports: [SL_ACTION_SHEET, SlButton, SlInline, SlText],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slActionSheetTrigger]="sheet">Load route 14</button>
      <sl-action-sheet #sheet="slActionSheet" [closeOnSelect]="false" [messages]="messages">
        <header slActionSheetHeader>
          <h2 slActionSheetTitle>Route 14, Reno to Sacramento</h2>
          <p slActionSheetMessage>Press a pallet to add it or take it off the truck.</p>
        </header>
        <div slActionSheetList>
          <button slActionSheetItem value="P-118" (select)="handleToggle($event)">
            Pallet P-118, 24 cartons
          </button>
          <button slActionSheetItem value="P-119" (select)="handleToggle($event)">
            Pallet P-119, 18 cartons
          </button>
          <button slActionSheetItem value="P-124" (select)="handleToggle($event)">
            Pallet P-124, 30 cartons
          </button>
          <hr slActionSheetSeparator />
          <button slActionSheetItem value="dispatch" [closeOnSelect]="true">
            Dispatch route 14
          </button>
        </div>
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      </sl-action-sheet>
      <span slText size="sm">Loaded: {{ summary() }}</span>
    </div>
  `,
})
export class ActionSheetKeepOpen {
  protected readonly messages = { cancel: 'Done' };
  protected readonly loaded = signal<string[]>([]);
  protected readonly summary = computed(() =>
    this.loaded().length === 0 ? 'none' : this.loaded().join(', '),
  );

  protected handleToggle(event: ActionSheetSelectEvent): void {
    const pallet = event.value ?? '';
    this.loaded.update((current) =>
      current.includes(pallet) ? current.filter((id) => id !== pallet) : [...current, pallet],
    );
  }
}
