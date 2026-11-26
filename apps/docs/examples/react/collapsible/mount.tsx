import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import type { CollapsibleMount } from '@slotted/react/collapsible';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

const NOTES: { mount: CollapsibleMount; title: string }[] = [
  { mount: 'active', title: 'Dock notes' },
  { mount: 'lazy', title: 'Carrier notes' },
  { mount: 'eager', title: 'Receiving notes' },
];

export default function CollapsibleMountExample() {
  return (
    <Stack gap={2}>
      {NOTES.map((note) => (
        <Collapsible key={note.mount} mount={note.mount} variant="ruled">
          <CollapsibleHeader>
            <CollapsibleTrigger description={note.mount}>{note.title}</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <TextField placeholder="Type, close and reopen" />
            </Field>
          </CollapsiblePanel>
        </Collapsible>
      ))}

      <Collapsible mount="until-found" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger description="until-found">Delivery history</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>
          Delivered on March 2 by Anna Rivers to the Reno warehouse.
        </CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
