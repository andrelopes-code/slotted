import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlCard } from './card';
import { SlCardBody } from './card-body';
import { SlCardFooter } from './card-footer';
import { SlCardHeader } from './card-header';

@Component({
  imports: [SlCard, SlCardBody, SlCardFooter, SlCardHeader],
  template: `
    <article slCard id="card" aria-labelledby="card-title">
      <div slCardHeader><h3 id="card-title">Invoice</h3></div>
      <div slCardBody>Due in thirty days</div>
      <div slCardFooter>Pay now</div>
    </article>
    <div slCard id="body-only"><div slCardBody>Just a body</div></div>
  `,
})
class Host {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    bodyOnly: () => element.querySelector<HTMLElement>('#body-only')!,
    card: () => element.querySelector<HTMLElement>('#card')!,
    part: (name: string) => element.querySelector<HTMLElement>(`#card [data-part="${name}"]`)!,
  };
}

describe('SlCard', () => {
  it('names each region so the stylesheet can space them', () => {
    const { card, part } = mount();

    expect(card().getAttribute('data-part')).toBe('root');
    for (const name of ['header', 'body', 'footer']) {
      expect(part(name).getAttribute('data-part')).toBe(name);
    }
  });

  it('adds no role, because what a card is depends on the page', () => {
    const { card, part } = mount();

    for (const element of [card(), part('header'), part('body'), part('footer')]) {
      expect(element.hasAttribute('role')).toBe(false);
    }
  });

  it('sits on whichever element the page needs', () => {
    const { card } = mount();

    expect(card().tagName).toBe('ARTICLE');
    expect(card().classList.contains('slotted-card')).toBe(true);
  });

  it('holds a body on its own, with no header and no footer', () => {
    const { bodyOnly } = mount();

    expect(bodyOnly().children).toHaveLength(1);
    expect(bodyOnly().textContent?.trim()).toBe('Just a body');
  });
});
