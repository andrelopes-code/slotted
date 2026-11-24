import { Component } from '@angular/core';
import { SlTree, SlTreeGroup, SlTreeMeta, SlTreeNode } from '@slotted/angular/tree';

@Component({
  selector: 'app-tree-basic',
  imports: [SlTree, SlTreeGroup, SlTreeMeta, SlTreeNode],
  template: `
    <div slTree aria-label="Product categories" [expandedKeys]="['beverages']" [value]="'coffee'">
      <li slTreeNode value="beverages" label="Beverages">
        <span slTreeMeta>148</span>
        <ul slTreeGroup>
          <li slTreeNode value="coffee" label="Coffee"><span slTreeMeta>62</span></li>
          <li slTreeNode value="tea" label="Tea"><span slTreeMeta>54</span></li>
          <li slTreeNode value="soft-drinks" label="Soft drinks"><span slTreeMeta>32</span></li>
        </ul>
      </li>
      <li slTreeNode value="pantry" label="Pantry">
        <span slTreeMeta>231</span>
        <ul slTreeGroup>
          <li slTreeNode value="oils" label="Oils and vinegars"><span slTreeMeta>87</span></li>
          <li slTreeNode value="spices" label="Spices"><span slTreeMeta>144</span></li>
        </ul>
      </li>
      <li slTreeNode value="household" label="Household"><span slTreeMeta>76</span></li>
    </div>
  `,
})
export class TreeBasic {}
