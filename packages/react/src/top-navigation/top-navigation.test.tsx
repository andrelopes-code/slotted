import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/top-navigation/contract.json';
import { AppShell, AppShellBanner } from '../app-shell';
import { SlottedProvider } from '../i18n';
import {
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuLinks,
} from '../navigation-menu/navigation-menu-parts';
import { TopNavigation } from './top-navigation';
import { TopNavigationDefaultsProvider } from './top-navigation-defaults';
import {
  TopNavigationAccount,
  TopNavigationAction,
  TopNavigationActions,
  TopNavigationBrand,
  TopNavigationContext,
  TopNavigationCount,
  TopNavigationHelp,
  TopNavigationHome,
  TopNavigationItem,
  TopNavigationLink,
  TopNavigationList,
  TopNavigationMark,
  TopNavigationName,
  TopNavigationNav,
  TopNavigationNotifications,
  TopNavigationSearch,
  TopNavigationTrigger,
} from './top-navigation-parts';
import type { TopNavigationProps } from './top-navigation.types';

/**
 * jsdom lays nothing out, so the bar's width is what this says it is: the
 * width gate reads `getBoundingClientRect` on the root, and nought means
 * "not measured", not "narrow".
 */
function widthOf(pixels: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const width = this.getAttribute('data-ui') === 'top-navigation' ? pixels : 0;
    return { bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0 } as DOMRect;
  });
}

/** The bar the tests read, in Brazilian Portuguese: the words come from the pt-BR catalog. */
function Bar(props: Partial<TopNavigationProps>) {
  return (
    <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
      <Bare {...props} />
    </SlottedProvider>
  );
}

function Bare(props: Partial<TopNavigationProps>) {
  return (
    <TopNavigation skipTo="content" {...props}>
      <TopNavigationBrand>
        <TopNavigationHome href="#home">
          <TopNavigationMark>
            <svg aria-hidden="true" />
          </TopNavigationMark>
          <TopNavigationName>Aurora Logistics</TopNavigationName>
        </TopNavigationHome>
      </TopNavigationBrand>
      <TopNavigationContext>
        <span>Staging</span>
      </TopNavigationContext>
      <TopNavigationNav>
        <TopNavigationList>
          <TopNavigationItem priority="high" value="dashboard">
            <TopNavigationLink href="#dashboard">Dashboard</TopNavigationLink>
          </TopNavigationItem>
          <TopNavigationItem value="rotas">
            <TopNavigationLink href="#rotas">Rotas</TopNavigationLink>
          </TopNavigationItem>
          <TopNavigationItem value="frota">
            <TopNavigationTrigger>Frota</TopNavigationTrigger>
            <NavigationMenuContent>
              <NavigationMenuLinks>
                <li>
                  <NavigationMenuLink href="#vehicles">Vehicles</NavigationMenuLink>
                </li>
              </NavigationMenuLinks>
            </NavigationMenuContent>
          </TopNavigationItem>
          <TopNavigationItem priority="low" value="reports">
            <TopNavigationLink href="#reports">Reports</TopNavigationLink>
          </TopNavigationItem>
          <TopNavigationItem disabled priority="low" value="billing">
            <TopNavigationLink href="#billing">Billing</TopNavigationLink>
          </TopNavigationItem>
        </TopNavigationList>
      </TopNavigationNav>
      <TopNavigationSearch>
        <input aria-label="Procurar" type="search" />
      </TopNavigationSearch>
      <TopNavigationActions>
        <TopNavigationHelp href="#help" />
        {/* language: pt-BR */}
        <TopNavigationAction aria-label="Aprovações, 7 pendentes">
          {/* language: en-US */}
          <svg />
          <TopNavigationCount>7</TopNavigationCount>
        </TopNavigationAction>
        <TopNavigationNotifications>
          <TopNavigationCount>3</TopNavigationCount>
        </TopNavigationNotifications>
        <TopNavigationAccount>
          <span>AB</span>
        </TopNavigationAccount>
      </TopNavigationActions>
    </TopNavigation>
  );
}

