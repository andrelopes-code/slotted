import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Heading, HeadingLevel, Text } from './index';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Text', () => {
  it('renders a span, because a span claims nothing about the content', () => {
    render(<Text>Invoices</Text>);

    const text = screen.getByText('Invoices');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveAttribute('data-ui', 'typography');
    expect(text).toHaveAttribute('data-part', 'root');
  });

  it('writes no axis the consumer did not decide', () => {
    render(<Text>Invoices</Text>);

    const text = screen.getByText('Invoices');
    for (const axis of ['size', 'weight', 'tone', 'align', 'wrap', 'transform', 'numeric']) {
      expect(text).not.toHaveAttribute(`data-${axis}`);
    }
  });

  it('states each axis the consumer decided', () => {
    render(
      <Text
        align="center"
        numeric="tabular"
        size="lg"
        transform="uppercase"
        weight="medium"
        wrap="pretty"
      >
        Invoices
      </Text>,
    );

    const text = screen.getByText('Invoices');
    expect(text).toHaveAttribute('data-size', 'lg');
    expect(text).toHaveAttribute('data-weight', 'medium');
    expect(text).toHaveAttribute('data-align', 'center');
    expect(text).toHaveAttribute('data-wrap', 'pretty');
    expect(text).toHaveAttribute('data-transform', 'uppercase');
    expect(text).toHaveAttribute('data-numeric', 'tabular');
  });

  it('treats an inherited tone as the absence of a colour', () => {
    render(
      <>
        <Text tone="inherit">ambient</Text>
        <Text tone="muted">quiet</Text>
      </>,
    );

    expect(screen.getByText('ambient')).not.toHaveAttribute('data-tone');
    expect(screen.getByText('quiet')).toHaveAttribute('data-tone', 'muted');
  });

  it('keeps one line when truncation is asked for as a fact', () => {
    render(<Text truncate>A long single line</Text>);

    const text = screen.getByText('A long single line');
    expect(text).toHaveAttribute('data-truncate', '1');
    expect(text.style.getPropertyValue('--slotted-typography-lines')).toBe('1');
  });

  it('keeps the number of lines it was given, and never fewer than one', () => {
    render(
      <>
        <Text truncate={3}>three</Text>
        <Text truncate={0}>zero</Text>
        <Text truncate={false}>none</Text>
      </>,
    );

    expect(screen.getByText('three')).toHaveAttribute('data-truncate', '3');
    expect(screen.getByText('three').style.getPropertyValue('--slotted-typography-lines')).toBe(
      '3',
    );
    expect(screen.getByText('zero')).toHaveAttribute('data-truncate', '1');
    expect(screen.getByText('none')).not.toHaveAttribute('data-truncate');
  });

  it('leaves the whole string in the document when it truncates', () => {
    const sentence = 'The whole string stays, and only the picture is shorter.';
    render(<Text truncate={2}>{sentence}</Text>);

    expect(screen.getByText(sentence).textContent).toBe(sentence);
  });

  it('lets the consumer keep their own style beside the line count', () => {
    render(
      <Text style={{ opacity: 0.5 }} truncate={2}>
        styled
      </Text>,
    );

    const text = screen.getByText('styled');
    expect(text.style.opacity).toBe('0.5');
    expect(text.style.getPropertyValue('--slotted-typography-lines')).toBe('2');
  });

  it('hands the wiring to another element through render', () => {
    render(<Text render={(props) => <p {...props} />}>A paragraph</Text>);

    const text = screen.getByText('A paragraph');
    expect(text.tagName).toBe('P');
    expect(text).toHaveAttribute('data-ui', 'typography');
  });

  it('forwards the attributes and events the element already had', () => {
    render(
      <Text aria-label="Total due" id="total" lang="en">
        1,204.50
      </Text>,
    );

    const text = screen.getByLabelText('Total due');
    expect(text).toHaveAttribute('id', 'total');
    expect(text).toHaveAttribute('lang', 'en');
  });
});

