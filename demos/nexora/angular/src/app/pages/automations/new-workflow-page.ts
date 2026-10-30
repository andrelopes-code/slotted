import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlForm, SlFormActions } from '@slotted/angular/form';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';

import { NewWorkflowStore } from '../../core/automation/new-workflow.store';
import { WORKFLOWS_ROUTE, workflowRoute } from '../../core/automation/workflow.model';
import { adviceFor, toneFor } from '../../core/inventory/inventory-failure';
import { WorkflowDesigner } from './workflow-designer';

/**
 * A new workflow (§15), on its own route under the list (FM-01), written in
 * the order of Journey G: what it is, when it runs, which events it acts on,
 * what it does; then the check, and the activation. The check is the
 * backend's own, run before the request: the save asks for a structure §69.2
 * accepts, the activation for a definition that can run. The draft survives
 * leaving the page, a refusal and a 503 (FM-05).
 */
@Component({
  selector: 'app-new-workflow-page',
  imports: [
    RouterLink,
    SlButton,
    SlButtonLink,
    SlForm,
    SlFormActions,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlSkeletonText,
    SlStack,
    SlText,
    WorkflowDesigner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderNav><a slPageHeaderBack [routerLink]="listRoute">Workflows</a></div>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>New workflow</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              A workflow is saved as a draft and runs only once activated. Activated, it acts on every event of its trigger with no one in front of it.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        @if (store.catalog.catalog(); as catalog) {
          <form
            slForm
            data-testid="new-workflow-form"
            [messages]="{ summaryTitle: summaryTitle() }"
            [errors]="formErrors()"
            [loading]="store.saving() !== null"
            (formSubmit)="submit($event, false)"
          >
            @if (store.failure(); as failure) {
              @if (failure.kind !== 'validation') {
                <div slInlineMessage [tone]="tone(failure.kind)" data-testid="failure">
                  <span slInlineMessageIcon></span>
                  <span slStack [gap]="1">
                    <span slText size="sm">{{ failure.message }}</span>
                    <span slText size="sm" tone="muted">{{ advice(failure.kind) }}</span>
                  </span>
                </div>
              }
            }
            <app-workflow-designer
              [draft]="store.draft"
              [catalog]="catalog"
              [errors]="formErrors()"
              [showIssues]="store.draft.attempted()"
            />
            <span slText size="sm" tone="muted" data-testid="check">{{ checkWords() }}</span>
            <div slFormActions>
              <a slButtonLink variant="ghost" tone="secondary" [routerLink]="listRoute">Cancel</a>
              <button
                slButton
                variant="outline"
                type="submit"
                data-testid="save-draft"
                [loading]="store.saving() === 'draft'"
                [messages]="{ loading: 'Saving the draft' }"
              >
                Save draft
              </button>
              <button
                slButton
                type="button"
                data-testid="save-activate"
                [loading]="store.saving() === 'activate'"
                [messages]="{ loading: 'Saving and activating' }"
                (click)="create(true)"
              >
                Save and activate
              </button>
            </div>
          </form>
        } @else if (store.catalog.failed()) {
          <div slInlineMessage tone="danger" data-testid="catalog-failed">
            <span slInlineMessageIcon></span>
            <span slStack [gap]="2">
              <span slText size="sm">The triggers and actions did not arrive, so nothing can be written yet.</span>
              <span><button slButton size="sm" type="button" (click)="store.open()">Try again</button></span>
            </span>
          </div>
        } @else {
          <span slSkeletonText [lines]="8" lastLineSize="40%"></span>
        }
      </div>
    </div>
  `,
})
export class NewWorkflowPage {
  readonly store = inject(NewWorkflowStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(SlToastService);

  readonly listRoute = WORKFLOWS_ROUTE;

  /** One map for the summary and the fields (FM-03): the check the reader asked for, then the backend's. */
  readonly formErrors = computed(() => {
    const draft = this.store.draft;
    if (!draft.attempted()) return this.store.refused();
    const issues = this.wanted() === 'activate' ? draft.runIssues() : draft.saveIssues();
    const errors: Record<string, readonly string[]> = { ...issues.fields };
    if (issues.nodes.size > 0) errors['conditions'] = [...new Set([...issues.nodes.values()].flat())];
    return { ...errors, ...this.store.refused() };
  });

  /** Which check the last attempt was: a save checks the structure, an activation what a run needs. */
  private readonly wantedActivation = signal(false);
  readonly wanted = computed(() => (this.wantedActivation() ? 'activate' : 'draft'));

  readonly summaryTitle = computed(() =>
    this.wanted() === 'activate' ? 'The workflow cannot be activated as it stands' : 'The workflow was not saved',
  );

  /** What is left before it can be saved, and before it can run — said before either button is pressed. */
  readonly checkWords = computed(() => {
    const save = this.store.draft.saveIssues().all.length;
    const run = this.store.draft.runIssues().all.length;
    if (run === 0) return 'Ready: it can be saved, and it can run.';
    if (save === 0) return `It can be saved as a draft; ${run} ${run === 1 ? 'thing stops' : 'things stop'} it from running yet.`;
    return `${save} ${save === 1 ? 'thing stops' : 'things stop'} it from being saved.`;
  });

  constructor() {
    void this.store.open();
  }

  submit(event: { pending: (work: Promise<void>) => void }, activate: boolean): void {
    event.pending(this.create(activate));
  }

  async create(activate: boolean): Promise<void> {
    this.wantedActivation.set(activate);
    const id = await this.store.create(activate);
    if (id === null) return;
    const failure = this.store.failure();
    this.toasts.show(
      failure
        ? { title: 'Saved as a draft', description: `${failure.message} Activate it from the workflow.`, tone: 'warning' }
        : { title: activate ? 'Workflow saved and activated' : 'Draft saved', tone: 'success' },
    );
    this.store.failure.set(null);
    await this.router.navigateByUrl(workflowRoute(id));
  }

  tone(kind: Parameters<typeof toneFor>[0]) {
    return toneFor(kind);
  }

  advice(kind: Parameters<typeof adviceFor>[0]) {
    return adviceFor(kind);
  }
}
