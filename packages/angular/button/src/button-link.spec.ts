import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlButtonEnd, SlButtonStart } from './button-appearance';
import { SlButtonLink } from './button-link';

const defaults = contract.members.buttonLink.defaults;

@Component({
  imports: [SlButtonEnd, SlButtonLink, SlButtonStart],
  template: `<a
    slButtonLink
    [href]="href()"
    [disabled]="disabled()"
    (click)="onClick($event)"
    (auxclick)="onAuxClick($event)"
    (keydown)="onKeydown($event)"
  >
    @if (withIcons()) {
      <span slButtonStart>S</span>
    }
    Open settings
    @if (withIcons()) {
      <span slButtonEnd>E</span>
    }
  </a>`,
})
class TestHost {
  readonly href = signal<string | undefined>('/settings');
  readonly disabled = signal(false);
  readonly withIcons = signal(false);
  readonly onClick = vi.fn();
  readonly onAuxClick = vi.fn();
  readonly onKeydown = vi.fn();
}

function mount() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  return { fixture, host: fixture.componentInstance, link };
}

describe('SlButtonLink', () => {
  it('is an anchor wearing the action surface', () => {
    const { link } = mount();

    expect(link.localName).toBe(contract.members.buttonLink.nativeElement);
    expect(link.getAttribute('data-ui')).toBe(contract.ui);
    expect(link.getAttribute('data-part')).toBe('root');
    expect(link.getAttribute('href')).toBe('/settings');
    expect(link.getAttribute('data-tone')).toBe(defaults.tone);
    expect(link.getAttribute('data-variant')).toBe(defaults.variant);
  });

  it('leaves the href to whatever writes it when the consumer sets none', () => {
    const { fixture, host, link } = mount();
    host.href.set(undefined);
    fixture.detectChanges();

    expect(link.hasAttribute('href')).toBe(false);
  });

  /**
   * A middle click and a modified click never reach a `click` handler, so an
   * anchor that keeps its destination is not disabled by blocking one.
   */
  it('has no destination at all when it is disabled', () => {
    const { fixture, host, link } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('data-disabled')).toBe('');
  });

  it('stays reachable by keyboard while it is disabled', () => {
    const { fixture, host, link } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    expect(link.getAttribute('tabindex')).toBe('0');
  });

  it('refuses every activation while it is disabled', () => {
    const { fixture, host, link } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
    link.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    );

    expect(host.onClick).not.toHaveBeenCalled();
    expect(host.onAuxClick).not.toHaveBeenCalled();
    expect(host.onKeydown).not.toHaveBeenCalled();
  });

  /** Space does not activate a link, so the family does not make it. */
  it('leaves keys that are not the platform’s activation alone', () => {
    const { fixture, host, link } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    link.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' }));
    expect(host.onKeydown).toHaveBeenCalledOnce();
  });

  it('takes no tabindex of its own while it is operable', () => {
    const { link } = mount();
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('renders the content parts the contract names', () => {
    const { fixture, host, link } = mount();
    host.withIcons.set(true);
    fixture.detectChanges();

    expect(
      [...link.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(['start', 'label', 'end']);
  });
});
