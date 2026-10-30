import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlIcon } from './icon';
import type { IconSize, IconTone } from './icon.types';

const GLYPH = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>';

@Component({
  imports: [SlIcon],
  template: `
    <span slIcon id="plain">${GLYPH}</span>
    <span
      slIcon
      id="decided"
      [size]="size()"
      [tone]="tone()"
      [directional]="directional()"
      [label]="label()"
      >${GLYPH}</span
    >
    <span slIcon id="written-label" aria-label="Export ready">${GLYPH}</span>
    <span slIcon id="written-labelledby" aria-labelledby="caption">${GLYPH}</span>
    <span slIcon id="written-role" role="status" label="Loading">${GLYPH}</span>
    <span slIcon id="native" title="Paid" data-testid="glyph-box">${GLYPH}</span>
  `,
})
class IconHost {
  readonly directional = signal(false);
  readonly label = signal<string | undefined>(undefined);
  readonly size = signal<IconSize | undefined>(undefined);
  readonly tone = signal<IconTone>('inherit');
}

function host() {
  const fixture = TestBed.createComponent(IconHost);
  fixture.detectChanges();
  const element = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, element };
}

describe('SlIcon', () => {
  it('carries the family identity on the element the consumer wrote', () => {
    const { element } = host();

    const plain = element('plain');
    expect(plain.tagName).toBe('SPAN');
    expect(plain.getAttribute('data-ui')).toBe('icon');
    expect(plain.getAttribute('data-part')).toBe('root');
    expect(plain.querySelector('svg')).not.toBeNull();
  });

  it('writes no axis the consumer did not decide, so the base rule paints the default', () => {
    const { element } = host();

    const plain = element('plain');
    expect(plain.hasAttribute('data-size')).toBe(false);
    expect(plain.hasAttribute('data-tone')).toBe(false);
    expect(plain.hasAttribute('data-directional')).toBe(false);
  });

  it('states each axis the consumer decided', () => {
    const { fixture, element } = host();
    const instance = fixture.componentInstance;

    instance.size.set('lg');
    instance.tone.set('danger');
    instance.directional.set(true);
    fixture.detectChanges();

    const decided = element('decided');
    expect(decided.getAttribute('data-size')).toBe('lg');
    expect(decided.getAttribute('data-tone')).toBe('danger');
    expect(decided.getAttribute('data-directional')).toBe('');
  });

  it('treats an inherited tone as the absence of a colour', () => {
    const { element } = host();

    expect(element('decided').hasAttribute('data-tone')).toBe(false);
  });

  it('leaves an unnamed icon out of the accessibility tree', () => {
    const { element } = host();

    const plain = element('plain');
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    expect(plain.hasAttribute('role')).toBe(false);
  });

  it('gives a named icon the role that requires a name', () => {
    const { fixture, element } = host();

    fixture.componentInstance.label.set('Payment failed');
    fixture.detectChanges();

    const decided = element('decided');
    expect(decided.getAttribute('role')).toBe('img');
    expect(decided.getAttribute('aria-label')).toBe('Payment failed');
    expect(decided.hasAttribute('aria-hidden')).toBe(false);
  });

  it('keeps a name the consumer wrote as aria-label rather than deleting it', () => {
    const { element } = host();

    const written = element('written-label');
    expect(written.getAttribute('aria-label')).toBe('Export ready');
    expect(written.getAttribute('role')).toBe('img');
    expect(written.hasAttribute('aria-hidden')).toBe(false);
  });

  it('reads a name the consumer wrote as aria-labelledby, and never rewrites it', () => {
    const { element } = host();

    const written = element('written-labelledby');
    expect(written.getAttribute('aria-labelledby')).toBe('caption');
    expect(written.getAttribute('role')).toBe('img');
    expect(written.hasAttribute('aria-hidden')).toBe(false);
  });

  it('keeps a role the consumer chose over the one it would have written', () => {
    const { element } = host();

    expect(element('written-role').getAttribute('role')).toBe('status');
  });

  it('leaves native attributes on the element that owns them', () => {
    const { element } = host();

    const native = element('native');
    expect(native.getAttribute('title')).toBe('Paid');
    expect(native.getAttribute('data-testid')).toBe('glyph-box');
  });
});
