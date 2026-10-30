import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlForm } from '@slotted/angular/form';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { createSnapshot, storagePersistence } from '@slotted/core/wizard';
import type { WizardPersistence, WizardValue } from '@slotted/core/wizard';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/wizard/contract.json';
import { SlWizard, SlWizardComplete, SlWizardEdit, SlWizardForm, SlWizardStep } from './wizard';
import { provideWizardDefaults } from './wizard-defaults';
import type {
  WizardFailure,
  WizardStepRequest,
  WizardValidate,
  WizardValueRequest,
} from './wizard-defaults';

const q = (selector: string) => document.querySelector(selector) as HTMLElement | null;
const title = () => q('[data-part="step-title"]');
const next = () => q('[data-part="next"], [data-part="submit"]') as HTMLButtonElement;

async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [
    ReactiveFormsModule,
    SlForm,
    SlWizard,
    SlWizardComplete,
    SlWizardEdit,
    SlWizardForm,
    SlWizardStep,
  ],
  template: `<div
    slWizard
    cancellable
    [(step)]="step"
    [(value)]="value"
    [persistence]="persistence()"
    [submitWizard]="submitWizard"
    (stepChangeRequest)="steps.push($event)"
    (valueChangeRequest)="values.push($event)"
    (cancelRequest)="cancels.push($event.dirty)"
  >
    <ng-template slWizardStep="account" label="Account" let-context let-errors="errors">
      <form slForm slWizardForm [formGroup]="account" [defaultErrors]="errors">
        <input name="email" formControlName="email" />
      </form>
    </ng-template>
    @if (company()) {
      <ng-template slWizardStep="company" label="Company" [validate]="companyValidate">
        <form slForm slWizardForm [formGroup]="companyGroup">
          <input name="name" formControlName="name" />
        </form>
      </ng-template>
    }
    <ng-template slWizardStep="gift" label="Gift" optional>
      <form slForm slWizardForm><input name="message" required /></form>
    </ng-template>
    <ng-template slWizardStep="review" label="Review">
      <button slWizardEdit="account"></button>
    </ng-template>
    <ng-template slWizardComplete><p>Done</p></ng-template>
  </div>`,
})
class Flow {
  readonly wizard = viewChild.required(SlWizard);
  step: string | undefined = undefined;
  value: WizardValue | undefined = undefined;
  readonly company = signal(false);
  readonly persistence = signal<WizardPersistence | undefined>(undefined);
  readonly steps: WizardStepRequest[] = [];
  readonly values: WizardValueRequest[] = [];
  readonly cancels: boolean[] = [];
  readonly account = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly companyGroup = new FormGroup({ name: new FormControl('', { nonNullable: true }) });
  companyValidate: WizardValidate | undefined;
  submitWizard:
    ((values: WizardValue) => void | WizardFailure | Promise<void | WizardFailure>) | undefined =
    vi.fn();
}

async function mount(setup?: (flow: Flow) => void) {
  TestBed.configureTestingModule({ imports: [Flow] });
  const fixture = TestBed.createComponent(Flow);
  setup?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  return fixture;
}

