import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupError,
  FieldGroupLegend,
} from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

export default function CheckboxGroupValidation() {
  const [channels, setChannels] = useState<readonly string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const missing = submitted && channels.length === 0;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <FieldGroup required>
          <FieldGroupLegend>Send shipping confirmations by</FieldGroupLegend>
          <FieldGroupError live="polite" reserve>
            {missing ? 'Choose at least one channel.' : ''}
          </FieldGroupError>
          <FieldGroupContent>
            <CheckboxGroup
              invalid={missing ? true : undefined}
              value={channels}
              onValueChange={setChannels}
            >
              <Checkbox value="email">Email</Checkbox>
              <Checkbox value="sms">Text message</Checkbox>
              <Checkbox value="in-app">In-app notification</Checkbox>
            </CheckboxGroup>
          </FieldGroupContent>
        </FieldGroup>
        <Inline gap={3} align="center">
          <Button type="submit">Save preferences</Button>
          {submitted && channels.length > 0 ? <span role="status">Preferences saved.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
