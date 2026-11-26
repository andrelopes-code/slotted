import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';

export default function PaginationLinks() {
  return (
    <Pagination aria-label="Invoices" count={482} itemHref={(page) => `#invoices-page-${page}`}>
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
    </Pagination>
  );
}
