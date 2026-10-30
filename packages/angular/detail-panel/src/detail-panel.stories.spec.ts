import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/detail-panel/contract.json';
import { ANGULAR_DETAIL_PANEL_DOCS } from './detail-panel.docs';
import * as detailPanelStories from './detail-panel.stories';

describe('SlDetailPanel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.detailPanel, detailPanelStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.detailPanel,
        ANGULAR_DETAIL_PANEL_DOCS.detailPanel.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DETAIL_PANEL_DOCS.detailPanel,
        framework: 'Angular',
        member: contract.members.detailPanel,
        scenarioIds: contract.scenarios.detailPanel,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DETAIL_PANEL_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
