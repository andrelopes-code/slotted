import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

import { SlBadge } from './badge';
import type { BadgeShape, BadgeTone } from './badge';
import { SlBadgeAnchor } from './badge-anchor';
import type { BadgeOffset } from './badge-defaults';
import { SlBadgeEnd, SlBadgeStart } from './badge-content';
import { provideBadgeDefaults } from './badge-defaults';

@Component({
  imports: [SlBadge, SlBadgeAnchor, SlBadgeEnd, SlBadgeStart, SlVisuallyHidden],
  template: `
    <span slBadge id="plain" [tone]="tone()" [shape]="shape()">
      <span slBadgeStart id="start"></span>
      Draft
      <span slBadgeEnd id="end"></span>
    </span>

    <span slBadge id="counted" [count]="count()" [max]="max()" [showZero]="showZero()">
      <span slVisuallyHidden>unread messages</span>
    </span>

    <span slBadge id="localised" [count]="1234" [max]="false" locale="de-DE"></span>

    <span slBadge id="live" live="polite" [count]="4"></span>
    <span slBadge id="written-role" role="note" live="polite" [count]="4"></span>

    <span slBadgeAnchor id="anchor" [placement]="'bottom-start'" [overlap]="'circle'">
      <button type="button">Inbox</button>
      <span slBadge id="anchored" [count]="4"></span>
    </span>

    <span slBadgeAnchor id="nudged" [offset]="offset()">
      <button type="button">Inbox</button>
      <span slBadge id="nudged-badge" [count]="4"></span>
    </span>

    <a slBadge id="linked" href="#releases">v4.2.0</a>
  `,
})
class Host {
  readonly offset = signal<BadgeOffset | undefined>({ x: -2, y: 2 });
  readonly tone = signal<BadgeTone | undefined>(undefined);
  readonly shape = signal<BadgeShape | undefined>(undefined);
  readonly count = signal<number | undefined>(8);
  readonly max = signal<number | false | undefined>(undefined);
  readonly showZero = signal(false);
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return { fixture, host: fixture.componentInstance, byId };
}

