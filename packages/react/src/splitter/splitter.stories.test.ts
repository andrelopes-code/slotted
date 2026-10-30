import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/splitter/contract.json';
import { REACT_SPLITTER_DOCS } from './splitter.docs';
import * as splitterStories from './splitter.stories';

describe('Splitter stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.splitter, splitterStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.splitter,
        REACT_SPLITTER_DOCS.splitter.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_SPLITTER_DOCS.splitter,
        framework: 'React',
        member: contract.members.splitter,
        scenarioIds: contract.scenarios.splitter,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...REACT_SPLITTER_DOCS.splitter.snippets,
      ...REACT_SPLITTER_DOCS.splitter.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
