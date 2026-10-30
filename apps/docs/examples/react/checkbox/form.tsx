import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function CheckboxForm() {
  const [saved, setSaved] = useState<string | null>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reports = new FormData(event.currentTarget).getAll('reports');
    setSaved(reports.length === 0 ? 'none' : reports.join(', '));
  };

  return (
    <form onSubmit={submit} onReset={() => setSaved(null)}>
      <Stack gap={4}>
        <FieldGroup>
          <FieldGroupLegend>Reports emailed each morning</FieldGroupLegend>
          <FieldGroupContent>
            <Stack gap={2}>
              <Checkbox name="reports" value="daily-sales" defaultChecked>
                Daily sales
              </Checkbox>
              <Checkbox name="reports" value="low-stock">
                Low stock
              </Checkbox>
              <Checkbox name="reports" value="payouts" defaultChecked>
                Payouts
              </Checkbox>
            </Stack>
          </FieldGroupContent>
        </FieldGroup>
        <Inline gap={3} align="center">
          <Button type="submit">Save</Button>
          <Button type="reset" variant="outline" tone="secondary">
            Reset
          </Button>
        </Inline>
        <Text size="sm" tone="muted" role="status">
          {saved === null ? '' : `Submitted reports: ${saved}.`}
        </Text>
      </Stack>
    </form>
  );
}
