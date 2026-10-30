import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/breadcrumb/contract.json';
import { SlottedProvider } from '../i18n';
import { Breadcrumb } from './breadcrumb';
import { BreadcrumbDefaultsProvider } from './breadcrumb-defaults';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbTrigger,
  collapsedRange,
} from './breadcrumb-parts';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import type { BreadcrumbProps } from './breadcrumb.types';

const LEVELS = ['Workspace', 'Northwind', 'Accounts', 'Billing', 'Invoices'];

function Trail({ levels = LEVELS, ...props }: Partial<BreadcrumbProps> & { levels?: string[] }) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        {levels.map((level) => (
          <BreadcrumbItem key={level}>
            <BreadcrumbLink href={`#${level}`}>{level}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>INV-0041</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const trail = () => screen.getByRole('navigation');
const ellipsis = () => screen.queryByRole('button');
const crumbs = () => screen.getAllByRole('listitem');

describe('Breadcrumb', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Trail className="page-trail" maxItems={0} />);

    expect(trail().tagName).toBe('NAV');
    expect(trail()).toHaveAttribute('data-ui', 'breadcrumb');
    expect(trail()).toHaveAttribute('data-part', 'root');
    expect(trail()).toHaveClass('page-trail');
    expect(screen.getByRole('list')).toHaveAttribute('data-part', 'list');
    expect(crumbs()[0]).toHaveAttribute('data-part', 'item');
    expect(screen.getByText('Workspace')).toHaveAttribute('data-part', 'link');
  });

  /** The landmark is only findable if it is named, and a page may hold several. */
  it('names the landmark, and takes the consumer name over its own', () => {
    const { rerender } = render(<Trail maxItems={0} />);
    expect(trail()).toHaveAttribute('aria-label', 'Breadcrumb');

    rerender(<Trail aria-label="Invoice" maxItems={0} />);
    expect(trail()).toHaveAttribute('aria-label', 'Invoice');

    rerender(<Trail maxItems={0} messages={{ label: 'Trilha' }} />);
    expect(trail()).toHaveAttribute('aria-label', 'Trilha');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Trail maxItems={4} />
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(trail()).toHaveAttribute('aria-label', 'Trilha de navegação');
    expect(ellipsis()).toHaveAccessibleName('Mostrar 3 níveis ocultos');
    // language: en-US
  });

  /**
   * The APG's own two attributes, and neither of them invented: the landmark's
   * name, and `aria-current="page"` on the element standing for this page.
   */
  it('marks the current page as text rather than as a link', () => {
    render(<Trail maxItems={0} />);

    const page = screen.getByText('INV-0041');
    expect(page.tagName).toBe('SPAN');
    expect(page).toHaveAttribute('aria-current', 'page');
    expect(page).toHaveAttribute('data-part', 'page');
    expect(contract.currentSource).toBe('aria-current');
  });

  it('draws a separator after every crumb but the last', () => {
    render(<Trail levels={['A', 'B']} maxItems={0} />);

    const separators = trail().querySelectorAll('[data-part="separator"]');
    expect(separators).toHaveLength(2);
    for (const separator of separators) expect(separator).toHaveAttribute('aria-hidden', 'true');
    expect(crumbs().at(-1)?.querySelector('[data-part="separator"]')).toBeNull();
  });

  it('replaces the separator content without replacing the element', () => {
    render(<Trail levels={['A']} maxItems={0} separator="›" />);

    const separator = trail().querySelector('[data-part="separator"]');
    expect(separator).toHaveTextContent('›');
  });

  describe('collapse', () => {
    /** Always the same shape, so `maxItems` means one thing at every depth. */
    it('keeps the same number of crumbs whatever it folds', () => {
      expect(collapsedRange(3, 1, 2)).toBeUndefined();
      expect(collapsedRange(4, 1, 2)).toEqual({ start: 1, end: 2 });
      expect(collapsedRange(5, 1, 2)).toEqual({ start: 1, end: 3 });
      expect(collapsedRange(9, 2, 3)).toEqual({ start: 2, end: 6 });
    });

    /**
     * The hidden crumbs leave the accessibility tree with the page, which is
     * the cost of collapsing in place: `getAllByRole` cannot see them, and the
     * button that hides them names the count for exactly that reason.
     */
    it('hides the middle and says how many it hides', () => {
      render(<Trail maxItems={4} />);

      expect(ellipsis()).toHaveAccessibleName('Show 3 hidden levels');
      expect(ellipsis()).toHaveAttribute('aria-expanded', 'false');
      expect(
        ellipsis()?.querySelector('[data-ui="icon"] > svg[data-glyph="ellipsis"]'),
      ).not.toBeNull();
      expect(trail().querySelectorAll('[data-part="item"][hidden]')).toHaveLength(3);
      expect(crumbs().filter((crumb) => crumb.hasAttribute('hidden'))).toHaveLength(0);
    });

    it('says level rather than levels when it hides one', () => {
      render(<Trail levels={['A', 'B', 'C']} maxItems={3} />);
      expect(ellipsis()).toHaveAccessibleName('Show 1 hidden level');
    });

    it('leaves a short trail alone, and folds none at all when told to', () => {
      const { rerender } = render(<Trail levels={['A', 'B']} maxItems={8} />);
      expect(ellipsis()).toBeNull();

      rerender(<Trail maxItems={0} />);
      expect(ellipsis()).toBeNull();
    });

    /** The ellipsis stops existing, so focus has to be given somewhere. */
    it('reveals the trail and moves focus to the first crumb it revealed', () => {
      render(<Trail maxItems={4} />);
      const button = ellipsis() as HTMLElement;
      button.focus();
      fireEvent.click(button);

      expect(ellipsis()).toBeNull();
      expect(crumbs().some((crumb) => crumb.hasAttribute('hidden'))).toBe(false);
      expect(document.activeElement).toBe(screen.getByText('Northwind'));
    });

    it('carries the reason a press and a key differ by', () => {
      const onExpandedChange = vi.fn();
      render(<Trail maxItems={4} onExpandedChange={onExpandedChange} />);

      fireEvent.keyDown(ellipsis() as HTMLElement, { key: 'Enter' });
      expect(onExpandedChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'keyboard', previous: false }),
      );
    });

    it('never moves state the consumer owns', () => {
      const onExpandedChange = vi.fn();
      render(<Trail expanded={false} maxItems={4} onExpandedChange={onExpandedChange} />);

      fireEvent.click(ellipsis() as HTMLElement);

      expect(onExpandedChange).toHaveBeenCalledOnce();
      expect(ellipsis()).not.toBeNull();
    });

    it('follows the consumer once they accept the request', () => {
      function Controlled() {
        const [expanded, setExpanded] = useState(false);
        return <Trail expanded={expanded} maxItems={4} onExpandedChange={setExpanded} />;
      }
      render(<Controlled />);

      fireEvent.click(ellipsis() as HTMLElement);
      expect(ellipsis()).toBeNull();
    });

    it('commits nothing when the request is cancelled', () => {
      render(<Trail maxItems={4} onExpandedChange={(_, request) => request.cancel()} />);

      fireEvent.click(ellipsis() as HTMLElement);
      expect(ellipsis()).not.toBeNull();
    });

    it('starts expanded when the consumer says so', () => {
      render(<Trail defaultExpanded maxItems={4} />);
      expect(ellipsis()).toBeNull();
    });

    it('writes the state a consumer may style', () => {
      render(<Trail defaultExpanded maxItems={4} />);
      expect(trail()).toHaveAttribute('data-expanded', '');
    });
  });

  describe('composition', () => {
    it('substitutes the rendered element of every part', () => {
      render(
        <Breadcrumb
          maxItems={0}
          render={({ ref, ...props }) => (
            <div {...props} ref={ref as Ref<HTMLDivElement>} role="navigation" />
          )}
        >
          <BreadcrumbList render={(props) => <ul {...props} />}>
            <BreadcrumbItem>
              <BreadcrumbLink render={(props) => <a {...props} data-router="" />} href="#a">
                A
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      expect(trail().tagName).toBe('DIV');
      expect(screen.getByRole('list').tagName).toBe('UL');
      expect(screen.getByText('A')).toHaveAttribute('data-router', '');
    });

    it('takes the application defaults, and yields to an explicit prop', () => {
      const { rerender } = render(
        <BreadcrumbDefaultsProvider separator="·">
          <Trail levels={['A']} maxItems={0} />
        </BreadcrumbDefaultsProvider>,
      );
      expect(trail().querySelector('[data-part="separator"]')).toHaveTextContent('·');

      rerender(
        <BreadcrumbDefaultsProvider separator="·">
          <Trail levels={['A']} maxItems={0} separator="›" />
        </BreadcrumbDefaultsProvider>,
      );
      expect(trail().querySelector('[data-part="separator"]')).toHaveTextContent('›');
    });

    it('passes every native attribute to the element that owns it', () => {
      render(
        <Breadcrumb data-testid="trail" id="trail" maxItems={0}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#a" hrefLang="pt-BR" rel="prev">
                A
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      expect(trail()).toHaveAttribute('id', 'trail');
      expect(screen.getByText('A')).toHaveAttribute('rel', 'prev');
      expect(screen.getByText('A')).toHaveAttribute('hreflang', 'pt-BR');
    });

    it('refuses to render a part outside the trail it belongs to', () => {
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => render(<BreadcrumbList />)).toThrow(/inside a Breadcrumb/);
      quiet.mockRestore();
    });
  });
});

