import { Tree } from '@slotted/react/tree';

interface Location {
  id: string;
  name: string;
  units?: number;
  status?: string;
  children?: Location[];
}

const LOCATIONS: Location[] = [
  {
    id: 'cmh',
    name: 'Columbus, OH',
    children: [
      { id: 'cmh-a', name: 'Zone A', units: 1840 },
      { id: 'cmh-b', name: 'Zone B', units: 920, status: 'Counting' },
    ],
  },
  {
    id: 'rno',
    name: 'Reno, NV',
    children: [
      { id: 'rno-a', name: 'Zone A', units: 2310 },
      { id: 'rno-cold', name: 'Cold storage', units: 415 },
    ],
  },
];

export default function TreeCells() {
  return (
    <Tree
      aria-label="Stock locations"
      defaultExpandedKeys={['cmh']}
      renderCells={(location) => ({
        description: location.status,
        meta: location.units?.toLocaleString('en-US') ?? `${location.children?.length ?? 0} zones`,
      })}
      nodes={LOCATIONS}
      getKey={(location) => location.id}
      getLabel={(location) => location.name}
      getChildren={(location) => location.children}
    />
  );
}
