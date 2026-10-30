import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/fullscreen/contract.json';
import { SlottedProvider } from '../i18n';
import { Fullscreen, FullscreenContent, FullscreenTrigger } from './fullscreen';
import { FullscreenDefaultsProvider } from './fullscreen-defaults';
import { useFullscreen } from './use-fullscreen';

/**
 * jsdom has no Fullscreen API. A case that needs the agent installs one that
 * accepts, fires `fullscreenchange` before resolving as the specification
 * orders it, and can leave on its own.
 */
function installAgent() {
  let current: Element | null = null;
  /* The element the agent made full screen, handed over rather than aliased. */
  const take = (element: Element) => {
    current = element;
  };
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current });
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async function (this: HTMLElement) {
      take(this);
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  return {
    leave() {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    },
  };
}

afterEach(() => {
  for (const name of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen']) {
    delete (document as unknown as Record<string, unknown>)[name];
  }
  delete (HTMLElement.prototype as unknown as Record<string, unknown>)['requestFullscreen'];
});

/* The family's own root: the trigger's icon box is a `root` part too. */
const region = () =>
  document.querySelector('[data-ui="fullscreen"][data-part="root"]') as HTMLElement;
const trigger = () => screen.getByRole('button') as HTMLButtonElement;

function Panel(props: Parameters<typeof Fullscreen>[0]) {
  return (
    <Fullscreen {...props}>
      <h2>Revenue</h2>
      <FullscreenTrigger />
    </Fullscreen>
  );
}

