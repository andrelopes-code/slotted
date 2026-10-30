import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/section/contract.json';
import { HeadingLevel } from '../typography';
import { Section } from './section';
import { SectionDefaultsProvider } from './section-defaults';
import {
  SectionActions,
  SectionBody,
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionHeading,
  SectionTags,
  SectionTitle,
} from './section-parts';
import type { SectionProps } from './section.types';

function Items({ title = 'Order items', ...props }: Partial<SectionProps> & { title?: string }) {
  return (
    <Section {...props}>
      <SectionHeader>
        <SectionTitle>
          <SectionEyebrow>36 itens</SectionEyebrow>
          <SectionHeading>{title}</SectionHeading>
          <SectionTags>
            <span>Pending</span>
          </SectionTags>
          <SectionDescription>Per the accepted quote.</SectionDescription>
        </SectionTitle>
        <SectionActions>
          <button type="button">Exportar</button>
        </SectionActions>
      </SectionHeader>
      <SectionBody>{props.children ?? <p>Pneu radial</p>}</SectionBody>
    </Section>
  );
}

const root = () => document.querySelector('[data-ui="section"]') as HTMLElement;

class FakeResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.callbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Section', () => {
  it('renders the anatomy the contract declares', () => {
    render(<Items />);
    for (const part of contract.members.section.parts) {
      expect(document.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
    expect(root().tagName).toBe('SECTION');
  });

  /** A section with a heading is a region named by it. */
  it('is a region named by its heading, and nothing without one', () => {
    render(<Items />);
    const heading = screen.getByRole('heading', { name: 'Order items' });
    expect(screen.getByRole('region', { name: 'Order items' })).toBe(root());
    expect(root().getAttribute('aria-labelledby')).toBe(heading.id);

    document.body.innerHTML = '';
    render(
      <Section>
        <SectionBody>no title</SectionBody>
      </Section>,
    );
    expect(screen.queryByRole('region')).toBeNull();
    expect(root()).not.toHaveAttribute('aria-labelledby');
  });

  /** Tags sit beside the heading, outside it, so the region's name is the heading's alone. */
  it('keeps the tags out of the heading and out of the region name', () => {
    render(<Items />);
    const tags = document.querySelector('[data-part="tags"]') as HTMLElement;
    expect(tags.tagName).toBe('DIV');
    expect(tags.parentElement).toHaveAttribute('data-part', 'title');
    expect(tags.previousElementSibling).toHaveAttribute('data-part', 'heading');
    expect(screen.getByRole('region', { name: 'Order items' })).toBe(root());
  });

  /** The outline: h2 by default, one deeper each time. */
  it('takes its rank from the outline and steps it for its body', () => {
    render(
      <HeadingLevel>
        <Items title="Fleet">
          <Items title="Heavy vehicles">
            <Items title="Tractor units" />
          </Items>
        </Items>
      </HeadingLevel>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Fleet');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heavy vehicles');
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Tractor units');
  });

  it('renders h1 with no outline around it, and the level the consumer states', () => {
    render(<Items level="4" />);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-level', '4');
  });

  it('writes its axes and a stable id', () => {
    render(<Items divider ground="surface" id="itens" size="lg" sticky />);
    expect(root()).toHaveAttribute('id', 'itens');
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-ground', 'surface');
    expect(root()).toHaveAttribute('data-divider');
    expect(root()).toHaveAttribute('data-sticky');
    expect(root().getAttribute('aria-labelledby')).toBe('itens-heading');
  });

  it('takes its defaults from the provider, and its own props over them', () => {
    render(
      <SectionDefaultsProvider divider ground="surface" size="sm" sticky>
        <Items size="lg" />
      </SectionDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-ground', 'surface');
    expect(root()).toHaveAttribute('data-divider');
    expect(root()).toHaveAttribute('data-sticky');
  });

  it('keeps the rank when the heading is rendered into another element', () => {
    render(
      <Section>
        <SectionHeader>
          <SectionTitle>
            <SectionHeading render={(props) => <div {...props} />}>Frota</SectionHeading>
          </SectionTitle>
        </SectionHeader>
      </Section>,
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Frota' });
    expect(heading.tagName).toBe('DIV');
    expect(root().getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('passes native props through', () => {
    render(<Items lang="pt-BR" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('lang', 'pt-BR');
  });
});

/** Every observer reports: the size one and the one that watches for the header being stuck. */
const fire = () =>
  FakeResizeObserver.callbacks.forEach((callback) => callback([], {} as ResizeObserver));

/**
 * A sticky header is chrome for what is under it: its measured height goes on
 * the root, and the stylesheet adds it to the page's sticky top for the body.
 */
describe('Section sticky header measurement', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    FakeResizeObserver.callbacks = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the header height on the root while sticky, and follows a resize', () => {
    const { rerender } = render(<Items sticky />);
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 48 });
    rerender(<Items sticky />);
    /* The observer's first report, as a browser delivers it after observe(). */
    fire();
    expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('48px');

    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 72 });
    fire();
    expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('72px');

    rerender(<Items />);
    expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('');
  });
});

/**
 * The stylesheet reaches the description as a child of the title; anywhere
 * else it is unstyled, and development says so.
 */
describe('SectionDescription outside SectionTitle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns in development when written in the header and not in the title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Section>
        <SectionHeader>
          <SectionDescription>Outside the title</SectionDescription>
        </SectionHeader>
      </Section>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside SectionTitle'));
  });

  it('is silent inside the title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Items />);
    expect(warn).not.toHaveBeenCalled();
  });
});
