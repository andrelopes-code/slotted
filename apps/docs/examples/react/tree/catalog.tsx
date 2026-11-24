import { useState } from 'react';
import { Grid } from '@slotted/react/grid';
import { List, ListEmpty } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';
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

const PRODUCTS = [
  { sku: 'BEV-104', name: 'House blend, 1 kg', category: 'coffee' },
  { sku: 'BEV-131', name: 'Decaf espresso, 500 g', category: 'coffee' },
  { sku: 'BEV-220', name: 'Earl grey, 50 bags', category: 'tea' },
  { sku: 'BEV-305', name: 'Ginger ale, 24 cans', category: 'soft-drinks' },
  { sku: 'PAN-012', name: 'Olive oil, 5 L', category: 'oils' },
  { sku: 'PAN-118', name: 'Smoked paprika, 250 g', category: 'ground-spices' },
];

function keysUnder(categories: Category[], key: string, inside = false): string[] {
  return categories.flatMap((category) => {
    const here = inside || category.id === key;
    return [...(here ? [category.id] : []), ...keysUnder(category.children ?? [], key, here)];
  });
}

export default function TreeCatalog() {
  const [category, setCategory] = useState('beverages');
  const keys = keysUnder(CATEGORIES, category);
  const products = PRODUCTS.filter((product) => keys.includes(product.category));

  return (
    <Grid columns={2} gap={6} minItemWidth="xs">
      <Tree
        aria-label="Product categories"
        disallowEmptySelection
        expandOn="expander"
        defaultExpandedKeys={['beverages', 'pantry']}
        onValueChange={(next) => setCategory(String(next))}
        value={category}
        nodes={CATEGORIES}
        getKey={(category) => category.id}
        getLabel={(category) => category.name}
        getChildren={(category) => category.children}
      />
      <List aria-label="Products" variant="framed">
        {products.length === 0 && <ListEmpty>No products in this category</ListEmpty>}
        {products.map((product) => (
          <ListItem key={product.sku}>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>{product.name}</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>{product.sku}</ListItemEnd>
            </ListItemContent>
          </ListItem>
        ))}
      </List>
    </Grid>
  );
}
