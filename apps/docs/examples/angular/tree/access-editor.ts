import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';
import {
  SlTree,
  SlTreeCell,
  SlTreeDescription,
  SlTreeEmpty,
  type TreeValue,
} from '@slotted/angular/tree';
import { SlText } from '@slotted/angular/typography';

interface Scope {
  id: string;
  name: string;
  locked?: boolean;
  children?: Scope[];
}

const SCOPES: Scope[] = [
  {
    id: 'orders',
    name: 'Orders',
    children: [
      { id: 'orders.view', name: 'View orders' },
      { id: 'orders.edit', name: 'Edit orders' },
      { id: 'orders.refund', name: 'Issue refunds' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    children: [
      { id: 'finance.invoices', name: 'View invoices' },
      { id: 'finance.payouts', name: 'Approve payouts', locked: true },
    ],
  },
  { id: 'reports', name: 'Reports' },
];

@Component({
  selector: 'app-tree-access-editor',
  imports: [
    SlButton,
    SlGlyph,
    SlIcon,
    SlInline,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
    SlTree,
    SlTreeCell,
    SlTreeDescription,
    SlTreeEmpty,
  ],
  template: `
    <div slStack [gap]="3">
      <div slTextField clearable>
        <span slTextFieldStart
          ><span slIcon><svg slGlyph name="search"></svg></span
        ></span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Find a permission"
          [value]="query()"
          (valueChange)="query.set($event.value)"
        />
      </div>
      <div
        slTree
        aria-label="Permissions of the support role"
        expandOn="expander"
        variant="framed"
        selectionCascade="descendants"
        selectionMode="multiple"
        [expandedKeys]="['orders', 'finance']"
        [isNodeDisabled]="locked"
        [query]="query()"
        [(value)]="granted"
        [nodes]="scopes"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      >
        <ng-template slTreeCell="description" let-scope [slTreeCellOf]="scopes">
          @if (scope.locked) {
            <span slTreeDescription>Owners only</span>
          }
        </ng-template>
        <div slTreeEmpty>No permission matches</div>
      </div>
      <div slInline align="center" [gap]="3">
        <button slButton [disabled]="saved() === granted()" (click)="saved.set(granted())">
          Save role
        </button>
        <span slText role="status" size="sm" tone="muted"
          >{{ permissions() }} permissions granted</span
        >
      </div>
    </div>
  `,
})
export class TreeAccessEditor {
  protected readonly scopes = SCOPES;
  protected readonly key = (scope: Scope) => scope.id;
  protected readonly name = (scope: Scope) => scope.name;
  protected readonly children = (scope: Scope) => scope.children;
  protected readonly locked = (scope: Scope) => scope.locked === true;
  protected readonly query = signal('');
  protected readonly granted = signal<TreeValue>(['orders.view', 'finance.invoices']);
  protected readonly saved = signal(this.granted());
  protected readonly permissions = computed(
    () =>
      (this.granted() as readonly string[]).filter((key) => key.includes('.') || key === 'reports')
        .length,
  );
}
