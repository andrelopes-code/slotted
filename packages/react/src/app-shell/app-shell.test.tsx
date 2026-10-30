import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render as renderBase, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { ProgressIndicatorDefaultsProvider } from '../progress-indicator';

import { AppShell } from './app-shell';
import { AppShellDefaultsProvider } from './app-shell-defaults';
import {
  AppShellActions,
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideHeader,
  AppShellAsideResizer,
  AppShellAsideToggle,
  AppShellBanner,
  AppShellBrand,
  AppShellFooter,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavRail,
  AppShellNavToggle,
  AppShellProgress,
} from './app-shell-parts';
import type { AppShellHandle, AppShellOpenReason, AppShellProps } from './app-shell.types';

/** A click a pointer made reports a detail; one the keyboard synthesised does not. */
const press = (node: Element) => fireEvent.click(node, { detail: 1 });
const activateByKey = (node: Element) => fireEvent.click(node, { detail: 0 });
const escape = () =>
  fireEvent.keyDown(document, { key: 'Escape', bubbles: true, cancelable: true });

/** The shells the tests read are in Brazilian Portuguese: the words come from the pt-BR catalog. */
function PtBr({ children }: { children: ReactNode }) {
  return (
    <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
      {children}
    </SlottedProvider>
  );
}

const render = (ui: ReactElement) => renderBase(ui, { wrapper: PtBr });

function Shell({ children, ...props }: Partial<AppShellProps> = {}) {
  return (
    <AppShell navMode="inline" {...props}>
      <AppShellBanner>
        <AppShellBrand>
          <AppShellNavToggle />
        </AppShellBrand>
        <AppShellActions>
          <button type="button">Conta</button>
        </AppShellActions>
      </AppShellBanner>
      <AppShellNav>
        <AppShellNavBody>
          <a href="#dashboard">Dashboard</a>
          <a href="#encomendas">Encomendas</a>
        </AppShellNavBody>
      </AppShellNav>
      <AppShellMain>{children ?? <p>Encomendas</p>}</AppShellMain>
      <AppShellAside>
        <AppShellAsideHeader>
          <span>Detalhe</span>
          <AppShellAsideToggle />
        </AppShellAsideHeader>
        <AppShellAsideBody>
          <p>ENC-4521</p>
        </AppShellAsideBody>
      </AppShellAside>
      <AppShellFooter>
        <small>Aurora 4.2.0</small>
      </AppShellFooter>
    </AppShell>
  );
}

