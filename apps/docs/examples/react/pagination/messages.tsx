import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from '@slotted/react/pagination';

const messages = {
  label: 'Shipments',
  next: 'Later shipments',
  page: 'Shipments page {page}',
  previous: 'Earlier shipments',
  range: '{start} to {end} of {count} shipments',
};

export default function PaginationMessages() {
  return (
    <Pagination count={482} defaultPage={12} messages={messages}>
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
      <PaginationStatus />
    </Pagination>
  );
}
