import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/sparkline/contract.json';
import { REACT_SPARKLINE_DOCS } from './sparkline.docs';
import * as sparklineStories from './sparkline.stories';

describe('Sparkline stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.sparkline, sparklineStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_SPARKLINE_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], REACT_SPARKLINE_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_SPARKLINE_DOCS.sparkline,
        framework: 'React',
        member: contract.members.sparkline,
        scenarioIds: contract.scenarios.sparkline,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_SPARKLINE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
