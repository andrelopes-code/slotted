import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/collapsible/contract.json';
import { Accordion } from '../accordion';
import { Collapsible } from './collapsible';
import { CollapsibleDefaultsProvider } from './collapsible-defaults';
import {
  CollapsibleActions,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from './collapsible-parts';
import type { CollapsibleProps } from './collapsible.types';

function Basic({ title = 'Delivery', ...props }: Partial<CollapsibleProps> & { title?: string }) {
  return (
    <Collapsible {...props}>
      <CollapsibleHeader>
        <CollapsibleTrigger>{title}</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>prevista para 12 de setembro</CollapsiblePanel>
    </Collapsible>
  );
}

const root = () => document.querySelector('[data-ui="collapsible"]') as HTMLElement;
const trigger = () => screen.getByRole('button');
const panel = () => document.querySelector('[data-part="panel"]');

describe('Collapsible', () => {
  it('renders the anatomy the contract declares', () => {
    render(
      <Collapsible defaultOpen level="3" region>
        <CollapsibleHeader>
          <CollapsibleTrigger description="3 of 12 items">Delivery</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsibleActions>
          <button type="button">Edit</button>
        </CollapsibleActions>
        <CollapsiblePanel>scheduled for September 12</CollapsiblePanel>
      </Collapsible>,
    );

    for (const part of contract.members.collapsible.parts) {
      expect(document.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
    expect(document.querySelector('h3[data-part="header"]')).not.toBeNull();
    expect(screen.getByRole('region')).toBe(panel());
  });

  /** The pattern's two properties, and the identifiers that wire them. */
  it('wires the trigger to its panel both ways', () => {
    render(<Basic defaultOpen />);

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.getAttribute('id'));
    expect(panel()?.getAttribute('aria-labelledby')).toBe(trigger().getAttribute('id'));
  });

  /** The mark is the Glyph element, chosen from the indicator and the state. */
  it('draws the indicator glyph the indicator and the state select', () => {
    const glyph = () =>
      document.querySelector('[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph]');

    const { rerender } = render(<Basic />);
    expect(glyph()).toHaveAttribute('data-glyph', 'chevron-down');
    fireEvent.click(trigger());
    expect(glyph()).toHaveAttribute('data-glyph', 'chevron-down');

    rerender(<Basic indicator="plus-minus" />);
    expect(glyph()).toHaveAttribute('data-glyph', 'minus');
    fireEvent.click(trigger());
    expect(glyph()).toHaveAttribute('data-glyph', 'plus');

    rerender(<Basic indicator="none" />);
    expect(document.querySelector('[data-part="indicator"]')).toBeNull();
  });

  /**
   * The trigger is a `button`, so `Enter` and `Space` are the platform's and no
   * key listener exists for the toggle.
   */
  it('toggles from the platform, and reports which device asked', () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    fireEvent.click(trigger(), { detail: 1 });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(root()).toHaveAttribute('data-open');

    fireEvent.click(trigger(), { detail: 0 });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(root()).not.toHaveAttribute('data-open');
  });

  it('leaves the trigger in the page tab sequence', () => {
    render(<Basic />);
    expect(trigger()).not.toHaveAttribute('tabindex');
  });

  it('stays where the consumer puts it while controlled', () => {
    const onOpenChange = vi.fn();
    render(<Basic open={false} onOpenChange={onOpenChange} />);

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(root()).not.toHaveAttribute('data-open');
  });

  it('lets the request be refused before anything commits', () => {
    render(<Basic onOpenChange={(_open, request) => request.cancel()} />);

    fireEvent.click(trigger());

    expect(root()).not.toHaveAttribute('data-open');
  });

  it("composes with the consumer's own click handler rather than replacing it", () => {
    const onClick = vi.fn();
    render(
      <Collapsible>
        <CollapsibleHeader>
          <CollapsibleTrigger onClick={onClick}>Delivery</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>content</CollapsiblePanel>
      </Collapsible>,
    );

    fireEvent.click(trigger());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(root()).toHaveAttribute('data-open');
  });

  it('refuses the toggle when the consumer prevents the default', () => {
    render(
      <Collapsible>
        <CollapsibleHeader>
          <CollapsibleTrigger onClick={(event) => event.preventDefault()}>
            Delivery
          </CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>content</CollapsiblePanel>
      </Collapsible>,
    );

    fireEvent.click(trigger());
    expect(root()).not.toHaveAttribute('data-open');
  });

  describe('mount', () => {
    /** The box stays, so `aria-controls` never names an element that is gone. */
    it("drops the panel's content while closed under active, and keeps the box", () => {
      render(<Basic mount="active" />);
      expect(panel()).not.toBeNull();
      expect(document.querySelector('[data-part="content"]')).toBeNull();

      fireEvent.click(trigger());
      expect(document.querySelector('[data-part="content"]')).not.toBeNull();

      fireEvent.click(trigger());
      expect(document.querySelector('[data-part="content"]')).toBeNull();
    });

    it('builds the content on the first open and keeps it under lazy', () => {
      render(<Basic mount="lazy" />);
      expect(document.querySelector('[data-part="content"]')).toBeNull();

      fireEvent.click(trigger());
      fireEvent.click(trigger());
      expect(document.querySelector('[data-part="content"]')).not.toBeNull();
    });

    it('keeps a closed panel out of the tab sequence under eager', () => {
      render(<Basic mount="eager" />);
      expect(panel()).toHaveAttribute('inert');

      fireEvent.click(trigger());
      expect(panel()).not.toHaveAttribute('inert');
    });

    /**
     * The browser removes the attribute itself and fires `beforematch`; the
     * family answers by asking to open, with the one reason the closed
     * vocabulary holds for a move the browser made.
     */
    it('opens the panel the browser page search found', () => {
      const onOpenChange = vi.fn();
      render(<Basic mount="until-found" onOpenChange={onOpenChange} />);

      expect(panel()).toHaveAttribute('hidden', 'until-found');
      expect(panel()).not.toHaveAttribute('inert');

      fireEvent(panel() as Element, new Event('beforematch', { bubbles: true }));

      expect(onOpenChange).toHaveBeenLastCalledWith(
        true,
        expect.objectContaining({ reason: 'programmatic' }),
      );
      expect(root()).toHaveAttribute('data-open');
      expect(panel()).not.toHaveAttribute('hidden');
    });
  });

  describe('resolution', () => {
    it("lets the consumer's own value win over the provider", () => {
      render(
        <CollapsibleDefaultsProvider size="sm" variant="framed">
          <Basic size="lg" />
        </CollapsibleDefaultsProvider>,
      );

      expect(root()).toHaveAttribute('data-size', 'lg');
      expect(root()).toHaveAttribute('data-variant', 'framed');
    });

    it('lets the accordion win over the provider and lose to the item', () => {
      render(
        <CollapsibleDefaultsProvider size="sm">
          <Accordion size="lg" indicator="plus-minus">
            <Basic />
            <Basic title="Payment" indicator="none" />
          </Accordion>
        </CollapsibleDefaultsProvider>,
      );

      const items = document.querySelectorAll('[data-ui="collapsible"]');
      expect(items[0]).toHaveAttribute('data-size', 'lg');
      expect(items[0]).toHaveAttribute('data-indicator', 'plus-minus');
      expect(items[1]).toHaveAttribute('data-indicator', 'none');
    });
  });

  it('reaches every trigger with the family disabled', () => {
    render(<Basic disabled />);

    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute('data-disabled');
  });

  it('says the panel is busy while the content has not arrived', () => {
    render(<Basic defaultOpen loading />);

    expect(root()).toHaveAttribute('data-loading');
    expect(panel()).toHaveAttribute('aria-busy', 'true');
  });

  it('substitutes the rendered element of each part', () => {
    render(
      <Collapsible defaultOpen render={(props) => <section {...props} />}>
        <CollapsibleHeader render={(props) => <h2 {...props} />}>
          <CollapsibleTrigger>Delivery</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel render={(props) => <article {...props} />}>content</CollapsiblePanel>
      </Collapsible>,
    );

    expect(document.querySelector('section[data-ui="collapsible"]')).not.toBeNull();
    expect(document.querySelector('h2[data-part="header"]')).not.toBeNull();
    expect(document.querySelector('article[data-part="panel"]')).not.toBeNull();
  });

  it('passes native attributes and events through to the element that owns them', () => {
    const onFocus = vi.fn();
    render(
      <Collapsible data-testid="box">
        <CollapsibleHeader>
          <CollapsibleTrigger name="delivery" onFocus={onFocus}>
            Delivery
          </CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>content</CollapsiblePanel>
      </Collapsible>,
    );

    expect(screen.getByTestId('box')).toBe(root());
    expect(trigger()).toHaveAttribute('name', 'delivery');
    fireEvent.focus(trigger());
    expect(onFocus).toHaveBeenCalled();
  });

  it('reads the initial value once and never again', () => {
    function Moving() {
      const [start, setStart] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setStart(false)}>
            mover
          </button>
          <Basic defaultOpen={start} />
        </>
      );
    }

    render(<Moving />);
    expect(root()).toHaveAttribute('data-open');

    fireEvent.click(screen.getByRole('button', { name: 'mover' }));
    expect(root()).toHaveAttribute('data-open');
  });

  it('throws for a part rendered outside the family', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<CollapsibleTrigger>Delivery</CollapsibleTrigger>)).toThrow(
      /must be rendered inside Collapsible/,
    );
    quiet.mockRestore();
  });
});
