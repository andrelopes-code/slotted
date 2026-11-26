import { useState } from 'react';
import { Accordion } from '@slotted/react/accordion';
import type { AccordionChangeRequest } from '@slotted/react/accordion';
import { Button } from '@slotted/react/button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const SECTIONS = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
  {
    value: 'returns',
    title: 'Returns',
    body: 'Accepted within 30 days of delivery, with the original packing slip.',
  },
];

export default function AccordionControlled() {
  const [open, setOpen] = useState<readonly string[]>(['delivery']);
  const [reason, setReason] = useState('none');

  function handleValueChange(next: readonly string[], request: AccordionChangeRequest) {
    setOpen(next);
    setReason(request.reason);
  }

  return (
    <Stack gap={4}>
      <Inline gap={3} align="center" justify="between">
        <Text size="sm" tone="muted">
          Open: {open.join(', ') || 'none'}. Last change by the reader: {reason}.
        </Text>
        <Button size="sm" variant="outline" onClick={() => setOpen(['payment'])}>
          Show payment
        </Button>
      </Inline>
      <Accordion value={open} onValueChange={handleValueChange}>
        {SECTIONS.map((section) => (
          <Collapsible key={section.value} value={section.value}>
            <CollapsibleHeader>
              <CollapsibleTrigger>{section.title}</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>{section.body}</CollapsiblePanel>
          </Collapsible>
        ))}
      </Accordion>
    </Stack>
  );
}
