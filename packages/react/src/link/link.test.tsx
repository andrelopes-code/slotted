import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { Link, LinkDefaultsProvider } from './index';

describe('Link', () => {
  it('renders an anchor carrying the href it was given', () => {
    render(<Link href="/invoices">Invoices</Link>);

    const link = screen.getByRole('link', { name: 'Invoices' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/invoices');
  });

  it('is selected in public by the family identifier, never by a class', () => {
    render(
      <Link className="app-link" href="/invoices">
        Invoices
      </Link>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-ui', 'link');
    expect(link).toHaveAttribute('data-part', 'root');
    expect(link).toHaveClass('app-link');
    expect(link.className).toBe('app-link');
  });

  it('is underlined and painted with the accent unless told otherwise', () => {
    render(
      <>
        <Link href="/a">Default</Link>
        <Link href="/b" underline="none" variant="neutral">
          Bare
        </Link>
      </>,
    );

    expect(screen.getByText('Default')).toHaveAttribute('data-underline', 'always');
    expect(screen.getByText('Default')).toHaveAttribute('data-variant', 'accent');
    expect(screen.getByText('Bare')).toHaveAttribute('data-underline', 'none');
    expect(screen.getByText('Bare')).toHaveAttribute('data-variant', 'neutral');
  });

  it('marks a followed destination only where the application asked for it', () => {
    render(
      <>
        <Link href="/a">Plain</Link>
        <Link href="/b" visited>
          Marked
        </Link>
      </>,
    );

    expect(screen.getByText('Plain')).not.toHaveAttribute('data-visited');
    expect(screen.getByText('Marked')).toHaveAttribute('data-visited');
  });

  describe('a new browsing context', () => {
    it('warns that the link leaves the page, and marks it for the eye as well', () => {
      render(
        <Link external href="https://example.com">
          Documentation
        </Link>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName(/opens in a new tab/);
      expect(link.querySelector('[data-part="external-hint"]')).toHaveAttribute(
        'data-ui',
        'visually-hidden',
      );

      const marker = link.querySelector('[data-part="external-icon"]');
      expect(marker).not.toBeNull();
      expect(marker).toHaveAttribute('aria-hidden', 'true');
      const box = marker?.querySelector('[data-ui="icon"]');
      expect(box).toHaveAttribute('data-directional');
      expect(box?.querySelector('svg[data-glyph="external"]')).not.toBeNull();
    });

    /**
     * The marker is an inline box at the end of the link, and the only thing
     * that stops it wrapping onto the next line alone is the joiner in front
     * of it. Nothing about the rendered picture says whether it is there.
     */
    it('glues the marker to the last word with a word joiner', () => {
      render(
        <Link external href="https://example.com">
          Documentation
        </Link>,
      );

      expect(screen.getByRole('link').textContent).toContain('Documentation\u2060');
    });

    it('opens the destination in a new tab without leaking the opener', () => {
      render(
        <Link external href="https://example.com">
          Documentation
        </Link>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    /* The warning follows the fact, not the prop: a consumer who writes the
       attribute by hand has told the family the same thing. */
    it('warns about a target the consumer set without the prop', () => {
      render(
        <Link href="https://example.com" target="_blank">
          Documentation
        </Link>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName(/opens in a new tab/);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    /* And the explicit value wins, including over the prop: `external` with a
       target of `_self` opens nothing new, so nothing is announced. */
    it('says nothing when the consumer overrules the target', () => {
      render(
        <Link external href="https://example.com" target="_self">
          Documentation
        </Link>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Documentation');
      expect(link).not.toHaveAttribute('rel');
      expect(link.querySelector('[data-part="external-icon"]')).toBeNull();
    });

    it('keeps a rel the consumer wrote rather than rewriting it', () => {
      render(
        <Link external href="https://example.com" rel="nofollow">
          Documentation
        </Link>,
      );

      expect(screen.getByRole('link')).toHaveAttribute('rel', 'nofollow');
    });

    it('takes the wording of the warning from the consumer', () => {
      render(
        <Link
          external
          href="https://example.com"
          // language: pt-BR
          messages={{ externalHint: '(abre numa nova aba)' }}
          // language: en-US
        >
          Documentation
        </Link>,
      );

      // language: pt-BR
      expect(screen.getByRole('link')).toHaveAccessibleName(/abre numa nova aba/);
      // language: en-US
    });

    it('says nothing extra when the link stays in the page', () => {
      render(<Link href="/invoices">Invoices</Link>);

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Invoices');
      expect(link).not.toHaveAttribute('target');
      expect(link.querySelector('[data-part="external-hint"]')).toBeNull();
    });
  });

  describe('disabled', () => {
    it('takes the destination away and keeps the role, the state and the focus', () => {
      render(
        <Link disabled href="/invoices">
          Invoices
        </Link>,
      );

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('href');
      expect(link).toHaveAttribute('role', 'link');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '0');
      expect(link).toHaveAttribute('data-disabled');
    });

    it('refuses the pointer, the middle click and Enter, and the consumer handler with them', () => {
      const onClick = vi.fn();
      const onAuxClick = vi.fn();
      const onKeyDown = vi.fn();
      render(
        <Link
          disabled
          href="/invoices"
          onAuxClick={onAuxClick}
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          Invoices
        </Link>,
      );

      const link = screen.getByRole('link');
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(onClick).not.toHaveBeenCalled();
      expect(onAuxClick).not.toHaveBeenCalled();
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it('leaves every other key alone, so a shortcut still reaches the page', () => {
      const onKeyDown = vi.fn();
      render(
        <Link disabled href="/invoices" onKeyDown={onKeyDown}>
          Invoices
        </Link>,
      );

      screen
        .getByRole('link')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  it('runs the consumer handler when the link is available', () => {
    const onClick = vi.fn();
    render(
      <Link href="/invoices" onClick={onClick}>
        Invoices
      </Link>,
    );

    screen
      .getByRole('link')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hands the wiring to a router link through render, destination included', () => {
    render(
      <Link
        external
        href="https://example.com"
        render={(props) => <a {...props} data-testid="router" />}
      >
        Documentation
      </Link>,
    );

    const link = screen.getByTestId('router');
    expect(link).toHaveAttribute('data-ui', 'link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it('reaches the anchor through a ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link href="/invoices" ref={ref}>
        Invoices
      </Link>,
    );

    expect(ref.current).toBe(screen.getByRole('link'));
  });

  describe('application defaults', () => {
    it('paints every link the way the application decided once', () => {
      render(
        <LinkDefaultsProvider underline="hover" variant="neutral">
          <Link href="/a">Inherited</Link>
        </LinkDefaultsProvider>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('data-underline', 'hover');
      expect(link).toHaveAttribute('data-variant', 'neutral');
    });

    it('lets the link overrule what the application decided', () => {
      render(
        <LinkDefaultsProvider underline="hover" variant="neutral">
          <Link href="/a" underline="always" variant="accent">
            Explicit
          </Link>
        </LinkDefaultsProvider>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('data-underline', 'always');
      expect(link).toHaveAttribute('data-variant', 'accent');
    });

    it('speaks the language in force', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Link external href="https://example.com">
            Documentation
          </Link>
        </SlottedProvider>,
      );

      // language: pt-BR
      expect(screen.getByRole('link')).toHaveAccessibleName(/\(abre em uma nova aba\)/);
      // language: en-US
    });
  });
});
