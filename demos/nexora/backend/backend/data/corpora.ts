/**
 * Authored free-text corpora. Every entry is written for the industrial
 * distribution domain; generators pick by category so conversations, notes
 * and descriptions read as if different people wrote them.
 */

export const TICKET_OPENERS_BY_CATEGORY: Record<string, string[]> = {
  shipping: [
    'Hi, we placed {order} last week and tracking still shows "label created". Can you confirm when this will actually ship?',
    'Our receiving dock logged a short shipment against {order}: two cartons on the packing list never arrived. Please advise.',
    'The pallet for {order} came in with the stretch wrap torn and three boxes crushed. Photos attached. What is the claim process?',
    'Following up on {order} — our line is scheduled to restart Monday and we have no ETA on the remaining units.',
    'Carrier attempted delivery at 6:40 AM before our dock opened. Can you request a redelivery window between 8 and 3?',
    'We need the BOL and packing slip for {order} for our customs broker. Receiving cannot close the receipt without it.',
    'The shipment for {order} was routed to our old address in Rockford. We moved in March; the account should have the new ship-to.',
    'Our team is asking whether {order} can be split so the in-stock items ship today and the backorder follows.',
    'Tracking says delivered, but nothing arrived at the plant. Signature shows "FRONT DESK" and we do not have one.',
    'Received {order} with the wrong carrier service — we requested ground and were billed for next day.',
  ],
  billing: [
    'Invoice {invoice} does not match our PO. The unit price on line 3 is $12.40 higher than quoted.',
    'Our AP team received {invoice} twice with different due dates. Which one is correct?',
    'We need an updated W-9 and your remittance details before we can release payment for {invoice}.',
    'The payment we sent on the 14th was applied to the wrong invoice. Please move it to {invoice}.',
    'Sales tax was charged on {invoice} but our resale certificate is on file. Please issue a corrected invoice.',
    'Can you send a statement of open items? Our controller wants to reconcile before quarter close.',
    'Credit memo from the June return is not showing on our statement. Where was it applied?',
    'We are disputing the freight charge on {invoice}. The quote said prepaid and added, not $412.',
    'Please resend {invoice} as PDF; the portal copy is missing the PO number and our system rejects it.',
  ],
  product: [
    'Two of the {sku} units failed within a week of install. Both show a fault code on power-up. Can we get replacements under warranty?',
    'Need the datasheet and CAD files for {sku} before our engineering review on Thursday.',
    'Is {sku} compatible with the older controller we bought in 2024? The connector looks different.',
    'The {sku} we received has firmware 2.1 and our line runs 1.8. Can it be downgraded or do we need to update the others?',
    'The part we usually order was discontinued. What is the recommended cross-reference and are the mounting dimensions identical?',
    'Torque spec is missing from the packaging for {sku}. Our maintenance team will not install without it.',
    'The label on {sku} shows a different manufacturer part number than our drawing. Please confirm it is the same item.',
    'Requesting a certificate of conformance for the last lot of {sku} we received.',
  ],
  returns: [
    'Requesting an RMA for {order}. The quantity was entered wrong on our side; the items are unopened.',
    'The return label you sent expired before our carrier pickup. Can you issue a new one?',
    'What is the status of the credit for the return we shipped back two weeks ago?',
    'Wrong item shipped on {order} — we received the 10 mm variant instead of the 12 mm. Need the correct part and a return label.',
    'We want to return the surplus from the project order. Is there a restocking fee on stocked items?',
  ],
  account: [
    'Please add our new buyer to the portal with ordering rights. Her details are below.',
    'Our ship-to address changed; the plant moved to the new industrial park. Update before the next release.',
    'Change the primary contact on the account to our purchasing manager; the previous contact left the company.',
    'We would like to request a credit limit review. Our volume has doubled since the line expansion.',
    'Can our payment terms move from NET 30 to NET 45? Our other suppliers already allow it.',
  ],
  portal: [
    'I cannot log in to the customer portal. The reset email never arrives, and it is not in spam.',
    'Order history in the portal stops in April. Where are the newer orders?',
    'The saved cart with our monthly consumables disappeared after the last portal update.',
    'The password reset link says it expired even though I clicked it right away.',
  ],
  pricing: [
    'Our contract price was not applied on {order}. We should be at the agreed rate through year end.',
    'The quote expired while our approval was pending. Can you extend the pricing for 10 days?',
    'What is the volume break on {sku} if we commit to a quarterly blanket order?',
    'The price on the portal is higher than the quote you sent last week for the same part.',
  ],
  other: [
    'General question about your delivery coverage for our new site in Georgia.',
    'Feedback: the last delivery was on time and the driver called ahead. Please pass it on.',
    'Would like to schedule an account review with our rep before the budget cycle.',
  ],
};

