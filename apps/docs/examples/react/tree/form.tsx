import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tree } from '@slotted/react/tree';
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

export default function TreeForm() {
  const [saved, setSaved] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget).getAll('categories');
    setSaved(`Submitted ${chosen.length} categories.`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Tree
          aria-label="Categories in this feed"
          name="categories"
          selectionMode="multiple"
          defaultExpandedKeys={['beverages']}
          defaultValue={['coffee', 'tea']}
          nodes={CATEGORIES}
          getKey={(category) => category.id}
          getLabel={(category) => category.name}
          getChildren={(category) => category.children}
        />
        <Inline align="center" gap={3}>
          <Button type="submit">Save feed</Button>
          {saved && (
            <Text size="sm" tone="muted">
              {saved}
            </Text>
          )}
        </Inline>
      </Stack>
    </form>
  );
}
