import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentPropsWithRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { ButtonGroup } from '../button-group';
import { IconButtonLink } from './icon-button-link';

const member = contract.members.iconButtonLink;

/** A router's link component, typed as anchors are. */
function RouterLink({ to, ...props }: ComponentPropsWithRef<'a'> & { to: string }) {
  return <a {...props} data-router="" href={to} />;
}

describe('IconButtonLink', () => {
  it('is an anchor wearing the icon button surface', () => {
    render(
      <IconButtonLink aria-label="Next record" href="/records/2">
        <svg />
      </IconButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Next record' });

    expect(link.localName).toBe(member.nativeElement);
    expect(link).toHaveAttribute('data-ui', contract.ui);
    expect(link).toHaveAttribute('href', '/records/2');
    expect(link).toHaveAttribute('data-tone', member.defaults.tone);
    expect(link).toHaveAttribute('data-variant', member.defaults.variant);
    expect(link).toHaveAttribute('data-shape', member.defaults.shape);
    expect(link.querySelector('[data-part="icon"]')).not.toBeNull();
  });

  it('keeps no href while disabled, and stays a reachable link that refuses activation', () => {
    const onClick = vi.fn();
    render(
      <IconButtonLink aria-label="Next record" disabled href="/records/2" onClick={onClick}>
        <svg />
      </IconButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Next record' });

    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '0');
  });

  it('hands anchor props to a router link and composes inside a button group', () => {
    render(
      <ButtonGroup aria-label="Records">
        <IconButtonLink
          aria-label="Previous record"
          render={(props) => <RouterLink {...props} to="/records/1" />}
        >
          <svg />
        </IconButtonLink>
      </ButtonGroup>,
    );
    const group = document.querySelector('[data-ui="button-group"]') as HTMLElement;
    const link = screen.getByRole('link', { name: 'Previous record' });

    expect(group.contains(link)).toBe(true);
    expect(link).toHaveAttribute('href', '/records/1');
    expect(link).toHaveAttribute('data-router', '');
  });

  it('requires a name and a destination at the type level', () => {
    void (
      (
        // @ts-expect-error -- an icon carries no text, so a name is required.
        <IconButtonLink href="/records/2">
          <svg />
        </IconButtonLink>
      )
    );
    void (
      (
        // @ts-expect-error -- without render, the anchor needs its href.
        <IconButtonLink aria-label="Next record">
          <svg />
        </IconButtonLink>
      )
    );
  });
});
