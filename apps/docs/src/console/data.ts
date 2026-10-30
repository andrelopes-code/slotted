/**
 * The console's sample data. Every name, figure and date is synthetic, drawn
 * from a fixed seed so the build and the browser draw the same rows. The
 * console's clock stands at NOW; every record is placed before it.
 */

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(20261001);
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
const between = (min: number, max: number) => min + random() * (max - min);
const whole = (min: number, max: number) => Math.floor(between(min, max + 1));
const cents = (value: number) => Math.round(value * 100) / 100;

/** Wednesday 30 September 2026, 16:00 UTC. */
export const NOW = Date.UTC(2026, 8, 30, 16, 0);
export const TODAY = '2026-09-30';
const DAY = 86_400_000;
const HOUR = 3_600_000;

/** `YYYY-MM-DD` of an instant. */
export const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);
/** `YYYY-MM-DDTHH:MM` of an instant, the grid's `datetime` text. */
export const isoMinute = (time: number) => new Date(time).toISOString().slice(0, 16);
export const daysBefore = (days: number) => isoDay(NOW - days * DAY);

/* ── People and places ───────────────────────────────────────────────── */

export const OWNERS = [
  'Avery Collins',
  'Kenji Watanabe',
  'Lucía Fernández',
  'Ruth Adeyemi',
  'Tomasz Nowak',
  'Omar Haddad',
] as const;

export const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
] as const;
export type Warehouse = (typeof WAREHOUSES)[number]['value'];

export type Segment = 'enterprise' | 'wholesale' | 'retail';
export const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'retail', label: 'Retail' },
];

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  segment: Segment;
  owner: string;
  since: string;
  terms: 'Prepaid' | 'Net 30' | 'Net 45';
}

const COMPANIES: [string, string, string, string][] = [
  ['Brightline Studio', 'Maya Ortiz', 'brightline.co', 'Portland, OR'],
  ['Harbor & Pine', 'Ethan Brooks', 'harborpine.com', 'Seattle, WA'],
  ['Northgate Labs', 'Priya Raman', 'northgatelabs.io', 'Austin, TX'],
  ['Quill & Co.', 'Hannah Weiss', 'quill.co', 'Brooklyn, NY'],
  ['Solstice Outdoor', 'Diego Morales', 'solsticeoutdoor.com', 'Boulder, CO'],
  ['Verde Kitchen', 'Grace Kim', 'verdekitchen.com', 'Oakland, CA'],
  ['Atlas Freight', 'Marcus Bell', 'atlasfreight.com', 'Memphis, TN'],
  ['Juniper Health', 'Nora Lindqvist', 'juniperhealth.org', 'Minneapolis, MN'],
  ['Kestrel Robotics', 'Sam Okafor', 'kestrel.ai', 'Pittsburgh, PA'],
  ['Larkspur Books', 'Elise Martin', 'larkspurbooks.com', 'Asheville, NC'],
  ['Meridian Hotels', 'Victor Chen', 'meridianhotels.com', 'Chicago, IL'],
  ['Oakline Furniture', 'Julia Novak', 'oakline.com', 'Grand Rapids, MI'],
  ['Pelican Coffee', 'Andre Silva', 'pelican.coffee', 'Tampa, FL'],
  ['Redwood Clinics', 'Fatima Rahman', 'redwoodclinics.com', 'Sacramento, CA'],
  ['Saltmarsh Dairy', 'Owen Gallagher', 'saltmarsh.farm', 'Burlington, VT'],
  ['Tidewater Supply', 'Leah Thompson', 'tidewatersupply.com', 'Norfolk, VA'],
  ['Umber Ceramics', 'Rafael Costa', 'umberceramics.com', 'Santa Fe, NM'],
  ['Vantage Optics', 'Ingrid Holm', 'vantageoptics.com', 'Rochester, NY'],
  ['Wren & Finch', 'Chloe Dubois', 'wrenandfinch.com', 'Charleston, SC'],
  ['Yardley Tools', 'Ben Hartley', 'yardleytools.com', 'Cleveland, OH'],
  ['Aster Bakery', 'Lina Haddad', 'asterbakery.com', 'Providence, RI'],
  ['Bluefin Market', 'Kai Nakamura', 'bluefinmarket.com', 'Honolulu, HI'],
  ['Cobalt Fitness', 'Jordan Reyes', 'cobaltfit.com', 'Phoenix, AZ'],
  ['Driftwood Inn', 'Sofia Rossi', 'driftwoodinn.com', 'Monterey, CA'],
  ['Ember Goods', 'Noah Fischer', 'embergoods.com', 'Denver, CO'],
  ['Fernhill School', 'Amara Nwosu', 'fernhill.edu', 'Madison, WI'],
  ['Granite Outfitters', 'Lucas Meyer', 'graniteoutfitters.com', 'Salt Lake City, UT'],
  ['Hollow Oak Cafe', 'Isla Murray', 'hollowoak.cafe', 'Savannah, GA'],
  ['Ironbark Studio', 'Mateo Garcia', 'ironbark.studio', 'Los Angeles, CA'],
  ['Kinfolk Market', 'Zara Ahmed', 'kinfolkmarket.com', 'Nashville, TN'],
  ['Lumen Design', 'Felix Wagner', 'lumendesign.co', 'San Francisco, CA'],
  ['Mosswood Florals', 'Ava Patel', 'mosswood.flowers', 'Berkeley, CA'],
  ['Nimbus Air', 'Henry Clarke', 'nimbusair.com', 'Dallas, TX'],
  ['Orchard Row', 'Emma Larsen', 'orchardrow.com', 'Ann Arbor, MI'],
  ['Prairie Supply Co.', 'Caleb Turner', 'prairiesupply.com', 'Omaha, NE'],
  ['Riverbend Hospital', 'Dr. Mei Lin', 'riverbend.org', 'Louisville, KY'],
  ['Summit Coworking', 'Olivia Grant', 'summitcowork.com', 'Raleigh, NC'],
  ['Thistle & Thread', 'Ruby Walsh', 'thistlethread.com', 'Boston, MA'],
  ['Upland Roasters', 'Tariq Aziz', 'uplandroasters.com', 'Spokane, WA'],
  ['Wildflower Spa', 'Camila Duarte', 'wildflowerspa.com', 'Miami, FL'],
];

