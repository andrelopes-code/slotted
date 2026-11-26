import { Accordion } from '@slotted/react/accordion';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';

const ACCOUNT = [
  { value: 'summary', title: 'Summary', body: 'Harbor & Pine Supply Co., customer since 2019.' },
  {
    value: 'contacts',
    title: 'Contacts',
    body: 'Mira Alvarez, purchasing, and Tomas Berg, accounts payable.',
  },
  {
    value: 'terms',
    title: 'Payment terms',
    body: 'Net 30, with a 2% discount when paid within 10 days.',
  },
];

export default function AccordionRequireOpen() {
  return (
    <Accordion requireOpen defaultValue={['summary']}>
      {ACCOUNT.map((section) => (
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
