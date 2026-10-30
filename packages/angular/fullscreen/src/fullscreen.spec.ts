import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/fullscreen/contract.json';
import {
  SlFullscreen,
  SlFullscreenContent,
  SlFullscreenIcon,
  SlFullscreenTrigger,
} from './fullscreen';
import { provideFullscreenDefaults } from './fullscreen-defaults';

/**
 * jsdom has no Fullscreen API. A case that needs the agent installs one that
 * accepts, fires `fullscreenchange` before resolving as the specification
 * orders it, and can leave on its own.
 */
function installAgent() {
  let current: Element | null = null;
  /* The element the agent made full screen, handed over rather than aliased. */
  const take = (element: Element) => {
    current = element;
  };
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current });
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async function (this: HTMLElement) {
      take(this);
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  return {
    leave() {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    },
  };
}

afterEach(() => {
  for (const name of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen']) {
    delete (document as unknown as Record<string, unknown>)[name];
  }
  delete (HTMLElement.prototype as unknown as Record<string, unknown>)['requestFullscreen'];
});

@Component({
  standalone: true,
  imports: [SlFullscreen, SlFullscreenContent, SlFullscreenTrigger, SlFullscreenIcon],
  template: '',
})
class Host {
  readonly on = signal(false);
  readonly requests: { value: boolean; reason: string }[] = [];
  readonly errors: string[] = [];
  refuse = false;

  record(request: { value: boolean; reason: string; cancel: () => void }) {
    this.requests.push({ value: request.value, reason: request.reason });
    if (this.refuse) request.cancel();
  }
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;

/* The family's own root: the trigger's icon box is a `root` part too. */
const region = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="fullscreen"][data-part="root"]') as HTMLElement;
const trigger = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLButtonElement;

