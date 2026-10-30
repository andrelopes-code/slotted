import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlButtonGroup } from '@slotted/angular/button-group';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlIconButtonLink } from './icon-button-link';

const member = contract.members.iconButtonLink;

@Component({
  imports: [SlButtonGroup, SlIconButtonLink],
  template: `<div slButtonGroup aria-label="Records">
    <a
      slIconButtonLink
      aria-label="Next record"
      [href]="href()"
      [disabled]="disabled()"
      (click)="onClick($event)"
      ><svg></svg
    ></a>
  </div>`,
})
class TestHost {
  readonly href = signal<string | undefined>('/records/2');
  readonly disabled = signal(false);
  readonly onClick = vi.fn();
}

function mount() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  return { fixture, host: fixture.componentInstance, link };
}

describe('SlIconButtonLink', () => {
  it('is an anchor wearing the icon button surface, inside a button group', () => {
    const { fixture, link } = mount();

    expect(link.localName).toBe(member.nativeElement);
    expect(link.getAttribute('data-ui')).toBe(contract.ui);
    expect(link.getAttribute('href')).toBe('/records/2');
    expect(link.getAttribute('data-tone')).toBe(member.defaults.tone);
    expect(link.getAttribute('data-variant')).toBe(member.defaults.variant);
    expect(link.getAttribute('data-shape')).toBe(member.defaults.shape);
    expect(link.querySelector('[data-part="icon"]')).not.toBeNull();
    const group = (fixture.nativeElement as HTMLElement).querySelector('[data-ui="button-group"]');
    expect(group?.contains(link)).toBe(true);
  });

  it('keeps no href while disabled, and stays a reachable link that refuses activation', () => {
    const { fixture, host, link } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    link.click();
    expect(host.onClick).not.toHaveBeenCalled();
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('0');
  });
});
