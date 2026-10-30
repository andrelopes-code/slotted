import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlToolbar, SlToolbarSpacer } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-toolbar',
  imports: [
    SlButton,
    SlCheckbox,
    SlCheckboxGroup,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlText,
    SlToolbar,
    SlToolbarSpacer,
  ],
  template: `
    <div slToolbar aria-label="Orders">
      <ng-container slPopover align="start">
        <button slButton size="sm" tone="secondary" variant="ghost" slPopoverTrigger>Status</button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Show orders that are</div>
            </div>
            <div slPopoverBody>
              <div
                slCheckboxGroup
                aria-label="Status"
                [value]="shown()"
                (valueChange)="shown.set($event.value)"
              >
                @for (status of statuses; track status.value) {
                  <div slCheckbox [value]="status.value">{{ status.label }}</div>
                }
              </div>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      <ng-container slPopover align="start">
        <button slButton size="sm" tone="secondary" variant="ghost" slPopoverTrigger>
          Columns
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Columns</div>
            </div>
            <div slPopoverBody>
              <div slCheckboxGroup aria-label="Columns" [defaultValue]="['customer', 'total']">
                <div slCheckbox value="customer">Customer</div>
                <div slCheckbox value="ship-via">Ship via</div>
                <div slCheckbox value="total">Total</div>
              </div>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
      <div slToolbarSpacer></div>
      <span slText size="sm" tone="muted">{{ count() }} orders</span>
    </div>
  `,
})
export class PopoverToolbar {
  readonly statuses = [
    { value: 'pending', label: 'Pending', orders: 14 },
    { value: 'shipped', label: 'Shipped', orders: 27 },
    { value: 'delivered', label: 'Delivered', orders: 112 },
    { value: 'returned', label: 'Returned', orders: 3 },
  ];
  readonly shown = signal<readonly string[]>(['pending', 'shipped']);
  readonly count = computed(() =>
    this.statuses
      .filter((status) => this.shown().includes(status.value))
      .reduce((sum, status) => sum + status.orders, 0),
  );
}
