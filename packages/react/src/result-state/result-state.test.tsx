import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/result-state/contract.json';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDefaultsProvider,
  ResultStateDescription,
  ResultStateFooter,
  ResultStateTitle,
} from './index';

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('ResultState', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <ResultState data-testid="region">
        <ResultStateContent>
          <ResultStateTitle>No projects yet</ResultStateTitle>
          <ResultStateDescription>Create a project to get started.</ResultStateDescription>
        </ResultStateContent>
        <ResultStateActions>
          <button type="button">Criar projeto</button>
        </ResultStateActions>
        <ResultStateFooter>
          <a href="#docs">What is a project?</a>
        </ResultStateFooter>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('data-ui', 'result-state');
    expect(region).toHaveAttribute('data-part', 'root');
    expect(parts(region)).toEqual(['media', 'content', 'actions', 'footer']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(
      <ResultState data-testid="region">
        <ResultStateContent>Pronto.</ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    const { defaults } = contract.members.resultState;
    expect(region).toHaveAttribute('data-status', defaults.status);
    expect(region).toHaveAttribute('data-reach', defaults.reach);
    expect(region).toHaveAttribute('data-align', defaults.align);
    expect(region).toHaveAttribute('data-live', defaults.live);
    expect(region).toHaveAttribute('data-illustration', defaults.illustration);
  });

  /**
   * The decision the family exists to get right. The text announces; the
   * controls beside it do not, because MDN's `alert` role reference states the
   * role "should only be used for text content, not interactive elements such
   * as links or buttons".
   */
  it('writes the live role on the text and on nothing else', () => {
    render(
      <ResultState data-testid="region" live="polite">
        <ResultStateContent data-testid="content">
          <ResultStateTitle>Nada corresponde ao filtro</ResultStateTitle>
        </ResultStateContent>
        <ResultStateActions data-testid="actions">
          <button type="button">Limpar filtros</button>
        </ResultStateActions>
      </ResultState>,
    );

    expect(screen.getByTestId('content')).toHaveAttribute('role', 'status');
    expect(screen.getByTestId('actions')).not.toHaveAttribute('role');
    expect(screen.getByTestId('region')).not.toHaveAttribute('role');
  });

  it('takes the louder role only when the page asks for it, and none at all when it does not', () => {
    const { rerender } = render(
      <ResultState live="assertive">
        <ResultStateContent data-testid="content">Falhou.</ResultStateContent>
      </ResultState>,
    );
    expect(screen.getByTestId('content')).toHaveAttribute('role', 'alert');

    rerender(
      <ResultState live="off">
        <ResultStateContent data-testid="content">Falhou.</ResultStateContent>
      </ResultState>,
    );
    expect(screen.getByTestId('content')).not.toHaveAttribute('role');
  });

  /**
   * The APG's region landmark practice states that "a region landmark must have
   * a label". A `section` pointing `aria-labelledby` at nothing has no
   * accessible name and is not a landmark, so the attribute is written only
   * once a title has said it exists.
   */
  it('names the region by its own title, and leaves the attribute off when there is none', () => {
    const { rerender } = render(
      <ResultState data-testid="region">
        <ResultStateContent>
          <ResultStateTitle data-testid="title">Sem acesso</ResultStateTitle>
        </ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    const title = screen.getByTestId('title');
    expect(region.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id).not.toBe('');

    rerender(
      <ResultState data-testid="region">
        <ResultStateContent>
          <ResultStateDescription>No title.</ResultStateDescription>
        </ResultStateContent>
      </ResultState>,
    );
    expect(screen.getByTestId('region')).not.toHaveAttribute('aria-labelledby');
  });

  /**
   * A page that writes its own identifier on the title — a skip target, an
   * anchor a table of contents points at — keeps it, and the box points
   * `aria-labelledby` at the one that is actually in the DOM. Registering
   * presence rather than the identifier is how the first draft came to name the
   * region by an identifier no element had.
   */
  it('keeps an identifier the page wrote on the title, and names the box by it', () => {
    render(
      <ResultState data-testid="region">
        <ResultStateContent>
          <ResultStateTitle data-testid="title" id="no-projects">
            No projects yet
          </ResultStateTitle>
        </ResultStateContent>
      </ResultState>,
    );

    expect(screen.getByTestId('title')).toHaveAttribute('id', 'no-projects');
    expect(screen.getByTestId('region')).toHaveAttribute('aria-labelledby', 'no-projects');
  });

  /**
   * The title and the description already say what the picture says. An
   * illustration that adds information is not decorative, and what it adds
   * belongs in the description — the conclusion Polaris reaches by hardcoding
   * `alt=""` on its own image.
   */
  it('draws the mark hidden from assistive technology, and lets the page replace it', () => {
    render(
      <ResultState data-testid="region" media={<img alt="" src="/empty.svg" />}>
        <ResultStateContent>Vazio.</ResultStateContent>
      </ResultState>,
    );

    const media = screen.getByTestId('region').querySelector('[data-part="media"]');
    expect(media).toHaveAttribute('aria-hidden', 'true');
    expect(media?.querySelector('img')).not.toBeNull();
  });

  it('leaves the picture box empty when the page supplies no illustration', () => {
    render(
      <ResultState data-testid="region">
        <ResultStateContent>Vazio.</ResultStateContent>
      </ResultState>,
    );

    const media = screen.getByTestId('region').querySelector("[data-part='media']");
    expect(media).not.toBeNull();
    expect(media?.children).toHaveLength(0);
    expect(media?.textContent).toBe('');
  });

  /**
   * The keyboard has somewhere to go after a filter empties a table, and the
   * family never sends it there by itself: moving focus unprompted is a change
   * of context nobody asked for.
   */
  it('is reachable programmatically without being in the tab sequence', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ResultState data-testid="region" ref={ref}>
        <ResultStateContent>Vazio.</ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    expect(region).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(document.body);
    ref.current?.focus();
    expect(document.activeElement).toBe(region);
  });

  it('keeps a tab index the consumer wrote', () => {
    render(
      <ResultState data-testid="region" tabIndex={0}>
        <ResultStateContent>Vazio.</ResultStateContent>
      </ResultState>,
    );

    expect(screen.getByTestId('region')).toHaveAttribute('tabindex', '0');
  });

  it('lets an application set its defaults once, and lets one region overrule them', () => {
    render(
      <ResultStateDefaultsProvider
        align="start"
        illustration="cards"
        live="off"
        reach="inline"
        status="no-results"
      >
        <ResultState data-testid="inherited">
          <ResultStateContent data-testid="inherited-content">Nada.</ResultStateContent>
        </ResultState>
        <ResultState data-testid="stated" reach="page" status="error">
          <ResultStateContent>Falhou.</ResultStateContent>
        </ResultState>
      </ResultStateDefaultsProvider>,
    );

    const inherited = screen.getByTestId('inherited');
    expect(inherited).toHaveAttribute('data-status', 'no-results');
    expect(inherited).toHaveAttribute('data-reach', 'inline');
    expect(inherited).toHaveAttribute('data-align', 'start');
    expect(inherited).toHaveAttribute('data-illustration', 'cards');
    expect(screen.getByTestId('inherited-content')).not.toHaveAttribute('role');

    const stated = screen.getByTestId('stated');
    expect(stated).toHaveAttribute('data-status', 'error');
    expect(stated).toHaveAttribute('data-reach', 'page');
    /* The axes it did not state still come from the provider. */
    expect(stated).toHaveAttribute('data-align', 'start');
  });

  it('renders every axis value the contract declares', () => {
    for (const status of contract.axes.status) {
      const { unmount } = render(
        <ResultState data-testid="region" status={status as 'empty'}>
          <ResultStateContent>Texto.</ResultStateContent>
        </ResultState>,
      );
      expect(screen.getByTestId('region')).toHaveAttribute('data-status', status);
      unmount();
    }
    for (const illustration of contract.axes.illustration) {
      const { unmount } = render(
        <ResultState data-testid="region" illustration={illustration as 'none'}>
          <ResultStateContent>Texto.</ResultStateContent>
        </ResultState>,
      );
      expect(screen.getByTestId('region')).toHaveAttribute('data-illustration', illustration);
      unmount();
    }
  });

  /**
   * The drawing is made around the page's glyph, in the box the family already
   * draws for `media`, and it stays hidden from assistive technology like
   * every picture in that box: the title says what the drawing shows.
   */
  it('draws the illustration around the glyph the page puts in the media box', () => {
    render(
      <ResultState data-testid="region" illustration="stack" media={<svg data-testid="glyph" />}>
        <ResultStateContent>Convide as primeiras pessoas.</ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    const media = region.querySelector('[data-part="media"]');
    expect(region).toHaveAttribute('data-illustration', 'stack');
    expect(media).toHaveAttribute('aria-hidden', 'true');
    expect(media).toContainElement(screen.getByTestId('glyph'));
  });

  /**
   * A heading puts the region in the document outline, which is right for a
   * full-page 404 and wrong for one card in a grid of twelve. The element is
   * the page's, and the family keeps the identifier it names the box by.
   */
  it('lets the page choose the element of every part', () => {
    render(
      <ResultState data-testid="region" render={(props) => <aside {...props} />}>
        <ResultStateContent data-testid="content" render={(props) => <aside {...props} />}>
          <ResultStateTitle data-testid="title" render={(props) => <h2 {...props} />}>
            This page does not exist
          </ResultStateTitle>
        </ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    expect(region.tagName).toBe('ASIDE');
    expect(screen.getByTestId('content')).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('data-ui', 'result-state');

    const title = screen.getByTestId('title');
    expect(title.tagName).toBe('H2');
    expect(region.getAttribute('aria-labelledby')).toBe(title.id);
  });

  it('passes native attributes and the consumer’s own handlers through', () => {
    let seen = 0;
    render(
      <ResultState
        data-testid="region"
        id="empty-projects"
        lang="pt-BR"
        onClick={() => {
          seen += 1;
        }}
      >
        <ResultStateContent>Vazio.</ResultStateContent>
      </ResultState>,
    );

    const region = screen.getByTestId('region');
    expect(region).toHaveAttribute('id', 'empty-projects');
    expect(region).toHaveAttribute('lang', 'pt-BR');
    region.click();
    expect(seen).toBe(1);
  });

  it('refuses to render a part outside the region that owns it', () => {
    expect(() => render(<ResultStateTitle>Solto</ResultStateTitle>)).toThrow(
      /has to be rendered inside a ResultState/,
    );
  });

  it('is named by its title in the server HTML, before any effect runs', () => {
    const html = renderToString(
      <ResultState status="empty">
        <ResultStateContent>
          <ResultStateTitle id="returns-title">No returns this week</ResultStateTitle>
        </ResultStateContent>
      </ResultState>,
    );
    expect(html).toMatch(/<section[^>]*aria-labelledby="returns-title"/);
  });
});
