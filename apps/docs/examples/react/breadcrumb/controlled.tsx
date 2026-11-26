import { useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

export default function BreadcrumbControlled() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack gap={4}>
      <Breadcrumb expanded={expanded} maxItems={4} onExpandedChange={setExpanded}>
        <BreadcrumbList>
          {LEVELS.map((level) => (
            <BreadcrumbItem key={level}>
              <BreadcrumbLink href="#">{level}</BreadcrumbLink>
            </BreadcrumbItem>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Inline gap={3}>
        <Button disabled={!expanded} onClick={() => setExpanded(false)} variant="outline">
          Fold the trail
        </Button>
        <Text size="sm" tone="muted">
          {expanded ? 'Expanded' : 'Folded'}
        </Text>
      </Inline>
    </Stack>
  );
}
