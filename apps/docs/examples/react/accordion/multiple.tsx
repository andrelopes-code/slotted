import { Accordion } from '@slotted/react/accordion';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';

const TASKS = [
  {
    value: 'receiving',
    title: 'Receiving',
    body: '14 pallets arrive today between 08:00 and 15:00.',
  },
  { value: 'putaway', title: 'Putaway', body: '6 pallets wait in dock 3 for a bin assignment.' },
  { value: 'counts', title: 'Cycle counts', body: 'Aisles 12 to 15 are due this week.' },
  { value: 'dispatch', title: 'Dispatch', body: 'The 16:30 carrier pickup holds 38 parcels.' },
];

export default function AccordionMultiple() {
  return (
    <Accordion multiple defaultValue={['receiving', 'putaway']}>
      {TASKS.map((section) => (
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
