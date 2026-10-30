import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRef } from 'react';

import { VisuallyHidden } from '../visually-hidden';
import { Badge, BadgeAnchor, BadgeDefaultsProvider } from './index';

describe('Badge', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Badge data-testid="badge" end={<i />} start={<b />}>
        Draft
      </Badge>,
    );

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-ui', 'badge');
    expect(badge).toHaveAttribute('data-part', 'root');
    expect([...badge.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'start',
      'label',
      'end',
    ]);
  });

  /**
   * A flex container centers the line box, not the letters inside it. The trim
   * that fixes that needs a block container, and a flex container's own text
   * lives in an anonymous item no stylesheet can reach — so the words get a box.
   */
  it('always gives the words a box of their own, glyph or no glyph', () => {
    render(<Badge data-testid="badge">Draft</Badge>);

    const label = screen.getByTestId('badge').querySelector('[data-part="label"]');
    expect(label).not.toBeNull();
    expect(label).toHaveTextContent('Draft');
  });

  it('writes every axis a consumer may style on, and its defaults', () => {
    render(<Badge data-testid="badge">Draft</Badge>);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-tone', 'secondary');
    expect(badge).toHaveAttribute('data-variant', 'soft');
    expect(badge).toHaveAttribute('data-size', 'md');
    expect(badge).toHaveAttribute('data-shape', 'pill');
  });

  /** What a badge means comes from where it sits. */
  it('adds no role until a page asks for one', () => {
    render(<Badge data-testid="badge">Draft</Badge>);

    expect(screen.getByTestId('badge')).not.toHaveAttribute('role');
  });

  it('becomes a live region only when the page declares the policy', () => {
    render(
      <>
        <Badge data-testid="polite" live="polite" count={4} />
        <Badge data-testid="assertive" live="assertive" count={4} />
      </>,
    );

    expect(screen.getByTestId('polite')).toHaveAttribute('role', 'status');
    expect(screen.getByTestId('assertive')).toHaveAttribute('role', 'alert');
  });

  it('keeps a role the consumer wrote instead of inferring over it', () => {
    render(<Badge data-testid="badge" live="polite" role="note" count={4} />);

    expect(screen.getByTestId('badge')).toHaveAttribute('role', 'note');
  });

  describe('count', () => {
    it('writes the number, and marks the ceiling with a plus', () => {
      render(
        <>
          <Badge data-testid="under" count={8} />
          <Badge data-testid="over" count={140} />
          <Badge data-testid="raised" count={140} max={999} />
        </>,
      );

      expect(screen.getByTestId('under')).toHaveTextContent('8');
      expect(screen.getByTestId('over')).toHaveTextContent('99+');
      expect(screen.getByTestId('raised')).toHaveTextContent('140');
    });

    it('writes the digits the locale writes', () => {
      render(<Badge data-testid="badge" count={1234} max={false} locale="de-DE" />);

      expect(screen.getByTestId('badge')).toHaveTextContent('1.234');
    });

    /** Not an empty pill: the badge leaves the corner entirely. */
    it('renders nothing at nought unless nought is a value', () => {
      const { rerender } = render(<Badge data-testid="badge" count={0} />);
      expect(screen.queryByTestId('badge')).toBeNull();

      rerender(<Badge data-testid="badge" count={0} showZero />);
      expect(screen.getByTestId('badge')).toHaveTextContent('0');
    });

    /**
     * The count and the children are not alternatives. The usual pairing is a
     * number and the words that number does not say.
     */
    it('writes the value before the words the value does not say', () => {
      render(
        <Badge data-testid="badge" count={4}>
          <VisuallyHidden>unread messages</VisuallyHidden>
        </Badge>,
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('4unread messages');
    });

    it('takes a badge with no count at all through unchanged', () => {
      render(<Badge data-testid="badge" shape="dot" />);

      expect(screen.getByTestId('badge')).toHaveAttribute('data-shape', 'dot');
    });

    /** A dot draws no value at any size; its children are the only content. */
    it('draws no value in a dot, and keeps the words beside it', () => {
      render(
        <Badge data-testid="badge" shape="dot" count={4}>
          <VisuallyHidden>unread messages</VisuallyHidden>
        </Badge>,
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('unread messages');
      expect(screen.getByTestId('badge').textContent).not.toContain('4');
    });

    it('removes a dot whose count has fallen to nought', () => {
      render(<Badge data-testid="badge" shape="dot" count={0} />);

      expect(screen.queryByTestId('badge')).toBeNull();
    });
  });

  describe('defaults', () => {
    it('lets an application set them once for every badge under it', () => {
      render(
        <BadgeDefaultsProvider tone="accent" variant="solid" size="lg" max={9}>
          <Badge data-testid="badge" count={40} />
        </BadgeDefaultsProvider>,
      );

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-tone', 'accent');
      expect(badge).toHaveAttribute('data-variant', 'solid');
      expect(badge).toHaveAttribute('data-size', 'lg');
      expect(badge).toHaveTextContent('9+');
    });

    it('lets an explicit value win over the provider', () => {
      render(
        <BadgeDefaultsProvider tone="accent" max={9}>
          <Badge data-testid="badge" tone="danger" count={40} max={false} />
        </BadgeDefaultsProvider>,
      );

      expect(screen.getByTestId('badge')).toHaveAttribute('data-tone', 'danger');
      expect(screen.getByTestId('badge')).toHaveTextContent('40');
    });
  });

  describe('the frame', () => {
    it('carries the family identifier itself, because it contains the root', () => {
      render(
        <BadgeAnchor data-testid="anchor">
          <button type="button">Inbox</button>
          <Badge data-testid="badge" count={4} />
        </BadgeAnchor>,
      );

      expect(screen.getByTestId('anchor')).toHaveAttribute('data-ui', 'badge');
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-part', 'anchor');
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-placement', 'top-end');
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-overlap', 'rectangle');
      expect(screen.getByTestId('anchor')).toContainElement(screen.getByTestId('badge'));
    });

    it('names the corner and the host shape a consumer chose', () => {
      render(<BadgeAnchor data-testid="anchor" placement="bottom-start" overlap="circle" />);

      expect(screen.getByTestId('anchor')).toHaveAttribute('data-placement', 'bottom-start');
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-overlap', 'circle');
    });

    it('writes the correction of the corner as the two properties the sheet reads', () => {
      render(<BadgeAnchor data-testid="anchor" offset={{ x: -2, y: 2 }} />);

      const anchor = screen.getByTestId('anchor');
      expect(anchor.style.getPropertyValue('--slotted-badge-anchor-offset-x')).toBe('-2px');
      expect(anchor.style.getPropertyValue('--slotted-badge-anchor-offset-y')).toBe('2px');
    });

    /* An axis nobody stated is left to the sheet's own nought, and a style the
       page wrote itself survives beside the correction. */
    it('states only the axis it was given, and keeps the style it was handed', () => {
      render(<BadgeAnchor data-testid="anchor" offset={{ y: 4 }} style={{ display: 'block' }} />);

      const anchor = screen.getByTestId('anchor');
      expect(anchor.style.getPropertyValue('--slotted-badge-anchor-offset-x')).toBe('');
      expect(anchor.style.getPropertyValue('--slotted-badge-anchor-offset-y')).toBe('4px');
      expect(anchor.style.display).toBe('block');
    });
  });

  describe('the element', () => {
    it('renders a span, and lets the page substitute the one it means', () => {
      const { rerender } = render(<Badge data-testid="badge">Draft</Badge>);
      expect(screen.getByTestId('badge').tagName).toBe('SPAN');

      rerender(
        <Badge render={(props) => <a {...props} href="#releases" data-testid="badge" />}>
          v4.2.0
        </Badge>,
      );
      expect(screen.getByTestId('badge').tagName).toBe('A');
      expect(screen.getByTestId('badge')).toHaveAttribute('data-ui', 'badge');
    });

    it('passes native props, events and a ref through to the element that owns them', () => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <Badge ref={ref} data-testid="badge" id="release" title="Latest release" lang="en">
          v4.2.0
        </Badge>,
      );

      expect(ref.current).toBe(screen.getByTestId('badge'));
      expect(screen.getByTestId('badge')).toHaveAttribute('id', 'release');
      expect(screen.getByTestId('badge')).toHaveAttribute('title', 'Latest release');
      expect(screen.getByTestId('badge')).toHaveAttribute('lang', 'en');
    });
  });
});
