import { Component, signal, type OnInit } from '@angular/core';
import type { GridColumn } from '@slotted/core/grid';
import { SlButton } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate } from '@slotted/angular/data-grid';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

import { cancelOrder, fetchOrders, type Order } from './api';

const COLUMNS: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', accessor: 'id', rowHeader: true, width: 120 },
  { id: 'customer', label: 'Customer', accessor: 'customer', flex: 1 },
  { id: 'status', label: 'Status', accessor: 'status', width: 130 },
  { id: 'total', label: 'Total', accessor: 'total', numeric: true, width: 130 },
];

@Component({
  selector: 'app-orders-page',
  imports: [
    SlButton,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlResultState,
    SlResultStateContent,
    SlResultStateTitle,
  ],
  styles: `
    .orders-page {
      padding: 24px;
      background: #f8fafc;
    }

    .orders-page h1 {
      margin: 0 0 16px;
      font-size: 22px;
      color: #0f172a;
    }

    [data-ui='data-grid'] [data-part='row']:hover {
      background: #eef2ff;
    }
  `,
  template: `
    <div class="orders-page">
      <h1>Orders</h1>
      @if (orders().length === 0) {
        <section slResultState status="empty">
          <div slResultStateContent>
            <div slResultStateTitle>No orders</div>
          </div>
        </section>
      } @else {
        <sl-data-grid aria-label="Orders" rowKey="id" [columns]="columns" [rows]="orders()">
          <ng-template slDataGridCell="id" let-value="value">
            <button slButton variant="ghost" type="button" (click)="cancel(value)">
              Cancel {{ value }}
            </button>
          </ng-template>
        </sl-data-grid>
      }
    </div>
  `,
})
export class OrdersPage implements OnInit {
  readonly columns = COLUMNS;
  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    fetchOrders().then((rows) => this.orders.set(rows));
  }

  async cancel(id: string): Promise<void> {
    await cancelOrder(id);
    this.orders.update((rows) => rows.filter((row) => row.id !== id));
  }
}
