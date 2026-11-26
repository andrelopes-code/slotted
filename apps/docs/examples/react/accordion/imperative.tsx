import { useRef } from 'react';
import { Accordion } from '@slotted/react/accordion';
import type { AccordionHandle } from '@slotted/react/accordion';
import { Button } from '@slotted/react/button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

const TASKS = [
  {
    value: 'receiving',
    title: 'Receiving',
    body: '14 pallets arrive today between 08:00 and 15:00.',
  },
  { value: 'putaway', title: 'Putaway', body: '6 pallets wait in dock 3 for a bin assignment.' },
  { value: 'counts', title: 'Cycle counts', body: 'Aisles 12 to 15 are due this week.' },
  {
    value: 'archive',
    title: 'Archived pallets',
    body: 'Moved to cold storage on September 30.',
    disabled: true,
  },
];

export default function AccordionImperative() {
  const set = useRef<AccordionHandle>(null);

  return (
    <Stack gap={4}>
      <Inline gap={2}>
        <Button size="sm" variant="outline" onClick={() => set.current?.openAll()}>
          Open all
        </Button>
        <Button size="sm" variant="outline" onClick={() => set.current?.closeAll()}>
          Close all
        </Button>
      </Inline>
      <Accordion handle={set} multiple>
        {TASKS.map((task) => (
          <Collapsible key={task.value} value={task.value} disabled={task.disabled}>
            <CollapsibleHeader>
              <CollapsibleTrigger>{task.title}</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>{task.body}</CollapsiblePanel>
          </Collapsible>
        ))}
      </Accordion>
    </Stack>
  );
}
