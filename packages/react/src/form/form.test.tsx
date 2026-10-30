import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/form/contract.json';
import { SlottedProvider } from '../i18n';
import { Form } from './form';
import { FormDefaultsProvider } from './form-defaults';
import { FormActions, FormSummary } from './form-parts';
import type { FormHandle } from './form.types';

const form = () => document.querySelector('[data-ui="form"]') as HTMLFormElement;
const summary = () => document.querySelector('[data-part="summary"]');
const items = () =>
  Array.from(document.querySelectorAll('[data-part="summary-item"]')) as HTMLElement[];

function Fields() {
  return (
    <>
      <label htmlFor="name">Nome</label>
      <input id="name" name="name" required />
      <label htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" />
      <button type="submit">Submit</button>
    </>
  );
}

const submit = () => fireEvent.submit(form());

describe('Form', () => {
  it('is selected in public by the family identifier and renders a form element', () => {
    render(
      <Form className="page-checkout">
        <Fields />
      </Form>,
    );

    expect(form().tagName).toBe('FORM');
    expect(form()).toHaveAttribute('data-ui', 'form');
    expect(form()).toHaveAttribute('data-part', 'root');
    expect(form()).toHaveClass('page-checkout');
  });

  /**
   * The attribute stops the browser drawing its own bubble beside a control
   * whose error the field is already showing. Constraint validation still runs.
   */
  it('writes novalidate, and lets a consumer take the bubble back', () => {
    const { rerender } = render(
      <Form>
        <Fields />
      </Form>,
    );
    expect(form().noValidate).toBe(true);
    expect(contract.nativeValidation.writtenByDefault).toBe(true);

    rerender(
      <Form nativeValidation>
        <Fields />
      </Form>,
    );
    expect(form().noValidate).toBe(false);
  });

  describe('validation', () => {
    it('harvests the platform’s own message at submit and refuses to send', () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Fields />
        </Form>,
      );

      submit();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(summary()).not.toBeNull();
      expect(items()).toHaveLength(1);
      expect(items()[0]?.textContent?.length).toBeGreaterThan(0);
      expect(form()).toHaveAttribute('data-invalid', '');
    });

    it('sends when nothing is wrong', () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <label htmlFor="name">Nome</label>
          <input defaultValue="Ana" id="name" name="name" required />
        </Form>,
      );

      submit();

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Ana' });
      expect(summary()).toBeNull();
    });

    it('checks nothing when validation is turned off', () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit} validate="none">
          <Fields />
        </Form>,
      );

      submit();

      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe('errors', () => {
    it('takes a server’s map, keyed by the control’s name', () => {
      render(
        <Form errors={{ email: 'That address is already in use' }}>
          <Fields />
        </Form>,
      );

      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveTextContent('That address is already in use');
      expect(items()[0]).toHaveAttribute('href', '#email');
    });

    /** An object's own key order is the server's, and the server does not know the layout. */
    it('lists the errors in document order rather than in the object’s', () => {
      render(
        <Form errors={{ email: 'Depois', name: 'Antes' }}>
          <Fields />
        </Form>,
      );

      expect(items().map((item) => item.textContent)).toEqual(['Antes', 'Depois']);
    });

    /** A message a reader cannot reach is still a message they have to be given. */
    it('keeps an error naming a control the form does not hold, without a link', () => {
      render(
        <Form errors={{ coupon: 'O cupom expirou' }}>
          <Fields />
        </Form>,
      );

      expect(items()).toHaveLength(1);
      expect(items()[0]?.tagName).toBe('SPAN');
    });

    it('drops a server error when the field it names is edited', () => {
      function Server() {
        const [errors, setErrors] = useState<Record<string, string>>({
          name: 'Already registered',
        });
        return (
          <Form errors={errors} onErrorsChange={(next) => setErrors(next as never)}>
            <Fields />
          </Form>
        );
      }

      render(<Server />);
      expect(items()).toHaveLength(1);

      fireEvent.input(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });

      expect(items()).toHaveLength(0);
    });

    it('lets a submit handler return the errors it found', async () => {
      render(
        <Form onSubmit={() => ({ name: 'This name is reserved' })} validate="none">
          <Fields />
        </Form>,
      );

      submit();

      await waitFor(() => expect(items()).toHaveLength(1));
      expect(items()[0]).toHaveTextContent('This name is reserved');
    });
  });

  describe('submission', () => {
    it('reports itself busy while an asynchronous submit is in flight', async () => {
      let settle: (() => void) | undefined;
      render(
        <Form
          onSubmit={() =>
            new Promise<void>((resolve) => {
              settle = resolve;
            })
          }
          validate="none"
        >
          <Fields />
        </Form>,
      );

      submit();

      await waitFor(() => expect(form()).toHaveAttribute('data-loading', ''));
      expect(form()).toHaveAttribute('aria-busy', 'true');

      settle?.();
      await waitFor(() => expect(form()).not.toHaveAttribute('data-loading'));
    });

    /** The defect a double-clicked button produces in a bare form. */
    it('refuses a second submit while one is pending', async () => {
      const onSubmit = vi.fn(() => new Promise<void>(() => undefined));
      render(
        <Form onSubmit={onSubmit} validate="none">
          <Fields />
        </Form>,
      );

      submit();
      await waitFor(() => expect(form()).toHaveAttribute('data-loading', ''));
      submit();

      expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('clears the errors and the submitted flag on a native reset', () => {
      render(
        <Form>
          <Fields />
        </Form>,
      );

      submit();
      expect(items().length).toBeGreaterThan(0);

      fireEvent.reset(form());
      expect(items()).toHaveLength(0);
    });
  });

  describe('the summary', () => {
    /** The four things the sourced error summary states a summary must do. */
    it('is a focusable region with a heading and a link per error', () => {
      render(
        <Form errors={{ name: 'Enter your name' }}>
          <Fields />
        </Form>,
      );

      const region = summary() as HTMLElement;
      expect(region).toHaveAttribute('role', 'alert');
      expect(region).toHaveAttribute('tabindex', '-1');
      expect(region.querySelector('[data-part="summary-title"]')).toHaveTextContent(
        'There is a problem',
      );
      expect(items()[0]).toHaveAttribute('href', '#name');
    });

    it('takes focus after a failed submit', async () => {
      render(
        <Form>
          <Fields />
        </Form>,
      );

      submit();

      await waitFor(() => expect(document.activeElement).toBe(summary()));
    });

    it('focuses the first invalid control instead when it is asked to', async () => {
      render(
        <Form errorFocus="control">
          <Fields />
        </Form>,
      );

      submit();

      await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nome')));
    });

    it('moves focus to the control a summary item names', () => {
      render(
        <Form errors={{ email: 'Invalid address' }}>
          <Fields />
        </Form>,
      );

      fireEvent.click(items()[0] as HTMLElement);

      expect(document.activeElement).toBe(screen.getByLabelText('E-mail'));
    });

    it('is not rendered by the family when the consumer places it', () => {
      render(
        <Form errors={{ name: 'Enter your name' }} summary="none">
          <Fields />
          <FormSummary data-testid="mine" />
        </Form>,
      );

      expect(document.querySelectorAll('[data-part="summary"]')).toHaveLength(1);
      expect(summary()).toHaveAttribute('data-testid', 'mine');
    });

    it('renders nothing at all when there is nothing wrong', () => {
      render(
        <Form>
          <Fields />
        </Form>,
      );

      expect(summary()).toBeNull();
      expect(form()).not.toHaveAttribute('data-invalid');
    });
  });

  describe('composition', () => {
    it('arranges the action row and answers every alignment', () => {
      render(
        <Form align="between">
          <FormActions data-testid="actions" />
        </Form>,
      );

      expect(screen.getByTestId('actions')).toHaveAttribute('data-part', 'actions');
      expect(screen.getByTestId('actions')).toHaveAttribute('data-align', 'between');
    });

    /**
     * The stylesheet names the two parts by the family's identifier, so a
     * nested family's part of the same name — a table's summary row, a
     * section's actions — is not painted as the form's.
     */
    it('names its summary and its action row by the family, so a nested family’s parts keep their own look', () => {
      render(
        <Form errors={{ name: 'Enter your name' }}>
          <Fields />
          <FormActions data-testid="actions" />
        </Form>,
      );

      expect(summary()).toHaveAttribute('data-ui', 'form');
      expect(screen.getByTestId('actions')).toHaveAttribute('data-ui', 'form');
    });

    it('lets an application decide once how its forms behave', () => {
      render(
        <FormDefaultsProvider align="stretch">
          <Form errors={{ name: 'Enter your name' }}>
            <Fields />
            <FormActions data-testid="actions" />
          </Form>
        </FormDefaultsProvider>,
      );

      expect(screen.getByTestId('actions')).toHaveAttribute('data-align', 'stretch');
    });

    it('titles the summary in the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Form errors={{ name: 'Enter your name' }}>
            <Fields />
          </Form>
          <Form
            errors={{ name: 'Enter your name' }}
            messages={{ summaryTitle: 'Corrija estes campos' }}
          >
            <Fields />
          </Form>
        </SlottedProvider>,
      );

      const titles = document.querySelectorAll('[data-part="summary-title"]');
      // language: pt-BR
      expect(titles[0]).toHaveTextContent('Há um problema');
      // language: en-US
      expect(titles[1]).toHaveTextContent('Corrija estes campos');
    });

    it('exposes the four actions a value cannot express', () => {
      const handle = createRef<FormHandle>();
      render(
        <Form handle={handle}>
          <Fields />
        </Form>,
      );

      expect(Object.keys(handle.current ?? {}).sort()).toEqual(
        [...contract.imperative].sort((a, b) => a.localeCompare(b)),
      );

      const found = handle.current?.validate();
      expect(Object.keys(found ?? {})).toEqual(['name']);

      handle.current?.reset();
      expect(items()).toHaveLength(0);
    });

    it('passes a native attribute through to the element', () => {
      render(
        <Form action="/checkout" method="post">
          <Fields />
        </Form>,
      );

      expect(form()).toHaveAttribute('action', '/checkout');
      expect(form()).toHaveAttribute('method', 'post');
    });
  });
});
