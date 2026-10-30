import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/inline-message/contract.json';
import { Button } from '../button';
import { InlineMessage, InlineMessageActions, InlineMessageDefaultsProvider } from './index';

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('InlineMessage', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <InlineMessage data-testid="message" tone="danger">
        Enter a valid EIN.
      </InlineMessage>,
    );

    const message = screen.getByTestId('message');
    expect(message.tagName).toBe('P');
    expect(message).toHaveAttribute('data-ui', 'inline-message');
    expect(message).toHaveAttribute('data-part', 'root');
    expect(parts(message)).toEqual(['prefix', 'icon', 'text']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<InlineMessage data-testid="message">Entre 8 e 64 caracteres.</InlineMessage>);

    const message = screen.getByTestId('message');
    const { defaults } = contract.members.inlineMessage;
    expect(message).toHaveAttribute('data-tone', defaults.tone);
    expect(message).toHaveAttribute('data-size', defaults.size);
    expect(message).toHaveAttribute('data-live', defaults.live);
    expect(message).not.toHaveAttribute('data-loading');
    expect(message).not.toHaveAttribute('data-disabled');
    expect(message).not.toHaveAttribute('data-reserve');
  });

  /**
   * The capability none of the thirteen surveyed implementations ships. The
   * mark and the color reach a reader who looks; the word is what reaches a
   * reader who listens, and it is first in the DOM so it is read first.
   */
  it('says the severity in words, before the message, for every tone that is one', () => {
    for (const [tone, word] of Object.entries(contract.tonePrefixes)) {
      const { unmount } = render(
        <InlineMessage data-testid="message" tone={tone as 'danger'}>
          Uma mensagem.
        </InlineMessage>,
      );

      const message = screen.getByTestId('message');
      const prefix = message.querySelector('[data-part="prefix"]');
      if (word === null) expect(prefix).toBeNull();
      else {
        expect(prefix).not.toBeNull();
        expect(prefix?.textContent).toBe(word);
        expect(message.firstElementChild).toBe(prefix);
      }
      unmount();
    }
  });

  it('lets one message replace the word, and the empty string remove it', () => {
    render(
      <>
        <InlineMessage data-testid="own" prefix="Error:" tone="danger">
          Enter a valid EIN.
        </InlineMessage>
        <InlineMessage data-testid="none" prefix="" tone="danger">
          Error: enter a valid EIN.
        </InlineMessage>
      </>,
    );

    expect(screen.getByTestId('own').querySelector('[data-part="prefix"]')?.textContent).toBe(
      'Error:',
    );
    expect(screen.getByTestId('none').querySelector('[data-part="prefix"]')).toBeNull();
  });

  /**
   * The provider is where an application translates the four words once. A
   * partial table is merged over the inherited one, so replacing `danger`
   * alone does not silently drop `warning`.
   */
  it('takes the application’s own words, one at a time', () => {
    render(
      <InlineMessageDefaultsProvider prefixes={{ danger: 'Error:' }} size="md" tone="danger">
        <InlineMessage data-testid="inherited">Enter a valid EIN.</InlineMessage>
        <InlineMessage data-testid="stated" tone="warning">
          The password is weak.
        </InlineMessage>
      </InlineMessageDefaultsProvider>,
    );

    const inherited = screen.getByTestId('inherited');
    expect(inherited).toHaveAttribute('data-tone', 'danger');
    expect(inherited).toHaveAttribute('data-size', 'md');
    expect(inherited.querySelector('[data-part="prefix"]')?.textContent).toBe('Error:');
    expect(screen.getByTestId('stated').querySelector('[data-part="prefix"]')?.textContent).toBe(
      'Warning:',
    );
  });

  it('lets a message state an axis the provider already answered', () => {
    render(
      <InlineMessageDefaultsProvider tone="danger">
        <InlineMessage data-testid="message" tone="success">
          Name available.
        </InlineMessage>
      </InlineMessageDefaultsProvider>,
    );

    expect(screen.getByTestId('message')).toHaveAttribute('data-tone', 'success');
  });

  /**
   * `alert` writes its live role on the text part, because MDN's `alert` role
   * reference restricts the role to text content and an alert has a dismiss
   * button beside its text. This family has no controls, so the role belongs on
   * the element that is the text.
   */
  it('carries the announcing role on the element that is the message', () => {
    render(
      <>
        <InlineMessage data-testid="off">Nothing is announced.</InlineMessage>
        <InlineMessage data-testid="polite" live="polite">
          Saved.
        </InlineMessage>
        <InlineMessage data-testid="assertive" live="assertive" tone="danger">
          Could not save.
        </InlineMessage>
      </>,
    );

    expect(screen.getByTestId('off')).not.toHaveAttribute('role');
    expect(screen.getByTestId('polite')).toHaveAttribute('role', contract.liveRoles.polite);
    expect(screen.getByTestId('assertive')).toHaveAttribute('role', contract.liveRoles.assertive);
  });

  /**
   * The sentence is wrapped by the family so `[data-part='text']:empty` is an
   * exact question — which is what lets `reserve` hold a line open and draw
   * nothing in it.
   */
  it('wraps the message in the family’s own element, and leaves it empty when there is none', () => {
    render(
      <>
        <InlineMessage data-testid="full" reserve tone="danger">
          Two digits are missing.
        </InlineMessage>
        <InlineMessage data-testid="empty" reserve tone="danger" />
      </>,
    );

    const full = screen.getByTestId('full');
    expect(full).toHaveAttribute('data-reserve', '');
    expect(full.querySelector('[data-part="text"]')?.textContent).toBe('Two digits are missing.');
    expect(
      screen.getByTestId('empty').querySelector('[data-part="text"]')?.childNodes,
    ).toHaveLength(0);
  });

  it('turns the mark into a ring while the message waits, and mutes it when disabled', () => {
    render(
      <>
        <InlineMessage data-testid="waiting" loading>
          Verificando disponibilidade…
        </InlineMessage>
        <InlineMessage data-testid="off" disabled>
          Available on the Enterprise plan.
        </InlineMessage>
      </>,
    );

    expect(screen.getByTestId('waiting')).toHaveAttribute(
      contract.stateAttributes.loading as 'data-loading',
      '',
    );
    expect(screen.getByTestId('off')).toHaveAttribute(
      contract.stateAttributes.disabled as 'data-disabled',
      '',
    );
  });

  /**
   * The identifier is what an `aria-describedby` or an `aria-errormessage`
   * points at, so the element always has one — and the consumer's own always
   * wins, because that is the value a form already knows.
   */
  it('always has an identifier, and never replaces the consumer’s', () => {
    render(
      <>
        <InlineMessage data-testid="generated">Uma mensagem.</InlineMessage>
        <InlineMessage data-testid="stated" id="cnpj-error">
          Outra.
        </InlineMessage>
      </>,
    );

    expect(screen.getByTestId('generated').id).not.toBe('');
    expect(screen.getByTestId('stated').id).toBe('cnpj-error');
  });

  it('draws no mark when asked, and the page’s own artwork when given one', () => {
    render(
      <>
        <InlineMessage data-testid="bare" hideIcon tone="danger">
          Sem marca.
        </InlineMessage>
        <InlineMessage data-testid="own" icon={<svg data-testid="shield" />} tone="accent">
          With the page art.
        </InlineMessage>
      </>,
    );

    expect(screen.getByTestId('bare').querySelector('[data-part="icon"]')).toBeNull();
    expect(screen.getByTestId('own').querySelector('[data-part="icon"] svg')).not.toBeNull();
    expect(screen.getByTestId('own').querySelector('[data-glyph]')).toBeNull();
  });

  it('draws the glyph the contract maps each tone to, and none for help', () => {
    for (const [tone, glyph] of Object.entries(contract.toneGlyphs)) {
      const { unmount } = render(
        <InlineMessage data-testid="message" tone={tone as never}>
          Uma mensagem.
        </InlineMessage>,
      );
      const icon = screen.getByTestId('message').querySelector('[data-part="icon"]') as Element;
      const drawn = icon.querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
      if (glyph === null) expect(icon.childElementCount, tone).toBe(0);
      else expect(drawn?.getAttribute('data-glyph'), tone).toBe(glyph);
      unmount();
    }
  });

  it('draws the dot for a bullet, nothing for no mark, and nothing while waiting', () => {
    render(
      <>
        <InlineMessage data-testid="dot" mark="dot" tone="danger">
          Um ponto.
        </InlineMessage>
        <InlineMessage data-testid="none" mark="none" tone="danger">
          Nada.
        </InlineMessage>
        <InlineMessage data-testid="waiting" loading tone="danger">
          A verificar.
        </InlineMessage>
      </>,
    );
    const icon = (id: string) =>
      screen.getByTestId(id).querySelector('[data-part="icon"]') as Element;

    expect(icon('dot').querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'dot');
    expect(icon('none').childElementCount).toBe(0);
    expect(icon('waiting').childElementCount).toBe(0);
  });

  it('passes native props through and renders into the element a page asks for', () => {
    render(
      <InlineMessage
        className="page-owned"
        data-testid="message"
        lang="de"
        render={(props) => <div {...props} />}
        tone="warning"
      >
        Die Zahlung schlug fehl.
      </InlineMessage>,
    );

    const message = screen.getByTestId('message');
    expect(message.tagName).toBe('DIV');
    expect(message).toHaveAttribute('lang', 'de');
    expect(message).toHaveClass('page-owned');
    expect(message).toHaveAttribute('data-ui', 'inline-message');
  });

  it('lets a consumer state a role of their own', () => {
    render(
      <InlineMessage data-testid="message" live="polite" role="note">
        A note.
      </InlineMessage>,
    );

    expect(screen.getByTestId('message')).toHaveAttribute('role', 'note');
  });
});

/**
 * A message that offers its answers holds them. A paragraph cannot hold a
 * button, so the root becomes a group named by the sentence, and a live
 * message announces the sentence and not the buttons.
 */
describe('a message with actions', () => {
  it('is a group named by its sentence, holding the buttons', () => {
    render(
      <InlineMessage tone="warning" live="polite">
        More than one number can be the amount.
        <InlineMessageActions>
          <Button>R$ 2,00</Button>
          <Button>R$ 15,00</Button>
        </InlineMessageActions>
      </InlineMessage>,
    );
    const group = screen.getByRole('group', { name: 'More than one number can be the amount.' });

    expect(group.tagName).not.toBe('P');
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('More than one number can be the amount.');
    expect(screen.getByRole('status')).not.toHaveTextContent('R$ 2,00');
    for (const button of within(group).getAllByRole('button')) {
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });
});
