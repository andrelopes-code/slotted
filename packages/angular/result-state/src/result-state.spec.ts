import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/result-state/contract.json';
import { SlResultState } from './result-state';
import { provideResultStateDefaults } from './result-state-defaults';
import {
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateFooter,
  SlResultStateMedia,
  SlResultStateTitle,
} from './result-state-parts';

/**
 * The declared template names every directive, so the compiler does not report
 * them unused; each test replaces it with its own markup.
 */
@Component({
  standalone: true,
  imports: [
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateFooter,
    SlResultStateMedia,
    SlResultStateTitle,
  ],
  template: `<section slResultState>
    <svg slResultStateMedia></svg>
    <div slResultStateContent>
      <div slResultStateTitle></div>
      <p slResultStateDescription></p>
    </div>
    <div slResultStateActions></div>
    <div slResultStateFooter></div>
  </section>`,
})
class Host {}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.overrideComponent(Host, { set: { template } });
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const root = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-ui="result-state"]') as HTMLElement;

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('SlResultState', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<section slResultState>
      <div slResultStateContent>
        <div slResultStateTitle>No projects yet</div>
        <p slResultStateDescription>Create a project to get started.</p>
      </div>
      <div slResultStateActions><button type="button">Create project</button></div>
      <div slResultStateFooter><a href="#docs">What is a project?</a></div>
    </section>`);

    const region = root(fixture);
    expect(region.tagName).toBe('SECTION');
    expect(region.getAttribute('data-ui')).toBe('result-state');
    expect(region.getAttribute('data-part')).toBe('root');
    expect(parts(region)).toEqual(['media', 'content', 'actions', 'footer']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const region = root(
      renderTemplate(`<section slResultState><div slResultStateContent>Pronto.</div></section>`),
    );
    const { defaults } = contract.members.resultState;

    expect(region.getAttribute('data-status')).toBe(defaults.status);
    expect(region.getAttribute('data-reach')).toBe(defaults.reach);
    expect(region.getAttribute('data-align')).toBe(defaults.align);
    expect(region.getAttribute('data-live')).toBe(defaults.live);
    expect(region.getAttribute('data-illustration')).toBe(defaults.illustration);
  });

  /**
   * The decision the family exists to get right. The text announces; the
   * controls beside it do not, because MDN's `alert` role reference states the
   * role "should only be used for text content, not interactive elements such
   * as links or buttons".
   */
  it('writes the live role on the text and on nothing else', () => {
    const fixture = renderTemplate(`<section slResultState live="polite">
      <div slResultStateContent id="content"><div slResultStateTitle>Nada.</div></div>
      <div slResultStateActions id="actions"><button type="button">Limpar</button></div>
    </section>`);
    const region = root(fixture);

    expect(region.querySelector('#content')?.getAttribute('role')).toBe('status');
    expect(region.querySelector('#actions')?.getAttribute('role')).toBeNull();
    expect(region.getAttribute('role')).toBeNull();
  });

  it('takes the louder role only when the page asks for it, and none at all when it does not', () => {
    for (const [live, role] of Object.entries(contract.liveRoles)) {
      const fixture = renderTemplate(
        `<section slResultState live="${live}"><div slResultStateContent id="content">Falhou.</div></section>`,
      );
      expect(root(fixture).querySelector('#content')?.getAttribute('role')).toBe(role);
    }
  });

  /**
   * The APG's region landmark practice states that "a region landmark must have
   * a label". A `section` pointing `aria-labelledby` at nothing has no
   * accessible name and is not a landmark, so the attribute is written only
   * once a title has said it exists.
   */
  it('names the region by its own title, and leaves the attribute off when there is none', () => {
    const named = root(
      renderTemplate(`<section slResultState>
        <div slResultStateContent><div slResultStateTitle>Sem acesso</div></div>
      </section>`),
    );
    const title = named.querySelector('[data-part="title"]') as HTMLElement;
    expect(title.getAttribute('id')).toMatch(/^slotted-result-state-\d+-title$/);
    expect(named.getAttribute('aria-labelledby')).toBe(title.getAttribute('id'));

    const unnamed = root(
      renderTemplate(`<section slResultState>
        <div slResultStateContent><p slResultStateDescription>No title.</p></div>
      </section>`),
    );
    expect(unnamed.getAttribute('aria-labelledby')).toBeNull();
  });

  /**
   * A page that writes its own identifier on the title — a skip target, an
   * anchor a table of contents points at — keeps it, and the box points
   * `aria-labelledby` at the one that is actually in the DOM. It is the second
   * attribute this family reads with `HostAttributeToken` before its own host
   * binding writes over it.
   */
  it('keeps an identifier the page wrote on the title, and names the box by it', () => {
    const region = root(
      renderTemplate(`<section slResultState>
        <div slResultStateContent>
          <div slResultStateTitle id="no-projects">No projects yet</div>
        </div>
      </section>`),
    );

    expect(region.querySelector('[data-part="title"]')?.getAttribute('id')).toBe('no-projects');
    expect(region.getAttribute('aria-labelledby')).toBe('no-projects');
  });

  /**
   * The title and the description already say what the picture says. An
   * illustration that adds information is not decorative, and what it adds
   * belongs in the description — the conclusion Polaris reaches by hardcoding
   * `alt=""` on its own image.
   */
  it('draws the mark hidden from assistive technology, and lets the page replace it', () => {
    const region = root(
      renderTemplate(`<section slResultState>
        <img slResultStateMedia alt="" src="/empty.svg" />
        <div slResultStateContent>Vazio.</div>
      </section>`),
    );

    const media = region.querySelector('[data-part="media"]');
    expect(media?.getAttribute('aria-hidden')).toBe('true');
    expect(media?.querySelector('img')).not.toBeNull();
  });

  it('leaves the picture box empty when the page supplies no illustration', () => {
    const region = root(
      renderTemplate(`<section slResultState><div slResultStateContent>Vazio.</div></section>`),
    );

    const media = region.querySelector("[data-part='media']");
    expect(media).not.toBeNull();
    expect(media?.children.length).toBe(0);
    expect(media?.textContent?.trim()).toBe('');
  });

  /**
   * The keyboard has somewhere to go after a filter empties a table, and the
   * family never sends it there by itself: moving focus unprompted is a change
   * of context nobody asked for. `exportAs` is what a template calls.
   */
  it('is reachable through exportAs without being in the tab sequence', () => {
    const fixture = renderTemplate(
      `<section slResultState #region="slResultState"><div slResultStateContent>Vazio.</div></section>`,
    );
    const region = root(fixture);

    expect(region.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).not.toBe(region);

    const instance = fixture.debugElement.children[0]?.injector.get(SlResultState);
    instance?.focus();
    expect(document.activeElement).toBe(region);
  });

  it('keeps a tab index the consumer wrote', () => {
    const region = root(
      renderTemplate(
        `<section slResultState tabindex="0"><div slResultStateContent>Vazio.</div></section>`,
      ),
    );

    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('lets an application set its defaults once, and lets one region overrule them', () => {
    const fixture = renderTemplate(
      `<div>
        <section slResultState id="inherited"><div slResultStateContent id="quiet">Nada.</div></section>
        <section slResultState id="stated" reach="page" status="error">
          <div slResultStateContent>Falhou.</div>
        </section>
      </div>`,
      [
        provideResultStateDefaults({
          align: 'start',
          illustration: 'cards',
          live: 'off',
          reach: 'inline',
          status: 'no-results',
        }),
      ],
    );

    const inherited = fixture.nativeElement.querySelector('#inherited') as HTMLElement;
    expect(inherited.getAttribute('data-status')).toBe('no-results');
    expect(inherited.getAttribute('data-reach')).toBe('inline');
    expect(inherited.getAttribute('data-align')).toBe('start');
    expect(inherited.getAttribute('data-illustration')).toBe('cards');
    expect(inherited.querySelector('#quiet')?.getAttribute('role')).toBeNull();

    const stated = fixture.nativeElement.querySelector('#stated') as HTMLElement;
    expect(stated.getAttribute('data-status')).toBe('error');
    expect(stated.getAttribute('data-reach')).toBe('page');
    /* The axes it did not state still come from the token. */
    expect(stated.getAttribute('data-align')).toBe('start');
  });

  it('renders every axis value the contract declares', () => {
    for (const status of contract.axes.status) {
      const region = root(
        renderTemplate(
          `<section slResultState status="${status}"><div slResultStateContent>Texto.</div></section>`,
        ),
      );
      expect(region.getAttribute('data-status')).toBe(status);
    }
    for (const reach of contract.axes.reach) {
      const region = root(
        renderTemplate(
          `<section slResultState reach="${reach}"><div slResultStateContent>Texto.</div></section>`,
        ),
      );
      expect(region.getAttribute('data-reach')).toBe(reach);
    }
    for (const align of contract.axes.align) {
      const region = root(
        renderTemplate(
          `<section slResultState align="${align}"><div slResultStateContent>Texto.</div></section>`,
        ),
      );
      expect(region.getAttribute('data-align')).toBe(align);
    }
    for (const illustration of contract.axes.illustration) {
      const region = root(
        renderTemplate(
          `<section slResultState illustration="${illustration}"><div slResultStateContent>Texto.</div></section>`,
        ),
      );
      expect(region.getAttribute('data-illustration')).toBe(illustration);
    }
  });

  /**
   * The drawing is made around the page's glyph, projected into the box the
   * family draws for `media`, and stays hidden from assistive technology like
   * every picture in that box: the title says what the drawing shows.
   */
  it('draws the illustration around the glyph the page projects into the media box', () => {
    const region = root(
      renderTemplate(`<section slResultState illustration="stack">
        <svg slResultStateMedia id="glyph"></svg>
        <div slResultStateContent>Convide as primeiras pessoas.</div>
      </section>`),
    );

    const media = region.querySelector('[data-part="media"]');
    expect(region.getAttribute('data-illustration')).toBe('stack');
    expect(media?.getAttribute('aria-hidden')).toBe('true');
    expect(media?.querySelector('#glyph')).not.toBeNull();
  });

  /**
   * A heading puts the region in the document outline, which is right for a
   * full-page 404 and wrong for one card in a grid of twelve. The element is the
   * page's, and the family keeps the identifier it names the box by — which is
   * the whole of what React needs a `render` prop for.
   */
  it('lets the page choose the element of every part', () => {
    const region = root(
      renderTemplate(`<section slResultState>
        <div slResultStateContent>
          <h2 slResultStateTitle id="title">This page does not exist</h2>
        </div>
      </section>`),
    );

    const title = region.querySelector('[data-part="title"]') as HTMLElement;
    expect(title.tagName).toBe('H2');
    expect(title.getAttribute('id')).toBe('title');
    expect(region.getAttribute('aria-labelledby')).toBe('title');
  });

  it('passes native attributes through to the element that owns them', () => {
    const region = root(
      renderTemplate(
        `<section slResultState id="empty-projects" lang="pt-BR"><div slResultStateContent>Vazio.</div></section>`,
      ),
    );

    expect(region.getAttribute('id')).toBe('empty-projects');
    expect(region.getAttribute('lang')).toBe('pt-BR');
  });
});
