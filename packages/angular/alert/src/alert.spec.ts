import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { provideButtonDefaults, SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/alert/contract.json';
import { SlAlert } from './alert';
import { provideAlertDefaults } from './alert-defaults';
import {
  SlAlertActions,
  SlAlertContent,
  SlAlertDescription,
  SlAlertIcon,
  SlAlertTitle,
} from './alert-parts';

/**
 * The declared template names every directive, so the compiler does not report
 * them unused; each test replaces it with its own markup.
 */
@Component({
  standalone: true,
  imports: [
    SlAlert,
    SlAlertActions,
    SlAlertContent,
    SlAlertDescription,
    SlAlertIcon,
    SlAlertTitle,
    SlButton,
  ],
  template: `<section slAlert>
    <span slAlertIcon></span>
    <div slAlertContent>
      <div slAlertTitle></div>
      <p slAlertDescription></p>
    </div>
    <div slAlertActions><button slButton type="button"></button></div>
  </section>`,
})
class Host {}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.overrideComponent(Host, { set: { template } });
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const root = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-ui="alert"]') as HTMLElement;

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

const MESSAGE = `<div slAlertContent><p slAlertDescription>Pronto.</p></div>`;

describe('SlAlert', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<section slAlert dismissible>
        <div slAlertContent>
          <div slAlertTitle>Sua assinatura expira</div>
          <p slAlertDescription>Renove para manter o acesso.</p>
        </div>
        <div slAlertActions><button type="button">Renovar</button></div>
      </section>`,
    );

    const alert = root(fixture);
    expect(alert.tagName).toBe('SECTION');
    expect(alert.getAttribute('data-part')).toBe('root');
    expect(parts(alert)).toEqual(['icon', 'content', 'actions', 'dismiss']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const alert = root(renderTemplate(`<section slAlert>${MESSAGE}</section>`));
    const { defaults } = contract.members.alert;

    expect(alert.getAttribute('data-tone')).toBe(defaults.tone);
    expect(alert.getAttribute('data-variant')).toBe(defaults.variant);
    expect(alert.getAttribute('data-reach')).toBe(defaults.reach);
    expect(alert.getAttribute('data-live')).toBe(defaults.live);
    expect(alert.getAttribute('data-open')).toBe('');
    expect(alert.getAttribute('tabindex')).toBe('-1');
  });

  it('puts the actions at the end of a page banner and under the words of any other reach', () => {
    const fixture = renderTemplate(`
      <section slAlert>${MESSAGE}</section>
      <section slAlert reach="page">${MESSAGE}</section>
      <section slAlert actionsPlacement="end">${MESSAGE}</section>
      <section slAlert reach="page" actionsPlacement="below">${MESSAGE}</section>`);
    const alerts = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-ui="alert"]'),
    ];

    expect(alerts.map((alert) => alert.getAttribute('data-actions-placement'))).toEqual([
      'below',
      'end',
      'end',
      'below',
    ]);
  });

  /**
   * The decision the family exists to get right. MDN states that the `alert`
   * role "should only be used for text content, not interactive elements such
   * as links or buttons", so the region is the text and the controls are its
   * siblings.
   */
  it('announces with the text alone, and never with the controls inside it', () => {
    const fixture = renderTemplate(
      `<section slAlert dismissible live="assertive">
        <div slAlertContent><div slAlertTitle>Could not save</div></div>
        <div slAlertActions><button type="button">Try again</button></div>
      </section>`,
    );

    const alert = root(fixture);
    const region = alert.querySelector('[data-part="content"]') as HTMLElement;
    expect(region.getAttribute('role')).toBe('alert');
    expect(region.hasAttribute('aria-live')).toBe(false);
    expect(region.querySelector('button')).toBeNull();
    expect(alert.hasAttribute('role')).toBe(false);
  });

  it('maps each live value to the role that already implies it', () => {
    for (const [live, role] of Object.entries(contract.liveRoles)) {
      const fixture = renderTemplate(`<section slAlert live="${live}">${MESSAGE}</section>`);
      const region = root(fixture).querySelector('[data-part="content"]') as HTMLElement;
      expect(region.getAttribute('role')).toBe(role);
    }
  });

  /**
   * A `section` with an `aria-labelledby` pointing at nothing has no accessible
   * name and is not a landmark, so the attribute is written only when a title
   * is actually there to name it.
   */
  it('names the box with its own title, and only when it has one', () => {
    const titled = root(
      renderTemplate(
        `<section slAlert><div slAlertContent><div slAlertTitle>Sobre os fusos</div></div></section>`,
      ),
    );
    const title = titled.querySelector('[data-part="title"]') as HTMLElement;
    expect(titled.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id.length).toBeGreaterThan(0);

    const bare = root(renderTemplate(`<section slAlert>${MESSAGE}</section>`));
    expect(bare.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('renders the mark the tone maps to, and nothing when it is refused', () => {
    const drawn = root(renderTemplate(`<section slAlert tone="danger">${MESSAGE}</section>`));
    const icon = drawn.querySelector('[data-part="icon"]') as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');

    const bare = root(renderTemplate(`<section slAlert hideIcon>${MESSAGE}</section>`));
    expect(bare.querySelector('[data-part="icon"]')).toBeNull();
  });

  it('draws each tone’s glyph from the contract’s map, solid, and no mark for secondary', () => {
    for (const [tone, glyph] of Object.entries(contract.toneGlyphs)) {
      const alert = root(renderTemplate(`<section slAlert tone="${tone}">${MESSAGE}</section>`));
      if (glyph === null) {
        expect(alert.querySelector('[data-part="icon"]'), tone).toBeNull();
        continue;
      }
      const drawn = alert.querySelector(
        '[data-part="icon"] > [data-ui="icon"] > svg[data-part="glyph"]',
      );
      expect(drawn?.getAttribute('data-glyph'), tone).toBe(glyph);
      expect(drawn?.hasAttribute('data-solid'), tone).toBe(true);
    }
  });

  it('draws a mark the page projected on a secondary alert', () => {
    const alert = root(
      renderTemplate(
        `<section slAlert tone="secondary"><svg slAlertIcon data-own=""></svg>${MESSAGE}</section>`,
      ),
    );
    expect(alert.querySelector('[data-part="icon"] > [data-own]')).not.toBeNull();
  });

  it('puts the page’s own mark in the box the tone’s would have had', () => {
    const alert = root(
      renderTemplate(
        `<section slAlert><svg slAlertIcon data-testid="glyph"></svg>${MESSAGE}</section>`,
      ),
    );

    const glyph = alert.querySelector('[data-testid="glyph"]') as Element;
    expect(glyph.parentElement?.getAttribute('data-part')).toBe('icon');
    expect(alert.querySelector('[data-glyph]')).toBeNull();
  });

  describe('dismissal', () => {
    it('renders no control until the alert says it can be dismissed', () => {
      const alert = root(renderTemplate(`<section slAlert>${MESSAGE}</section>`));
      expect(alert.querySelector('[data-part="dismiss"]')).toBeNull();
    });

    it('draws the control as the x glyph', () => {
      const alert = root(renderTemplate(`<section slAlert dismissible>${MESSAGE}</section>`));
      const glyph = alert.querySelector(
        '[data-part="dismiss"] > [data-ui="icon"] > svg[data-part="glyph"]',
      );
      expect(glyph?.getAttribute('data-glyph')).toBe('x');
      expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    });

    it('closes itself when nobody owns the value, and stays in the document', () => {
      const fixture = renderTemplate(`<section slAlert dismissible>${MESSAGE}</section>`);
      const alert = root(fixture);

      alert.querySelector<HTMLButtonElement>('[data-part="dismiss"]')?.click();
      fixture.detectChanges();

      expect(alert.isConnected).toBe(true);
      expect(alert.hasAttribute('hidden')).toBe(true);
      expect(alert.hasAttribute('data-open')).toBe(false);
    });

    it('only asks when the consumer owns the value', () => {
      const fixture = renderTemplate(
        `<section slAlert dismissible [open]="true">${MESSAGE}</section>`,
      );
      const alert = root(fixture);

      alert.querySelector<HTMLButtonElement>('[data-part="dismiss"]')?.click();
      fixture.detectChanges();

      expect(alert.hasAttribute('hidden')).toBe(false);
    });

    it('carries the reason and the event, and can be refused', () => {
      const fixture = renderTemplate(
        `<section slAlert dismissible (openChange)="requests.push($any($event)); $any($event).cancel()">${MESSAGE}</section>`,
      );
      const component = fixture.componentInstance as unknown as {
        requests: { reason: string; source: unknown; value: boolean }[];
      };
      component.requests = [];
      const alert = root(fixture);

      alert.querySelector<HTMLButtonElement>('[data-part="dismiss"]')?.click();
      fixture.detectChanges();

      expect(component.requests).toHaveLength(1);
      expect(component.requests[0]?.reason).toBe('dismiss');
      expect(component.requests[0]?.value).toBe(false);
      expect(component.requests[0]?.source).toBeInstanceOf(Event);
      expect(alert.hasAttribute('hidden')).toBe(false);
    });

    it('speaks the language in force, and follows a change of it in place', () => {
      const locale = signal('pt-BR');
      const fixture = renderTemplate(`<section slAlert dismissible>${MESSAGE}</section>`, [
        provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      ]);
      const dismiss = () => root(fixture).querySelector('[data-part="dismiss"]');

      expect(dismiss()?.getAttribute('aria-label')).toBe('Dispensar');

      locale.set('en-US');
      fixture.detectChanges();
      expect(dismiss()?.getAttribute('aria-label')).toBe('Dismiss');
    });

    /**
     * The reach a template has and React does not: JSX can re-render an input,
     * and an Angular template can only call a method on the instance `exportAs`
     * gives it. The reason says which of the two asked.
     */
    it('lets a template close the message through the instance', () => {
      const fixture = renderTemplate(
        `<section slAlert #alert="slAlert" (openChange)="requests.push($any($event))">${MESSAGE}</section>
         <button type="button" (click)="alert.setOpen(false)">Close</button>`,
      );
      const component = fixture.componentInstance as unknown as {
        requests: { reason: string }[];
      };
      component.requests = [];

      fixture.nativeElement.querySelector('button').click();
      fixture.detectChanges();

      expect(component.requests[0]?.reason).toBe('programmatic');
      expect(root(fixture).hasAttribute('hidden')).toBe(true);
    });
  });

  describe('focus', () => {
    /**
     * `relatedTarget` is stated rather than produced: jsdom's focus manager
     * reports none, and the family reads it because a real browser does supply
     * it on `focusin`. What is under test is the rule — where the keyboard goes
     * when the message closes with focus inside it — and the live behavior is
     * exercised in the browser at the gate.
     */
    it('returns the keyboard to where it came from when the message closes', () => {
      const fixture = renderTemplate(
        `<button type="button" id="before">Antes</button>
         <section slAlert dismissible>${MESSAGE}</section>`,
      );
      const before = fixture.nativeElement.querySelector('#before') as HTMLButtonElement;
      const dismiss = root(fixture).querySelector('[data-part="dismiss"]') as HTMLButtonElement;

      dismiss.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: before }));
      dismiss.click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(before);
    });

    it('moves nothing when the application says it manages focus itself', () => {
      const fixture = renderTemplate(
        `<button type="button" id="before">Antes</button>
         <section slAlert dismissible [restoreFocus]="false">${MESSAGE}</section>`,
      );
      const before = fixture.nativeElement.querySelector('#before') as HTMLButtonElement;
      const dismiss = root(fixture).querySelector('[data-part="dismiss"]') as HTMLButtonElement;

      dismiss.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: before }));
      dismiss.click();
      fixture.detectChanges();

      expect(document.activeElement).not.toBe(before);
    });

    it('sends the keyboard to the message only when a template asks', () => {
      const fixture = renderTemplate(
        `<section slAlert #alert="slAlert">${MESSAGE}</section>
         <button type="button" (click)="alert.focus()">Ir</button>`,
      );

      fixture.nativeElement.querySelector('button').click();

      expect(document.activeElement).toBe(root(fixture));
    });
  });

  describe('composition', () => {
    it('lets an explicit input beat the provider, and the provider beat the default', () => {
      const fixture = renderTemplate(
        `<section slAlert id="inherited">${MESSAGE}</section>
         <section slAlert id="stated" tone="danger">${MESSAGE}</section>`,
        [provideAlertDefaults({ reach: 'page', tone: 'warning' })],
      );

      const inherited = fixture.nativeElement.querySelector('#inherited') as HTMLElement;
      const stated = fixture.nativeElement.querySelector('#stated') as HTMLElement;
      expect(inherited.getAttribute('data-tone')).toBe('warning');
      expect(inherited.getAttribute('data-reach')).toBe('page');
      expect(stated.getAttribute('data-tone')).toBe('danger');
      expect(stated.getAttribute('data-reach')).toBe('page');
    });

    /**
     * The element is the consumer's, so a heading is written rather than asked
     * for: Angular needs no `render` prop to let a page put its message in the
     * document outline.
     */
    it('keeps the element the page wrote for every part', () => {
      const fixture = renderTemplate(
        `<aside slAlert>
          <div slAlertContent><h3 slAlertTitle>Maintenance</h3></div>
        </aside>`,
      );

      const alert = root(fixture);
      expect(alert.tagName).toBe('ASIDE');
      expect(alert.querySelector('[data-part="title"]')?.tagName).toBe('H3');
    });

    it('keeps a static attribute the consumer wrote over the one it would write', () => {
      const alert = root(
        renderTemplate(`<section slAlert tabindex="0" lang="pt-BR">${MESSAGE}</section>`),
      );

      expect(alert.getAttribute('tabindex')).toBe('0');
      expect(alert.getAttribute('lang')).toBe('pt-BR');
    });
  });
});

/**
 * A button in the actions part took the button defaults, accent and md: over
 * a warning ground an accent outline button drew no fill, in a color the
 * theme never measured against that ground.
 */
describe('SlAlertActions paint', () => {
  const button = (fixture: { nativeElement: HTMLElement }) =>
    fixture.nativeElement.querySelector<HTMLElement>('[slButton]') as HTMLElement;

  it('gives the buttons in it the alert’s tone and the sm size', () => {
    const fixture = renderTemplate(
      `<section slAlert tone="warning">${MESSAGE}<div slAlertActions><button slButton type="button">Go</button></div></section>`,
    );

    expect(button(fixture).getAttribute('data-tone')).toBe('warning');
    expect(button(fixture).getAttribute('data-size')).toBe('sm');
    expect(button(fixture).getAttribute('data-variant')).toBe('solid');
  });

  it('takes the alert’s default tone, over an application’s button defaults', () => {
    const fixture = renderTemplate(
      `<section slAlert>${MESSAGE}<div slAlertActions><button slButton type="button">Go</button></div></section>`,
      [
        provideAlertDefaults({ tone: 'secondary' }),
        provideButtonDefaults({ size: 'lg', tone: 'danger', variant: 'ghost' }),
      ],
    );

    expect(button(fixture).getAttribute('data-tone')).toBe('secondary');
    expect(button(fixture).getAttribute('data-size')).toBe('sm');
    expect(button(fixture).getAttribute('data-variant')).toBe('ghost');
  });

  it('loses to a button that states the axis itself', () => {
    const fixture = renderTemplate(
      `<section slAlert tone="warning">${MESSAGE}<div slAlertActions><button slButton size="md" tone="danger" type="button">Go</button></div></section>`,
    );

    expect(button(fixture).getAttribute('data-tone')).toBe('danger');
    expect(button(fixture).getAttribute('data-size')).toBe('md');
  });
});
