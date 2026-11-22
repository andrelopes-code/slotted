import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/floating-panel/contract.json';
import { REACT_FLOATING_PANEL_DOCS } from './floating-panel.docs';
import * as floatingPanelStories from './floating-panel.stories';

describe('FloatingPanel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.floatingPanel, floatingPanelStories)).toEqual(
      [],
    );
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.floatingPanel,
        REACT_FLOATING_PANEL_DOCS.floatingPanel.api,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_FLOATING_PANEL_DOCS.floatingPanel,
        framework: 'React',
        member: contract.members.floatingPanel,
        scenarioIds: contract.scenarios.floatingPanel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = [
      ...REACT_FLOATING_PANEL_DOCS.floatingPanel.snippets,
      ...REACT_FLOATING_PANEL_DOCS.floatingPanel.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
