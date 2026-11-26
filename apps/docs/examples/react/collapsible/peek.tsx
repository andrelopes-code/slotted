import {
  Collapsible,
  CollapsibleHeader,
  CollapsibleMore,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';

export default function CollapsiblePeek() {
  return (
    <Collapsible peek="6rem" variant="framed">
      <CollapsibleHeader>
        <CollapsibleTrigger>Receiving log</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>
        <p>08:05 Pallet PL-4401 received at door 2, 24 cartons, no damage.</p>
        <p>08:40 Pallet PL-4402 received at door 2, 18 cartons, one crushed corner.</p>
        <p>09:15 Pallet PL-4403 received at door 4, 30 cartons, no damage.</p>
        <p>10:02 Pallet PL-4404 held for inspection, seal broken on arrival.</p>
        <p>10:48 Pallet PL-4405 received at door 4, 12 cartons, no damage.</p>
        <p>11:30 Pallet PL-4406 received at door 1, 40 cartons, no damage.</p>
      </CollapsiblePanel>
      <CollapsibleMore>Show full log</CollapsibleMore>
    </Collapsible>
  );
}