export const CUSTOMERS: Customer[] = COMPANIES.map(([name, contact, domain, city], index) => {
  const segment = pick<Segment>(['enterprise', 'wholesale', 'wholesale', 'retail', 'retail']);
  return {
    id: `C-${(1201 + index * 13).toString()}`,
    name,
    contact,
    email: `${
      contact
        .toLowerCase()
        .replace(/^dr\. /, '')
        .split(' ')[0]
    }@${domain}`,
    city,
    segment,
    owner: pick(OWNERS),
    since: daysBefore(whole(120, 1600)),
    terms: segment === 'retail' ? 'Prepaid' : segment === 'enterprise' ? 'Net 45' : 'Net 30',
  };
});

export const customerById = new Map(CUSTOMERS.map((customer) => [customer.id, customer]));

/* ── Catalog ─────────────────────────────────────────────────────────── */

export const CATEGORIES = ['Apparel', 'Bags', 'Home', 'Kitchen', 'Stationery', 'Outdoor'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Product {
  sku: string;
  name: string;
  category: Category;
  price: number;
  cost: number;
  onHand: number;
  reserved: number;
  incoming: number;
  reorderAt: number;
  /** Units sold per day over the last 30 days. */
  velocity: number;
  warehouse: Warehouse;
  supplier: string;
}

const SUPPLIERS = [
  'Kiln & Co.',
  'Ridgeway Textiles',
  'Basalt Metalworks',
  'Paperhaus',
  'Alder Mills',
];

const CATALOG: [string, Category, number][] = [
  ['Canvas tote', 'Bags', 38],
  ['Merino beanie', 'Apparel', 42],
  ['Stoneware mug', 'Kitchen', 24],
  ['Cast-iron skillet', 'Kitchen', 89],
  ['Linen apron', 'Apparel', 46],
  ['Walnut cutting board', 'Kitchen', 64],
  ['Trail daypack', 'Bags', 128],
  ['Wool throw', 'Home', 148],
  ['Brass desk lamp', 'Home', 189],
  ['Ceramic planter', 'Home', 36],
  ['Field notebook', 'Stationery', 14],
  ['Fountain pen', 'Stationery', 72],
  ['Pour-over kettle', 'Kitchen', 78],
  ['Rain shell', 'Outdoor', 168],
  ['Leather wallet', 'Bags', 68],
  ['Oak side table', 'Home', 240],
  ['Enamel bowl set', 'Kitchen', 52],
  ['Weekender bag', 'Bags', 210],
  ['Cotton crewneck', 'Apparel', 58],
  ['Desk organizer', 'Stationery', 44],
  ['Camp mug', 'Outdoor', 22],
  ['Insulated bottle', 'Outdoor', 34],
  ['Hemp shopping bag', 'Bags', 18],
  ['Chambray shirt', 'Apparel', 74],
  ['Copper saucepan', 'Kitchen', 136],
  ['Glass carafe', 'Kitchen', 32],
  ['Linen napkins, set of 4', 'Kitchen', 38],
  ['Waffle towel', 'Home', 28],
  ['Beeswax candle', 'Home', 26],
  ['Rattan basket', 'Home', 54],
  ['Pocket knife', 'Outdoor', 62],
  ['Headlamp', 'Outdoor', 48],
  ['Hiking socks', 'Apparel', 19],
  ['Down vest', 'Apparel', 154],
  ['Sketchbook', 'Stationery', 21],
  ['Letterpress cards', 'Stationery', 16],
  ['Brass stapler', 'Stationery', 58],
  ['Wool blanket', 'Home', 176],
  ['Cork yoga mat', 'Outdoor', 84],
  ['Ceramic teapot', 'Kitchen', 66],
  ['Bamboo utensil set', 'Kitchen', 24],
  ['Market crossbody', 'Bags', 96],
  ['Canvas backpack', 'Bags', 118],
  ['Felt slippers', 'Apparel', 48],
  ['Picnic blanket', 'Outdoor', 72],
  ['Oil lantern', 'Outdoor', 58],
  ['Wall clock', 'Home', 88],
  ['Ink refills, 6 pack', 'Stationery', 12],
];

export const PRODUCTS: Product[] = CATALOG.map(([name, category, price], index) => {
  const velocity = Math.round(between(0.6, 9) * 10) / 10;
  const reorderAt = Math.ceil(velocity * whole(10, 16));
  /* About one product in six stands under its reorder point. */
  const short = random() < 0.17;
  const onHand = short ? whole(0, Math.max(1, reorderAt - 4)) : whole(reorderAt + 8, reorderAt * 5);
  return {
    sku: `SKU-${(1040 + index * 7).toString()}`,
    name,
    category,
    price: price - 0.01,
    cost: cents(price * between(0.32, 0.48)),
    onHand,
    reserved: Math.min(onHand, whole(0, Math.ceil(velocity * 3))),
    incoming: short || random() < 0.2 ? Math.ceil(reorderAt * between(1.5, 3)) : 0,
    reorderAt,
    velocity,
    warehouse: pick(WAREHOUSES).value,
    supplier: pick(SUPPLIERS),
  };
});

export const productBySku = new Map(PRODUCTS.map((product) => [product.sku, product]));

/** Days the stock on hand, less what is reserved, lasts at the current rate. */
export const daysOfCover = (product: Product) =>
  Math.floor((product.onHand - product.reserved) / product.velocity);

/* ── Orders ──────────────────────────────────────────────────────────── */

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'partially-refunded' | 'voided';
export type Fulfillment = 'unfulfilled' | 'picking' | 'packed' | 'shipped' | 'delivered';
export type Channel = 'web' | 'app' | 'marketplace' | 'wholesale';
export type Carrier = 'UPS' | 'FedEx' | 'DHL' | 'USPS';

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially-refunded', label: 'Part refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'voided', label: 'Voided' },
];

