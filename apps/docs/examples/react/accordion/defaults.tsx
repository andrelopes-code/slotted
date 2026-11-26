import { Accordion, AccordionDefaultsProvider } from '@slotted/react/accordion';
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
    value: 'po',
    title: 'Purchase order PO-44821 from Harbor & Pine Supply Co. awaiting approval',
    body: 'Requested by Mira Alvarez for $12,480.00.',
  },
  {
    value: 'rma',
    title: 'Return authorization RMA-3107 for 24 damaged cartons',
    body: 'Credit of $1,036.80 issues after inspection.',
  },
];

export default function AccordionDefaults() {
  return (
    <AccordionDefaultsProvider variant="separated" indicator="plus-minus" truncate>
      <Stack gap={6}>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            From the defaults
          </Text>
          <Accordion defaultValue={['po']}>
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
            variant="plain" on the set
          </Text>
          <Accordion variant="plain" defaultValue={['po']}>
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
    </AccordionDefaultsProvider>
  );
}
