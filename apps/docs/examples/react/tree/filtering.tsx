import { useState } from 'react';
import { Glyph, Icon } from '@slotted/react/icon';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Tree } from '@slotted/react/tree';

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

export default function TreeFiltering() {
  const [query, setQuery] = useState('spice');

  return (
    <Stack gap={3}>
      <TextField
        aria-label="Find a category"
        clearable
        onValueChange={(next) => setQuery(next)}
        start={
          <Icon>
            <Glyph name="search" />
          </Icon>
        }
        type="search"
        value={query}
      />
      <Tree
        aria-label="Product categories"
        emptyContent="No category matches"
        query={query}
        nodes={CATEGORIES}
        getKey={(category) => category.id}
        getLabel={(category) => category.name}
        getChildren={(category) => category.children}
      />
    </Stack>
  );
}
