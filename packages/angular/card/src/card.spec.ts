import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlCard } from './card';
import type { CardFill, CardOrientation, CardSize } from './card';
import { provideCardDefaults } from './card-defaults';
import { SlCardActions } from './card-actions';
import { SlCardLink } from './card-link';
import { SlCardBody } from './card-body';
import { SlCardFooter } from './card-footer';
import { SlCardHeader } from './card-header';
import { SlCardMedia } from './card-media';

@Component({
  imports: [SlCard, SlCardActions, SlCardBody, SlCardFooter, SlCardHeader, SlCardLink, SlCardMedia],
  template: `
    <article
      slCard
      id="card"
      aria-labelledby="card-title"
      [orientation]="orientation()"
      [selected]="selected()"
      [disabled]="disabled()"
    >
      <figure slCardMedia><img alt="" src="invoice.png" /></figure>
      <div slCardHeader><h3 id="card-title">Invoice</h3></div>
      <div slCardBody>Due in thirty days</div>
      <footer slCardFooter>Pay now</footer>
    </article>

    <div slCard id="body-only"><div slCardBody>Just a body</div></div>

    <div slCard id="linked">
      <div slCardHeader>
        <a slCardLink id="action" href="/accounts/northwind">Northwind Traders</a>
        <span slCardActions id="corner"><button type="button">Menu</button></span>
      </div>
      <div slCardBody>Twelve open invoices</div>
      <div slCardFooter>
        <a id="secondary" href="/accounts/northwind/settings">Billing settings</a>
      </div>
    </div>

    <div slCard id="dressed" [fill]="fill()" [size]="size()"></div>
  `,
})
class Host {
  readonly orientation = signal<CardOrientation | undefined>(undefined);
  readonly fill = signal<CardFill | undefined>(undefined);
  readonly size = signal<CardSize | undefined>(undefined);
  readonly selected = signal(false);
  readonly disabled = signal(false);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return {
    action: () => byId('action'),
    bodyOnly: () => byId('body-only'),
    card: () => byId('card'),
    corner: () => byId('corner'),
    dressed: () => byId('dressed'),
    fixture,
    host: fixture.componentInstance,
    part: (name: string) => element.querySelector<HTMLElement>(`#card [data-part="${name}"]`)!,
    secondary: () => byId('secondary'),
  };
}

describe('SlCard', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { card, part } = mount();

    expect(card().getAttribute('data-ui')).toBe('card');
    expect(card().getAttribute('data-part')).toBe('root');
    for (const name of ['media', 'header', 'body', 'footer']) {
      expect(part(name).getAttribute('data-part')).toBe(name);
    }
  });

  it('adds no role, because what a card is depends on the page', () => {
    const { card, part } = mount();

    for (const element of [card(), part('media'), part('header'), part('body'), part('footer')]) {
      expect(element.hasAttribute('role')).toBe(false);
    }
  });

  it('sits on whichever element the page needs, and keeps its meaning', () => {
    const { card, part } = mount();

    expect(card().tagName).toBe('ARTICLE');
    expect(part('media').tagName).toBe('FIGURE');
    expect(part('footer').tagName).toBe('FOOTER');
  });

  it('runs as a column until it is asked to run across', () => {
    const { card, fixture, host } = mount();

    expect(card().getAttribute('data-orientation')).toBe('vertical');

    host.orientation.set('horizontal');
    fixture.detectChanges();

    expect(card().getAttribute('data-orientation')).toBe('horizontal');
  });

  it('is outlined at the middle inset until it is told otherwise', () => {
    const { dressed } = mount();

    expect(dressed().getAttribute('data-fill')).toBe('outline');
    expect(dressed().getAttribute('data-size')).toBe('md');
  });

  it('takes the fill and the inset the page asks for', () => {
    const { dressed, fixture, host } = mount();

    host.fill.set('elevated');
    host.size.set('lg');
    fixture.detectChanges();

    expect(dressed().getAttribute('data-fill')).toBe('elevated');
    expect(dressed().getAttribute('data-size')).toBe('lg');
  });

  it('holds a body on its own, with no header and no footer', () => {
    const { bodyOnly } = mount();

    expect(bodyOnly().children).toHaveLength(1);
    expect(bodyOnly().textContent?.trim()).toBe('Just a body');
  });

  it('keeps the accessible name the page gave the element', () => {
    const { card } = mount();

    expect(card().getAttribute('aria-labelledby')).toBe('card-title');
  });
});

describe('SlCard state', () => {
  it('writes nothing while it mirrors nothing', () => {
    const { card } = mount();

    expect(card().hasAttribute('data-selected')).toBe(false);
    expect(card().hasAttribute('data-disabled')).toBe(false);
  });

  it('mirrors a selection the page owns without announcing it', () => {
    const { card, fixture, host } = mount();

    host.selected.set(true);
    fixture.detectChanges();

    expect(card().getAttribute('data-selected')).toBe('');
    expect(card().hasAttribute('aria-selected')).toBe(false);
  });

  it('mirrors a disabled control without disabling anything itself', () => {
    const { card, fixture, host } = mount();

    host.disabled.set(true);
    fixture.detectChanges();

    expect(card().getAttribute('data-disabled')).toBe('');
    expect(card().hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('SlCardAction', () => {
  it('stays the element the page wrote it on, and keeps the platform behaviour', () => {
    const { action } = mount();

    expect(action().tagName).toBe('A');
    expect(action().getAttribute('href')).toBe('/accounts/northwind');
    expect(action().getAttribute('data-part')).toBe('link');
  });

  it('leaves a secondary action in the footer a control of its own', () => {
    const { secondary } = mount();

    expect(secondary().hasAttribute('data-part')).toBe(false);
    expect(secondary().getAttribute('href')).toBe('/accounts/northwind/settings');
  });

  it('leaves the header corner a region of its own, above the hit area', () => {
    const { corner } = mount();

    expect(corner().getAttribute('data-part')).toBe('actions');
    expect(corner().querySelector('button')).not.toBeNull();
  });
});

describe('Card defaults', () => {
  it('lets an application decide once for every card under it', () => {
    TestBed.configureTestingModule({
      providers: [provideCardDefaults({ fill: 'subtle', size: 'sm' })],
    });

    const { dressed } = mount();

    expect(dressed().getAttribute('data-fill')).toBe('subtle');
    expect(dressed().getAttribute('data-size')).toBe('sm');
  });

  /** The consumer's explicit input always wins over the injected default. */
  it('keeps a value the card states over the one it inherits', () => {
    TestBed.configureTestingModule({
      providers: [provideCardDefaults({ fill: 'subtle', size: 'sm' })],
    });

    const { dressed, fixture, host } = mount();
    host.size.set('lg');
    fixture.detectChanges();

    expect(dressed().getAttribute('data-fill')).toBe('subtle');
    expect(dressed().getAttribute('data-size')).toBe('lg');
  });
});
