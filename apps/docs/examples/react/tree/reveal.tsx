import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';
import { Tree, type TreeHandle, type TreeValue } from '@slotted/react/tree';

interface Place {
  id: string;
  name: string;
  children?: Place[];
}

const PLACES: Place[] = ['CMH', 'RNO', 'SAV'].map((site) => ({
  id: site,
  name: `Warehouse ${site}`,
  children: ['A', 'B', 'C'].map((aisle) => ({
    id: `${site}-${aisle}`,
    name: `Aisle ${aisle}`,
    children: Array.from({ length: 8 }, (_, index) => ({
      id: `${site}-${aisle}-0${index + 1}`,
      name: `Bin ${site}-${aisle}-0${index + 1}`,
    })),
  })),
}));

export default function TreeReveal() {
  const tree = useRef<TreeHandle>(null);
  const [value, setValue] = useState<TreeValue>(null);

  function handleFind() {
    setValue('SAV-B-06');
    tree.current?.scrollToKey('SAV-B-06', 'center');
  }

  return (
    <Stack align="start" gap={3}>
      <Button size="sm" variant="outline" onClick={handleFind}>
        Find bin SAV-B-06
      </Button>
      <Tree
        aria-label="Bins"
        handleRef={tree}
        onValueChange={(next) => setValue(next)}
        value={value}
        defaultExpandedKeys={['CMH', 'CMH-A']}
        nodes={PLACES}
        getKey={(place) => place.id}
        getLabel={(place) => place.name}
        getChildren={(place) => place.children}
      />
    </Stack>
  );
}
