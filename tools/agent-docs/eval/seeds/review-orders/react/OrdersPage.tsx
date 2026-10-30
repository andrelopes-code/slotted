import type { GridColumn } from '@slotted/core/grid';
import { Button } from '@slotted/react/button';
import { DataGrid } from '@slotted/react/data-grid';
import { ResultState, ResultStateContent, ResultStateTitle } from '@slotted/react/result-state';
import { useEffect, useState } from 'react';

import { cancelOrder, fetchOrders, type Order } from './api';
import './orders-page.css';

const columns: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', accessor: 'id', rowHeader: true, width: 120 },
  { id: 'customer', label: 'Customer', accessor: 'customer', flex: 1 },
  { id: 'status', label: 'Status', accessor: 'status', width: 130 },
  { id: 'total', label: 'Total', accessor: 'total', numeric: true, width: 130 },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  async function cancel(id: string) {
    await cancelOrder(id);
    setOrders((rows) => rows.filter((row) => row.id !== id));
  }

  return (
    <div className="orders-page">
      <h1>Orders</h1>
      {orders.length === 0 ? (
        <ResultState status="empty">
          <ResultStateContent>
            <ResultStateTitle>No orders</ResultStateTitle>
          </ResultStateContent>
        </ResultState>
      ) : (
        <DataGrid
          aria-label="Orders"
          cellRenderers={{
            id: ({ value }) => (
              <Button variant="ghost" onClick={() => cancel(String(value))}>
                Cancel {String(value)}
              </Button>
            ),
          }}
          columns={columns}
          rowKey="id"
          rows={orders}
        />
      )}
    </div>
  );
}
