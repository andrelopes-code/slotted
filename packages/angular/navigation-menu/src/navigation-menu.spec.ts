import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';

import contract from '../../../../specs/components/navigation-menu/contract.json';
import { SlNavigationMenu } from './navigation-menu';
import { provideNavigationMenuDefaults } from './navigation-menu-defaults';
import {
  SlNavigationMenuContent,
  SlNavigationMenuDescription,
  SlNavigationMenuFooter,
  SlNavigationMenuGroup,
  SlNavigationMenuGroupLabel,
  SlNavigationMenuIcon,
  SlNavigationMenuItem,
  SlNavigationMenuLabel,
  SlNavigationMenuLink,
  SlNavigationMenuLinks,
  SlNavigationMenuList,
  SlNavigationMenuTrigger,
} from './navigation-menu-parts';

const PARTS = [
  SlNavigationMenu,
  SlNavigationMenuList,
  SlNavigationMenuItem,
  SlNavigationMenuTrigger,
  SlNavigationMenuContent,
  SlNavigationMenuLinks,
  SlNavigationMenuLink,
  SlNavigationMenuIcon,
  SlNavigationMenuLabel,
  SlNavigationMenuDescription,
  SlNavigationMenuGroup,
  SlNavigationMenuGroupLabel,
  SlNavigationMenuFooter,
];

const LIST = `<ul slNavigationMenuList>
  <li slNavigationMenuItem value="products">
    <button slNavigationMenuTrigger>Products</button>
    <div slNavigationMenuContent columns="2">
      <ul slNavigationMenuLinks>
        <li>
          <a slNavigationMenuLink href="#warehouse">
            <span slNavigationMenuIcon><svg></svg></span>
            <span slNavigationMenuLabel>Warehouse</span>
            <span slNavigationMenuDescription>Inbound and outbound.</span>
          </a>
        </li>
        <li><a slNavigationMenuLink current href="#fleet">Fleet</a></li>
      </ul>
      <div slNavigationMenuFooter><a href="#todos">Ver todos</a></div>
    </div>
  </li>
  <li slNavigationMenuItem value="documentacao">
    <a slNavigationMenuLink href="#documentation">Documentation</a>
  </li>
  <li slNavigationMenuItem value="company">
    <button slNavigationMenuTrigger>Company</button>
    <div slNavigationMenuContent>
      <div slNavigationMenuGroup>
        <div slNavigationMenuGroupLabel>About</div>
        <ul slNavigationMenuLinks>
          <li><a slNavigationMenuLink href="#about">About us</a></li>
        </ul>
      </div>
    </div>
  </li>
  <li slNavigationMenuItem value="parceiros" disabled>
    <button slNavigationMenuTrigger>Parceiros</button>
    <div slNavigationMenuContent></div>
  </li>
</ul>`;

@Component({
  standalone: true,
  imports: PARTS,
  template: `<nav
      slNavigationMenu
      arrow
      [(value)]="value"
      (valueChangeRequest)="requests.push($event)"
    >
      ${LIST}
    </nav>
    <button type="button" id="outside">Fora</button>`,
})
class Host {
  readonly value = signal<string | null>(null);
  readonly requests: ChangeRequest<string | null>[] = [];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `<nav slNavigationMenu [(value)]="value">
    <ul slNavigationMenuList>
      <li slNavigationMenuItem value="catalogo">
        <button slNavigationMenuTrigger>Catalog</button>
        <div slNavigationMenuContent columns="3">
          <div slNavigationMenu [value]="'ferramentas'">
            <ul slNavigationMenuList>
              <li slNavigationMenuItem value="ferramentas">
                <button slNavigationMenuTrigger>Ferramentas</button>
                <div slNavigationMenuContent>
                  <ul slNavigationMenuLinks>
                    <li><a slNavigationMenuLink aria-current="page" href="#manuais">Manuais</a></li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </nav>`,
})
class Nested {
  readonly value = signal<string | null>('catalogo');
}

