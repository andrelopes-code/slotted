import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/alert/contract.json';
import { Button, ButtonDefaultsProvider } from '../button';
import { SlottedProvider } from '../i18n';
import {
  Alert,
  AlertActions,
  AlertContent,
  AlertDefaultsProvider,
  AlertDescription,
  AlertTitle,
} from './index';

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('Alert', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Alert data-testid="alert" dismissible>
        <AlertContent>
          <AlertTitle>Sua assinatura expira</AlertTitle>
          <AlertDescription>Renove para manter o acesso.</AlertDescription>
        </AlertContent>
        <AlertActions>
          <button type="button">Renovar</button>
        </AlertActions>
      </Alert>,
    );

    const alert = screen.getByTestId('alert');
    expect(alert.tagName).toBe('SECTION');
    expect(alert).toHaveAttribute('data-ui', 'alert');
    expect(alert).toHaveAttribute('data-part', 'root');
    expect(parts(alert)).toEqual(['icon', 'content', 'actions', 'dismiss']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(
      <Alert data-testid="alert">
        <AlertContent>Pronto.</AlertContent>
      </Alert>,
    );

    const alert = screen.getByTestId('alert');
    const { defaults } = contract.members.alert;
    expect(alert).toHaveAttribute('data-tone', defaults.tone);
    expect(alert).toHaveAttribute('data-variant', defaults.variant);
    expect(alert).toHaveAttribute('data-reach', defaults.reach);
    expect(alert).toHaveAttribute('data-live', defaults.live);
    expect(alert).toHaveAttribute('data-open', '');
  });

  it('puts the actions at the end of a page banner and under the words of any other reach', () => {
    render(
      <>
        <Alert data-testid="section">
          <AlertContent>Pronto.</AlertContent>
        </Alert>
        <Alert data-testid="page" reach="page">
          <AlertContent>Pronto.</AlertContent>
        </Alert>
        <Alert actionsPlacement="end" data-testid="end">
          <AlertContent>Pronto.</AlertContent>
        </Alert>
        <Alert actionsPlacement="below" data-testid="below" reach="page">
          <AlertContent>Pronto.</AlertContent>
        </Alert>
      </>,
    );

    expect(screen.getByTestId('section')).toHaveAttribute('data-actions-placement', 'below');
    expect(screen.getByTestId('page')).toHaveAttribute('data-actions-placement', 'end');
    expect(screen.getByTestId('end')).toHaveAttribute('data-actions-placement', 'end');
    expect(screen.getByTestId('below')).toHaveAttribute('data-actions-placement', 'below');
  });

  /**
   * The decision the family exists to get right. MDN states that the `alert`
   * role "should only be used for text content, not interactive elements such
   * as links or buttons", so the region is the text and the controls are its
   * siblings — not the other way round, which is what four of the ten surveyed
   * implementations ship.
   */
  it('announces with the text alone, and never with the controls inside it', () => {
    render(
      <Alert data-testid="alert" dismissible live="assertive">
        <AlertContent data-testid="content">
          <AlertTitle>Could not save</AlertTitle>
        </AlertContent>
        <AlertActions>
          <button type="button">Tentar de novo</button>
        </AlertActions>
      </Alert>,
    );

    const region = screen.getByTestId('content');
    expect(region).toHaveAttribute('role', 'alert');
    expect(region).not.toHaveAttribute('aria-live');
    expect(region.querySelector('button')).toBeNull();
    expect(screen.getByTestId('alert')).not.toHaveAttribute('role');
  });

  it('maps each live value to the role that already implies it', () => {
    for (const [live, role] of Object.entries(contract.liveRoles)) {
      const { unmount } = render(
        <Alert live={live as 'off' | 'polite' | 'assertive'}>
          <AlertContent data-testid="content">Mensagem</AlertContent>
        </Alert>,
      );

      const region = screen.getByTestId('content');
      if (role === null) expect(region).not.toHaveAttribute('role');
      else expect(region).toHaveAttribute('role', role);
      unmount();
    }
  });

  /**
   * A `section` with an `aria-labelledby` pointing at nothing has no accessible
   * name and is not a landmark, so the attribute is written only when a title
   * is actually there to name it.
   */
  it('names the box with its own title, and only when it has one', () => {
    const { rerender } = render(
      <Alert data-testid="alert">
        <AlertContent>
          <AlertTitle data-testid="title">Sobre os fusos</AlertTitle>
        </AlertContent>
      </Alert>,
    );

    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('aria-labelledby', screen.getByTestId('title').id);
    expect(screen.getByRole('region', { name: 'Sobre os fusos' })).toBe(alert);

    rerender(
      <Alert data-testid="alert">
        <AlertContent>No title.</AlertContent>
      </Alert>,
    );
    expect(screen.getByTestId('alert')).not.toHaveAttribute('aria-labelledby');
  });

  it('renders the mark the tone maps to, and nothing when it is refused', () => {
    const { rerender } = render(
      <Alert data-testid="alert" tone="danger">
        <AlertContent>Falhou.</AlertContent>
      </Alert>,
    );

    const icon = screen.getByTestId('alert').querySelector('[data-part="icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <Alert data-testid="alert" hideIcon tone="danger">
        <AlertContent>Falhou.</AlertContent>
      </Alert>,
    );
    expect(screen.getByTestId('alert').querySelector('[data-part="icon"]')).toBeNull();
  });

  it('draws each tone’s glyph from the contract’s map, solid, and no mark for secondary', () => {
    for (const [tone, glyph] of Object.entries(contract.toneGlyphs)) {
      const { unmount } = render(
        <Alert data-testid="alert" tone={tone as never}>
          <AlertContent>Uma mensagem.</AlertContent>
        </Alert>,
      );
      const alert = screen.getByTestId('alert');
      if (glyph === null) {
        expect(alert.querySelector('[data-part="icon"]'), tone).toBeNull();
      } else {
        const drawn = alert.querySelector(
          '[data-part="icon"] > [data-ui="icon"] > svg[data-part="glyph"]',
        );
        expect(drawn, tone).toHaveAttribute('data-glyph', glyph);
        expect(drawn, tone).toHaveAttribute('data-solid');
      }
      unmount();
    }
  });

  it('draws a mark the page supplied on a secondary alert', () => {
    render(
      <Alert data-testid="alert" icon={<svg data-testid="glyph" />} tone="secondary">
        <AlertContent>Nota.</AlertContent>
      </Alert>,
    );
    expect(screen.getByTestId('glyph').parentElement).toHaveAttribute('data-part', 'icon');
  });

  it('puts the page’s own mark in the box the tone’s would have had', () => {
    render(
      <Alert data-testid="alert" icon={<svg data-testid="glyph" />}>
        <AlertContent>Pronto.</AlertContent>
      </Alert>,
    );

    expect(screen.getByTestId('glyph').parentElement).toHaveAttribute('data-part', 'icon');
    expect(screen.getByTestId('alert').querySelector('[data-glyph]')).toBeNull();
  });

  describe('dismissal', () => {
    it('renders no control until the alert says it can be dismissed', () => {
      render(
        <Alert>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      expect(screen.queryByRole('button')).toBeNull();
    });

    it('draws the control as the x glyph', () => {
      render(
        <Alert data-testid="alert" dismissible>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      const glyph = screen
        .getByRole('button', { name: 'Dismiss' })
        .querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
      expect(glyph).toHaveAttribute('data-glyph', 'x');
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    });

    /**
     * The capability none of the ten surveyed implementations ships. All five
     * that dismiss are controlled only: `onDismiss` fires and the consumer
     * removes the element, so a banner nobody has written state for cannot be
     * dismissed at all.
     */
    it('closes itself when nobody owns the value, and stays in the document', () => {
      render(
        <Alert data-testid="alert" dismissible>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('hidden');
      expect(alert).not.toHaveAttribute('data-open');
    });

    it('only asks when the consumer owns the value', () => {
      const onOpenChange = vi.fn();
      render(
        <Alert data-testid="alert" dismissible onOpenChange={onOpenChange} open>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
      expect(screen.getByTestId('alert')).not.toHaveAttribute('hidden');
    });

    it('carries the reason and the event, and can be refused', () => {
      const onOpenChange = vi.fn((_open: boolean, request: { cancel(): void }) => {
        request.cancel();
      });
      render(
        <Alert data-testid="alert" dismissible onOpenChange={onOpenChange}>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      const request = onOpenChange.mock.calls[0]?.[1] as unknown as {
        reason: string;
        source: unknown;
      };
      expect(request.reason).toBe('dismiss');
      expect(request.source).toBeDefined();
      expect(screen.getByTestId('alert')).not.toHaveAttribute('hidden');
    });

    it('speaks the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Alert dismissible>
            <AlertContent>Pronto.</AlertContent>
          </Alert>
          <Alert dismissible messages={{ dismiss: 'Close notice' }}>
            <AlertContent>Pronto.</AlertContent>
          </Alert>
        </SlottedProvider>,
      );

      expect(screen.getByRole('button', { name: 'Dispensar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close notice' })).toBeInTheDocument();
    });
  });

  /**
   * The gap none of the ten fills: the reader tabs to the dismiss control,
   * activates it, the control is destroyed, and focus falls to the document
   * body — so the next Tab starts again at the top of the page.
   */
  describe('focus', () => {
    /**
     * `relatedTarget` is stated rather than produced: jsdom's focus manager
     * reports none, and the family reads it because a real browser does supply
     * it on `focusin`. What is under test is the rule — where the keyboard goes
     * when the message closes with focus inside it — and the live behavior is
     * exercised in the browser at the gate.
     */
    it('returns the keyboard to where it came from when the message closes', () => {
      render(
        <>
          <button data-testid="before" type="button">
            Antes
          </button>
          <Alert dismissible>
            <AlertContent>Pronto.</AlertContent>
          </Alert>
        </>,
      );

      const before = screen.getByTestId('before');
      const dismiss = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.focusIn(dismiss, { relatedTarget: before });
      fireEvent.click(dismiss);

      expect(before).toHaveFocus();
    });

    it('moves nothing when the application says it manages focus itself', () => {
      render(
        <>
          <button data-testid="before" type="button">
            Antes
          </button>
          <Alert dismissible restoreFocus={false}>
            <AlertContent>Pronto.</AlertContent>
          </Alert>
        </>,
      );

      const before = screen.getByTestId('before');
      const dismiss = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.focusIn(dismiss, { relatedTarget: before });
      fireEvent.click(dismiss);

      expect(before).not.toHaveFocus();
    });

    it('moves nothing when the keyboard was never inside the message', () => {
      render(
        <>
          <button data-testid="before" type="button">
            Antes
          </button>
          <Alert dismissible>
            <AlertContent>Pronto.</AlertContent>
          </Alert>
        </>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(screen.getByTestId('before')).not.toHaveFocus();
    });

    it('is a programmatic destination and never a tab stop', () => {
      render(
        <Alert data-testid="alert">
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      expect(screen.getByTestId('alert')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('composition', () => {
    it('lets an explicit prop beat the provider, and the provider beat the default', () => {
      render(
        <AlertDefaultsProvider reach="page" tone="warning">
          <Alert data-testid="inherited">
            <AlertContent>Um</AlertContent>
          </Alert>
          <Alert data-testid="stated" tone="danger">
            <AlertContent>Dois</AlertContent>
          </Alert>
        </AlertDefaultsProvider>,
      );

      expect(screen.getByTestId('inherited')).toHaveAttribute('data-tone', 'warning');
      expect(screen.getByTestId('inherited')).toHaveAttribute('data-reach', 'page');
      expect(screen.getByTestId('stated')).toHaveAttribute('data-tone', 'danger');
      expect(screen.getByTestId('stated')).toHaveAttribute('data-reach', 'page');
    });

    it('renders each part into the element the page means', () => {
      render(
        <Alert data-testid="alert" render={(props) => <aside {...props} />}>
          <AlertContent>
            <AlertTitle data-testid="title" render={(props) => <h3 {...props} />}>
              Maintenance
            </AlertTitle>
          </AlertContent>
        </Alert>,
      );

      expect(screen.getByTestId('alert').tagName).toBe('ASIDE');
      expect(screen.getByTestId('title').tagName).toBe('H3');
    });

    it('runs the consumer’s own handler beside the family’s', () => {
      const onClick = vi.fn();
      render(
        <Alert data-testid="alert" dismissible onClick={onClick}>
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('alert')).toHaveAttribute('hidden');
    });

    it('passes native attributes through to the element that owns them', () => {
      render(
        <Alert aria-describedby="hint" data-testid="alert" id="save-error" lang="pt-BR">
          <AlertContent>Pronto.</AlertContent>
        </Alert>,
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('id', 'save-error');
      expect(alert).toHaveAttribute('lang', 'pt-BR');
      expect(alert).toHaveAttribute('aria-describedby', 'hint');
    });

    it('reaches the element through a ref rather than through a handle', () => {
      function Probe() {
        const [element, setElement] = useState<HTMLElement | null>(null);
        return (
          <>
            <Alert ref={setElement}>
              <AlertContent>Pronto.</AlertContent>
            </Alert>
            <span data-testid="tag">{element?.tagName ?? ''}</span>
          </>
        );
      }
      render(<Probe />);

      expect(screen.getByTestId('tag')).toHaveTextContent('SECTION');
    });
  });
});

/**
 * A button in the actions part took the button defaults, accent and md: over
 * a warning ground an accent outline button drew no fill, in a color the
 * theme never measured against that ground.
 */
describe('AlertActions paint', () => {
  it('gives the buttons in it the alert’s tone and the sm size', () => {
    render(
      <Alert tone="warning">
        <AlertContent>
          <AlertTitle>Unresolved difference</AlertTitle>
        </AlertContent>
        <AlertActions>
          <Button>Go</Button>
        </AlertActions>
      </Alert>,
    );

    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('data-tone', 'warning');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-variant', 'solid');
  });

  it('takes the alert’s default tone, over an application’s button defaults', () => {
    render(
      <ButtonDefaultsProvider size="lg" tone="danger" variant="ghost">
        <AlertDefaultsProvider tone="secondary">
          <Alert>
            <AlertContent>
              <AlertTitle>Draft</AlertTitle>
            </AlertContent>
            <AlertActions>
              <Button>Go</Button>
            </AlertActions>
          </Alert>
        </AlertDefaultsProvider>
      </ButtonDefaultsProvider>,
    );

    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('data-tone', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('loses to a button that states the axis itself', () => {
    render(
      <Alert tone="warning">
        <AlertContent>
          <AlertTitle>Unresolved difference</AlertTitle>
        </AlertContent>
        <AlertActions>
          <Button size="md" tone="danger">
            Go
          </Button>
        </AlertActions>
      </Alert>,
    );

    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('data-tone', 'danger');
    expect(button).toHaveAttribute('data-size', 'md');
  });
});
