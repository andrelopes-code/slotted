import { useEffect, useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';

interface Invoice {
  customer: string;
  issued: string;
  due: string;
  amount: string;
}

const FIELDS: { key: keyof Invoice; term: string; width: string }[] = [
  { key: 'customer', term: 'Customer', width: '9rem' },
  { key: 'issued', term: 'Issued', width: '6rem' },
  { key: 'due', term: 'Due', width: '6rem' },
  { key: 'amount', term: 'Amount', width: '5rem' },
];

export default function DialogLoading() {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!open) return;
    setInvoice(null);
    const timer = setTimeout(
      () =>
        setInvoice({
          customer: 'Northwind Traders',
          issued: '12 August 2026',
          due: '11 September 2026',
          amount: '$1,240.00',
        }),
      1200,
    );
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen} loading={invoice === null}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            View invoice INV-2041
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invoice INV-2041</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <SkeletonRegion
            delay={200}
            loading={invoice === null}
            messages={{ label: 'Loading invoice' }}
          >
            <DescriptionList>
              {FIELDS.map((field) => (
                <DescriptionListItem key={field.key}>
                  <DescriptionListTerm>{field.term}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {invoice === null ? <Skeleton inlineSize={field.width} /> : invoice[field.key]}
                  </DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </SkeletonRegion>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
