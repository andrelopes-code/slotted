import { Component, computed, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlDrawer, SlDrawerBody, SlDrawerTrigger } from '@slotted/angular/drawer';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const STATUSES = [
  { value: 'processing', label: 'Processing', tone: 'accent' },
  { value: 'shipped', label: 'Shipped', tone: 'success' },
  { value: 'on-hold', label: 'On hold', tone: 'warning' },
] as const;

const ORDERS = [
  { id: 'SO-1182', customer: 'Contoso Foods', status: 'processing' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', status: 'shipped' },
  { id: 'SO-1184', customer: 'Tailspin Market', status: 'on-hold' },
  { id: 'SO-1185', customer: 'Adventure Works', status: 'processing' },
  { id: 'SO-1186', customer: 'Litware Deli', status: 'shipped' },
] as const;

@Component({
  selector: 'app-drawer-inline',
  imports: [
    SlBadge,
    SlButton,
    SlCheckbox,
    SlCheckboxGroup,
    SlDrawer,
    SlDrawerBody,
    SlDrawerTrigger,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline>
        <button slButton size="sm" tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
          Filters
        </button>
      </div>
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          min-block-size: 16rem;
          border: 1px solid var(--slotted-border-subtle);
          border-radius: var(--slotted-radius-lg);
          overflow: hidden;
        "
      >
        <sl-drawer #drawer="slDrawer" mode="inline" side="start" size="sm" [(open)]="open">
          <div slDrawerBody>
            <fieldset slFieldGroup>
              <legend slFieldGroupLegend>Status</legend>
              <div slCheckboxGroup [value]="statuses()" (valueChange)="statuses.set($event.value)">
                @for (status of options; track status.value) {
                  <div slCheckbox [value]="status.value">{{ status.label }}</div>
                }
              </div>
            </fieldset>
          </div>
        </sl-drawer>
        <div slStack [gap]="3" style="flex: 1 1 12rem; padding: var(--slotted-space-6)">
          <span slText size="sm" tone="muted">{{ shown().length }} of {{ total }} orders</span>
          @for (order of shown(); track order.id) {
            <div slInline align="center" [gap]="3" justify="between">
              <div slStack [gap]="0">
                <span slText size="sm" weight="semibold">{{ order.id }}</span>
                <span slText size="sm" tone="muted">{{ order.customer }}</span>
              </div>
              <span slBadge [tone]="statusOf(order.status).tone">
                {{ statusOf(order.status).label }}
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DrawerInline {
  readonly options = STATUSES;
  readonly total = ORDERS.length;
  readonly open = signal(true);
  readonly statuses = signal<readonly string[]>(['processing', 'on-hold']);
  readonly shown = computed(() => ORDERS.filter((order) => this.statuses().includes(order.status)));

  statusOf(value: string) {
    return STATUSES.find((item) => item.value === value)!;
  }
}
