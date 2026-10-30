import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { render } from '@testing-library/react';
import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tag/contract.json';
import * as tagButtonStories from './tag-button.stories';
import * as overviewStories from './tag-family.stories';
import * as tagLinkStories from './tag-link.stories';
import * as tagToggleStories from './tag-toggle.stories';
import { REACT_TAG_DOCS } from './tag.docs';
import * as tagStories from './tag.stories';

const storyModules = {
  overview: overviewStories,
  tag: tagStories,
  tagButton: tagButtonStories,
  tagLink: tagLinkStories,
  tagToggle: tagToggleStories,
};

describe('Tag family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[member], REACT_TAG_DOCS[member].api)).toEqual([]);
    }
  });

  /**
   * The axes are what a consumer picks from, so the reference page has to
   * spell every value rather than say "one of the tones".
   */
  it('spells every appearance axis in the reference API', () => {
    const spelled = {
      tone: contract.axes.tone.join(' | '),
      variant: contract.axes.variant.join(' | '),
      size: contract.axes.size.join(' | '),
      shape: contract.axes.shape.join(' | '),
    };

    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      for (const [axis, type] of Object.entries(spelled)) {
        expect(REACT_TAG_DOCS[member].api.find((row) => row.name === axis)?.type).toBe(
          type.replaceAll(/([a-z-]+)/g, "'$1'"),
        );
      }
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
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));
    const sections = [...container.querySelectorAll('.slotted-component-lab__section')];

    expect(sections).toHaveLength(6);
    for (const section of sections) {
      expect(section.querySelector(':scope > .slotted-component-lab__intro > h2')).not.toBeNull();
      expect(section.querySelector(':scope > .slotted-component-lab__intro > p')).not.toBeNull();
      expect(section.querySelector(':scope > .slotted-component-lab__body')).not.toBeNull();
    }
    expect(
      container.querySelectorAll('.slotted-component-lab > .slotted-component-lab__intro'),
    ).toHaveLength(0);
  });

  it('names every member and the axes they share in the overview', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));
    const headings = [...container.querySelectorAll('.slotted-component-lab__intro h2')].map(
      (heading) => heading.textContent,
    );

    expect(headings).toEqual([
      'Appearance system',
      'Tag',
      'TagButton',
      'TagLink',
      'TagToggle',
      'Composition',
    ]);
  });

  it('shows every tone against every variant, once, in the overview matrix', () => {
    const overview = overviewStories.Matrix.render?.({} as never, {} as never);
    const { container } = render(createElement(Fragment, undefined, overview));
    const matrix = container.querySelector('[data-slotted-matrix="tag"]');

    expect(matrix?.querySelectorAll('[data-ui="tag"][data-part="root"]')).toHaveLength(
      contract.axes.tone.length * contract.axes.variant.length,
    );
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TAG_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
