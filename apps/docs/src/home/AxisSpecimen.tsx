import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';

import { Badge } from '@slotted/react/badge';
import { Button, IconButton } from '@slotted/react/button';
import { Glyph, Icon } from '@slotted/react/icon';
import { StatusIndicator } from '@slotted/react/status-indicator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';
import { TextField } from '@slotted/react/text-field';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

import { SHIPMENTS, instant, shortDate } from '../console/data';

const STATES = {
  label: { status: 'neutral', label: 'Label created' },
  'in-transit': { status: 'info', label: 'In transit' },
  'out-for-delivery': { status: 'info', label: 'Out for delivery' },
  delayed: { status: 'warning', label: 'Delayed' },
  delivered: { status: 'success', label: 'Delivered' },
} as const;

const moving = SHIPMENTS.filter((shipment) => shipment.state !== 'delivered');
const rows = moving.slice(0, 5);

/**
 * One shipments panel, drawn the same in every scope it is placed in: a
 * heading with its count, the tools, the table and its pager. Server-rendered
 * only; the scope's attributes are the one difference between the three.
 */
export default function AxisSpecimen() {
  return (
    <div className="axes-card">
      <div className="axes-card-head">
        <h3 className="axes-card-title">Shipments</h3>
        <Badge size="sm" variant="soft" tone="accent">
          {moving.length} in transit
        </Badge>
      </div>
      <div className="axes-tools">
        <div className="axes-search">
          <TextField
            size="sm"
            type="search"
            aria-label="Search shipments"
            placeholder="Search shipments"
            start={
              <Icon size="sm" tone="muted">
                <Glyph name="search" />
              </Icon>
            }
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          tone="secondary"
          start={<ListFilter aria-hidden="true" size={14} strokeWidth={1.75} />}
        >
          Filter
        </Button>
      </div>
      <Table columns={4} variant="framed">
        <TableContent>
          <VisuallyHidden
            render={(props) => <TableCaption {...props}>Shipments in transit</TableCaption>}
          />
          <TableHead>
            <TableRow>
              <TableColumnHeader>Tracking</TableColumnHeader>
              <TableColumnHeader>Carrier</TableColumnHeader>
              <TableColumnHeader>Status</TableColumnHeader>
              <TableColumnHeader numeric>ETA</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((shipment) => (
              <TableRow key={shipment.id} value={shipment.id}>
                <TableRowHeader>{shipment.id}</TableRowHeader>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>
                  <StatusIndicator status={STATES[shipment.state].status} size="sm">
                    {STATES[shipment.state].label}
                  </StatusIndicator>
                </TableCell>
                <TableCell numeric>{shortDate.format(instant(shipment.eta))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
      <div className="axes-card-foot">
        <span>
          1–{rows.length} of {moving.length} shipments
        </span>
        <span className="axes-pager">
          <IconButton
            aria-label="Previous page"
            size="sm"
            variant="ghost"
            tone="secondary"
            disabled
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
          <IconButton aria-label="Next page" size="sm" variant="ghost" tone="secondary">
            <ChevronRight aria-hidden="true" strokeWidth={1.75} />
          </IconButton>
        </span>
      </div>
    </div>
  );
}