describe('SlBadge', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { byId } = mount();

    expect(byId('plain').getAttribute('data-ui')).toBe('badge');
    expect(byId('plain').getAttribute('data-part')).toBe('root');
    expect(byId('start').getAttribute('data-part')).toBe('start');
    expect(byId('end').getAttribute('data-part')).toBe('end');
  });

  /**
   * A flex container centres the line box, not the letters inside it. The trim
   * that fixes that needs a block container, and a flex container's own text
   * lives in an anonymous item no stylesheet can reach — so the words get a box,
   * and the glyphs are projected as its siblings.
   */
  it('always gives the words a box of their own, glyph or no glyph', () => {
    const { byId } = mount();
    const label = byId('plain').querySelector('[data-part="label"]');

    expect(label).not.toBeNull();
    expect(label?.textContent).toContain('Draft');
    expect(label?.querySelector('[data-part="start"]')).toBeNull();
  });

  it('writes every axis a consumer may style on, and its defaults', () => {
    const { byId } = mount();
    const badge = byId('plain');

    expect(badge.getAttribute('data-tone')).toBe('secondary');
    expect(badge.getAttribute('data-variant')).toBe('soft');
    expect(badge.getAttribute('data-size')).toBe('md');
    expect(badge.getAttribute('data-shape')).toBe('pill');
  });

  /** The directive is written on the element the page chose. */
  it('takes whichever element the consumer wrote it on', () => {
    const { byId } = mount();

    expect(byId('plain').tagName).toBe('SPAN');
    expect(byId('linked').tagName).toBe('A');
    expect(byId('linked').getAttribute('href')).toBe('#releases');
    expect(byId('linked').getAttribute('data-ui')).toBe('badge');
  });

  it('adds no role until a page asks for one', () => {
    const { byId } = mount();

    expect(byId('plain').hasAttribute('role')).toBe(false);
    expect(byId('live').getAttribute('role')).toBe('status');
  });

  it('keeps a role the consumer wrote instead of inferring over it', () => {
    const { byId } = mount();

    expect(byId('written-role').getAttribute('role')).toBe('note');
  });

  describe('count', () => {
    it('writes the number, and marks the ceiling with a plus', () => {
      const { byId, fixture, host } = mount();
      expect(byId('counted').textContent).toContain('8');

      host.count.set(140);
      fixture.detectChanges();
      expect(byId('counted').textContent).toContain('99+');

      host.max.set(999);
      fixture.detectChanges();
      expect(byId('counted').textContent).toContain('140');
    });

    it('writes the digits the locale writes', () => {
      const { byId } = mount();

      expect(byId('localised').textContent).toContain('1.234');
    });

    /**
     * React returns nothing; a directive written on an element the consumer owns
     * cannot un-write it, so the same outcome arrives as `display: none` — no
     * box, no layout, and nothing in the accessibility tree.
     */
    it('takes the badge out of the page at nought unless nought is a value', () => {
      const { byId, fixture, host } = mount();

      host.count.set(0);
      fixture.detectChanges();
      expect(byId('counted').style.display).toBe('none');

      host.showZero.set(true);
      fixture.detectChanges();
      expect(byId('counted').style.display).toBe('');
      expect(byId('counted').textContent).toContain('0');
    });

    it('writes the value before the words the value does not say', () => {
      const { byId } = mount();

      expect(byId('counted').textContent?.replace(/\s+/g, ' ').trim()).toBe('8unread messages');
    });

    it('draws no value in a dot, and keeps the words beside it', () => {
      const { byId, fixture, host } = mount();
      host.shape.set('dot');
      fixture.detectChanges();

      expect(byId('plain').getAttribute('data-shape')).toBe('dot');
      expect(byId('plain').textContent).toContain('Draft');
    });
  });

  describe('defaults', () => {
    it('lets an application set them once for every badge under it', () => {
      const { byId } = mount([provideBadgeDefaults({ tone: 'accent', size: 'lg', max: 9 })]);

      expect(byId('plain').getAttribute('data-tone')).toBe('accent');
      expect(byId('plain').getAttribute('data-size')).toBe('lg');
      expect(byId('counted').textContent).toContain('8');
      expect(byId('localised').textContent).toContain('1.234');
    });

    it('lets an explicit input win over the token', () => {
      const { byId, fixture, host } = mount([provideBadgeDefaults({ tone: 'accent', max: 9 })]);
      host.tone.set('danger');
      host.max.set(false);
      host.count.set(40);
      fixture.detectChanges();

      expect(byId('plain').getAttribute('data-tone')).toBe('danger');
      expect(byId('counted').textContent).toContain('40');
    });
  });

  describe('the frame', () => {
    it('carries the family identifier itself, because it contains the root', () => {
      const { byId } = mount();

      expect(byId('anchor').getAttribute('data-ui')).toBe('badge');
      expect(byId('anchor').getAttribute('data-part')).toBe('anchor');
      expect(byId('anchor').getAttribute('data-placement')).toBe('bottom-start');
      expect(byId('anchor').getAttribute('data-overlap')).toBe('circle');
      expect(byId('anchor').contains(byId('anchored'))).toBe(true);
    });

    it('writes the correction of the corner as the two properties the sheet reads', () => {
      const { byId } = mount();

      expect(byId('nudged').style.getPropertyValue('--slotted-badge-anchor-offset-x')).toBe('-2px');
      expect(byId('nudged').style.getPropertyValue('--slotted-badge-anchor-offset-y')).toBe('2px');
    });

    /* An axis nobody stated is left to the sheet's own nought. */
    it('states only the axis it was given', () => {
      const { fixture, byId } = mount();

      fixture.componentInstance.offset.set({ y: 4 });
      fixture.detectChanges();

      expect(byId('nudged').style.getPropertyValue('--slotted-badge-anchor-offset-x')).toBe('');
      expect(byId('nudged').style.getPropertyValue('--slotted-badge-anchor-offset-y')).toBe('4px');
    });
  });
});
