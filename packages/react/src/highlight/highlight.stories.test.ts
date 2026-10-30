import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/highlight/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_HIGHLIGHT_DOCS } from './highlight.docs';
import * as highlightStories from './highlight.stories';

describe('Highlight stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.highlight, highlightStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members.highlight, REACT_HIGHLIGHT_DOCS.highlight.api),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_HIGHLIGHT_DOCS.highlight,
        framework: 'React',
        member: contract.members.highlight,
        scenarioIds: contract.scenarios.highlight,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_HIGHLIGHT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
