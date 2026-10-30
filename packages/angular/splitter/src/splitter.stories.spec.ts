import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/splitter/contract.json';
import { ANGULAR_SPLITTER_DOCS } from './splitter.docs';
import * as splitterStories from './splitter.stories';

describe('Angular Splitter stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.splitter, splitterStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.splitter,
        ANGULAR_SPLITTER_DOCS.splitter.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_SPLITTER_DOCS.splitter,
        framework: 'Angular',
        member: contract.members.splitter,
        scenarioIds: contract.scenarios.splitter,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_SPLITTER_DOCS.splitter.snippets,
      ...ANGULAR_SPLITTER_DOCS.splitter.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
