import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/toast/contract.json';
import { SlottedProvider } from '../i18n';
import { createToaster, Toast, ToastDefaultsProvider, ToasterProvider, ToastRegion } from './index';
import type { Toaster, ToastMessage } from './index';

/** A toaster of its own per test, so no message outlives the render it was shown in. */
function setup(ui?: (toaster: Toaster) => React.ReactNode) {
  const toaster = createToaster();
  const result = render(
    <ToasterProvider value={toaster}>
      {ui?.(toaster) ?? <ToastRegion attach="inline" />}
    </ToasterProvider>,
  );
  return { toaster, ...result };
}

const region = () => screen.getByRole('region', { name: 'Notifications' });
const items = () => [...region().querySelectorAll<HTMLElement>('[data-part="item"]')];
const parts = (item: HTMLElement) =>
  [...item.children].map((child) => child.getAttribute('data-part'));

beforeEach(() => {
  /* `presence` schedules the frame that turns an arriving message from closed
     into open, and completes an exit on a timer when the browser reports none.
     Both are faked, so a test states the passage of time instead of waiting. */
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
});

/** One frame, which is what a message needs to finish arriving or leaving. */
function frame() {
  act(() => {
    vi.advanceTimersByTime(100);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastRegion', () => {
  it('is a named landmark, and writes no live role anywhere', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ title: 'Draft saved', description: 'Stored.' });
    });

    const root = region();
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-ui', 'toast');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root.querySelector('[aria-live]')).toBeNull();
    expect(root.querySelector('[role="alert"], [role="status"]')).toBeNull();
    expect(root.querySelector('[data-part="list"]')?.tagName).toBe('OL');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ title: 'Draft saved' });
    });

    const defaults = contract.members.toast.defaults;
    const root = region();
    expect(root).toHaveAttribute('data-placement', defaults.placement);
    expect(root).toHaveAttribute('data-stacking', defaults.stacking);
    expect(root).toHaveAttribute('data-swipe', String(defaults.swipe));
    expect(items()[0]).toHaveAttribute('data-tone', defaults.tone);
    expect(items()[0]).toHaveAttribute('data-variant', defaults.variant);
  });

  it('draws the anatomy the contract declares, in the order it declares it', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({
        title: 'Message archived',
        description: 'Out of the inbox.',
        actions: <button type="button">Undo</button>,
        progress: true,
        duration: 4000,
      });
    });

    expect(parts(items()[0] as HTMLElement)).toEqual([
      'icon',
      'content',
      'close',
      'actions',
      'progress',
    ]);
  });

  /** The one number the bar and the clock share, so they cannot disagree. */
  it('publishes the duration and the play state the stylesheet reads', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ title: 'Exported', duration: 4000 });
    });

    expect(items()[0]?.style.getPropertyValue('--slotted-toast-duration')).toBe('4000ms');
    expect(region().style.getPropertyValue('--slotted-toast-play-state')).toBe('running');

    fireEvent.pointerEnter(region());
    expect(region().style.getPropertyValue('--slotted-toast-play-state')).toBe('paused');
    expect(region()).toHaveAttribute('data-expanded');
  });

  it('holds the clock while the pointer is over the region', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved', duration: 1000 });
    });

    fireEvent.pointerEnter(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(items()).toHaveLength(1);

    fireEvent.pointerLeave(region());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items()[0]).not.toHaveAttribute('data-open');
  });

  it('shows the limit and keeps what arrives after it waiting', () => {
    const { toaster } = setup(() => <ToastRegion attach="inline" limit={2} />);
    act(() => {
      toaster.show({ id: 'a', title: 'a' });
      toaster.show({ id: 'b', title: 'b' });
      toaster.show({ id: 'c', title: 'c' });
    });

    expect(items()).toHaveLength(2);
    expect(items().map((item) => item.textContent)).toEqual(['b', 'a']);
  });
});

