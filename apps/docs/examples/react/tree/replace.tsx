import { Tree } from '@slotted/react/tree';

interface Entry {
  id: string;
  name: string;
  children?: Entry[];
}

const FOLDERS: Entry[] = [
  {
    id: 'contracts',
    name: 'Contracts',
    children: [
      { id: 'contoso', name: 'Contoso Foods 2026.pdf' },
      { id: 'fabrikam', name: 'Fabrikam Supply 2026.pdf' },
      { id: 'atlas', name: 'Atlas Freight renewal.pdf' },
    ],
  },
  {
    id: 'forecasts',
    name: 'Forecasts',
    children: [
      { id: 'q3', name: 'Q3 demand.xlsx' },
      { id: 'q4', name: 'Q4 demand.xlsx' },
    ],
  },
];

export default function TreeReplace() {
  return (
    <Tree
      aria-label="Documents"
      expandOn="expander"
      selectionBehavior="replace"
      selectionIndicator="highlight"
      selectionMode="multiple"
      defaultExpandedKeys={['contracts', 'forecasts']}
      defaultValue={['contoso', 'fabrikam']}
      nodes={FOLDERS}
      getKey={(entry) => entry.id}
      getLabel={(entry) => entry.name}
      getChildren={(entry) => entry.children}
    />
  );
}
