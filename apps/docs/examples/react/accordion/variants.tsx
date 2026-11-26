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

const VARIANTS = ['plain', 'ruled', 'framed', 'separated'] as const;

export default function AccordionVariants() {
  return (
    <Stack gap={6}>
      {VARIANTS.map((value) => (
        <Stack key={value} gap={2}>
          <Text size="sm" tone="muted">
            variant="{value}"
          </Text>
          <Accordion variant={value} defaultValue={['delivery']}>
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
      ))}
    </Stack>
  );
}