export const TICKET_FOLLOWUPS: string[] = [
  'Any update on this? We are still waiting to hear back.',
  'Thanks — that matches what receiving told me. We will confirm once the units arrive.',
  'Adding our plant manager to this thread; he needs visibility on the timing.',
  'Understood. Please keep the ticket open until the credit posts.',
  'Our purchasing system needs the corrected document before Friday; is that possible?',
  'We escalated on our side as well. Appreciate the quick response.',
  'Can you confirm the replacement is shipping from the same warehouse?',
  'That works for us. Let me know once the label is issued.',
  'One more thing — the packing slip also had the wrong PO number.',
  'The line is back up on the temporary part; we still need the permanent fix.',
];

export const AGENT_REPLIES_BY_CATEGORY: Record<string, string[]> = {
  shipping: [
    'Thanks for flagging this. I have the shipment up now and am checking with the warehouse; I will update you within the hour.',
    'Confirmed with the carrier: the freight left the hub this morning and tracking should refresh by early afternoon.',
    'I have filed the damage claim with the carrier and requested replacements for the crushed cartons at no charge.',
    'I split the order: the in-stock items ship today from Chicago and the backordered line follows as soon as the inbound PO arrives.',
    'A redelivery has been scheduled for tomorrow between 8:00 and 11:00. The driver will call ahead.',
    'The BOL and packing slip are attached. I also added them to the shipment record so your broker can download them later.',
    'The ship-to on the account has been corrected. I am arranging a reroute with the carrier now.',
  ],
  billing: [
    'You are right — the line 3 price should reflect the quote. A corrected invoice is attached and the original has been voided.',
    'Our finance team moved the payment to the correct invoice. The statement will reflect it on the next run.',
    'The tax was charged because the certificate on file had expired. I have updated it and issued a credit memo for the tax amount.',
    'A statement of open items is attached. Two invoices show as disputed pending the freight review.',
    'The credit memo was applied to the oldest open invoice. I have attached the allocation detail.',
    'Freight was quoted prepaid and added, so the charge stands, but I have applied a service credit for the confusion.',
  ],
  product: [
    'I have issued an RMA for the two failed units and a prepaid label. Replacements are shipping today under warranty.',
    'Datasheet and STEP files are attached. Let me know if engineering needs the 2D drawings as well.',
    'The connector changed in the 2025 revision; an adapter cable is available and I have added it to your quote.',
    'Firmware 2.1 is backward compatible with your 1.8 controllers; no downgrade is required.',
    'The recommended cross-reference is the successor model with identical mounting dimensions. Confirmed against the drawing.',
    'The certificate of conformance for the last lot is attached.',
  ],
  returns: [
    'The RMA has been created and the prepaid label emailed. Once received we inspect within two business days.',
    'A new return label is attached; the previous one has been cancelled.',
    'The return was received yesterday and passed inspection. The credit memo will post today.',
    'I am sorry about the wrong variant. The correct part ships today and a label for the incorrect one is attached.',
  ],
  account: [
    'The new user has been added to the portal with ordering rights. An invitation went out a minute ago.',
    'The ship-to address has been updated and set as default for future releases.',
    'The primary contact has been changed. The previous contact remains on historical records only.',
    'I have forwarded the credit review to Finance; they will respond within two business days.',
  ],
  portal: [
    'I reset the login from our side and sent a new link that is valid for 24 hours.',
    'The order history filter defaulted to the current quarter. I changed your default view to show all orders.',
    'Your saved cart was restored from the nightly backup.',
  ],
  pricing: [
    'The contract price has been applied and a corrected invoice is attached.',
    'I extended the quote validity by 10 days so your approval can complete.',
    'The volume break kicks in at 250 units per quarter; I have added the tiered pricing to your quote.',
  ],
  other: [
    'Thanks for the feedback — I have passed it to the Chicago team.',
    'I will coordinate with your account executive to schedule the review.',
  ],
};

export const INTERNAL_NOTES: string[] = [
  'Customer is a key account — keep the AE in the loop.',
  'Checked ledger: 6 units short at CHI-01, inbound PO due Friday.',
  'Carrier claim filed, reference in the shipment notes.',
  'Finance confirmed payment was applied to the wrong invoice; reversal in progress.',
  'Waiting on supplier confirmation before promising a date.',
  'Customer called again; tone is escalating. Prioritize.',
  'Certificate on file expired in May. Requested a new copy from the customer.',
  'Warehouse says the pallet left intact; damage likely at the carrier cross-dock.',
  'Duplicate of an earlier ticket from the same contact; linking.',
  'Engineering confirmed the successor part; updating the cross-reference table.',
  'Portal login issue traced to a locked account after five failed attempts.',
  'AE approved a service credit up to $250 for this one.',
  'Replacement is on the truck; notified the contact by phone.',
  'Holding the credit memo until the return passes inspection.',
  'Customer PO number on the invoice was wrong; corrected copy sent.',
  'Second reminder sent to supplier for the delayed PO.',
];

