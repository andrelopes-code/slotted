import { useState, type SubmitEvent } from 'react';

import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const TERMS: SelectOption[] = [
  { value: 'due', label: 'Due on receipt' },
  { value: 'net-15', label: 'Net 15' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-60', label: 'Net 60' },
];

const CUSTOMER = { name: 'Contoso Foods', email: 'ap@contoso.com', terms: 'net-30' };

const termsLabel = (value: string) => TERMS.find((option) => option.value === value)?.label;

function nameError(value: string): string {
  return value.trim() === '' ? 'Enter the name printed on invoices.' : '';
}

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address invoices are sent to.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like ap@contoso.com.';
  return '';
}

export default function DrawerForm() {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState(CUSTOMER);
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [terms, setTerms] = useState(customer.terms);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? { name: nameError(name), email: emailError(email) } : null;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameError(name) !== '' || emailError(email) !== '') return;
    setCustomer({ name: name.trim(), email: email.trim(), terms });
    setOpen(false);
  };

  return (
    <Inline align="center" gap={3}>
      <Text role="status" size="sm" tone="muted">
        {customer.name}, {customer.email}, {termsLabel(customer.terms)}
      </Text>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setName(customer.name);
            setEmail(customer.email);
            setTerms(customer.terms);
            setSubmitted(false);
          }
          setOpen(next);
        }}
      >
        <DrawerTrigger render={(props) => <Button {...props}>Edit customer</Button>} />
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Edit customer</DrawerTitle>
            <DrawerDescription>Account C-0042, customer since March 2021.</DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <form id="edit-customer" noValidate onSubmit={submit}>
              <Stack gap={4}>
                <Field required invalid={errors?.name ? true : undefined}>
                  <FieldLabel>Company name</FieldLabel>
                  <TextField autoComplete="organization" value={name} onValueChange={setName} />
                  <FieldError live="polite" reserve>
                    {errors?.name}
                  </FieldError>
                </Field>
                <Field required invalid={errors?.email ? true : undefined}>
                  <FieldLabel>Billing email</FieldLabel>
                  <TextField type="email" value={email} onValueChange={setEmail} />
                  <FieldError live="polite" reserve>
                    {errors?.email}
                  </FieldError>
                </Field>
                <Field>
                  <FieldLabel>Payment terms</FieldLabel>
                  <Select
                    items={TERMS}
                    value={terms}
                    onValueChange={(value) =>
                      setTerms(typeof value === 'string' ? value : customer.terms)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Stack>
            </form>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-customer">
              Save customer
            </Button>
          </DrawerFooter>
        </DrawerPanel>
      </Drawer>
    </Inline>
  );
}
