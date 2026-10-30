import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/prose/contract.json';
import { SlProse } from './prose';
import type { ProseFlow, ProseSize } from './prose';
import { provideProseDefaults } from './prose-defaults';
import { SlProseAnchor, SlProseExclude, SlProseFootnotes, SlProseLead } from './prose-parts';
import { SlProseScroll } from './prose-scroll';

const defaults = contract.members.prose.defaults;

@Component({
  imports: [SlProse, SlProseAnchor, SlProseExclude, SlProseFootnotes, SlProseLead, SlProseScroll],
  template: `
    <article slProse id="root" lang="pt-BR" aria-label="Guia">
      <p slProseLead id="lead">The opening.</p>
      <h2 id="heading">A title<a slProseAnchor id="anchor" href="#a-title">#</a></h2>
      <div slProseScroll id="scroll" #wide="slProseScroll">
        <table>
          <caption id="caption">
            Environments
          </caption>
        </table>
      </div>
      <div slProseExclude id="exclude"></div>
      <section slProseFootnotes id="footnotes"></section>
    </article>

    <div slProse id="stated" [size]="size()" [flow]="flow()"></div>
    <div slProseScroll id="named" [labelledBy]="labelledBy()" [messages]="messages()"></div>
  `,
})
class Host {
  readonly size = signal<ProseSize | undefined>(undefined);
  readonly flow = signal<ProseFlow | undefined>(undefined);
  readonly messages = signal<{ scroll?: string } | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
}

/**
 * `jsdom` lays nothing out: every element measures zero, so a scroller is
 * never overflowing there and the family would be untestable at exactly the
 * point where it does something. Sizing the two properties the module reads is
 * what makes the decision observable.
 */
function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return { byId, fixture };
}

describe('SlProse', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { byId } = mount();

    expect(byId('root').getAttribute('data-ui')).toBe('prose');
    expect(byId('root').getAttribute('data-part')).toBe('root');
    for (const part of ['lead', 'anchor', 'scroll', 'exclude', 'footnotes']) {
      expect(byId(part).getAttribute('data-part')).toBe(part);
    }
  });

  it('writes the contract defaults when the consumer states nothing', () => {
    const { byId } = mount();

    expect(byId('stated').getAttribute('data-size')).toBe(defaults.size);
    expect(byId('stated').getAttribute('data-flow')).toBe(defaults.flow);
  });

  it('keeps the element and the attributes the page wrote', () => {
    const { byId } = mount();

    expect(byId('root').tagName).toBe('ARTICLE');
    expect(byId('root').getAttribute('lang')).toBe('pt-BR');
    expect(byId('root').getAttribute('aria-label')).toBe('Guia');
    expect(byId('root').getAttribute('role')).toBeNull();
  });

  it('lets an explicit input win over the application default', () => {
    TestBed.configureTestingModule({
      providers: [provideProseDefaults({ flow: 'tight', size: 'md' })],
    });
    const { byId, fixture } = mount();

    expect(byId('root').getAttribute('data-size')).toBe('md');
    expect(byId('stated').getAttribute('data-flow')).toBe('tight');

    fixture.componentInstance.size.set('xl');
    fixture.detectChanges();

    expect(byId('stated').getAttribute('data-size')).toBe('xl');
    expect(byId('stated').getAttribute('data-flow')).toBe('tight');
  });

  /**
   * A word joiner — U+2060 — forbids a break without occupying anything, so
   * the last word of a title and its permalink wrap together. Without it an
   * anchor that is invisible at rest wraps to a line of its own and opens an
   * empty line under every heading.
   */
  it('writes a word joiner before the permalink', () => {
    const { byId } = mount();

    expect(byId('heading').textContent).toContain('\u2060');
    expect(byId('anchor').previousSibling?.textContent?.endsWith('\u2060')).toBe(true);
  });
});

describe('SlProseScroll', () => {
  it('takes no role and no tab stop while the block fits', () => {
    const { byId } = mount();

    expect(byId('scroll').getAttribute('role')).toBeNull();
    expect(byId('scroll').getAttribute('tabindex')).toBeNull();
    expect(byId('scroll').getAttribute('aria-label')).toBeNull();
  });

  /**
   * Anything that takes focus needs a name and a role, or it fails SC 4.1.2.
   * A block that fits needs neither, which is why the wiring is a measurement
   * rather than an input.
   */
  it('becomes a named region with a tab stop once the block overflows', () => {
    const { byId, fixture } = mount();
    const scroll = byId('scroll');
    const directive = fixture.debugElement
      .query((node) => node.nativeElement === scroll)
      .injector.get(SlProseScroll);

    measure(scroll, { client: 320, scroll: 900 });
    directive.refresh();
    fixture.detectChanges();

    expect(scroll.getAttribute('role')).toBe('region');
    expect(scroll.getAttribute('tabindex')).toBe('0');
    expect(scroll.getAttribute('aria-label')).toBe('Scrollable content');
    expect(directive.isOverflowing()).toBe(true);
  });

  it('prefers the caption the consumer named over every default', () => {
    const { byId, fixture } = mount();
    const named = byId('named');
    const directive = fixture.debugElement
      .queryAll(By.directive(SlProseScroll))
      .map((node) => node.injector.get(SlProseScroll))[1]!;

    fixture.componentInstance.messages.set({ scroll: 'ignored' });
    fixture.componentInstance.labelledBy.set('caption');
    measure(named, { client: 320, scroll: 900 });
    directive.refresh();
    fixture.detectChanges();

    expect(named.getAttribute('aria-labelledby')).toBe('caption');
    expect(named.getAttribute('aria-label')).toBeNull();
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { byId, fixture } = mount();
    const scroll = byId('scroll');
    const directive = fixture.debugElement
      .query((node) => node.nativeElement === scroll)
      .injector.get(SlProseScroll);

    measure(scroll, { client: 320, scroll: 900 });
    directive.refresh();
    fixture.detectChanges();
    // language: pt-BR
    expect(scroll.getAttribute('aria-label')).toBe('Conteúdo rolável');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(scroll.getAttribute('aria-label')).toBe('Scrollable content');
  });
});
