import { Accordion } from '@slotted/react/accordion';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';

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

export default function AccordionBasic() {
  return (
    <Accordion defaultValue={['delivery']}>
      {SECTIONS.map((section) => (
        <Collapsible key={section.value} value={section.value}>
          <CollapsibleHeader>
            <CollapsibleTrigger>{section.title}</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>{section.body}</CollapsiblePanel>
        </Collapsible>
      ))}
    </Accordion>
  );
}
