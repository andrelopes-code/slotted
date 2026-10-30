import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/column-manager/contract.json';
import { REACT_COLUMN_MANAGER_DOCS } from './column-manager.docs';
import * as columnManagerStories from './column-manager.stories';

describe('ColumnManager stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.columnManager, columnManagerStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.columnManager,
        REACT_COLUMN_MANAGER_DOCS.columnManager.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_COLUMN_MANAGER_DOCS.columnManager,
        framework: 'React',
        member: contract.members.columnManager,
        scenarioIds: contract.scenarios.columnManager,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_COLUMN_MANAGER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
