import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createSnapshot, storagePersistence } from '@slotted/core/wizard';
import type { WizardPersistence } from '@slotted/core/wizard';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/wizard/contract.json';
import { SlottedProvider } from '../i18n';
import { Wizard } from './wizard';
import { useWizardStep } from './wizard-context';
import { WizardDefaultsProvider } from './wizard-defaults';
import { WizardComplete, WizardEdit, WizardStep } from './wizard-parts';
import type { WizardHandle, WizardValue } from './wizard.types';

const root = () => document.querySelector('[data-ui="wizard"]') as HTMLElement;
const title = () => document.querySelector('[data-part="step-title"]') as HTMLElement;
const next = () =>
  document.querySelector('[data-part="next"], [data-part="submit"]') as HTMLButtonElement;
const back = () => document.querySelector('[data-part="previous"]') as HTMLButtonElement | null;
const field = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement;
const type = (name: string, text: string) =>
  fireEvent.change(field(name), { target: { value: text } });

/** A field that shows the answer the wizard holds for it. */
function Text({ name, required = false }: { name: string; required?: boolean }) {
  const step = useWizardStep();
  const shown = step?.values[name];
  return (
    <label>
      {name}
      <input
        defaultValue={typeof shown === 'string' ? shown : ''}
        name={name}
        required={required}
      />
    </label>
  );
}

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('Wizard', () => {
  it('is selected by the family identifier and says the position in the heading', () => {
    render(
      <Wizard>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
      </Wizard>,
    );
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveAttribute('data-progress', contract.members.wizard.defaults.progress);
    expect(title()).toHaveTextContent('Step 1 of 2 Account');
    expect(screen.getByRole('list', { name: 'Progress' })).toBeInTheDocument();
    expect(back()).toBeNull();
  });

  it('accepts a step on Next, asks for the value with the reason submit, and moves focus to the heading', async () => {
    const onValueChange = vi.fn();
    const onStepChange = vi.fn();
    render(
      <Wizard onStepChange={onStepChange} onValueChange={onValueChange}>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
      </Wizard>,
    );
    type('email', 'ana@acme.example');
    fireEvent.click(next());

    expect(onValueChange.mock.calls[0]?.[0]).toEqual({ account: { email: 'ana@acme.example' } });
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('submit');
    expect(onStepChange.mock.calls[0]?.[0]).toBe('shipping');
    expect(onStepChange.mock.calls[0]?.[1].reason).toBe('submit');
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
    expect(document.activeElement).toBe(title());
    expect(document.querySelector('[data-part="item"]')).toHaveAttribute('data-complete');
  });

  it('refuses a step the platform finds invalid and marks it in the progress', () => {
    const onStepChange = vi.fn();
    render(
      <Wizard onStepChange={onStepChange}>
        <WizardStep label="Account" name="account">
          <Text name="email" required />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    fireEvent.click(next());
    expect(onStepChange).not.toHaveBeenCalled();
    expect(title()).toHaveTextContent('Account');
    expect(document.querySelector('[data-part="summary"]')).toBeInTheDocument();
    expect(document.querySelector('[data-part="item"]')).toHaveAttribute('data-invalid');
  });

  it("runs the step's own validate and publishes what it returns", () => {
    render(
      <Wizard>
        <WizardStep
          label="Account"
          name="account"
          validate={(values) =>
            values['email'] === 'taken@acme.example' ? { email: 'Taken' } : undefined
          }
        >
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    type('email', 'taken@acme.example');
    fireEvent.click(next());
    expect(title()).toHaveTextContent('Account');
    expect(screen.getByText('Taken')).toBeInTheDocument();
  });

  it('holds Next in its loading state while an asynchronous validate is pending', async () => {
    let answer: (errors: undefined) => void = () => {};
    render(
      <Wizard>
        <WizardStep
          label="Account"
          name="account"
          validate={() => new Promise((resolve) => (answer = resolve))}
        >
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(next()).toHaveAttribute('data-loading'));
    await act(async () => answer(undefined));
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
  });

  it('keeps what was typed on a step the reader goes back from, without accepting it', async () => {
    const onValueChange = vi.fn();
    render(
      <Wizard
        defaultStep="account"
        defaultValue={{ account: { email: 'a@b.example' } }}
        onValueChange={onValueChange}
      >
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
    onValueChange.mockClear();
    type('city', 'Seattle');
    fireEvent.click(back() as HTMLButtonElement);
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(next());
    await waitFor(() => expect(field('city').value).toBe('Seattle'));
  });

  it('submits the answers of the steps present and shows the complete part with focus', async () => {
    const onSubmit = vi.fn();
    render(
      <Wizard
        defaultStep="shipping"
        defaultValue={{ account: { email: 'a' }, company: { name: 'gone' } }}
        onSubmit={onSubmit}
      >
        <WizardStep label="Account" name="account" />
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
        <WizardComplete>Done</WizardComplete>
      </Wizard>,
    );
    expect(next()).toHaveAttribute('data-part', 'submit');
    type('city', 'Lisboa');
    fireEvent.click(next());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      account: { email: 'a' },
      shipping: { city: 'Lisboa' },
    });
    await waitFor(() =>
      expect(document.querySelector('[data-part="complete"]')).toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(document.querySelector('[data-part="complete"]'));
    expect(root()).toHaveAttribute('data-complete');
  });

  /**
   * After an accepted submission the flow has no current step: every header
   * and every segment reads complete. The last step stayed current and drew
   * its number, because a current step outranks a complete one.
   */
  it('marks every step complete, the last one included, once the submission is accepted', async () => {
    render(
      <Wizard defaultStep="review" defaultValue={{ account: {} }} onSubmit={() => undefined}>
        <WizardStep label="Account" name="account" />
        <WizardStep label="Review" name="review" />
        <WizardComplete>Done</WizardComplete>
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(root()).toHaveAttribute('data-complete'));
    const items = Array.from(document.querySelectorAll('[data-part="item"]'));
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item).toHaveAttribute('data-complete');
      expect(item).not.toHaveAttribute('data-current');
    }
    const segments = Array.from(document.querySelectorAll('[data-part="progress-segment"]'));
    for (const segment of segments) {
      expect(segment).toHaveAttribute('data-complete');
      expect(segment).not.toHaveAttribute('data-current');
    }
  });

  it('keeps the last step current while the submission is pending', async () => {
    render(
      <Wizard
        defaultStep="review"
        defaultValue={{ account: {} }}
        onSubmit={() => new Promise<void>(() => {})}
      >
        <WizardStep label="Account" name="account" />
        <WizardStep label="Review" name="review" />
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(root()).toHaveAttribute('data-loading'));
    const items = Array.from(document.querySelectorAll('[data-part="item"]'));
    expect(items[1]).toHaveAttribute('data-current');
  });

  it('sends the reader to the step a failed submission names, with its errors', async () => {
    render(
      <Wizard
        defaultStep="review"
        defaultValue={{ account: { email: 'a@b.example' } }}
        onSubmit={() => Promise.resolve({ errors: { email: 'Taken' }, step: 'account' })}
      >
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Review" name="review" />
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
    /* The form family renders its summary one render after its errors. */
    expect(await screen.findByText('Taken')).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-invalid');
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('[data-ui="alert"]')),
    );
  });

  /**
   * The branch a reader actually walks: answer, press Next, and the step the
   * answer opened is the next one. The destination is decided after the
   * consumer has rendered the list the new answer produces — decided before,
   * it skipped the new step and went to Billing.
   */
  describe('a branch on the accepted answer', () => {
    function Branching({ controlled }: { controlled: boolean }) {
      const [value, setValue] = useState<WizardValue>({});
      const [own, setOwn] = useState<WizardValue>({});
      const accepted = controlled ? value : own;
      const business = accepted['account']?.['type'] === 'business';
      return (
        <Wizard
          {...(controlled ? { value } : {})}
          onValueChange={(next) => (controlled ? setValue(next) : setOwn(next))}
        >
          <WizardStep label="Account" name="account">
            <select defaultValue="personal" name="type">
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </WizardStep>
          {business ? <WizardStep label="Company" name="company" /> : null}
          <WizardStep label="Billing" name="billing" />
        </Wizard>
      );
    }

    for (const controlled of [true, false]) {
      it(`goes to the step the answer opened (${controlled ? 'controlled' : 'uncontrolled'} value)`, async () => {
        render(<Branching controlled={controlled} />);
        fireEvent.change(field('type'), { target: { value: 'business' } });
        fireEvent.click(next());
        await waitFor(() => expect(title()).toHaveTextContent('Step 2 of 3 Company'));
        fireEvent.click(next());
        await waitFor(() => expect(title()).toHaveTextContent('Step 3 of 3 Billing'));
      });
    }

    /**
     * A draft saved on a step that a restored answer opens. The step is
     * resolved after the consumer has seen the restored value and rendered
     * the list it produces; resolved before, the step did not exist yet and
     * the draft reopened elsewhere.
     */
    function Restored({ persistence }: { persistence: WizardPersistence }) {
      const [own, setOwn] = useState<WizardValue>({});
      const business = own['account']?.['type'] === 'business';
      return (
        <Wizard onValueChange={setOwn} persistence={persistence}>
          <WizardStep label="Account" name="account" />
          {business ? <WizardStep label="Company" name="company" /> : null}
          <WizardStep label="Billing" name="billing" />
        </Wizard>
      );
    }
    const draft = () =>
      createSnapshot({
        drafts: {},
        step: 'company',
        value: { account: { type: 'business' } },
      });

    it('restores a synchronous draft on a step the restored answer opens', async () => {
      const persistence = storagePersistence({ key: 'branch', storage: sessionStorage });
      persistence.save(draft());
      render(<Restored persistence={persistence} />);
      await waitFor(() => expect(title()).toHaveTextContent('Step 2 of 3 Company'));
    });

    it('restores an asynchronous draft on a step the restored answer opens', async () => {
      const persistence: WizardPersistence = {
        clear: vi.fn(),
        load: () => Promise.resolve(draft()),
        save: vi.fn(),
      };
      render(<Restored persistence={persistence} />);
      await waitFor(() => expect(title()).toHaveTextContent('Step 2 of 3 Company'));
    });

    it('skips the step again once the answer closes it', async () => {
      render(<Branching controlled />);
      fireEvent.change(field('type'), { target: { value: 'business' } });
      fireEvent.click(next());
      await waitFor(() => expect(title()).toHaveTextContent('Company'));
      fireEvent.click(back() as HTMLButtonElement);
      await waitFor(() => expect(title()).toHaveTextContent('Account'));
      fireEvent.change(field('type'), { target: { value: 'personal' } });
      fireEvent.click(next());
      await waitFor(() => expect(title()).toHaveTextContent('Step 2 of 2 Billing'));
    });
  });

  /** Decision 1: a step that appears before the current one does not move it. */
  it('leaves the reader where they are when a step appears before them, and asks it next', async () => {
    function Flow() {
      const [value, setValue] = useState<WizardValue>({ account: {}, shipping: {} });
      const [company, setCompany] = useState(false);
      return (
        <>
          <button onClick={() => setCompany(true)} type="button">
            business
          </button>
          <Wizard defaultStep="payment" onValueChange={setValue} value={value}>
            <WizardStep label="Account" name="account" />
            {company ? <WizardStep label="Company" name="company" /> : null}
            <WizardStep label="Shipping" name="shipping" />
            <WizardStep label="Payment" name="payment" />
            <WizardStep label="Review" name="review" />
          </Wizard>
        </>
      );
    }
    render(<Flow />);
    expect(title()).toHaveTextContent('Payment');
    fireEvent.click(screen.getByText('business'));
    expect(title()).toHaveTextContent('Step 4 of 5 Payment');
    fireEvent.click(next());
    await waitFor(() => expect(title()).toHaveTextContent('Company'));
  });

  /** Decision 2 and the branch rule: the current step leaving gives way to the next. */
  it('moves to the next step still present when the current one leaves the list', async () => {
    const onStepChange = vi.fn();
    function Flow({ company }: { company: boolean }) {
      return (
        <Wizard defaultStep="company" defaultValue={{ account: {} }} onStepChange={onStepChange}>
          <WizardStep label="Account" name="account" />
          {company ? <WizardStep label="Company" name="company" /> : null}
          <WizardStep label="Shipping" name="shipping" />
        </Wizard>
      );
    }
    const { rerender } = render(<Flow company />);
    expect(title()).toHaveTextContent('Company');
    rerender(<Flow company={false} />);
    expect(title()).toHaveTextContent('Shipping');
    await waitFor(() => expect(onStepChange).toHaveBeenCalledWith('shipping', expect.anything()));
    expect(onStepChange.mock.calls[0]?.[1].reason).toBe('programmatic');
  });

  it('clamps a controlled step out of reach, and keeps showing the clamp until the consumer follows', () => {
    const onStepChange = vi.fn();
    render(
      <Wizard onStepChange={onStepChange} step="review">
        <WizardStep label="Account" name="account" />
        <WizardStep label="Review" name="review" />
      </Wizard>,
    );
    expect(title()).toHaveTextContent('Account');
    expect(onStepChange).toHaveBeenCalledWith('account', expect.anything());
    expect(onStepChange.mock.calls[0]?.[1].reason).toBe('programmatic');
  });

  /** Decision 5. */
  it('throws on two steps with one name', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Wizard>
          <WizardStep label="A" name="a" />
          <WizardStep label="B" name="a" />
        </Wizard>,
      ),
    ).toThrow(/"a"/);
    spy.mockRestore();
  });

  /** Decision 8. */
  it('throws when it renders no steps', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Wizard />)).toThrow(/no steps/);
    spy.mockRestore();
  });

  /** Decision 4, by removal: the step leaves while its validate is pending. */
  it('aborts the validate of a step that leaves the list, and does not advance on its answer', async () => {
    let answer: () => void = () => {};
    let signal: AbortSignal | undefined;
    const validate = (_: unknown, context: { signal: AbortSignal }) => {
      signal = context.signal;
      return new Promise<undefined>((resolve) => (answer = () => resolve(undefined)));
    };
    function Flow({ company }: { company: boolean }) {
      return (
        <Wizard defaultStep="company" defaultValue={{ account: {} }}>
          <WizardStep label="Account" name="account" />
          {company ? <WizardStep label="Company" name="company" validate={validate} /> : null}
          <WizardStep label="Shipping" name="shipping" />
          <WizardStep label="Review" name="review" />
        </Wizard>
      );
    }
    const { rerender } = render(<Flow company />);
    fireEvent.click(next());
    await waitFor(() => expect(next()).toHaveAttribute('data-loading'));
    rerender(<Flow company={false} />);
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
    expect(signal?.aborted).toBe(true);
    await act(async () => answer());
    expect(title()).toHaveTextContent('Shipping');
    expect(next()).not.toHaveAttribute('data-loading');
  });

  it('accepts an optional step with no answers when it is skipped', async () => {
    const onValueChange = vi.fn();
    render(
      <Wizard onValueChange={onValueChange}>
        <WizardStep label="Gift" name="gift" optional>
          <Text name="message" required />
        </WizardStep>
        <WizardStep label="Review" name="review" />
      </Wizard>,
    );
    expect(title()).toHaveTextContent('Optional');
    fireEvent.click(document.querySelector('[data-part="skip"]') as HTMLButtonElement);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual({ gift: {} });
    await waitFor(() => expect(title()).toHaveTextContent('Review'));
  });

  it('returns to the review step after an edit, and says so on the button', async () => {
    const value: WizardValue = { account: { email: 'a' }, shipping: { city: 'b' } };
    render(
      <Wizard defaultStep="review" defaultValue={value}>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
        <WizardStep label="Review" name="review">
          <WizardEdit step="account" />
        </WizardStep>
      </Wizard>,
    );
    expect(screen.getByRole('button', { name: 'Change Account' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change Account' }));
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
    expect(next()).toHaveTextContent('Save and return');
    fireEvent.click(next());
    await waitFor(() => expect(title()).toHaveTextContent('Review'));
  });

  /** Decision 4. */
  it('aborts a pending validate when the reader leaves, and ignores its late answer', async () => {
    let answer: () => void = () => {};
    let signal: AbortSignal | undefined;
    render(
      <Wizard defaultStep="shipping" defaultValue={{ account: {} }}>
        <WizardStep label="Account" name="account" />
        <WizardStep
          label="Shipping"
          name="shipping"
          validate={(_, context) => {
            signal = context.signal;
            return new Promise<undefined>((resolve) => (answer = () => resolve(undefined)));
          }}
        />
        <WizardStep label="Review" name="review" />
      </Wizard>,
    );
    fireEvent.click(next());
    await waitFor(() => expect(next()).toHaveAttribute('data-loading'));
    fireEvent.click(screen.getByRole('button', { name: /Account/ }));
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
    expect(signal?.aborted).toBe(true);
    await act(async () => answer());
    expect(title()).toHaveTextContent('Account');
  });

  it('saves a draft through onSaveDraft and persistence, and says when', async () => {
    const onSaveDraft = vi.fn();
    const persistence = storagePersistence({ key: 'wz', storage: sessionStorage, version: 1 });
    render(
      <Wizard onSaveDraft={onSaveDraft} persistence={persistence} version={1}>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
      </Wizard>,
    );
    type('email', 'draft@acme.example');
    fireEvent.click(document.querySelector('[data-part="save-draft"]') as HTMLButtonElement);
    await waitFor(() =>
      expect(document.querySelector('[data-part="draft-status"]')).toHaveTextContent(/Draft saved/),
    );
    expect(onSaveDraft.mock.calls[0]?.[0].drafts).toEqual({
      account: { email: 'draft@acme.example' },
    });
    expect(onSaveDraft.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(persistence.load()?.drafts).toEqual({ account: { email: 'draft@acme.example' } });
  });

  it('restores a synchronous draft on the first render', () => {
    const persistence = storagePersistence({ key: 'wz', storage: sessionStorage, version: 2 });
    persistence.save(
      createSnapshot({
        drafts: { shipping: { city: 'Porto' } },
        step: 'shipping',
        value: { account: { email: 'a' } },
        version: 2,
      }),
    );
    render(
      <Wizard persistence={persistence} version={2}>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
        <WizardStep label="Shipping" name="shipping">
          <Text name="city" />
        </WizardStep>
      </Wizard>,
    );
    expect(title()).toHaveTextContent('Shipping');
    expect(field('city').value).toBe('Porto');
  });

  it('waits for an asynchronous draft with the step busy, then restores it', async () => {
    let resolve: (snapshot: ReturnType<typeof createSnapshot>) => void = () => {};
    const persistence: WizardPersistence = {
      clear: vi.fn(),
      load: () => new Promise((done) => (resolve = done)),
      save: vi.fn(),
    };
    render(
      <Wizard delay={0} minDuration={0} persistence={persistence}>
        <WizardStep label="Account" name="account" />
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    expect(document.querySelector('[data-part="step"]')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('[data-part="actions"]')).toBeNull();
    await act(async () =>
      resolve(createSnapshot({ drafts: {}, step: 'shipping', value: { account: {} } })),
    );
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
  });

  it('tells a cancel whether anything is unsubmitted', () => {
    const onCancel = vi.fn();
    render(
      <Wizard onCancel={onCancel}>
        <WizardStep label="Account" name="account">
          <Text name="email" />
        </WizardStep>
      </Wizard>,
    );
    fireEvent.click(document.querySelector('[data-part="cancel"]') as HTMLButtonElement);
    expect(onCancel.mock.calls[0]?.[0].dirty).toBe(false);
    type('email', 'x');
    fireEvent.click(document.querySelector('[data-part="cancel"]') as HTMLButtonElement);
    expect(onCancel.mock.calls[1]?.[0].dirty).toBe(true);
  });

  it('opens and closes the compact progress, and Escape returns focus to its bar', () => {
    const onProgressOpenChange = vi.fn();
    render(
      <Wizard onProgressOpenChange={onProgressOpenChange}>
        <WizardStep label="Account" name="account" />
      </Wizard>,
    );
    const toggle = document.querySelector('[data-part="progress-toggle"]') as HTMLButtonElement;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('[data-part="progress"]')).toHaveAttribute('data-open');
    const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(onProgressOpenChange.mock.calls[1]?.[1].reason).toBe('escape');
    expect(document.activeElement).toBe(toggle);
  });

  it('goes back to a completed step from its header', async () => {
    render(
      <Wizard defaultStep="shipping" defaultValue={{ account: {} }}>
        <WizardStep label="Account" name="account" />
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Account/ }));
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
  });

  it('takes its layout from the provider and its words from the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <WizardDefaultsProvider progress="top">
          <Wizard messages={{ next: 'Continuar' }}>
            <WizardStep label="Conta" name="account" />
            <WizardStep label="Envio" name="shipping" />
          </Wizard>
        </WizardDefaultsProvider>
      </SlottedProvider>,
    );
    expect(next()).toHaveTextContent('Continuar');
    expect(root()).toHaveAttribute('data-progress', 'top');
    expect(title()).toHaveTextContent('Etapa 1 de 2');
    expect(screen.getByRole('list')).toHaveAccessibleName('Progresso');
  });

  it('writes the hour a draft was saved in the locale in force', async () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Wizard onSaveDraft={() => undefined}>
          <WizardStep label="Conta" name="account">
            <Text name="email" />
          </WizardStep>
        </Wizard>
      </SlottedProvider>,
    );
    fireEvent.click(document.querySelector('[data-part="save-draft"]') as HTMLButtonElement);
    await waitFor(() =>
      expect(document.querySelector('[data-part="draft-status"]')).toHaveTextContent(
        // language: pt-BR
        /^Rascunho salvo às \d{2}:\d{2}$/,
        // language: en-US
      ),
    );
  });

  it('reaches the imperative actions through its handle', async () => {
    const handle = createRef<WizardHandle>();
    render(
      <Wizard defaultValue={{ account: {} }} handle={handle}>
        <WizardStep label="Account" name="account" />
        <WizardStep label="Shipping" name="shipping" />
      </Wizard>,
    );
    act(() => handle.current?.goTo('shipping'));
    await waitFor(() => expect(title()).toHaveTextContent('Shipping'));
    act(() => handle.current?.previous());
    await waitFor(() => expect(title()).toHaveTextContent('Account'));
  });
});
