import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { statusIndicatorMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/status-indicator/contract.json';
import { provideStatusIndicatorDefaults } from './status-indicator-defaults';
import { SlStatusIndicator, SlStatusIndicatorDetail } from './status-indicator';
import type { StatusIndicatorStatus } from './status-indicator.constants';

/** The declared template names the directive, so the compiler sees it used. */
@Component({
  standalone: true,
  imports: [SlStatusIndicator, SlStatusIndicatorDetail],
  template: `<span slStatusIndicator></span>`,
})
class Host {}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.overrideComponent(Host, { set: { template } });
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const root = (fixture: { nativeElement: Element }) =>
  fixture.nativeElement.querySelector('[data-ui="status-indicator"][data-part="root"]')!;
const part = (fixture: { nativeElement: Element }, name: string) =>
  fixture.nativeElement.querySelector(`[data-part="${name}"]`);

beforeEach(() => {
  TestBed.resetTestingModule();
});

describe('SlStatusIndicator', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<span slStatusIndicator>Healthy</span>`);

    expect(root(fixture).getAttribute('data-ui')).toBe('status-indicator');
    expect(root(fixture).getAttribute('data-part')).toBe('root');
    expect(part(fixture, 'mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(part(fixture, 'label')?.textContent?.trim()).toBe('Healthy');
  });

  /**
   * The icon mark is the family's non-chromatic answer, so the artwork each
   * status draws is the contract's, rendered as the `Glyph` element. The dot
   * holds none: it is painted, not drawn.
   */
  it('draws the glyph the contract names for each status, and none in a dot', () => {
    for (const status of contract.axes.status as StatusIndicatorStatus[]) {
      TestBed.resetTestingModule();
      const fixture = renderTemplate(
        `<span slStatusIndicator status="${status}" mark="icon">Build</span>`,
      );
      const glyphs = part(fixture, 'mark')!.querySelectorAll('[data-ui="icon"] > svg[data-glyph]');
      expect(glyphs.length).toBe(1);
      expect(glyphs[0]!.getAttribute('data-glyph')).toBe(
        contract.statusGlyphs[status as keyof typeof contract.statusGlyphs],
      );
    }

    TestBed.resetTestingModule();
    const dot = renderTemplate(`<span slStatusIndicator status="danger">Build</span>`);
    expect(part(dot, 'mark')!.querySelector('svg')).toBeNull();
  });

  it('renders the defaults the contract declares', () => {
    const fixture = renderTemplate(`<span slStatusIndicator>Draft</span>`);

    expect(root(fixture).getAttribute('data-status')).toBe(
      contract.members.statusIndicator.defaults.status,
    );
    expect(root(fixture).getAttribute('data-mark')).toBe(
      contract.members.statusIndicator.defaults.mark,
    );
    expect(root(fixture).getAttribute('data-size')).toBe(
      contract.members.statusIndicator.defaults.size,
    );
    expect(root(fixture).hasAttribute('data-pulse')).toBe(false);
    expect(root(fixture).hasAttribute('role')).toBe(false);
  });

  /**
   * The one thing every surveyed implementation gets wrong, and Angular's own
   * way of getting it right: `<ng-content>` carries the fallback, so the
   * template knows whether anything was projected and nothing has to inspect
   * the DOM to find out.
   */
  it('names a mark that shows no words, from the status itself', () => {
    const fixture = renderTemplate(`<span slStatusIndicator status="danger"></span>`);

    expect(part(fixture, 'announcement')?.textContent?.trim()).toBe('Error');
    expect(part(fixture, 'announcement')?.getAttribute('data-ui')).toBe('visually-hidden');
    expect(root(fixture).hasAttribute('aria-label')).toBe(false);
  });

  it('gives every status a word rather than leaving one silent', () => {
    for (const status of contract.axes.status as StatusIndicatorStatus[]) {
      TestBed.resetTestingModule();
      const fixture = renderTemplate(`<span slStatusIndicator status="${status}"></span>`);
      expect(part(fixture, 'announcement')?.textContent?.trim()).toBe(
        statusIndicatorMessages.base[status],
      );
    }
  });

  it('does not name itself twice when the page already wrote the words', () => {
    const fixture = renderTemplate(
      `<span slStatusIndicator status="success" label="Success">Healthy</span>`,
    );

    expect(part(fixture, 'announcement')).toBeNull();
    expect(root(fixture).textContent?.trim()).toBe('Healthy');
  });

  it('projects the detail inside the label, after the words', () => {
    const fixture = renderTemplate(
      `<span slStatusIndicator status="info">Deploying<span slStatusIndicatorDetail>62% · build</span></span>`,
    );
    const label = part(fixture, 'label')!;
    const detail = label.querySelector(':scope > [data-part="detail"]');
    expect(detail?.textContent).toBe('62% · build');
    expect(label.lastElementChild).toBe(detail);
    expect(part(fixture, 'announcement')).toBeNull();
  });

  it('takes the word a consumer wrote over the status’s own', () => {
    const fixture = renderTemplate(
      `<span slStatusIndicator status="danger" label="Deploy failed"></span>`,
    );

    expect(part(fixture, 'announcement')?.textContent?.trim()).toBe('Deploy failed');
  });

  it('carries the pulse as an attribute a stylesheet can answer', () => {
    const fixture = renderTemplate(`<span slStatusIndicator status="info" pulse></span>`);

    expect(root(fixture).hasAttribute('data-pulse')).toBe(true);
  });

  describe('announcing', () => {
    it('says nothing about a status that was already on the page', () => {
      const fixture = renderTemplate(`<span slStatusIndicator status="success">Healthy</span>`);

      expect(root(fixture).hasAttribute('role')).toBe(false);
    });

    it('becomes a polite live region on request', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator status="info" live="polite">Deploying</span>`,
      );

      expect(root(fixture).getAttribute('role')).toBe('status');
    });

    it('interrupts only when an application asks it to', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator status="danger" live="assertive">Region offline</span>`,
      );

      expect(root(fixture).getAttribute('role')).toBe('alert');
    });

    /**
     * Read once through `HostAttributeToken`, before the host binding writes
     * one. A consumer's own role survives, which is the rule `frameworks.md`
     * states for every static attribute a family writes over.
     */
    it('never replaces a role the consumer wrote', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator live="polite" role="note">Draft</span>`,
      );

      expect(root(fixture).getAttribute('role')).toBe('note');
    });
  });

  describe('defaults', () => {
    it('lets an application decide the mark, the size and the announcing once', () => {
      const fixture = renderTemplate(`<span slStatusIndicator status="warning">Degraded</span>`, [
        provideStatusIndicatorDefaults({ mark: 'icon', size: 'sm', live: 'polite' }),
      ]);

      expect(root(fixture).getAttribute('data-mark')).toBe('icon');
      expect(root(fixture).getAttribute('data-size')).toBe('sm');
      expect(root(fixture).getAttribute('role')).toBe('status');
    });

    it('lets an explicit input win over the application’s decision', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator status="warning" mark="dot" size="lg">Degraded</span>`,
        [provideStatusIndicatorDefaults({ mark: 'icon', size: 'sm' })],
      );

      expect(root(fixture).getAttribute('data-mark')).toBe('dot');
      expect(root(fixture).getAttribute('data-size')).toBe('lg');
    });

    it('speaks the language in force, and follows a change of it in place', () => {
      const locale = signal('pt-BR');
      const fixture = renderTemplate(`<span slStatusIndicator status="danger"></span>`, [
        provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      ]);

      expect(part(fixture, 'announcement')?.textContent?.trim()).toBe('Erro');

      locale.set('en-US');
      fixture.detectChanges();
      expect(part(fixture, 'announcement')?.textContent?.trim()).toBe('Error');
    });

    it('lays its own messages over the catalog key by key', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator status="success" [messages]="{ success: 'Ready' }"></span>`,
      );

      expect(part(fixture, 'announcement')?.textContent?.trim()).toBe('Ready');
    });
  });

  describe('the surface a consumer reaches', () => {
    it('leaves the element the consumer’s, with its attributes untouched', () => {
      const fixture = renderTemplate(
        `<a slStatusIndicator status="danger" href="/builds/4821" id="build-status">Build 4821 failed</a>`,
      );
      const link = fixture.nativeElement.querySelector('a')!;

      expect(link.getAttribute('href')).toBe('/builds/4821');
      expect(link.getAttribute('id')).toBe('build-status');
      expect(link.getAttribute('data-status')).toBe('danger');
      expect(link.querySelector('[data-part="mark"]')).not.toBeNull();
    });

    it('hands the instance to a template that asks for it', () => {
      const fixture = renderTemplate(
        `<span slStatusIndicator status="warning" #status="slStatusIndicator"></span
        ><span data-testid="echo">{{ status.name() }}</span>`,
      );

      expect(fixture.nativeElement.querySelector('[data-testid="echo"]')?.textContent?.trim()).toBe(
        'Warning',
      );
    });
  });
});
