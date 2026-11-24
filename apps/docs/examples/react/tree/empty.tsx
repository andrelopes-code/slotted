import { Tree } from '@slotted/react/tree';

export default function TreeEmpty() {
  return (
    <Tree
      aria-label="Archived categories"
      variant="framed"
      emptyContent="No archived categories"
      nodes={[] as { id: string }[]}
      getKey={(category) => category.id}
    />
  );
}
