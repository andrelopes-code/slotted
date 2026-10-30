import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
  type PopoverChangeRequest,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-form',
  imports: [
    SlButton,
    SlField,
    SlFieldLabel,
    SlInline,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverFooter,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText size="sm">Chai: {{ onHand() }} units on hand</span>
      <ng-container
        slPopover
        initialFocus="input"
        [(open)]="open"
        (openChangeRequest)="guard($event)"
      >
        <button slButton size="sm" tone="secondary" variant="outline" slPopoverTrigger>
          Adjust stock
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Adjust Chai stock</div>
              <p slPopoverDescription>Seattle warehouse, bin A-14</p>
            </div>
            <div slPopoverBody>
              <div slStack [gap]="3">
                <div slField>
                  <label slFieldLabel>Counted quantity</label>
                  <div slNumberField>
                    <input
                      slNumberFieldInput
                      min="0"
                      [value]="count()"
                      (valueChange)="count.set($event.value)"
                    />
                    <span slNumberFieldEnd>units</span>
                  </div>
                </div>
                <div slField>
                  <label slFieldLabel>Reason</label>
                  <div slTextField>
                    <input
                      slTextFieldInput
                      [value]="note()"
                      (valueChange)="note.set($event.value)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div slPopoverFooter>
              <button slButton size="sm" tone="secondary" variant="ghost" (click)="open.set(false)">
                Cancel
              </button>
              <button slButton size="sm" [disabled]="count() === null" (click)="save()">
                Save
              </button>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class PopoverForm {
  readonly open = signal(false);
  readonly onHand = signal(39);
  readonly count = signal<number | null>(39);
  readonly note = signal('');
  readonly dirty = computed(() => this.count() !== this.onHand() || this.note() !== '');

  guard(request: PopoverChangeRequest): void {
    if (!request.value && request.reason === 'outsidePress' && this.dirty()) {
      request.cancel();
      return;
    }
    if (request.value) {
      this.count.set(this.onHand());
      this.note.set('');
    }
  }

  save(): void {
    const count = this.count();
    if (count !== null) this.onHand.set(count);
    this.open.set(false);
  }
}
