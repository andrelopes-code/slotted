import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { LoadingOverlay, LoadingOverlayDefaultsProvider } from './index';

const root = () => document.querySelector('[data-ui="loading-overlay"][data-part="root"]')!;
const content = () => document.querySelector('[data-part="content"]')!;
const scrim = () => document.querySelector('[data-ui="loading-overlay"] > [data-part="scrim"]')!;
const panel = () => document.querySelector('[data-part="panel"]');
const announcement = () => document.querySelector('[data-part="announcement"]');
const cancel = () => document.querySelector<HTMLButtonElement>('[data-part="cancel"]');

describe('LoadingOverlay', () => {
  it('is selected in public by the family identifier, never by a class', () => {
    render(
      <LoadingOverlay className="app-overlay">
        <button type="button">Save</button>
      </LoadingOverlay>,
    );

    expect(root()).toHaveAttribute('data-ui', 'loading-overlay');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('app-overlay');
    expect(root().className).toBe('app-overlay');
  });

  it('blocks a region at the middle step with the theme’s own wash until told otherwise', () => {
    render(<LoadingOverlay>content</LoadingOverlay>);

    expect(root()).toHaveAttribute('data-scope', 'region');
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(root()).toHaveAttribute('data-veil', 'wash');
    expect(root()).toHaveAttribute('data-loading', '');
  });

  /**
   * The whole claim of the family: the content is still there, still measured,
   * and still the thing the region's geometry comes from. `skeleton` replaces;
   * this one covers.
   */
  it('keeps the covered content in the document and takes it out of reach', () => {
    const { rerender } = render(
      <LoadingOverlay>
        <button type="button">Save</button>
      </LoadingOverlay>,
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(content()).toHaveAttribute('inert');
    expect(root()).toHaveAttribute('aria-busy', 'true');

    rerender(
      <LoadingOverlay loading={false}>
        <button type="button">Save</button>
      </LoadingOverlay>,
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(content()).not.toHaveAttribute('inert');
    expect(root()).not.toHaveAttribute('aria-busy');
  });

  /**
   * `inert` cannot go on the root — an inert subtree leaves the accessibility
   * tree, which would silence the announcement and make the control
   * unpressable — so it goes on a wrapper that generates no box.
   */
  it('never marks the root or the layer inert', () => {
    render(
      <LoadingOverlay cancellable>
        <button type="button">Save</button>
      </LoadingOverlay>,
    );

    expect(root()).not.toHaveAttribute('inert');
    expect(scrim()).not.toHaveAttribute('inert');
    expect(announcement()).not.toHaveAttribute('inert');
    expect(cancel()).not.toBeNull();
  });

  it('announces the wait once, and empties the region rather than replacing it', () => {
    const { rerender } = render(
      <LoadingOverlay messages={{ label: 'Saving changes' }}>rows</LoadingOverlay>,
    );

    expect(announcement()).toHaveAttribute('role', 'status');
    expect(announcement()).toHaveTextContent('Saving changes');

    rerender(
      <LoadingOverlay loading={false} messages={{ label: 'Saving changes' }}>
        rows
      </LoadingOverlay>,
    );

    expect(announcement()?.textContent).toBe('');
  });

  it('says a second thing only when asked to', () => {
    render(
      <LoadingOverlay
        loading={false}
        messages={{ label: 'Saving changes' }}
        loadedLabel="Changes saved"
      >
        rows
      </LoadingOverlay>,
    );

    expect(announcement()).toHaveTextContent('Changes saved');
  });

  it('renders no live region at all when the page announces the wait elsewhere', () => {
    render(
      <LoadingOverlay live="off" messages={{ label: 'Saving changes' }}>
        rows
      </LoadingOverlay>,
    );

    expect(announcement()).toBeNull();
  });

  /** The same sentence twice is a screen reader saying it twice. */
  it('paints the two lines and hides them from the tree', () => {
    render(
      <LoadingOverlay messages={{ label: 'Saving changes' }} description="About a minute left.">
        rows
      </LoadingOverlay>,
    );

    expect(document.querySelector('[data-part="label"]')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('[data-part="description"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('holds the panel out of the document while nothing is waiting', () => {
    render(<LoadingOverlay loading={false}>rows</LoadingOverlay>);

    expect(scrim()).not.toHaveAttribute('data-loading');
    expect(panel()).toBeNull();
  });

  describe('cancellation', () => {
    it('renders no control until one is asked for', () => {
      render(<LoadingOverlay>rows</LoadingOverlay>);

      expect(cancel()).toBeNull();
    });

    it('asks to stop and commits nothing', () => {
      const onCancel = vi.fn();
      render(
        <LoadingOverlay cancellable onCancel={onCancel}>
          rows
        </LoadingOverlay>,
      );

      fireEvent.click(cancel()!);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel.mock.calls[0]?.[0]).toMatchObject({ reason: 'dismiss' });
      /* The layer is still up: only the application knows the work has stopped. */
      expect(root()).toHaveAttribute('data-loading', '');
      expect(content()).toHaveAttribute('inert');
    });

    it('takes Escape inside the layer, carrying the key as the reason', () => {
      const onCancel = vi.fn();
      render(
        <LoadingOverlay cancellable onCancel={onCancel}>
          rows
        </LoadingOverlay>,
      );

      fireEvent.keyDown(cancel()!, { key: 'Escape' });

      expect(onCancel.mock.calls[0]?.[0]).toMatchObject({ reason: 'escape' });
    });

    /**
     * A key that appears to do something and does nothing is worse than a key
     * nobody bound, and an overlay with nothing to cancel has nothing to ask.
     */
    it('leaves Escape alone when there is nothing to ask for', () => {
      const onCancel = vi.fn();
      render(
        <LoadingOverlay onCancel={onCancel}>
          <button type="button">Save</button>
        </LoadingOverlay>,
      );

      fireEvent.keyDown(scrim(), { key: 'Escape' });

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('moves focus out of the content before it goes inert, and puts it back', () => {
      function Demo({ loading }: { loading: boolean }) {
        return (
          <LoadingOverlay loading={loading} cancellable>
            <input aria-label="Logradouro" />
          </LoadingOverlay>
        );
      }

      const { rerender } = render(<Demo loading={false} />);
      const field = screen.getByLabelText('Logradouro');
      act(() => field.focus());
      expect(document.activeElement).toBe(field);

      rerender(<Demo loading />);
      expect(document.activeElement).toBe(cancel());

      rerender(<Demo loading={false} />);
      expect(document.activeElement).toBe(field);
    });

    it('takes the panel itself when there is no control to take', () => {
      function Demo({ loading }: { loading: boolean }) {
        return (
          <LoadingOverlay loading={loading}>
            <input aria-label="Logradouro" />
          </LoadingOverlay>
        );
      }

      const { rerender } = render(<Demo loading={false} />);
      act(() => screen.getByLabelText('Logradouro').focus());

      rerender(<Demo loading />);

      expect(document.activeElement).toBe(panel());
    });

    /** A background save does not take the caret out of another form. */
    it('moves nothing when focus was never inside the covered content', () => {
      function Demo({ loading }: { loading: boolean }) {
        return (
          <>
            <input aria-label="Outside" />
            <LoadingOverlay loading={loading} cancellable>
              <input aria-label="Logradouro" />
            </LoadingOverlay>
          </>
        );
      }

      const { rerender } = render(<Demo loading={false} />);
      const outside = screen.getByLabelText('Outside');
      act(() => outside.focus());

      rerender(<Demo loading />);

      expect(document.activeElement).toBe(outside);
    });
  });

  describe('timing', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('paints nothing until the wait has lasted long enough to report', () => {
      render(<LoadingOverlay delay={200}>rows</LoadingOverlay>);

      expect(root()).not.toHaveAttribute('data-loading');

      act(() => void vi.advanceTimersByTime(200));

      expect(root()).toHaveAttribute('data-loading', '');
    });

    it('holds a layer that did appear, and reports the withdrawal rather than the prop', () => {
      const onReveal = vi.fn();
      const { rerender } = render(
        <LoadingOverlay minDuration={400} onReveal={onReveal}>
          rows
        </LoadingOverlay>,
      );

      rerender(
        <LoadingOverlay loading={false} minDuration={400} onReveal={onReveal}>
          rows
        </LoadingOverlay>,
      );

      expect(root()).toHaveAttribute('data-loading', '');
      expect(onReveal).not.toHaveBeenCalled();

      act(() => void vi.advanceTimersByTime(400));

      expect(root()).not.toHaveAttribute('data-loading');
      expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it('costs no timer at all in the default configuration', () => {
      const timeout = vi.spyOn(globalThis, 'setTimeout');
      render(<LoadingOverlay>rows</LoadingOverlay>);

      expect(timeout).not.toHaveBeenCalled();
      timeout.mockRestore();
    });
  });

  describe('page scope', () => {
    it('portals the layer, covers no region of its own, and claims no busy region', () => {
      render(<LoadingOverlay scope="page" messages={{ label: 'Closing the period' }} />);

      expect(root().parentElement).not.toBe(document.body.firstElementChild);
      expect(document.querySelector('[data-part="content"]')).toBeNull();
      expect(root()).not.toHaveAttribute('aria-busy');
      expect(root()).toHaveAttribute('data-scope', 'page');
    });

    /**
     * `aria-modal` inherits only into `dialog` and `alertdialog`, and this
     * layer is neither. What it does instead is what ARIA 1.2 asks of a modal
     * element: make the rest of the document inert.
     */
    it('writes no aria-modal and no dialog role', () => {
      render(<LoadingOverlay scope="page" />);

      expect(root()).not.toHaveAttribute('aria-modal');
      expect(root()).not.toHaveAttribute('role');
    });
  });

  describe('composition', () => {
    it('substitutes the region’s element and hands it every attribute', () => {
      render(
        <LoadingOverlay
          messages={{ label: 'Reconciling' }}
          render={(props) => <section {...props} />}
        >
          rows
        </LoadingOverlay>,
      );

      expect(root().tagName).toBe('SECTION');
      expect(root()).toHaveAttribute('data-veil', 'wash');
    });

    it('substitutes the control and still takes the press', () => {
      const onCancel = vi.fn();
      render(
        <LoadingOverlay
          cancellable
          onCancel={onCancel}
          renderCancel={(props) => <button {...props} data-testid="own-control" />}
        >
          rows
        </LoadingOverlay>,
      );

      const control = document.querySelector('[data-part="cancel"]')!;
      expect(control).toHaveAttribute('data-testid', 'own-control');
      fireEvent.click(control);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('lets an application decide once, and a prop still win', () => {
      render(
        <LoadingOverlayDefaultsProvider size="sm" veil="blur">
          <LoadingOverlay />
          <LoadingOverlay veil="none" />
        </LoadingOverlayDefaultsProvider>,
      );

      const roots = document.querySelectorAll('[data-ui="loading-overlay"][data-part="root"]');
      expect(roots[0]).toHaveAttribute('data-veil', 'blur');
      expect(roots[0]).toHaveAttribute('data-size', 'sm');
      expect(roots[1]).toHaveAttribute('data-veil', 'none');
    });

    it('speaks the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <LoadingOverlay cancellable />
          <LoadingOverlay messages={{ label: 'Aguarde' }} />
        </SlottedProvider>,
      );

      const announcements = document.querySelectorAll('[data-part="announcement"]');
      expect(announcements[0]).toHaveTextContent('Carregando…');
      expect(announcements[1]).toHaveTextContent('Aguarde');
      expect(document.querySelector('[data-part="cancel"]')).toHaveTextContent('Cancelar');
    });

    it('replaces the mark without replacing anything else', () => {
      render(
        <LoadingOverlay
          indicator={<span data-testid="own-mark" />}
          messages={{ label: 'Uploading' }}
        >
          rows
        </LoadingOverlay>,
      );

      const mark = document.querySelector('[data-part="indicator"]')!;
      expect(mark.querySelector('[data-testid="own-mark"]')).not.toBeNull();
      expect(mark.querySelector('[data-ui="progress-indicator"]')).toBeNull();
    });
  });
});
