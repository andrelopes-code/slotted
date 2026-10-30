import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/field/contract.json';
import {
  Field,
  FieldAction,
  FieldControl,
  FieldCounter,
  FieldDefaultsProvider,
  FieldDescription,
  FieldError,
  FieldHeader,
  FieldHelp,
  FieldIndicator,
  FieldLabel,
} from './index';
import { SlottedProvider } from '../i18n';
import { TextField } from '../text-field';
import { Textarea } from '../textarea';
import { useField as useFieldForTest } from './field-context';

describe('Field', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Field data-testid="field">
        <FieldLabel>E-mail</FieldLabel>
        <FieldControl data-testid="control" />
        <FieldCounter data-testid="counter">0/64</FieldCounter>
        <FieldDescription>We will use it for billing.</FieldDescription>
      </Field>,
    );

    const field = screen.getByTestId('field');
    expect(field.tagName).toBe('DIV');
    expect(field).toHaveAttribute('data-ui', 'field');
    expect(field).toHaveAttribute('data-part', 'root');
    expect(screen.getByText('E-mail')).toHaveAttribute('data-part', 'label');
    expect(screen.getByTestId('control')).toHaveAttribute('data-part', 'control');
    expect(screen.getByTestId('counter')).toHaveAttribute('data-part', 'counter');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(
      <Field data-testid="field">
        <FieldControl />
      </Field>,
    );

    const field = screen.getByTestId('field');
    const { defaults } = contract.members.field;
    expect(field).toHaveAttribute('data-size', defaults.size);
    expect(field).toHaveAttribute('data-label-placement', defaults.labelPlacement);
    expect(field).toHaveAttribute('data-necessity', defaults.necessity);
    expect(field).toHaveAttribute('data-width', defaults.width);
    for (const state of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(field).not.toHaveAttribute(state);
    }
  });

  /**
   * Derivation rather than registration: `label[for]` resolves to the
   * identifier the control will use with no ordering dependency between
   * siblings and nothing to coordinate during hydration.
   */
  it('derives every identifier from one base, in the order the contract names', () => {
    render(
      <Field data-testid="field" id="cnpj">
        <FieldLabel>EIN</FieldLabel>
        <FieldControl data-testid="control" />
        <FieldDescription>Digits only.</FieldDescription>
        <FieldError>Two digits are missing.</FieldError>
      </Field>,
    );

    const control = screen.getByTestId('control');
    expect(control).toHaveAttribute('id', 'cnpj-control');
    expect(screen.getByText('EIN')).toHaveAttribute('for', 'cnpj-control');
    expect(control).toHaveAttribute('aria-describedby', 'cnpj-description cnpj-error');
  });

  /**
   * The reading order is fixed rather than read from the DOM. A page that
   * writes the error above the description still hears the help first, because
   * two known slots have one correct order.
   */
  it('reads the help before the error whatever order the page wrote them in', () => {
    render(
      <Field id="cnpj">
        <FieldError>Two digits are missing.</FieldError>
        <FieldControl data-testid="control" />
        <FieldDescription>Digits only.</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-describedby',
      'cnpj-description cnpj-error',
    );
  });

  it('names only the messages that have something to say', () => {
    render(
      <Field id="cnpj">
        <FieldControl data-testid="control" />
        <FieldDescription>Digits only.</FieldDescription>
        <FieldError>{undefined}</FieldError>
      </Field>,
    );

    expect(screen.getByTestId('control')).toHaveAttribute('aria-describedby', 'cnpj-description');
  });

  it('merges the field’s description after a value the consumer wrote', () => {
    render(
      <Field id="cnpj">
        <FieldControl aria-describedby="tour-step" data-testid="control" />
        <FieldDescription>Digits only.</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-describedby',
      'tour-step cnpj-description',
    );
  });

  /**
   * `aria-required`, never the native `required`: the native attribute engages
   * browser constraint validation and changes submit behaviour, which the
   * library must not impose as a side effect of describing a field. `disabled`
   * and `readonly` are native, because that is what those two words mean.
   */
  it('describes the control without taking over its submission', () => {
    render(
      <Field disabled invalid readOnly required>
        <FieldControl data-testid="control" />
      </Field>,
    );

    const control = screen.getByTestId('control');
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control).not.toHaveAttribute('required');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('readonly');
  });

  it('never overwrites a value the consumer stated on the control', () => {
    render(
      <Field disabled invalid>
        <FieldControl aria-invalid={false} data-testid="control" disabled={false} id="mine" />
      </Field>,
    );

    const control = screen.getByTestId('control');
    expect(control).toHaveAttribute('id', 'mine');
    expect(control).toHaveAttribute('aria-invalid', 'false');
    expect(control).not.toBeDisabled();
  });

  /**
   * The glyph is hidden and the words are not. `aria-required` on the control
   * already carries the semantics, and a reader working a form of twenty
   * required fields does not need to hear "asterisk" twenty times; `(optional)`
   * is information rather than decoration.
   */
  it('says necessity as a mark, as a word on the optional fields, as words, or not at all', () => {
    const { rerender } = render(
      <Field data-testid="field" required>
        <FieldLabel>EIN</FieldLabel>
      </Field>,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('*')).toHaveAttribute('data-part', 'mark');

    rerender(
      <Field data-testid="field" required necessity="words">
        <FieldLabel>EIN</FieldLabel>
      </Field>,
    );
    expect(screen.getByText('(required)')).not.toHaveAttribute('aria-hidden');

    rerender(
      <Field data-testid="field" necessity="words">
        <FieldLabel>State tax ID</FieldLabel>
      </Field>,
    );
    expect(screen.getByText('(optional)')).toBeInTheDocument();

    rerender(
      <Field data-testid="field" necessity="optional">
        <FieldLabel>Nome fantasia</FieldLabel>
      </Field>,
    );
    expect(screen.getByText('(optional)')).not.toHaveAttribute('aria-hidden');

    rerender(
      <Field data-testid="field" necessity="optional" required>
        <FieldLabel>Legal name</FieldLabel>
      </Field>,
    );
    expect(screen.queryByText('(optional)')).not.toBeInTheDocument();
    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();

    rerender(
      <Field data-testid="field" necessity="none" required>
        <FieldLabel>EIN</FieldLabel>
      </Field>,
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  /**
   * The gap on screen is CSS, and an accessible name is computed from text: with
   * no space in the DOM the control read as `Note(optional)`.
   */
  it('separates the necessity word from the label in the accessible name', () => {
    render(
      <FieldDefaultsProvider necessity="optional">
        <Field>
          <FieldLabel>Note</FieldLabel>
          <TextField />
        </Field>
      </FieldDefaultsProvider>,
    );

    expect(screen.getByRole('textbox', { name: 'Note (optional)' })).toBeInTheDocument();
  });

  it('speaks the necessity words of the language in force, and lets a field lay its own over them', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <FieldDefaultsProvider necessity="words">
          <Field>
            <FieldLabel>State tax ID</FieldLabel>
          </Field>
          {/* language: pt-BR */}
          <Field messages={{ required: '(exigido)' }} required>
            {/* language: en-US */}
            <FieldLabel>EIN</FieldLabel>
          </Field>
        </FieldDefaultsProvider>
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(screen.getByText('(opcional)')).toBeInTheDocument();
    // language: en-US
    expect(screen.getByText('(exigido)')).toBeInTheDocument();
  });

  it('lets an application set the family’s appearance once, and a field override it', () => {
    render(
      <FieldDefaultsProvider labelPlacement="side" size="sm">
        <Field data-testid="inherited" />
        <Field data-testid="own" size="lg" />
      </FieldDefaultsProvider>,
    );

    expect(screen.getByTestId('inherited')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-label-placement', 'side');
    expect(screen.getByTestId('own')).toHaveAttribute('data-size', 'lg');
  });

  /**
   * The description and the error are `inline-message` roots, which is what
   * `docs/process/build-order.md` states as the reason that family was built in wave
   * 2: a field error arrives with the clipped severity word an application
   * translates once, and the field draws none of it.
   */
  it('speaks through the message family in the two tones the contract names', () => {
    render(
      <Field data-testid="field" id="cnpj">
        <FieldDescription data-testid="description">Digits only.</FieldDescription>
        <FieldError data-testid="error">Two digits are missing.</FieldError>
      </Field>,
    );

    const description = screen.getByTestId('description');
    const error = screen.getByTestId('error');
    expect(description).toHaveAttribute('data-ui', contract.messageFamily);
    expect(description).toHaveAttribute('data-tone', contract.messageTones.description);
    expect(description).toHaveAttribute('id', 'cnpj-description');
    expect(error).toHaveAttribute('data-tone', contract.messageTones.error);
    expect(error).toHaveAttribute('id', 'cnpj-error');
    expect(error.querySelector('[data-part="prefix"]')?.textContent).toBe('Error:');
  });

  /**
   * A warning that does not block submission is the same part in another tone.
   * Fluent spends a `validationState` axis on that distinction and Carbon a
   * second component.
   */
  it('lets the error speak in a tone that is not an error', () => {
    render(
      <Field>
        <FieldError data-testid="error" live="polite" tone="warning">
          The password is valid, but easy to guess.
        </FieldError>
      </Field>,
    );

    const error = screen.getByTestId('error');
    expect(error).toHaveAttribute('data-tone', 'warning');
    expect(error).toHaveAttribute('role', 'status');
  });

  it('hands its messages the field’s own step and its disabled state', () => {
    render(
      <Field data-testid="field" disabled size="lg">
        <FieldDescription data-testid="description">Digits only.</FieldDescription>
      </Field>,
    );

    const description = screen.getByTestId('description');
    expect(description).toHaveAttribute('data-size', 'md');
    expect(description).toHaveAttribute('data-disabled');
  });

  /**
   * A count can pass its maximum while validation has not yet run, so the
   * counter carries its own `data-invalid` rather than reading the field's.
   */
  it('lets the counter go over its limit before the field is in error', () => {
    render(
      <Field data-testid="field">
        <FieldCounter data-testid="counter" invalid>
          148/140
        </FieldCounter>
      </Field>,
    );

    expect(screen.getByTestId('counter')).toHaveAttribute('data-invalid');
    expect(screen.getByTestId('field')).not.toHaveAttribute('data-invalid');
  });

  it('renders every part into another element on request', () => {
    render(
      <Field data-testid="field" render={(props) => <section {...props} />}>
        <FieldLabel render={(props) => <span {...props} />}>E-mail</FieldLabel>
        <FieldControl render={(props) => <textarea {...props} data-testid="control" />} />
        <FieldCounter render={(props) => <output {...props} data-testid="counter" />}>
          0/64
        </FieldCounter>
      </Field>,
    );

    expect(screen.getByTestId('field').tagName).toBe('SECTION');
    expect(screen.getByTestId('control').tagName).toBe('TEXTAREA');
    expect(screen.getByTestId('counter').tagName).toBe('OUTPUT');
  });

  it('passes native attributes and events through to the element that owns them', () => {
    render(
      <Field data-testid="field">
        <FieldControl
          autoComplete="email"
          data-testid="control"
          inputMode="email"
          maxLength={64}
          name="email"
          placeholder="you@company.com"
          type="email"
        />
      </Field>,
    );

    const control = screen.getByTestId('control');
    expect(control).toHaveAttribute('type', 'email');
    expect(control).toHaveAttribute('name', 'email');
    expect(control).toHaveAttribute('autocomplete', 'email');
    expect(control).toHaveAttribute('maxlength', '64');
    expect(control).toHaveAttribute('inputmode', 'email');
  });

  /**
   * The label row, when the label has company. The help control is a sibling
   * of the label rather than a child: a `button` inside a `label` is invalid
   * HTML, and a press on it would reach the label and move focus to the control.
   */
  it('keeps every control of the label row beside the label, never inside it', () => {
    render(
      <Field id="senha">
        <FieldHeader data-testid="header">
          <FieldLabel>Password</FieldLabel>
          {/* language: pt-BR */}
          <FieldHelp>No mínimo oito caracteres.</FieldHelp>
          {/* language: en-US */}
          <FieldIndicator>Beta</FieldIndicator>
          <FieldAction>Forgot your password?</FieldAction>
        </FieldHeader>
        <FieldControl data-testid="control" />
      </Field>,
    );

    const header = screen.getByTestId('header');
    const label = screen.getByText('Password');
    expect(header).toHaveAttribute('data-part', 'header');
    expect(header.tagName).toBe('DIV');
    for (const part of ['help', 'indicator', 'action']) {
      const element = header.querySelector(`[data-part='${part}']`);
      expect(element?.parentElement).toBe(header);
      expect(label.contains(element)).toBe(false);
    }
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  /**
   * The contract's reading order: what qualifies the field, the help behind
   * the icon, the description, the count, the error.
   */
  it('describes the control with the indicator, the help, the description, the count and the error', () => {
    render(
      <Field id="bio">
        <FieldHeader>
          {/* language: pt-BR */}
          <FieldLabel>Apresentação</FieldLabel>
          {/* language: en-US */}
          <FieldHelp>Appears on the public profile.</FieldHelp>
          <FieldIndicator>Beta</FieldIndicator>
          <FieldCounter>24/160</FieldCounter>
        </FieldHeader>
        <FieldControl data-testid="control" />
        <FieldError>Longa demais.</FieldError>
        <FieldDescription>Uma frase.</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId('control')).toHaveAttribute(
      'aria-describedby',
      'bio-indicator bio-help bio-description bio-counter bio-error',
    );
    expect(screen.getByText('24/160')).toHaveAttribute('id', 'bio-counter');
    expect(screen.getByText('Beta').closest('[data-part="indicator"]')).toHaveAttribute(
      'id',
      'bio-indicator',
    );
  });

  /**
   * The tooltip's layer exists only while it is open, so the description
   * points at a node the family keeps hidden, which a directly referenced
   * `hidden` element still contributes to (accname 1.2, step 2A).
   */
  it('describes the control and the help button with the help text while the hint is closed', () => {
    render(
      <Field id="prazo">
        <FieldHeader>
          <FieldLabel>Prazo</FieldLabel>
          <FieldHelp>Dias corridos.</FieldHelp>
        </FieldHeader>
        <FieldControl data-testid="control" />
      </Field>,
    );

    const help = screen.getByRole('button', { name: 'More information' });
    const text = document.getElementById('prazo-help');
    expect(text).toHaveTextContent('Dias corridos.');
    expect(text).toHaveAttribute('hidden');
    expect(help).toHaveAttribute('aria-describedby', 'prazo-help');
    expect(help).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('control')).toHaveAttribute('aria-describedby', 'prazo-help');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  /**
   * A tooltip alone opens on a coarse pointer only by a long press. The help
   * has no other action, so its press is the hint: the first press pins it
   * open, the second closes it, and each is a request carrying its reason.
   */
  it('opens and closes the hint on a press, as a request with its reason', () => {
    const onOpenChange = vi.fn();
    render(
      <Field id="prazo">
        <FieldHeader>
          <FieldLabel>Prazo</FieldLabel>
          <FieldHelp onOpenChange={onOpenChange}>Dias corridos.</FieldHelp>
        </FieldHeader>
      </Field>,
    );

    const help = screen.getByRole('button', { name: 'More information' });
    act(() => {
      fireEvent.click(help, { detail: 1 });
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(help).toHaveAttribute('data-open');

    act(() => {
      fireEvent.click(help, { detail: 0 });
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(help).not.toHaveAttribute('data-open');
  });

  it('names the help control in the language in force, and lets a page name one of its own', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Field>
          <FieldHeader>
            <FieldLabel>Prazo</FieldLabel>
            <FieldHelp>Dias corridos.</FieldHelp>
          </FieldHeader>
        </Field>
        <Field>
          <FieldHeader>
            <FieldLabel>Interest</FieldLabel>
            <FieldHelp aria-label="How interest is calculated">Per month.</FieldHelp>
          </FieldHeader>
        </Field>
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Mais informações' })).toBeInTheDocument();
    // language: en-US
    expect(screen.getByRole('button', { name: 'How interest is calculated' })).toBeInTheDocument();
  });

  /** A disabled field still answers what it is for, and why it is off. */
  it('leaves the help and the action operable on a disabled field', () => {
    render(
      <Field disabled>
        <FieldHeader>
          <FieldLabel>Centro de custo</FieldLabel>
          <FieldHelp>Liberado depois da unidade.</FieldHelp>
          <FieldAction>Escolher unidade</FieldAction>
        </FieldHeader>
        <FieldControl data-testid="control" />
      </Field>,
    );

    expect(screen.getByTestId('control')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More information' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Escolher unidade' })).toBeEnabled();
  });

  /** The action becomes a link on request, and keeps the consumer's handler. */
  it('renders the action as a link and composes the consumer’s handler', () => {
    const onClick = vi.fn();
    render(
      <Field>
        <FieldHeader>
          <FieldLabel>Password</FieldLabel>
          <FieldAction onClick={onClick} render={(props) => <a {...props} href="/recuperar" />}>
            Forgot your password?
          </FieldAction>
        </FieldHeader>
      </Field>,
    );

    const link = screen.getByRole('link', { name: 'Forgot your password?' });
    expect(link).toHaveAttribute('data-part', 'action');
    expect(link).not.toHaveAttribute('type');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * The count a control publishes is drawn once: at the end of the header when
   * the page wrote one, on the root otherwise.
   */
  it('draws the published count in the header when there is one', () => {
    function Counting() {
      const setCount = useFieldForTest()?.setCount;
      useEffect(() => setCount?.({ length: 3, max: 14 }), [setCount]);
      return null;
    }
    render(
      <Field id="nif">
        <FieldHeader data-testid="header">
          <FieldLabel>NIF</FieldLabel>
        </FieldHeader>
        <Counting />
      </Field>,
    );

    const counter = screen.getByText('3/14');
    expect(counter.parentElement).toBe(screen.getByTestId('header'));
    expect(counter).toHaveAttribute('id', 'nif-counter');
    expect(document.querySelectorAll('[data-part="counter"]')).toHaveLength(1);
  });
});

/**
 * The server renders once and runs no effect, so whatever the field learns in
 * an effect is missing from its markup. What the page wrote is known at render
 * time, and the server markup is the markup the client settles on.
 */
describe('Field on the server', () => {
  const parse = (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host;
  };

  it('describes the control by the messages written after it', () => {
    const host = parse(
      renderToString(
        <Field id="email">
          <FieldLabel>Email</FieldLabel>
          <FieldControl />
          <FieldDescription>We will use it for billing.</FieldDescription>
          <FieldError>The domain is missing.</FieldError>
        </Field>,
      ),
    );

    expect(host.querySelector('input')).toHaveAttribute(
      'aria-describedby',
      'email-description email-error',
    );
  });

  it('describes the control by the help, the indicator and the counter in its header', () => {
    const host = parse(
      renderToString(
        <Field id="tags">
          <FieldHeader>
            <FieldLabel>Tags</FieldLabel>
            <FieldIndicator>Beta</FieldIndicator>
            <FieldHelp>Separated by commas.</FieldHelp>
            <FieldCounter>3/5 tags</FieldCounter>
          </FieldHeader>
          <FieldControl />
        </Field>,
      ),
    );

    expect(host.querySelector('input')).toHaveAttribute(
      'aria-describedby',
      'tags-indicator tags-help tags-counter',
    );
    expect(host.querySelectorAll('[data-part="counter"]')).toHaveLength(1);
  });

  it('draws the count a textarea publishes, and describes the textarea by it', () => {
    const host = parse(
      renderToString(
        <Field id="bio">
          <FieldLabel>Bio</FieldLabel>
          <Textarea countMax={140} defaultValue="Ships in two days." showCount />
        </Field>,
      ),
    );

    expect(host.querySelector('textarea')).toHaveAttribute('aria-describedby', 'bio-counter');
    expect(host.querySelector('[data-part="counter"]')).toHaveTextContent('18/140');
    expect(host.querySelector('label')?.nextElementSibling).toHaveAttribute('data-part', 'counter');
  });

  it('draws the count a text field publishes in the header, and describes the input by it', () => {
    const host = parse(
      renderToString(
        <Field id="nif">
          <FieldHeader>
            <FieldLabel>NIF</FieldLabel>
          </FieldHeader>
          <TextField maxLength={9} showCount value="123" />
          <FieldDescription>Nine digits.</FieldDescription>
        </Field>,
      ),
    );

    expect(host.querySelector('input')).toHaveAttribute(
      'aria-describedby',
      'nif-description nif-counter',
    );
    const counter = host.querySelector('[data-part="counter"]');
    expect(counter).toHaveTextContent('3/9');
    expect(counter?.parentElement).toHaveAttribute('data-part', 'header');
  });

  it('hydrates without a mismatch and keeps the markup it was served', async () => {
    const tree = (
      <Field id="bio">
        <FieldLabel>Bio</FieldLabel>
        <Textarea countMax={140} defaultValue="Ships in two days." showCount />
        <FieldDescription>Shown on the profile.</FieldDescription>
      </Field>
    );
    const html = renderToString(tree);
    const host = parse(html);
    document.body.append(host);
    const onRecoverableError = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await act(async () => {
        hydrateRoot(host, tree, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(host.innerHTML).toBe(html);
    } finally {
      error.mockRestore();
      host.remove();
    }
  });
});