describe('dismissal', () => {
  it('names the reason the message left, and refuses a request the page cancelled', () => {
    const onToastsChange = vi.fn();
    const toaster = createToaster();
    render(
      <ToasterProvider value={toaster}>
        <ToastRegion attach="inline" onToastsChange={onToastsChange} />
      </ToasterProvider>,
    );

    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved' });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onToastsChange.mock.calls.at(-1)?.[1].reason).toBe('dismiss');
  });

  it('closes the message the keyboard is inside when Escape is pressed', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved' });
    });

    const item = items()[0] as HTMLElement;
    fireEvent.keyDown(item, { key: 'Escape' });
    expect(item).not.toHaveAttribute('data-open');
  });

  it('takes the message out of the document once its exit has finished', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved' });
    });
    frame();

    act(() => {
      toaster.dismiss('one', 'programmatic');
    });
    expect(items()).toHaveLength(1);
    expect(items()[0]).not.toHaveAttribute('data-open');

    frame();
    expect(items()).toHaveLength(0);
  });
});

describe('the keyboard', () => {
  /**
   * The whole of this family's claim on the keyboard. The APG's Alert pattern
   * is explicit that an arriving message must not move focus, so the reader
   * moves it.
   */
  it('moves focus into the region on the hotkey, and never on its own', () => {
    const { toaster } = setup(() => (
      <>
        <button type="button">outside</button>
        <ToastRegion attach="inline" />
      </>
    ));

    const outside = screen.getByRole('button', { name: 'outside' });
    outside.focus();

    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved' });
    });
    expect(document.activeElement).toBe(outside);

    fireEvent.keyDown(document, { key: 'F6' });
    expect(document.activeElement).toBe(items()[0]);
  });

  it('takes the key an application named instead of the family’s own', () => {
    const { toaster } = setup(() => <ToastRegion attach="inline" hotkey="Alt+T" />);
    act(() => {
      toaster.show({ id: 'one', title: 'Draft saved' });
    });

    fireEvent.keyDown(document, { key: 'F6' });
    expect(document.activeElement).not.toBe(items()[0]);

    fireEvent.keyDown(document, { key: 't', altKey: true });
    expect(document.activeElement).toBe(items()[0]);
  });
});

describe('what an application decides once', () => {
  it('reads the provider for every axis a message did not state', () => {
    const toaster = createToaster();
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <ToasterProvider value={toaster}>
          <ToastDefaultsProvider placement="top-start" tone="success" variant="soft">
            <ToastRegion attach="inline" />
          </ToastDefaultsProvider>
        </ToasterProvider>
      </SlottedProvider>,
    );

    act(() => {
      toaster.show({ title: 'Salvo' });
    });

    // language: pt-BR
    const root = screen.getByRole('region', { name: 'Notificações' });
    // language: en-US
    expect(root).toHaveAttribute('data-placement', 'top-start');
    const item = root.querySelector('[data-part="item"]');
    expect(item).toHaveAttribute('data-tone', 'success');
    expect(item).toHaveAttribute('data-variant', 'soft');
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    // language: en-US
  });

  it('lets a message overrule the provider it is under', () => {
    const toaster = createToaster();
    render(
      <ToasterProvider value={toaster}>
        <ToastDefaultsProvider tone="success">
          <ToastRegion attach="inline" />
        </ToastDefaultsProvider>
      </ToasterProvider>,
    );

    act(() => {
      toaster.show({ title: 'Falhou', tone: 'danger' });
    });

    expect(items()[0]).toHaveAttribute('data-tone', 'danger');
  });
});

