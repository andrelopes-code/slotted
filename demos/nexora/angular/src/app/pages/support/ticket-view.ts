import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SlButton, SlButtonLink, SlIconButton } from '@slotted/angular/button';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderBack,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderSubheading,
  SlPageHeaderTabs,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlPromptComposer,
  SlPromptComposerAction,
  SlPromptComposerFooter,
  SlPromptComposerHeader,
  SlPromptComposerInput,
  SlPromptComposerSubmit,
  type PromptComposerStatus,
} from '@slotted/angular/prompt-composer';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlScrollArea } from '@slotted/angular/scroll-area';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlToastService } from '@slotted/angular/toast';
import {
  SlToolbar,
  SlToolbarItem,
  SlToolbarOverflow,
  SlToolbarSeparator,
} from '@slotted/angular/toolbar';
import { SlTooltip, SlTooltipContent, SlTooltipLayer, SlTooltipTrigger } from '@slotted/angular/tooltip';
import { SlText } from '@slotted/angular/typography';
import type { ChangeRequest } from '@slotted/core/state';

import { toneFor } from '../../core/inventory/inventory-failure';
import { SessionStore } from '../../core/session/session.store';
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  reopenPermission,
  RESOLUTION_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  SUPPORT_HOLDERS,
  supportAdvice,
} from '../../core/support/support.model';
import { TicketStore, type ComposerMode, type ReplyStatus } from '../../core/support/ticket.store';
import { ConfirmDialog } from '../inventory/confirm-dialog';
import { ReasonDialog } from '../orders/reason-dialog';
import { TicketContext } from './ticket-context';
import { EscalateDialog, ResolveDialog, type EscalationRequest } from './ticket-dialogs';
import { TicketThread } from './ticket-thread';

type View = 'conversation' | 'details';
/** What a reply moves the ticket to as it is sent; `keep` leaves the status to §68.5's own rule. */
type After = 'keep' | ReplyStatus;

const AFTER_LABEL: Record<After, string> = {
  keep: 'Keep the status',
  open: 'Keep the status',
  pending_customer: 'Wait on the customer',
  pending_internal: 'Wait internally',
  resolved: 'Resolve as information given',
};

/**
 * The width from which the context stands beside the conversation rather than behind a tab: a
 * conversation of 30rem beside a context of 16rem and the gap between them.
 */
const WIDE_FROM = 760;

/**
 * One ticket (§14, §34.6, §68): the header with the commands its status
 * allows the reader, the conversation with the composer under it, and the
 * context. The conversation scrolls itself and the composer stays under it,
 * so the reply is in reach with the thread scrolled; the context scrolls on
 * its own beside it. Where the region is narrower than two readable columns —
 * on a phone, or beside the queue on a small screen — the context is the
 * header's second tab.
 */