/**
 * jsdom lays nothing out, so a width is given to each crumb and to the list,
 * and `createCollapse` does the arithmetic a browser runs. The same stub
 * `toolbar` uses.
 */
function withLayout() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.dataset['testWidth'] ?? 0);
    },
  });
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    const width = Number(this.dataset['testWidth'] ?? 0);
    return { bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0 } as DOMRect;
  };
}

function Narrow({ room, ...props }: Partial<BreadcrumbProps> & { room: number }) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList data-test-width={room}>
        {LEVELS.map((level) => (
          <BreadcrumbItem data-test-width={100} key={level}>
            <BreadcrumbLink href={`#${level}`}>{level}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem data-test-width={100}>
          <BreadcrumbPage>INV-0041</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe('Breadcrumb overflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  });

  it('folds the middle crumbs nearest the root into the ellipsis', () => {
    withLayout();
    render(<Narrow room={350} />);

    expect(ellipsis()).toHaveAccessibleName('Show 3 hidden levels');
    expect(crumbs().map((crumb) => crumb.textContent)).toEqual([
      'Workspace',
      '',
      'Invoices',
      'INV-0041',
    ]);
    expect(trail()).toHaveAttribute('data-collapsed', '3');
  });

  it('folds only as many as the width asks for', () => {
    withLayout();
    render(<Narrow room={450} />);

    expect(ellipsis()).toHaveAccessibleName('Show 2 hidden levels');
    expect(screen.getByText('Billing')).toBeVisible();
    expect(screen.getByText('Northwind').closest('li')).toHaveAttribute('hidden');
  });

  it('draws no ellipsis while the trail fits', () => {
    withLayout();
    render(<Narrow room={600} />);

    expect(ellipsis()).toBeNull();
    expect(trail()).not.toHaveAttribute('data-collapsed');
  });

  it('wraps instead when asked to, per instance or once for the application', () => {
    withLayout();
    const { unmount } = render(<Narrow overflow="wrap" room={350} />);
    expect(ellipsis()).toBeNull();
    unmount();

    render(
      <BreadcrumbDefaultsProvider overflow="wrap">
        <Narrow room={350} />
      </BreadcrumbDefaultsProvider>,
    );
    expect(ellipsis()).toBeNull();
  });

  it('expands what the width folded and gives focus to the first crumb it revealed', () => {
    withLayout();
    const onExpandedChange = vi.fn();
    render(<Narrow onExpandedChange={onExpandedChange} room={350} />);

    fireEvent.click(ellipsis() as HTMLElement);

    expect(onExpandedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(ellipsis()).toBeNull();
    expect(crumbs()).toHaveLength(6);
    expect(screen.getByText('Northwind')).toHaveFocus();
    expect(trail()).toHaveAttribute('data-expanded');
  });
});

describe('BreadcrumbTrigger', () => {
  it('is a button dressed as a crumb, with a chevron after its label', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbTrigger>web-app</BreadcrumbTrigger>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    const trigger = screen.getByRole('button', { name: 'web-app' });
    expect(trigger).toHaveAttribute('data-part', 'trigger');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger.querySelector('svg')).toHaveAttribute('data-glyph', 'chevron-down');
    expect(trigger).not.toHaveAttribute('aria-current');
  });

  it('keeps aria-current on the switcher of the page the reader is on', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbTrigger current>Production</BreadcrumbTrigger>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole('button', { name: 'Production' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it("opens the menu composed around it and stays the trail's own part", () => {
    const onClick = vi.fn();
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Menu>
              <MenuTrigger
                render={(props) => (
                  <BreadcrumbTrigger
                    {...props}
                    current
                    onClick={(event) => {
                      props.onClick?.(event);
                      onClick();
                    }}
                  >
                    Production
                  </BreadcrumbTrigger>
                )}
              />
              <MenuContent>
                <MenuItem>Preview</MenuItem>
              </MenuContent>
            </Menu>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    const trigger = screen.getByRole('button', { name: 'Production' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('data-part', 'trigger');
    expect(trigger).toHaveAttribute('aria-current', 'page');

    fireEvent.click(trigger);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-open');
  });
});
