import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SideNavigation } from './side-navigation';
import {
  SideNavigationIcon,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
  SideNavigationSection,
  SideNavigationSectionLabel,
} from './side-navigation-parts';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The inline start of the element's own text, which its padding moves. */
function textLeft(selector: string, root: ParentNode): number {
  const range = document.createRange();
  range.selectNodeContents(root.querySelector(selector)!);

  return range.getBoundingClientRect().left;
}

function boxLeft(selector: string, root: ParentNode): number {
  return root.querySelector(selector)!.getBoundingClientRect().left;
}

/**
 * A section label took the glyph's offset even when its rows had no glyph, so
 * it stood 9 px inline-end of the row labels below it.
 */
describe('a section label', () => {
  it('lines up with the row labels of a section without icons', async () => {
    render(
      <SideNavigation aria-label="Contents" mode="expanded">
        <SideNavigationSection>
          <SideNavigationSectionLabel>Guides</SideNavigationSectionLabel>
          <SideNavigationList>
            <SideNavigationItem value="a">
              <SideNavigationLink href="#a">
                <SideNavigationLabel>Import a file</SideNavigationLabel>
              </SideNavigationLink>
            </SideNavigationItem>
          </SideNavigationList>
        </SideNavigationSection>
      </SideNavigation>,
    );
    await frame();
    const section = document.querySelector('[data-part="section"]')!;

    expect(textLeft('[data-part="section-label"]', section)).toBe(
      textLeft('[data-part="label"]', section),
    );
  });

  it('lines up with the glyphs of a section with icons', async () => {
    render(
      <SideNavigation aria-label="Contents" mode="expanded">
        <SideNavigationSection>
          <SideNavigationSectionLabel>Guides</SideNavigationSectionLabel>
          <SideNavigationList>
            <SideNavigationItem value="a">
              <SideNavigationLink href="#a">
                <SideNavigationIcon>
                  <svg data-testid="glyph" width="16" height="16" aria-hidden="true" />
                </SideNavigationIcon>
                <SideNavigationLabel>Import a file</SideNavigationLabel>
              </SideNavigationLink>
            </SideNavigationItem>
          </SideNavigationList>
        </SideNavigationSection>
      </SideNavigation>,
    );
    await frame();
    const section = document.querySelector('[data-part="section"]')!;

    expect(textLeft('[data-part="section-label"]', section)).toBe(boxLeft('svg', section));
  });
});
