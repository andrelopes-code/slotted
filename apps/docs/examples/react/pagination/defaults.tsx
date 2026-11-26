import {
  Pagination,
  PaginationDefaultsProvider,
  PaginationItems,
  PaginationPageSize,
  PaginationStatus,
} from '@slotted/react/pagination';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function PaginationApplicationDefaults() {
  return (
    <PaginationDefaultsProvider
      defaultPageSize={50}
      pageSizeOptions={[25, 50, 100]}
      siblingCount={2}
    >
      <Stack gap={4}>
        <Text size="sm" tone="muted">
          Inherits two siblings and 50 rows
        </Text>
        <Pagination aria-label="Orders, inherited" count={1200} defaultPage={10}>
          <PaginationPageSize />
          <PaginationStatus />
          <PaginationItems />
        </Pagination>
        <Text size="sm" tone="muted">
          States no siblings and keeps the rest
        </Text>
        <Pagination aria-label="Orders, own row" count={1200} defaultPage={10} siblingCount={0}>
          <PaginationPageSize />
          <PaginationStatus />
          <PaginationItems />
        </Pagination>
      </Stack>
    </PaginationDefaultsProvider>
  );
}