const root = () => document.querySelector('[data-ui="top-navigation"]') as HTMLElement;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`) as HTMLElement;
const item = (value: string) =>
  document.querySelector(`[data-part="item"][data-value="${value}"]`) as HTMLElement;
const link = (value: string) => item(value).querySelector('[data-part="link"]') as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TopNavigation', () => {
  it('renders every part the contract declares', () => {
    widthOf(1280);
    render(<Bar />);
    for (const name of contract.members.topNavigation.parts) {
      expect(document.querySelector(`[data-part="${name}"]`), name).not.toBeNull();
    }
    expect(root().tagName).toBe('HEADER');
    expect(root()).toHaveAttribute('data-frame');
    expect(root()).toHaveAttribute('data-size', 'md');
    // language: pt-BR
    expect(part('nav')).toHaveAttribute('aria-label', 'Navegação');
    // language: en-US
    expect(part('skip')).toHaveAttribute('href', '#content');
    // language: pt-BR
    expect(part('skip')).toHaveTextContent('Pular para o conteúdo');
    // language: en-US
  });

  it('speaks the base catalog without a provider, and lays its own messages over it', () => {
    widthOf(1280);
    render(<Bare messages={{ account: 'Profile' }} />);
    expect(part('nav')).toHaveAttribute('aria-label', 'Navigation');
    expect(part('skip')).toHaveTextContent('Skip to content');
    expect(part('more')).toHaveAttribute('aria-label', 'More');
    expect(part('account')).toHaveAttribute('aria-label', 'Profile');
  });

  /** The shell's banner is already the banner landmark and already paints. */
  it('is a div without a frame inside app-shell, and a framed header on its own', () => {
    widthOf(1280);
    const { unmount } = render(
      <AppShell>
        <AppShellBanner>
          <Bar />
        </AppShellBanner>
      </AppShell>,
    );
    expect(root().tagName).toBe('DIV');
    expect(root()).not.toHaveAttribute('data-frame');
    unmount();

    render(<Bar frame={false} landmark={false} />);
    expect(root().tagName).toBe('DIV');
    expect(root()).not.toHaveAttribute('data-frame');
  });

  it('names every icon-only control and puts the count inside the bell', () => {
    widthOf(1280);
    render(<Bar />);
    expect(part('help')).toHaveTextContent('Ajuda');
    expect(part('help')).not.toHaveAttribute('aria-label');
    expect(part('help').tagName).toBe('A');
    // language: pt-BR
    expect(part('notifications')).toHaveAttribute('aria-label', 'Notificações');
    // language: en-US
    expect(part('notifications').querySelector('[data-part="count"]')).not.toBeNull();
    expect(part('action').tagName).toBe('BUTTON');
    expect(part('action')).toHaveAttribute('type', 'button');
    // language: pt-BR
    expect(part('action')).toHaveAttribute('aria-label', 'Aprovações, 7 pendentes');
    // language: en-US
    expect(part('action').querySelector('[data-part="count"]')).not.toBeNull();
    // language: pt-BR
    expect(part('account')).toHaveAttribute('aria-label', 'Conta');
    // language: en-US
    expect(part('more')).toHaveAttribute('aria-label', 'Mais');
    expect(part('more')).toHaveAttribute('aria-expanded', 'false');
    expect(part('more').getAttribute('aria-controls')).toBe(part('panel').id);
    // language: pt-BR
    expect(part('search-toggle')).toHaveAttribute('aria-label', 'Pesquisar');
    // language: en-US

    /* Each control leads with the family's mark, and the section's trigger ends in one. */
    const mark = (name: string) =>
      part(name).firstElementChild?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
    expect(mark('more')).toBe('ellipsis');
    expect(mark('search-toggle')).toBe('search');
    expect(mark('help')).toBe('circle-question');
    expect(mark('notifications')).toBe('bell');
    expect(
      part('trigger').querySelector(
        '[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph="chevron-down"]',
      ),
    ).not.toBeNull();
  });

  it('marks the current destination on the link and asks value to move on a press', () => {
    widthOf(1280);
    const onValueChange = vi.fn();
    render(<Bar defaultValue="dashboard" onValueChange={onValueChange} />);
    expect(link('dashboard')).toHaveAttribute('aria-current', 'page');
    expect(item('dashboard')).toHaveAttribute('data-current');
    fireEvent.click(link('rotas'), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledWith(
      'rotas',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(link('rotas')).toHaveAttribute('aria-current', 'page');
    expect(link('dashboard')).not.toHaveAttribute('aria-current');
    fireEvent.click(link('dashboard'), { detail: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      'dashboard',
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('lets a link that says it is current win over the root', () => {
    widthOf(1280);
    render(
      <TopNavigation value="dashboard">
        <TopNavigationNav>
          <TopNavigationList>
            <TopNavigationItem value="dashboard">
              <TopNavigationLink href="#dashboard">Dashboard</TopNavigationLink>
            </TopNavigationItem>
            <TopNavigationItem value="rotas">
              <TopNavigationLink current href="#rotas">
                Rotas
              </TopNavigationLink>
            </TopNavigationItem>
          </TopNavigationList>
        </TopNavigationNav>
      </TopNavigation>,
    );
    expect(link('rotas')).toHaveAttribute('aria-current', 'page');
    expect(item('rotas')).toHaveAttribute('data-current');
  });

  it('refuses a disabled link and keeps its destination', () => {
    widthOf(1280);
    const onValueChange = vi.fn();
    render(<Bar onValueChange={onValueChange} />);
    expect(link('billing')).toHaveAttribute('aria-disabled', 'true');
    expect(link('billing')).toHaveAttribute('href', '#billing');
    expect(item('billing')).toHaveAttribute('data-disabled');
    fireEvent.click(link('billing'), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('folds nothing at 1280 and the low items at 1000, counting them on more', () => {
    widthOf(1280);
    const onCollapseChange = vi.fn();
    const { unmount } = render(<Bar onCollapseChange={onCollapseChange} />);
    expect(document.querySelectorAll('[data-collapsed]')).toHaveLength(0);
    expect(part('more')).not.toHaveAttribute('data-overflow');
    expect(onCollapseChange).not.toHaveBeenCalled();
    unmount();
    vi.restoreAllMocks();

    widthOf(1000);
    render(<Bar onCollapseChange={onCollapseChange} />);
    expect(item('reports')).toHaveAttribute('data-collapsed');
    expect(item('billing')).toHaveAttribute('data-collapsed');
    expect(item('rotas')).not.toHaveAttribute('data-collapsed');
    expect(part('more')).toHaveAttribute('data-overflow', '2');
    expect(part('more')).toHaveAttribute('aria-label', 'Mais, 2');
    expect(onCollapseChange).toHaveBeenCalledWith(['reports', 'billing'], 'resize');
  });

  it('folds the medium items under 600 and the high ones under 480, marking more current', () => {
    widthOf(560);
    const { unmount } = render(<Bar defaultValue="dashboard" />);
    expect(item('rotas')).toHaveAttribute('data-collapsed');
    expect(item('frota')).toHaveAttribute('data-collapsed');
    expect(item('dashboard')).not.toHaveAttribute('data-collapsed');
    expect(part('more')).toHaveAttribute('data-overflow', '4');
    fireEvent.click(part('more'), { detail: 1 });
    expect(part('panel')).toContainElement(part('context'));
    expect(part('panel')).not.toContainElement(part('help'));
    expect(part('more')).not.toHaveAttribute('data-current');
    unmount();
    vi.restoreAllMocks();

    widthOf(400);
    render(<Bar defaultValue="dashboard" />);
    expect(item('dashboard')).toHaveAttribute('data-collapsed');
    expect(part('more')).toHaveAttribute('data-overflow', '5');
    expect(part('more')).toHaveAttribute('data-current');
  });

  /**
   * The folded parts render into the panel through a portal, which is the
   * same markup and a new element: the cost the contract writes for React,
   * where Angular moves the element itself.
   */
  it('opens the panel from more and renders the folded items, the context and the help into it', () => {
    widthOf(400);
    const onMoreOpenChange = vi.fn();
    render(<Bar onMoreOpenChange={onMoreOpenChange} />);
    expect(part('panel')).not.toHaveAttribute('data-open');
    expect(part('panel-list').children).toHaveLength(0);

    fireEvent.click(part('more'), { detail: 1 });
    expect(onMoreOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(part('more')).toHaveAttribute('aria-expanded', 'true');
    expect(part('panel')).toHaveAttribute('data-open');
    expect(part('panel-list')).toContainElement(item('rotas'));
    expect(part('panel-list').querySelectorAll('[data-part="item"]')).toHaveLength(5);
    expect(part('panel')).toContainElement(part('help'));
    expect(part('help')).toHaveTextContent('Ajuda');
    expect(part('panel')).toContainElement(part('context'));
    expect(part('list')).not.toContainElement(item('rotas'));
    expect(part('list').querySelectorAll('[data-part="item"]')).toHaveLength(1);
  });

  it('closes the panel when a link inside it is pressed, with the reason select', () => {
    widthOf(400);
    const onMoreOpenChange = vi.fn();
    render(<Bar defaultMoreOpen onMoreOpenChange={onMoreOpenChange} />);
    expect(part('panel')).toHaveAttribute('data-open');
    fireEvent.click(link('rotas'), { detail: 1 });
    expect(onMoreOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(part('panel')).not.toHaveAttribute('data-open');
  });

  it('is a navigation menu: a section opens its panel on the surface after the list', () => {
    widthOf(1280);
    const onValueChange = vi.fn();
    render(<Bar />);
    const nav = part('nav');
    expect(nav).toHaveAttribute('data-ui', 'navigation-menu');
    const trigger = item('frota').querySelector('[data-part="trigger"]') as HTMLElement;
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    expect(trigger.nextElementSibling).toBe(panel);
    expect(panel).toHaveAttribute('hidden');
    fireEvent.click(trigger, { detail: 1 });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(item('frota')).toHaveAttribute('data-open');
    expect(nav.querySelector(':scope > [data-part="viewport"]')).toHaveAttribute('data-open');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('opens a folded section in line inside the panel, and a link there closes both', () => {
    widthOf(400);
    const onMoreOpenChange = vi.fn();
    render(<Bar defaultMoreOpen onMoreOpenChange={onMoreOpenChange} />);
    expect(part('panel-list')).toContainElement(item('frota'));
    const trigger = item('frota').querySelector('[data-part="trigger"]') as HTMLElement;
    fireEvent.click(trigger, { detail: 1 });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(part('nav').querySelector(':scope > [data-part="viewport"]')).not.toHaveAttribute(
      'data-open',
    );
    fireEvent.click(document.querySelector('a[href="#vehicles"]') as HTMLElement, { detail: 1 });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onMoreOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('closes the panel on Escape and returns focus to more', () => {
    widthOf(400);
    const onMoreOpenChange = vi.fn();
    render(<Bar defaultMoreOpen onMoreOpenChange={onMoreOpenChange} />);
    link('rotas').focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(onMoreOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(document.activeElement).toBe(part('more'));
  });

  it('keeps a controlled panel where the consumer put it', () => {
    widthOf(400);
    const onMoreOpenChange = vi.fn();
    render(<Bar moreOpen={false} onMoreOpenChange={onMoreOpenChange} />);
    fireEvent.click(part('more'), { detail: 1 });
    expect(onMoreOpenChange).toHaveBeenCalledTimes(1);
    expect(part('panel')).not.toHaveAttribute('data-open');
  });

  it('opens the search over the bar under 600, focuses the field, and closes on Escape', () => {
    widthOf(560);
    const onSearchOpenChange = vi.fn();
    render(<Bar onSearchOpenChange={onSearchOpenChange} />);
    expect(root()).not.toHaveAttribute('data-search-open');
    fireEvent.click(part('search-toggle'), { detail: 1 });
    expect(onSearchOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(root()).toHaveAttribute('data-search-open');
    expect(document.activeElement).toBe(screen.getByLabelText('Procurar', { selector: 'input' }));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(onSearchOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(root()).not.toHaveAttribute('data-search-open');
    expect(document.activeElement).toBe(part('search-toggle'));
  });

  it('closes the search from its close control and when focus leaves it', () => {
    widthOf(560);
    const onSearchOpenChange = vi.fn();
    render(<Bar defaultSearchOpen onSearchOpenChange={onSearchOpenChange} />);
    expect(root()).toHaveAttribute('data-search-open');
    expect(
      part('search-close').querySelector('[data-ui="icon"] > svg[data-glyph="x"]'),
    ).not.toBeNull();
    fireEvent.click(part('search-close'), { detail: 1 });
    expect(onSearchOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );

    fireEvent.click(part('search-toggle'), { detail: 1 });
    expect(root()).toHaveAttribute('data-search-open');
    const field = screen.getByLabelText('Procurar', { selector: 'input' });
    fireEvent.blur(field, { relatedTarget: part('account') });
    expect(onSearchOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'blur' }),
    );
  });

  it('writes no search state above 600, where the field is always there', () => {
    widthOf(1280);
    render(<Bar defaultSearchOpen />);
    expect(root()).not.toHaveAttribute('data-search-open');
  });

  it('takes its defaults from the provider and lets the bar win', () => {
    widthOf(1280);
    render(
      <TopNavigationDefaultsProvider frame={false} size="lg">
        <Bar messages={{ more: 'Outros' }} />
      </TopNavigationDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).not.toHaveAttribute('data-frame');
    expect(part('more')).toHaveAttribute('aria-label', 'Outros');
  });

  it('exposes the imperative surface', () => {
    widthOf(560);
    const handle: { current: import('./top-navigation.types').TopNavigationHandle | null } = {
      current: null,
    };
    render(<Bar ref={handle} />);
    act(() => handle.current?.openMore());
    expect(part('panel')).toHaveAttribute('data-open');
    act(() => handle.current?.closeMore());
    expect(part('panel')).not.toHaveAttribute('data-open');
    act(() => handle.current?.focusSearch());
    expect(root()).toHaveAttribute('data-search-open');
    act(() => handle.current?.focus());
    expect(document.activeElement).toBe(part('skip'));
    expect(handle.current?.root).toBe(root());
  });

  it('composes the consumer handler and lets it cancel the family', () => {
    widthOf(1280);
    const onValueChange = vi.fn();
    render(
      <TopNavigation onValueChange={onValueChange}>
        <TopNavigationNav>
          <TopNavigationList>
            <TopNavigationItem value="dashboard">
              <TopNavigationLink href="#dashboard" onClick={(event) => event.preventDefault()}>
                Dashboard
              </TopNavigationLink>
            </TopNavigationItem>
          </TopNavigationList>
        </TopNavigationNav>
      </TopNavigation>,
    );
    fireEvent.click(link('dashboard'), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
