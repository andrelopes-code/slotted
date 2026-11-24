import { Grid } from '@slotted/react/grid';
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

export default function TreeExpansion() {
  return (
    <Grid columns={2} gap={6} minItemWidth="xs">
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          The whole row
        </Text>
        <Tree
          aria-label="Categories, opened by the row"
          defaultExpandedKeys={['beverages']}
          nodes={CATEGORIES}
          getKey={(category) => category.id}
          getLabel={(category) => category.name}
          getChildren={(category) => category.children}
        />
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          The chevron alone
        </Text>
        <Tree
          aria-label="Categories, opened by the chevron"
          expandOn="expander"
          defaultExpandedKeys={['beverages']}
          nodes={CATEGORIES}
          getKey={(category) => category.id}
          getLabel={(category) => category.name}
          getChildren={(category) => category.children}
        />
      </Stack>
    </Grid>
  );
}