describe('SlWizard', () => {
  it('is selected by the family identifier and says the position in the heading', async () => {
    await mount();
    expect(q('[data-ui="wizard"]')?.getAttribute('data-part')).toBe('root');
    expect(q('[data-ui="wizard"]')?.getAttribute('data-progress')).toBe(
      contract.members.wizard.defaults.progress,
    );
    expect(title()?.textContent).toContain('Step 1 of 3');
    expect(title()?.textContent).toContain('Account');
  });

  it('refuses a step Reactive Forms finds invalid', async () => {
    const fixture = await mount();
    next().click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Account');
    expect(fixture.componentInstance.account.touched).toBe(true);
  });

  it('accepts a valid step with the group raw value and the reason submit, and focuses the heading', async () => {
    const fixture = await mount();
    fixture.componentInstance.account.setValue({ email: 'ana@acme.example' });
    next().click();
    await settle(fixture);
    const flow = fixture.componentInstance;
    expect(flow.values[0]?.value).toEqual({ account: { email: 'ana@acme.example' } });
    expect(flow.values[0]?.reason).toBe('submit');
    expect(flow.steps.at(-1)?.value).toBe('gift');
    expect(title()?.textContent).toContain('Gift');
    await settle(fixture);
    expect(document.activeElement).toBe(title());
  });

  /** Decision 1: a step appearing before the current one does not move it. */
  it('leaves the reader where they are when a step appears before them, and asks it next', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' } };
      flow.step = 'gift';
    });
    expect(title()?.textContent).toContain('Gift');
    fixture.componentInstance.company.set(true);
    await settle(fixture);
    expect(title()?.textContent).toContain('Step 3 of 4');
    (q('[data-part="skip"]') as HTMLButtonElement).click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Company');
  });

  it('moves to the next step still present when the current one leaves the list', async () => {
    const fixture = await mount((flow) => {
      flow.company.set(true);
      flow.value = { account: { email: 'a' } };
      flow.step = 'company';
    });
    expect(title()?.textContent).toContain('Company');
    fixture.componentInstance.company.set(false);
    await settle(fixture);
    expect(title()?.textContent).toContain('Gift');
    expect(fixture.componentInstance.steps.at(-1)?.reason).toBe('programmatic');
  });

  /** Decision 4, by removal. */
  it('aborts the validate of a step that leaves the list', async () => {
    let signal: AbortSignal | undefined;
    const fixture = await mount((flow) => {
      flow.company.set(true);
      flow.value = { account: { email: 'a' } };
      flow.step = 'company';
      flow.companyValidate = (_, context) => {
        signal = context.signal;
        return new Promise<undefined>(() => {});
      };
    });
    next().click();
    await settle(fixture);
    expect(next()?.hasAttribute('data-loading')).toBe(true);
    fixture.componentInstance.company.set(false);
    await settle(fixture);
    expect(signal?.aborted).toBe(true);
    expect(title()?.textContent).toContain('Gift');
    expect(next()?.hasAttribute('data-loading')).toBe(false);
  });

  it('clamps a step a router writes out of reach', async () => {
    const fixture = await mount();
    fixture.componentInstance.step = 'review';
    await settle(fixture);
    expect(title()?.textContent).toContain('Account');
  });

  it('accepts an optional step with no answers when it is skipped', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' } };
      flow.step = 'gift';
    });
    (q('[data-part="skip"]') as HTMLButtonElement).click();
    await settle(fixture);
    expect(fixture.componentInstance.values.at(-1)?.value).toEqual({
      account: { email: 'a' },
      gift: {},
    });
    expect(title()?.textContent).toContain('Review');
  });

  it('returns to the review step after an edit', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' }, gift: {} };
      flow.step = 'review';
    });
    const edit = q('[data-part="edit"]') as HTMLButtonElement;
    expect(edit.textContent?.replace(/\s+/g, ' ').trim()).toBe('Change Account');
    edit.click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Account');
    expect(next().textContent).toContain('Save and return');
    fixture.componentInstance.account.setValue({ email: 'b' });
    next().click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Review');
  });

  it('submits the steps present and shows the complete part with focus', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' }, company: { name: 'gone' }, gift: {} };
      flow.step = 'review';
    });
    expect(next()?.getAttribute('data-part')).toBe('submit');
    next().click();
    await settle(fixture);
    expect(fixture.componentInstance.submitWizard).toHaveBeenCalledWith(
      { account: { email: 'a' }, gift: {}, review: {} },
      expect.objectContaining({ reason: 'submit' }),
    );
    expect(q('[data-part="complete"]')?.textContent).toContain('Done');
    await settle(fixture);
    expect(document.activeElement).toBe(q('[data-part="complete"]'));
  });

  /** No current step after an accepted submission: every header and segment reads complete. */
  it('marks every step complete, the last one included, once the submission is accepted', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' }, gift: {} };
      flow.step = 'review';
    });
    next().click();
    await settle(fixture);
    await settle(fixture);
    expect(q('[data-ui="wizard"]')?.hasAttribute('data-complete')).toBe(true);
    const items = Array.from(document.querySelectorAll('[data-part="item"]'));
    expect(items.length).toBe(3);
    for (const item of items) {
      expect(item.hasAttribute('data-complete')).toBe(true);
      expect(item.hasAttribute('data-current')).toBe(false);
    }
    for (const segment of Array.from(document.querySelectorAll('[data-part="progress-segment"]'))) {
      expect(segment.hasAttribute('data-complete')).toBe(true);
      expect(segment.hasAttribute('data-current')).toBe(false);
    }
  });

  it('sends the reader to the step a failed submission names, with its errors', async () => {
    const fixture = await mount((flow) => {
      flow.value = { account: { email: 'a' }, gift: {} };
      flow.step = 'review';
      flow.submitWizard = () => ({ errors: { email: 'Taken' }, step: 'account' });
    });
    next().click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Account');
    expect(q('[data-ui="wizard"]')?.hasAttribute('data-invalid')).toBe(true);
    await settle(fixture);
    expect(document.body.textContent).toContain('Taken');
    expect(document.activeElement).toBe(q('[data-ui="alert"]'));
  });

  it('saves a draft through persistence and says when, and restores it on the next mount', async () => {
    const persistence = storagePersistence({ key: 'ng-wz', storage: sessionStorage });
    const fixture = await mount((flow) => flow.persistence.set(persistence));
    (q('[data-part="save-draft"]') as HTMLButtonElement).click();
    await settle(fixture);
    expect(q('[data-part="draft-status"]')?.textContent).toMatch(/Draft saved/);
    fixture.destroy();

    persistence.save(
      createSnapshot({ drafts: {}, step: 'gift', value: { account: { email: 'a' } } }),
    );
    TestBed.resetTestingModule();
    await mount((flow) => flow.persistence.set(persistence));
    expect(title()?.textContent).toContain('Gift');
    sessionStorage.clear();
  });

  it('tells a cancel whether anything is unsubmitted', async () => {
    const fixture = await mount();
    (q('[data-part="cancel"]') as HTMLButtonElement).click();
    fixture.componentInstance.account.markAsDirty();
    (q('[data-part="cancel"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toEqual([false, true]);
  });

  it('closes the compact progress on Escape and returns focus to its bar', async () => {
    const fixture = await mount();
    const toggle = q('[data-part="progress-toggle"]') as HTMLButtonElement;
    toggle.click();
    await settle(fixture);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    const trigger = q('[data-part="trigger"]') as HTMLElement;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await settle(fixture);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('takes its layout from provideWizardDefaults and its words from the language in force', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      imports: [Flow],
      providers: [
        provideWizardDefaults({ progress: 'top' }),
        provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      ],
    });
    const fixture = TestBed.createComponent(Flow);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    // language: pt-BR
    expect(next().textContent).toContain('Avançar');
    // language: en-US
    expect(q('[data-part="position"]')?.textContent).toBe('Etapa 1 de 3');
    expect(q('ol')?.getAttribute('aria-label')).toBe('Progresso');
    expect(q('[data-ui="wizard"]')?.getAttribute('data-progress')).toBe('top');

    locale.set('en-US');
    await settle(fixture);
    expect(next().textContent).toContain('Next');
    expect(q('ol')?.getAttribute('aria-label')).toBe('Progress');
  });
});

