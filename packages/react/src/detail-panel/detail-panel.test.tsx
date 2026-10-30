import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/detail-panel/contract.json';
import { SlottedProvider } from '../i18n';
import { PageHeader, PageHeaderHeading, PageHeaderTabs, PageHeaderTitle } from '../page-header';
import { DetailPanel } from './detail-panel';
import { DetailPanelDefaultsProvider } from './detail-panel-defaults';
import { DetailPanelBody, DetailPanelSection, DetailPanelTabs } from './detail-panel-parts';
import type { DetailPanelHandle, DetailPanelProps } from './detail-panel.types';

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', FakeResizeObserver);
vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
Element.prototype.scrollIntoView = vi.fn();

function Order({
  fields = <dl>Priya Raman</dl>,
  withTabs = true,
  ...props
}: Partial<DetailPanelProps> & { fields?: React.ReactNode; withTabs?: boolean }) {
  return (
    <DetailPanel recordKey="SO-2026-01842" {...props}>
      <PageHeader>
        <PageHeaderTitle>
          <PageHeaderHeading>SO-2026-01842 · Meridian Controls Group</PageHeaderHeading>
        </PageHeaderTitle>
        {withTabs ? (
          <PageHeaderTabs>
            <DetailPanelTabs label="Order sections" />
          </PageHeaderTabs>
        ) : null}
      </PageHeader>
      <DetailPanelBody aside={fields} message={<p>This order no longer exists</p>}>
        <DetailPanelSection
          name="linhas"
          label="Lines"
          count={4}
          actions={<button type="button">Export</button>}
        >
          <p>Servo Motor MX-240</p>
        </DetailPanelSection>
        <DetailPanelSection name="historico" label="History">
          <p>Order created</p>
        </DetailPanelSection>
      </DetailPanelBody>
    </DetailPanel>
  );
}

const root = () => document.querySelector('[data-ui="detail-panel"]') as HTMLElement;
const sections = () => [...document.querySelectorAll<HTMLElement>('[data-part="section"]')];
const tabs = () => [...document.querySelectorAll<HTMLElement>('[role="tab"]')];

