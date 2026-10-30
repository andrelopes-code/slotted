import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { dataGridMessages, paginationMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import { injectLocale, injectMessages, provideSlotted } from './i18n';

let constructed = 0;

@Component({
  selector: 'sl-test-rows',
  template: `<span data-rows>{{ t('groupCount', { count: count() }) }}</span>`,
})
class Rows {
  readonly count = input(2);
  protected readonly t = injectMessages(dataGridMessages);

  constructor() {
    constructed++;
  }
}

@Component({
  selector: 'sl-test-pt-subtree',
  imports: [Rows],
  providers: [provideSlotted({ locale: 'pt-BR' })],
  template: `<sl-test-rows [count]="3" />`,
})
class PortugueseSubtree {}

@Component({
  selector: 'sl-test-label',
  template: `<span data-label>{{ t('label') }}</span
    ><span data-locale>{{ locale() }}</span>`,
})
class Label {
  readonly messages = input<{ label?: string } | undefined>(undefined);
  protected readonly t = injectMessages(paginationMessages, this.messages);
  protected readonly locale = injectLocale();
}

function text(fixture: { nativeElement: HTMLElement }, selector: string): string {
  return fixture.nativeElement.querySelector(selector)?.textContent?.trim() ?? '';
}

describe('provideSlotted', () => {
  it('writes English with no provider at all', () => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(Label);
    fixture.detectChanges();
    expect(text(fixture, '[data-label]')).toBe('Pagination');
    expect(text(fixture, '[data-locale]')).toBe('en-US');
  });

  it('changes language when the locale signal changes, without recreating the component', async () => {
    const locale = signal('en-US');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    constructed = 0;
    const fixture = TestBed.createComponent(Rows);
    fixture.detectChanges();
    expect(text(fixture, '[data-rows]')).toBe('2 rows');

    locale.set('pt-BR');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(text(fixture, '[data-rows]')).toBe('2 linhas');
    expect(constructed).toBe(1);
  });

  /** A locale imported on demand reaches the provider after bootstrap (D9). */
  it('takes a catalog that arrives after bootstrap, through a signal', async () => {
    const catalogs = signal({});
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs })],
    });
    const fixture = TestBed.createComponent(Rows);
    fixture.detectChanges();
    expect(text(fixture, '[data-rows]')).toBe('2 rows');

    catalogs.set({ 'pt-BR': PT_BR });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(text(fixture, '[data-rows]')).toBe('2 linhas');
  });

  it('gives a component subtree its own locale, keeping the catalogs around it', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale: 'en-US', catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(PortugueseSubtree);
    fixture.detectChanges();
    expect(text(fixture, '[data-rows]')).toBe('3 linhas');
  });

  it('lays an instance input over the catalog', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(Label);
    fixture.detectChanges();
    // language: pt-BR
    expect(text(fixture, '[data-label]')).toBe('Paginação');
    // language: en-US
    fixture.componentRef.setInput('messages', { label: 'Pages' });
    fixture.detectChanges();
    expect(text(fixture, '[data-label]')).toBe('Pages');
  });

  it("asks the application's resolve first", () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideSlotted({
          resolve: (path, slots) =>
            path === 'dataGrid.groupCount' ? `${slots['count']} lines` : undefined,
        }),
      ],
    });
    const fixture = TestBed.createComponent(Rows);
    fixture.detectChanges();
    expect(text(fixture, '[data-rows]')).toBe('2 lines');
  });
});
