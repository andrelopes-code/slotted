import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import * as buttonLinkStories from './button-link.stories';
import { ANGULAR_BUTTON_DOCS } from './button.docs';
import * as overviewStories from './button-family.stories';
import * as buttonStories from './button.stories';
import * as iconButtonLinkStories from './icon-button-link.stories';
import * as iconButtonStories from './icon-button.stories';
import * as toggleButtonStories from './toggle-button.stories';

const storyModules = {
  overview: overviewStories,
  button: buttonStories,
  buttonLink: buttonLinkStories,
  iconButton: iconButtonStories,
  iconButtonLink: iconButtonLinkStories,
  toggleButton: toggleButtonStories,
};

/** The template a story renders, so the markup can be read without a browser. */
function template(story: { render?: (...args: never[]) => { template?: string } }) {
  return story.render?.(...([] as never[]))?.template ?? '';
}

describe('Angular Button family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_BUTTON_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('spells every appearance axis in the reference API', () => {
    const spelled = {
      tone: contract.axes.tone.join(' | '),
      variant: contract.axes.variant.join(' | '),
      size: contract.axes.size.join(' | '),
    };

    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      for (const [axis, type] of Object.entries(spelled)) {
        expect(ANGULAR_BUTTON_DOCS[member].api.find((row) => row.name === axis)?.type).toBe(type);
      }
    }
    expect(ANGULAR_BUTTON_DOCS.iconButton.api.find((row) => row.name === 'shape')?.type).toBe(
      contract.axes.shape.join(' | '),
    );
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_BUTTON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  it('gives the overview one section per member, plus the axes and a composition', () => {
    const headings = [...template(overviewStories.Matrix).matchAll(/<h2>([^<]+)<\/h2>/g)].map(
      ([, heading]) => heading,
    );

    expect(headings).toEqual([
      'Appearance system',
      'Button',
      'ButtonLink',
      'IconButton',
      'ToggleButton',
      'Composition',
    ]);
  });

  it('shows every tone against every variant in the overview matrix', () => {
    const markup = template(overviewStories.Matrix);

    for (const tone of contract.axes.tone) {
      expect(markup).toContain(`tone="${tone}"`);
    }
    for (const variant of contract.axes.variant) {
      expect(markup).toContain(`variant="${variant}"`);
    }
  });

  it('demonstrates each member with something Button alone does not show', () => {
    const markup = template(overviewStories.Matrix);

    expect(markup).toContain('slButtonLink');
    expect(markup).toContain('disabled>Open settings');
    expect(markup).toContain('slIconButton');
    expect(markup).toContain('shape="circle"');
    expect(markup).toContain('slToggleButton');
    expect(markup).toContain('loading');
    expect(markup).toContain('defaultPressed');
  });

  /** Every icon-only control needs a name, and no template can make one mandatory. */
  it('names every icon-only control in every story', () => {
    for (const module of Object.values(storyModules)) {
      for (const [name, story] of Object.entries(module)) {
        if (name === 'default' || typeof story !== 'object' || story === null) continue;
        const markup = template(story as { render?: () => { template?: string } });
        for (const [, tag] of markup.matchAll(/<button([^>]*slIconButton[^>]*)>/g)) {
          expect(tag).toMatch(/aria-label|aria-labelledby|attr\.aria-label/);
        }
      }
    }
  });

  it('shows the densities scene at all three steps of the control scale', () => {
    const markup = template(overviewStories.Densities);

    for (const size of contract.axes.size) {
      expect(markup).toContain(`size="${size}"`);
    }
  });
});
