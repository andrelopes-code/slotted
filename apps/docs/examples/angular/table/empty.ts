import { Component } from '@angular/core';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import {
  SlTable,
  SlTableBody,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
  SlTableHead,
  SlTableRow,
} from '@slotted/angular/table';

@Component({
  selector: 'app-table-empty',
  imports: [
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlTable,
    SlTableBody,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
    SlTableHead,
    SlTableRow,
  ],
  template: `
    <div slTable [columns]="4">
      <div slTableContent aria-label="Returns this week">
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Return</th>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader numeric>Refund</th>
          </tr>
        </thead>
        <tbody slTableBody>
          <tr>
            <td slTableEmpty>
              <section slResultState status="empty">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No returns this week</h3>
                  <p slResultStateDescription>
                    Returns appear here as soon as a customer opens one from their order page.
                  </p>
                </div>
              </section>
            </td>
          </tr>
        </tbody>
      </div>
    </div>
  `,
})
export class TableEmptyExample {}
