import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';
import { SlTree, type TreeValue } from '@slotted/angular/tree';

interface Place {
  id: string;
  name: string;
  children?: Place[];
}

const PLACES: Place[] = ['CMH', 'RNO', 'SAV'].map((site) => ({
  id: site,
  name: `Warehouse ${site}`,
  children: ['A', 'B', 'C'].map((aisle) => ({
    id: `${site}-${aisle}`,
    name: `Aisle ${aisle}`,
    children: Array.from({ length: 8 }, (_, index) => ({
      id: `${site}-${aisle}-0${index + 1}`,
      name: `Bin ${site}-${aisle}-0${index + 1}`,
    })),
  })),
}));

@Component({
  selector: 'app-tree-reveal',
  imports: [SlButton, SlStack, SlTree],
  template: `
    <div slStack align="start" [gap]="3">
      <button slButton size="sm" variant="outline" (click)="find(tree)">Find bin SAV-B-06</button>
      <div
        slTree
        #tree="slTree"
        aria-label="Bins"
        [(value)]="value"
        [expandedKeys]="['CMH', 'CMH-A']"
        [nodes]="places"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
    </div>
  `,
})
export class TreeReveal {
  protected readonly places = PLACES;
  protected readonly key = (place: Place) => place.id;
  protected readonly name = (place: Place) => place.name;
  protected readonly children = (place: Place) => place.children;
  protected readonly value = signal<TreeValue>(null);

  protected find(tree: SlTree) {
    this.value.set('SAV-B-06');
    tree.scrollToKey('SAV-B-06', 'center');
  }
}
