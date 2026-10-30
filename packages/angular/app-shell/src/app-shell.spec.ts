import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import {
  SlAppShell,
  SlAppShellActions,
  SlAppShellAside,
  SlAppShellAsideBody,
  SlAppShellAsideHeader,
  SlAppShellAsideResizer,
  SlAppShellAsideToggle,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellFooter,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavRail,
  SlAppShellNavToggle,
  SlAppShellProgress,
} from './app-shell';
import { provideProgressIndicatorDefaults } from '@slotted/angular/progress-indicator';
import { provideAppShellDefaults } from './app-shell-defaults';
import type {
  AppShellAsideExtentRequest,
  AppShellCanvas,
  AppShellOpenRequest,
  AppShellPrimary,
  AppShellSeparation,
} from './app-shell-defaults';

const PARTS = [
  SlAppShell,
  SlAppShellActions,
  SlAppShellAside,
  SlAppShellAsideBody,
  SlAppShellAsideHeader,
  SlAppShellAsideResizer,
  SlAppShellAsideToggle,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellFooter,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavRail,
  SlAppShellNavToggle,
];

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div
    slAppShell
    #shell="slAppShell"
    navMode="inline"
    asideMode="inline"
    [(navOpen)]="open"
    [(asideOpen)]="asideOpen"
    [canvas]="canvas()"
    [primary]="primary()"
    [separation]="separation()"
    (navOpenChangeRequest)="requests.push($event)"
    (asideOpenChangeRequest)="asideRequests.push($event)"
  >
    <header slAppShellBanner>
      <div slAppShellBrand><button slAppShellNavToggle></button></div>
      <div slAppShellActions><button type="button">Conta</button></div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavRail class="rail" aria-label="Sections"><a href="#sales">Sales</a></div>
      <div slAppShellNavBody><a href="#dashboard">Dashboard</a></div>
    </nav>
    <main slAppShellMain>Encomendas</main>
    <aside slAppShellAside>
      <div slAppShellAsideHeader><span>Detalhe</span><button slAppShellAsideToggle></button></div>
      <div slAppShellAsideBody>ENC-4521</div>
    </aside>
    <footer slAppShellFooter>Aurora 4.2.0</footer>
  </div>`,
})
class Host {
  readonly open = signal(true);
  readonly asideOpen = signal(true);
  readonly asideRequests: AppShellOpenRequest[] = [];
  readonly canvas = signal<AppShellCanvas>('inset');
  readonly primary = signal<AppShellPrimary | undefined>(undefined);
  readonly separation = signal<AppShellSeparation | undefined>(undefined);
  readonly requests: AppShellOpenRequest[] = [];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div
    slAppShell
    navMode="inline"
    [(navOpen)]="open"
    (navOpenChangeRequest)="$event.cancel()"
  >
    <header slAppShellBanner>
      <div slAppShellBrand><button slAppShellNavToggle></button></div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavBody><a href="#dashboard">Dashboard</a></div>
    </nav>
    <main slAppShellMain>Orders</main>
  </div>`,
})
class CancellingHost {
  readonly open = signal(true);
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div
    slAppShell
    navMode="overlay"
    asideMode="overlay"
    [(navOpen)]="open"
    [(asideOpen)]="asideOpen"
    (navOpenChangeRequest)="requests.push($event)"
    (asideOpenChangeRequest)="requests.push($event)"
  >
    <header slAppShellBanner>
      <div slAppShellBrand><button slAppShellNavToggle></button></div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavBody><a href="#dashboard">Dashboard</a></div>
    </nav>
    <main slAppShellMain>Orders</main>
    <aside slAppShellAside><div slAppShellAsideBody>ENC-4521</div></aside>
  </div>`,
})
class ForcedHost {
  readonly open = signal(true);
  readonly asideOpen = signal(true);
  readonly requests: AppShellOpenRequest[] = [];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div slAppShell navMode="overlay" [(navOpen)]="open">
    <header slAppShellBanner>
      <div slAppShellBrand><button slAppShellNavToggle></button></div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavBody><a href="#dashboard">Dashboard</a></div>
    </nav>
    <main slAppShellMain>Orders</main>
  </div>`,
})
class ClosedOverlayHost {
  readonly open = signal(false);
}