export const FULFILLMENTS: { value: Fulfillment; label: string }[] = [
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'picking', label: 'Picking' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'web', label: 'Web store' },
  { value: 'app', label: 'Mobile app' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
];

export const CARRIERS: Carrier[] = ['UPS', 'FedEx', 'DHL', 'USPS'];

export const TAGS = ['Rush', 'Gift', 'Fragile', 'First order', 'VIP'] as const;

export interface OrderLine {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  placed: string;
  customerId: string;
  customer: string;
  city: string;
  owner: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  channel: Channel;
  warehouse: Warehouse;
  carrier: Carrier;
  lines: OrderLine[];
  items: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  /** A promised ship date: the placed day plus the service's handling time. */
  shipBy: string;
  tags: string[];
}

const ORDER_COUNT = 1_480;
/** Orders spread over 90 days, newer days busier, weekends lighter. */
const PLACED: number[] = (() => {
  const times: number[] = [];
  const weights = Array.from({ length: 90 }, (_, back) => {
    const day = new Date(NOW - back * DAY).getUTCDay();
    return (day === 0 || day === 6 ? 0.62 : 1) * (1 + (90 - back) * 0.006);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  weights.forEach((weight, back) => {
    const count = Math.round((weight / sum) * ORDER_COUNT);
    for (let index = 0; index < count; index += 1) {
      const start = NOW - back * DAY - (back === 0 ? 0 : 16 * HOUR) + 7 * HOUR;
      const span = back === 0 ? 9 * HOUR : 14 * HOUR;
      times.push(start - Math.floor(random() * span) + (back === 0 ? 0 : 0));
    }
  });
  return times.filter((time) => time < NOW).sort((a, b) => b - a);
})();

export const ORDERS: Order[] = PLACED.map((time, index) => {
  const ageDays = (NOW - time) / DAY;
  const customer = pick(CUSTOMERS);
  const channel: Channel =
    customer.segment === 'retail'
      ? pick<Channel>(['web', 'web', 'app', 'marketplace'])
      : pick<Channel>(['wholesale', 'wholesale', 'web']);
  const lineCount = channel === 'wholesale' ? whole(2, 6) : whole(1, 3);
  const chosen = new Set<string>();
  const lines: OrderLine[] = [];
  while (lines.length < lineCount) {
    const product = pick(PRODUCTS);
    if (chosen.has(product.sku)) continue;
    chosen.add(product.sku);
    lines.push({
      sku: product.sku,
      name: product.name,
      quantity: channel === 'wholesale' ? whole(6, 48) : whole(1, 3),
      price: channel === 'wholesale' ? cents(product.price * 0.62) : product.price,
    });
  }
  const items = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cents(lines.reduce((sum, line) => sum + line.quantity * line.price, 0));
  const shipping = subtotal > 150 || channel === 'wholesale' ? 0 : pick([6.95, 9.95, 14.5]);
  const tax = channel === 'wholesale' ? 0 : cents(subtotal * 0.0725);

  /* What happened to the order is what its age allows. */
  const fulfillment: Fulfillment =
    ageDays < 0.4
      ? pick<Fulfillment>(['unfulfilled', 'unfulfilled', 'picking'])
      : ageDays < 1.5
        ? pick<Fulfillment>(['unfulfilled', 'picking', 'packed', 'shipped'])
        : ageDays < 5
          ? pick<Fulfillment>(['packed', 'shipped', 'shipped', 'delivered'])
          : 'delivered';
  const roll = random();
  const status: OrderStatus =
    fulfillment === 'delivered' && roll < 0.05
      ? 'refunded'
      : fulfillment === 'delivered' && roll < 0.09
        ? 'partially-refunded'
        : fulfillment === 'unfulfilled' && roll < 0.08
          ? 'voided'
          : channel === 'wholesale' && fulfillment !== 'delivered' && roll < 0.45
            ? 'pending'
            : 'paid';

  const tags: string[] = [];
  if (random() < 0.08) tags.push('Rush');
  if (channel !== 'wholesale' && random() < 0.07) tags.push('Gift');
  if (lines.some((line) => /mug|teapot|carafe|planter|lamp|bowl/i.test(line.name)))
    tags.push('Fragile');
  if (customer.segment === 'enterprise' && random() < 0.3) tags.push('VIP');

  return {
    id: `NW-${(48_920 - index).toString()}`,
    placed: isoMinute(time),
    customerId: customer.id,
    customer: customer.name,
    city: customer.city,
    owner: customer.owner,
    status,
    fulfillment,
    channel,
    warehouse: pick(WAREHOUSES).value,
    carrier: pick(CARRIERS),
    lines,
    items,
    subtotal,
    shipping,
    tax,
    total: cents(subtotal + shipping + tax),
    shipBy: isoDay(time + (tags.includes('Rush') ? 1 : 2) * DAY),
    tags,
  };
});

export const orderById = new Map(ORDERS.map((order) => [order.id, order]));

const isOpen = (order: Order) =>
  order.status !== 'voided' && order.fulfillment !== 'shipped' && order.fulfillment !== 'delivered';
/** Open orders past their promised ship date. */
export const isLate = (order: Order) => isOpen(order) && order.shipBy < TODAY;

/* ── Shipments ───────────────────────────────────────────────────────── */

export type ShipmentState = 'label' | 'in-transit' | 'out-for-delivery' | 'delayed' | 'delivered';

export interface Shipment {
  id: string;
  order: string;
  customer: string;
  destination: string;
  carrier: Carrier;
  service: 'Ground' | '2-day' | 'Overnight';
  warehouse: Warehouse;
  packages: number;
  weight: number;
  cost: number;
  shipped: string;
  eta: string;
  state: ShipmentState;
}

export const SHIPMENTS: Shipment[] = ORDERS.filter(
  (order) => order.fulfillment === 'shipped' || order.fulfillment === 'delivered',
).map((order, index) => {
  /* Most parcels leave the next morning; about one in twelve misses its ship-by day. */
  const shippedAt =
    Date.parse(`${order.placed}:00Z`) + (random() < 0.08 ? between(50, 80) : between(5, 30)) * HOUR;
  const service = pick<Shipment['service']>(['Ground', 'Ground', 'Ground', '2-day', 'Overnight']);
  const transit = service === 'Overnight' ? 1 : service === '2-day' ? 2 : whole(3, 5);
  const etaAt = shippedAt + transit * DAY;
  const packages = Math.max(1, Math.ceil(order.items / 6));
  const weight = Math.round(order.items * between(0.3, 1.4) * 10) / 10;
  const state: ShipmentState =
    order.fulfillment === 'delivered'
      ? 'delivered'
      : NOW - shippedAt < 6 * HOUR
        ? 'label'
        : etaAt < NOW
          ? 'delayed'
          : etaAt - NOW < DAY
            ? 'out-for-delivery'
            : random() < 0.12
              ? 'delayed'
              : 'in-transit';
  return {
    id: `1Z${(48_907_311 + index * 1_031).toString()}`,
    order: order.id,
    customer: order.customer,
    destination: order.city,
    carrier: order.carrier,
    service,
    warehouse: order.warehouse,
    packages,
    weight,
    cost: cents(4.2 + weight * (service === 'Overnight' ? 2.6 : service === '2-day' ? 1.4 : 0.7)),
    shipped: isoMinute(Math.min(shippedAt, NOW - HOUR)),
    eta: isoDay(etaAt),
    state,
  };
});

export const shipmentByOrder = new Map(SHIPMENTS.map((shipment) => [shipment.order, shipment]));

/* ── Returns ─────────────────────────────────────────────────────────── */

export type ReturnState = 'requested' | 'in-transit' | 'received' | 'refunded';
export const RETURN_REASONS = [
  'Arrived damaged',
  'Wrong size',
  'Not as described',
  'Changed mind',
  'Wrong item sent',
] as const;

export interface Return {
  id: string;
  order: string;
  customer: string;
  sku: string;
  product: string;
  quantity: number;
  reason: string;
  amount: number;
  requested: string;
  state: ReturnState;
}

export const RETURNS: Return[] = ORDERS.filter(
  (order) => order.status === 'refunded' || order.status === 'partially-refunded',
)
  .concat(ORDERS.filter((order) => order.fulfillment === 'delivered').slice(4, 18))
  .map((order, index) => {
    const line = pick(order.lines);
    const quantity = Math.min(line.quantity, whole(1, 2));
    const settled = order.status === 'refunded' || order.status === 'partially-refunded';
    const requestedAt = Math.min(Date.parse(`${order.placed}:00Z`) + whole(4, 12) * DAY, NOW - DAY);
    return {
      id: `RMA-${(7_310 + index * 3).toString()}`,
      order: order.id,
      customer: order.customer,
      sku: line.sku,
      product: line.name,
      quantity,
      reason: pick(RETURN_REASONS),
      amount: cents(line.price * quantity),
      requested: isoDay(requestedAt),
      state: settled ? 'refunded' : pick<ReturnState>(['requested', 'in-transit', 'received']),
    };
  })
  .sort((a, b) => b.requested.localeCompare(a.requested));

/* ── Purchase orders ─────────────────────────────────────────────────── */

export type PurchaseState = 'draft' | 'sent' | 'confirmed' | 'partially-received' | 'received';

export interface PurchaseOrder {
  id: string;
  supplier: string;
  warehouse: Warehouse;
  lines: number;
  units: number;
  amount: number;
  ordered: string;
  expected: string;
  received: number;
  state: PurchaseState;
}

export const PURCHASE_ORDERS: PurchaseOrder[] = Array.from({ length: 28 }, (_, index) => {
  const orderedBack = Math.floor(index * 2.6) + whole(0, 2);
  const expectedBack = orderedBack - whole(7, 21);
  const units = whole(80, 1400);
  const state: PurchaseState =
    index < 2
      ? 'draft'
      : expectedBack > 2
        ? 'received'
        : expectedBack > -2
          ? pick<PurchaseState>(['partially-received', 'confirmed'])
          : pick<PurchaseState>(['sent', 'confirmed', 'confirmed']);
  return {
    id: `PO-${(3_480 - index).toString()}`,
    supplier: pick(SUPPLIERS),
    warehouse: pick(WAREHOUSES).value,
    lines: whole(2, 14),
    units,
    amount: cents(units * between(9, 38)),
    ordered: daysBefore(orderedBack),
    expected: daysBefore(expectedBack),
    received:
      state === 'received' ? units : state === 'partially-received' ? Math.floor(units * 0.55) : 0,
    state,
  };
});

/* ── Invoices ────────────────────────────────────────────────────────── */

export type InvoiceState = 'draft' | 'open' | 'overdue' | 'paid' | 'void';

export interface Invoice {
  id: string;
  order: string;
  customer: string;
  terms: Customer['terms'];
  amount: number;
  paid: number;
  issued: string;
  due: string;
  state: InvoiceState;
}

const termDays = { Prepaid: 0, 'Net 30': 30, 'Net 45': 45 } as const;

/** Wholesale and enterprise orders are invoiced; the open balance ages from the due date. */
export const INVOICES: Invoice[] = ORDERS.filter((order) => order.channel === 'wholesale').map(
  (order, index) => {
    const customer = customerById.get(order.customerId)!;
    const terms = customer.terms === 'Prepaid' ? 'Net 30' : customer.terms;
    const issuedAt = Date.parse(`${order.placed}:00Z`) + DAY;
    const dueAt = issuedAt + termDays[terms] * DAY;
    const past = dueAt < NOW;
    const roll = random();
    const state: InvoiceState =
      issuedAt > NOW - DAY && roll < 0.5
        ? 'draft'
        : order.status === 'voided'
          ? 'void'
          : past
            ? roll < 0.82
              ? 'paid'
              : 'overdue'
            : roll < 0.3
              ? 'paid'
              : 'open';
    return {
      id: `INV-${(21_480 - index).toString()}`,
      order: order.id,
      customer: order.customer,
      terms,
      amount: order.total,
      paid:
        state === 'paid'
          ? order.total
          : state === 'overdue' && roll > 0.93
            ? cents(order.total * 0.4)
            : 0,
      issued: isoDay(Math.min(issuedAt, NOW)),
      due: isoDay(dueAt),
      state,
    };
  },
);

/** Whole days past due, for an unpaid invoice. */
export const daysOverdue = (invoice: Invoice) =>
  Math.max(0, Math.floor((NOW - Date.parse(`${invoice.due}T23:59:59Z`)) / DAY));

/* ── Series ──────────────────────────────────────────────────────────── */

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

/** Ninety days of revenue, orders and units, oldest first, counted from ORDERS. */
export const DAILY: DailyPoint[] = Array.from({ length: 90 }, (_, index) => {
  const date = daysBefore(89 - index);
  const day = ORDERS.filter((order) => order.placed.startsWith(date) && order.status !== 'voided');
  return {
    date,
    revenue: Math.round(day.reduce((sum, order) => sum + order.total, 0)),
    orders: day.length,
    units: day.reduce((sum, order) => sum + order.items, 0),
  };
});

/* ── Formats ─────────────────────────────────────────────────────────── */

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const wholeMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
export const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
export const count = new Intl.NumberFormat('en-US');
export const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});
export const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
export const shortDateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});
/** A `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` text, read as UTC. */
export const instant = (text: string) =>
  new Date(text.length === 10 ? `${text}T00:00:00Z` : `${text}:00Z`);
