import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { cleanup, render, waitFor } from '@testing-library/react';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { afterEach, describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tooltip/contract.json';
import { REACT_TOOLTIP_DOCS } from './tooltip.docs';
import * as tooltipStories from './tooltip.stories';

describe('Tooltip stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.tooltip, tooltipStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.tooltip,
        REACT_TOOLTIP_DOCS.tooltip.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares a state model — the
   * output that carries the reason.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TOOLTIP_DOCS.tooltip,
        framework: 'React',
        member: contract.members.tooltip,
        scenarioIds: contract.scenarios.tooltip,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TOOLTIP_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  /**
   * A story opens its tooltip for the picture, on its own page. Inside the
   * reference page the same story is one demonstration among many, and a
   * tooltip nobody hovered is a layer nobody asked for (TT1).
   */
  describe('a layer opened for the picture', () => {
    afterEach(cleanup);
    const pictured = [
      tooltipStories.Playground,
      tooltipStories.Variant,
      tooltipStories.Sizes,
      tooltipStories.Content,
    ];

    it('is open on a story of its own', async () => {
      for (const story of pictured) {
        const { container } = render(story.render!({}, { viewMode: 'story' } as never) as never);
        await waitFor(() =>
          expect(
            container.querySelectorAll("[data-ui='tooltip'][data-open]").length,
          ).toBeGreaterThan(0),
        );
        cleanup();
      }
    });

    it('mounts no layer on the reference page until the reader asks', async () => {
      for (const story of pictured) {
        const { container } = render(story.render!({}, { viewMode: 'docs' } as never) as never);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(container.querySelectorAll("[data-ui='tooltip']").length).toBe(0);
        cleanup();
      }
    });
  });
});
