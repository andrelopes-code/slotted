import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('renders a native anchor and forwards anchor props and ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <ButtonLink ref={ref} href="/settings" target="_blank">
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.localName).toBe(contract.members.buttonLink.nativeElement);
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).toHaveAttribute('target', '_blank');
    expect(ref.current).toBe(link);
  });

  it('suppresses disabled navigation before consumer handlers', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <ButtonLink disabled href="/settings" onClick={onClick} onKeyDown={onKeyDown}>
        Settings
      </ButtonLink>,
    );
    const link = screen.getByText('Settings').closest('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    fireEvent.click(link!);
    fireEvent.keyDown(link!, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('honors an explicit disabled tab index', () => {
    render(
      <ButtonLink disabled href="/settings" tabIndex={0}>
        Settings
      </ButtonLink>,
    );
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('tabindex', '0');
  });

  it('passes complete root props to a router-owned link', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <ButtonLink
        ref={ref}
        render={(rootProps) => <a {...rootProps} data-router-link="true" href="/router" />}
      >
        Router settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Router settings' });
    expect(link).toHaveAttribute('data-router-link', 'true');
    expect(link).toHaveAttribute('data-variant', 'solid');
    expect(ref.current).toBe(link);
  });
});
