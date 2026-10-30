import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlSection,
  SlSectionActions,
  SlSectionBody,
  SlSectionDescription,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardComparison,
  SlStatCardFigure,
  SlStatCardHeader,
  SlStatCardLabel,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import { SlUpload } from '@slotted/angular/upload';
import type { UploadFile } from '@slotted/core/upload';

import { phoneSignal } from '../../core/layout/phone';
import { IMPORT_TARGETS, IMPORT_TARGETS_READ, ImportStore } from '../../core/crm/import.store';

/**
 * The customer CSV mapper (§34.8): the file, the map from its columns to the
 * fields of an account, the five rows the reader checks first, and what the
 * backend did with every row — which is where partial success lives.
 */
@Component({
  selector: 'app-import-page',
  imports: [
    RouterLink,
    SlBadge,
    SlButton,
    SlButtonLink,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlGrid,
    SlInline,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlSection,
    SlSectionActions,
    SlSectionBody,
    SlSectionDescription,
    SlSectionHeader,
    SlSectionHeading,
    SlSectionTitle,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlStatCard,
    SlStatCardComparison,
    SlStatCardFigure,
    SlStatCardHeader,
    SlStatCardLabel,
    SlStatCardValue,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
    SlUpload,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .work {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--slotted-space-6);
    }
    .sample {
      color: var(--slotted-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
      max-inline-size: 18rem;
    }
    .map-field {
      min-inline-size: 12rem;
    }
  `,
  template: `
    <div slPage width="content">
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Import customers</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>
              A CSV of accounts, mapped column by column. Every row is written on its own: the rows
              Nexora can read become prospects, and the rows it cannot are listed with the reason.
            </p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="work">
          @if (store.failure(); as failure) {
            <div slInlineMessage tone="danger">
              <span slInlineMessageIcon></span>
              {{ failure.message }}
            </div>
          }

          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle>
                <h2 slSectionHeading>File</h2>
                <p slSectionDescription>
                  A comma-separated file whose first line names the columns.
                </p>
              </div>
              @if (store.file(); as file) {
                <div slSectionActions>
                  <button
                    slButton
                    size="sm"
                    variant="ghost"
                    tone="secondary"
                    type="button"
                    (click)="store.clear()"
                  >
                    Choose another file
                  </button>
                </div>
              }
            </div>
            <div slSectionBody>
              @if (store.file(); as file) {
                <div slStack [gap]="2">
                  <span slInline [gap]="3">
                    <span slText weight="medium">{{ file.name }}</span>
                    <span slBadge variant="soft" tone="secondary" size="sm">
                      {{ file.rows.length }} rows
                    </span>
                    <span slBadge variant="soft" tone="secondary" size="sm">
                      {{ file.columns.length }} columns
                    </span>
                  </span>
                </div>
              } @else {
                <div slStack [gap]="4">
                  <div
                    slUpload
                    accept=".csv,text/csv"
                    label="Accounts file"
                    description="One CSV, with the column names on the first line."
                    [files]="files()"
                    (filesChange)="taken($event)"
                  ></div>
                  <span slInline [gap]="3">
                    <button
                      slButton
                      variant="outline"
                      tone="secondary"
                      type="button"
                      (click)="store.takeExample()"
                    >
                      Use the example file
                    </button>
                    <span slText size="sm" tone="muted">
                      Six accounts: three to import — one of them with a segment and terms Nexora
                      will change — one already in Nexora, one with no name and one with an address
                      that is not an address.
                    </span>
                  </span>
                </div>
              }
            </div>
          </section>

          @if (store.file(); as file) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Columns</h2>
                  <p slSectionDescription>
                    Each column of the file, and the field it is written to. A column left unmapped
                    is not carried.
                  </p>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="4">
                  @if (!store.mappedName()) {
                    <div slInlineMessage tone="warning">
                      <span slInlineMessageIcon></span>
                      Map a column to Company Name: it is the one field an account cannot be created
                      without.
                    </div>
                  }
                  @if (phone()) {
                    <div slStack [gap]="5">
                      @for (column of file.columns; track column; let i = $index) {
                        <div slField>
                          <label slFieldLabel>{{ column }}</label>
                          <sl-select
                            placeholder="Not carried"
                            [value]="store.mapping()[column] ?? null"
                            (valueChangeRequest)="store.map(column, $any($event.value))"
                          >
                            @for (target of targets; track target) {
                              <sl-select-item [value]="target">{{ target }}</sl-select-item>
                            }
                          </sl-select>
                          <span slFieldDescription>First value: {{ sample(i) }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div slTable variant="framed" [columns]="3">
                      <div slTableContent>
                        <caption slTableCaption>
                          Column mapping
                        </caption>
                        <thead slTableHead>
                          <tr slTableRow>
                            <th slTableColumnHeader>Column in the file</th>
                            <th slTableColumnHeader>First value</th>
                            <th slTableColumnHeader>Nexora field</th>
                          </tr>
                        </thead>
                        <tbody slTableBody>
                          @for (column of file.columns; track column; let i = $index) {
                            <tr slTableRow>
                              <th slTableRowHeader>{{ column }}</th>
                              <td slTableCell>
                                <span class="sample">{{ sample(i) }}</span>
                              </td>
                              <td slTableCell>
                                <div slField class="map-field">
                                  <label slFieldLabel class="sr-only" [attr.hidden]="true">
                                    {{ column }}
                                  </label>
                                  <sl-select
                                    [attr.aria-label]="'Nexora field for ' + column"
                                    placeholder="Not carried"
                                    [value]="store.mapping()[column] ?? null"
                                    (valueChangeRequest)="store.map(column, $any($event.value))"
                                  >
                                    @for (target of targets; track target) {
                                      <sl-select-item [value]="target">{{ target }}</sl-select-item>
                                    }
                                  </sl-select>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </div>
                    </div>
                  }
                  @if (carriedOnly().length > 0) {
                    <span slText size="sm" tone="muted">
                      Nexora reads {{ read }} on this import. {{ carriedSentence() }}
                    </span>
                  }
                </div>
              </div>
            </section>

            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>First rows</h2>
                  <p slSectionDescription>
                    The first five rows of the file, under the fields they are written to.
                  </p>
                </div>
                <div slSectionActions>
                  <button
                    slButton
                    type="button"
                    [disabled]="!store.ready()"
                    [loading]="store.running()"
                    [messages]="{ loading: 'Importing the file' }"
                    (click)="run()"
                  >
                    {{ runLabel() }}
                  </button>
                </div>
              </div>
              <div slSectionBody>
                <div slTable variant="framed" [columns]="previewColumns().length || 1">
                  <div slTableContent>
                    <caption slTableCaption>
                      Preview
                    </caption>
                    <thead slTableHead>
                      <tr slTableRow>
                        @for (column of previewColumns(); track column.index) {
                          <th slTableColumnHeader>{{ column.target }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody slTableBody>
                      @for (row of store.preview(); track $index) {
                        <tr slTableRow>
                          @for (column of previewColumns(); track column.index) {
                            <td slTableCell>{{ row[column.index] || '—' }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </div>
                </div>
              </div>
            </section>
          }

          @if (store.job(); as job) {
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle>
                  <h2 slSectionHeading>Result</h2>
                  <p slSectionDescription>{{ outcome(job.status) }}</p>
                </div>
                <div slSectionActions>
                  <a slButtonLink variant="outline" tone="secondary" routerLink="/crm/customers">
                    Open Customers
                  </a>
                </div>
              </div>
              <div slSectionBody>
                <div slStack [gap]="5">
                  @if (job.result; as result) {
                    <div slGrid [columns]="4" [gap]="4" minItemWidth="xs">
                      <div slStatCard size="sm">
                        <div slStatCardHeader><span slStatCardLabel>Imported</span></div>
                        <div slStatCardFigure>
                          <span slStatCardValue>{{ result.importedRows }}</span>
                          <p slStatCardComparison>of {{ result.totalRows }} rows</p>
                        </div>
                      </div>
                      <div
                        slStatCard
                        size="sm"
                        [tone]="result.warningRows > 0 ? 'warning' : 'neutral'"
                      >
                        <div slStatCardHeader><span slStatCardLabel>With warnings</span></div>
                        <div slStatCardFigure>
                          <span slStatCardValue>{{ result.warningRows }}</span>
                          <p slStatCardComparison>imported, with a value changed</p>
                        </div>
                      </div>
                      <div
                        slStatCard
                        size="sm"
                        [tone]="result.errorRows > 0 ? 'danger' : 'neutral'"
                      >
                        <div slStatCardHeader><span slStatCardLabel>Refused</span></div>
                        <div slStatCardFigure>
                          <span slStatCardValue>{{ result.errorRows }}</span>
                          <p slStatCardComparison>not written; listed below</p>
                        </div>
                      </div>
                      <div slStatCard size="sm">
                        <div slStatCardHeader><span slStatCardLabel>Read</span></div>
                        <div slStatCardFigure>
                          <span slStatCardValue>{{ result.totalRows }}</span>
                          <p slStatCardComparison>rows in {{ job.fileName }}</p>
                        </div>
                      </div>
                    </div>
                  }
                  @if (job.issues.length > 0) {
                    @if (phone()) {
                      <div slStack [gap]="4">
                        @for (issue of job.issues; track $index) {
                          <div slStack [gap]="1">
                            <span slInline [gap]="2">
                              <span slText size="sm" weight="medium">Row {{ issue.row }}</span>
                              <span
                                slBadge
                                variant="soft"
                                size="sm"
                                [tone]="issue.severity === 'error' ? 'danger' : 'warning'"
                              >
                                {{ issue.severity === 'error' ? 'Not imported' : 'Imported' }}
                              </span>
                            </span>
                            <span slText size="sm">{{ issue.message }}</span>
                          </div>
                        }
                      </div>
                    } @else {
                      <div slTable variant="framed" [columns]="4">
                        <div slTableContent>
                          <caption slTableCaption>
                            Rows Nexora could not take as they were
                          </caption>
                          <thead slTableHead>
                            <tr slTableRow>
                              <th slTableColumnHeader>Row</th>
                              <th slTableColumnHeader>Field</th>
                              <th slTableColumnHeader>What happened</th>
                              <th slTableColumnHeader>Outcome</th>
                            </tr>
                          </thead>
                          <tbody slTableBody>
                            @for (issue of job.issues; track $index) {
                              <tr slTableRow>
                                <th slTableRowHeader>{{ issue.row }}</th>
                                <td slTableCell>{{ issue.field ?? '—' }}</td>
                                <td slTableCell>{{ issue.message }}</td>
                                <td slTableCell>
                                  <span
                                    slBadge
                                    variant="soft"
                                    size="sm"
                                    [tone]="issue.severity === 'error' ? 'danger' : 'warning'"
                                  >
                                    {{ issue.severity === 'error' ? 'Not imported' : 'Imported' }}
                                  </span>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </div>
                      </div>
                    }
                    <span slText size="sm" tone="muted">
                      Correct the refused rows in the file and import it again: an account already
                      in Nexora is refused a second time, so nothing is created twice.
                    </span>
                  }
                </div>
              </div>
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class ImportPage implements OnInit {
  readonly store = inject(ImportStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly targets = IMPORT_TARGETS;
  readonly read = IMPORT_TARGETS_READ.join(', ');
  readonly files = signal<readonly UploadFile[]>([]);
  /** A phone reads a mapping row as a field, not as three columns. */
  readonly phone = phoneSignal();

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  /** The columns that are carried, in the order the file has them. */
  readonly mapped = computed(() => {
    const file = this.store.file();
    const mapping = this.store.mapping();
    if (file === null) return [];
    return file.columns
      .map((column, index) => ({ column, index, target: mapping[column] }))
      .filter((entry): entry is { column: string; index: number; target: string } =>
        Boolean(entry.target),
      );
  });

  /** Fields the mapper carries and this import does not read (§71.3 against the command). */
  readonly carriedOnly = computed(() =>
    this.mapped()
      .map((entry) => entry.target)
      .filter((target) => !IMPORT_TARGETS_READ.includes(target as never)),
  );

  /** A phone reads the two fields that say which account a row is. */
  readonly previewColumns = computed(() =>
    this.phone() ? this.mapped().slice(0, 2) : this.mapped(),
  );

  readonly runLabel = computed(() => {
    const rows = this.store.file()?.rows.length ?? 0;
    return rows === 1 ? 'Import 1 row' : `Import ${rows} rows`;
  });

  ngOnInit(): void {
    const id = this.params().get('id');
    if (id) void this.store.open(id);
  }

  sample(index: number): string {
    return this.store.file()?.rows[0]?.[index] ?? '—';
  }

  carriedSentence(): string {
    const fields = this.carriedOnly();
    return fields.length === 1
      ? `${fields[0]} is carried on the job and written to no field yet.`
      : `${fields.join(', ')} are carried on the job and written to no field yet.`;
  }

  outcome(status: string): string {
    switch (status) {
      case 'completed':
        return 'Every row was written.';
      case 'completed_with_errors':
        return 'Some rows were written and the rest were refused, each with its reason.';
      case 'failed':
        return 'Nothing was written: the file could not be read as accounts.';
      default:
        return 'The import is running.';
    }
  }

  async taken(files: readonly UploadFile[]): Promise<void> {
    this.files.set(files);
    const file = files.at(-1)?.file;
    if (file) await this.store.take(file);
  }

  async run(): Promise<void> {
    const job = await this.store.run();
    if (job) void this.router.navigateByUrl(`/crm/imports/${job.id}`);
  }
}