@Component({
  standalone: true,
  imports: [...PARTS, RouterLink],
  template: `<div slAppShell navMode="overlay" [(navOpen)]="open">
    <nav slAppShellNav>
      <div slAppShellNavBody>
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/loads" aria-disabled="true" (click)="$event.preventDefault()">Loads</a>
      </div>
    </nav>
    <main slAppShellMain>Encomendas</main>
  </div>`,
})
class RoutedHost {
  readonly open = signal(true);
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div
    slAppShell
    navMode="inline"
    [asideMode]="asideMode()"
    [navSide]="navSide()"
    [(asideOpen)]="asideOpen"
    [(asideExtent)]="extent"
    [minAsideExtent]="min()"
    [maxAsideExtent]="max()"
    (asideExtentChangeRequest)="record($event)"
  >
    <main slAppShellMain>Encomendas</main>
    <aside slAppShellAside>
      <div slAppShellAsideResizer [style.direction]="direction()"></div>
      <div slAppShellAsideBody [inset]="inset()">ENC-4521</div>
    </aside>
  </div>`,
})
class ResizableHost {
  readonly asideMode = signal<'inline' | 'overlay'>('inline');
  readonly navSide = signal<'start' | 'end'>('start');
  readonly asideOpen = signal(true);
  readonly extent = signal<number | undefined>(0.3);
  readonly min = signal(0.16);
  readonly max = signal(0.6);
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly inset = signal<'none' | undefined>(undefined);
  readonly extents: AppShellAsideExtentRequest[] = [];
  cancelling = false;

  record(request: AppShellAsideExtentRequest) {
    this.extents.push(request);
    if (this.cancelling) request.cancel();
  }
}

@Component({ standalone: true, template: '' })
class Destination {}

/** The shells `setup` builds are in Brazilian Portuguese: the words come from the pt-BR catalog. */
const locale = signal('pt-BR');

function setup(providers: unknown[] = []) {
  locale.set('pt-BR');
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      ...(providers as never[]),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const query = (fixture: ReturnType<typeof setup>, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

describe('SlAppShell', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('earns five landmarks from the elements, with no role written', () => {
    const fixture = setup();

    expect(query(fixture, '[data-part="root"]').tagName).toBe('DIV');
    expect(query(fixture, '[data-part="banner"]').tagName).toBe('HEADER');
    expect(query(fixture, '[data-part="nav"]').tagName).toBe('NAV');
    expect(query(fixture, '[data-part="main"]').tagName).toBe('MAIN');
    expect(query(fixture, '[data-part="aside"]').tagName).toBe('ASIDE');
    expect(query(fixture, '[data-part="footer"]').tagName).toBe('FOOTER');
    expect(fixture.nativeElement.querySelectorAll('[role]')).toHaveLength(0);
  });

  /**
   * A browser focuses the nearest focusable ancestor of a pressed element; a
   * `main` that is focusable all the time takes the focus of every click on
   * its text, and the next Shift draws the ring around the page.
   */
  it('focuses the content region from the skip link only, and never from a click inside it', () => {
    const press = (target: Element) => {
      target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      const focusable = target.closest<HTMLElement>('[tabindex], a[href], button');
      if (focusable === null) (document.activeElement as HTMLElement | null)?.blur();
      else focusable.focus();
    };
    const fixture = setup();
    const main = query(fixture, '[data-part="main"]');

    press(main);
    expect(document.activeElement).not.toBe(main);
    expect(main.hasAttribute('tabindex')).toBe(false);

    query(fixture, `[data-part="skip"] a[href="#${main.id}"]`).click();
    expect(document.activeElement).toBe(main);

    press(main);
    expect(document.activeElement).not.toBe(main);
    expect(main.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps a tabindex the consumer wrote on the content region', () => {
    @Component({
      standalone: true,
      imports: PARTS,
      template: `<div slAppShell><main slAppShellMain tabindex="-1"></main></div>`,
    })
    class Written {}
    TestBed.configureTestingModule({ imports: [Written] });
    const fixture = TestBed.createComponent(Written);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('main').getAttribute('tabindex')).toBe('-1');
  });

  it('writes one skip link per region that rendered', () => {
    const fixture = setup();
    const links = [...fixture.nativeElement.querySelectorAll('[data-part="skip"] a')];

    expect(links.map((link: HTMLAnchorElement) => link.textContent?.trim())).toEqual([
      // language: pt-BR
      'Pular para o conteúdo',
      'Pular para a navegação',
      'Pular para o painel lateral',
      // language: en-US
    ]);
    expect(links[0]?.getAttribute('href')).toBe(`#${query(fixture, '[data-part="main"]').id}`);
  });

  it('wires the toggle to the region it controls, by the Disclosure pattern', () => {
    const fixture = setup();
    const toggle = query(fixture, '[data-part="nav-toggle"]');

    expect(toggle.getAttribute('type')).toBe('button');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(query(fixture, '[data-part="nav"]').id);
    // language: pt-BR
    expect(toggle.getAttribute('aria-label')).toBe('Fechar navegação');
    // language: en-US
  });

  it('names the navigation region from the family’s own strings', () => {
    const fixture = setup();
    expect(query(fixture, '[data-part="nav"]').getAttribute('aria-label')).toBe(
      // language: pt-BR
      'Navegação principal',
      // language: en-US
    );
  });

  it('moves the two-way value and says why, telling a press from a keystroke', () => {
    const fixture = setup();
    const host = fixture.componentInstance;
    const toggle = query(fixture, '[data-part="nav-toggle"]');

    const glyph = () =>
      toggle.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    /* The mark says what a press does: the region closes while it is open. */
    expect(glyph()).toBe('panel-close');

    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('pointer');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // language: pt-BR
    expect(toggle.getAttribute('aria-label')).toBe('Abrir navegação');
    // language: en-US
    expect(glyph()).toBe('panel-open');

    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    fixture.detectChanges();
    expect(host.open()).toBe(true);
    expect(host.requests.at(-1)?.reason).toBe('keyboard');
  });

  it('commits nothing when the consumer cancels the request', () => {
    TestBed.configureTestingModule({ imports: [CancellingHost] });
    const fixture = TestBed.createComponent(CancellingHost);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('[data-part="nav-toggle"]') as HTMLElement;
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('writes every axis into the DOM, so a consumer can style any of them', () => {
    const fixture = setup();
    const root = query(fixture, '[data-ui="app-shell"]');

    expect(root.getAttribute('data-primary')).toBe('banner');
    expect(root.getAttribute('data-canvas')).toBe('inset');
    expect(root.getAttribute('data-nav-mode')).toBe('inline');
    expect(root.getAttribute('data-nav-side')).toBe('start');
    expect(root.getAttribute('data-nav-size')).toBe('md');
    expect(root.getAttribute('data-aside-size')).toBe('md');
    expect(root.getAttribute('data-collapsed-to')).toBe('rail');
    expect(root.getAttribute('data-scroll')).toBe('content');
    expect(root.getAttribute('data-separation')).toBe('rule');
    expect(root.hasAttribute('data-dividers')).toBe(false);
    expect(root.hasAttribute('data-open')).toBe(true);

    fixture.componentInstance.canvas.set('flush');
    fixture.detectChanges();
    expect(root.getAttribute('data-canvas')).toBe('flush');
  });

  it('draws every canvas, every primary region and both separations it declares', () => {
    const fixture = setup();
    const root = query(fixture, '[data-ui="app-shell"]');

    fixture.componentInstance.canvas.set('floating');
    fixture.componentInstance.primary.set('main');
    fixture.componentInstance.separation.set('tone');
    fixture.detectChanges();
    expect(root.getAttribute('data-canvas')).toBe('floating');
    expect(root.getAttribute('data-primary')).toBe('main');
    expect(root.getAttribute('data-separation')).toBe('tone');

    fixture.componentInstance.canvas.set('panel');
    fixture.detectChanges();
    expect(root.getAttribute('data-canvas')).toBe('panel');
  });

  it('takes the separation from the provider, and an instance overrules it', () => {
    const fixture = setup([provideAppShellDefaults({ separation: 'tone' })]);
    const root = query(fixture, '[data-ui="app-shell"]');
    expect(root.getAttribute('data-separation')).toBe('tone');

    fixture.componentInstance.separation.set('rule');
    fixture.detectChanges();
    expect(root.getAttribute('data-separation')).toBe('rule');
  });

  it('renders a rail of its own inside the one navigation landmark', () => {
    const fixture = setup();
    const rail = query(fixture, '.rail');

    expect(rail.getAttribute('data-part')).toBe('nav-rail');
    expect(rail.getAttribute('aria-label')).toBe('Sections');
    expect(rail.parentElement?.getAttribute('data-part')).toBe('nav');
    expect(fixture.nativeElement.querySelectorAll('nav').length).toBe(1);
  });

  it('lets an application state the axes once, and an instance overrule any of them', () => {
    const fixture = setup([provideAppShellDefaults({ navSize: 'lg', primary: 'nav' })]);
    const root = query(fixture, '[data-ui="app-shell"]');

    expect(root.getAttribute('data-primary')).toBe('nav');
    expect(root.getAttribute('data-nav-size')).toBe('lg');
    /* The template writes navMode itself, and the instance still wins. */
    expect(root.getAttribute('data-nav-mode')).toBe('inline');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const fixture = setup();
    const toggle = query(fixture, '[data-part="nav-toggle"]');
    // language: pt-BR
    expect(toggle.getAttribute('aria-label')).toBe('Fechar navegação');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-label')).toBe('Close navigation');
    expect(query(fixture, '[data-part="nav"]').getAttribute('aria-label')).toBe('Main navigation');
  });

  it('publishes the imperative actions an input cannot express', () => {
    const fixture = setup();
    const shell = fixture.debugElement.children[0]?.injector.get(SlAppShell);

    shell?.closeNav();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('programmatic');

    shell?.openNav();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  /**
   * The secondary pane holds the second open state, under the same capability
   * and with the same shape: a two-way model, a request with a reason, a
   * control wired by the shell, and its own attribute on the region.
   */
  describe('the secondary pane', () => {
    it('is open by default, says so on the region, and closes from its own control', () => {
      const fixture = setup();
      const host = fixture.componentInstance;
      const aside = query(fixture, '[data-part="aside"]');
      const toggle = query(fixture, '[data-part="aside-toggle"]');

      expect(aside.hasAttribute('data-open')).toBe(true);
      // language: pt-BR
      expect(aside.getAttribute('aria-label')).toBe('Painel lateral');
      // language: en-US
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.getAttribute('aria-controls')).toBe(aside.getAttribute('id'));
      // language: pt-BR
      expect(toggle.getAttribute('aria-label')).toBe('Fechar painel lateral');
      // language: en-US

      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      fixture.detectChanges();
      expect(host.asideOpen()).toBe(false);
      expect(host.asideRequests.at(-1)?.reason).toBe('pointer');
      expect(aside.hasAttribute('data-open')).toBe(false);
      /* The host's attribute is the navigation's, and it does not move. */
      expect(query(fixture, '[data-part="root"]').hasAttribute('data-open')).toBe(true);
      // language: pt-BR
      expect(toggle.getAttribute('aria-label')).toBe('Abrir painel lateral');
      // language: en-US
    });

    it('writes no skip link to a pane the reader closed', () => {
      const fixture = setup();
      fixture.componentInstance.asideOpen.set(false);
      fixture.detectChanges();
      const labels = [...fixture.nativeElement.querySelectorAll('[data-part="skip"] a')].map(
        (a: Element) => a.textContent?.trim(),
      );
      // language: pt-BR
      expect(labels).not.toContain('Pular para o painel lateral');
      // language: en-US
    });

    it('publishes the pane on the instance, with the reason programmatic', () => {
      const fixture = setup();
      const shell = fixture.debugElement.children[0]?.injector.get(SlAppShell);

      shell?.closeAside();
      fixture.detectChanges();
      expect(fixture.componentInstance.asideOpen()).toBe(false);
      expect(fixture.componentInstance.asideRequests.at(-1)?.reason).toBe('programmatic');

      shell?.openAside();
      fixture.detectChanges();
      expect(fixture.componentInstance.asideOpen()).toBe(true);
    });

    it('writes the pane mode into the DOM, from the provider when the instance says nothing', () => {
      TestBed.configureTestingModule({
        imports: [CancellingHost],
        providers: [provideAppShellDefaults({ asideMode: 'overlay' })],
      });
      const fixture = TestBed.createComponent(CancellingHost);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('[data-part="root"]') as HTMLElement;
      expect(root.getAttribute('data-aside-mode')).toBe('overlay');
    });

    it('lets the instance win over the provider', () => {
      const stated = setup([provideAppShellDefaults({ asideMode: 'overlay' })]);
      expect(query(stated, '[data-part="root"]').getAttribute('data-aside-mode')).toBe('inline');
    });
  });

  /**
   * A mode forced to overlay is where the region starts, not a width it
   * crossed: the first run of the crossing effect closed a region the template
   * had just opened, and the overlay scenes photographed a closed panel.
   */
  it('keeps a region the template opened in a forced overlay mode open', async () => {
    TestBed.configureTestingModule({ imports: [ForcedHost] });
    const fixture = TestBed.createComponent(ForcedHost);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.open()).toBe(true);
    expect(host.asideOpen()).toBe(true);
    expect(host.requests).toEqual([]);
  });

  /**
   * The stylesheet fades the veil in from `entering` and out through
   * `exiting`, and a veil mounted straight at `open` gives that transition no
   * closed style to start from: it appeared in one frame beside a panel that
   * took two hundred milliseconds to arrive. The presence module holds the two
   * extra statuses, as it does for `dialog`.
   */
  it('fades the veil in through entering, and holds it through exiting', async () => {
    TestBed.configureTestingModule({ imports: [ClosedOverlayHost] });
    const fixture = TestBed.createComponent(ClosedOverlayHost);
    fixture.detectChanges();
    const scrim = () =>
      fixture.nativeElement.querySelector('[data-part="scrim"]') as HTMLElement | null;
    const frame = async () => {
      await new Promise<void>((done) => requestAnimationFrame(() => done()));
      fixture.detectChanges();
    };

    expect(scrim()).toBeNull();

    query(fixture as never, '[data-part="nav-toggle"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    fixture.detectChanges();
    expect(scrim()?.getAttribute('data-status')).toBe('entering');

    await frame();
    expect(scrim()?.getAttribute('data-status')).toBe('open');

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(scrim()?.getAttribute('data-status')).toBe('exiting');

    await frame();
    expect(scrim()).toBeNull();
  });

  describe('the pane edge', () => {
    const measured = HTMLElement.prototype.getBoundingClientRect;
    beforeAll(() => {
      const element = Element.prototype as unknown as Record<string, unknown>;
      element['setPointerCapture'] ??= () => {};
      element['releasePointerCapture'] ??= () => {};
      element['hasPointerCapture'] ??= () => true;
    });
    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = measured;
    });

    /** jsdom lays nothing out, so the shell is given an inline size once, here. */
    function measureShellAs(width: number) {
      HTMLElement.prototype.getBoundingClientRect = () =>
        ({
          bottom: 800,
          height: 800,
          left: 0,
          right: width,
          toJSON: () => ({}),
          top: 0,
          width,
          x: 0,
          y: 0,
        }) as DOMRect;
    }

    const find = (fixture: { nativeElement: HTMLElement }, selector: string) =>
      fixture.nativeElement.querySelector(selector) as HTMLElement;

    function resizable() {
      TestBed.configureTestingModule({
        imports: [ResizableHost],
        providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
      });
      const fixture = TestBed.createComponent(ResizableHost);
      fixture.detectChanges();
      const edge = () =>
        fixture.nativeElement.querySelector('[data-part="aside-resizer"]') as HTMLElement;
      const key = (name: string, shiftKey = false) => {
        edge().dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name, shiftKey }),
        );
        fixture.detectChanges();
      };
      return { fixture, host: fixture.componentInstance, edge, key };
    }

    it('draws the splitter mark, line, grip and line, at rest', () => {
      const { edge } = resizable();
      const marks = [...edge().children].map((mark) => mark.getAttribute('data-part'));
      expect(marks).toEqual(['line', 'grip', 'line']);
      expect(edge().querySelector('[data-part="grip"]')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('is a focusable separator for the pane, valued in whole percentages of the shell', () => {
      const { fixture, edge } = resizable();
      const aside = find(fixture, '[data-part="aside"]');
      expect(edge().getAttribute('role')).toBe('separator');
      expect(edge().getAttribute('tabindex')).toBe('0');
      expect(edge().getAttribute('aria-orientation')).toBe('vertical');
      expect(edge().getAttribute('aria-controls')).toBe(aside.id);
      expect(edge().getAttribute('aria-valuemin')).toBe('16');
      expect(edge().getAttribute('aria-valuemax')).toBe('60');
      expect(edge().getAttribute('aria-valuenow')).toBe('30');
      // language: pt-BR
      expect(edge().getAttribute('aria-label')).toBe('Redimensionar painel');
      // language: en-US
    });

    it('takes its limits from the shell', () => {
      const { fixture, host, edge } = resizable();
      host.min.set(0.2);
      host.max.set(0.5);
      fixture.detectChanges();
      expect(edge().getAttribute('aria-valuemin')).toBe('20');
      expect(edge().getAttribute('aria-valuemax')).toBe('50');
    });

    it('moves the edge sixteen pixels per arrow and sixty-four with Shift, and says keyboard', () => {
      measureShellAs(1000);
      const { fixture, host, key } = resizable();
      const from = (value: number) => {
        host.extent.set(value);
        fixture.detectChanges();
      };

      key('ArrowLeft');
      expect(host.extent()).toBeCloseTo(0.316, 5);
      expect(host.extents.at(-1)?.reason).toBe('keyboard');
      from(0.3);
      key('ArrowRight');
      expect(host.extent()).toBeCloseTo(0.284, 5);
      from(0.3);
      key('ArrowLeft', true);
      expect(host.extent()).toBeCloseTo(0.364, 5);
      key('Home');
      expect(host.extent()).toBe(0.16);
      key('End');
      expect(host.extent()).toBe(0.6);
      expect(host.extents.at(-1)?.reason).toBe('keyboard');
    });

    it('commits nothing when the consumer cancels the request', () => {
      measureShellAs(1000);
      const { host, key } = resizable();
      host.cancelling = true;
      key('ArrowLeft');
      expect(host.extent()).toBe(0.3);
    });

    it('turns the arrows round where the pane stands at the start, and in a mirrored line', () => {
      measureShellAs(1000);
      const { fixture, host, key } = resizable();
      host.navSide.set('end');
      fixture.detectChanges();
      key('ArrowLeft');
      expect(host.extent()).toBeCloseTo(0.284, 5);

      host.navSide.set('start');
      host.direction.set('rtl');
      host.extent.set(0.3);
      fixture.detectChanges();
      key('ArrowLeft');
      expect(host.extent()).toBeCloseTo(0.284, 5);
    });

    it('follows a drag from where it was grabbed, and marks the root while it lasts', () => {
      measureShellAs(1000);
      const { fixture, host, edge } = resizable();
      const root = find(fixture, '[data-part="root"]');
      const pointer = (type: string, clientX: number) => {
        edge().dispatchEvent(
          new PointerEvent(type, { bubbles: true, button: 0, clientX, pointerId: 1 }),
        );
        fixture.detectChanges();
      };

      pointer('pointerdown', 700);
      pointer('pointermove', 600);
      expect(root.hasAttribute('data-dragging')).toBe(true);
      expect(host.extent()).toBeCloseTo(0.4, 5);
      expect(host.extents.at(-1)?.reason).toBe('pointer');
      pointer('pointerup', 600);
      expect(root.hasAttribute('data-dragging')).toBe(false);
    });

    it('writes the extent as the width of the column, and nothing while it is unset', () => {
      const { fixture, host } = resizable();
      const aside = find(fixture, '[data-part="aside"]');
      expect(aside.style.getPropertyValue('--slotted-app-shell-aside-extent')).toBe('30cqi');

      host.extent.set(undefined);
      fixture.detectChanges();
      expect(aside.style.getPropertyValue('--slotted-app-shell-aside-extent')).toBe('');
    });

    it('draws no edge where the pane is a layer, or closed', () => {
      const { fixture, host, edge } = resizable();
      expect(edge().hidden).toBe(false);

      host.asideMode.set('overlay');
      fixture.detectChanges();
      expect(edge().hidden).toBe(true);

      host.asideMode.set('inline');
      host.asideOpen.set(false);
      fixture.detectChanges();
      expect(edge().hidden).toBe(true);
    });

    it('stands the body on the pane inset unless the content brings its own', () => {
      const { fixture, host } = resizable();
      const body = find(fixture, '[data-part="aside-body"]');
      expect(body.hasAttribute('data-inset')).toBe(false);
      host.inset.set('none');
      fixture.detectChanges();
      expect(body.getAttribute('data-inset')).toBe('none');
    });
  });

  describe('a destination in the overlaid navigation', () => {
    async function routed() {
      TestBed.configureTestingModule({
        imports: [RoutedHost],
        providers: [provideRouter([{ path: '**', component: Destination }])],
      });
      const fixture = TestBed.createComponent(RoutedHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const choose = async (name: string) => {
        const link = [...fixture.nativeElement.querySelectorAll('a')].find(
          (a: HTMLAnchorElement) => a.textContent?.trim() === name,
        ) as HTMLAnchorElement;
        link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
        fixture.detectChanges();
        await fixture.whenStable();
      };
      return { fixture, choose };
    }

    /**
     * RouterLink calls preventDefault on its anchor's click before the click
     * reaches the root. Reading defaultPrevented as a refusal kept every
     * routed destination open, and a phone paid two taps per destination.
     */
    it('closes on a RouterLink, whose router prevented the native navigation', async () => {
      const { fixture, choose } = await routed();
      await choose('Dashboard');
      expect(fixture.componentInstance.open()).toBe(false);
    });

    it('stays open on a disabled destination', async () => {
      const { fixture, choose } = await routed();
      await choose('Loads');
      expect(fixture.componentInstance.open()).toBe(true);
    });
  });
});

