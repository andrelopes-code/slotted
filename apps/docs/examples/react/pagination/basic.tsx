import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';

export default function PaginationBasic() {
  return (
    <Pagination aria-label="Invoices" count={482} defaultPage={12}>
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
    </Pagination>
  );
}
