import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tag/contract.json';
import * as tagButtonStories from './tag-button.stories';
import * as overviewStories from './tag-family.stories';
import * as tagLinkStories from './tag-link.stories';
import * as tagToggleStories from './tag-toggle.stories';
import { ANGULAR_TAG_DOCS } from './tag.docs';
import * as tagStories from './tag.stories';

const storyModules = {
  overview: overviewStories,
  tag: tagStories,
  tagButton: tagButtonStories,
  tagLink: tagLinkStories,
  tagToggle: tagToggleStories,
};

describe('Angular Tag family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_TAG_DOCS[member].api)).toEqual([]);
    }
  });

  /**
   * The page's inset and the gap between its two columns live on the section,
   * not on the intro — the intro is only the sidebar column. An overview that
   * put its headings and its demonstrations straight into the intro inherits
   * neither, and every chip sits against the panel's own edge. A reviewer found
   * that on the rendered page; this is what keeps it found.
   */
  it('gives the overview one section per heading, each with an intro and a body', () => {
    const template = String(
      (overviewStories.Matrix.render?.({} as never, {} as never) as { template: string }).template,
    );
    const sections = template.match(/class="slotted-component-lab__section"/g) ?? [];
    const intros = template.match(/class="slotted-component-lab__intro"/g) ?? [];
    const bodies = template.match(/class="slotted-component-lab__body"/g) ?? [];
    const headings = [...template.matchAll(/<h2>([^<]+)<\/h2>/g)].map(([, title]) => title);

    expect(sections).toHaveLength(6);
    expect(intros).toHaveLength(6);
    expect(bodies).toHaveLength(6);
    expect(headings).toEqual([
      'Appearance system',
      'Tag',
      'TagButton',
      'TagLink',
      'TagToggle',
      'Composition',
    ]);
    expect(template).not.toMatch(
      /slotted-component-lab"[^>]*>\s*<div class="slotted-component-lab__intro"/,
    );
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TAG_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
