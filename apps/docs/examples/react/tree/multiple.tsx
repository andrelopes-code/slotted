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

export default function TreeMultiple() {
  return (
    <Tree
      aria-label="Categories on promotion"
      selectionMode="multiple"
      defaultExpandedKeys={['beverages', 'pantry']}
      defaultValue={['coffee', 'oils']}
      nodes={CATEGORIES}
      getKey={(category) => category.id}
      getLabel={(category) => category.name}
      getChildren={(category) => category.children}
    />
  );
}
