import { Avatar } from '@slotted/react/avatar';
import { Badge } from '@slotted/react/badge';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
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
  TableSummary,
} from '@slotted/react/table';
import { Timeline, TimelineItem } from '@slotted/react/timeline';

import {
  CHANNELS,
  NOW,
  ORDER_STATUSES,
  WAREHOUSES,
  customerById,
  instant,
  isLate,
  money,
  shipmentByOrder,
  shortDate,
  shortDateTime,
  type Fulfillment,
  type Order,
} from './data';

const STAGES: { value: Fulfillment | 'placed'; label: string }[] = [
  { value: 'placed', label: 'Placed' },
  { value: 'picking', label: 'Picked' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];
const REACHED: Record<Fulfillment, number> = {
  unfulfilled: 0,
  picking: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
};
const HOUR = 3_600_000;

const STATUS_TONE = {
  paid: 'success',
  pending: 'warning',
  'partially-refunded': 'secondary',
  refunded: 'secondary',
  voided: 'danger',
} as const;

const site = (order: Order) =>
  WAREHOUSES.find((warehouse) => warehouse.value === order.warehouse)!.label;

/** The aside's title: the order, its payment and, when it has one, its urgency. */
export function OrderDetailTitle({ order }: { order: Order }) {
  return (
    <span className="console-aside-title">
      <span>{order.id}</span>
      <Badge size="sm" variant="soft" tone={STATUS_TONE[order.status]}>
        {ORDER_STATUSES.find((entry) => entry.value === order.status)?.label}
      </Badge>
      {isLate(order) && (
        <Badge size="sm" variant="soft" tone="danger">
          Late
        </Badge>
      )}
    </span>
  );
}

/** The sentence under the steps: what the order waits on, and by when (RP-06). */
function nextStep(order: Order) {
  const by = shortDate.format(instant(order.shipBy));
  const from = site(order);
  if (order.status === 'voided') return 'Voided before it was picked. Nothing ships.';
  switch (order.fulfillment) {
    case 'unfulfilled':
      return isLate(order)
        ? `Waiting to be picked in ${from}. It was due to ship by ${by}.`
        : `Waiting to be picked in ${from}. Ships by ${by}.`;
    case 'picking':
      return `Being picked in ${from}. Packing follows; ships by ${by}.`;
    case 'packed':
      return `Packed in ${from}, waiting for the ${order.carrier} pickup.`;
    case 'shipped': {
      const shipment = shipmentByOrder.get(order.id);
      return shipment
        ? `With ${shipment.carrier} ${shipment.service}, due ${shortDate.format(instant(shipment.eta))}.`
        : `With ${order.carrier}.`;
    }
    case 'delivered':
      return 'Delivered. Returns stay open for 30 days.';
  }
}

/** The record beside the grid: where it stands, what it holds, then what happened to it. */
export function OrderDetail({ order }: { order: Order }) {
  const customer = customerById.get(order.customerId)!;
  const shipment = shipmentByOrder.get(order.id);
  const placed = Date.parse(`${order.placed}:00Z`);
  const reached = order.status === 'voided' ? -1 : REACHED[order.fulfillment];

  const history = [
    {
      title: 'Order placed',
      actor: `${CHANNELS.find((c) => c.value === order.channel)?.label}`,
      time: placed,
    },
    ...(order.status === 'pending'
      ? []
      : [{ title: 'Payment captured', actor: 'Stripe', time: placed + 4 * 60_000 }]),
    ...(reached >= 1
      ? [
          {
            title: `Picking started in ${site(order)}`,
            actor: order.owner,
            time: placed + 3 * HOUR,
          },
        ]
      : []),
    ...(reached >= 2
      ? [{ title: 'Packed and labelled', actor: order.owner, time: placed + 5 * HOUR }]
      : []),
    ...(shipment
      ? [
          {
            title: `Handed to ${shipment.carrier}`,
            actor: shipment.id,
            time: Date.parse(`${shipment.shipped}:00Z`),
          },
        ]
      : []),
    ...(order.fulfillment === 'delivered' && shipment
      ? [
          {
            title: 'Delivered',
            actor: shipment.carrier,
            time: Date.parse(`${shipment.eta}T15:20:00Z`),
          },
        ]
      : []),
    ...(order.status === 'refunded' || order.status === 'partially-refunded'
      ? [
          {
            title: order.status === 'refunded' ? 'Refunded in full' : 'Part refunded',
            actor: 'Ruth Adeyemi',
            time: placed + 9 * 24 * HOUR,
          },
        ]
      : []),
  ].filter((entry) => entry.time <= NOW);

  return (
    <div className="console-detail">
      <div className="console-detail-party">
        <Avatar name={customer.name} size="md" />
        <span className="console-workspace">
          <span className="console-workspace-name">{customer.name}</span>
          <span className="console-workspace-scope">
            {customer.contact} · {customer.city}
          </span>
        </span>
      </div>

      <section className="console-detail-block" aria-label="Progress">
        <ol className="console-steps">
          {STAGES.map((stage, index) => (
            <li
              key={stage.value}
              data-state={
                index < reached || (index === reached && reached === 4)
                  ? 'done'
                  : index === reached
                    ? 'current'
                    : 'todo'
              }
            >
              <span className="console-step-mark" aria-hidden="true" />
              <span className="console-step-label">{stage.label}</span>
            </li>
          ))}
        </ol>
        <p className="console-detail-sentence">{nextStep(order)}</p>
      </section>

      <Table columns={3} variant="ruled">
        <TableContent>
          <TableCaption>Items</TableCaption>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Item</TableColumnHeader>
              <TableColumnHeader numeric>Qty</TableColumnHeader>
              <TableColumnHeader numeric>Amount</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.sku} value={line.sku}>
                <TableRowHeader>
                  <span className="console-product">
                    <span>{line.name}</span>
                    <span className="console-muted">
                      {line.sku} · {money.format(line.price)}
                    </span>
                  </span>
                </TableRowHeader>
                <TableCell numeric>{line.quantity}</TableCell>
                <TableCell numeric>{money.format(line.quantity * line.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableSummary>
            <TableRow>
              <TableCell colSpan={2}>Subtotal</TableCell>
              <TableCell numeric>{money.format(order.subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>Shipping</TableCell>
              <TableCell numeric>
                {order.shipping === 0 ? 'Free' : money.format(order.shipping)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>Tax</TableCell>
              <TableCell numeric>{money.format(order.tax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>Total, {order.items} items</TableCell>
              <TableCell numeric>{money.format(order.total)}</TableCell>
            </TableRow>
          </TableSummary>
        </TableContent>
      </Table>

      <DescriptionList layout="row" columns={2}>
        <DescriptionListItem>
          <DescriptionListTerm>Placed</DescriptionListTerm>
          <DescriptionListDescription>
            {shortDateTime.format(instant(order.placed))}
          </DescriptionListDescription>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionListTerm>Ship by</DescriptionListTerm>
          <DescriptionListDescription>
            {shortDate.format(instant(order.shipBy))}
          </DescriptionListDescription>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionListTerm>Ships from</DescriptionListTerm>
          <DescriptionListDescription>{site(order)}</DescriptionListDescription>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionListTerm>Carrier</DescriptionListTerm>
          <DescriptionListDescription>
            {shipment ? `${shipment.carrier} ${shipment.service} · ${shipment.id}` : order.carrier}
          </DescriptionListDescription>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionListTerm>Terms</DescriptionListTerm>
          <DescriptionListDescription>{customer.terms}</DescriptionListDescription>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription>{order.owner}</DescriptionListDescription>
        </DescriptionListItem>
        {order.tags.length > 0 && (
          <DescriptionListItem>
            <DescriptionListTerm>Tags</DescriptionListTerm>
            <DescriptionListDescription>
              <span className="console-tags">
                {order.tags.map((tag) => (
                  <Badge
                    key={tag}
                    size="sm"
                    variant="soft"
                    tone={tag === 'Rush' ? 'danger' : 'secondary'}
                  >
                    {tag}
                  </Badge>
                ))}
              </span>
            </DescriptionListDescription>
          </DescriptionListItem>
        )}
      </DescriptionList>

      <section className="console-detail-block" aria-labelledby="order-history">
        <h3 id="order-history" className="console-block-title">
          History
        </h3>
        <Timeline
          label="Order history"
          order="newest-first"
          locale="en-US"
          timeZone="UTC"
          now={NOW}
          size="sm"
        >
          {history.map((entry) => (
            <TimelineItem
              key={entry.title}
              title={entry.title}
              actor={entry.actor}
              time={new Date(entry.time).toISOString()}
            />
          ))}
        </Timeline>
      </section>
    </div>
  );
}