describe('Fullscreen', () => {
  it('is selected by the family identifier, the region and the control each by its part', () => {
    render(<Panel className="card" />);

    expect(region()).toHaveAttribute('data-ui', contract.ui);
    expect(region()).toHaveClass('card');
    expect(trigger()).toHaveAttribute('data-ui', contract.ui);
    expect(trigger()).toHaveAttribute('data-part', 'trigger');
    expect(trigger()).toHaveAttribute('type', 'button');
    expect(trigger().querySelector('[data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * The label says what the press does next, so the Button pattern forbids
   * `aria-pressed`: the name is the state.
   */
  it('changes its label with the state and writes no aria-pressed', async () => {
    installAgent();
    render(<Panel />);

    expect(trigger()).toHaveAccessibleName('Full screen');
    fireEvent.click(trigger());
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'native'));
    expect(region()).toHaveAttribute('data-fullscreen');
    expect(trigger()).toHaveAttribute('data-fullscreen');
    expect(trigger()).toHaveAccessibleName('Exit full screen');
    expect(trigger()).not.toHaveAttribute('aria-pressed');
  });

  it('draws the glyph of the next press, and lets the consumer’s mark replace it', async () => {
    installAgent();
    const { unmount } = render(<Panel />);
    const glyph = () => trigger().querySelector('[data-part="icon"] > [data-ui="icon"] > svg');

    expect(glyph()).toHaveAttribute('data-glyph', contract.icon.enter);
    fireEvent.click(trigger());
    await waitFor(() => expect(trigger()).toHaveAttribute('data-fullscreen'));
    expect(glyph()).toHaveAttribute('data-glyph', contract.icon.exit);
    unmount();

    render(
      <Fullscreen>
        <FullscreenTrigger icon={<svg data-own="" />} />
      </Fullscreen>,
    );
    expect(trigger().querySelector('[data-part="icon"] > svg[data-own]')).not.toBeNull();
    expect(trigger().querySelector('[data-glyph]')).toBeNull();
  });

  it('asks the agent inside the press, with the navigation interface asked for', () => {
    installAgent();
    render(<Panel navigationUI="hide" />);

    fireEvent.click(trigger());
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' });
  });

  it('falls back to the layout without the API and reports it', async () => {
    const onFullscreenError = vi.fn();
    render(<Panel onFullscreenError={onFullscreenError} />);

    fireEvent.click(trigger());
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'layout'));
    expect(onFullscreenError).toHaveBeenCalledWith({ kind: 'unsupported' });
    expect(region()).toHaveAttribute('data-fullscreen');
  });

  it('reports the agent leaving as a request with the reason escape', async () => {
    const agent = installAgent();
    const onFullscreenChange = vi.fn();
    render(<Panel onFullscreenChange={onFullscreenChange} />);

    fireEvent.click(trigger());
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'native'));
    act(() => agent.leave());

    expect(onFullscreenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(region()).not.toHaveAttribute('data-fullscreen');
  });

  it('carries pointer and keyboard as the reasons of a press', () => {
    const onFullscreenChange = vi.fn();
    render(<Panel mode="layout" onFullscreenChange={onFullscreenChange} />);

    fireEvent.click(trigger(), { detail: 1 });
    expect(onFullscreenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    fireEvent.click(trigger(), { detail: 0 });
    expect(onFullscreenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('leaves the layout on Escape, and stays when the consumer refuses', async () => {
    function Refusing() {
      const [on, setOn] = useState(true);
      return (
        <Panel fullscreen={on} mode="layout" onFullscreenChange={(next) => setOn(next || on)} />
      );
    }
    render(<Refusing />);
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'layout'));

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(region()).toHaveAttribute('data-mode', 'layout');
  });

  it('leaves the layout on Escape when the state is its own', async () => {
    render(<Panel defaultFullscreen mode="layout" />);
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'layout'));

    fireEvent.keyDown(document.body, { key: 'Escape' });
    await waitFor(() => expect(region()).not.toHaveAttribute('data-fullscreen'));
    expect(region()).not.toHaveAttribute('data-mode');
  });

  it('refuses the press when the consumer prevents it', () => {
    const onFullscreenChange = vi.fn();
    render(
      <Fullscreen mode="layout" onFullscreenChange={onFullscreenChange}>
        <FullscreenTrigger onClick={(event) => event.preventDefault()} />
      </Fullscreen>,
    );

    fireEvent.click(trigger());
    expect(onFullscreenChange).not.toHaveBeenCalled();
  });

  it('marks the content part with the family identifier, and passes its element through', () => {
    render(
      <Fullscreen>
        <FullscreenContent className="chart" id="chart">
          <p>Chart</p>
        </FullscreenContent>
      </Fullscreen>,
    );

    const content = document.getElementById('chart')!;
    expect(content).toHaveAttribute('data-ui', contract.ui);
    expect(content).toHaveAttribute('data-part', 'content');
    expect(content).toHaveClass('chart');
    expect(content.parentElement).toBe(region());
  });

  it('keeps the words as the name of an icon-only control', () => {
    render(
      <Fullscreen>
        <FullscreenTrigger iconOnly />
      </Fullscreen>,
    );

    expect(trigger()).toHaveAttribute('data-icon-only');
    expect(trigger()).toHaveAccessibleName('Full screen');
  });

  it('reads size and variant from the provider, and the instance wins', () => {
    render(
      <FullscreenDefaultsProvider size="sm" variant="outline">
        <Fullscreen>
          <FullscreenTrigger size="lg" />
        </Fullscreen>
      </FullscreenDefaultsProvider>,
    );

    expect(trigger()).toHaveAttribute('data-size', 'lg');
    expect(trigger()).toHaveAttribute('data-variant', 'outline');
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Fullscreen>
          <FullscreenTrigger />
        </Fullscreen>
        <Fullscreen messages={{ enter: 'Apresentar' }}>
          <FullscreenTrigger />
        </Fullscreen>
      </SlottedProvider>,
    );

    const [shared, own] = screen.getAllByRole('button');
    expect(shared).toHaveAccessibleName('Tela cheia');
    expect(own).toHaveAccessibleName('Apresentar');
  });

  it('drives a region from a control outside it through the handle', async () => {
    function Outside() {
      const [element, setElement] = useState<HTMLElement | null>(null);
      const handle = useFullscreen(element, { mode: 'layout' });
      return (
        <>
          <FullscreenTrigger target={handle} />
          <section data-mode={handle.mode ?? undefined} data-testid="doc" ref={setElement} />
        </>
      );
    }
    render(<Outside />);

    fireEvent.click(trigger());
    await waitFor(() => expect(screen.getByTestId('doc')).toHaveAttribute('data-mode', 'layout'));
    expect(trigger()).toHaveAccessibleName('Exit full screen');
  });

  it('leaves native full screen when it unmounts in it', async () => {
    installAgent();
    const { unmount } = render(<Panel />);

    fireEvent.click(trigger());
    await waitFor(() => expect(region()).toHaveAttribute('data-mode', 'native'));
    unmount();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });
});