export const CUSTOMER_NOTE_BODIES: string[] = [
  'Renewal discussion scheduled for next month. Prepare pricing on the top 20 SKUs by volume.',
  'Plant expansion in Q1 — expect a 15–20% increase in monthly volume.',
  'Accounts payable contact changed. Update the billing contact before the next invoice run.',
  'Customer prefers consolidated weekly shipments to reduce receiving load.',
  'Collections call completed. Customer committed to pay the overdue invoice by the end of the week.',
  'Site visit notes: two lines running the MX-240 servo; spare inventory is low on their side.',
  'Requested a quarterly business review. Include OTD metrics and open backorders.',
  'Escalated shipping delay to warehouse; customer is aware and appreciative of the transparency.',
  'Credit limit reviewed with Finance; no change until the overdue balance clears.',
  'Competitor quoted lower on fasteners. Hold price on motion control; consider a bundle.',
  'Buyer is out until the 20th; route urgent items to the plant manager.',
  'They standardized on 24 VDC across the new line — cross-sell power supplies and sensors.',
  'Receiving dock closes at 3 PM; afternoon deliveries get refused.',
  'Asked for lot traceability on safety relays; add certs to every shipment.',
  'Payment terms conversation went well; they will send audited financials for the NET 45 review.',
  'New engineering manager wants a lunch-and-learn on the VX-7 drive family.',
  'Complained about back-to-back partial shipments in August; ship complete unless they say otherwise.',
  'Budget freeze until October; expect quotes to sit.',
  'They are consolidating suppliers — we are on the shortlist with two others.',
  'Portal adoption is low; walk the buyer through saved carts on the next call.',
  'Prefers phone over email for anything urgent.',
  'Contract pricing expires in November; start the renewal conversation in September.',
  'Their maintenance team keeps ordering the discontinued sensor; send the cross-reference sheet.',
  'Good reference account for the packaging vertical; ask about a case study.',
  'Tax exemption certificate renewed; copy filed with Finance.',
  'Warehouse noted repeated damage claims from the same carrier lane; switch to LTL for pallets.',
  'Introduced the new inside sales rep; buyer was receptive.',
  'They are moving to a VMI model for MRO consumables next year; keep Procurement informed.',
  'Requested EDI for POs; forwarded to Business Systems.',
  'Follow up on the open quote for the controller upgrade before it expires.',
];

export const HOLD_REASONS_LONG: string[] = [
  'Credit exposure exceeds approved limit',
  'Overdue receivables beyond 60 days',
  'Pending finance review of payment terms',
  'Disputed invoices outstanding',
  'Returned check — awaiting replacement payment',
  'Account under review after two late payments in a quarter',
  'Bankruptcy notice received from the customer',
  'Tax exemption documentation missing',
];

export const ORDER_NOTES: string[] = [
  'Customer requests all items ship complete.',
  'Call receiving before delivery.',
  'Blanket release — see customer PO for schedule.',
  'Rush: production line down.',
  'Include certs of conformance with shipment.',
  'Deliver to dock 4; forklift available on site.',
  'Customer will pick up at will call.',
  'Do not deliver on Fridays after noon.',
  'Lift gate required at delivery.',
  'Ship via customer account with their carrier.',
  'Consolidate with the open backorder if it ships this week.',
  'Requested delivery window is firm; expedite if needed.',
];

export const CANCELLATION_REASONS: string[] = [
  'Customer cancelled — project postponed',
  'Duplicate order',
  'Pricing dispute',
  'Ordered in error',
  'Lead time too long',
  'Customer sourced elsewhere',
  'Budget freeze at the customer',
  'Replaced by a revised order',
];

export const PO_NOTES_LONG: string[] = [
  'Blanket release against annual agreement.',
  'Expedite — customer backorder pending.',
  'Confirm pack multiple before shipping.',
  'Ship complete only.',
  'Supplier requested revised delivery window.',
  'Include certs of conformance with the shipment.',
  'Deliver to receiving dock 2; appointment required.',
  'Partial shipments accepted; invoice per shipment.',
  'Replacement lot for the rejected receipt last month.',
  'Pricing per the Q3 supplier agreement.',
  'Palletize; no loose cartons.',
  'Reference the recall notice; replacement units only.',
];

