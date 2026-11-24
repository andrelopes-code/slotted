import { Grid } from '@slotted/react/grid';
import { Tree, TreeDefaultsProvider } from '@slotted/react/tree';

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

export default function TreeDefaultsExample() {
  return (
    <TreeDefaultsProvider expandOn="expander" guides={false} size="sm">
      <Grid columns={2} gap={6} minItemWidth="xs">
        <Tree
          aria-label="Categories"
          defaultExpandedKeys={['beverages']}
          nodes={CATEGORIES}
          getKey={(category) => category.id}
          getLabel={(category) => category.name}
          getChildren={(category) => category.children}
        />
        <Tree
          aria-label="Categories with guides"
          guides
          defaultExpandedKeys={['beverages']}
          nodes={CATEGORIES}
          getKey={(category) => category.id}
          getLabel={(category) => category.name}
          getChildren={(category) => category.children}
        />
      </Grid>
    </TreeDefaultsProvider>
  );
}
