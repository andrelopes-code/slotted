import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink, RouterLinkActive } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/link/contract.json';
import { SlLink } from './link';
import { WORD_JOINER } from './link.constants';
import { provideLinkDefaults } from './link-defaults';

const defaults = contract.members.link.defaults;

@Component({
  imports: [SlLink],
  template: `<a
    slLink
    [href]="href()"
    [disabled]="disabled()"
    [external]="external()"
    [underline]="underline()"
    [variant]="variant()"
    (click)="onClick($event)"
    (auxclick)="onAuxClick($event)"
    (keydown)="onKeydown($event)"
    >Invoices</a
  >`,
})
class TestHost {
  readonly href = signal<string | undefined>('/invoices');
  readonly disabled = signal(false);
  readonly external = signal(false);
  readonly underline = signal<'always' | 'hover' | 'none' | undefined>(undefined);
  readonly variant = signal<'accent' | 'neutral' | 'inverse' | undefined>(undefined);
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

describe('SlLink', () => {
  it('sits on the consumer anchor and carries the family identifier', () => {
    const { link } = mount();

    expect(link.tagName).toBe('A');
    expect(link.getAttribute('data-ui')).toBe('link');
    expect(link.getAttribute('data-part')).toBe('root');
    expect(link.getAttribute('href')).toBe('/invoices');
    expect(link.className).toBe('');
  });

  it('is underlined and painted with the accent unless told otherwise', () => {
    const { fixture, host, link } = mount();

    expect(link.getAttribute('data-underline')).toBe(defaults.underline);
    expect(link.getAttribute('data-variant')).toBe(defaults.variant);

    host.underline.set('none');
    host.variant.set('neutral');
    fixture.detectChanges();

    expect(link.getAttribute('data-underline')).toBe('none');
    expect(link.getAttribute('data-variant')).toBe('neutral');
  });

  describe('a new browsing context', () => {
    it('warns that the link leaves the page, and marks it for the eye as well', () => {
      const { fixture, host, link } = mount();
      host.external.set(true);
      fixture.detectChanges();

      expect(link.textContent).toContain('(opens in a new tab)');
      expect(link.querySelector('[data-part="external-icon"]')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(link.querySelector('[data-part="external-hint"]')?.getAttribute('data-ui')).toBe(
        'visually-hidden',
      );
      const box = link.querySelector('[data-part="external-icon"] > [data-ui="icon"]');
      expect(box?.hasAttribute('data-directional')).toBe(true);
      expect(box?.querySelector('svg[data-glyph="external"]')).not.toBeNull();
    });

    it('glues the marker to the last word with a word joiner', () => {
      const { fixture, host, link } = mount();
      host.external.set(true);
      fixture.detectChanges();

      expect(link.textContent).toContain(`Invoices${WORD_JOINER}`);
    });

    it('opens the destination in a new tab without leaking the opener', () => {
      const { fixture, host, link } = mount();
      host.external.set(true);
      fixture.detectChanges();

      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('takes back only what it added', () => {
      const { fixture, host, link } = mount();
      host.external.set(true);
      fixture.detectChanges();
      host.external.set(false);
      fixture.detectChanges();

      expect(link.hasAttribute('target')).toBe(false);
      expect(link.hasAttribute('rel')).toBe(false);
    });

    it('says nothing extra when the link stays in the page', () => {
      const { link } = mount();

      expect(link.textContent?.trim()).toBe('Invoices');
      expect(link.hasAttribute('target')).toBe(false);
    });
  });

  /**
   * The static attribute the consumer wrote has to survive the component that
   * was placed on top of it, and it is also how the family learns a fact
   * `external` was never given: an anchor already pointed at a new tab owes
   * the reader the same warning.
   */
  /** A link states its own text size; unset, it takes the one its action slot states. */
  describe('size', () => {
    @Component({
      imports: [SlLink],
      template: `<a slLink href="#a" size="sm">Details</a><a slLink href="#b">More</a>`,
    })
    class Sized {}

    it('writes the size it states, and none when unset', () => {
      const fixture = TestBed.createComponent(Sized);
      fixture.detectChanges();
      const [sized, plain] = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLElement>;
      expect(sized?.getAttribute('data-size')).toBe('sm');
      expect(plain?.hasAttribute('data-size')).toBe(false);
    });
  });

  describe('attributes the consumer wrote', () => {
    @Component({
      imports: [SlLink],
      template: `<a slLink href="https://example.com" rel="nofollow" target="_blank">Terms</a>`,
    })
    class OwnAttributes {}

    it('keeps them, and warns about the new tab it was never told about', () => {
      const fixture = TestBed.createComponent(OwnAttributes);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('nofollow');
      expect(link.textContent).toContain('(opens in a new tab)');
    });
  });

  describe('disabled', () => {
    it('takes the destination away and keeps the role, the state and the focus', () => {
      const { fixture, host, link } = mount();
      host.disabled.set(true);
      fixture.detectChanges();

      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getAttribute('role')).toBe('link');
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBe('0');
      expect(link.hasAttribute('data-disabled')).toBe(true);
    });

    it('gives the destination back when the link becomes available again', () => {
      const { fixture, host, link } = mount();
      host.disabled.set(true);
      fixture.detectChanges();
      host.disabled.set(false);
      fixture.detectChanges();

      expect(link.getAttribute('href')).toBe('/invoices');
    });

    it('refuses the pointer, the middle click and Enter, and the consumer handler with them', () => {
      const { fixture, host, link } = mount();
      host.disabled.set(true);
      fixture.detectChanges();

      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      link.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(host.onClick).not.toHaveBeenCalled();
      expect(host.onAuxClick).not.toHaveBeenCalled();
      expect(host.onKeydown).not.toHaveBeenCalled();
    });

    it('leaves every other key alone, so a shortcut still reaches the page', () => {
      const { fixture, host, link } = mount();
      host.disabled.set(true);
      fixture.detectChanges();

      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(host.onKeydown).toHaveBeenCalledTimes(1);
    });
  });

  it('runs the consumer handler when the link is available', () => {
    const { host, link } = mount();

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(host.onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * The reason the family is a directive on the consumer's anchor rather than
   * a component that renders one. `routerLink` writes the `href`, and
   * `routerLinkActive` writes the `aria-current` the stylesheet paints — the
   * family declares neither, and would fight both if it did.
   */
  describe('the router on the same element', () => {
    @Component({
      imports: [RouterLink, RouterLinkActive, SlLink],
      template: `<a slLink routerLink="/invoices" routerLinkActive ariaCurrentWhenActive="page"
        >Invoices</a
      >`,
    })
    class RouterHost {}

    it('leaves the destination the router wrote', async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter([{ path: 'invoices', children: [] }])],
      });
      const fixture = TestBed.createComponent(RouterHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

      expect(link.getAttribute('href')).toBe('/invoices');
      expect(link.getAttribute('data-ui')).toBe('link');
    });
  });

  describe('application defaults', () => {
    @Component({
      imports: [SlLink],
      template: `<a slLink external href="https://example.com">Documentación</a>`,
    })
    class DefaultedHost {}

    @Component({
      imports: [SlLink],
      template: `<a slLink underline="always" variant="accent" href="/a">Explicit</a>`,
    })
    class ExplicitHost {}

    it('paints every link the way the application decided once', () => {
      TestBed.configureTestingModule({
        providers: [
          provideLinkDefaults({
            underline: 'hover',
            variant: 'neutral',
            visited: true,
          }),
        ],
      });
      const fixture = TestBed.createComponent(DefaultedHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

      expect(link.getAttribute('data-underline')).toBe('hover');
      expect(link.getAttribute('data-variant')).toBe('neutral');
      expect(link.hasAttribute('data-visited')).toBe(true);
    });

    it('speaks the language in force, and follows a change of it in place', () => {
      const locale = signal('pt-BR');
      TestBed.configureTestingModule({
        providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
      });
      const fixture = TestBed.createComponent(DefaultedHost);
      fixture.detectChanges();
      const hint = () =>
        (fixture.nativeElement as HTMLElement).querySelector('[data-part="external-hint"]')
          ?.textContent;

      // language: pt-BR
      expect(hint()).toContain('(abre em uma nova aba)');
      // language: en-US

      locale.set('en-US');
      fixture.detectChanges();
      expect(hint()).toContain('(opens in a new tab)');
    });

    it('lets the link overrule what the application decided', () => {
      TestBed.configureTestingModule({
        providers: [provideLinkDefaults({ underline: 'hover', variant: 'neutral' })],
      });
      const fixture = TestBed.createComponent(ExplicitHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

      expect(link.getAttribute('data-underline')).toBe('always');
      expect(link.getAttribute('data-variant')).toBe('accent');
    });
  });
});
