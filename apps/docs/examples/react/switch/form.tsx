import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';
import { Text } from '@slotted/react/typography';

export default function SwitchForm() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const names = [...new FormData(event.currentTarget).keys()];
    setSubmitted(names.length > 0 ? names.join(', ') : 'nothing');
  };

  return (
    <form onSubmit={submit} onReset={() => setSubmitted(null)}>
      <Stack gap={4}>
        <Switch name="dailySummary" defaultChecked labelPlacement="start">
          Daily sales summary
        </Switch>
        <Switch name="weeklyForecast" labelPlacement="start">
          Weekly demand forecast
        </Switch>
        <Switch name="supplierDelays" defaultChecked labelPlacement="start">
          Supplier delay report
        </Switch>
        <Inline gap={3} align="center">
          <Button type="submit">Save</Button>
          <Button type="reset" tone="secondary" variant="outline">
            Reset
          </Button>
          {submitted && (
            <Text size="sm" tone="muted">
              Submitted {submitted}
            </Text>
          )}
        </Inline>
      </Stack>
    </form>
  );
}
