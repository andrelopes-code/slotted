import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlMenu, SlMenuItem, SlMenuItemDescription, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import {
  SlSection,
  SlSectionBody,
  SlSectionDescription,
  SlSectionEyebrow,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectGroup, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlText } from '@slotted/angular/typography';
import type { FormErrors } from '@slotted/core/form';
import {
  relativePeopleFor,
  taggableRecords,
  WEEKDAY_OPTIONS,
  type WorkflowActionDefinition,
  type WorkflowActionField,
  type WorkflowActionType,
  type WorkflowCatalog,
  type WorkflowTriggerType,
} from '@slotted/demo-nexora-backend';

import type { WorkflowDraft } from '../../core/automation/workflow-draft';
import { RuleBuilder } from './rule-builder';

/** The triggers of §69.1 in the record they are about, as the trigger control groups them. */
const TRIGGER_GROUPS: readonly { label: string; types: readonly WorkflowTriggerType[] }[] = [
  { label: 'Orders', types: ['order.created', 'order.confirmed', 'order.value_changed'] },
  { label: 'Invoices', types: ['invoice.overdue'] },
  { label: 'Stock', types: ['inventory.below_reorder_point'] },
  { label: 'Support', types: ['ticket.escalated'] },
  { label: 'Customers', types: ['customer.status_changed'] },
  { label: 'On a schedule', types: ['schedule.daily', 'schedule.weekly'] },
];

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, '0')}:00`,
}));

/** What a run is about, said under the trigger: the record the actions act on. */
const AFFECTS_WORDS: Record<string, string> = {
  sales_order: 'Each run is about the order, and reads the order and its customer.',
  invoice: 'Each run is about the invoice, and reads the invoice and its customer.',
  sku: 'Each run is about the SKU at the warehouse whose stock fell, and reads its stock there.',
  support_ticket: 'Each run is about the ticket, and reads the ticket and its customer.',
  customer: 'Each run is about the customer, and reads the customer as it now stands.',
};

/**
 * The Workflow Designer of §15, structured in the order of Journey G: what it
 * is, when it runs, which events it acts on, and what it does. Every control
 * is named by the backend's field (FM-02) and reads its message from the one
 * error map the host form holds (FM-03); the conditions are the Rule Builder.
 */
@Component({
  selector: 'app-workflow-designer',
  imports: [
    NgIcon,
    RuleBuilder,
    SlButton,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlGrid,
    SlIconButton,
    SlMenu,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuSeparator,
    SlMenuTrigger,
    SlNumberField,
    SlNumberFieldInput,
    SlSection,
    SlSectionBody,
    SlSectionDescription,
    SlSectionEyebrow,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectGroup,
    SlSelectItem,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .action {
      display: grid;
      gap: var(--slotted-space-3);
      padding-block: var(--slotted-space-3);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
      min-inline-size: 0;
    }
    .action-head {
      display: flex;
      align-items: center;
      gap: var(--slotted-space-2);
      min-inline-size: 0;
    }
    .action-head > :first-child {
      flex: 1 1 0;
      min-inline-size: 0;
    }
  `,
  template: `
    <div slStack [gap]="6">
      @if (about()) {
        <section slSection data-testid="designer-about">
          <div slSectionHeader>
            <div slSectionTitle><h2 slSectionHeading>About</h2></div>
          </div>
          <div slSectionBody>
            <div slStack [gap]="4">
              <div slField required [invalid]="!!error('name')">
                <label slFieldLabel>Name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="name"
                    data-testid="workflow-name"
                    placeholder="Notify the support lead of urgent escalations"
                    [value]="definition().name"
                    (valueChange)="draft().patch({ name: $event.value })"
                  />
                </div>
                @if (error('name'); as message) {
                  <p slFieldError>{{ message }}</p>
                }
              </div>
              <div slField>
                <label slFieldLabel>Description</label>
                <textarea
                  slTextarea
                  name="description"
                  [rows]="2"
                  autoSize
                  [value]="definition().description"
                  (valueChange)="draft().patch({ description: $event.value })"
                ></textarea>
              </div>
              <div slField required [invalid]="!!error('ownerId')">
                <label slFieldLabel>Owner</label>
                <sl-select
                  name="ownerId"
                  search
                  data-testid="workflow-owner"
                  placeholder="Choose the owner"
                  [value]="definition().ownerId || null"
                  (valueChangeRequest)="draft().patch({ ownerId: $any($event.value) ?? '' })"
                >
                  @for (owner of catalog()?.owners ?? []; track owner.id) {
                    <sl-select-item [value]="owner.id" [label]="owner.name">{{ owner.name }}</sl-select-item>
                  }
                </sl-select>
                @if (error('ownerId'); as message) {
                  <p slFieldError>{{ message }}</p>
                } @else {
                  <span slFieldDescription>
                    Told when a run fails and stops the workflow. An owner reads workflows: a manager, an
                    executive, an auditor or an administrator.
                  </span>
                }
              </div>
            </div>
          </div>
        </section>
      }

      <section slSection data-testid="designer-trigger">
        <div slSectionHeader>
          <div slSectionTitle>
            <span slSectionEyebrow>Step 1</span>
            <h2 slSectionHeading>When</h2>
            <p slSectionDescription>The event that starts a run.</p>
          </div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="4">
            <div slField required [invalid]="!!error('trigger.type')">
              <label slFieldLabel>Trigger</label>
              <sl-select
                name="trigger.type"
                data-testid="trigger"
                placeholder="Choose the event"
                [value]="definition().trigger.type || null"
                (valueChangeRequest)="setTrigger($any($event.value))"
              >
                @for (group of triggerGroups; track group.label) {
                  <sl-select-group [label]="group.label">
                    @for (type of group.types; track type) {
                      <sl-select-item [value]="type">{{ triggerLabel(type) }}</sl-select-item>
                    }
                  </sl-select-group>
                }
              </sl-select>
              @if (error('trigger.type'); as message) {
                <p slFieldError>{{ message }}</p>
              } @else if (affects(); as words) {
                <span slFieldDescription data-testid="trigger-affects">{{ words }}</span>
              }
            </div>
            @if (trigger()?.schedule; as schedule) {
              <div slGrid [columns]="schedule === 'weekly' ? 2 : 1" minItemWidth="xs" [gap]="4">
                @if (schedule === 'weekly') {
                  <div slField required [invalid]="!!error('trigger.config.weekday')">
                    <label slFieldLabel>Day</label>
                    <sl-select
                      name="trigger.config.weekday"
                      data-testid="trigger-weekday"
                      [value]="weekday()"
                      (valueChangeRequest)="draft().setScheduleConfig('weekday', $any($event.value) ?? 'monday')"
                    >
                      @for (day of weekdays; track day.value) {
                        <sl-select-item [value]="day.value">{{ day.label }}</sl-select-item>
                      }
                    </sl-select>
                    @if (error('trigger.config.weekday'); as message) {
                      <p slFieldError>{{ message }}</p>
                    }
                  </div>
                }
                <div slField required [invalid]="!!error('trigger.config.hour')">
                  <label slFieldLabel>Hour, Central time</label>
                  <sl-select
                    name="trigger.config.hour"
                    data-testid="trigger-hour"
                    [value]="hour()"
                    (valueChangeRequest)="draft().setScheduleConfig('hour', toNumber($event.value))"
                  >
                    @for (hour of hours; track hour.value) {
                      <sl-select-item [value]="hour.value">{{ hour.label }}</sl-select-item>
                    }
                  </sl-select>
                  @if (error('trigger.config.hour'); as message) {
                    <p slFieldError>{{ message }}</p>
                  } @else {
                    <span slFieldDescription>
                      A schedule runs once a day at most: a clock moved past several occurrences runs it once, for the last.
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <section slSection data-testid="designer-conditions">
        <div slSectionHeader>
          <div slSectionTitle>
            <span slSectionEyebrow>Step 2</span>
            <h2 slSectionHeading>If</h2>
            <p slSectionDescription>
              {{ trigger() ? 'Which events it acts on: the fields are the records as they stand after the event.' : 'Choose the trigger first: the fields are the records it carries.' }}
            </p>
          </div>
        </div>
        <div slSectionBody>
          <app-rule-builder [draft]="draft()" [showIssues]="showIssues()" [issues]="nodeIssues()" />
        </div>
      </section>

      <section slSection data-testid="designer-actions">
        <div slSectionHeader>
          <div slSectionTitle>
            <span slSectionEyebrow>Step 3</span>
            <h2 slSectionHeading>Then</h2>
            <p slSectionDescription>What it does, in order. Each action runs on its own: one that fails does not stop the next.</p>
          </div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="2">
            @for (action of definition().actions; track $index; let index = $index) {
              <div class="action" [attr.data-testid]="'action-' + index">
                <div class="action-head">
                  <span slText weight="medium">{{ index + 1 }} · {{ actionLabel(action.type) }}</span>
                  <button
                    slIconButton
                    size="sm"
                    variant="ghost"
                    tone="secondary"
                    type="button"
                    [attr.aria-label]="'Actions for action ' + (index + 1)"
                    [slMenuTriggerFor]="actionMenu"
                  >
                    <ng-icon name="lucideEllipsisVertical" />
                  </button>
                  <sl-menu #actionMenu>
                    <button slMenuItem [disabled]="index === 0" (select)="draft().moveAction(index, -1)">Move up</button>
                    <button slMenuItem [disabled]="index === definition().actions.length - 1" (select)="draft().moveAction(index, 1)">
                      Move down
                    </button>
                    <hr slMenuSeparator />
                    <button slMenuItem tone="danger" [attr.data-testid]="'remove-action-' + index" (select)="draft().removeAction(index)">
                      Remove action
                    </button>
                  </sl-menu>
                </div>
                @if (error('actions.' + index + '.type'); as message) {
                  <span slText size="sm" tone="danger">{{ message }}</span>
                }
                @if (definitionOf(action.type); as definition) {
                  <div slGrid [columns]="2" minItemWidth="sm" [gap]="4">
                    @for (field of definition.fields; track field.key) {
                      <div
                        slField
                        [required]="field.required"
                        [invalid]="!!error(key(index, field.key))"
                        [attr.data-testid]="'action-' + index + '-' + field.key"
                      >
                        <label slFieldLabel>{{ field.label }}</label>
                        @switch (field.kind) {
                          @case ('person') {
                            <sl-select
                              search
                              [attr.name]="key(index, field.key)"
                              placeholder="Choose someone"
                              [value]="text(action.config[field.key])"
                              (valueChangeRequest)="draft().setActionConfig(index, field.key, $event.value)"
                            >
                              @if (personRelative(field)) {
                                <sl-select-group label="By their part in the event">
                                  @for (relative of relatives(); track relative.key) {
                                    <sl-select-item [value]="relative.key" [label]="relative.label">{{ relative.label }}</sl-select-item>
                                  }
                                </sl-select-group>
                              }
                              <sl-select-group label="By name">
                                @for (person of catalog()?.people ?? []; track person.id) {
                                  <sl-select-item [value]="person.id" [label]="person.name" [description]="person.title">{{ person.name }}</sl-select-item>
                                }
                              </sl-select-group>
                            </sl-select>
                          }
                          @case ('choice') {
                            <sl-select
                              [attr.name]="key(index, field.key)"
                              [value]="text(action.config[field.key])"
                              (valueChangeRequest)="draft().setActionConfig(index, field.key, $event.value)"
                            >
                              @for (option of choiceOptions(field); track option.value) {
                                <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
                              }
                            </sl-select>
                          }
                          @case ('record') {
                            <sl-select
                              [attr.name]="key(index, field.key)"
                              [value]="text(action.config[field.key])"
                              (valueChangeRequest)="draft().setActionConfig(index, field.key, $event.value)"
                            >
                              @for (record of records(); track record) {
                                <sl-select-item [value]="record">{{ record === 'ticket' ? 'The ticket' : 'The customer' }}</sl-select-item>
                              }
                            </sl-select>
                          }
                          @case ('number') {
                            <div slNumberField stepper="none">
                              <input
                                slNumberFieldInput
                                [attr.name]="key(index, field.key)"
                                [min]="numberField(field).min"
                                [max]="numberField(field).max"
                                [value]="number(action.config[field.key])"
                                (valueChange)="draft().setActionConfig(index, field.key, $event.value)"
                              />
                            </div>
                          }
                          @default {
                            @if (field.key === 'body' || field.key === 'reason') {
                              <textarea
                                slTextarea
                                autoSize
                                [rows]="2"
                                [attr.name]="key(index, field.key)"
                                [value]="text(action.config[field.key]) ?? ''"
                                (valueChange)="draft().setActionConfig(index, field.key, $event.value)"
                              ></textarea>
                            } @else {
                              <div slTextField>
                                <input
                                  slTextFieldInput
                                  [attr.name]="key(index, field.key)"
                                  [value]="text(action.config[field.key]) ?? ''"
                                  (valueChange)="draft().setActionConfig(index, field.key, $event.value)"
                                />
                              </div>
                            }
                          }
                        }
                        @if (error(key(index, field.key)); as message) {
                          <p slFieldError>{{ message }}</p>
                        } @else if (hint(action.type, field.key); as words) {
                          <span slFieldDescription>{{ words }}</span>
                        }
                      </div>
                    }
                  </div>
                  @if (definition.fields.length === 0) {
                    <span slText size="sm" tone="muted">{{ hint(action.type, '') }}</span>
                  }
                }
              </div>
            } @empty {
              <span slText size="sm" [tone]="showIssues() ? 'danger' : 'muted'" data-testid="no-action">
                No action yet: a workflow does at least one thing.
              </span>
            }
            <span>
              <button slButton size="sm" variant="outline" type="button" data-testid="add-action" [slMenuTriggerFor]="addMenu">
                <ng-icon name="lucidePlus" /> Add an action
              </button>
            </span>
            <sl-menu #addMenu>
              @for (definition of actionDefinitions(); track definition.type) {
                <button
                  slMenuItem
                  [attr.data-testid]="'add-' + definition.type"
                  [disabled]="!available(definition)"
                  (select)="draft().addAction(definition.type)"
                >
                  {{ definition.label }}
                  @if (!available(definition)) {
                    <span slMenuItemDescription>{{ unavailableWords() }}</span>
                  }
                </button>
              }
            </sl-menu>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class WorkflowDesigner {
  readonly draft = input.required<WorkflowDraft>();
  readonly catalog = input<WorkflowCatalog | null>(null);
  /** The host form's one error map: the platform's own check and the backend's answer (FM-03). */
  readonly errors = input<FormErrors>({});
  readonly showIssues = input(false);
  /** False on the record, whose name and owner stand in its own header and facts. */
  readonly about = input(true);

  readonly triggerGroups = TRIGGER_GROUPS;
  readonly hours = HOURS;
  readonly weekdays = WEEKDAY_OPTIONS;

  readonly definition = computed(() => this.draft().definition());
  readonly trigger = computed(() => this.draft().trigger());
  readonly nodeIssues = computed(() => this.draft().runIssues().nodes);
  readonly actionDefinitions = computed(() => this.catalog()?.actions ?? []);
  readonly records = computed(() => {
    const trigger = this.trigger();
    return trigger ? taggableRecords(trigger) : [];
  });
  readonly relatives = computed(() => {
    const trigger = this.trigger();
    const catalog = this.catalog();
    if (!trigger || !catalog) return [];
    return relativePeopleFor(trigger).map((key) => ({ key, label: catalog.relativePeople[key]?.label ?? key }));
  });

  readonly affects = computed(() => {
    const trigger = this.trigger();
    if (!trigger) return null;
    return trigger.affects ? AFFECTS_WORDS[trigger.affects] ?? null : 'A scheduled run is about no one record: its fields are counts of the tenant at the hour it runs.';
  });
  readonly weekday = computed(() => {
    const value = this.definition().trigger.config['weekday'];
    return typeof value === 'string' ? value : null;
  });
  readonly hour = computed(() => {
    const value = this.definition().trigger.config['hour'];
    return typeof value === 'number' ? String(value) : null;
  });

  readonly unavailableWords = computed(() => {
    const trigger = this.trigger();
    return trigger ? `No record to act on when ${trigger.label.toLowerCase()}.` : 'Choose the trigger first.';
  });

  error(name: string): string | null {
    return this.errors()[name]?.[0] ?? null;
  }

  key(index: number, field: string): string {
    return `actions.${index}.config.${field}`;
  }

  triggerLabel(type: WorkflowTriggerType): string {
    return this.catalog()?.triggers.find((trigger) => trigger.type === type)?.label ?? type;
  }

  setTrigger(type: WorkflowTriggerType | null): void {
    if (type) this.draft().setTrigger(type);
  }

  definitionOf(type: WorkflowActionType): WorkflowActionDefinition | undefined {
    return this.catalog()?.actions.find((action) => action.type === type);
  }

  actionLabel(type: WorkflowActionType): string {
    return this.definitionOf(type)?.label ?? type;
  }

  available(definition: WorkflowActionDefinition): boolean {
    const trigger = this.trigger();
    return trigger !== undefined && definition.triggers.includes(trigger.type);
  }

  personRelative(field: WorkflowActionField): boolean {
    return field.kind === 'person' && field.relative;
  }

  choiceOptions(field: WorkflowActionField) {
    return field.kind === 'choice' ? field.options : [];
  }

  numberField(field: WorkflowActionField): { min: number; max: number } {
    return field.kind === 'number' ? { min: field.min, max: field.max } : { min: 0, max: 0 };
  }

  text(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  number(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  /** What an action does with its field, where the label alone does not say. */
  hint(type: WorkflowActionType, key: string): string | null {
    switch (`${type}:${key}`) {
      case 'send_notification:recipient':
        return 'The notification opens the record the run is about.';
      case 'create_task:assignee':
        return 'The task opens the record the run is about, and its assignee is told.';
      case 'create_task:dueInDays':
        return 'Days after the run; none for no due date.';
      case 'assign_user:assignee':
        return this.trigger()?.type === 'ticket.escalated'
          ? 'Assigns the ticket, as Assign does in the inbox.'
          : 'Makes them the account owner.';
      case 'request_approval:role':
        return 'A confirmed order goes back to pending approval and releases its reservations until it is decided.';
      case 'place_order_on_hold:reason':
        return 'Only a confirmed order, or one pending approval, can be held.';
      case 'create_purchase_order_draft:':
        return 'Drafts a purchase order from the SKU’s preferred supplier for the quantity that tops the stock up to its maximum; a buyer submits it.';
      default:
        return null;
    }
  }
}
