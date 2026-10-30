import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/inline-message/contract.json';
import { SlButton } from '@slotted/angular/button';

import { SlInlineMessage, SlInlineMessageActions } from './inline-message';
import { provideInlineMessageDefaults } from './inline-message-defaults';
import { SlInlineMessageIcon } from './inline-message-parts';

/**
 * The declared template names every directive, so the compiler does not report
 * them unused; each test replaces it with its own markup.
 */
@Component({
  standalone: true,
  imports: [SlInlineMessage, SlInlineMessageIcon, SlInlineMessageActions, SlButton],
  template: `<p slInlineMessage><span slInlineMessageIcon></span></p>`,
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

const root = (fixture: { nativeElement: HTMLElement }, selector = '[data-ui="inline-message"]') =>
  fixture.nativeElement.querySelector<HTMLElement>(selector) as HTMLElement;

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('SlInlineMessage', () => {
  /**
   * A message that offers its answers holds them: a paragraph cannot hold a
   * button, so the root is a group named by the sentence, and a live message
   * announces the sentence and not the buttons.
   */
  it('is a group named by its sentence when it holds actions', () => {
    const fixture = renderTemplate(`<div slInlineMessage tone="warning" live="polite">
      More than one number can be the amount.
      <div slInlineMessageActions>
        <button slButton>R$ 2,00</button>
        <button slButton>R$ 15,00</button>
      </div>
    </div>`);
    const message = root(fixture);
    const text = message.querySelector('[data-part="text"]') as HTMLElement;
    const actions = message.querySelector('[data-part="actions"]') as HTMLElement;

    expect(message.getAttribute('role')).toBe('group');
    expect(message.getAttribute('aria-labelledby')).toBe(text.id);
    expect(text.getAttribute('role')).toBe('status');
    expect(text.textContent).not.toContain('R$');
    expect(actions.querySelectorAll('button')).toHaveLength(2);
    for (const button of actions.querySelectorAll('button')) {
      expect(button.getAttribute('data-size')).toBe('sm');
    }
  });

  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<p slInlineMessage tone="danger">Enter a valid EIN.</p>`);

    const message = root(fixture);
    expect(message.tagName).toBe('P');
    expect(message.getAttribute('data-part')).toBe('root');
    expect(parts(message)).toEqual(['prefix', 'icon', 'text']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<p slInlineMessage>Entre 8 e 64 caracteres.</p>`);

    const message = root(fixture);
    const { defaults } = contract.members.inlineMessage;
    expect(message.getAttribute('data-tone')).toBe(defaults.tone);
    expect(message.getAttribute('data-size')).toBe(defaults.size);
    expect(message.getAttribute('data-live')).toBe(defaults.live);
    expect(message.hasAttribute('data-loading')).toBe(false);
    expect(message.hasAttribute('data-disabled')).toBe(false);
    expect(message.hasAttribute('data-reserve')).toBe(false);
  });

  /**
   * The capability none of the thirteen surveyed implementations ships. The
   * mark and the colour reach a reader who looks; the word is what reaches a
   * reader who listens, and it is first in the DOM so it is read first.
   */
  it('says the severity in words, before the message, for every tone that is one', () => {
    for (const [tone, word] of Object.entries(contract.tonePrefixes)) {
      const fixture = renderTemplate(`<p slInlineMessage tone="${tone}">Uma mensagem.</p>`);
      const message = root(fixture);
      const prefix = message.querySelector('[data-part="prefix"]');

      if (word === null) expect(prefix).toBeNull();
      else {
        expect(prefix?.textContent).toBe(word);
        expect(message.firstElementChild).toBe(prefix);
      }
    }
  });

  it('lets one message replace the word, and the empty string remove it', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="own" tone="danger" prefix="Error:">Enter a valid EIN.</p>
       <p slInlineMessage id="none" tone="danger" prefix="">Error: enter a valid EIN.</p>`,
    );

    expect(root(fixture, '#own').querySelector('[data-part="prefix"]')?.textContent).toBe('Error:');
    expect(root(fixture, '#none').querySelector('[data-part="prefix"]')).toBeNull();
  });

  /**
   * The token is where an application translates the four words once. A partial
   * table is merged over the shipped one, so replacing `danger` alone does not
   * silently drop `warning`.
   */
  it('takes the application’s own words, one at a time', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="inherited">Enter a valid EIN.</p>
       <p slInlineMessage id="stated" tone="warning">The password is weak.</p>`,
      [
        provideInlineMessageDefaults({
          prefixes: { danger: 'Error:' },
          size: 'md',
          tone: 'danger',
        }),
      ],
    );

    const inherited = root(fixture, '#inherited');
    expect(inherited.getAttribute('data-tone')).toBe('danger');
    expect(inherited.getAttribute('data-size')).toBe('md');
    expect(inherited.querySelector('[data-part="prefix"]')?.textContent).toBe('Error:');
    expect(root(fixture, '#stated').querySelector('[data-part="prefix"]')?.textContent).toBe(
      'Warning:',
    );
  });

  it('lets a message state an axis the token already answered', () => {
    const fixture = renderTemplate(`<p slInlineMessage tone="success">Name available.</p>`, [
      provideInlineMessageDefaults({ tone: 'danger' }),
    ]);

    expect(root(fixture).getAttribute('data-tone')).toBe('success');
  });

  /**
   * `slAlert` writes its live role on the text part, because MDN's `alert` role
   * reference restricts the role to text content and an alert has a dismiss
   * button beside its text. This family has no controls, so the role belongs on
   * the element that is the text.
   */
  it('carries the announcing role on the element that is the message', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="off">Nothing is announced.</p>
       <p slInlineMessage id="polite" live="polite">Saved.</p>
       <p slInlineMessage id="assertive" live="assertive" tone="danger">Could not save.</p>`,
    );

    expect(root(fixture, '#off').hasAttribute('role')).toBe(false);
    expect(root(fixture, '#polite').getAttribute('role')).toBe(contract.liveRoles.polite);
    expect(root(fixture, '#assertive').getAttribute('role')).toBe(contract.liveRoles.assertive);
  });

  /**
   * The sentence is wrapped by the family so `[data-part='text']:empty` is an
   * exact question — which is what lets `reserve` hold a line open and draw
   * nothing in it.
   */
  it('wraps the message in the family’s own element, and leaves it empty when there is none', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="full" reserve tone="danger">Two digits are missing.</p>
       <p slInlineMessage id="empty" reserve tone="danger"></p>`,
    );

    const full = root(fixture, '#full');
    expect(full.getAttribute('data-reserve')).toBe('');
    expect(full.querySelector('[data-part="text"]')?.textContent).toBe('Two digits are missing.');
    expect(root(fixture, '#empty').querySelector('[data-part="text"]')?.childNodes).toHaveLength(0);
  });

  it('turns the mark into a ring while the message waits, and mutes it when disabled', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="waiting" loading>Checking availability…</p>
       <p slInlineMessage id="off" disabled>Available on the Enterprise plan.</p>`,
    );

    expect(root(fixture, '#waiting').getAttribute(contract.stateAttributes.loading)).toBe('');
    expect(root(fixture, '#off').getAttribute(contract.stateAttributes.disabled)).toBe('');
  });

  /**
   * The identifier is what an `aria-describedby` or an `aria-errormessage`
   * points at, so the element always has one — and the consumer's own always
   * wins, because that is the value a form already knows.
   */
  it('always has an identifier, and never replaces the consumer’s', () => {
    const generated = renderTemplate(`<p slInlineMessage>Uma mensagem.</p>`);
    expect(root(generated).id).not.toBe('');

    const stated = renderTemplate(`<p slInlineMessage id="cnpj-error">Outra.</p>`);
    expect(root(stated, '#cnpj-error').id).toBe('cnpj-error');
  });

  /**
   * The reach an Angular template has and a React one does not: `exportAs`
   * hands the instance back, so the control above can point at the identifier
   * the family generated without the page inventing one.
   */
  it('hands the generated identifier back to the template', () => {
    const fixture = renderTemplate(
      `<input [attr.aria-errormessage]="message.messageId" aria-invalid="true" />
       <p slInlineMessage #message="slInlineMessage" tone="danger">Two digits are missing.</p>`,
    );

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-errormessage')).toBe(root(fixture).id);
  });

  it('draws no mark when asked, and the page’s own artwork when given one', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="bare" hideIcon tone="danger">Sem marca.</p>
       <p slInlineMessage id="own" tone="accent">
         <svg slInlineMessageIcon aria-hidden="true"></svg>
         With the page artwork.
       </p>`,
    );

    expect(root(fixture, '#bare').querySelector('[data-part="icon"]')).toBeNull();
    expect(root(fixture, '#own').querySelector('[data-part="icon"] svg')).not.toBeNull();
    expect(root(fixture, '#own').querySelector('[data-glyph]')).toBeNull();
  });

  it('draws the glyph the contract maps each tone to, and none for help', () => {
    for (const [tone, glyph] of Object.entries(contract.toneGlyphs)) {
      const fixture = renderTemplate(`<p slInlineMessage tone="${tone}">Uma mensagem.</p>`);
      const icon = root(fixture).querySelector('[data-part="icon"]') as Element;
      const drawn = icon.querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
      if (glyph === null) expect(icon.childElementCount, tone).toBe(0);
      else expect(drawn?.getAttribute('data-glyph'), tone).toBe(glyph);
    }
  });

  it('draws the dot for a bullet, nothing for no mark, and nothing while waiting', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage id="dot" mark="dot" tone="danger">Um ponto.</p>
       <p slInlineMessage id="none" mark="none" tone="danger">Nada.</p>
       <p slInlineMessage id="waiting" loading tone="danger">A verificar.</p>`,
    );
    const icon = (id: string) =>
      root(fixture, `#${id}`).querySelector('[data-part="icon"]') as Element;

    expect(icon('dot').querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe('dot');
    expect(icon('none').childElementCount).toBe(0);
    expect(icon('waiting').childElementCount).toBe(0);
  });

  it('keeps a native attribute and a role the consumer wrote', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage lang="de" role="note" live="polite" tone="warning">
         Die Zahlung schlug fehl.
       </p>`,
    );

    const message = root(fixture);
    expect(message.getAttribute('lang')).toBe('de');
    expect(message.getAttribute('role')).toBe('note');
  });

  /**
   * A family that composes with this one gives the message an identifier
   * derived from its own base. `field`'s description and error *are* inline
   * messages, and neither a static attribute nor a directive on the same
   * element can write a computed identifier onto them.
   */
  it('takes an identifier from whatever renders it, and prefers a bound one', () => {
    const fixture = renderTemplate(
      `<p slInlineMessage [id]="'cnpj-error'">Bound.</p>
       <p slInlineMessage id="written" [id]="'cnpj-description'">Both.</p>`,
    );

    const messages = fixture.nativeElement.querySelectorAll('[data-ui="inline-message"]');
    expect(messages[0].getAttribute('id')).toBe('cnpj-error');
    expect(messages[1].getAttribute('id')).toBe('cnpj-description');
  });
});
