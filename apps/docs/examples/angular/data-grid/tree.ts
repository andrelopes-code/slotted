import { Component } from '@angular/core';
import type { GridColumn, GridTree } from '@slotted/core/grid';
import { SlDataGrid } from '@slotted/angular/data-grid';

interface Location {
  id: string;
  parent: string | null;
  name: string;
  kind: string;
  units: number;
}

const LOCATIONS: Location[] = [
  { id: 'reno', parent: null, name: 'Reno, NV', kind: 'Warehouse', units: 4210 },
  { id: 'reno-a', parent: 'reno', name: 'Zone A — dry goods', kind: 'Zone', units: 2630 },
  { id: 'reno-a-01', parent: 'reno-a', name: 'Aisle 01', kind: 'Aisle', units: 1410 },
  { id: 'reno-a-02', parent: 'reno-a', name: 'Aisle 02', kind: 'Aisle', units: 1220 },
  { id: 'reno-b', parent: 'reno', name: 'Zone B — chilled', kind: 'Zone', units: 1580 },
  { id: 'columbus', parent: null, name: 'Columbus, OH', kind: 'Warehouse', units: 3075 },
  { id: 'columbus-a', parent: 'columbus', name: 'Zone A — dry goods', kind: 'Zone', units: 3075 },
  { id: 'savannah', parent: null, name: 'Savannah, GA', kind: 'Warehouse', units: 1890 },
  { id: 'savannah-a', parent: 'savannah', name: 'Zone A — bonded', kind: 'Zone', units: 1890 },
];

const COLUMNS: GridColumn<Location>[] = [
  { id: 'name', label: 'Location', accessor: 'name', rowHeader: true, flex: 1, minWidth: 220 },
  { id: 'kind', label: 'Type', accessor: 'kind', width: 130 },
  { id: 'units', label: 'Units on hand', accessor: 'units', kind: 'number', width: 150 },
];

const TREE: GridTree<Location> = { parentKey: (row) => row.parent };

@Component({
  selector: 'app-data-grid-tree',
  imports: [SlDataGrid],
  template: `
    <sl-data-grid
      aria-label="Stock by location"
      height="22rem"
      rowKey="id"
      [columns]="columns"
      [expanded]="expanded"
      [rows]="locations"
      [tree]="tree"
    />
  `,
})
export class DataGridTree {
  readonly locations = LOCATIONS;
  readonly columns = COLUMNS;
  readonly tree = TREE;
  readonly expanded = ['reno', 'reno-a'];
}
