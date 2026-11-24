import { Component } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlTree,
  SlTreeDescription,
  SlTreeGroup,
  SlTreeIcon,
  SlTreeMeta,
  SlTreeNode,
} from '@slotted/angular/tree';

@Component({
  selector: 'app-tree-row-content',
  imports: [
    SlGlyph,
    SlIcon,
    SlTree,
    SlTreeDescription,
    SlTreeGroup,
    SlTreeIcon,
    SlTreeMeta,
    SlTreeNode,
  ],
  template: `
    <div slTree aria-label="Documents" [expandedKeys]="['contracts', 'forecasts']">
      <li slTreeNode value="contracts" label="Contracts">
        <span slTreeMeta>2</span>
        <ul slTreeGroup>
          <li slTreeNode value="contoso" label="Contoso Foods 2026.pdf">
            <span slTreeIcon
              ><span slIcon><svg slGlyph name="file-text"></svg></span
            ></span>
            <span slTreeDescription>Signed</span>
            <span slTreeMeta>1.2 MB</span>
          </li>
          <li
            slTreeNode
            value="fabrikam"
            label="Fabrikam Supply master services agreement, amended.pdf"
          >
            <span slTreeIcon
              ><span slIcon><svg slGlyph name="file-text"></svg></span
            ></span>
            <span slTreeDescription>Draft</span>
            <span slTreeMeta>840 kB</span>
          </li>
        </ul>
      </li>
      <li slTreeNode value="forecasts" label="Forecasts">
        <span slTreeMeta>1</span>
        <ul slTreeGroup>
          <li slTreeNode value="q4" label="Q4 demand.xlsx">
            <span slTreeIcon
              ><span slIcon><svg slGlyph name="file-spreadsheet"></svg></span
            ></span>
            <span slTreeDescription>Edited today</span>
            <span slTreeMeta>96 kB</span>
          </li>
        </ul>
      </li>
    </div>
  `,
})
export class TreeRowContent {}
