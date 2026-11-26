import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from '@slotted/react/pagination';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function PaginationRange() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        The range is announced after each page change
      </Text>
      <Pagination aria-label="Invoices, announced" count={482} defaultPage={2}>
        <PaginationPrevious />
        <PaginationStatus />
        <PaginationNext />
      </Pagination>
      <Text size="sm" tone="muted">
        The range is displayed and never announced
      </Text>
      <Pagination aria-label="Invoices, silent" count={482} defaultPage={2} live="off">
        <PaginationPrevious />
        <PaginationStatus />
        <PaginationNext />
      </Pagination>
    </Stack>
  );
}
