import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const PEOPLE = [
  { id: 'avery', name: 'Avery Collins' },
  { id: 'kenji', name: 'Kenji Watanabe' },
  { id: 'lucia', name: 'Lucía Fernández' },
  { id: 'ruth', name: 'Ruth Adeyemi' },
  { id: 'tomasz', name: 'Tomasz Nowak' },
];

export default function ComboboxControlled() {
  const [text, setText] = useState('');
  const [value, setValue] = useState<string | null>(null);

  const assignToMe = () => {
    setValue('ruth');
    setText('Ruth Adeyemi');
  };

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Reviewer</FieldLabel>
        <Combobox
          inputValue={text}
          onInputValueChange={setText}
          value={value}
          onValueChange={setValue}
        >
          <ComboboxInput placeholder="Search people" />
          <ComboboxContent>
            {PEOPLE.map((person) => (
              <ComboboxItem key={person.id} value={person.id}>
                {person.name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      </Field>
      <Inline gap={3} align="center">
        <Button size="sm" variant="outline" onClick={assignToMe}>
          Assign to me
        </Button>
        <Text size="sm" tone="muted">
          Text “{text}” · Value {value ?? 'none'}
        </Text>
      </Inline>
    </Stack>
  );
}