describe('AppShell', () => {
  it('earns five landmarks from the elements, with no role written', () => {
    const { container } = render(<Shell />);

    expect(container.querySelector('[data-part="root"]')?.tagName).toBe('DIV');
    expect(container.querySelector('[data-part="banner"]')?.tagName).toBe('HEADER');
    expect(container.querySelector('[data-part="nav"]')?.tagName).toBe('NAV');
    expect(container.querySelector('[data-part="main"]')?.tagName).toBe('MAIN');
    expect(container.querySelector('[data-part="aside"]')?.tagName).toBe('ASIDE');
    expect(container.querySelector('[data-part="footer"]')?.tagName).toBe('FOOTER');
    expect(container.querySelectorAll('[role]')).toHaveLength(0);
  });

  /**
   * A browser focuses the nearest focusable ancestor of a pressed element; a
   * `main` that is focusable all the time takes the focus of every click on
   * its text, and the next Shift draws the ring around the page.
   */
  it('focuses the content region from the skip link only, and never from a click inside it', () => {
    const press = (target: Element) => {
      fireEvent.pointerDown(target);
      const focusable = target.closest<HTMLElement>('[tabindex], a[href], button');
      if (focusable === null) (document.activeElement as HTMLElement | null)?.blur();
      else focusable.focus();
    };
    render(
      <AppShell>
        <AppShellMain>
          <p>text</p>
        </AppShellMain>
      </AppShell>,
    );
    const main = screen.getByRole('main');

    press(screen.getByText('text'));
    expect(document.activeElement).not.toBe(main);
    expect(main).not.toHaveAttribute('tabindex');

    fireEvent.click(document.querySelector(`[data-part="skip"] a[href="#${main.id}"]`)!);
    expect(document.activeElement).toBe(main);

    press(screen.getByText('text'));
    expect(document.activeElement).not.toBe(main);
    expect(main).not.toHaveAttribute('tabindex');
  });

  it('keeps a tabIndex the consumer wrote on the content region', () => {
    render(
      <AppShell>
        <AppShellMain tabIndex={-1} />
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('writes one skip link per region that rendered, and no more', () => {
    const { container, rerender } = render(<Shell />);
    const links = () => [...container.querySelectorAll('[data-part="skip"] a')];

    expect(links().map((link) => link.textContent)).toEqual([
      // language: pt-BR
      'Pular para o conteúdo',
      'Pular para a navegação',
      'Pular para o painel lateral',
      // language: en-US
    ]);
    expect(links()[0]?.getAttribute('href')).toBe(`#${screen.getByRole('main').id}`);

    rerender(
      <AppShell navMode="inline">
        <AppShellMain>
          <p>Content only</p>
        </AppShellMain>
      </AppShell>,
    );
    expect(links()).toHaveLength(1);
  });

  /**
   * The regions register in effects, which the server never runs. The skip
   * links a server draws come from the regions written among the shell's
   * children, so a reader who tabs before hydration still finds them.
   */
  it('writes the skip links on the server, before any region has registered', () => {
    const page = new DOMParser().parseFromString(
      renderToString(
        <AppShell navMode="inline">
          <AppShellNav>
            <a href="/a">A</a>
          </AppShellNav>
          <AppShellMain>
            <p>Content</p>
          </AppShellMain>
        </AppShell>,
      ),
      'text/html',
    );
    const hrefs = [...page.querySelectorAll('[data-part="skip"] a')].map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toEqual([
      `#${page.querySelector('[data-part="main"]')?.id}`,
      `#${page.querySelector('[data-part="nav"]')?.id}`,
    ]);
  });

  it('wires the toggle to the region it controls, by the Disclosure pattern', () => {
    render(<Shell />);
    // language: pt-BR
    const toggle = screen.getByRole('button', { name: 'Fechar navegação' });
    // language: en-US

    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.getAttribute('aria-controls')).toBe(screen.getByRole('navigation').id);
  });

  it('names the navigation region, and lets an instance rename it', () => {
    const { rerender } = render(<Shell />);
    // language: pt-BR
    expect(screen.getByRole('navigation')).toHaveAccessibleName('Navegação principal');
    // language: en-US

    rerender(
      <AppShell navMode="inline">
        <AppShellNav aria-label="Rotas">
          <AppShellNavBody>
            <a href="#p">Dashboard</a>
          </AppShellNavBody>
        </AppShellNav>
        <AppShellMain>
          <p>…</p>
        </AppShellMain>
      </AppShell>,
    );
    expect(screen.getByRole('navigation')).toHaveAccessibleName('Rotas');
  });

  it('moves itself when uncontrolled, and says why', () => {
    const onNavOpenChange = vi.fn();
    render(<Shell onNavOpenChange={onNavOpenChange} />);

    // language: pt-BR
    press(screen.getByRole('button', { name: 'Fechar navegação' }));
    // language: en-US

    expect(onNavOpenChange).toHaveBeenCalledTimes(1);
    expect(onNavOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect(onNavOpenChange.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(onNavOpenChange.mock.calls[0]?.[1].previous).toBe(true);
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Abrir navegação' })).toHaveAttribute(
      // language: en-US
      'aria-expanded',
      'false',
    );
  });

  /** A click synthesised by the keyboard reports no detail; a real one does. */
  it('tells a press from a keystroke, because a product persists one and not the other', () => {
    const reasons: AppShellOpenReason[] = [];
    render(<Shell onNavOpenChange={(_, request) => reasons.push(request.reason)} />);

    // language: pt-BR
    activateByKey(screen.getByRole('button', { name: 'Fechar navegação' }));
    // language: en-US
    expect(reasons).toEqual(['keyboard']);
  });

  it('reports and waits when controlled, and never moves itself', () => {
    const onNavOpenChange = vi.fn();
    render(<Shell navOpen onNavOpenChange={onNavOpenChange} />);

    // language: pt-BR
    press(screen.getByRole('button', { name: 'Fechar navegação' }));
    // language: en-US

    expect(onNavOpenChange).toHaveBeenCalledTimes(1);
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar navegação' })).toHaveAttribute(
      // language: en-US
      'aria-expanded',
      'true',
    );
  });

  it('commits nothing when the consumer cancels the request', () => {
    render(<Shell onNavOpenChange={(_, request) => request.cancel()} />);

    // language: pt-BR
    press(screen.getByRole('button', { name: 'Fechar navegação' }));
    // language: en-US

    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar navegação' })).toHaveAttribute(
      // language: en-US
      'aria-expanded',
      'true',
    );
  });

  it('takes the consumer’s own handler first, and composes rather than replaces', () => {
    const order: string[] = [];
    render(
      <AppShell navMode="inline" onNavOpenChange={() => order.push('family')}>
        <AppShellBanner>
          <AppShellBrand>
            <AppShellNavToggle onClick={() => order.push('consumer')} />
          </AppShellBrand>
        </AppShellBanner>
        <AppShellNav>
          <AppShellNavBody>
            <a href="#p">Dashboard</a>
          </AppShellNavBody>
        </AppShellNav>
        <AppShellMain>
          <p>…</p>
        </AppShellMain>
      </AppShell>,
    );

    press(screen.getByRole('button'));
    expect(order).toEqual(['consumer', 'family']);
  });

  it('lets the consumer’s handler stop the family by preventing the event', () => {
    const onNavOpenChange = vi.fn();
    render(
      <AppShell navMode="inline" onNavOpenChange={onNavOpenChange}>
        <AppShellBanner>
          <AppShellBrand>
            <AppShellNavToggle onClick={(event) => event.preventDefault()} />
          </AppShellBrand>
        </AppShellBanner>
        <AppShellNav>
          <AppShellNavBody>
            <a href="#p">Dashboard</a>
          </AppShellNavBody>
        </AppShellNav>
        <AppShellMain>
          <p>…</p>
        </AppShellMain>
      </AppShell>,
    );

    press(screen.getByRole('button'));
    expect(onNavOpenChange).not.toHaveBeenCalled();
  });

  it('writes every axis into the DOM, so a consumer can style any of them', () => {
    const { container } = render(
      <Shell
        asideSize="lg"
        canvas="flush"
        collapsedTo="hidden"
        navSide="end"
        navSize="sm"
        primary="nav"
        scroll="document"
        separation="tone"
      />,
    );
    const root = container.querySelector('[data-ui="app-shell"]');

    expect(root).toHaveAttribute('data-primary', 'nav');
    expect(root).toHaveAttribute('data-canvas', 'flush');
    expect(root).toHaveAttribute('data-nav-side', 'end');
    expect(root).toHaveAttribute('data-nav-size', 'sm');
    expect(root).toHaveAttribute('data-aside-size', 'lg');
    expect(root).toHaveAttribute('data-collapsed-to', 'hidden');
    expect(root).toHaveAttribute('data-scroll', 'document');
    expect(root).toHaveAttribute('data-nav-mode', 'inline');
    expect(root).toHaveAttribute('data-open', '');
    expect(root).toHaveAttribute('data-separation', 'tone');
    expect(root).not.toHaveAttribute('data-dividers');
  });

  it('draws every canvas and every primary region it declares, and a rule by default', () => {
    const { container, rerender } = render(<Shell canvas="floating" primary="main" />);
    const root = container.querySelector('[data-ui="app-shell"]');

    expect(root).toHaveAttribute('data-canvas', 'floating');
    expect(root).toHaveAttribute('data-primary', 'main');
    expect(root).toHaveAttribute('data-separation', 'rule');

    rerender(<Shell canvas="panel" primary="nav" separation="tone" />);
    expect(root).toHaveAttribute('data-canvas', 'panel');
    expect(root).toHaveAttribute('data-separation', 'tone');
  });

  it('takes the separation from the provider, and a shell overrules it', () => {
    const { container, rerender } = render(
      <AppShellDefaultsProvider separation="tone">
        <Shell />
      </AppShellDefaultsProvider>,
    );
    const root = container.querySelector('[data-ui="app-shell"]');
    expect(root).toHaveAttribute('data-separation', 'tone');

    rerender(
      <AppShellDefaultsProvider separation="tone">
        <Shell separation="rule" />
      </AppShellDefaultsProvider>,
    );
    expect(root).toHaveAttribute('data-separation', 'rule');
  });

  it('renders a rail of its own inside the one navigation landmark', () => {
    render(
      <AppShell navMode="inline">
        <AppShellNav>
          <AppShellNavRail aria-label="Sections" className="rail" data-testid="rail">
            <a href="#sales">Sales</a>
          </AppShellNavRail>
          <AppShellNavBody>
            <a href="#orders">Orders</a>
          </AppShellNavBody>
        </AppShellNav>
        <AppShellMain>
          <p>…</p>
        </AppShellMain>
      </AppShell>,
    );
    const rail = screen.getByTestId('rail');

    expect(rail).toHaveAttribute('data-part', 'nav-rail');
    expect(rail).toHaveClass('rail');
    expect(rail).toHaveAttribute('aria-label', 'Sections');
    expect(rail.parentElement).toHaveAttribute('data-part', 'nav');
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  it('lets a consumer substitute the rail element', () => {
    render(
      <AppShell navMode="inline">
        <AppShellNav>
          <AppShellNavRail render={(props) => <section {...props} data-testid="rail" />} />
        </AppShellNav>
        <AppShellMain />
      </AppShell>,
    );
    const rail = screen.getByTestId('rail');
    expect(rail.tagName).toBe('SECTION');
    expect(rail).toHaveAttribute('data-part', 'nav-rail');
  });

  it('lets an application state the thirteen axes once, and a shell overrule any of them', () => {
    const { container } = render(
      <AppShellDefaultsProvider canvas="flush" navSize="lg" primary="nav">
        <Shell navSize="sm" />
      </AppShellDefaultsProvider>,
    );
    const root = container.querySelector('[data-ui="app-shell"]');

    expect(root).toHaveAttribute('data-primary', 'nav');
    expect(root).toHaveAttribute('data-canvas', 'flush');
    /* The shell's own value wins over the provider's. */
    expect(root).toHaveAttribute('data-nav-size', 'sm');
  });

  it('takes the strings from the language in force, and from the instance over it', () => {
    renderBase(<Shell messages={{ close: 'Collapse' }} />);
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toHaveAccessibleName('Main navigation');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });

  /**
   * The overlaid region: a dismissable layer, a focus scope and `inert` on the
   * rest — none of which CSS can hold, which is why the mode is answered twice.
   */
  describe('overlaid', () => {
    it('closes on Escape, and says escape', () => {
      const onNavOpenChange = vi.fn();
      render(<Shell navMode="overlay" onNavOpenChange={onNavOpenChange} />);

      escape();

      expect(onNavOpenChange).toHaveBeenCalledTimes(1);
      expect(onNavOpenChange.mock.calls[0]?.[1].reason).toBe('escape');
    });

    it('refuses Escape when the policy says none', () => {
      const onNavOpenChange = vi.fn();
      render(<Shell escape="none" navMode="overlay" onNavOpenChange={onNavOpenChange} />);

      escape();
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    /**
     * The modal contract, whole: the reader is in the panel and everything
     * beside it is inert — the banner and its toggle included, exactly as a
     * dialog's trigger is. The ways out are Escape, the veil, a destination,
     * and whatever the consumer put inside the panel.
     */
    it('makes every region beside it inert while it is modal', () => {
      const { container } = render(<Shell navMode="overlay" />);

      expect(container.querySelector('[data-part="main"]')).toHaveAttribute('inert');
      expect(container.querySelector('[data-part="aside"]')).toHaveAttribute('inert');
      expect(container.querySelector('[data-part="footer"]')).toHaveAttribute('inert');
      expect(container.querySelector('[data-part="banner"]')).toHaveAttribute('inert');
      expect(container.querySelector('[data-part="nav"]')).not.toHaveAttribute('inert');
    });

    /**
     * The stylesheet fades the veil in from `entering` and out through
     * `exiting`, and a veil mounted straight at `open` gives that transition
     * no closed style to start from: it appeared in one frame beside a panel
     * that took two hundred milliseconds to arrive. The presence module holds
     * the two extra statuses, as it does for `dialog`.
     */
    it('fades the veil in through entering, and holds it through exiting', async () => {
      const { container } = render(<Shell defaultNavOpen={false} navMode="overlay" />);
      const scrim = () => container.querySelector('[data-part="scrim"]');
      const frame = () =>
        act(() => new Promise<void>((done) => requestAnimationFrame(() => done())));

      expect(scrim()).toBeNull();

      // language: pt-BR
      press(screen.getByRole('button', { name: 'Abrir navegação' }));
      // language: en-US
      expect(scrim()).toHaveAttribute('data-status', 'entering');

      await frame();
      expect(scrim()).toHaveAttribute('data-status', 'open');

      escape();
      expect(scrim()).toHaveAttribute('data-status', 'exiting');

      await frame();
      expect(scrim()).toBeNull();
    });

    it('inerts nothing when it is not modal, and draws no veil', () => {
      const { container } = render(<Shell modal={false} navMode="overlay" />);

      expect(container.querySelector('[data-part="main"]')).not.toHaveAttribute('inert');
      expect(container.querySelector('[data-part="scrim"]')).toBeNull();
    });

    it('closes when a destination is chosen, and says select', () => {
      const onNavOpenChange = vi.fn();
      render(<Shell navMode="overlay" onNavOpenChange={onNavOpenChange} />);

      const link = screen.getByRole('link', { name: 'Dashboard' });
      /* The press has to begin where it lands, or the layer reads the click as
         a press that started outside it. */
      fireEvent.pointerDown(link);
      press(link);

      expect(onNavOpenChange.mock.calls.at(-1)?.[1].reason).toBe('select');
    });

    /**
     * A client-side router's link calls preventDefault on its own click before
     * the click reaches the root: React Router's Link and Next's Link both do.
     * Reading defaultPrevented as a refusal kept every routed destination open.
     */
    it('closes on a destination whose router prevented the native navigation', () => {
      const onNavOpenChange = vi.fn();
      render(
        <AppShell navMode="overlay" onNavOpenChange={onNavOpenChange}>
          <AppShellNav>
            <AppShellNavBody>
              <a href="/dashboard" onClick={(event) => event.preventDefault()}>
                Dashboard
              </a>
            </AppShellNavBody>
          </AppShellNav>
          <AppShellMain>Encomendas</AppShellMain>
        </AppShell>,
      );

      const link = screen.getByRole('link', { name: 'Dashboard' });
      fireEvent.pointerDown(link);
      press(link);

      expect(onNavOpenChange.mock.calls.at(-1)?.[1].reason).toBe('select');
    });

    it('leaves the region open on a disabled destination', () => {
      const onNavOpenChange = vi.fn();
      render(
        <AppShell navMode="overlay" onNavOpenChange={onNavOpenChange}>
          <AppShellNav>
            <AppShellNavBody>
              <a aria-disabled="true" href="/dashboard" onClick={(event) => event.preventDefault()}>
                Dashboard
              </a>
            </AppShellNavBody>
          </AppShellNav>
          <AppShellMain>Encomendas</AppShellMain>
        </AppShell>,
      );

      const link = screen.getByRole('link', { name: 'Dashboard' });
      fireEvent.pointerDown(link);
      press(link);

      expect(onNavOpenChange).not.toHaveBeenCalled();
    });

    it('leaves the region open on a destination when the axis says so', () => {
      const onNavOpenChange = vi.fn();
      render(<Shell closeOnNavigate={false} navMode="overlay" onNavOpenChange={onNavOpenChange} />);

      const link = screen.getByRole('link', { name: 'Dashboard' });
      fireEvent.pointerDown(link);
      press(link);
      expect(onNavOpenChange).not.toHaveBeenCalled();
    });
  });

  it('publishes the imperative actions a prop cannot express', () => {
    function Harness() {
      const [handle, setHandle] = useState<{ openNav: () => void; closeNav: () => void } | null>(
        null,
      );
      return (
        <>
          <button onClick={() => handle?.closeNav()} type="button">
            close
          </button>
          <AppShell navMode="inline" ref={setHandle}>
            <AppShellBanner>
              <AppShellBrand>
                <AppShellNavToggle />
              </AppShellBrand>
            </AppShellBanner>
            <AppShellNav>
              <AppShellNavBody>
                <a href="#p">Dashboard</a>
              </AppShellNavBody>
            </AppShellNav>
            <AppShellMain>
              <p>…</p>
            </AppShellMain>
          </AppShell>
        </>
      );
    }

    render(<Harness />);
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar navegação' })).toHaveAttribute(
      // language: en-US
      'aria-expanded',
      'true',
    );
  });

  it('substitutes the root element and keeps every attribute on it', () => {
    const { container } = render(
      <AppShell data-testid="frame" navMode="inline" render={(props) => <section {...props} />}>
        <AppShellMain>
          <p>…</p>
        </AppShellMain>
      </AppShell>,
    );
    const root = container.querySelector('[data-ui="app-shell"]');

    expect(root?.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-testid', 'frame');
    expect(root).toHaveAttribute('data-part', 'root');
  });

  /**
   * The secondary pane holds the second open state, under the same capability
   * and with the same shape: a pair, a request with a reason, a control wired
   * by context, and a layer composed from the same three modules.
   */
  describe('the secondary pane', () => {
    it('is open by default, says so on the region, and closes from its own control', () => {
      const onAsideOpenChange = vi.fn();
      const { container } = render(
        <Shell asideMode="inline" onAsideOpenChange={onAsideOpenChange} />,
      );
      const aside = container.querySelector('[data-part="aside"]');
      // language: pt-BR
      const toggle = screen.getByRole('button', { name: 'Fechar painel lateral' });
      // language: en-US

      expect(aside).toHaveAttribute('data-open');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-controls', aside?.getAttribute('id'));
      /* The root's attribute is the navigation's, and it does not move. */
      expect(container.querySelector('[data-ui="app-shell"]')).toHaveAttribute('data-open');

      press(toggle);
      expect(onAsideOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(aside).not.toHaveAttribute('data-open');
      expect(container.querySelector('[data-ui="app-shell"]')).toHaveAttribute('data-open');
      // language: pt-BR
      expect(screen.getByRole('button', { name: 'Abrir painel lateral' })).toHaveAttribute(
        // language: en-US
        'aria-expanded',
        'false',
      );
    });

    /* The mark says what a press does: the pane closes while it is open. */
    it('draws the panel mark for the press it offers', () => {
      render(<Shell asideMode="inline" />);
      const glyph = (name: string) =>
        screen
          .getByRole('button', { name })
          .querySelector('[data-ui="icon"] > svg[data-glyph]')
          ?.getAttribute('data-glyph');

      // language: pt-BR
      expect(glyph('Fechar navegação')).toBe('panel-close');
      expect(glyph('Fechar painel lateral')).toBe('panel-close');
      // language: en-US

      // language: pt-BR
      press(screen.getByRole('button', { name: 'Fechar navegação' }));
      press(screen.getByRole('button', { name: 'Fechar painel lateral' }));
      expect(glyph('Abrir navegação')).toBe('panel-open');
      expect(glyph('Abrir painel lateral')).toBe('panel-open');
      // language: en-US
    });

    it('starts closed when told, and reports and waits when controlled', () => {
      const onAsideOpenChange = vi.fn();
      const { container, rerender } = render(
        <Shell asideMode="inline" asideOpen={false} onAsideOpenChange={onAsideOpenChange} />,
      );
      const aside = container.querySelector('[data-part="aside"]');
      expect(aside).not.toHaveAttribute('data-open');

      // language: pt-BR
      activateByKey(screen.getByRole('button', { name: 'Abrir painel lateral' }));
      // language: en-US
      expect(onAsideOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(aside).not.toHaveAttribute('data-open');

      rerender(<Shell asideMode="inline" asideOpen onAsideOpenChange={onAsideOpenChange} />);
      expect(aside).toHaveAttribute('data-open');
    });

    it('writes no skip link to a pane the reader closed', () => {
      render(<Shell asideMode="inline" defaultAsideOpen={false} />);
      // language: pt-BR
      expect(screen.queryByRole('link', { name: 'Pular para o painel lateral' })).toBeNull();
      // language: en-US
    });

    it('names the region, and lets an instance rename it', () => {
      const { rerender } = render(<Shell asideMode="inline" />);
      // language: pt-BR
      expect(screen.getByRole('complementary', { name: 'Painel lateral' })).toBeInTheDocument();
      // language: en-US
      rerender(<Shell asideMode="inline" messages={{ aside: 'Order detail' }} />);
      expect(screen.getByRole('complementary', { name: 'Order detail' })).toBeInTheDocument();
    });

    it('publishes the pane on the handle, with the reason programmatic', () => {
      const onAsideOpenChange = vi.fn();
      function Harness() {
        const ref = useRef<AppShellHandle | null>(null);
        return (
          <>
            <button onClick={() => ref.current?.closeAside()} type="button">
              close
            </button>
            <Shell asideMode="inline" onAsideOpenChange={onAsideOpenChange} ref={ref} />
          </>
        );
      }
      render(<Harness />);
      press(screen.getByRole('button', { name: 'close' }));
      expect(onAsideOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'programmatic' }),
      );
    });

    it('lets an application set the pane mode once', () => {
      const { container } = render(
        <AppShellDefaultsProvider asideMode="overlay">
          <Shell />
        </AppShellDefaultsProvider>,
      );
      expect(container.querySelector('[data-ui="app-shell"]')).toHaveAttribute(
        'data-aside-mode',
        'overlay',
      );
    });

    describe('overlaid', () => {
      it('closes on Escape, and says escape', () => {
        const onAsideOpenChange = vi.fn();
        render(<Shell asideMode="overlay" onAsideOpenChange={onAsideOpenChange} />);
        escape();
        expect(onAsideOpenChange).toHaveBeenCalledTimes(1);
        expect(onAsideOpenChange.mock.calls[0]?.[1].reason).toBe('escape');
      });

      it('makes every region beside it inert while it is modal, the navigation included', () => {
        const { container } = render(<Shell asideMode="overlay" />);
        expect(container.querySelector('[data-part="main"]')).toHaveAttribute('inert');
        expect(container.querySelector('[data-part="nav"]')).toHaveAttribute('inert');
        expect(container.querySelector('[data-part="banner"]')).toHaveAttribute('inert');
        expect(container.querySelector('[data-part="aside"]')).not.toHaveAttribute('inert');
        expect(container.querySelector('[data-part="scrim"]')).not.toBeNull();
      });

      it('returns focus to the control that opened it', () => {
        render(<Shell asideMode="overlay" defaultAsideOpen={false} />);
        // language: pt-BR
        const open = screen.getByRole('button', { name: 'Abrir painel lateral' });
        // language: en-US
        open.focus();
        press(open);
        escape();
        expect(document.activeElement).toBe(open);
      });
    });
  });

  describe('the pane body', () => {
    it('stands on the pane inset unless the content brings its own', () => {
      const { container, rerender } = render(
        <AppShell asideMode="inline" navMode="inline">
          <AppShellAside>
            <AppShellAsideBody>
              <p>ENC-4521</p>
            </AppShellAsideBody>
          </AppShellAside>
        </AppShell>,
      );
      const body = () => container.querySelector('[data-part="aside-body"]');
      expect(body()).not.toHaveAttribute('data-inset');

      rerender(
        <AppShell asideMode="inline" navMode="inline">
          <AppShellAside>
            <AppShellAsideBody inset="none">
              <p>ENC-4521</p>
            </AppShellAsideBody>
          </AppShellAside>
        </AppShell>,
      );
      expect(body()).toHaveAttribute('data-inset', 'none');
    });
  });

  describe('the pane edge', () => {
    function Resizable(props: Partial<AppShellProps>) {
      return (
        <AppShell asideMode="inline" navMode="inline" {...props}>
          <AppShellMain>
            <p>Encomendas</p>
          </AppShellMain>
          <AppShellAside>
            <AppShellAsideResizer />
            <AppShellAsideBody>
              <p>ENC-4521</p>
            </AppShellAsideBody>
          </AppShellAside>
        </AppShell>
      );
    }

    const separator = () => screen.getByRole('separator');
    const aside = () => document.querySelector('[data-part="aside"]') as HTMLElement;
    const root = () => document.querySelector('[data-ui="app-shell"]') as HTMLElement;

    /** jsdom lays nothing out, so the shell is given an inline size once, here. */
    function measureShellAs(width: number) {
      return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        bottom: 800,
        height: 800,
        left: 0,
        right: width,
        toJSON: () => ({}),
        top: 0,
        width,
        x: 0,
        y: 0,
      } as DOMRect);
    }

    it('is a focusable separator for the pane, valued in whole percentages of the shell', () => {
      render(<Resizable asideExtent={0.3} />);
      const edge = separator();
      expect(edge).toHaveAttribute('tabindex', '0');
      expect(edge).toHaveAttribute('aria-orientation', 'vertical');
      expect(edge).toHaveAttribute('aria-controls', aside().id);
      expect(edge).toHaveAttribute('aria-valuemin', '16');
      expect(edge).toHaveAttribute('aria-valuemax', '60');
      expect(edge).toHaveAttribute('aria-valuenow', '30');
      // language: pt-BR
      expect(edge).toHaveAccessibleName('Redimensionar painel');
      // language: en-US
      expect(edge).toHaveAttribute('data-part', 'aside-resizer');
    });

    it('draws the splitter mark, line, grip and line, at rest', () => {
      render(<Resizable asideExtent={0.3} />);
      const marks = [...separator().children].map((mark) => mark.getAttribute('data-part'));
      expect(marks).toEqual(['line', 'grip', 'line']);
      expect(separator().querySelector('[data-part="grip"]')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(separator().querySelector('[data-part-line]')).not.toBeNull();
    });

    it('takes its limits from the shell', () => {
      render(<Resizable asideExtent={0.3} maxAsideExtent={0.5} minAsideExtent={0.2} />);
      expect(separator()).toHaveAttribute('aria-valuemin', '20');
      expect(separator()).toHaveAttribute('aria-valuemax', '50');
    });

    it('moves the edge sixteen pixels per arrow and sixty-four with Shift, and says keyboard', () => {
      const spy = measureShellAs(1000);
      const onAsideExtentChange = vi.fn();
      /* Controlled and never moved, so each press is measured from one place. */
      render(<Resizable asideExtent={0.3} onAsideExtentChange={onAsideExtentChange} />);

      fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.316, 5),
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(separator(), { key: 'ArrowRight' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.284, 5),
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(separator(), { key: 'ArrowLeft', shiftKey: true });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.364, 5),
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(separator(), { key: 'Home' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        0.16,
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(separator(), { key: 'End' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        0.6,
        expect.objectContaining({ reason: 'keyboard' }),
      );
      /* Controlled: the family reported and did not move itself. */
      expect(separator()).toHaveAttribute('aria-valuenow', '30');
      spy.mockRestore();
    });

    it('moves itself when uncontrolled, inside its limits', () => {
      const spy = measureShellAs(1000);
      render(<Resizable defaultAsideExtent={0.59} />);
      fireEvent.keyDown(separator(), { key: 'ArrowLeft', shiftKey: true });
      expect(separator()).toHaveAttribute('aria-valuenow', '60');
      fireEvent.keyDown(separator(), { key: 'Home' });
      expect(separator()).toHaveAttribute('aria-valuenow', '16');
      spy.mockRestore();
    });

    it('turns the arrows round where the pane stands at the start, and in a mirrored line', () => {
      const spy = measureShellAs(1000);
      const onAsideExtentChange = vi.fn();
      const { rerender } = render(
        <Resizable asideExtent={0.3} navSide="end" onAsideExtentChange={onAsideExtentChange} />,
      );
      fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.284, 5),
        expect.anything(),
      );

      rerender(
        <AppShell
          asideExtent={0.3}
          asideMode="inline"
          navMode="inline"
          onAsideExtentChange={onAsideExtentChange}
        >
          <AppShellAside>
            <AppShellAsideResizer style={{ direction: 'rtl' }} />
          </AppShellAside>
        </AppShell>,
      );
      fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.284, 5),
        expect.anything(),
      );
      spy.mockRestore();
    });

    it('follows a drag from where it was grabbed, and marks the root while it lasts', () => {
      const spy = measureShellAs(1000);
      const onAsideExtentChange = vi.fn();
      render(<Resizable defaultAsideExtent={0.3} onAsideExtentChange={onAsideExtentChange} />);
      const edge = separator();
      edge.setPointerCapture = () => {};
      edge.hasPointerCapture = () => true;
      edge.releasePointerCapture = () => {};

      fireEvent.pointerDown(edge, { button: 0, clientX: 700, pointerId: 1 });
      fireEvent.pointerMove(edge, { clientX: 600, pointerId: 1 });
      expect(root()).toHaveAttribute('data-dragging');
      expect(onAsideExtentChange).toHaveBeenLastCalledWith(
        expect.closeTo(0.4, 5),
        expect.objectContaining({ reason: 'pointer' }),
      );
      fireEvent.pointerUp(edge, { clientX: 600, pointerId: 1 });
      expect(root()).not.toHaveAttribute('data-dragging');
      expect(separator()).toHaveAttribute('aria-valuenow', '40');
      spy.mockRestore();
    });

    it('writes the extent as the width of the column, and nothing while it is unset', () => {
      const { rerender } = render(<Resizable />);
      expect(aside().style.getPropertyValue('--slotted-app-shell-aside-extent')).toBe('');

      rerender(<Resizable asideExtent={0.25} />);
      expect(aside().style.getPropertyValue('--slotted-app-shell-aside-extent')).toBe('25cqi');
    });

    it('draws no edge where the pane is a layer, or closed', () => {
      const { rerender } = render(<Resizable asideMode="overlay" />);
      expect(screen.queryByRole('separator')).toBeNull();

      rerender(<Resizable asideOpen={false} />);
      expect(screen.queryByRole('separator')).toBeNull();
    });
  });

  /**
   * The frame's width moves under an uncontrolled shell: jsdom lays nothing
   * out, so the width is a variable the measurement reads and the observer is
   * a list of callbacks the test calls.
   */
  describe('across the breakpoint', () => {
    let width = 1280;
    const observers: (() => void)[] = [];

    function resizeTo(next: number) {
      width = next;
      act(() => {
        for (const notify of observers) notify();
      });
    }

    function setup() {
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
    }

    const root = () => document.querySelector('[data-ui="app-shell"]') as HTMLElement;

    it('restores the open region when the frame widens back into inline', () => {
      setup();
      const onNavOpenChange = vi.fn();
      render(
        <AppShell onNavOpenChange={onNavOpenChange}>
          <AppShellNav>
            <AppShellNavBody>
              <a href="#dashboard">Dashboard</a>
            </AppShellNavBody>
          </AppShellNav>
          <AppShellMain>
            <p>Encomendas</p>
          </AppShellMain>
        </AppShell>,
      );
      expect(root()).toHaveAttribute('data-nav-mode', 'inline');
      expect(root()).toHaveAttribute('data-open');

      resizeTo(360);
      expect(root()).toHaveAttribute('data-nav-mode', 'overlay');
      expect(root()).not.toHaveAttribute('data-open');

      resizeTo(1280);
      expect(root()).toHaveAttribute('data-nav-mode', 'inline');
      expect(root()).toHaveAttribute('data-open');
      expect(onNavOpenChange).toHaveBeenLastCalledWith(
        true,
        expect.objectContaining({ reason: 'resize' }),
      );
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('keeps a region the reader closed while wide closed after a narrow window', () => {
      setup();
      render(
        <AppShell defaultNavOpen={false}>
          <AppShellNav>
            <AppShellNavBody>
              <a href="#dashboard">Dashboard</a>
            </AppShellNavBody>
          </AppShellNav>
          <AppShellMain>
            <p>Encomendas</p>
          </AppShellMain>
        </AppShell>,
      );
      resizeTo(360);
      resizeTo(1280);
      expect(root()).not.toHaveAttribute('data-open');
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('draws no veil and no open state when no navigation region is rendered', () => {
      setup();
      width = 360;
      const { container } = render(
        <AppShell navMode="overlay" navOpen>
          <AppShellMain>
            <p>Encomendas</p>
          </AppShellMain>
        </AppShell>,
      );
      expect(root()).not.toHaveAttribute('data-open');
      expect(container.querySelector('[data-part="scrim"]')).toBeNull();
      expect(container.querySelector('[data-part="main"]')).not.toHaveAttribute('inert');
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('draws no veil for an overlaid pane that is not rendered', () => {
      setup();
      const { container } = render(
        <AppShell asideMode="overlay" asideOpen navOpen={false}>
          <AppShellMain>
            <p>Encomendas</p>
          </AppShellMain>
        </AppShell>,
      );
      expect(container.querySelector('[data-part="scrim"]')).toBeNull();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
  });
});

describe('AppShellProgress', () => {
  function Shell({ children, loading }: { children?: ReactNode; loading: boolean }) {
    return (
      <AppShell>
        <AppShellBanner />
        <AppShellMain>{children}</AppShellMain>
        <AppShellProgress loading={loading} />
      </AppShell>
    );
  }

  /**
   * The content is busy for as long as the reader can see the wait: not from
   * the moment the prop turns, because a fast answer draws nothing, and not
   * after the bar has gone.
   */
  it('marks the content busy for exactly as long as the bar is painted', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(<Shell loading />);
      const main = container.querySelector('main');
      const bar = () =>
        container.querySelector('[data-part="progress"] > [data-ui="progress-indicator"]');

      expect(bar()).toHaveAttribute('hidden');
      expect(main).not.toHaveAttribute('aria-busy');

      act(() => void vi.advanceTimersByTime(200));
      expect(bar()).not.toHaveAttribute('hidden');
      expect(bar()).toHaveAttribute('data-placement', 'edge-start');
      expect(bar()).toHaveAttribute('data-size', 'sm');
      expect(main).toHaveAttribute('aria-busy', 'true');

      rerender(<Shell loading={false} />);
      expect(main).toHaveAttribute('aria-busy', 'true');
      act(() => void vi.advanceTimersByTime(400));
      expect(bar()).toHaveAttribute('hidden');
      expect(main).not.toHaveAttribute('aria-busy');
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws nothing for an answer faster than the delay', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(<Shell loading />);
      act(() => void vi.advanceTimersByTime(120));
      rerender(<Shell loading={false} />);
      act(() => void vi.advanceTimersByTime(600));
      expect(container.querySelector('main')).not.toHaveAttribute('aria-busy');
      expect(
        container.querySelector('[data-part="progress"] > [data-ui="progress-indicator"]'),
      ).toHaveAttribute('hidden');
    } finally {
      vi.useRealTimers();
    }
  });

  it('names the wait from the catalog, and takes the timing an application set once', () => {
    const { container } = render(
      <PtBr>
        <ProgressIndicatorDefaultsProvider delay={0} minDuration={0}>
          <Shell loading />
        </ProgressIndicatorDefaultsProvider>
      </PtBr>,
    );
    const bar = screen.getByRole('progressbar');
    // language: pt-BR
    expect(bar).toHaveAccessibleName('Carregando página');
    // language: en-US
    expect(bar).not.toHaveAttribute('hidden');
    expect(container.querySelector('main')).toHaveAttribute('aria-busy', 'true');
  });

  it('lets an aria-busy the consumer wrote on the content win', () => {
    render(
      <AppShell>
        <AppShellMain aria-busy={false}>content</AppShellMain>
        <AppShellProgress delay={0} label="Opening the order" />
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Opening the order');
  });
});

/**
 * A part rendered into another element still hands that element to its ref:
 * the ref is also how the shell registers the part. `render` was called with
 * props that carried no ref, so a substituted footer was never registered.
 */
describe('a part rendered into another element', () => {
  it('attaches the footer’s ref to the element render returns', () => {
    const footer = vi.fn();
    renderBase(
      <AppShell>
        <AppShellFooter ref={footer} render={(props) => <div {...props} data-testid="footer" />} />
      </AppShell>,
    );
    expect(footer).toHaveBeenCalledWith(screen.getByTestId('footer'));
  });

  it('registers the shell’s own root when render substitutes it', () => {
    let handle: AppShellHandle | null = null;
    renderBase(
      <AppShell
        ref={(value) => {
          handle = value;
        }}
        render={(props) => <section {...props} data-testid="shell" />}
      />,
    );
    expect((handle as AppShellHandle | null)?.root).toBe(screen.getByTestId('shell'));
  });
});
