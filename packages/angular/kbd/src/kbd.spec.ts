import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import { provideKbdDefaults } from './kbd-defaults';
import { SlKbd } from './kbd';
import { SlShortcut } from './shortcut';

/**
 * The declared template names both directives, so the compiler does not report
 * them unused; every test replaces it with its own markup.
 */
@Component({
  standalone: true,
  imports: [SlKbd, SlShortcut],
  template: `<kbd slKbd></kbd><kbd slShortcut></kbd>`,
})
class Host {}

/**
 * The rendered DOM with Angular's own control-flow anchors removed. `@if` leaves
 * a comment node wherever a branch could go, and the two templates that write a
 * key do not have the same number of branches — which is a difference in how the
 * markup was produced, not in the markup.
 */
function shape(element: Element): string {
  return [...element.childNodes]
    .filter((node) => node.nodeType !== node.COMMENT_NODE)
    .map((node) =>
      node.nodeType === node.ELEMENT_NODE
        ? `<${(node as Element).tagName} ${[...(node as Element).attributes]
            .map((attribute) => `${attribute.name}=${attribute.value}`)
            .sort()
            .join(' ')}>${shape(node as Element)}`
        : (node.textContent ?? ''),
    )
    .join('');
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.overrideComponent(Host, { set: { template } });
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const legends = (root: Element) =>
  [...root.querySelectorAll('[data-part="legend"]')].map((node) => node.textContent?.trim());

beforeEach(() => {
  TestBed.resetTestingModule();
});

describe('SlKbd', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<kbd slKbd keyName="mod" platform="mac"></kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(key.getAttribute('data-ui')).toBe('kbd');
    expect(key.getAttribute('data-part')).toBe('root');
    expect(key.getAttribute('data-key')).toBe('mod');
    expect(key.getAttribute('data-platform')).toBe('mac');
  });

  it('writes every axis a consumer may style on, and its defaults', () => {
    const fixture = renderTemplate(`<kbd slKbd>K</kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(key.getAttribute('data-size')).toBe('md');
    expect(key.getAttribute('data-variant')).toBe('raised');
    expect(key.hasAttribute('data-disabled')).toBe(false);
  });

  /**
   * ARIA in HTML maps `kbd` to no role and declares it Naming Prohibited, so the
   * word a reader hears has to be content.
   */
  it('hides the mark from the reader and gives it the word', () => {
    const fixture = renderTemplate(`<kbd slKbd keyName="mod" platform="mac"></kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(key.hasAttribute('aria-label')).toBe(false);
    expect(key.hasAttribute('role')).toBe(false);
    expect(key.querySelector('[data-part="legend"]').getAttribute('aria-hidden')).toBe('true');
    expect(key.querySelector('[data-part="legend"]').getAttribute('data-legend')).toBe('symbol');
    expect(key.querySelector('[data-part="name"]').textContent).toBe('Command');
  });

  it('leaves a projected legend unhidden and unnamed', () => {
    const fixture = renderTemplate(`<kbd slKbd>Any key</kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(legends(key)).toEqual(['Any key']);
    expect(key.querySelector('[data-part="legend"]').hasAttribute('aria-hidden')).toBe(false);
    expect(key.querySelector('[data-part="name"]')).toBeNull();
    expect(key.hasAttribute('data-key')).toBe(false);
  });

  /** A named key wins over content: it is the more specific of two explicit instructions. */
  it('prefers a named key over projected content', () => {
    const fixture = renderTemplate(`<kbd slKbd keyName="mod" platform="mac">Cmd</kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(legends(key)).toEqual(['⌘']);
    expect(key.querySelector('[data-part="name"]').textContent).toBe('Command');
  });

  it('keeps a static attribute the consumer wrote on their own element', () => {
    const fixture = renderTemplate(`<kbd slKbd id="undo" title="Undo" keyName="escape"></kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(key.getAttribute('id')).toBe('undo');
    expect(key.getAttribute('title')).toBe('Undo');
  });

  it('dims without claiming the item’s semantics', () => {
    const fixture = renderTemplate(`<kbd slKbd disabled keyName="escape"></kbd>`);
    const key = fixture.nativeElement.querySelector('kbd');

    expect(key.getAttribute('data-disabled')).toBe('');
    expect(key.hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('SlShortcut', () => {
  it('nests the keys inside one kbd, which is what the specification says', () => {
    const fixture = renderTemplate(`<kbd slShortcut keys="mod+k" platform="windows"></kbd>`);
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');

    expect(shortcut.tagName).toBe('KBD');
    expect(shortcut.getAttribute('data-ui')).toBe('kbd');
    expect(shortcut.getAttribute('data-platform')).toBe('windows');
    expect([...shortcut.children].map((node: Element) => node.getAttribute('data-part'))).toEqual([
      'root',
      'separator',
      'root',
    ]);
    expect([...shortcut.querySelectorAll('[data-part="root"]')].every((n) => n.tagName === 'KBD'));
  });

  it('reorders the modifiers into the platform’s own convention', () => {
    const fixture = renderTemplate(
      `<kbd slShortcut keys="mod+shift+alt+ctrl+p" platform="mac"></kbd>` +
        `<kbd slShortcut keys="shift+meta+alt+ctrl+p" platform="windows"></kbd>`,
    );
    const [mac, windows] = fixture.nativeElement.querySelectorAll('[data-part="shortcut"]');

    expect(legends(mac)).toEqual(['⌃', '⌥', '⇧', '⌘', 'P']);
    expect(legends(windows)).toEqual(['Win', 'Ctrl', 'Alt', 'Shift', 'P']);
  });

  it('joins by platform, and draws no separator at all on a Mac', () => {
    const fixture = renderTemplate(
      `<kbd slShortcut keys="mod+shift+k" platform="mac"></kbd>` +
        `<kbd slShortcut keys="mod+shift+k" platform="windows"></kbd>`,
    );
    const [mac, windows] = fixture.nativeElement.querySelectorAll('[data-part="shortcut"]');

    expect(mac.querySelectorAll('[data-part="separator"]')).toHaveLength(0);
    expect(windows.querySelectorAll('[data-part="separator"]')).toHaveLength(2);
  });

  it('hides the plus from a reader and reads the word out', () => {
    const fixture = renderTemplate(`<kbd slShortcut keys="mod+k mod+s" platform="windows"></kbd>`);
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');
    const plus = [...shortcut.querySelectorAll('[data-separator="plus"]')];
    const then = [...shortcut.querySelectorAll('[data-separator="then"]')];

    expect(plus).toHaveLength(2);
    expect(plus.every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(then).toHaveLength(1);
    expect(then[0]?.hasAttribute('aria-hidden')).toBe(false);
    expect(then[0]?.textContent).toBe('then');
  });

  it('takes no room at all when it holds nothing', () => {
    const fixture = renderTemplate(`<kbd slShortcut keys=""></kbd>`);
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');

    expect(shortcut.style.display).toBe('none');
  });

  /** The escape hatch is composition: projected keys are rendered as written. */
  it('renders keys a page projected itself, and paints them like the group', () => {
    const fixture = renderTemplate(
      `<kbd slShortcut platform="mac" variant="soft">` +
        `<kbd slKbd keyName="mod"></kbd><kbd slKbd>K</kbd></kbd>`,
    );
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');

    expect(legends(shortcut)).toEqual(['⌘', 'K']);
    expect(
      [...shortcut.querySelectorAll('[data-part="root"]')].every(
        (node) => node.getAttribute('data-variant') === 'soft',
      ),
    ).toBe(true);
  });

  it('lets a projected key state its own axis, and keeps that value', () => {
    const fixture = renderTemplate(`<kbd slShortcut size="lg"><kbd slKbd size="sm">K</kbd></kbd>`);

    expect(
      fixture.nativeElement.querySelector('[data-part="root"]').getAttribute('data-size'),
    ).toBe('sm');
  });

  /**
   * The key markup is written twice on this side — once in `SlKbd`, once in the
   * combination's own template — because a resolved key has no token to hand
   * back. This is the guard that keeps the two from drifting apart, and it is
   * stronger than a shared helper would be, because it checks the result rather
   * than the mechanism.
   */
  it('renders a key the same way whichever of the two wrote it', () => {
    const fixture = renderTemplate(
      `<kbd slKbd keyName="mod" platform="mac"></kbd>` +
        `<kbd slShortcut keys="mod" platform="mac"></kbd>`,
    );
    const alone = fixture.nativeElement.querySelector('[data-part="root"]');
    const inside = fixture.nativeElement.querySelector('[data-part="shortcut"] [data-part="root"]');

    expect(shape(inside)).toBe(shape(alone));
    for (const attribute of [
      'data-ui',
      'data-part',
      'data-key',
      'data-platform',
      'data-size',
      'data-variant',
    ]) {
      expect(inside.getAttribute(attribute)).toBe(alone.getAttribute(attribute));
    }
  });
});

describe('SlShortcut language', () => {
  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(`<kbd slShortcut keys="space g" platform="windows"></kbd>`, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');

    // language: pt-BR
    expect(legends(shortcut)).toEqual(['Espaço', 'G']);
    // language: en-US
    expect(shortcut.querySelector('[data-separator="then"]').textContent).toBe('depois');

    locale.set('en-US');
    fixture.detectChanges();
    expect(legends(shortcut)).toEqual(['Space', 'G']);
    expect(shortcut.querySelector('[data-separator="then"]').textContent).toBe('then');
  });
});

describe('provideKbdDefaults', () => {
  it('sets the platform, the painting and the wording once for an application', () => {
    const fixture = renderTemplate(
      `<kbd slShortcut keys="ctrl+k ctrl+s" [messages]="{ then: 'dann' }"></kbd>`,
      [
        provideKbdDefaults({
          platform: 'windows',
          size: 'sm',
          variant: 'soft',
          legends: { ctrl: 'Strg' },
          names: { ctrl: 'Steuerung' },
        }),
      ],
    );
    const shortcut = fixture.nativeElement.querySelector('[data-part="shortcut"]');

    expect(shortcut.getAttribute('data-size')).toBe('sm');
    expect(shortcut.getAttribute('data-variant')).toBe('soft');
    expect(legends(shortcut)).toEqual(['Strg', 'K', 'Strg', 'S']);
    expect(shortcut.querySelector('[data-part="name"]').textContent).toBe('Steuerung');
    expect(shortcut.querySelector('[data-separator="then"]').textContent).toBe('dann');
  });

  it('never overrides a value a key stated for itself', () => {
    const fixture = renderTemplate(
      `<kbd slKbd keyName="mod" platform="mac" variant="outline"></kbd>`,
      [provideKbdDefaults({ platform: 'windows', variant: 'soft' })],
    );
    const key = fixture.nativeElement.querySelector('[data-part="root"]');

    expect(key.getAttribute('data-variant')).toBe('outline');
    expect(legends(key)).toEqual(['⌘']);
  });
});