@Component({
  selector: 'app-ticket-view',
  imports: [
    ConfirmDialog,
    EscalateDialog,
    NgIcon,
    ReasonDialog,
    ResolveDialog,
    RouterLink,
    SlButton,
    SlButtonLink,
    SlIconButton,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuRadioGroup,
    SlMenuTrigger,
    SlPageHeader,
    SlPageHeaderActions,
    SlPageHeaderBack,
    SlPageHeaderHeading,
    SlPageHeaderMarks,
    SlPageHeaderNav,
    SlPageHeaderSubheading,
    SlPageHeaderTabs,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPromptComposer,
    SlPromptComposerAction,
    SlPromptComposerFooter,
    SlPromptComposerHeader,
    SlPromptComposerInput,
    SlPromptComposerSubmit,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlScrollArea,
    SlSegment,
    SlSegmentedControl,
    SlSkeleton,
    SlStack,
    SlTab,
    SlTabList,
    SlTabs,
    SlTag,
    SlTagBody,
    SlText,
    SlToolbar,
    SlToolbarItem,
    SlToolbarOverflow,
    SlToolbarSeparator,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
    TicketContext,
    TicketThread,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * Header, banner and the columns, as tall as the region: the conversation and the context each
     * scroll inside their own column, the region does not (§34.6 "scroll boundaries").
     */
    :host {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: var(--slotted-space-3);
      min-block-size: 0;
      min-inline-size: 0;
    }
    .columns {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-5);
      min-block-size: 0;
    }
    :host([data-wide]) .columns {
      grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem);
    }
    .conversation {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: var(--slotted-space-3);
      min-block-size: 0;
    }
    .context {
      min-block-size: 0;
    }
    :host([data-wide]) .context {
      padding-inline-start: var(--slotted-space-5);
      border-inline-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    /*
     * The mode and its one line stay on one row in both modes: the line is cut with an ellipsis and
     * read whole from its title, so switching between a reply and a note never moves the composer.
     */
    .composer-head {
      display: flex;
      align-items: center;
      gap: var(--slotted-space-3);
      min-inline-size: 0;
    }
    .composer-head > [slSegmentedControl] {
      flex: none;
    }
    .composer-note {
      flex: 1 1 0;
      min-inline-size: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    /*
     * literal: the compact size class (COMPACT_BELOW in @slotted/core/measure). Below it the page
     * scrolls (LP-12): the conversation takes its own height, the page opens on its last message,
     * and the composer stays at the bottom of the screen with the thread passing under it.
     */
    @media (width < 600px) {
      :host,
      .columns,
      .conversation {
        display: block;
      }
      /* The page header cuts a heading at two lines: the ticket's reserves both while it loads and
         once it has a subject of one, so the conversation under it never moves (loading-states §3). */
      [slPageHeaderHeading] {
        min-block-size: 2lh;
      }
      .dock {
        position: sticky;
        inset-block-end: var(--slotted-page-sticky-bottom, 0px);
        z-index: 1;
        padding-block: var(--slotted-space-3);
        background-color: var(--slotted-page-background-sunken, var(--slotted-surface-sunken));
      }
    }
    .skeleton-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--slotted-space-3);
    }
  `,
  host: {
    '[attr.data-wide]': 'wide() ? "" : null',
    '[attr.aria-busy]': 'store.loading() ? "true" : null',
    'data-testid': 'ticket',
  },
  template: `
    @let ticket = store.ticket();
    <!-- Beside the queue the ticket's header stands inside the inbox's padding: a box of its own.
         On a phone the ticket is the page, and its header is the page's band. -->
    <header slPageHeader [variant]="phone() ? 'band' : 'floating'">
      <div slPageHeaderTitleArea>
        @if (phone()) {
          <div slPageHeaderNav>
            <a slPageHeaderBack [routerLink]="route()">Inbox</a>
          </div>
        }
        <div slPageHeaderTitleRow>
          <div slPageHeaderTitle>
            @if (phone()) {
              <h1 slPageHeaderHeading #heading tabindex="-1" [title]="ticket?.subject ?? ''">
                {{ ticket?.subject ?? 'Ticket' }}
              </h1>
            } @else {
              <h2 slPageHeaderHeading #heading tabindex="-1" [title]="ticket?.subject ?? ''">
                {{ ticket?.subject ?? 'Ticket' }}
              </h2>
            }
            @if (ticket) {
              <span slPageHeaderMarks>
                <span slTag size="sm" [tone]="statusTone()" data-testid="status"
                  ><span slTagBody>{{ statusWord() }}</span></span
                >
                @if (ticket.priority === 'high' || ticket.priority === 'urgent') {
                  <span slTag size="sm" [tone]="priorityTone()"
                    ><span slTagBody>{{ priorityWord() }}</span></span
                  >
                }
              </span>
              <p slPageHeaderSubheading>{{ subheading() }}</p>
            } @else if (store.error() === null) {
              <span slPageHeaderMarks
                ><span slTag size="sm" tone="secondary"
                  ><span slTagBody><span slSkeleton shape="text" inlineSize="4rem"></span></span></span
              ></span>
              <p slPageHeaderSubheading><span slSkeleton shape="text" inlineSize="55%"></span></p>
            }
          </div>
          @if (ticket) {
            <div slPageHeaderActions>
              <div slToolbar aria-label="Ticket actions" overflow="menu">
                @if (canAssignToMe()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="assignMeItem">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      data-testid="assign-me"
                      [loading]="store.busy() === 'assign'"
                      [messages]="{ loading: 'Assigning' }"
                      [disabled]="store.busy() !== null && store.busy() !== 'assign'"
                      (click)="assignToMe()"
                    >
                      Assign to me
                    </button>
                  </div>
                }
                @if (store.can('pendingCustomer')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="pendingCustomerItem">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      data-testid="pending-customer"
                      [loading]="store.busy() === 'pendingCustomer'"
                      [messages]="{ loading: 'Waiting on the customer' }"
                      [disabled]="store.busy() !== null && store.busy() !== 'pendingCustomer'"
                      (click)="waitOnCustomer()"
                    >
                      Wait on customer
                    </button>
                  </div>
                }
                @if (store.can('pendingInternal')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="pendingInternalItem">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      data-testid="pending-internal"
                      [loading]="store.busy() === 'pendingInternal'"
                      [messages]="{ loading: 'Waiting internally' }"
                      [disabled]="store.busy() !== null && store.busy() !== 'pendingInternal'"
                      (click)="waitInternally()"
                    >
                      Wait internally
                    </button>
                  </div>
                }
                @if (store.can('escalate')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="escalateItem">
                    <button
                      slButton
                      variant="outline"
                      tone="warning"
                      type="button"
                      data-testid="escalate"
                      [disabled]="store.busy() !== null"
                      (click)="escalateOpen.set(true)"
                    >
                      Escalate
                    </button>
                  </div>
                }
                @if (store.can('resolve')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="resolveItem">
                    <button
                      slButton
                      tone="accent"
                      type="button"
                      data-testid="resolve"
                      [disabled]="store.busy() !== null"
                      (click)="resolveOpen.set(true)"
                    >
                      Resolve
                    </button>
                  </div>
                }
                @if (store.can('reopen')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="reopenItem">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      data-testid="reopen"
                      [disabled]="store.busy() !== null"
                      (click)="reopenOpen.set(true)"
                    >
                      Reopen
                    </button>
                  </div>
                }
                @if (store.can('close')) {
                  <div slToolbarItem [slToolbarItemCounterpart]="closeItem">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      data-testid="close"
                      [disabled]="store.busy() !== null"
                      (click)="closeOpen.set(true)"
                    >
                      Close
                    </button>
                  </div>
                }
                @if (canSimulate()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="simulateItem">
                    <button
                      slButton
                      variant="ghost"
                      tone="secondary"
                      type="button"
                      data-testid="simulate"
                      [disabled]="store.busy() !== null"
                      (click)="simulateOpen.set(true)"
                    >
                      Simulate a customer message
                    </button>
                  </div>
                }
                <div slToolbarSeparator></div>
                <!-- Another agent may change the ticket while it is open (AF-07): the read keeps the values and marks the region busy. -->
                <div slToolbarItem [slToolbarItemCounterpart]="refreshItem">
                  <ng-container slTooltip openOn="hover" side="bottom">
                    <button
                      slIconButton
                      slTooltipTrigger
                      variant="ghost"
                      tone="secondary"
                      type="button"
                      aria-label="Refresh"
                      data-testid="refresh"
                      [loading]="store.refreshing()"
                      [messages]="{ loading: 'Refreshing' }"
                      (click)="store.load()"
                    >
                      <ng-icon name="lucideRefreshCw" />
                    </button>
                    <ng-template slTooltipLayer
                      ><div slTooltipContent>Refresh</div></ng-template
                    >
                  </ng-container>
                </div>
                @if (!phone()) {
                  <div slToolbarItem [slToolbarItemCounterpart]="previousItem">
                    <ng-container slTooltip openOn="hover" side="bottom">
                      <button
                        slIconButton
                        slTooltipTrigger
                        variant="ghost"
                        tone="secondary"
                        type="button"
                        aria-label="Previous ticket (K)"
                        data-testid="previous"
                        [disabled]="previousId() === null"
                        (click)="step.emit(-1)"
                      >
                        <ng-icon name="lucideChevronUp" />
                      </button>
                      <ng-template slTooltipLayer
                        ><div slTooltipContent>Previous ticket · K</div></ng-template
                      >
                    </ng-container>
                  </div>
                  <div slToolbarItem [slToolbarItemCounterpart]="nextItem">
                    <ng-container slTooltip openOn="hover" side="bottom">
                      <button
                        slIconButton
                        slTooltipTrigger
                        variant="ghost"
                        tone="secondary"
                        type="button"
                        aria-label="Next ticket (J)"
                        data-testid="next"
                        [disabled]="nextId() === null"
                        (click)="step.emit(1)"
                      >
                        <ng-icon name="lucideChevronDown" />
                      </button>
                      <ng-template slTooltipLayer
                        ><div slTooltipContent>Next ticket · J</div></ng-template
                      >
                    </ng-container>
                  </div>
                }
                <sl-toolbar-overflow />
              </div>
            </div>
          }
        </div>
      </div>
      @if (!wide() && store.error() === null) {
        <div slPageHeaderTabs>
          <div slTabs [value]="view()" (valueChange)="view.set($any($event.value) ?? 'conversation')">
            <div slTabList aria-label="Ticket sections">
              <div slTab value="conversation">
                Conversation {{ ticket ? '(' + ticket.messageCount + ')' : '' }}
              </div>
              <div slTab value="details">Details</div>
            </div>
          </div>
        </div>
      }
    </header>

    <div>
      @if (store.failure(); as failure) {
        <div slInlineMessage [tone]="failureTone(failure.kind)" data-testid="failure">
          <span slInlineMessageIcon></span>
          <span slStack [gap]="1">
            <span slText size="sm">{{ failure.message }}</span>
            <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
          </span>
        </div>
      } @else if (gateWords(); as words) {
        <span slText size="sm" tone="muted" data-testid="gate">{{ words }}</span>
      }
    </div>

    @if (store.error(); as error) {
      <div slResultState [status]="error.code === 'NOT_FOUND' ? 'not-found' : 'error'" data-testid="missing">
        <div slResultStateContent>
          <h3 slResultStateTitle>
            {{ error.code === 'NOT_FOUND' ? 'This ticket does not exist' : 'The ticket could not be loaded' }}
          </h3>
          <p slResultStateDescription>
            {{
              error.code === 'NOT_FOUND'
                ? 'No ticket has this identifier. The inbox lists every ticket there is.'
                : error.message
            }}
          </p>
        </div>
        <div slResultStateActions>
          @if (error.code !== 'NOT_FOUND') {
            <button slButton type="button" (click)="store.load()">Try again</button>
          }
          <a slButtonLink variant="ghost" tone="secondary" [routerLink]="route()">Back to the inbox</a>
        </div>
      </div>
    } @else {
      <div class="columns">
        @if (wide() || view() === 'conversation') {
          <div class="conversation">
            @if (store.detail(); as detail) {
              <app-ticket-thread [detail]="detail" />
            } @else {
              <!-- Three messages, each the anatomy of a thread row: the avatar, the name line and the words. -->
              <div slStack [gap]="5" aria-hidden="true">
                @for (row of [1, 2, 3]; track row) {
                  <div class="skeleton-row">
                    <span slSkeleton shape="circle" inlineSize="2rem" blockSize="2rem"></span>
                    <span slStack [gap]="2">
                      <span slSkeleton shape="text" inlineSize="10rem"></span>
                      <span slSkeleton shape="text" [inlineSize]="row === 2 ? '55%' : '90%'"></span>
                      @if (row !== 2) {
                        <span slSkeleton shape="text" inlineSize="70%"></span>
                      }
                    </span>
                  </div>
                }
              </div>
            }
            @if (ticket) {
              <div class="dock" #dock>
              @if (canWrite()) {
                <form
                  slPromptComposer
                  variant="outline"
                  submitOn="mod-enter"
                  data-testid="composer"
                  [status]="composerStatus()"
                  [attr.data-mode]="store.mode()"
                  (valueSubmit)="send()"
                >
                  <div slPromptComposerHeader>
                    <span class="composer-head">
                      <div
                        slSegmentedControl
                        size="sm"
                        aria-label="What you write"
                        data-testid="mode"
                        [value]="store.mode()"
                        (valueChange)="setMode($event.value)"
                      >
                        <label slSegment value="reply">Reply</label>
                        <label slSegment value="note">Internal note</label>
                      </div>
                      <span
                        slText
                        size="sm"
                        tone="muted"
                        class="composer-note"
                        data-testid="mode-words"
                        [title]="modeWords()"
                        >{{ modeWords() }}</span
                      >
                    </span>
                  </div>
                  <textarea
                    slPromptComposerInput
                    data-testid="composer-input"
                    [rows]="2"
                    [attr.aria-label]="store.mode() === 'reply' ? 'Reply to the customer' : 'Internal note'"
                    [placeholder]="store.mode() === 'reply' ? 'Write to ' + recipient() : 'Write for your team'"
                    [value]="store.composing()"
                    (valueChange)="typed($event)"
                  ></textarea>
                  <div slPromptComposerFooter>
                    @if (store.mode() === 'reply') {
                      @if (macros().length > 0) {
                        <button slPromptComposerAction type="button" [slMenuTriggerFor]="macroMenu">
                          Macro
                        </button>
                      }
                      <button
                        slPromptComposerAction
                        type="button"
                        data-testid="after"
                        [slMenuTriggerFor]="afterMenu"
                      >
                        Then: {{ afterWord() }}
                      </button>
                    }
                    <button slPromptComposerSubmit>
                      {{ store.mode() === 'reply' ? 'Send reply' : 'Add note' }}
                    </button>
                  </div>
                </form>
                <sl-menu #macroMenu>
                  <sl-menu-group label="Fill the reply from a macro">
                    @for (macro of macros(); track macro.id) {
                      <button slMenuItem type="button" (click)="applyMacro(macro.id)">
                        {{ macro.name }}
                      </button>
                    }
                  </sl-menu-group>
                </sl-menu>
                <sl-menu #afterMenu>
                  <sl-menu-group label="After the reply is sent">
                    <sl-menu-radio-group
                      [value]="after()"
                      (valueChangeRequest)="after.set($any($event.value))"
                    >
                      @for (option of afterOptions(); track option) {
                        <button slMenuRadioItem [value]="option">{{ afterLabel(option) }}</button>
                      }
                    </sl-menu-radio-group>
                  </sl-menu-group>
                </sl-menu>
              } @else {
                <span slText size="sm" tone="muted" data-testid="read-only">{{ readOnlyWords() }}</span>
              }
              </div>
            }
          </div>
        }
        @if (wide() || view() === 'details') {
          <div slScrollArea class="context" [messages]="{ label: 'Ticket context' }">
            @if (store.detail(); as detail) {
              <app-ticket-context [detail]="detail" />
            } @else {
              <div slStack [gap]="4" aria-hidden="true">
                @for (row of [1, 2, 3, 4]; track row) {
                  <span slStack [gap]="2">
                    <span slSkeleton shape="text" inlineSize="7rem"></span>
                    <span slSkeleton shape="text" [inlineSize]="row % 2 === 0 ? '60%' : '85%'"></span>
                  </span>
                }
              </div>
            }
          </div>
        }
      </div>
    }

    <ng-template #assignMeItem>
      <button slMenuItem type="button" (click)="assignToMe()">Assign to me</button>
    </ng-template>
    <ng-template #pendingCustomerItem>
      <button slMenuItem type="button" (click)="waitOnCustomer()">Wait on customer</button>
    </ng-template>
    <ng-template #pendingInternalItem>
      <button slMenuItem type="button" (click)="waitInternally()">Wait internally</button>
    </ng-template>
    <ng-template #escalateItem>
      <button slMenuItem type="button" (click)="escalateOpen.set(true)">Escalate</button>
    </ng-template>
    <ng-template #resolveItem>
      <button slMenuItem type="button" (click)="resolveOpen.set(true)">Resolve</button>
    </ng-template>
    <ng-template #reopenItem>
      <button slMenuItem type="button" (click)="reopenOpen.set(true)">Reopen</button>
    </ng-template>
    <ng-template #closeItem>
      <button slMenuItem type="button" (click)="closeOpen.set(true)">Close</button>
    </ng-template>
    <ng-template #simulateItem>
      <button slMenuItem type="button" (click)="simulateOpen.set(true)">
        Simulate a customer message
      </button>
    </ng-template>
    <ng-template #refreshItem>
      <button slMenuItem type="button" (click)="store.load()">Refresh</button>
    </ng-template>
    <ng-template #previousItem>
      <button slMenuItem type="button" [disabled]="previousId() === null" (click)="step.emit(-1)">
        Previous ticket
      </button>
    </ng-template>
    <ng-template #nextItem>
      <button slMenuItem type="button" [disabled]="nextId() === null" (click)="step.emit(1)">
        Next ticket
      </button>
    </ng-template>

    <app-resolve-dialog
      [(open)]="resolveOpen"
      [busy]="store.busy() === 'resolve'"
      [reply]="store.draft().reply"
      (confirm)="resolve($event)"
    />
    <app-escalate-dialog
      [(open)]="escalateOpen"
      [busy]="store.busy() === 'escalate'"
      [agents]="store.agents()"
      (confirm)="escalate($event)"
    />
    <app-reason-dialog
      [(open)]="pendingReasonOpen"
      title="Wait on the customer"
      description="No public reply has been sent yet, so the customer has not been asked anything. Say what the ticket waits for: the resolution clock stops until the customer writes."
      label="What the ticket waits for"
      placeholder="Photos of the damaged cartons."
      note="Kept as an internal line of the conversation; the customer does not see it."
      confirmLabel="Wait on customer"
      tone="accent"
      [busy]="store.busy() === 'pendingCustomer'"
      (confirm)="waitOnCustomer($event)"
    />
    <app-reason-dialog
      [(open)]="reopenOpen"
      title="Reopen the ticket"
      [description]="reopenWords()"
      label="Why it is reopened"
      placeholder="The replacement arrived damaged."
      note="Kept as an internal line of the conversation."
      confirmLabel="Reopen"
      tone="accent"
      [busy]="store.busy() === 'reopen'"
      (confirm)="reopen($event)"
    />
    <app-reason-dialog
      [(open)]="simulateOpen"
      title="Simulate a customer message"
      description="For the demo: Nexora writes this as the customer, as an email or a portal message would arrive. A ticket waiting on the customer, or resolved within seven days, opens again."
      label="What the customer writes"
      placeholder="Thanks — the carton is still missing."
      note="Written as the customer, visible to them."
      confirmLabel="Add the customer's message"
      tone="secondary"
      [busy]="store.busy() === 'customerMessage'"
      (confirm)="simulate($event)"
    />
    <app-confirm-dialog
      [(open)]="closeOpen"
      title="Close the ticket"
      description="A closed ticket takes no reply and no note. A new message from the customer opens a new ticket, and only a support manager can reopen this one."
      confirmLabel="Close"
      keepLabel="Keep it resolved"
      tone="warning"
      [busy]="store.busy() === 'close'"
      (confirm)="close()"
    />
  `,
})
export class TicketView {
  readonly store = inject(TicketStore);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(SlToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly phone = input(false);
  readonly route = input.required<string>();
  readonly previousId = input<string | null>(null);
  readonly nextId = input<string | null>(null);
  /** Asks the inbox for the previous (-1) or next (1) ticket of the queue. */
  readonly step = output<-1 | 1>();

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly dock = viewChild<ElementRef<HTMLElement>>('dock');

  readonly view = signal<View>('conversation');
  readonly after = signal<After>('keep');
  readonly macroId = signal<string | null>(null);
  readonly resolveOpen = signal(false);
  readonly escalateOpen = signal(false);
  readonly pendingReasonOpen = signal(false);
  readonly reopenOpen = signal(false);
  readonly simulateOpen = signal(false);
  readonly closeOpen = signal(false);
  private readonly width = signal(0);

  readonly wide = computed(() => !this.phone() && this.width() >= WIDE_FROM);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.width.set(element.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.width.set(entry?.contentRect.width ?? 0));
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    // A new ticket starts on its conversation, with nothing chosen for after the reply. When the
    // reader moved to it from inside the region, its heading takes focus and is announced.
    let previous: string | null = null;
    effect(() => {
      const id = this.store.id();
      untracked(() => {
        if (id === previous) return;
        const focused = this.host.nativeElement.contains(document.activeElement);
        previous = id;
        this.view.set('conversation');
        this.after.set('keep');
        this.macroId.set(null);
        if (focused) setTimeout(() => this.heading()?.nativeElement.focus());
      });
    });
    // On a phone the page is what scrolls: a ticket opens on its last message, as a conversation does.
    let opened: string | null = null;
    effect(() => {
      const detail = this.store.detail();
      const dock = this.dock();
      if (detail === null || dock === undefined || !this.phone()) return;
      untracked(() => {
        if (opened === detail.ticket.id) return;
        opened = detail.ticket.id;
        setTimeout(() => dock.nativeElement.scrollIntoView({ block: 'end' }));
      });
    });
  }

  readonly statusWord = computed(() => {
    const ticket = this.store.ticket();
    return ticket ? STATUS_LABEL[ticket.status] : '';
  });
  readonly statusTone = computed(() => {
    const ticket = this.store.ticket();
    return ticket ? STATUS_TONE[ticket.status] : 'secondary';
  });
  readonly priorityWord = computed(() => {
    const ticket = this.store.ticket();
    return ticket ? PRIORITY_LABEL[ticket.priority] : '';
  });
  readonly priorityTone = computed(() => {
    const ticket = this.store.ticket();
    return ticket ? PRIORITY_TONE[ticket.priority] : 'secondary';
  });

  readonly subheading = computed(() => {
    const detail = this.store.detail();
    if (detail === null) return '';
    const ticket = detail.ticket;
    return [
      ticket.ticketNumber,
      detail.customer.displayName,
      ticket.assigneeName ? `held by ${ticket.assigneeName}` : 'nobody holds it',
    ].join(' · ');
  });

  readonly recipient = computed(() => {
    const detail = this.store.detail();
    return detail?.ticket.contactName ?? detail?.customer.displayName ?? 'the customer';
  });

  readonly macros = computed(() => this.store.detail()?.macros ?? []);

  /** A reply or a note is written by a holder of support.reply, on a ticket that is not closed. */
  readonly canWrite = computed(() => this.store.can('reply'));

  readonly canAssignToMe = computed(() => {
    const ticket = this.store.ticket();
    const me = this.session.user()?.id;
    return this.store.can('assign') && ticket !== null && me !== undefined && ticket.assigneeId !== me;
  });

  /** The customer's side is simulated only where a reply could be written to it. */
  readonly canSimulate = computed(() => this.store.holds('support.reply') && this.store.ticket()?.status !== 'closed');

  readonly modeWords = computed(() =>
    this.store.mode() === 'reply'
      ? this.store.ticket()?.firstRespondedAt
        ? `Sent to ${this.recipient()} by email`
        : `Sent to ${this.recipient()} · stops the first-response clock`
      : 'Your team only · never shown to the customer',
  );

  readonly composerStatus = computed<PromptComposerStatus>(() => {
    const busy = this.store.busy();
    if (busy === 'reply' || busy === 'note') return 'submitted';
    const failure = this.store.failure();
    return failure?.kind === 'transport' && this.lastSent() !== null ? 'error' : 'ready';
  });

  private readonly lastSent = signal<ComposerMode | null>(null);

  /**
   * The statuses a reply may move the ticket to. §68.5 opens a new ticket and
   * one waiting on the customer as the reply is sent, and moves to a waiting
   * status only from open or escalated: a choice the backend would ignore is
   * not offered.
   */
  readonly afterOptions = computed<readonly After[]>(() => {
    const ticket = this.store.ticket();
    if (ticket === null) return ['keep'];
    const status =
      ticket.status === 'new' || ticket.status === 'pending_customer' ? 'open' : ticket.status;
    const options: After[] = ['keep'];
    if (status === 'open' || status === 'escalated') options.push('pending_customer', 'pending_internal');
    if (status !== 'resolved' && this.store.holds('support.change_status')) options.push('resolved');
    return options;
  });

  readonly afterWord = computed(() => AFTER_LABEL[this.after()].toLowerCase());

  readonly readOnlyWords = computed(() => {
    const ticket = this.store.ticket();
    if (ticket?.status === 'closed')
      return 'This ticket is closed: it takes no reply. A new message from the customer opens a new ticket.';
    return `You read this ticket. Replies and internal notes are written by ${SUPPORT_HOLDERS['support.reply']}; internal notes are not shown to you.`;
  });

  /** A command the reader's role cannot give now, named with who gives it (RP-09). */
  readonly gateWords = computed(() => {
    const ticket = this.store.ticket();
    if (ticket === null) return null;
    const today = this.session.session()?.demo.today ?? '';
    if (
      (ticket.status === 'resolved' || ticket.status === 'closed') &&
      this.store.holds('support.change_status') &&
      !this.store.can('reopen') &&
      reopenPermission(ticket, today) === 'support.manage'
    )
      return ticket.status === 'closed'
        ? `Closed. Reopening a closed ticket is for ${SUPPORT_HOLDERS['support.manage']}.`
        : `Resolved more than seven days ago. Reopening it now is for ${SUPPORT_HOLDERS['support.manage']}.`;
    if (!this.store.holds('support.change_status') && ticket.status !== 'closed')
      return `Its status is changed by ${SUPPORT_HOLDERS['support.change_status']}.`;
    return null;
  });

  readonly reopenWords = computed(() => {
    const ticket = this.store.ticket();
    const code = ticket?.resolutionCode ? RESOLUTION_LABEL[ticket.resolutionCode] : null;
    return `It returns to open${code ? `, leaving “${code}” behind` : ''}, and the resolution clock resumes from where it stopped.`;
  });

  failureTone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof supportAdvice>[0]): string {
    return supportAdvice(kind);
  }

  afterLabel(option: After): string {
    return AFTER_LABEL[option];
  }

  setMode(value: string | undefined): void {
    this.store.mode.set(value === 'note' ? 'note' : 'reply');
  }

  /**
   * The composer asks to empty itself once a send is accepted; the text stays
   * until the backend has the message, so a failure never loses it.
   */
  typed(request: ChangeRequest<string>): void {
    if (request.reason === 'submit') {
      request.cancel();
      return;
    }
    this.store.write(this.store.mode(), request.value);
    if (this.store.mode() === 'reply' && request.value.trim() === '') this.macroId.set(null);
  }

  applyMacro(id: string): void {
    const macro = this.macros().find((entry) => entry.id === id);
    if (!macro) return;
    this.store.write('reply', macro.body);
    this.macroId.set(macro.id);
    const next: After = macro.setStatus ?? 'keep';
    this.after.set(this.afterOptions().includes(next) ? next : 'keep');
  }

  async send(): Promise<void> {
    const mode = this.store.mode();
    if (this.store.composing().trim() === '') return;
    this.lastSent.set(mode);
    if (mode === 'note') {
      if (await this.store.note()) this.toasts.show({ title: 'Note added', tone: 'success' });
      return;
    }
    const after = this.after();
    const ok = await this.store.reply(
      after === 'keep' ? undefined : after,
      after === 'resolved' ? 'resolved_information' : undefined,
      this.macroId() ?? undefined,
    );
    if (ok) {
      this.macroId.set(null);
      this.after.set('keep');
      this.toasts.show({ title: 'Reply sent', description: `Sent to ${this.recipient()}.`, tone: 'success' });
    }
  }

  async assignToMe(): Promise<void> {
    const me = this.session.user()?.id;
    if (me && (await this.store.assign(me)))
      this.toasts.show({ title: 'Assigned to you', tone: 'success' });
  }

  /** Waiting on the customer asks for a reason when no public reply has asked them anything. */
  async waitOnCustomer(reason?: string): Promise<void> {
    const ticket = this.store.ticket();
    if (ticket === null) return;
    if (reason === undefined && !ticket.lastAgentMessageAt) {
      this.pendingReasonOpen.set(true);
      return;
    }
    const ok = await this.store.pendingCustomer(reason);
    this.settle(ok, this.pendingReasonOpen);
    if (ok)
      this.toasts.show({
        title: 'Waiting on the customer',
        description: 'The resolution clock is stopped until the customer writes.',
        tone: 'success',
      });
  }

  async waitInternally(): Promise<void> {
    if (await this.store.pendingInternal())
      this.toasts.show({
        title: 'Waiting internally',
        description: 'The resolution clock keeps running.',
        tone: 'success',
      });
  }

  async escalate(request: EscalationRequest): Promise<void> {
    const ok = await this.store.escalate(request.reason, request.assigneeId);
    this.settle(ok, this.escalateOpen);
    if (ok)
      this.toasts.show({
        title: 'Ticket escalated',
        description: `Now held by ${this.store.ticket()?.assigneeName ?? 'a support manager'}, who has been notified.`,
        tone: 'success',
      });
  }

  async resolve(code: string): Promise<void> {
    const ok = await this.store.resolve(code);
    this.settle(ok, this.resolveOpen);
    if (ok) this.toasts.show({ title: 'Ticket resolved', tone: 'success' });
  }

  async reopen(reason: string): Promise<void> {
    const ok = await this.store.reopen(reason);
    this.settle(ok, this.reopenOpen);
    if (ok) this.toasts.show({ title: 'Ticket reopened', tone: 'success' });
  }

  async close(): Promise<void> {
    const ok = await this.store.close();
    this.settle(ok, this.closeOpen);
    if (ok) this.toasts.show({ title: 'Ticket closed', tone: 'success' });
  }

  async simulate(body: string): Promise<void> {
    const ok = await this.store.customerMessage(body);
    this.settle(ok, this.simulateOpen);
    if (ok) this.toasts.show({ title: 'Customer message added', tone: 'success' });
  }

  /**
   * A dialog closes once its command is done, and when the ticket moved under
   * it — the page has been read again and says what changed. A transport
   * failure keeps it open with what was written, to be sent again.
   */
  private settle(ok: boolean, open: { set(value: boolean): void }): void {
    if (ok || this.store.failure()?.kind !== 'transport') open.set(false);
  }
}
