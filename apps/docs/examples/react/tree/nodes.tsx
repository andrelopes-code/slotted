import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tree, type TreeHandle } from '@slotted/react/tree';

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

export default function TreeNodes() {
  const tree = useRef<TreeHandle>(null);

  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Button size="sm" variant="outline" onClick={() => tree.current?.expandAll()}>
          Expand all
        </Button>
        <Button size="sm" variant="outline" onClick={() => tree.current?.collapseAll()}>
          Collapse all
        </Button>
      </Inline>
      <Tree
        aria-label="Product categories"
        handleRef={tree}
        nodes={CATEGORIES}
        getKey={(category) => category.id}
        getLabel={(category) => category.name}
        getChildren={(category) => category.children}
      />
    </Stack>
  );
}