function click(element: HTMLElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

async function settle(fixture: Fixture) {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

const PANEL = `<section slFullscreen [(fullscreen)]="on" (fullscreenChangeRequest)="record($event)"
  (fullscreenError)="errors.push($event.kind)">
  <h2>Revenue</h2><button slFullscreenTrigger></button>
</section>`;

describe('SlFullscreen', () => {
  it('is selected by the family identifier, the region and the control each by its part', () => {
    const fixture = renderTemplate(PANEL);

    expect(region(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(trigger(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(trigger(fixture).getAttribute('type')).toBe('button');
    expect(trigger(fixture).querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('changes its label with the state and writes no aria-pressed', async () => {
    installAgent();
    const fixture = renderTemplate(PANEL);
    await settle(fixture);

    expect(trigger(fixture).textContent?.trim()).toBe('Full screen');
    click(trigger(fixture));
    await settle(fixture);

    expect(region(fixture).getAttribute('data-mode')).toBe('native');
    expect(region(fixture).hasAttribute('data-fullscreen')).toBe(true);
    expect(trigger(fixture).textContent?.trim()).toBe('Exit full screen');
    expect(trigger(fixture).hasAttribute('aria-pressed')).toBe(false);
    expect(fixture.componentInstance.on()).toBe(true);
  });

  it('draws the glyph of the next press', async () => {
    installAgent();
    const fixture = renderTemplate(PANEL);
    await settle(fixture);
    const glyph = () =>
      trigger(fixture).querySelector('[data-part="icon"] > [data-ui="icon"] > svg[data-glyph]');

    expect(glyph()?.getAttribute('data-glyph')).toBe(contract.icon.enter);
    click(trigger(fixture));
    await settle(fixture);
    expect(glyph()?.getAttribute('data-glyph')).toBe(contract.icon.exit);
  });

  it('asks the agent inside the press', async () => {
    installAgent();
    const fixture = renderTemplate(PANEL);
    await settle(fixture);

    click(trigger(fixture));
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('falls back to the layout without the API and reports it', async () => {
    const fixture = renderTemplate(PANEL);
    await settle(fixture);

    click(trigger(fixture));
    await settle(fixture);
    expect(region(fixture).getAttribute('data-mode')).toBe('layout');
    expect(fixture.componentInstance.errors).toEqual(['unsupported']);
  });

  it('reports the agent leaving as a request with the reason escape', async () => {
    const agent = installAgent();
    const fixture = renderTemplate(PANEL);
    await settle(fixture);
    click(trigger(fixture));
    await settle(fixture);

    agent.leave();
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)).toEqual({ value: false, reason: 'escape' });
    expect(fixture.componentInstance.on()).toBe(false);
    expect(region(fixture).hasAttribute('data-fullscreen')).toBe(false);
  });

  it('carries pointer and keyboard as the reasons of a press', async () => {
    const fixture = renderTemplate(PANEL.replace('slFullscreen ', 'slFullscreen mode="layout" '));
    await settle(fixture);

    click(trigger(fixture), 1);
    click(trigger(fixture), 0);
    expect(fixture.componentInstance.requests).toEqual([
      { value: true, reason: 'pointer' },
      { value: false, reason: 'keyboard' },
    ]);
  });

  it('stays in the layout when the page refuses Escape', async () => {
    const fixture = renderTemplate(PANEL.replace('slFullscreen ', 'slFullscreen mode="layout" '));
    await settle(fixture);
    click(trigger(fixture));
    await settle(fixture);

    fixture.componentInstance.refuse = true;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)).toEqual({ value: false, reason: 'escape' });
    expect(region(fixture).getAttribute('data-mode')).toBe('layout');
  });

  it('leaves the layout on Escape when the page agrees', async () => {
    const fixture = renderTemplate(PANEL.replace('slFullscreen ', 'slFullscreen mode="layout" '));
    await settle(fixture);
    click(trigger(fixture));
    await settle(fixture);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(region(fixture).hasAttribute('data-fullscreen')).toBe(false);
    expect(region(fixture).hasAttribute('data-mode')).toBe(false);
  });

  it('marks the content part with the family identifier on the consumer’s element', () => {
    const fixture = renderTemplate(`<section slFullscreen>
      <main slFullscreenContent id="chart" class="chart"></main>
    </section>`);

    const content = fixture.nativeElement.querySelector('#chart') as HTMLElement;
    expect(content.tagName).toBe('MAIN');
    expect(content.getAttribute('data-ui')).toBe(contract.ui);
    expect(content.getAttribute('data-part')).toBe('content');
    expect(content.classList.contains('chart')).toBe(true);
    expect(content.parentElement).toBe(region(fixture));
  });

  it('keeps the words as the name of an icon-only control, and projects the consumer’s', () => {
    const fixture = renderTemplate(`<section slFullscreen>
      <button slFullscreenTrigger iconOnly></button>
      <button slFullscreenTrigger id="own"><svg slFullscreenIcon></svg>Apresentar</button>
    </section>`);

    expect(trigger(fixture).hasAttribute('data-icon-only')).toBe(true);
    expect(trigger(fixture).textContent?.trim()).toBe('Full screen');
    const own = fixture.nativeElement.querySelector('#own') as HTMLElement;
    expect(own.textContent?.trim()).toBe('Apresentar');
    expect(own.querySelector('[data-part="icon"] > svg[slFullscreenIcon]')).not.toBeNull();
    expect(own.querySelector('[data-glyph]')).toBeNull();
  });

  it('reads size and variant from the provider, and the instance wins', () => {
    const fixture = renderTemplate(
      `<section slFullscreen><button slFullscreenTrigger size="lg"></button></section>`,
      [provideFullscreenDefaults({ size: 'sm', variant: 'outline' })],
    );

    expect(trigger(fixture).getAttribute('data-size')).toBe('lg');
    expect(trigger(fixture).getAttribute('data-variant')).toBe('outline');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<section slFullscreen><button slFullscreenTrigger></button></section>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(trigger(fixture).textContent?.trim()).toBe('Tela cheia');

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture).textContent?.trim()).toBe('Full screen');
  });

  it('drives a region from a control outside it through the exported instance', async () => {
    const fixture = renderTemplate(`<button [slFullscreenTrigger]="fs"></button>
      <section slFullscreen #fs="slFullscreen" mode="layout"></section>`);
    await settle(fixture);

    click(trigger(fixture));
    await settle(fixture);
    expect(region(fixture).getAttribute('data-mode')).toBe('layout');
    expect(trigger(fixture).textContent?.trim()).toBe('Exit full screen');
  });

  it('leaves native full screen when it is destroyed in it', async () => {
    installAgent();
    const fixture = renderTemplate(PANEL);
    await settle(fixture);
    click(trigger(fixture));
    await settle(fixture);

    fixture.destroy();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });
});
