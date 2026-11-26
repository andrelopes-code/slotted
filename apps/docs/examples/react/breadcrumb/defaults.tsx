import {
  Breadcrumb,
  BreadcrumbDefaultsProvider,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

export default function BreadcrumbDefaults() {
  return (
    <BreadcrumbDefaultsProvider itemsAfterCollapse={1} maxItems={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            Inherits the defaults
          </Text>
          <Breadcrumb>
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
        </Stack>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            maxItems={0} and overflow="wrap" on the trail
          </Text>
          <Breadcrumb maxItems={0} overflow="wrap">
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
        </Stack>
      </Stack>
    </BreadcrumbDefaultsProvider>
  );
}
