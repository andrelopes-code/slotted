import { useState } from 'react';
import { Glyph, Icon } from '@slotted/react/icon';
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

const FOLDER =
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z';
const FOLDER_OPEN =
  'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2';

function FolderIcon({ open }: { open: boolean }) {
  return (
    <Icon>
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d={open ? FOLDER_OPEN : FOLDER} />
      </svg>
    </Icon>
  );
}

export default function TreeIconByState() {
  const [open, setOpen] = useState<readonly string[]>(['contracts']);

  return (
    <Tree
      aria-label="Documents"
      expandedKeys={open}
      onExpandedKeysChange={(keys) => setOpen(keys)}
      renderCells={(entry) => ({
        icon: entry.children ? (
          <FolderIcon open={open.includes(entry.id)} />
        ) : (
          <Icon>
            <Glyph name="file-text" />
          </Icon>
        ),
      })}
      nodes={FOLDERS}
      getKey={(entry) => entry.id}
      getLabel={(entry) => entry.name}
      getChildren={(entry) => entry.children}
    />
  );
}
