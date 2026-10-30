import { inject, Injectable, signal } from '@angular/core';
import type { FormErrors } from '@slotted/core/form';
import type { Contact } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { CustomerStore } from './customer.store';

export type ContactMethod = 'email' | 'phone' | 'mobile';

export interface ContactDraft {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  mobile: string;
  preferredContactMethod: ContactMethod;
  status: 'active' | 'inactive';
  isPrimary: boolean;
}

export const EMPTY_CONTACT: ContactDraft = {
  firstName: '',
  lastName: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  preferredContactMethod: 'email',
  status: 'active',
  isPrimary: false,
};

const MESSAGES: Record<string, string> = {
  'firstName:REQUIRED': 'A contact is filed under a first name.',
  'lastName:REQUIRED': 'A contact is filed under a last name.',
  'email:INVALID_EMAIL': 'Write the address as name@company.com.',
};

/**
 * The people on an account: one form, opened either on a new contact or on
 * one of the record's own. The primary mark is a command of its own (§56.4)
 * and moves atomically, so it is never a field two contacts can both hold.
 */
@Injectable({ providedIn: 'root' })
export class ContactFormStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly record = inject(CustomerStore);

  readonly mode = signal<'closed' | 'new' | 'edit'>('closed');
  readonly draft = signal<ContactDraft>({ ...EMPTY_CONTACT });
  readonly errors = signal<FormErrors>({});
  readonly failure = signal<{ code: string; message: string } | null>(null);
  readonly saving = signal(false);
  /** The contact whose primary mark is in flight, so its own control waits on it. */
  readonly promoting = signal<string | null>(null);

  private editing: Contact | null = null;

  startNew(): void {
    this.editing = null;
    this.draft.set({ ...EMPTY_CONTACT });
    this.reset();
    this.mode.set('new');
  }

  startEdit(contact: Contact): void {
    this.editing = contact;
    this.draft.set({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title ?? '',
      department: contact.department ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      preferredContactMethod: contact.preferredContactMethod ?? 'email',
      status: contact.status,
      isPrimary: contact.isPrimary,
    });
    this.reset();
    this.mode.set('edit');
  }

  cancel(): void {
    this.mode.set('closed');
    this.editing = null;
    this.reset();
  }

  patch(patch: Partial<ContactDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  /** The contact being edited, for the form's heading. */
  get contact(): Contact | null {
    return this.editing;
  }

  async save(): Promise<boolean> {
    const customer = this.record.customer();
    if (customer === null || this.saving()) return false;
    this.saving.set(true);
    this.errors.set({});
    this.failure.set(null);
    const draft = this.draft();
    try {
      const api = await this.backend.ready();
      await this.health.mutation(async () => {
        if (this.editing === null) {
          await api.customers.contacts.create(customer.id, {
            firstName: draft.firstName,
            lastName: draft.lastName,
            isPrimary: draft.isPrimary,
            ...(draft.email.trim() ? { email: draft.email } : {}),
            ...(draft.phone.trim() ? { phone: draft.phone } : {}),
            ...(draft.mobile.trim() ? { mobile: draft.mobile } : {}),
            ...(draft.title.trim() ? { title: draft.title } : {}),
            ...(draft.department.trim() ? { department: draft.department } : {}),
          });
          return;
        }
        await api.customers.contacts.update(
          this.editing.id,
          {
            firstName: draft.firstName,
            lastName: draft.lastName,
            email: draft.email,
            phone: draft.phone,
            mobile: draft.mobile,
            title: draft.title,
            department: draft.department,
            status: draft.status,
            preferredContactMethod: draft.preferredContactMethod,
          },
          { ifMatch: this.editing.metadata.version },
        );
      });
      await this.record.load();
      this.cancel();
      return true;
    } catch (error) {
      this.report(error);
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /** One primary per account: the backend clears the previous mark in the same transaction. */
  async setPrimary(contact: Contact): Promise<boolean> {
    if (this.promoting() !== null) return false;
    this.promoting.set(contact.id);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      await this.health.mutation(() =>
        api.customers.contacts.setPrimary(contact.id, { ifMatch: contact.metadata.version }),
      );
      await this.record.load();
      return true;
    } catch (error) {
      this.report(error);
      return false;
    } finally {
      this.promoting.set(null);
    }
  }

  private report(error: unknown): void {
    if (isApiError(error, 'VALIDATION_FAILED')) {
      const map: Record<string, string[]> = {};
      for (const field of error.fieldErrors ?? []) {
        const message = MESSAGES[`${field.field}:${field.code}`] ?? field.message;
        map[field.field] = [...(map[field.field] ?? []), message];
      }
      this.errors.set(map);
      if (Object.keys(map).length === 0)
        this.failure.set({ code: error.code, message: error.message });
    } else if (isApiError(error)) {
      this.failure.set({ code: error.code, message: error.message });
    } else {
      this.failure.set({ code: 'UNKNOWN', message: 'The contact was not saved.' });
    }
  }

  private reset(): void {
    this.errors.set({});
    this.failure.set(null);
  }
}
