import {
  Pagination,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationStatus,
} from '@slotted/react/pagination';

export default function PaginationRows() {
  return (
    <Pagination
      aria-label="Orders"
      count={482}
      defaultPage={5}
      defaultPageSize={25}
      pageSizeOptions={[25, 50, 100]}
    >
      <PaginationPageSize label="Orders per page" />
      <PaginationStatus />
      <PaginationPrevious />
      <PaginationNext />
    </Pagination>
  );
}
