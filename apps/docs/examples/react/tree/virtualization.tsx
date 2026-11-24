import { Tree } from '@slotted/react/tree';

interface OrderNode {
  id: string;
  name: string;
  children?: OrderNode[];
}

const MONTHS: OrderNode[] = Array.from({ length: 24 }, (_, month) => {
  const id = `${2025 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, '0')}`;
  return {
    id,
    name: id,
    children: Array.from({ length: 150 }, (_entry, index) => ({
      id: `${id}-${index}`,
      name: `SO-${10000 + month * 150 + index}`,
    })),
  };
});

export default function TreeVirtualization() {
  return (
    <Tree
      aria-label="Orders by month"
      variant="framed"
      virtual
      itemSize={34}
      defaultExpandedKeys={MONTHS.map((month) => month.id)}
      nodes={MONTHS}
      getKey={(node) => node.id}
      getLabel={(node) => node.name}
      getChildren={(node) => node.children}
    />
  );
}