describe('DetailPanel', () => {
  it('renders the anatomy the contract declares, as an article named by the heading', () => {
    render(<Order footer={<button type="button">Close</button>} />);
    for (const part of contract.members.detailPanel.parts) {
      if (part === 'banner' || part === 'message' || part === 'section-actions') continue;
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().tagName).toBe('ARTICLE');
    expect(root().dataset['key']).toBe('SO-2026-01842');
    const heading = document.querySelector('[data-ui="page-header"] [data-part="heading"]');
    expect(heading?.id).toBeTruthy();
    expect(root().getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(root().firstElementChild?.getAttribute('data-ui')).toBe('page-header');
  });

  it('carries the defaults the contract declares', () => {
    render(<Order withTabs={false} />);
    const defaults = contract.members.detailPanel.defaults;
    expect(root().dataset['layout']).toBe(defaults.layout);
    expect(root().dataset['aside']).toBe(defaults.aside);
    expect(root().dataset['level']).toBe(defaults.level);
    expect(root().dataset['size']).toBe(defaults.size);
    expect(root().dataset['scroll']).toBe(defaults.scroll);
    expect(root().dataset['mount']).toBe(defaults.mount);
    expect(root().dataset['status']).toBe(defaults.status);
    expect(root().hasAttribute('data-loading')).toBe(false);
  });

  it('gives the page-header its own level and size as defaults, and lets the header win', () => {
    const { unmount } = render(<Order level="3" size="lg" withTabs={false} />);
    const header = () => document.querySelector('[data-ui="page-header"]') as HTMLElement;
    expect(header().dataset['level']).toBe('3');
    expect(header().dataset['size']).toBe('lg');
    expect(document.querySelector('[data-ui="page-header"] h3')).not.toBeNull();
    unmount();
    render(
      <DetailPanel level="3">
        <PageHeader level="1">
          <PageHeaderTitle>
            <PageHeaderHeading>Titulo</PageHeaderHeading>
          </PageHeaderTitle>
        </PageHeader>
        <DetailPanelBody>
          <DetailPanelSection name="a" label="A">
            <p>a</p>
          </DetailPanelSection>
        </DetailPanelBody>
      </DetailPanel>,
    );
    expect(header().dataset['level']).toBe('1');
  });

  it('stacks the sections as section family roots one rank below the panel, with the count as a badge', () => {
    render(<Order level="2" withTabs={false} />);
    const stacked = sections();
    expect(stacked).toHaveLength(2);
    for (const section of stacked) {
      expect(section.getAttribute('role')).toBeNull();
      expect(section.hidden).toBe(false);
      expect(section.querySelector('[data-ui="section"]')).not.toBeNull();
    }
    expect(stacked[0]?.querySelector('h3')?.textContent).toContain('Lines');
    expect(stacked[0]?.querySelector('[data-ui="badge"]')?.textContent).toBe('4');
    expect(
      stacked[0]?.querySelector('[data-ui="section"] [data-part="actions"] button'),
    ).not.toBeNull();
    expect(document.querySelector('[role="tablist"]')).toBeNull();
  });

  it('under tabs renders the strip from the sections and wires each section as its tab’s panel', () => {
    render(<Order layout="tabs" />);
    expect(tabs().map((tab) => tab.textContent)).toEqual(['Lines 4', 'History']);
    const [first, second] = sections();
    expect(first?.getAttribute('role')).toBe('tabpanel');
    expect(first?.tabIndex).toBe(0);
    expect(first?.hidden).toBe(false);
    expect(first?.hasAttribute('data-current')).toBe(true);
    expect(second?.hidden).toBe(true);
    expect(tabs()[0]?.getAttribute('aria-controls')).toBe(first?.id);
    expect(first?.getAttribute('aria-labelledby')).toBe(tabs()[0]?.id);
    expect(first?.querySelector('[data-part="section-actions"] button')).not.toBeNull();
    expect(first?.querySelector('[data-ui="section"]')).toBeNull();
    /* The first section stands in when nothing is named. */
    expect(tabs()[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('forwards the strip’s request with its reason, and moves only when not cancelled', () => {
    const onSectionChange = vi.fn();
    render(<Order layout="tabs" onSectionChange={onSectionChange} />);
    fireEvent.click(tabs()[1] as HTMLElement, { detail: 1 });
    expect(onSectionChange).toHaveBeenCalledTimes(1);
    expect(onSectionChange.mock.calls[0]?.[0]).toBe('historico');
    expect(onSectionChange.mock.calls[0]?.[1]).toMatchObject({
      value: 'historico',
      previous: 'linhas',
      reason: 'pointer',
    });
    expect(sections()[1]?.hidden).toBe(false);
    expect(sections()[0]?.hidden).toBe(true);

    onSectionChange.mockImplementation((_, request) => request.cancel());
    fireEvent.click(tabs()[0] as HTMLElement, { detail: 1 });
    expect(sections()[1]?.hidden).toBe(false);
  });

  it('is controlled by section and waits for the consumer', () => {
    function Controlled() {
      const [section, setSection] = useState('linhas');
      return (
        <>
          <button type="button" onClick={() => setSection('historico')}>
            ir
          </button>
          <Order layout="tabs" section={section} onSectionChange={vi.fn()} />
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(tabs()[1] as HTMLElement, { detail: 1 });
    expect(sections()[0]?.hidden).toBe(false);
    fireEvent.click(screen.getByText('ir'));
    expect(sections()[1]?.hidden).toBe(false);
  });

  it('mounts a tabbed section’s content by the mount axis', () => {
    const { rerender } = render(<Order layout="tabs" mount="active" />);
    expect(sections()[1]?.textContent).toBe('');
    rerender(<Order layout="tabs" mount="eager" />);
    expect(sections()[1]?.textContent).toContain('Order created');
    rerender(<Order layout="tabs" mount="lazy" />);
    expect(sections()[1]?.textContent).toBe('');
    fireEvent.click(tabs()[1] as HTMLElement, { detail: 1 });
    fireEvent.click(tabs()[0] as HTMLElement, { detail: 1 });
    expect(sections()[1]?.textContent).toContain('Order created');
  });

  it('marks and scrolls a stacked section when the value arrives programmatically', () => {
    const scrolls = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
    scrolls.mockClear();
    const onSectionChange = vi.fn();
    function Deep() {
      const handle = useRef<DetailPanelHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.scrollToSection('historico')}>
            ir
          </button>
          <Order ref={handle} withTabs={false} onSectionChange={onSectionChange} />
        </>
      );
    }
    render(<Deep />);
    expect(sections().some((section) => section.hasAttribute('data-current'))).toBe(false);
    fireEvent.click(screen.getByText('ir'));
    expect(onSectionChange.mock.calls[0]?.[1]).toMatchObject({ reason: 'programmatic' });
    expect(sections()[1]?.hasAttribute('data-current')).toBe(true);
    expect(scrolls).toHaveBeenCalledWith({ block: 'start' });
  });

  it('replaces the columns with the message when the record is not there, and keeps the chrome', () => {
    render(<Order status="not-found" footer={<button type="button">Close</button>} />);
    expect(document.querySelector('[data-part="columns"]')).toBeNull();
    expect(document.querySelector('[data-part="message"]')?.textContent).toContain(
      'no longer exists',
    );
    expect(document.querySelector('[data-ui="page-header"]')).not.toBeNull();
    expect(document.querySelector('[data-part="footer"]')?.textContent).toBe('Close');
    expect(root().dataset['status']).toBe('not-found');
  });

  it('draws skeleton lines in place of the content while loading, and keeps the tab labels', () => {
    render(<Order layout="tabs" loading />);
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(sections()[0]?.textContent).not.toContain('Servo Motor');
    expect(sections()[0]?.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(document.querySelector('[data-part="aside"] [data-ui="skeleton"]')).not.toBeNull();
    expect(tabs()).toHaveLength(2);
  });

  it('names the aside from messages and lets a consumer rename it', () => {
    const { unmount } = render(<Order />);
    const aside = () => document.querySelector('[data-part="aside"]') as HTMLElement;
    expect(aside().tagName).toBe('ASIDE');
    expect(aside().getAttribute('aria-label')).toBe('Details');
    unmount();
    render(
      <DetailPanelDefaultsProvider aside="start" layout="tabs">
        <Order messages={{ aside: 'Campos' }} />
      </DetailPanelDefaultsProvider>,
    );
    expect(aside().getAttribute('aria-label')).toBe('Campos');
    expect(root().dataset['aside']).toBe('start');
    expect(root().dataset['layout']).toBe('tabs');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Order />
      </SlottedProvider>,
    );
    const aside = document.querySelector('[data-part="aside"]') as HTMLElement;
    expect(aside.getAttribute('aria-label')).toBe('Detalhes');
  });

  it('renders no aside under aside="none" and no banner or footer when none is written', () => {
    render(<Order aside="none" />);
    expect(document.querySelector('[data-part="aside"]')).toBeNull();
    expect(document.querySelector('[data-part="banner"]')).toBeNull();
    expect(document.querySelector('[data-part="footer"]')).toBeNull();
  });

  it('moves focus to the heading when the record changes under it, and not otherwise', () => {
    const { rerender } = render(<Order layout="tabs" />);
    const heading = () =>
      document.querySelector('[data-ui="page-header"] [data-part="heading"]') as HTMLElement;
    rerender(<Order layout="tabs" recordKey="SO-2026-01843" />);
    expect(document.activeElement).not.toBe(heading());
    act(() => (tabs()[0] as HTMLElement).focus());
    rerender(<Order layout="tabs" recordKey="SO-2026-01844" />);
    expect(document.activeElement).toBe(heading());
    expect(heading().getAttribute('tabindex')).toBe('-1');
  });

  it('passes native attributes and a consumer’s own name through', () => {
    render(<Order aria-label="Order" data-testid="panel" className="mine" />);
    expect(root().getAttribute('aria-label')).toBe('Order');
    expect(root().hasAttribute('aria-labelledby')).toBe(false);
    expect(root().dataset['testid']).toBe('panel');
    expect(root().classList.contains('mine')).toBe(true);
  });
});

/**
 * A stacked section's count is the section's tag, not part of its name: inside
 * the heading it joined the heading's accessible name and its tracked small
 * capitals. It stands in the section's tags, after the heading.
 */
describe('a stacked section with a count', () => {
  it('draws the count beside the heading, outside it and outside its name', () => {
    render(
      <DetailPanel>
        <DetailPanelBody>
          <DetailPanelSection count={3} label="Postings" name="postings">
            Rows
          </DetailPanelSection>
        </DetailPanelBody>
      </DetailPanel>,
    );
    const heading = screen.getByRole('heading', { name: 'Postings' });
    const badge = document.querySelector('[data-ui="badge"]') as HTMLElement;
    expect(heading.contains(badge)).toBe(false);
    expect(badge.closest('[data-part="tags"]')).not.toBeNull();
  });
});
