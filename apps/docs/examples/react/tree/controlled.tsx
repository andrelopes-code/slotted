import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Tree, type TreeValue } from '@slotted/react/tree';
import { Text } from '@slotted/react/typography';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

const CATEGORIES: Category[] = [
  {
    id: 'beverages',
    name: 'Beverages',
    children: [
      { id: 'coffee', name: 'Coffee' },
      { id: 'tea', name: 'Tea' },
      { id: 'soft-drinks', name: 'Soft drinks' },
    ],
  },
  {
    id: 'pantry',
    name: 'Pantry',
    children: [
      { id: 'oils', name: 'Oils and vinegars' },
      {
        id: 'spices',
        name: 'Spices',
        children: [
          { id: 'ground-spices', name: 'Ground spices' },
          { id: 'whole-spices', name: 'Whole spices' },
        ],
      },
    ],
  },
  { id: 'household', name: 'Household' },
];

export default function TreeControlled() {
  const [value, setValue] = useState<TreeValue>('tea');
  const [open, setOpen] = useState<readonly string[]>(['beverages']);

  return (
    <Stack gap={3}>
      <Tree
        aria-label="Product categories"
        expandedKeys={open}
        onExpandedKeysChange={(keys) => setOpen(keys)}
        onValueChange={(next) => setValue(next)}
        value={value}
        nodes={CATEGORIES}
        getKey={(category) => category.id}
        getLabel={(category) => category.name}
        getChildren={(category) => category.children}
      />
      <Text size="sm" tone="muted">
        Chosen: {value ?? 'none'}. Open: {open.join(', ') || 'none'}.
      </Text>
    </Stack>
  );
}