@Component({
  standalone: true,
  imports: [SlAppShell, SlAppShellBanner, SlAppShellMain, SlAppShellProgress],
  template: `<div slAppShell navMode="inline">
    <header slAppShellBanner></header>
    <main slAppShellMain>Encomendas</main>
    <div slAppShellProgress [loading]="loading()" (withdraw)="withdrawals = withdrawals + 1"></div>
  </div>`,
})
class ProgressShellHost {
  readonly loading = signal(true);
  withdrawals = 0;
}

describe('the wait for the next page', () => {
  const main = (root: HTMLElement) => root.querySelector('main') as HTMLElement;
  const bar = (root: HTMLElement) =>
    root.querySelector('[data-part="progress"] > [data-ui="progress-indicator"]') as HTMLElement;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('marks the content busy for exactly as long as the bar is painted', () => {
    const fixture = TestBed.createComponent(ProgressShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(bar(root).hasAttribute('hidden')).toBe(true);
    expect(main(root).hasAttribute('aria-busy')).toBe(false);

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(bar(root).hasAttribute('hidden')).toBe(false);
    expect(bar(root).getAttribute('data-placement')).toBe('edge-start');
    expect(bar(root).getAttribute('data-size')).toBe('sm');
    expect(main(root).getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(main(root).getAttribute('aria-busy')).toBe('true');
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(bar(root).hasAttribute('hidden')).toBe(true);
    expect(main(root).hasAttribute('aria-busy')).toBe(false);
    expect(fixture.componentInstance.withdrawals).toBe(1);
  });

  it('names the wait from the catalog, and takes the timing an application set once', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
        provideProgressIndicatorDefaults({ delay: 0, minDuration: 0 }),
      ],
    });
    const fixture = TestBed.createComponent(ProgressShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(bar(root).hasAttribute('hidden')).toBe(false);
    expect(bar(root).querySelector('[data-part="label"]')?.textContent?.trim()).toBe(
      // language: pt-BR
      'Carregando página',
      // language: en-US
    );
    expect(main(root).getAttribute('aria-busy')).toBe('true');
  });
});

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div slAppShell [navOpen]="defaultOpen" (navOpenChangeRequest)="requests.push($event)">
    <nav slAppShellNav>
      <div slAppShellNavBody><a href="#dashboard">Dashboard</a></div>
    </nav>
    <main slAppShellMain>Orders</main>
  </div>`,
})
class AutoHost {
  defaultOpen = true;
  readonly requests: AppShellOpenRequest[] = [];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<div
    slAppShell
    navMode="overlay"
    asideMode="overlay"
    [navOpen]="true"
    [asideOpen]="true"
  >
    <main slAppShellMain>Encomendas</main>
  </div>`,
})
class RegionlessHost {}

