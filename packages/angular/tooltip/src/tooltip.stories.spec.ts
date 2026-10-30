import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tooltip/contract.json';
import { ANGULAR_TOOLTIP_DOCS } from './tooltip.docs';
import * as tooltipStories from './tooltip.stories';

describe('Tooltip stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.tooltip, tooltipStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.tooltip,
        ANGULAR_TOOLTIP_DOCS.tooltip.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_TOOLTIP_DOCS.tooltip,
        framework: 'Angular',
        member: contract.members.tooltip,
        scenarioIds: contract.scenarios.tooltip,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TOOLTIP_DOCS).flatMap((docs) => [
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
    const pictured = [
      tooltipStories.Playground,
      tooltipStories.Variant,
      tooltipStories.Sizes,
      tooltipStories.Content,
    ];

    it('is open on a story of its own', () => {
      for (const story of pictured) {
        const rendered = story.render!({} as never, { viewMode: 'story' } as never) as {
          props?: { open?: boolean };
          template?: string;
        };
        expect(rendered.props?.open).toBe(true);
        expect(rendered.template).toContain('[open]="open"');
        expect(rendered.template).not.toContain('[open]="true"');
      }
    });

    it('is closed on the reference page until the reader asks', () => {
      for (const story of pictured) {
        const rendered = story.render!({} as never, { viewMode: 'docs' } as never) as {
          props?: { open?: boolean };
        };
        expect(rendered.props?.open).toBe(false);
      }
    });
  });
});