/**
 * The branch a reader actually walks: answer, press Next, and the step the
 * answer opened is the next one. Decided before the consumer's @if had run
 * again, the destination skipped the new step and went to Billing.
 */
@Component({
  imports: [SlForm, SlWizard, SlWizardForm, SlWizardStep],
  template: `<div slWizard [(value)]="value">
    <ng-template slWizardStep="account" label="Account">
      <form slForm slWizardForm>
        <select name="type">
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
      </form>
    </ng-template>
    @if (value()?.['account']?.['type'] === 'business') {
      <ng-template slWizardStep="company" label="Company"></ng-template>
    }
    <ng-template slWizardStep="billing" label="Billing"></ng-template>
  </div>`,
})
class Branching {
  readonly value = signal<WizardValue | undefined>(undefined);
}

describe('SlWizard branch on the accepted answer', () => {
  it('goes to the step the answer opened, and past it once the answer closes it', async () => {
    TestBed.configureTestingModule({ imports: [Branching] });
    const fixture = TestBed.createComponent(Branching);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    const select = () => q('select[name="type"]') as HTMLSelectElement;
    select().value = 'business';
    next().click();
    await settle(fixture);
    await settle(fixture);
    expect(title()?.textContent?.replace(/\s+/g, ' ')).toContain('Step 2 of 3 Company');
    next().click();
    await settle(fixture);
    await settle(fixture);
    expect(title()?.textContent).toContain('Billing');

    (q('[data-part="previous"]') as HTMLButtonElement).click();
    await settle(fixture);
    (q('[data-part="previous"]') as HTMLButtonElement).click();
    await settle(fixture);
    expect(title()?.textContent).toContain('Account');
    select().value = 'personal';
    next().click();
    await settle(fixture);
    await settle(fixture);
    expect(title()?.textContent?.replace(/\s+/g, ' ')).toContain('Step 2 of 2 Billing');
  });
});

