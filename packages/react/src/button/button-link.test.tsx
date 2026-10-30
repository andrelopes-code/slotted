import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { ButtonLink } from './button-link';

const defaults = contract.members.buttonLink.defaults;

describe('ButtonLink', () => {
  it('is an anchor wearing the action surface', () => {
    render(<ButtonLink href="/settings">Settings</ButtonLink>);
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(link.localName).toBe(contract.members.buttonLink.nativeElement);
    expect(link).toHaveAttribute('data-ui', contract.ui);
    expect(link).toHaveAttribute('data-part', 'root');
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).toHaveAttribute('data-tone', defaults.tone);
    expect(link).toHaveAttribute('data-variant', defaults.variant);
  });

  it('forwards native anchor attributes and events', () => {
    const onClick = vi.fn();
    render(
      <ButtonLink download href="/report.pdf" onClick={onClick} rel="noreferrer" target="_blank">
        Report
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Report' });

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('download');
  });

  /**
   * The destination is what makes an anchor navigate, and a middle click or a
   * modified click never reaches a `click` handler. Blocking the handler alone
   * would leave a disabled link that still opens in a new tab.
   */
  it('has no destination at all when it is disabled', () => {
    render(
      <ButtonLink disabled href="/settings">
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', '');
  });

  it('stays reachable by keyboard while it is disabled', () => {
    render(
      <ButtonLink disabled href="/settings">
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(link).toHaveAttribute('tabindex', '0');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('refuses every activation while it is disabled', () => {
    const onClick = vi.fn();
    const onAuxClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <ButtonLink
        disabled
        href="/settings"
        onAuxClick={onAuxClick}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    fireEvent.click(link);
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onAuxClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  /** Space does not activate a link, so the family does not make it. */
  it('leaves keys that are not the platform’s activation alone', () => {
    const onKeyDown = vi.fn();
    render(
      <ButtonLink disabled href="/settings" onKeyDown={onKeyDown}>
        Settings
      </ButtonLink>,
    );

    fireEvent.keyDown(screen.getByRole('link'), { key: ' ' });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('hands every root prop to a router’s own link', () => {
    const rendered = vi.fn();
    render(
      <ButtonLink
        render={(props) => {
          rendered(props);
          return <a {...props} data-router-link="true" href="/settings" />;
        }}
        variant="outline"
      >
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(link).toHaveAttribute('data-router-link', 'true');
    expect(link).toHaveAttribute('data-ui', contract.ui);
    expect(link).toHaveAttribute('data-variant', 'outline');
    expect(rendered.mock.calls[0]?.[0]['data-part']).toBe('root');
  });

  it('renders the content parts the contract names', () => {
    render(
      <ButtonLink end="E" href="/settings" start="S">
        Settings
      </ButtonLink>,
    );
    const parts = [...screen.getByRole('link').querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );

    expect(parts).toEqual(['start', 'label', 'end']);
  });

  it('never waits: navigation is the platform’s, not the family’s', () => {
    expect(contract.members.buttonLink.capabilities).not.toContain('loading');
    expect(contract.members.buttonLink.capabilities).not.toContain('pressed');
  });
});
