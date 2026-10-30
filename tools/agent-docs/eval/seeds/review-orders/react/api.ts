export interface Order {
  id: string;
  customer: string;
  status: string;
  total: number;
}

const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `SO-${10421 + index}`,
  customer: ['Ernst Handel', 'Island Trading', 'QUICK-Stop'][index % 3]!,
  status: ['Processing', 'Shipped', 'On hold'][index % 3]!,
  total: 140 + ((index * 733) % 4100),
}));

export function fetchOrders(): Promise<Order[]> {
  return new Promise((resolve) => setTimeout(() => resolve(ORDERS), 1500));
}

export function cancelOrder(id: string): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(void id), 1000));
}
