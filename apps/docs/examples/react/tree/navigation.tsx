import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Tree } from '@slotted/react/tree';
import { Text } from '@slotted/react/typography';

interface Page {
  id: string;
  name: string;
  children?: Page[];
}

const PAGES: Page[] = [
  {
    id: 'inventory',
    name: 'Inventory',
    children: [
      { id: 'stock', name: 'Stock levels' },
      { id: 'transfers', name: 'Transfers' },
      { id: 'counts', name: 'Cycle counts' },
    ],
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    children: [
      { id: 'orders', name: 'Purchase orders' },
      { id: 'suppliers', name: 'Suppliers' },
    ],
  },
];

const NAMES = new Map(
  PAGES.flatMap((page) => [page, ...(page.children ?? [])]).map((page) => [page.id, page.name]),
);

export default function TreeNavigation() {
  const [page, setPage] = useState('stock');

  return (
    <Stack gap={3}>
      <Tree
        aria-label="Help center"
        expandOn="expander"
        selectionMode="none"
        defaultActiveKey="stock"
        defaultExpandedKeys={['inventory']}
        onNodeActivate={setPage}
        nodes={PAGES}
        getKey={(entry) => entry.id}
        getLabel={(entry) => entry.name}
        getChildren={(entry) => entry.children}
      />
      <Text role="status" size="sm" tone="muted">
        Open page: {NAMES.get(page)}
      </Text>
    </Stack>
  );
}