describe('a queue the page owns', () => {
  it('renders exactly what the page passed, and asks before it changes', () => {
    function Owned() {
      const [toasts, setToasts] = useState<readonly ToastMessage<never>[]>([]);
      const toaster = createToaster();
      return (
        <ToasterProvider value={toaster}>
          <button
            type="button"
            onClick={() =>
              setToasts([
                {
                  id: 'one',
                  duration: 0,
                  priority: 'polite',
                  announcement: '',
                  loading: false,
                  action: false,
                  data: { title: 'Owned' } as never,
                  status: 'visible',
                  revision: 1,
                },
              ])
            }
          >
            add
          </button>
          <ToastRegion
            attach="inline"
            onToastsChange={(next) => setToasts(next as readonly ToastMessage<never>[])}
            toasts={toasts}
          />
        </ToasterProvider>
      );
    }

    render(<Owned />);
    expect(items()).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(items()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(items()).toHaveLength(0);
  });
});

describe('the marks', () => {
  const glyphIn = (item: HTMLElement, part: string) =>
    item.querySelector(`[data-part="${part}"] > [data-ui="icon"] > svg[data-part="glyph"]`);

  it('draws each tone’s glyph from the contract’s map, and the close as the x glyph', () => {
    const tones = Object.keys(contract.toneGlyphs) as (keyof typeof contract.toneGlyphs)[];
    for (const tone of tones) {
      /* One message per render: the region shows a limited number at once. */
      const { toaster, unmount } = setup();
      act(() => {
        toaster.show({ tone, title: tone });
      });
      const item = items()[0] as HTMLElement;
      const glyph = contract.toneGlyphs[tone];
      if (glyph === null) expect(item.querySelector('[data-part="icon"]'), tone).toBeNull();
      else {
        expect(glyphIn(item, 'icon'), tone).toHaveAttribute('data-glyph', glyph);
        expect(glyphIn(item, 'icon'), tone).toHaveAttribute('data-solid');
      }
      expect(glyphIn(item, 'close'), tone).toHaveAttribute('data-glyph', 'x');
      unmount();
    }
  });

  it('draws the contained loader while waiting, and nothing over a mark the page supplied', () => {
    const { toaster } = setup();
    act(() => {
      toaster.show({ id: 'waiting', loading: true, title: 'Saving' });
      toaster.show({ id: 'own', title: 'Mine', icon: <b data-own-mark="" /> });
    });

    const waiting = items().find((item) => item.hasAttribute('data-loading'));
    const own = items().find((item) => !item.hasAttribute('data-loading'));
    const icon = (item: HTMLElement | undefined) =>
      item?.querySelector('[data-part="icon"]') as HTMLElement;
    const loader = icon(waiting).querySelector('[data-ui="progress-indicator"]');
    expect(loader).toHaveAttribute('data-shape', 'morph');
    expect(loader).toHaveAttribute('data-contained');
    expect(loader).toHaveAttribute('aria-hidden', 'true');
    expect(loader).not.toHaveAttribute('role');
    expect(icon(waiting).querySelector('svg[data-part="glyph"]')).toBeNull();
    expect(icon(own).querySelector('svg')).toBeNull();
    expect(icon(own).querySelector('[data-own-mark]')).not.toBeNull();
  });
});

describe('the pile', () => {
  it('measures each message at its own height, and writes the open pile’s whole height', () => {
    const heights = [70, 46, 46];
    class Observer {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        /* The closed pile draws every message at the front one's height; only
           with the override lifted does a message report its own. */
        const index = items().indexOf(this);
        return { height: this.style.blockSize === 'auto' ? (heights[index] ?? 0) : 70 } as DOMRect;
      });

    const { toaster } = setup(() => <ToastRegion attach="inline" stacking="stack" />);
    act(() => {
      for (const id of ['a', 'b', 'c']) toaster.show({ id, title: id });
    });

    /* No stylesheet in this document, so the list's gap reads as zero. */
    expect(region().style.getPropertyValue('--slotted-toast-stack-height')).toBe('162px');
    expect(items().map((item) => item.style.getPropertyValue('--slotted-toast-height'))).toEqual([
      '70px',
      '46px',
      '46px',
    ]);
    expect(items()[2]?.style.getPropertyValue('--slotted-toast-stack-offset')).toBe('116px');
    expect(items().every((item) => item.style.blockSize === '')).toBe(true);
    rect.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('composition', () => {
  it('lets a page render its own message and keep the family’s behaviour', () => {
    const { toaster } = setup(() => (
      <ToastRegion attach="inline">
        {(message) => (
          <Toast key={message.id} message={message}>
            <div data-part="content" data-part-content="">
              <div data-part="title" data-part-title="">
                {String(message.data.title)}
              </div>
            </div>
          </Toast>
        )}
      </ToastRegion>
    ));

    act(() => {
      toaster.show({ id: 'one', title: 'Mine' });
    });
    frame();

    expect(items()[0]?.textContent).toBe('Mine');
    expect(items()[0]).toHaveAttribute('data-open');
  });
});
