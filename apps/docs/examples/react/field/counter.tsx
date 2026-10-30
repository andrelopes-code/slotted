import { useState } from 'react';
import {
  Field,
  FieldCounter,
  FieldDescription,
  FieldHeader,
  FieldLabel,
} from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Textarea } from '@slotted/react/textarea';

const MAX_TAGS = 5;

export default function FieldCounterExample() {
  const [tags, setTags] = useState('tea, organic, fair trade');
  const count = tags.split(',').filter((tag) => tag.trim() !== '').length;
  const over = count > MAX_TAGS;

  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Public description</FieldLabel>
        <Textarea
          autoSize
          countMax={140}
          showCount
          defaultValue="Ships within two business days. Returns are free for thirty days."
        />
      </Field>
      <Field invalid={over ? true : undefined}>
        <FieldHeader>
          <FieldLabel>Search tags</FieldLabel>
          <FieldCounter invalid={over}>{`${count}/${MAX_TAGS} tags`}</FieldCounter>
        </FieldHeader>
        <TextField value={tags} onValueChange={setTags} />
        <FieldDescription>Separate tags with commas.</FieldDescription>
      </Field>
    </Stack>
  );
}