/**
 * The frame's width moves under an uncontrolled shell: jsdom lays nothing out,
 * so the width is a variable the measurement reads and the observer is a list
 * of callbacks the test calls.
 */
describe('across the breakpoint', () => {
  let width = 1280;
  const observers: (() => void)[] = [];

  beforeEach(() => {
    TestBed.resetTestingModule();
    width = 1280;
    observers.length = 0;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          bottom: 800,
          height: 800,
          left: 0,
          right: width,
          toJSON: () => ({}),
          top: 0,
          width,
          x: 0,
          y: 0,
        }) as DOMRect,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function resizeTo(
    fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
    next: number,
  ) {
    width = next;
    for (const notify of observers) notify();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function mount<T>(host: new () => T, configure?: (instance: T) => void) {
    TestBed.configureTestingModule({
      imports: [host as never],
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(host);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    return fixture;
  }

  const root = (element: HTMLElement) =>
    element.querySelector('[data-ui="app-shell"]') as HTMLElement;

  it('restores the open region when the frame widens back into inline', async () => {
    const fixture = mount(AutoHost);
    await resizeTo(fixture, 1280);
    expect(root(fixture.nativeElement).getAttribute('data-nav-mode')).toBe('inline');
    expect(root(fixture.nativeElement).hasAttribute('data-open')).toBe(true);

    await resizeTo(fixture, 360);
    expect(root(fixture.nativeElement).getAttribute('data-nav-mode')).toBe('overlay');
    expect(root(fixture.nativeElement).hasAttribute('data-open')).toBe(false);

    await resizeTo(fixture, 1280);
    expect(root(fixture.nativeElement).getAttribute('data-nav-mode')).toBe('inline');
    expect(root(fixture.nativeElement).hasAttribute('data-open')).toBe(true);
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      value: true,
      reason: 'resize',
    });
  });

  it('keeps a region the reader closed while wide closed after a narrow window', async () => {
    const fixture = mount(AutoHost, (host) => (host.defaultOpen = false));
    await resizeTo(fixture, 360);
    await resizeTo(fixture, 1280);
    expect(root(fixture.nativeElement).hasAttribute('data-open')).toBe(false);
  });

  it('draws no veil and no open state for regions that are not rendered', async () => {
    width = 360;
    const fixture = mount(RegionlessHost);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root(fixture.nativeElement).hasAttribute('data-open')).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-part="scrim"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-part="main"]').hasAttribute('inert')).toBe(
      false,
    );
  });
});
