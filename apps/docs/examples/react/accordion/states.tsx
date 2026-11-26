import { Accordion } from '@slotted/react/accordion';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const SECTIONS = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
];

const REVIEW = [
  {
    value: 'delivery',
    title: 'Delivery',
    body: 'Scheduled for September 12 with Harbor Freight, tracking HF-48213.',
  },
  { value: 'payment', title: 'Payment', body: 'Invoice INV-20877 for $2,146.50, due October 4.' },
  {
    value: 'hold',
    title: 'Credit hold',
    body: 'Released by finance on October 1.',
    disabled: true,
  },
];

export default function AccordionStates() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          disabled
        </Text>
        <Accordion disabled defaultValue={['payment']}>
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

      <Stack gap={2}>
        <Text size="sm" tone="muted">
          disabled on one item
        </Text>
        <Accordion defaultValue={['payment']}>
          {REVIEW.map((section) => (
            <Collapsible key={section.value} value={section.value} disabled={section.disabled}>
              <CollapsibleHeader>
                <CollapsibleTrigger>{section.title}</CollapsibleTrigger>
              </CollapsibleHeader>
              <CollapsiblePanel>{section.body}</CollapsiblePanel>
            </Collapsible>
          ))}
        </Accordion>
      </Stack>
    </Stack>
  );
}