export const SHIPMENT_EXCEPTIONS_LONG: { code: string; message: string }[] = [
  { code: 'CARRIER_DELAY', message: 'Carrier reported a weather delay at the regional hub.' },
  {
    code: 'ADDRESS_ISSUE',
    message: 'Delivery attempted; receiving dock closed. Redelivery scheduled.',
  },
  { code: 'DAMAGED_IN_TRANSIT', message: 'Pallet damage reported by the carrier; claim opened.' },
  { code: 'LOST_IN_TRANSIT', message: 'Carrier cannot locate the shipment; trace initiated.' },
  { code: 'REFUSED', message: 'Delivery refused by the consignee; awaiting instructions.' },
  { code: 'MISSORTED', message: 'Shipment missorted to another terminal; rerouted.' },
  { code: 'CUSTOMS_HOLD', message: 'Shipment held for documentation review.' },
  { code: 'MECHANICAL', message: 'Trailer breakdown; freight transferred to another unit.' },
];

/** Product description sentences by root category. */
export const PRODUCT_CLAIMS_BY_ROOT: Record<string, string[]> = {
  'Motion Control': [
    'Rated for continuous duty at full torque with a 24-month manufacturer warranty.',
    'Standard mounting and shaft options match common OEM footprints.',
    'Feedback and power connectors are keyed to prevent miswiring during service.',
    'Thermal protection and overload detection are built in.',
    'Stocked at Chicago and Dallas for same-day shipment.',
    'Compatible drive parameter files are available on request.',
  ],
  'Sensors & Instrumentation': [
    'IP67-rated housing for washdown and outdoor mounting.',
    'PNP and NPN output variants are listed separately.',
    'Calibration certificate available with the instrument option.',
    'Short-circuit and reverse-polarity protected.',
    'Cordset and bracket accessories are stocked alongside.',
    'Extended sensing range version listed under the same family.',
  ],
  'Control & Automation': [
    'Firmware updates are distributed through the manufacturer portal.',
    'DIN-rail mounting with removable terminal blocks for quick replacement.',
    'Supports EtherNet/IP and Modbus TCP out of the box.',
    'Conformal coating option for high-humidity environments.',
    'Backed by a 24-month manufacturer warranty.',
  ],
  Electrical: [
    'UL listed and CE marked.',
    'DIN-rail mount; screw or spring-clamp terminals depending on variant.',
    'Sized for panel builders working from standard schedules.',
    'Bulk packaging available for panel shops.',
    'Ships from stock at most Asteron locations.',
  ],
  'Pneumatics & Hydraulics': [
    'ISO-standard dimensions for drop-in replacement.',
    'Rated to 145 psi with filtered, lubricated or non-lubricated air.',
    'Seal kits and mounting accessories are stocked separately.',
    'Cushioned end-of-stroke on the standard variant.',
    'Suitable for packaging, assembly and material handling lines.',
  ],
  'Fasteners & Hardware': [
    'Zinc-plated unless noted; stainless variants listed separately.',
    'Sold in packs; bulk cartons available for high-volume accounts.',
    'Meets ASTM specifications for the stated grade.',
    'Lot-traceable on request for regulated customers.',
  ],
  Safety: [
    'Rated to the category and performance level stated on the datasheet.',
    'ANSI/ISEA compliant where applicable.',
    'Sized for industrial use; replacement parts stocked.',
    'Ships from stock at most Asteron locations.',
  ],
  'Cutting Tools & Abrasives': [
    'Engineered for steel and stainless; coated variants for aluminum listed separately.',
    'Sold individually or in shop packs.',
    'Consistent geometry across lots for CNC programs.',
    'Ships same day from Chicago.',
  ],
  'Material Handling': [
    'Rated capacity is stated per unit; verify before use.',
    'Freight item; ships LTL on a pallet.',
    'Powder-coated steel for warehouse environments.',
    'Assembly hardware included.',
  ],
  'Enclosures & Cable Management': [
    'NEMA-rated as stated; gasketed door with three-point latch on larger sizes.',
    'Back panel sold separately unless noted.',
    'Knockouts and mounting feet included.',
    'Available in gray and stainless finishes.',
  ],
  'Fluid Handling': [
    'Wetted parts listed on the datasheet; verify chemical compatibility.',
    'Standard NPT connections; BSPP variants on request.',
    'Rebuild kits stocked for common models.',
    'Ships from Dallas and Atlanta.',
  ],
  'MRO Consumables': [
    'Priced per pack; case quantities available.',
    'Safety data sheet available on the product page.',
    'Stocked at every Asteron location for same-day pickup.',
    'Vendor-managed inventory programs available for high-volume accounts.',
  ],
};

export const TICKET_SATISFACTION_COMMENTS: string[] = [
  'Fast response and the replacement arrived the next day.',
  'Took a while but the issue was resolved.',
  'Great follow-up from the agent.',
  'Had to explain the problem twice.',
  'Resolved, but the credit took longer than promised.',
];
