import { Accordion } from '@slotted/react/accordion';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const MOUNTS = ['active', 'lazy', 'eager', 'until-found'] as const;

export default function AccordionMount() {
  return (
    <Stack gap={6}>
      {MOUNTS.map((mount) => (
        <Stack key={mount} gap={2}>
          <Text size="sm" tone="muted">
            mount="{mount}"
          </Text>
          <Accordion mount={mount}>
            <Collapsible value="note">
              <CollapsibleHeader>
                <CollapsibleTrigger>Carrier note</CollapsibleTrigger>
              </CollapsibleHeader>
              <CollapsiblePanel>
                <Field>
                  <FieldLabel>Note for the carrier</FieldLabel>
                  <TextField />
                </Field>
              </CollapsiblePanel>
            </Collapsible>
          </Accordion>
        </Stack>
      ))}
    </Stack>
  );
}