describe('SlNavigationMenu', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () =>
    fixture.nativeElement.querySelector('[data-ui="navigation-menu"]') as HTMLElement;
  const item = (value: string) =>
    fixture.nativeElement.querySelector(`[data-part="item"][data-value="${value}"]`) as HTMLElement;
  const trigger = (value: string) =>
    item(value).querySelector(':scope > [data-part="trigger"]') as HTMLButtonElement;
  const link = (href: string) =>
    fixture.nativeElement.querySelector(`a[href="${href}"]`) as HTMLAnchorElement;
  const click = (element: HTMLElement, detail = 1) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
    fixture.detectChanges();
  };
  const key = (element: HTMLElement, name: string) => {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name }),
    );
    fixture.detectChanges();
  };
  const last = () => host.requests[host.requests.length - 1];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, Nested] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  afterEach(() => vi.useRealTimers());

  it('renders every part the contract declares, with the identity a consumer selects by', () => {
    click(trigger('products'));
    for (const part of contract.members.navigationMenu.parts) {
      if (part === 'root') continue;
      expect(fixture.nativeElement.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().getAttribute('aria-label')).toBe('Navigation');
    expect(root().getAttribute('data-orientation')).toBe('horizontal');
    expect(root().getAttribute('data-size')).toBe('md');
  });

  it('is a disclosure: aria-expanded, aria-controls, the panel after the trigger, no menu role', () => {
    const button = trigger('products');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(panel?.hidden).toBe(true);
    expect(button.nextElementSibling).toBe(panel);
    expect(fixture.nativeElement.querySelector('[role^="menu"]')).toBeNull();
  });

  it('opens and closes by click, two-way, with the reason pointer', () => {
    click(trigger('products'));
    expect(host.value()).toBe('products');
    expect(trigger('products').getAttribute('aria-expanded')).toBe('true');
    expect(last()?.reason).toBe('pointer');
    click(trigger('products'));
    expect(host.value()).toBeNull();
  });

  it('tells a key from a pointer by the click a key synthesises', () => {
    click(trigger('company'), 0);
    expect(last()).toMatchObject({ value: 'company', reason: 'keyboard' });
  });

  it('keeps the section when the request is cancelled', () => {
    fixture.componentInstance.requests.length = 0;
    const subscription = fixture.debugElement
      .query((node) => node.nativeElement === root())
      .injector.get(SlNavigationMenu)
      .valueChangeRequest.subscribe((request) => request.cancel());
    click(trigger('products'));
    expect(trigger('products').getAttribute('aria-expanded')).toBe('false');
    subscription.unsubscribe();
  });

  it('opens by hover after the delay, switches without it, and never on touch', () => {
    vi.useFakeTimers();
    const enter = (element: HTMLElement, pointerType: string) => {
      const event = new MouseEvent('pointerenter', { bubbles: false }) as PointerEvent;
      Object.defineProperty(event, 'pointerType', { value: pointerType });
      element.dispatchEvent(event);
    };
    enter(trigger('products'), 'touch');
    vi.advanceTimersByTime(500);
    expect(host.value()).toBeNull();
    enter(trigger('products'), 'mouse');
    vi.advanceTimersByTime(199);
    expect(host.value()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(host.value()).toBe('products');
    enter(trigger('company'), 'mouse');
    expect(host.value()).toBe('company');
  });

  it('closes with the reason blur when focus leaves the root', () => {
    click(trigger('products'));
    link('#warehouse').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fixture.nativeElement.querySelector('#outside'),
      }),
    );
    expect(host.value()).toBeNull();
    expect(last()?.reason).toBe('blur');
  });

  it('closes when a panel link is followed', () => {
    click(trigger('products'));
    click(link('#fleet'));
    expect(host.value()).toBeNull();
    expect(last()?.reason).toBe('select');
  });

  it('walks the row with the arrows and enters an open panel with ArrowDown', () => {
    click(trigger('products'));
    trigger('products').focus();
    key(trigger('products'), 'ArrowRight');
    expect(document.activeElement).toBe(link('#documentation'));
    key(link('#documentation'), 'ArrowLeft');
    expect(document.activeElement).toBe(trigger('products'));
    key(trigger('products'), 'ArrowDown');
    expect(document.activeElement).toBe(link('#warehouse'));
  });

  it('marks the current link and the section that holds it', () => {
    expect(link('#fleet').getAttribute('aria-current')).toBe('page');
    expect(trigger('products').hasAttribute('data-current')).toBe(true);
    expect(trigger('company').hasAttribute('data-current')).toBe(false);
  });

  it('keeps a disabled section closed', () => {
    expect(trigger('parceiros').disabled).toBe(true);
    expect(item('parceiros').hasAttribute('data-disabled')).toBe(true);
  });

  it('names a group by its label', () => {
    const group = fixture.nativeElement.querySelector('[data-part="group"]') as HTMLElement;
    const label = document.getElementById(group.getAttribute('aria-labelledby') ?? '');
    expect(label?.textContent).toBe('About');
  });

  it('draws the arrow inside the surface, and the surface after the list', () => {
    const viewport = root().querySelector(':scope > [data-part="viewport"]');
    expect(viewport?.previousElementSibling?.getAttribute('data-part')).toBe('list');
    expect(viewport?.querySelector('[data-part="arrow"]')).not.toBeNull();
  });

  it('renders a second level as a div with no surface, marking the outer section current', () => {
    const nested = TestBed.createComponent(Nested);
    nested.autoDetectChanges();
    const inner = nested.nativeElement.querySelector('[data-nested]') as HTMLElement;
    expect(inner.getAttribute('data-orientation')).toBe('vertical');
    expect(inner.hasAttribute('aria-label')).toBe(false);
    expect(inner.querySelector(':scope > [data-part="viewport"]')).toBeNull();
    const outer = nested.nativeElement.querySelector(
      '[data-value="catalogo"] > [data-part="trigger"]',
    ) as HTMLElement;
    expect(outer.hasAttribute('data-current')).toBe(true);
    (nested.nativeElement.querySelector('a[href="#manuais"]') as HTMLElement).click();
    nested.detectChanges();
    expect(nested.componentInstance.value()).toBeNull();
  });
});

describe('SlNavigationMenu defaults and words', () => {
  it('reads the hover delay an application set once, and its words from the language in force', async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideNavigationMenuDefaults({ openDelay: 50 }),
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="navigation-menu"]') as HTMLElement;
    // language: pt-BR
    expect(root.getAttribute('aria-label')).toBe('Navegação');
    // language: en-US
    const trigger = root.querySelector('[data-value="products"] > button') as HTMLElement;
    const event = new MouseEvent('pointerenter') as PointerEvent;
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    trigger.dispatchEvent(event);
    vi.advanceTimersByTime(50);
    expect(fixture.componentInstance.value()).toBe('products');
    vi.useRealTimers();
  });
});
