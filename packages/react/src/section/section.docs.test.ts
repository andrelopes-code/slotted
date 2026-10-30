import { describe, expect, it } from 'vitest';

import { REACT_DETAIL_PANEL_DOCS } from '../detail-panel/detail-panel.docs';
import { REACT_SECTION_DOCS, REACT_SECTION_TOKENS } from './section.docs';

/**
 * A region inside a page that paints a ground of its own — a pane, a bordered
 * panel hosting a detail panel that scrolls itself — has to republish the
 * ground a sticky section header paints, or the header shows the page's.
 */
describe('the ground a sticky section header paints', () => {
  it('is named by the sticky row and by the token list', () => {
    const sticky = REACT_SECTION_DOCS.section.api.find((row) => row.name === 'sticky');
    expect(sticky?.description).toContain('--slotted-page-ground');
    const token = REACT_SECTION_TOKENS.find((entry) => entry.name === '--slotted-page-ground');
    expect(token?.purpose).toContain('ground of its own');
  });

  it('is republished by the pane in the detail panel’s scroll="self" example', () => {
    const pane = REACT_DETAIL_PANEL_DOCS.detailPanel.scenes.find((scene) =>
      scene.snippet?.source.includes('scroll="self"'),
    );
    expect(pane?.snippet?.source).toContain('--slotted-page-ground');
  });
});

/** The anatomy table names the part each row is written inside, as the stylesheet's child combinators need. */
describe('the anatomy of the section', () => {
  it('names the parent of every part but the root', () => {
    const parents = Object.fromEntries(
      REACT_SECTION_DOCS.section.anatomy.map((row) => [
        row.part,
        (row as { parent?: string }).parent,
      ]),
    );
    expect(parents).toEqual({
      root: undefined,
      header: 'root',
      title: 'header',
      eyebrow: 'title',
      heading: 'title',
      tags: 'title',
      description: 'title',
      actions: 'header',
      body: 'root',
    });
  });

  it('states that a description outside the title is not styled', () => {
    expect(REACT_SECTION_DOCS.section.accessibility.join(' ')).toContain(
      'A description outside SectionTitle is not styled',
    );
  });
});
