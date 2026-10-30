import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
  SlTableHead,
  SlTableLoader,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastService } from '@slotted/angular/toast';
import type { Contact } from '@slotted/demo-nexora-backend';

import { ContactFormStore } from '../../core/crm/contact-form.store';
import { SessionStore } from '../../core/session/session.store';

/**
 * The people on the account: the tab's table, and the form that writes one in
 * its place. A contact is never removed here — the backend has no command for
 * it — so a contact who left is marked inactive, which also clears the
 * primary mark (§56.4).
 */
@Component({
  selector: 'app-contacts-section',
  imports: [
    SlBadge,
    SlButton,
    SlCheckbox,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlForm,
    SlFormActions,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlResultState,
    SlResultStateContent,
    SlResultStateTitle,
    SlSection,
    SlSectionBody,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlStatusIndicator,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
    SlTableHead,
    SlTableLoader,
    SlTableRow,
    SlTableRowHeader,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .span-all {
      grid-column: 1 / -1;
    }
    .row-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--slotted-space-2);
    }
  `,
  template: `
    @if (form.mode() !== 'closed') {
      <section slSection>
        <div slSectionHeader>
          <div slSectionTitle>
            <h2 slSectionHeading>{{ heading() }}</h2>
          </div>
        </div>
        <div slSectionBody>
          <form
            slForm
            [messages]="{ summaryTitle: 'This contact was not saved' }"
            [errors]="form.errors()"
            (errorsChange)="form.errors.set($event.value)"
            [loading]="form.saving()"
            (formSubmit)="save($event)"
          >
            @if (form.failure(); as failure) {
              <div slInlineMessage [tone]="failure.code === 'FORBIDDEN' ? 'warning' : 'danger'">
                <span slInlineMessageIcon></span>
                {{ failure.message }}
              </div>
            }
            <div slGrid [columns]="2" [gap]="5" minItemWidth="sm">
              <div slField required [invalid]="!!error('firstName')">
                <label slFieldLabel>First name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="firstName"
                    required
                    autocomplete="given-name"
                    [value]="form.draft().firstName"
                    (valueChange)="form.patch({ firstName: $event.value })"
                  />
                </div>
                @if (error('firstName'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField required [invalid]="!!error('lastName')">
                <label slFieldLabel>Last name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="lastName"
                    required
                    autocomplete="family-name"
                    [value]="form.draft().lastName"
                    (valueChange)="form.patch({ lastName: $event.value })"
                  />
                </div>
                @if (error('lastName'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField>
                <label slFieldLabel>Title</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="title"
                    placeholder="Procurement Manager"
                    [value]="form.draft().title"
                    (valueChange)="form.patch({ title: $event.value })"
                  />
                </div>
              </div>
              <div slField>
                <label slFieldLabel>Department</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="department"
                    placeholder="Operations"
                    [value]="form.draft().department"
                    (valueChange)="form.patch({ department: $event.value })"
                  />
                </div>
              </div>
              <div slField [invalid]="!!error('email')">
                <label slFieldLabel>Email</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="email"
                    type="email"
                    autocomplete="email"
                    [value]="form.draft().email"
                    (valueChange)="form.patch({ email: $event.value })"
                  />
                </div>
                @if (error('email'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField>
                <label slFieldLabel>Phone</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="phone"
                    type="tel"
                    [value]="form.draft().phone"
                    (valueChange)="form.patch({ phone: $event.value })"
                  />
                </div>
              </div>
              <div slField>
                <label slFieldLabel>Mobile</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="mobile"
                    type="tel"
                    [value]="form.draft().mobile"
                    (valueChange)="form.patch({ mobile: $event.value })"
                  />
                </div>
              </div>
              <div slField>
                <label slFieldLabel>Reach them by</label>
                <sl-select
                  name="preferredContactMethod"
                  [value]="form.draft().preferredContactMethod"
                  (valueChangeRequest)="form.patch({ preferredContactMethod: $any($event.value) })"
                >
                  <sl-select-item value="email">Email</sl-select-item>
                  <sl-select-item value="phone">Phone</sl-select-item>
                  <sl-select-item value="mobile">Mobile</sl-select-item>
                </sl-select>
              </div>
              @if (form.mode() === 'edit') {
                <div slField>
                  <label slFieldLabel>Status</label>
                  <sl-select
                    name="status"
                    [value]="form.draft().status"
                    (valueChangeRequest)="form.patch({ status: $any($event.value) })"
                  >
                    <sl-select-item value="active">Active</sl-select-item>
                    <sl-select-item value="inactive">Inactive</sl-select-item>
                  </sl-select>
                  @if (form.draft().status === 'inactive') {
                    <span slFieldDescription>
                      A contact who has left keeps their history and stops being the primary one.
                    </span>
                  }
                </div>
              } @else {
                <div slField class="span-all">
                  <label slFieldLabel>Primary contact</label>
                  <div
                    slCheckbox
                    name="isPrimary"
                    [checked]="form.draft().isPrimary"
                    (checkedChange)="form.patch({ isPrimary: $event.value })"
                  >
                    Make this the primary contact
                  </div>
                  <span slFieldDescription>
                    One person per account carries the mark; whoever holds it now loses it.
                  </span>
                </div>
              }
            </div>
            <div slFormActions>
              <button
                slButton
                variant="ghost"
                tone="secondary"
                type="button"
                (click)="form.cancel()"
              >
                Cancel
              </button>
              <button
                slButton
                type="submit"
                [loading]="form.saving()"
                [messages]="{ loading: 'Saving the contact' }"
              >
                {{ form.mode() === 'new' ? 'Add contact' : 'Save contact' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    } @else {
      <div
        slTable
        variant="framed"
        [columns]="phone() ? 2 : 5"
        [layout]="phone() ? 'fixed' : 'auto'"
      >
        <div slTableContent>
          <caption slTableCaption>
            Contacts
          </caption>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Contact</th>
              @if (!phone()) {
                <th slTableColumnHeader>E-mail</th>
                <th slTableColumnHeader>Phone</th>
                <th slTableColumnHeader>Status</th>
              }
              <th slTableColumnHeader>Actions</th>
            </tr>
          </thead>
          @if (contacts() === null) {
            <tbody slTableLoader [skeletonRows]="3"></tbody>
          } @else if (contacts()!.length === 0) {
            <tbody slTableBody>
              <tr slTableRow>
                <td slTableEmpty>
                  <div slResultState status="empty" reach="section">
                    <div slResultStateContent>
                      <h3 slResultStateTitle>No one to call at this account yet</h3>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          } @else {
            <tbody slTableBody>
              @for (contact of contacts()!; track contact.id) {
                <tr slTableRow>
                  <!-- The person and what they do, one above the other: a column of its own for the role costs the actions their place. -->
                  <th slTableRowHeader>
                    <span slStack [gap]="1">
                      <span slInline [gap]="2">
                        {{ contact.displayName }}
                        @if (contact.isPrimary) {
                          <span slBadge tone="accent" variant="soft" size="sm">Primary</span>
                        }
                      </span>
                      @if (contact.title) {
                        <span slText size="sm" tone="muted">{{ contact.title }}</span>
                      }
                    </span>
                  </th>
                  @if (!phone()) {
                    <td slTableCell>
                      @if (contact.email) {
                        <a slLink [href]="'mailto:' + contact.email">{{ contact.email }}</a>
                      } @else {
                        —
                      }
                    </td>
                    <td slTableCell>{{ contact.phone ?? contact.mobile ?? '—' }}</td>
                    <td slTableCell>
                      <span
                        slStatusIndicator
                        size="sm"
                        [status]="contact.status === 'active' ? 'success' : 'neutral'"
                      >
                        {{ contact.status === 'active' ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  }
                  <td slTableCell>
                    <span class="row-actions">
                      @if (canManage()) {
                        @if (!contact.isPrimary && contact.status === 'active') {
                          <button
                            slButton
                            size="sm"
                            variant="ghost"
                            tone="secondary"
                            type="button"
                            [loading]="form.promoting() === contact.id"
                            [messages]="{ loading: 'Making primary' }"
                            (click)="setPrimary(contact)"
                          >
                            Make primary
                          </button>
                        }
                        <button
                          slButton
                          size="sm"
                          variant="ghost"
                          tone="secondary"
                          type="button"
                          (click)="form.startEdit(contact)"
                        >
                          Edit
                        </button>
                      } @else {
                        —
                      }
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          }
        </div>
      </div>
    }
  `,
})
export class ContactsSection {
  readonly contacts = input<readonly Contact[] | null>(null);
  readonly phone = input(false);

  readonly form = inject(ContactFormStore);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(SlToastService);

  canManage(): boolean {
    return this.session.can('contacts.manage');
  }

  heading(): string {
    const contact = this.form.contact;
    return contact === null ? 'New contact' : `Edit ${contact.displayName}`;
  }

  error(name: string): string | null {
    return this.form.errors()[name]?.[0] ?? null;
  }

  save(event: { pending: (work: Promise<void>) => void }): void {
    event.pending(this.run());
  }

  async setPrimary(contact: Contact): Promise<void> {
    if (await this.form.setPrimary(contact)) {
      this.toasts.show({
        title: `${contact.displayName} is the primary contact`,
        tone: 'success',
      });
    }
  }

  private async run(): Promise<void> {
    const creating = this.form.mode() === 'new';
    if (await this.form.save()) {
      this.toasts.show({ title: creating ? 'Contact added' : 'Contact saved', tone: 'success' });
    }
  }
}
