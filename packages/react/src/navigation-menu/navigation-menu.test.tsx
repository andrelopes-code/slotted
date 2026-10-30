import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/navigation-menu/contract.json';
import { SlottedProvider } from '../i18n';
import { NavigationMenu } from './navigation-menu';
import { NavigationMenuDefaultsProvider } from './navigation-menu-defaults';
import {
  NavigationMenuContent,
  NavigationMenuDescription,
  NavigationMenuFooter,
  NavigationMenuGroup,
  NavigationMenuGroupLabel,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuLabel,
  NavigationMenuLink,
  NavigationMenuLinks,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu-parts';
import type { NavigationMenuProps } from './navigation-menu.types';

function Menu(props: Partial<NavigationMenuProps>) {
  return (
    <NavigationMenu aria-label="Principal" {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="produtos">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent columns={2}>
            <NavigationMenuLinks>
              <li>
                <NavigationMenuLink href="#warehouse">
                  <NavigationMenuIcon>
                    <svg />
                  </NavigationMenuIcon>
                  <NavigationMenuLabel>Warehouse</NavigationMenuLabel>
                  <NavigationMenuDescription>Receipts and shipments.</NavigationMenuDescription>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink current href="#frota">
                  Frota
                </NavigationMenuLink>
              </li>
            </NavigationMenuLinks>
            <NavigationMenuFooter>
              <a href="#todos">Ver todos</a>
            </NavigationMenuFooter>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="documentacao">
          <NavigationMenuLink href="#documentation">Documentation</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="company">
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuGroup>
              <NavigationMenuGroupLabel>Sobre</NavigationMenuGroupLabel>
              <NavigationMenuLinks>
                <li>
                  <NavigationMenuLink href="#about">About us</NavigationMenuLink>
                </li>
              </NavigationMenuLinks>
            </NavigationMenuGroup>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem disabled value="parceiros">
          <NavigationMenuTrigger>Parceiros</NavigationMenuTrigger>
          <NavigationMenuContent />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });

afterEach(() => vi.useRealTimers());

describe('NavigationMenu', () => {
  it('renders every part the contract declares, with the identity a consumer selects by', () => {
    const { container } = render(<Menu arrow defaultValue="produtos" />);
    const root = container.querySelector('[data-ui="navigation-menu"]');
    expect(root?.tagName).toBe('NAV');
    for (const part of contract.members.navigationMenu.parts) {
      if (part === 'root') continue;
      expect(container.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
  });

  it('is a disclosure: a button with aria-expanded and aria-controls, a panel after it, no menu role', () => {
    const { container } = render(<Menu />);
    const button = trigger('Products');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveAttribute('hidden');
    expect(button.nextElementSibling).toBe(panel);
    expect(container.querySelector('[role^="menu"]')).toBeNull();
  });

  it('names its landmark from the catalog, in the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <NavigationMenu>
          <NavigationMenuList />
        </NavigationMenu>
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeInTheDocument();
    // language: en-US
  });

  it('opens and closes a section by click, asking with the reason pointer', () => {
    const onValueChange = vi.fn();
    render(<Menu onValueChange={onValueChange} />);
    fireEvent.click(trigger('Products'), { detail: 1 });
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true');
    expect(onValueChange).toHaveBeenLastCalledWith(
      'produtos',
      expect.objectContaining({ reason: 'pointer' }),
    );
    fireEvent.click(trigger('Products'), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('tells a key from a pointer by the click a key synthesises', () => {
    const onValueChange = vi.fn();
    render(<Menu onValueChange={onValueChange} />);
    fireEvent.click(trigger('Company'), { detail: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      'company',
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('leaves a controlled value to the consumer', () => {
    const onValueChange = vi.fn();
    render(<Menu onValueChange={onValueChange} value={null} />);
    fireEvent.click(trigger('Products'), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the section when the request is cancelled', () => {
    render(<Menu onValueChange={(_, request) => request.cancel()} />);
    fireEvent.click(trigger('Products'), { detail: 1 });
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens by hover after the delay, switches without it, and never on touch', () => {
    vi.useFakeTimers();
    render(<Menu />);
    fireEvent.pointerEnter(trigger('Products'), { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(500));
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false');

    fireEvent.pointerEnter(trigger('Products'), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(199));
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'false');
    act(() => vi.advanceTimersByTime(1));
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerEnter(trigger('Company'), { pointerType: 'mouse' });
    expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
  });

  it('reads the hover delay an application set once', () => {
    vi.useFakeTimers();
    render(
      <NavigationMenuDefaultsProvider openDelay={50}>
        <Menu />
      </NavigationMenuDefaultsProvider>,
    );
    fireEvent.pointerEnter(trigger('Products'), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(50));
    expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onValueChange = vi.fn();
    render(<Menu defaultValue="produtos" onValueChange={onValueChange} />);
    const link = screen.getByRole('link', { name: /Warehouse/ });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(trigger('Products')).toHaveFocus();
  });

  it('closes with the reason blur when focus leaves the root', () => {
    const onValueChange = vi.fn();
    render(
      <>
        <Menu defaultValue="produtos" onValueChange={onValueChange} />
        <button type="button">Outside</button>
      </>,
    );
    const link = screen.getByRole('link', { name: /Warehouse/ });
    fireEvent.blur(link, { relatedTarget: screen.getByRole('button', { name: 'Outside' }) });
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'blur' }),
    );
  });

  it('closes when a panel link is followed, unless the link says otherwise', () => {
    const onValueChange = vi.fn();
    render(<Menu defaultValue="produtos" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('link', { name: 'Frota' }));
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('walks the row with the arrows and enters an open panel with ArrowDown', () => {
    render(<Menu defaultValue="produtos" />);
    trigger('Products').focus();
    fireEvent.keyDown(trigger('Products'), { key: 'ArrowRight' });
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('link', { name: 'Documentation' }), { key: 'ArrowLeft' });
    expect(trigger('Products')).toHaveFocus();
    fireEvent.keyDown(trigger('Products'), { key: 'ArrowDown' });
    expect(screen.getByRole('link', { name: /Warehouse/ })).toHaveFocus();
  });

  it('marks the current link and the section that holds it', () => {
    render(<Menu />);
    expect(screen.getByRole('link', { name: 'Frota', hidden: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(trigger('Products')).toHaveAttribute('data-current');
    expect(trigger('Company')).not.toHaveAttribute('data-current');
  });

  it('refuses a disabled section and a disabled link', () => {
    const onClick = vi.fn();
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="a">
            <NavigationMenuLink disabled href="#a" onClick={onClick}>
              A
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    const link = screen.getByRole('link', { name: 'A' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled');
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps a disabled section closed', () => {
    render(<Menu />);
    expect(trigger('Parceiros')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Parceiros' }).closest('li')).toHaveAttribute(
      'data-disabled',
    );
  });

  it('names a group by its label', () => {
    render(<Menu defaultValue="company" />);
    expect(screen.getByRole('group', { name: 'Sobre' })).toBeInTheDocument();
  });

  it('composes the consumer handler and lets it cancel the family part', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="a">
            <NavigationMenuTrigger onClick={onClick}>A</NavigationMenuTrigger>
            <NavigationMenuContent />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    fireEvent.click(trigger('A'), { detail: 1 });
    expect(onClick).toHaveBeenCalledOnce();
    expect(trigger('A')).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders a second level as a div inside the panel, and a link there closes every level', () => {
    function Outer() {
      const [value, setValue] = useState<string | null>('catalogo');
      return (
        <NavigationMenu onValueChange={setValue} value={value}>
          <NavigationMenuList>
            <NavigationMenuItem value="catalogo">
              <NavigationMenuTrigger>Catalog</NavigationMenuTrigger>
              <NavigationMenuContent columns={3}>
                <NavigationMenu defaultValue="ferramentas">
                  <NavigationMenuList>
                    <NavigationMenuItem value="ferramentas">
                      <NavigationMenuTrigger>Ferramentas</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <NavigationMenuLinks>
                          <li>
                            <NavigationMenuLink href="#manuais">Hand tools</NavigationMenuLink>
                          </li>
                        </NavigationMenuLinks>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
    }
    const { container } = render(<Outer />);
    const nested = container.querySelector('[data-nested]');
    expect(nested?.tagName).toBe('DIV');
    expect(nested).toHaveAttribute('data-orientation', 'vertical');
    expect(nested?.querySelector(':scope > [data-part="viewport"]')).toBeNull();
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    fireEvent.click(screen.getByRole('link', { name: 'Hand tools' }));
    expect(trigger('Catalog')).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes open, close and focus on its handle', () => {
    const ref = { current: null as null | import('./navigation-menu.types').NavigationMenuHandle };
    render(<Menu ref={ref} />);
    act(() => ref.current?.open('company'));
    expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
    act(() => ref.current?.close());
    expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
    act(() => ref.current?.focus('company'));
    expect(trigger('Company')).toHaveFocus();
  });
});
