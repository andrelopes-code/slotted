import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/data-grid/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_DATA_GRID_DOCS } from './data-grid.docs';
import * as dataGridStories from './data-grid.stories';

describe('Data grid stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['data-grid'], dataGridStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members['data-grid'],
        REACT_DATA_GRID_DOCS['data-grid'].api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DATA_GRID_DOCS['data-grid'],
        framework: 'React',
        member: contract.members['data-grid'],
        scenarioIds: contract.scenarios['data-grid'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_DATA_GRID_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
