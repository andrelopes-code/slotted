import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/detail-panel/contract.json';
import { REACT_DETAIL_PANEL_DOCS } from './detail-panel.docs';
import * as detailPanelStories from './detail-panel.stories';

describe('DetailPanel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.detailPanel, detailPanelStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.detailPanel,
        REACT_DETAIL_PANEL_DOCS.detailPanel.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DETAIL_PANEL_DOCS.detailPanel,
        framework: 'React',
        member: contract.members.detailPanel,
        scenarioIds: contract.scenarios.detailPanel,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_DETAIL_PANEL_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
