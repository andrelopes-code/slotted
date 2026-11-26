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

export default function AccordionHeadings() {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          headingLevel="2"
        </Text>
        <Accordion headingLevel="2" defaultValue={['delivery']}>
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
          headingLevel="none"
        </Text>
        <Accordion headingLevel="none" defaultValue={['delivery']}>
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
    </Stack>
  );
}
