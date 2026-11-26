import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const LEVELS = [
  'Northwind',
  'Distribution centers',
  'Rotterdam',
  'Inbound receiving',
  'Purchase orders',
  'Kiln & Co.',
];

export default function BreadcrumbOverflow() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          overflow="collapse"
        </Text>
        <Breadcrumb>
          <BreadcrumbList>
            {LEVELS.map((level) => (
              <BreadcrumbItem key={level}>
                <BreadcrumbLink href="#">{level}</BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>PO-2026-08-0412</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          overflow="wrap"
        </Text>
        <Breadcrumb overflow="wrap">
          <BreadcrumbList>
            {LEVELS.map((level) => (
              <BreadcrumbItem key={level}>
                <BreadcrumbLink href="#">{level}</BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>PO-2026-08-0412</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Stack>
    </Stack>
  );
}