/** A draft saved on a step that the restored answer opens. */
@Component({
  imports: [SlWizard, SlWizardStep],
  template: `<div slWizard [persistence]="persistence" [(value)]="value">
    <ng-template slWizardStep="account" label="Account"></ng-template>
    @if (value()?.['account']?.['type'] === 'business') {
      <ng-template slWizardStep="company" label="Company"></ng-template>
    }
    <ng-template slWizardStep="billing" label="Billing"></ng-template>
  </div>`,
})
class RestoredBranch {
  readonly value = signal<WizardValue | undefined>(undefined);
  persistence: WizardPersistence = storagePersistence({
    key: 'ng-branch',
    storage: sessionStorage,
  });
}

describe('SlWizard restore on a branch', () => {
  const draft = () =>
    createSnapshot({ drafts: {}, step: 'company', value: { account: { type: 'business' } } });

  it('reopens a synchronous draft on the step its restored answer opens', async () => {
    storagePersistence({ key: 'ng-branch', storage: sessionStorage }).save(draft());
    TestBed.configureTestingModule({ imports: [RestoredBranch] });
    const fixture = TestBed.createComponent(RestoredBranch);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    await settle(fixture);
    expect(title()?.textContent?.replace(/\s+/g, ' ')).toContain('Step 2 of 3 Company');
    sessionStorage.clear();
  });

  it('reopens an asynchronous draft on the step its restored answer opens', async () => {
    TestBed.configureTestingModule({ imports: [RestoredBranch] });
    const fixture = TestBed.createComponent(RestoredBranch);
    fixture.componentInstance.persistence = {
      clear: vi.fn(),
      load: () => Promise.resolve(draft()),
      save: vi.fn(),
    };
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
    await settle(fixture);
    await settle(fixture);
    expect(title()?.textContent?.replace(/\s+/g, ' ')).toContain('Step 2 of 3 Company');
  });
});

@Component({
  imports: [SlWizard, SlWizardStep],
  template: `<div slWizard>
    <ng-template slWizardStep="a" label="A"></ng-template>
    <ng-template slWizardStep="a" label="B"></ng-template>
  </div>`,
})
class Duplicate {}

describe('SlWizard names', () => {
  /** Decision 5. */
  it('throws on two steps with one name', () => {
    TestBed.configureTestingModule({ imports: [Duplicate] });
    const fixture = TestBed.createComponent(Duplicate);
    expect(() => fixture.detectChanges()).toThrow(/"a"/);
  });
});
