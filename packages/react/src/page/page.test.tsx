import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/page/contract.json';
import { SlottedProvider } from '../i18n';
import { Section, SectionHeader, SectionHeading, SectionTitle } from '../section';
import { Page, PageBody, PageFooter, STICKY_BOTTOM_PROPERTY } from './page';
import { PageDefaultsProvider } from './page-defaults';
import type { PageProps } from './page.types';

class FakeResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.callbacks.push(callback);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

function Screen(props: Partial<PageProps>) {
  return (
    <Page {...props}>
      <PageBody>
        <Section>
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>Order items</SectionHeading>
            </SectionTitle>
          </SectionHeader>
        </Section>
      </PageBody>
    </Page>
  );
}

const root = () => document.querySelector('[data-ui="page"]') as HTMLElement;

describe('Page', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    FakeResizeObserver.callbacks = [];
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the anatomy the contract declares', () => {
    render(
      <Screen
        footer={
          <PageFooter>
            <button type="button">Send</button>
          </PageFooter>
        }
      />,
    );
    for (const part of contract.members.page.parts) {
      expect(document.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
    expect(root().tagName).toBe('MAIN');
    expect(screen.getByRole('main')).toBe(root());
  });

  it('is the main landmark by default and can decline to be', () => {
    const { rerender } = render(<Screen />);
    expect(screen.getByRole('main')).toBe(root());
    rerender(<Screen landmark="none" />);
    expect(screen.queryByRole('main')).toBeNull();
    expect(root().tagName).toBe('DIV');
  });

  it('writes its axes and hands its measure to the body', () => {
    render(<Screen fill ground="surface" inset={4} scroll="self" width="measure" />);
    expect(root()).toHaveAttribute('data-scroll', 'self');
    expect(root()).toHaveAttribute('data-ground', 'surface');
    expect(root()).toHaveAttribute('data-fill');
    expect(root()).toHaveAttribute('data-width', 'measure');
    const container = root().querySelector('[data-part="body"] > [data-ui="container"]');
    expect(container).toHaveAttribute('data-size', 'measure');
    expect(container).toHaveAttribute('data-inset', '4');
  });

  /** The outline: a section written directly in the page takes h2. */
  it('steps the heading level for its body', () => {
    render(<Screen />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Order items');
  });

  it('names the footer and lays its actions out in one row', () => {
    render(
      <Screen
        footer={
          <PageFooter>
            <button type="button">Cancel</button>
            <button type="button">Send</button>
          </PageFooter>
        }
      />,
    );
    const footer = document.querySelector('[data-part="footer"]') as HTMLElement;
    expect(footer).toHaveAttribute('aria-label', 'Page actions');
    expect(footer.querySelector('[data-ui="container"] > [data-part="actions"]')).not.toBeNull();
    expect(footer).toHaveAttribute('data-status', 'open');
  });

  it('holds the footer through its exit and lets it go once it has left', async () => {
    const actions = (
      <PageFooter>
        <button type="button">Send</button>
      </PageFooter>
    );
    const { rerender } = render(<Screen footer={actions} />);
    rerender(<Screen footer={null} />);
    /* jsdom declares no transition, so the exit completes a frame later. */
    expect(document.querySelector('[data-part="footer"]')).toHaveAttribute(
      'data-status',
      'exiting',
    );
    await waitFor(() => expect(document.querySelector('[data-part="footer"]')).toBeNull());
    rerender(<Screen footer={actions} />);
    expect(['entering', 'open']).toContain(
      document.querySelector('[data-part="footer"]')?.getAttribute('data-status'),
    );
  });

  it('carries aria-busy on the body while loading', () => {
    render(<Screen loading />);
    expect(root()).toHaveAttribute('data-loading');
    expect(document.querySelector('[data-part="body"]')).toHaveAttribute('aria-busy', 'true');
  });

  it('publishes the footer height on the document and removes it on unmount', () => {
    const { unmount } = render(
      <Screen
        footer={
          <PageFooter>
            <button type="button">Send</button>
          </PageFooter>
        }
      />,
    );
    const footer = document.querySelector('[data-part="footer"]') as HTMLElement;
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 56 });
    for (const callback of FakeResizeObserver.callbacks) callback([], {} as never);
    expect(document.documentElement.style.getPropertyValue(STICKY_BOTTOM_PROPERTY)).toBe('56px');
    unmount();
    expect(document.documentElement.style.getPropertyValue(STICKY_BOTTOM_PROPERTY)).toBe('');
  });

  /**
   * The offset is an inherited custom property on the scroller: each write
   * invalidates style for everything under it. A footer that mounts writes it
   * once, and a resize that leaves the height alone writes nothing.
   */
  it('writes the footer height once when a footer mounts, and not again for the same height', () => {
    const { rerender } = render(<Screen />);
    for (const callback of FakeResizeObserver.callbacks) callback([], {} as never);
    FakeResizeObserver.callbacks = [];

    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, { attributeFilter: ['style'], attributes: true });
    const footer = (
      <PageFooter>
        <button type="button">Send</button>
      </PageFooter>
    );
    rerender(<Screen footer={footer} />);
    const bar = document.querySelector('[data-part="footer"]') as HTMLElement;
    Object.defineProperty(bar, 'offsetHeight', { configurable: true, value: 67 });
    for (const callback of FakeResizeObserver.callbacks) callback([], {} as never);
    const mounting = observer.takeRecords();
    for (const callback of FakeResizeObserver.callbacks) callback([], {} as never);
    const resizing = observer.takeRecords();
    observer.disconnect();

    expect(document.documentElement.style.getPropertyValue(STICKY_BOTTOM_PROPERTY)).toBe('67px');
    expect(mounting).toHaveLength(1);
    expect(resizing).toHaveLength(0);
  });

  it('takes its defaults from the provider, and its own props over them', () => {
    render(
      <PageDefaultsProvider ground="surface" scroll="self" width="content">
        <Screen
          messages={{ footer: 'Decisions' }}
          width="full"
          footer={
            <PageFooter>
              <button type="button">Send</button>
            </PageFooter>
          }
        />
      </PageDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-ground', 'surface');
    expect(root()).toHaveAttribute('data-scroll', 'self');
    expect(root()).toHaveAttribute('data-width', 'full');
    expect(document.querySelector('[data-part="footer"]')).toHaveAttribute(
      'aria-label',
      'Decisions',
    );
  });

  it('speaks the language in force, inside a page and outside one', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Screen
          footer={
            <PageFooter>
              <button type="button">Send</button>
            </PageFooter>
          }
        />
        <PageFooter data-testid="alone" />
      </SlottedProvider>,
    );
    expect(document.querySelector('[data-part="footer"]')).toHaveAttribute(
      'aria-label',
      // language: pt-BR
      'Ações da página',
    );
    expect(screen.getByTestId('alone')).toHaveAttribute('aria-label', 'Ações da página');
    // language: en-US
  });

  it('passes native props through and substitutes the root through render', () => {
    render(
      <Page lang="pt-BR" render={(props) => <article {...props} data-testid="page" />}>
        <PageBody>x</PageBody>
      </Page>,
    );
    expect(screen.getByTestId('page').tagName).toBe('ARTICLE');
    expect(screen.getByTestId('page')).toHaveAttribute('lang', 'pt-BR');
  });
});

/**
 * The inset lives on the body, so content written straight into the page is
 * drawn against the viewport's edges, and nothing said why. In development the
 * page says it, once, and names the part.
 */
describe('Page without a body', () => {
  it('warns once, naming PageBody, and stays quiet when the body is there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { unmount } = render(
      <Page>
        <p>Content</p>
      </Page>,
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('PageBody');
    unmount();

    warn.mockClear();
    render(
      <Page>
        <PageBody>
          <p>Content</p>
        </PageBody>
      </Page>,
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
