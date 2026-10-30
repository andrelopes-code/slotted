import { useState, type SubmitEvent } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

function nameError(value: string): string {
  return value.trim() === '' ? 'Enter the contact’s full name.' : '';
}

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address the contact reads.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like ana@contoso.com.';
  return '';
}

export default function DialogForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const errors = submitted ? { name: nameError(name), email: emailError(email) } : null;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameError(name) !== '' || emailError(email) !== '') return;
    setAdded(`${name.trim()} was added to Contoso Foods.`);
    setOpen(false);
  };

  return (
    <Inline align="center" gap={3}>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setName('');
            setEmail('');
            setSubmitted(false);
          }
          setOpen(next);
        }}
      >
        <DialogTrigger render={(props) => <Button {...props}>Add contact</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
            <DialogDescription>Contoso Foods, Seattle.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <form id="new-contact" noValidate onSubmit={submit}>
              <Stack gap={4}>
                <Field required invalid={errors?.name ? true : undefined}>
                  <FieldLabel>Full name</FieldLabel>
                  <TextField autoComplete="name" value={name} onValueChange={setName} />
                  <FieldError live="polite" reserve>
                    {errors?.name}
                  </FieldError>
                </Field>
                <Field required invalid={errors?.email ? true : undefined}>
                  <FieldLabel>Email</FieldLabel>
                  <TextField
                    autoComplete="email"
                    type="email"
                    value={email}
                    onValueChange={setEmail}
                  />
                  <FieldError live="polite" reserve>
                    {errors?.email}
                  </FieldError>
                </Field>
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-contact">
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {added === null ? null : (
        <Text role="status" size="sm" tone="muted">
          {added}
        </Text>
      )}
    </Inline>
  );
}
