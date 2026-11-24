import { useState } from 'react';
import { IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
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

export default function TreeActionsExample() {
  const [last, setLast] = useState('No action yet.');

  return (
    <Stack gap={3}>
      <Tree
        aria-label="Product categories"
        defaultExpandedKeys={['beverages']}
        renderCells={(category) => ({
          actions: (
            <Menu align="end">
              <MenuTrigger
                render={(props) => (
                  <IconButton
                    {...props}
                    aria-label={`Actions for ${category.name}`}
                    size="sm"
                    variant="ghost"
                  >
                    <Glyph name="ellipsis" />
                  </IconButton>
                )}
              />
              <MenuContent>
                <MenuItem onSelect={() => setLast(`Rename ${category.name}.`)}>Rename…</MenuItem>
                <MenuItem onSelect={() => setLast(`Add a category under ${category.name}.`)}>
                  Add a category
                </MenuItem>
              </MenuContent>
            </Menu>
          ),
        })}
        nodes={CATEGORIES}
        getKey={(category) => category.id}
        getLabel={(category) => category.name}
        getChildren={(category) => category.children}
      />
      <Text role="status" size="sm" tone="muted">
        {last}
      </Text>
    </Stack>
  );
}
