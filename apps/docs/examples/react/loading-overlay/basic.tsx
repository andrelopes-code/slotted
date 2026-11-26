import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Heading } from '@slotted/react/typography';

export default function LoadingOverlayBasic() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2500);
  };

  return (
    <LoadingOverlay loading={saving} messages={{ label: 'Saving the customer' }}>
      <Card>
        <CardHeader>
          <Heading level={3} size="md">
            Customer profile
          </Heading>
        </CardHeader>
        <CardBody>
          <Stack gap={4}>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <TextField defaultValue="Northwind Traders" />
            </Field>
            <Inline>
              <Button onClick={save}>Save customer</Button>
            </Inline>
          </Stack>
        </CardBody>
      </Card>
    </LoadingOverlay>
  );
}
