import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

export default function BreadcrumbCollapse() {
  return (
    <Breadcrumb maxItems={4} itemsBeforeCollapse={1} itemsAfterCollapse={2}>
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
  );
}