describe('Heading', () => {
  it('renders the first rank when nothing suggests another', () => {
    render(<Heading>Billing</Heading>);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.tagName).toBe('H1');
    expect(heading).toHaveAttribute('data-ui', 'typography');
  });

  it('renders the rank it is given as the element of that rank', () => {
    render(<Heading level={3}>Invoices</Heading>);

    expect(screen.getByRole('heading', { level: 3 }).tagName).toBe('H3');
  });

  it('reads at the size its rank implies', () => {
    render(
      <>
        <Heading level={1}>one</Heading>
        <Heading level={4}>four</Heading>
        <Heading level={6}>six</Heading>
      </>,
    );

    expect(screen.getByText('one')).toHaveAttribute('data-size', '3xl');
    expect(screen.getByText('four')).toHaveAttribute('data-size', 'lg');
    expect(screen.getByText('six')).toHaveAttribute('data-size', 'sm');
  });

  it('separates the rank from the size when the page needs them apart', () => {
    render(
      <Heading level={2} size="md">
        Quiet section
      </Heading>,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('data-size', 'md');
  });

  it('is balanced and emphasised unless the consumer says otherwise', () => {
    render(
      <>
        <Heading>balanced</Heading>
        <Heading weight="regular" wrap="normal">
          plain
        </Heading>
      </>,
    );

    expect(screen.getByText('balanced')).toHaveAttribute('data-wrap', 'balance');
    expect(screen.getByText('balanced')).toHaveAttribute('data-weight', 'semibold');
    expect(screen.getByText('plain')).toHaveAttribute('data-wrap', 'normal');
    expect(screen.getByText('plain')).toHaveAttribute('data-weight', 'regular');
  });

  it('takes the rank of the section it is in', () => {
    render(
      <>
        <Heading>Page</Heading>
        <HeadingLevel>
          <Heading>Section</Heading>
          <HeadingLevel>
            <Heading>Subsection</Heading>
          </HeadingLevel>
        </HeadingLevel>
      </>,
    );

    expect(screen.getByText('Page').tagName).toBe('H1');
    expect(screen.getByText('Section').tagName).toBe('H2');
    expect(screen.getByText('Subsection').tagName).toBe('H3');
  });

  it('reports a stated rank that skips the outline instead of hiding it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(<Heading level={3}>Skipped</Heading>);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('skips the outline');
  });

  it('says nothing when a heading closes sections rather than opening one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <HeadingLevel>
        <HeadingLevel>
          <Heading level={1}>Back to the top rank</Heading>
          <Heading level={4}>One deeper than this section</Heading>
        </HeadingLevel>
      </HeadingLevel>,
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it('stops at the sixth rank and says that the outline stopped recording', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <HeadingLevel>
        <HeadingLevel>
          <HeadingLevel>
            <HeadingLevel>
              <HeadingLevel>
                <HeadingLevel>
                  <Heading>Deepest</Heading>
                </HeadingLevel>
              </HeadingLevel>
            </HeadingLevel>
          </HeadingLevel>
        </HeadingLevel>
      </HeadingLevel>,
    );

    expect(screen.getByText('Deepest').tagName).toBe('H6');
    expect(warn.mock.calls.at(-1)?.[0]).toContain('past level 6');
  });

  it('forwards the identifier an anchor needs', () => {
    render(
      <Heading id="billing" level={2}>
        Billing
      </Heading>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'billing');
  });

  /**
   * `typography.css` sets the heading face on the heading element, because the
   * heading carries the same `data-ui` and `data-part` as a line of text.
   */
  it('is the element the stylesheet sets in the heading face, and text is not', () => {
    const face = "[data-ui='typography']:is(h1, h2, h3, h4, h5, h6)";
    render(
      <>
        <Heading level={4}>Billing</Heading>
        <Text>Due on receipt</Text>
      </>,
    );

    expect(screen.getByText('Billing').matches(face)).toBe(true);
    expect(screen.getByText('Due on receipt').matches(face)).toBe(false);
  });
});
