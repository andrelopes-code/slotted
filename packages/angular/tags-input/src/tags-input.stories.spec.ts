import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tags-input/contract.json';
import { ANGULAR_TAGS_INPUT_DOCS } from './tags-input.docs';
import * as tagsInputStories from './tags-input.stories';

describe('Angular TAGS-INPUT stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['tags-input'], tagsInputStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members['tags-input'], ANGULAR_TAGS_INPUT_DOCS['tags-input'].api),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_TAGS_INPUT_DOCS['tags-input'],
        framework: 'Angular',
        member: contract.members['tags-input'],
        scenarioIds: contract.scenarios['tags-input'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TAGS_INPUT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
