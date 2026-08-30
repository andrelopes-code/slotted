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
        render={(rootProps) => <a href="/router" {...rootProps} data-router-link="true" />}
      >
        Router settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Router settings' });
    expect(link).toHaveAttribute('data-router-link', 'true');
    expect(link).toHaveAttribute('data-variant', 'accent');
    expect(link).toHaveAttribute('data-fill', 'solid');
    expect(link).toHaveAttribute('href', '/router');
    expect(ref.current).toBe(link);
  });

  it('blocks disabled activation in capture before consumer capture and bubble handlers', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    const onAuxClick = vi.fn();
    const onAuxClickCapture = vi.fn();
    const onKeyDown = vi.fn();
    const onKeyDownCapture = vi.fn();
    render(
      <ButtonLink
        disabled
        href="#settings"
        onAuxClick={onAuxClick}
        onAuxClickCapture={onAuxClickCapture}
        onClick={onClick}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onKeyDownCapture={onKeyDownCapture}
      >
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(fireEvent.click(link)).toBe(false);
    expect(fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true }))).toBe(
      false,
    );
    expect(fireEvent.keyDown(link, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(link, { key: ' ' })).toBe(false);
    expect(onClickCapture).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(onAuxClickCapture).not.toHaveBeenCalled();
    expect(onAuxClick).not.toHaveBeenCalled();
    expect(onKeyDownCapture).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('composes non-activation keyboard and enabled handlers', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    const onAuxClick = vi.fn();
    const onAuxClickCapture = vi.fn();
    const onKeyDown = vi.fn();
    const onKeyDownCapture = vi.fn();
    const { rerender } = render(
      <ButtonLink
        disabled
        href="#settings"
        onAuxClick={onAuxClick}
        onAuxClickCapture={onAuxClickCapture}
        onClick={onClick}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onKeyDownCapture={onKeyDownCapture}
      >
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(fireEvent.keyDown(link, { key: 'ArrowDown' })).toBe(true);
    expect(onKeyDownCapture).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();

    rerender(
      <ButtonLink
        href="#settings"
        onAuxClick={onAuxClick}
        onAuxClickCapture={onAuxClickCapture}
        onClick={onClick}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onKeyDownCapture={onKeyDownCapture}
      >
        Settings
      </ButtonLink>,
    );

    fireEvent.click(link);
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(onClickCapture).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onAuxClickCapture).toHaveBeenCalledOnce();
    expect(onAuxClick).toHaveBeenCalledOnce();
    expect(onKeyDownCapture).toHaveBeenCalledTimes(2);
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it.each([true, 'true'] as const)(
    'blocks aria-disabled=%s activation without changing visual or focus state',
    (ariaDisabled) => {
      const onClick = vi.fn();
      const onClickCapture = vi.fn();
      render(
        <ButtonLink
          aria-disabled={ariaDisabled}
          href="#settings"
          onClick={onClick}
          onClickCapture={onClickCapture}
        >
          Settings
        </ButtonLink>,
      );
      const link = screen.getByRole('link', { name: 'Settings' });
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).not.toHaveAttribute('data-state', 'disabled');
      expect(link).not.toHaveAttribute('tabindex');
      expect(fireEvent.click(link)).toBe(false);
      expect(onClickCapture).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  it('preserves an explicit tab index with raw aria-disabled', () => {
    render(
      <ButtonLink aria-disabled="true" href="#settings" tabIndex={0}>
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveAttribute('tabindex', '0');
    expect(link).not.toHaveAttribute('data-state', 'disabled');
  });

  it.each([false, 'false', undefined] as const)(
    'keeps aria-disabled=%s interactive',
    (ariaDisabled) => {
      const onClick = vi.fn();
      render(
        <ButtonLink aria-disabled={ariaDisabled} href="#settings" onClick={onClick}>
          Settings
        </ButtonLink>,
      );
      const link = screen.getByRole('link', { name: 'Settings' });
      fireEvent.click(link);
      expect(onClick).toHaveBeenCalledOnce();
      expect(link).not.toHaveAttribute('data-state', 'disabled');
    },
  );
});
