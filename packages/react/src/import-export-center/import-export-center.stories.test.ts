import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/import-export-center/contract.json';
import { REACT_IMPORT_EXPORT_CENTER_DOCS } from './import-export-center.docs';
import * as importExportCenterStories from './import-export-center.stories';

describe('ImportExportCenter stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.importExportCenter, importExportCenterStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.importExportCenter,
        REACT_IMPORT_EXPORT_CENTER_DOCS.importExportCenter.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_IMPORT_EXPORT_CENTER_DOCS.importExportCenter,
        framework: 'React',
        member: contract.members.importExportCenter,
        scenarioIds: contract.scenarios.importExportCenter,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_IMPORT_EXPORT_CENTER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
