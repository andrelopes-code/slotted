import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/highlight/contract.json';
import { ANGULAR_HIGHLIGHT_DOCS } from './highlight.docs';
import * as highlightStories from './highlight.stories';

describe('Angular Highlight stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.highlight, highlightStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_HIGHLIGHT_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_HIGHLIGHT_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which element the directive attaches to, what it is made of, and one
   * captioned demonstration per scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_HIGHLIGHT_DOCS.highlight,
        framework: 'Angular',
        member: contract.members.highlight,
        scenarioIds: contract.scenarios.highlight,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_HIGHLIGHT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
