# Nexora Operations

## Reference Application Domain & Product Specification

**Status:** Implementation baseline for the V1 reference application  
**Language:** English  
**Primary purpose:** Demonstrate realistic, production-grade usage of the UI library in a complete simulated business application  
**Application type:** B2B SaaS / operations platform / ERP-like system  
**Product name:** Nexora Operations

> **Implementation note:** Part I establishes product intent and UX scope. Part II is the normative implementation contract and takes precedence over any earlier descriptive shorthand.

---

## 1. Purpose

Nexora Operations is the reference product used to validate, demonstrate, and stress-test the UI library in realistic application conditions.

It must not behave like a component gallery, a collection of disconnected examples, or an expanded Storybook. It should feel like a real operational product used daily by a mid-market company.

The application should demonstrate how the UI library performs when exposed to:

- dense operational workflows;
- large and irregular datasets;
- deeply related business entities;
- multi-step forms;
- permissions and restricted actions;
- loading, error, empty, partial, stale, and degraded states;
- long-running user journeys;
- cross-module navigation;
- domain-specific workspaces;
- complex tables and filters;
- non-standard interfaces that go beyond common SaaS CRUD layouts;
- realistic destructive, reversible, and asynchronous operations.

The core benchmark is simple:

> If the library branding and demo controls were hidden, the application should be believable as a real commercial SaaS product.

---

## 2. Product Concept

Nexora Operations is a multi-tenant B2B operations platform for companies that distribute products, manage inventory, purchase from suppliers, sell to business customers, issue invoices, track payments, and operate customer support.

The default demo tenant is a fictional mid-market industrial distributor:

### Asteron Industrial Supply

Asteron Industrial Supply imports, distributes, and services industrial equipment and components. It operates multiple warehouses, sells to business customers, manages recurring supplier relationships, and has a mixture of inside sales, field operations, finance, warehouse, and support teams.

This domain is intentionally broad because it naturally requires both standard and advanced product interfaces without becoming an artificial collection of unrelated features.

### Default tenant profile

| Attribute            | Value                                |
| -------------------- | ------------------------------------ |
| Company              | Asteron Industrial Supply            |
| Industry             | Industrial distribution and services |
| Business model       | B2B                                  |
| Employees            | ~320                                 |
| Active users         | ~170                                 |
| Active customers     | ~4,800                               |
| Suppliers            | ~1,200                               |
| Products / SKUs      | ~18,000                              |
| Warehouses           | 5                                    |
| Annual order volume  | ~80,000                              |
| Primary currency     | USD                                  |
| Secondary currencies | EUR, GBP                             |
| Operating model      | Multi-warehouse, multi-team          |
| Customer types       | SMB, mid-market, enterprise          |

These values describe the intended company scale. The canonical implementation counts and logical history are fixed in Part II, Section 75.

---

## 3. Product Principles

### 3.1 Domain first, screens second

The demo must be designed from business entities and workflows rather than from UI components.

Avoid:

> “We need a page to showcase DataTable.”

Prefer:

> “Operations needs to manage thousands of orders with saved views, exceptions, bulk actions, and fulfillment status.”

The UI library should appear naturally as a consequence of solving product problems.

### 3.2 One coherent product

Every module belongs to the same company, users, permissions model, customer base, catalog, and operational timeline.

A customer opened from CRM must be the same customer referenced by:

- orders;
- invoices;
- support tickets;
- payments;
- notes;
- activities;
- contracts;
- analytics.

Cross-module consistency is mandatory.

### 3.3 Realistic density

The application should include sparse, medium-density, dense, and extremely dense interfaces.

Dense does not mean visually noisy. It means the information architecture reflects real operational needs.

### 3.4 Imperfect states are first-class

The demo must intentionally include:

- incomplete records;
- failed operations;
- permission restrictions;
- partially fulfilled orders;
- overdue invoices;
- products without stock;
- long names;
- missing contact details;
- conflicting values;
- validation errors;
- partial success;
- interrupted processes.

A perfect dataset is less realistic and less useful for library validation.

### 3.5 Actions should have consequences

When possible, user actions should update related data.

For example:

1. Record a payment.
2. The invoice balance changes.
3. The payment appears in the invoice timeline.
4. The customer outstanding balance changes.
5. Finance metrics update.
6. The activity log records the event.

This behavior is more valuable than a set of visually impressive but isolated pages.

---

## 4. Reference Application Strategy

### Decision

Nexora Operations should be treated as **one canonical product**, not two independent demos.

For V1, implement the full canonical reference application in **React**. React is the primary V1 delivery client; Angular remains a later parity/reference client that consumes the exact same domain, data, scenarios, and simulated API.

The domain, demo database, API contracts, data generators, business scenarios, and behavioral rules must remain framework-agnostic.

A second framework implementation may be added later as a **parity/reference client**, not as a separate demo product.

### Rationale

Building two full applications in parallel would create unnecessary duplication while the product model is still evolving.

During early development, the largest source of change will be:

- domain modeling;
- navigation;
- workflows;
- data modeling;
- interaction design;
- component capability discoveries.

Duplicating those changes across React and Angular would roughly double application-level maintenance without doubling the learning value.

The preferred progression is:

```text
Shared domain + shared demo backend + shared scenarios
                    |
                    v
        Primary reference application
                    |
            product model stabilizes
                    |
                    v
       Optional framework parity client
```

If both framework clients eventually exist, they should represent the **same Nexora tenant, same data contracts, same scenarios, and same core journeys**.

The second client is primarily useful for validating framework adapter parity.

It should not become a separate product design effort.

---

## 5. Suggested Repository Boundary

The exact package names may follow the repository's conventions, but the architectural boundary should resemble:

```text
apps/
  nexora-reference/          # primary reference app
  nexora-angular/            # optional later parity client

packages/
  ui-core/
  ui-react/
  ui-angular/

  nexora-domain/
  nexora-data/
  nexora-api/
```

Responsibilities:

### `nexora-domain`

Framework-independent business definitions:

- entity types;
- value objects;
- status models;
- permission definitions;
- workflow rules;
- API DTO contracts when appropriate;
- domain-specific utilities.

It must not depend on React, Angular, browser rendering, or UI components.

### `nexora-data`

Demo database concerns:

- deterministic seed data;
- curated flagship records;
- generated high-volume records;
- entity relationships;
- edge-case records;
- demo scenarios;
- reset logic;
- optional migrations for persisted demo state.

### `nexora-api`

Backend simulation:

- request handlers;
- filtering;
- pagination;
- sorting;
- searching;
- mutations;
- permission checks;
- validation;
- latency;
- errors;
- conflict simulation;
- activity generation;
- persistence integration.

### Reference application

Responsible only for product UI and application behavior:

- routes;
- layouts;
- screens;
- feature composition;
- view-specific state;
- framework integrations;
- UI library usage.

The reference app should consume the demo backend as if it were an external service.

---

# 6. Domain Map

Nexora Operations is divided into the following bounded product areas:

1. Organization & Identity
2. CRM
3. Product Catalog
4. Sales
5. Inventory & Warehousing
6. Procurement
7. Finance
8. Customer Support
9. Workflow & Automation
10. Analytics & Reporting
11. Activity, Audit & Notifications
12. Administration & Settings

These modules intentionally overlap through well-defined entity relationships.

---

# 7. Organization & Identity

This module establishes the multi-user, role-based structure of the tenant.

## Core entities

### Organization

Represents the tenant.

Key fields:

- id;
- legal name;
- display name;
- industry;
- primary currency;
- supported currencies;
- timezone;
- fiscal year start;
- billing address;
- operational regions;
- status;
- created date.

### User

Represents an application user.

Key fields:

- id;
- first name;
- last name;
- display name;
- email;
- avatar;
- title;
- department;
- team memberships;
- manager;
- status;
- role assignments;
- locale;
- timezone;
- last active;
- notification preferences.

### Team

Examples:

- Enterprise Sales;
- SMB Sales;
- Finance;
- Procurement;
- Customer Support;
- Warehouse Operations;
- Executive;
- IT Administration.

### Role

Roles define permission bundles.

Suggested roles:

- Administrator;
- Executive;
- Sales Manager;
- Sales Representative;
- Finance Manager;
- Accountant;
- Procurement Manager;
- Buyer;
- Warehouse Manager;
- Warehouse Operator;
- Support Manager;
- Support Agent;
- Auditor;
- Read-only User.

### Permission

Permissions should be granular enough to create meaningful UI differences.

Examples:

```text
customers.view
customers.create
customers.edit
customers.export

orders.view
orders.create
orders.approve
orders.cancel
orders.override_price

inventory.view
inventory.adjust
inventory.transfer

invoices.view
invoices.create
invoices.send
invoices.void

payments.record
payments.refund

users.manage
roles.manage

audit.export
```

## UI implications

This module supports:

- user management tables;
- role assignment;
- permission matrices;
- invitations;
- session information;
- team selectors;
- avatar groups;
- restricted actions;
- read-only states;
- permission-denied pages.

---

# 8. CRM

CRM represents organizations and people Asteron sells to.

## Core entities

### Customer

A business account.

Key fields:

- id;
- account number;
- legal name;
- display name;
- account status;
- segment;
- industry;
- company size;
- website;
- primary contact;
- account owner;
- sales team;
- billing address;
- shipping addresses;
- payment terms;
- credit limit;
- credit utilization;
- default price list;
- tax profile;
- preferred currency;
- created date;
- customer since;
- annual revenue estimate;
- lifetime value;
- open balance;
- health score;
- tags.

Suggested customer statuses:

```text
Prospect
Active
At Risk
On Hold
Inactive
Closed
```

Suggested segments:

```text
SMB
Mid-Market
Enterprise
Strategic
```

### Contact

A person belonging to a customer.

Fields:

- id;
- customer id;
- name;
- title;
- department;
- email;
- phone;
- mobile;
- preferred contact method;
- primary flag;
- status;
- last contacted;
- notes.

### Address

Types:

- billing;
- shipping;
- headquarters;
- warehouse;
- service location.

### Customer Note

Supports internal collaboration.

Fields:

- author;
- date;
- rich text/body;
- visibility;
- pinned state;
- attachments;
- mentions.

### Customer Activity

Examples:

- call;
- meeting;
- email;
- order created;
- invoice overdue;
- payment received;
- support escalation;
- note added;
- address changed.

## Customer 360 relationship

A Customer Detail page should aggregate:

```text
Customer
├── Contacts
├── Addresses
├── Orders
├── Quotes
├── Invoices
├── Payments
├── Support Tickets
├── Notes
├── Activities
└── Contracts / Commercial Terms
```

This should be one of the flagship pages of the product.

---

# 9. Product Catalog

The catalog defines what Asteron sells.

## Core entities

### Product

Fields:

- id;
- SKU;
- manufacturer part number;
- name;
- description;
- category;
- manufacturer;
- brand;
- status;
- product type;
- unit of measure;
- list price;
- cost;
- gross margin;
- currency;
- weight;
- dimensions;
- barcode;
- tax class;
- lead time;
- reorder policy;
- preferred supplier;
- images;
- technical documents;
- tags.

Product-family statuses:

```text
Active
Draft
Discontinued
```

### SKU

Every product family has at least one sellable SKU. Variant dimensions, when present, live on the SKU, for example:

- voltage;
- size;
- material;
- color;
- package size.

SKU master statuses are:

```text
Active
Restricted
Discontinued
```

`Backordered` is a derived inventory condition, not a master-data status.

### Category

Hierarchical taxonomy.

Example:

```text
Industrial Automation
├── Sensors
├── Controllers
├── Motors
└── Drives
```

### Price List

Different customer segments can use different price lists.

Examples:

- Standard;
- Enterprise;
- Strategic Accounts;
- Distributor;
- Contract pricing.

### Product Supplier Mapping

Represents supplier-specific:

- supplier SKU;
- cost;
- MOQ;
- lead time;
- packaging;
- purchasing currency;
- supplier status.

## UI implications

The catalog can support:

- nested navigation;
- advanced filters;
- images;
- technical metadata;
- comparison interfaces;
- variant matrices;
- document lists;
- supplier pricing tables;
- status tags;
- inventory summaries.

---

# 10. Sales

Sales connects customers, commercial pricing, orders, and fulfillment.

## Core entities

### Quote

Represents a commercial proposal.

Fields:

- id;
- quote number;
- customer;
- contact;
- owner;
- created date;
- expiration date;
- currency;
- price list;
- line items;
- subtotal;
- discount;
- tax;
- freight;
- total;
- margin;
- approval status;
- notes;
- terms.

Statuses:

```text
Draft
Pending Approval
Approved
Sent
Viewed
Accepted
Rejected
Expired
Converted
```

### Sales Order

Fields:

- id;
- order number;
- customer;
- customer PO number;
- contact;
- owner;
- sales team;
- order date;
- requested delivery date;
- warehouse;
- billing address;
- shipping address;
- currency;
- payment terms;
- line items;
- subtotal;
- discount;
- tax;
- freight;
- total;
- margin;
- approval state;
- payment state;
- fulfillment state;
- risk flags;
- internal notes.

Sales-order state is intentionally multidimensional rather than a single lifecycle.

Commercial status:

```text
Draft
Pending Approval
Confirmed
On Hold
Cancelled
Closed
```

Allocation, fulfillment, invoicing, and payment are separate derived state dimensions. Part II, Section 59 defines their exact values and transitions.

### Sales Order Line

Fields:

- product;
- SKU;
- description;
- ordered quantity;
- allocated quantity;
- fulfilled quantity;
- backordered quantity;
- unit price;
- discount;
- tax;
- total;
- warehouse;
- expected availability.

### Shipment

Fields:

- shipment number;
- order;
- warehouse;
- carrier;
- service;
- tracking number;
- status;
- shipped date;
- estimated delivery;
- delivered date;
- packages;
- shipment lines.

Statuses:

```text
Pending
Picking
Packed
Ready to Ship
Shipped
In Transit
Delivered
Exception
Returned
```

### Return

Fields:

- return number;
- source order;
- customer;
- reason;
- requested items;
- received items;
- disposition;
- refund status.

## UI implications

Sales should provide some of the densest pages in the application:

- sales order list;
- quote editor;
- order workspace;
- approval queue;
- fulfillment status;
- line-item editing;
- totals and margin calculations;
- multi-column filters;
- bulk operations;
- order timelines;
- confirmation dialogs;
- complex action menus.

---

# 11. Inventory & Warehousing

This module provides operational depth and justifies several custom interfaces.

## Core entities

### Warehouse

Fields:

- id;
- code;
- name;
- address;
- manager;
- timezone;
- capacity;
- operational status.

Example warehouses:

```text
CHI-01 — Chicago Central
DAL-01 — Dallas Distribution
ATL-01 — Atlanta Hub
DEN-01 — Denver Regional
NJ-01  — New Jersey East
```

### Warehouse Location

Represents bins, aisles, zones, receiving areas, staging areas, etc.

Example:

```text
A-01-03
A-01-04
B-07-01
RECEIVING-02
STAGING-05
```

### Inventory Balance

Per product, warehouse, and optionally location:

- on hand;
- allocated;
- available;
- inbound;
- damaged;
- quarantine;
- safety stock;
- reorder point.

### Stock Movement

Types:

```text
Receipt
Allocation
Deallocation
Pick
Shipment
Return
Adjustment
Transfer Out
Transfer In
Damage
Cycle Count
```

### Inventory Transfer

Moves stock between warehouses.

### Cycle Count

Represents periodic inventory verification.

## Inventory exception model

Examples:

- below safety stock;
- negative available quantity;
- delayed inbound purchase order;
- stock mismatch;
- quarantine;
- damaged inventory;
- transfer delayed;
- high allocation pressure.

## Custom UI opportunities

This module should deliberately go beyond tables.

Possible workspaces:

### Warehouse capacity map

Visual representation of warehouse zones and occupancy.

### Inventory heatmap

Highlight areas or categories with:

- high utilization;
- stock risk;
- excess stock;
- aged stock.

### Allocation inspector

Show how available inventory is reserved across orders.

### Stock movement timeline

High-density chronological event stream.

These interfaces are useful for proving that the UI library can support custom product experiences rather than only standard SaaS patterns.

---

# 12. Procurement

Procurement links suppliers to inventory replenishment.

## Core entities

### Supplier

Fields:

- id;
- supplier number;
- legal name;
- status;
- supplier category;
- primary contact;
- addresses;
- payment terms;
- supported currencies;
- preferred shipping terms;
- on-time delivery score;
- quality score;
- average lead time;
- open purchase orders;
- annual spend;
- tags.

Lifecycle statuses:

```text
Active
On Hold
Inactive
```

Relationship tier is separate:

```text
Standard
Preferred
Conditional
```

### Purchase Order

Fields:

- PO number;
- supplier;
- buyer;
- destination warehouse;
- created date;
- expected date;
- currency;
- line items;
- subtotal;
- tax;
- freight;
- total;
- approval state;
- receipt state;
- supplier acknowledgment;
- notes.

Lifecycle:

```text
Draft
→ Pending Approval
→ Approved
→ Sent
→ Acknowledged
→ Partially Received
→ Received
→ Closed
```

Exception states:

```text
Delayed
Disputed
Cancelled
```

### Goods Receipt

Represents incoming inventory.

Fields:

- receipt number;
- purchase order;
- warehouse;
- receiving user;
- received date;
- line quantities;
- damaged quantities;
- rejected quantities;
- receiving notes.

### Supplier Performance

Derived analytics:

- average lead time;
- delivery reliability;
- defect rate;
- purchase volume;
- price variance.

## UI implications

Procurement supports:

- approval workflows;
- supplier comparison;
- receiving workflows;
- line item tables;
- exception handling;
- scorecards;
- purchasing dashboards.

---

# 13. Finance

Finance should feel operational rather than accounting-theory-heavy.

The goal is not to build a complete general ledger. The goal is to model enough financial operations to create believable commercial workflows.

## Core entities

### Invoice

Fields:

- invoice number;
- customer;
- source order;
- issue date;
- due date;
- currency;
- subtotal;
- tax;
- total;
- paid amount;
- outstanding amount;
- status;
- billing contact;
- billing address;
- customer PO;
- payment terms.

Statuses:

```text
Draft
Open
Partially Paid
Paid
Overdue
Disputed
Voided
Written Off
```

### Payment

Fields:

- payment number;
- customer;
- invoice allocations;
- amount;
- currency;
- method;
- received date;
- reference;
- status;
- recorded by.

Methods:

```text
ACH
Wire Transfer
Credit Card
Check
Other
```

### Credit Memo

Used for:

- returns;
- pricing corrections;
- service recovery;
- invoice adjustments.

### Expense

Deferred from V1. Nexora does not model accounts payable or employee expense management in the canonical implementation.

### Bank Transaction / Reconciliation

Incoming bank transactions drive the reconciliation workspace.

Possible reconciliation states:

```text
Unmatched
Suggested
Matched
Needs Review
Ignored
```

The canonical model is defined in Part II, Section 66.

## Finance dashboard metrics

Examples:

- total receivables;
- overdue receivables;
- cash collected this month;
- DSO;
- disputed balance;
- invoices due this week;
- payment trend;
- aging buckets.

## Custom UI opportunities

### Payment reconciliation workspace

Left side:

- incoming payments.

Right side:

- possible invoice matches.

Center/actions:

- suggested matches;
- difference amounts;
- confidence indicators.

This is an excellent dense interface for advanced library usage.

---

# 14. Customer Support

Support adds communication-heavy workflows and provides a different density profile from ERP tables.

## Core entities

### Support Ticket

Fields:

- ticket number;
- customer;
- contact;
- subject;
- description;
- channel;
- category;
- priority;
- status;
- assigned team;
- assignee;
- SLA policy;
- first response due;
- resolution due;
- tags;
- related order;
- related invoice;
- related product.

Priorities:

```text
Low
Normal
High
Urgent
```

Statuses:

```text
New
Open
Pending Customer
Pending Internal
Escalated
Resolved
Closed
```

Channels:

```text
Email
Phone
Portal
Chat
Internal
```

### Conversation Message

Represents support thread messages.

### SLA Event

Tracks:

- first response;
- pause;
- resume;
- breach;
- resolution.

### Support Macro

Reusable agent response/action bundle.

## UI implications

Support enables:

- inbox patterns;
- split panes;
- conversation threads;
- keyboard-heavy navigation;
- SLA timers;
- assignment controls;
- priority indicators;
- customer sidebars;
- related-record linking.

---

# 15. Workflow & Automation

This module exists partly because a serious operations product commonly needs automation and partly because it creates highly non-standard UI challenges.

## Core entities

### Workflow

Fields:

- id;
- name;
- description;
- status;
- trigger;
- conditions;
- actions;
- owner — the person the workflow answers to, told when a run stops it; a holder of `workflows.view`;
- created date;
- last modified;
- last run;
- run count.

Statuses:

```text
Draft
Active
Paused
Error
Archived
```

### Trigger

Examples:

```text
Order created
Order value changed
Invoice overdue
Inventory below threshold
Ticket escalated
Customer status changed
Scheduled time
```

### Condition

Supports nested boolean logic.

Example:

```text
IF
  customer.segment = "Enterprise"
AND
  order.total > 50000
AND
  customer.creditRisk != "High"
THEN
  requireApproval("Finance Manager")
```

### Action

Examples:

- assign user;
- create task;
- send notification;
- require approval;
- change status;
- add tag;
- create purchase request;
- place account on hold.

## Flagship interfaces

### Rule Builder

Nested AND/OR groups with editable operands and operators.

### Workflow Designer

Node-based or structured-flow editing interface.

### Execution History

Runs, status, duration, failure reason, affected record, timestamps.

These screens should strongly test composition primitives, popovers, menus, drag-and-drop boundaries, overlays, keyboard navigation, validation, and responsive behavior.

---

# 16. Analytics & Reporting

Analytics should combine executive, operational, and diagnostic views.

## Report types

### Executive

- revenue;
- gross margin;
- order growth;
- customer concentration;
- receivables;
- inventory value;
- service performance.

### Sales

- revenue by account;
- revenue by product;
- conversion rate;
- average order value;
- order cycle time;
- discount rate;
- rep performance.

### Inventory

- stock valuation;
- inventory turns;
- aged inventory;
- stockout frequency;
- warehouse utilization;
- transfer volume.

### Procurement

- supplier spend;
- on-time delivery;
- lead-time trend;
- purchase price variance.

### Finance

- receivable aging;
- overdue trend;
- collections;
- DSO;
- payment method mix.

### Support

- ticket volume;
- first-response SLA;
- resolution time;
- backlog;
- CSAT;
- escalation rate.

## UI implications

Analytics should include:

- KPI cards;
- comparison periods;
- charts;
- tables beneath charts;
- date controls;
- segment filters;
- drill-down;
- downloadable reports;
- annotations;
- anomaly callouts.

The visualizations should never exist solely as decoration. Every chart should answer a plausible business question.

---

# 17. Activity, Audit & Notifications

These cross-cutting entities make the app feel alive.

## Activity Event

An application-facing event stream.

Examples:

- order approved;
- note added;
- payment received;
- ticket escalated;
- shipment delayed;
- customer put on hold.

Activity events may be shown in:

- customer detail;
- order detail;
- global activity;
- dashboards;
- user profiles.

## Audit Event

A compliance-oriented immutable record.

Fields:

- timestamp;
- actor;
- action;
- entity type;
- entity id;
- previous value;
- next value;
- IP/device metadata if useful;
- request correlation id.

The audit log should be more technical and structured than the activity feed.

## Notification

Types:

- informational;
- success;
- warning;
- action required.

Examples:

```text
Approval required for SO-2026-01842
Invoice INV-2026-02891 is 14 days overdue
Stock for MX-240 fell below safety level
Ticket TCK-10492 breached first-response SLA
```

Notifications should support:

- read/unread;
- archive;
- action links;
- notification center;
- user preferences.

---

# 18. Administration & Settings

Settings provide many smaller but important UI surfaces.

Suggested sections:

```text
Organization
Users
Teams
Roles & Permissions
Warehouses
Billing
Currencies
Tax settings
Order settings
Invoice settings
Notification preferences
Integrations
API keys
Feature flags
Audit
```

Settings backed by a Part II domain contract are interactive.

Settings without a V1 domain contract may be shown as read-only simulated configuration, but they MUST NOT introduce undeclared business behavior.

The important part is that settings remain coherent with the rest of the product.

---

# 19. Core Entity Relationships

The primary relationship graph should resemble:

```text
Organization
├── Users
├── Teams
├── Roles
│
├── Customers
│   ├── Contacts
│   ├── Addresses
│   ├── Quotes
│   ├── Sales Orders
│   │   ├── Order Lines ─────────── Products
│   │   ├── Shipments ──────────── Warehouses
│   │   ├── Returns
│   │   └── Invoices
│   │       └── Payments
│   ├── Support Tickets
│   ├── Notes
│   └── Activity
│
├── Products
│   ├── Categories
│   ├── Price Lists
│   ├── Inventory Balances ─────── Warehouses
│   ├── Stock Movements
│   └── Supplier Mappings ──────── Suppliers
│
├── Suppliers
│   └── Purchase Orders
│       └── Goods Receipts ─────── Warehouses
│
└── Workflows
    └── Workflow Runs
```

A strong rule for the demo:

> If two screens refer to the same business entity, they must resolve to the same underlying record rather than duplicate fixture data.

---

# 20. Canonical Business Journeys

Screens should be planned around journeys, not independently.

The following journeys are recommended as the product backbone.

## Journey A — Customer to Cash

```text
Dashboard
→ Customers
→ Customer 360
→ Create Quote
→ Send Quote
→ Convert Quote to Order
→ Approve Order
→ Allocate Inventory
→ Ship Order
→ Generate Invoice
→ Record Payment
→ Invoice Paid
```

This journey crosses:

- CRM;
- catalog;
- sales;
- inventory;
- finance;
- activity.

It should become the main vertical slice used to validate the architecture.

## Journey B — Inventory Replenishment

```text
Inventory Alert
→ Product
→ Inventory Detail
→ Review Demand
→ Create Purchase Order
→ Supplier Approval
→ Send PO
→ Receive Goods
→ Inventory Updated
→ Backordered Sales Orders Released
```

## Journey C — Finance Collection

```text
Finance Dashboard
→ Overdue Invoices
→ Customer
→ Invoice
→ Record Contact Attempt
→ Receive Payment
→ Reconcile Payment
→ Customer Balance Updated
```

## Journey D — Customer Support Escalation

```text
Support Inbox
→ Ticket
→ Customer Context
→ Related Order
→ Shipment Exception
→ Internal Escalation
→ Resolution
→ Customer Notification
→ Ticket Closed
```

## Journey E — Operational Approval

```text
Approval Queue
→ High-value Sales Order
→ Margin Review
→ Credit Review
→ Approve / Reject / Request Changes
→ Order Timeline Updated
```

## Journey F — Inventory Transfer

```text
Warehouse Dashboard
→ Low Stock
→ Check Other Warehouses
→ Create Transfer
→ Pick Transfer
→ Ship Transfer
→ Receive Transfer
→ Balances Updated
```

## Journey G — Automation

```text
Workflows
→ Create Workflow
→ Configure Trigger
→ Build Conditions
→ Add Actions
→ Validate
→ Activate
→ Trigger Run
→ Inspect Execution History
```

---

# 21. Screen Portfolio

The reference app should contain enough variety to stress the library, but the screen count itself is not a success metric.

A reasonable mature target is approximately 30–50 routes, built incrementally.

## Low-density screens

Examples:

- sign in;
- forgot password;
- invite acceptance;
- profile;
- simple preference settings;
- access denied;
- not found.

## Standard SaaS screens

Examples:

- executive dashboard;
- customer list;
- customer detail;
- product list;
- product detail;
- users;
- roles;
- invoices;
- notifications.

## Dense operational screens

Examples:

- sales order list;
- sales order workspace;
- inventory overview;
- warehouse operations;
- procurement queue;
- finance reconciliation;
- audit logs;
- support inbox.

## Highly interactive / non-standard screens

Examples:

- workflow designer;
- rule builder;
- CSV import mapper;
- permission matrix;
- warehouse capacity visualization;
- inventory allocation inspector;
- reconciliation workspace;
- scheduling / dispatch board if introduced later.

These highly interactive interfaces are important because they expose limitations that simple CRUD screens often hide.

---

# 22. Data Strategy

The demo data should have three layers.

## 22.1 Curated flagship records

A small number of records should be manually authored.

These are the records most likely to appear in screenshots, documentation, demos, and guided flows.

They should have:

- believable company names;
- coherent commercial history;
- meaningful notes;
- intentional status combinations;
- realistic monetary values;
- related orders, invoices, support tickets, and activities.

Example:

```text
Customer: Meridian Controls Group
Segment: Enterprise
Customer since: 2019
Lifetime value: $3.84M
Open balance: $284,930
Credit limit: $500,000
Orders in last 12 months: 187
Average order value: $20,534
Account health: At Risk
```

A flagship record should tell a story.

## 22.2 Generated volume

High-volume records should be generated deterministically.

Approximate mature dataset:

```text
Organizations                 1 active tenant
Users                         320 employees / ~170 active app users
Customers                     4,800
Contacts                      11,000+
Suppliers                     1,200
Products / SKUs               18,000
Warehouses                    5
Sales Orders                  80,000+
Sales Order Lines             250,000+
Stock Movements               600,000+
Purchase Orders               15,000+
Invoices                      45,000+
Payments                      35,000+
Support Tickets               20,000+
Activity Events               high volume / generated
Audit Events                  high volume / generated
```

The browser does not necessarily need every record materialized in memory at once.

The backend simulation may generate, paginate, index, or lazily materialize data as needed.

## 22.3 Purpose-built edge cases

Create records specifically designed to test UI robustness.

Examples:

- extremely long customer name;
- missing avatar;
- missing phone number;
- missing shipping address;
- order with one line;
- order with 148 lines;
- zero-value invoice;
- unusually large invoice;
- very long internal note;
- discontinued product still referenced by historical orders;
- customer with several addresses;
- partially paid invoice;
- order split across multiple shipments;
- stock unavailable in primary warehouse;
- multi-currency supplier order;
- support ticket with a long conversation;
- user with minimal permissions.

These cases must be intentional and discoverable.

---

# 23. Realistic Data Distribution

Randomness alone is not realism.

Generated data must follow plausible distributions.

For example, order statuses should not be uniformly distributed.

Illustrative distribution:

```text
Fulfilled / Delivered       48%
Shipped                     13%
Processing                  11%
Pending Approval             7%
Awaiting Payment             6%
Partially Fulfilled          5%
Cancelled                    4%
Draft                        3%
On Hold                      2%
Returned                     1%
```

Similar weighted distributions should exist for:

- ticket priorities;
- invoice states;
- customer segments;
- account health;
- supplier performance;
- stock risk;
- purchase-order delays;
- discount levels;
- order values;
- product popularity;
- payment methods.

Commercial data should also follow realistic skew.

Examples:

- a small number of customers generate a large share of revenue;
- most products have low or moderate movement;
- a small percentage of SKUs generate most order lines;
- high-value orders are rare;
- urgent support tickets are uncommon;
- overdue invoices cluster in a minority of customers.

This makes dashboards and reports feel significantly more credible.

---

# 24. Deterministic Generation

Demo data must be deterministic.

Conceptually:

```ts
createNexoraDatabase({
  seed: 'nexora-v1',
});
```

The same seed should produce the same:

- customer names;
- orders;
- dates;
- values;
- relationships;
- dashboard metrics;
- screenshots.

This is essential for:

- visual regression testing;
- documentation screenshots;
- debugging;
- stable demos;
- reproducible issues.

Different datasets may use named seeds or scenario overlays:

```text
nexora-v1
nexora-enterprise
nexora-new-tenant
nexora-heavy-data
```

---

# 25. Demo Clock

The application should not depend directly on the machine's current date for business data.

Introduce a demo clock:

```ts
demoClock.now();
```

instead of using `new Date()` throughout domain behavior.

Benefits:

- deterministic relative dates;
- stable screenshots;
- predictable overdue calculations;
- stable “today”, “yesterday”, and “due in N days” labels;
- reproducible scenario testing.

The default scenario can move the demo clock to the current release reference date when desired, but all related records should remain internally consistent.

---

# 26. Scenario Engine

A scenario engine is strongly recommended.

A scenario is a deterministic overlay that changes the state of the simulated company.

Possible scenarios:

```text
Healthy Operations
New Tenant
Enterprise Scale
Heavy Data
Month End
Inventory Crisis
Collections Pressure
Restricted User
Support Incident
System Degraded
```

## Example: Month End

Effects may include:

- more invoices due;
- higher reconciliation volume;
- pending expense approvals;
- increased finance notifications;
- elevated collection activity.

## Example: Inventory Crisis

Effects:

- 42 products below safety stock;
- 17 customer orders delayed;
- 8 urgent purchase orders;
- 3 warehouses affected;
- several backorders;
- procurement and warehouse alerts.

## Example: Restricted User

The signed-in user may be a warehouse operator with:

- no finance access;
- limited customer information;
- inventory adjustment permission;
- shipment workflow access;
- no role-management access.

## Example: System Degraded

Simulate:

- elevated latency;
- one failing endpoint;
- partial dashboard data;
- retryable request errors.

Scenarios are valuable both for product demos and for validating component states.

---

# 27. Simulated Backend

The UI should interact with a fake backend rather than importing fixture arrays directly.

Conceptual architecture:

```text
Reference UI
     |
     v
Application data/query layer
     |
     v
API client
     |
     v
Nexora simulated API
     |
     v
Demo database
```

Recommended backend capabilities:

- pagination;
- sorting;
- filtering;
- full-text search;
- saved views;
- mutations;
- validation;
- authorization;
- optimistic-operation support where appropriate;
- latency simulation;
- conflict responses;
- partial failures;
- server errors;
- audit-event generation;
- activity-event generation.

Example endpoints:

```http
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
POST   /api/orders/:id/approve
POST   /api/orders/:id/cancel

GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices/:id/send

POST   /api/payments
GET    /api/inventory
POST   /api/inventory/transfers

GET    /api/support/tickets
PATCH  /api/support/tickets/:id
```

Exact transport is an implementation detail.

MSW is a reasonable option, but the domain model should not depend on MSW specifically.

---

# 28. Backend Error Semantics

The fake backend should expose realistic error categories.

Examples:

### Validation

```http
422 Unprocessable Entity
```

Examples:

- missing required billing address;
- invalid requested quantity;
- quote expiration before creation date.

### Conflict

```http
409 Conflict
```

Examples:

- inventory changed before allocation;
- order already approved;
- invoice already paid;
- stale edit.

### Permission

```http
403 Forbidden
```

Examples:

- warehouse operator attempts to void invoice;
- salesperson attempts to manage users.

### Not found

```http
404 Not Found
```

Useful for stale links and deleted/archived entities.

### Server / degraded dependency

```http
500 Internal Server Error
503 Service Unavailable
```

Used only in explicit scenarios or controlled failure simulation.

---

# 29. Persistence

The simulated app should persist mutations within a browsing session and ideally across reloads.

Preferred model:

```text
Seed
  |
  v
Local persisted demo database
  |
  v
Simulated API
  |
  v
Reference app
```

IndexedDB is a strong default for browser-local persistence.

The application should expose an explicit:

```text
Reset demo data
```

action.

This allows the product to feel stateful without requiring a real backend.

---

# 30. Cross-Domain Side Effects

Important actions should update related entities.

Examples:

## Record payment

```text
Payment created
→ Invoice paid amount updated
→ Invoice outstanding amount updated
→ Invoice status recalculated
→ Customer open balance updated
→ Customer activity created
→ Finance dashboard changes
→ Audit event created
```

## Receive purchase order

```text
Goods receipt created
→ Purchase order received quantity updated
→ Inventory balance increases
→ Stock movement created
→ Product availability changes
→ Backordered order may become allocatable
→ Procurement metrics update
```

## Cancel sales order

```text
Order cancelled
→ Reserved inventory released
→ Allocation records updated
→ Customer activity created
→ Related workflow runs may be cancelled
→ Audit event created
```

The simulation does not need enterprise-grade transactional infrastructure, but the visible consequences should be coherent.

---

# 31. Human Imperfections in Data

A controlled amount of messy data should exist.

Examples:

```text
Asteron Power Systems
ASTERON POWER SYSTEMS LLC
Asteron Power Sys.
```

Contact data may contain:

- missing mobile numbers;
- secondary emails;
- outdated titles;
- inactive contacts.

Addresses may contain:

- separate billing and shipping addresses;
- warehouse-specific delivery instructions;
- incomplete optional fields.

Operational data may contain:

- legacy SKU aliases;
- manual notes;
- unusual customer PO references;
- discontinued items in historical transactions;
- duplicate external references.

The purpose is not to create bad data everywhere. The purpose is to avoid a sterile demo where every record looks machine-generated.

---

# 32. Microcopy Requirements

Avoid placeholder or demo-oriented text.

Do not use:

```text
Example user
Card title
Lorem ipsum
Item 1
Test customer
Sample order
```

Use domain-specific language.

Examples:

```text
Revenue at risk

$284,921
Across 12 accounts

4 accounts require attention
```

```text
Unable to reserve 14 units

Chicago Central currently has only 8 available units of
Servo Motor MX-240.

6 additional units are expected on Sep 8.
```

```text
Approval required

This order is 14.8% below target margin and exceeds the
sales representative's $25,000 approval threshold.
```

Good microcopy materially improves perceived realism.

---

# 33. Application State Coverage

Important screens should support relevant variants of:

- default;
- loading;
- delayed loading;
- refreshing;
- empty;
- filtered empty;
- partial data;
- error;
- retry;
- stale data;
- disabled;
- read-only;
- permission denied;
- archived;
- destructive confirmation;
- success;
- partial success;
- optimistic mutation;
- mutation rollback.

These states should emerge naturally from scenarios and backend behavior rather than existing only as isolated Storybook stories.

---

# 34. High-Value Flagship Screens

The following screens should receive disproportionate design attention because they demonstrate the product and the library particularly well.

## 34.1 Executive Dashboard

Should answer:

- How is the business performing?
- What changed?
- What needs attention?

Potential sections:

- revenue;
- gross margin;
- orders;
- average order value;
- cash collected;
- overdue receivables;
- inventory risk;
- operational alerts;
- trend charts;
- top customers;
- recent activity.

## 34.2 Customer 360

Should combine:

- customer header;
- account health;
- financial exposure;
- revenue trend;
- contacts;
- recent orders;
- invoices;
- support tickets;
- activity;
- notes;
- commercial terms.

## 34.3 Sales Order Workspace

Should include:

- order header;
- customer;
- financial summary;
- approval state;
- payment state;
- fulfillment state;
- editable line items where appropriate;
- inventory availability;
- shipments;
- invoices;
- notes;
- audit/activity timeline.

This is one of the primary dense-screen benchmarks.

## 34.4 Inventory Operations

Should combine:

- warehouse-level metrics;
- low-stock exceptions;
- stock movement;
- allocation pressure;
- transfers;
- capacity visualization;
- replenishment actions.

## 34.5 Finance Reconciliation

Should be a dense operational workspace rather than a standard table.

## 34.6 Support Inbox

Suggested layout:

```text
Ticket list
    |
    v
Conversation
    |
    v
Customer / order / SLA context
```

This tests split panes, sticky regions, scroll boundaries, actions, and dense contextual information.

## 34.7 Rule Builder

A strong custom UI benchmark.

## 34.8 Import Mapper

Example:

```text
CSV Column              Nexora Field

Customer ID      →      External ID
Company          →      Company Name
E-mail           →      Primary Email
Billing Address  →      Billing Address
```

Validation summary:

```text
18,428 valid rows
382 warnings
42 errors
```

This screen tests mapping controls, tables, validation, preview, status messaging, progress, and bulk operations.

---

# 35. Navigation Model

Suggested top-level navigation:

```text
Home
CRM
Sales
Inventory
Procurement
Finance
Support
Analytics
Automations
```

Secondary/global areas:

```text
Search
Command Palette
Notifications
Tasks / Approvals
Help
Settings
User Menu
```

The exact navigation structure should remain flexible.

The important property is that the product should support:

- direct module navigation;
- cross-entity contextual links;
- breadcrumbs where useful;
- recent items;
- global search;
- deep links;
- entity IDs visible in operational contexts.

---

# 36. Search

A realistic global search can become a strong library showcase.

Possible searchable entities:

- customers;
- contacts;
- orders;
- invoices;
- products;
- suppliers;
- purchase orders;
- tickets.

Example query:

```text
meridian
```

Results:

```text
Customer
Meridian Controls Group

Order
SO-2026-01842 · Meridian Controls Group

Invoice
INV-2026-02891 · Meridian Controls Group

Ticket
TCK-10492 · Shipment delay
```

Search should support keyboard navigation and entity-type grouping.

---

# 37. Command Palette

The command palette should mix navigation and actions.

Examples:

```text
Go to Customers
Create customer
Create sales order
Open approval queue
Search invoices
Switch warehouse
Open notifications
Change demo scenario
```

Context-sensitive commands may be added later.

---

# 38. Saved Views and Filters

Dense business tables should support realistic persistent view concepts.

A view may store:

- filters;
- sorting;
- visible columns;
- column order;
- grouping;
- density;
- page size where relevant.

Example saved views for Orders:

```text
My Open Orders
Pending Approval
At Risk
Delayed Fulfillment
High Value
Created This Week
```

This provides meaningful coverage for:

- filters;
- popovers;
- chips;
- menus;
- dialogs;
- tables;
- preference persistence.

---

# 39. Responsive Strategy

The reference app is primarily a desktop business application, but the library should not assume unlimited width.

Expected behavior:

### Desktop

Full feature set.

### Tablet

Core workflows remain usable, with reduced density and adaptive panels.

### Mobile

Not every complex workspace needs full parity.

At minimum:

- navigation;
- dashboards;
- entity summary pages;
- notifications;
- approvals;
- basic lookup;
- simple updates

should remain credible.

Extremely dense operational screens may use intentionally reduced mobile functionality.

This is preferable to pretending a warehouse reconciliation workspace naturally maps to a narrow phone screen.

---

# 40. Accessibility

The reference app should actively exercise accessibility behavior rather than only relying on component-level tests.

Important areas:

- keyboard navigation;
- focus management;
- dialogs and overlays;
- menus;
- grid/table interaction;
- form error association;
- status semantics;
- color-independent indicators;
- screen-reader labels;
- drag-and-drop alternatives;
- command palette;
- dense editable workspaces.

Complex screens are where accessibility gaps in primitives become visible.

---

# 41. UI Library Dogfooding Rules

The reference application is a real consumer of the library.

It may contain product-specific layout and styling, but it should not routinely bypass or patch the public component APIs.

When the app encounters a legitimate product requirement that the library cannot express cleanly, treat it as a design signal.

Typical discoveries may include:

- grouped sticky headers;
- virtualized overlays;
- complex field help + warning + validation;
- long tab sets;
- nested navigation;
- advanced table selection;
- dynamic form sections;
- large combobox datasets;
- overlay positioning in scroll containers;
- mixed read/edit modes.

The correct response is not always to expand the library. Some behavior belongs only to the product.

The reference app should help distinguish between:

1. reusable primitive capability;
2. framework adapter capability;
3. product-specific composition.

---

# 42. Framework Independence

Framework-specific code should begin as late as possible in the application architecture.

Shared definitions should include:

- entity types;
- permission keys;
- status vocabularies;
- generators;
- database;
- scenario definitions;
- API behavior;
- validation rules where practical;
- business calculations.

Framework clients should implement:

- routing;
- screen composition;
- framework forms/integration;
- local view state;
- component adapters;
- framework-specific data bindings.

This separation keeps the future Angular parity implementation feasible without forcing premature abstraction of actual product UI.

---

# 43. Optional Angular Parity Application

The Angular client should only be created after the canonical reference product is sufficiently stable.

Its purpose is to answer questions such as:

- Can the same workflows be implemented naturally in Angular?
- Are component APIs equivalent in capability?
- Are there framework-specific ergonomics problems?
- Do accessibility and interaction behaviors remain consistent?
- Can the same dense screens be expressed without adapter workarounds?

It does **not** need to reproduce every route immediately.

A good initial Angular parity slice would be:

```text
Application Shell
→ Dashboard
→ Customer List
→ Customer 360
→ Sales Order Workspace
→ Settings / Permission Matrix
```

This provides high signal without committing to maintaining every product screen twice.

If later there is value in full parity, the shared domain/backend architecture allows gradual expansion.

---

# 44. Implementation Sequence

## Phase 1 — Domain foundation

Define:

- domain vocabulary;
- entities;
- IDs;
- statuses;
- relationships;
- roles;
- permissions;
- default tenant;
- core navigation;
- business journey map.

Deliverable:

> A coherent domain that can be described without referring to UI components.

## Phase 2 — Vertical slice

Implement one end-to-end journey:

```text
Dashboard
→ Customers
→ Customer 360
→ Sales Orders
→ Sales Order
→ Invoice
→ Payment
```

It should already include:

- real relationships;
- mutations;
- loading;
- validation;
- permissions;
- activity;
- persistence.

This validates the architecture before breadth is added.

## Phase 3 — Data engine

Implement:

- deterministic generators;
- curated records;
- edge cases;
- scenario overlays;
- persistence;
- demo clock;
- realistic distributions.

## Phase 4 — Operational breadth

Add:

- inventory;
- procurement;
- finance;
- support;
- administration.

## Phase 5 — Advanced workspaces

Add the screens that most strongly stress the library:

- workflow/rule builder;
- import mapper;
- reconciliation;
- warehouse visualization;
- allocation inspector;
- permission matrix.

## Phase 6 — Framework parity validation

Build the selected Angular or React parity slice if the second framework is mature enough to justify it.

---

# 45. V1 Scope Recommendation

The V1 reference app does not need every conceptual module to be equally deep.

Recommended depth:

### Deep implementation

- application shell;
- dashboard;
- CRM;
- sales orders;
- inventory;
- finance;
- user/role administration.

### Medium implementation

- procurement;
- support;
- analytics;
- notifications;
- audit.

### Selective flagship implementation

- workflow/rule builder;
- CSV import mapper;
- reconciliation workspace;
- warehouse visualization.

This creates variety without forcing a complete ERP implementation.

---

# 46. Suggested V1 Flagship Records

A small set of named records should be intentionally authored and reused throughout the application.

Examples:

### Customers

- Meridian Controls Group
- Helios Manufacturing
- Northstar Process Systems
- Redline Packaging
- Cascade Energy Services
- Vantage Motion Labs

### Suppliers

- Arcwell Components
- Kestrel Automation
- Promethean Drives
- Vertex Sensor Technologies
- DeltaForge Industrial

### Products

- Servo Motor MX-240
- Inductive Sensor IS-18
- Variable Frequency Drive VX-7
- Safety Relay SR-420
- Industrial Controller IC-900

These records should have coherent histories and cross-module references.

Names can be revised later, but the principle should remain: flagship entities are curated, not randomly generated.

---

# 47. Example Cross-Module Story

A single customer story can demonstrate the intended level of realism.

## Meridian Controls Group

Meridian is an enterprise customer with high lifetime value but temporary operational risk.

Situation:

- annual revenue contribution is significant;
- one large invoice is overdue;
- a recent order is partially fulfilled;
- a key product is backordered;
- a support ticket is open about the delayed shipment;
- account health is marked `At Risk`;
- a finance manager has added a collection note;
- the sales representative has an upcoming renewal discussion.

Related records:

```text
Customer
Meridian Controls Group

Sales Order
SO-2026-01842
$86,420
Partially Fulfilled

Shipment
SHP-009841
In Transit

Invoice
INV-2026-02891
$41,860 outstanding
14 days overdue

Support Ticket
TCK-10492
High priority
Shipment delay

Product
Servo Motor MX-240
6 units backordered
```

The same story should be visible from multiple parts of Nexora.

That continuity is a key realism benchmark.

---

# 48. Product Realism Checklist

A feature is considered convincingly integrated when most relevant questions can be answered with real data.

For an Order:

- Who is the customer?
- Who owns the account?
- What was ordered?
- What does it cost?
- Is the pricing unusual?
- Is approval required?
- Is stock available?
- From which warehouse?
- Has anything shipped?
- Was the customer invoiced?
- Has the invoice been paid?
- Are there support issues?
- Who changed the order?
- What happens next?

If the application can answer those questions coherently across routes, it will feel substantially more real than a typical UI showcase.

---

# 49. Non-Goals

Nexora Operations is not intended to become:

- a complete accounting system;
- a legally compliant tax engine;
- a production warehouse management system;
- a real payment processor;
- a real CRM competitor;
- a full backend reference architecture;
- a second design system layered over the UI library.

Domain depth exists to create realistic UI requirements.

The simulation should stop where additional backend complexity no longer improves UI validation or product realism.

---

# 50. Success Criteria

The reference application succeeds when it demonstrates the following:

### Product coherence

Screens feel like parts of one product rather than independent examples.

### Data coherence

Records maintain consistent relationships across modules.

### Behavioral credibility

Actions visibly affect related parts of the application.

### UI breadth

The library is used across low-density, standard, dense, and highly custom product experiences.

### State coverage

The application naturally exercises loading, empty, error, permission, conflict, and degraded states.

### Framework neutrality

Business data and behavior are not coupled to the primary UI framework.

### Reproducibility

A known seed and scenario reproduce the same state.

### Demo credibility

A user unfamiliar with the repository can navigate the application and reasonably believe they are using a real operations platform.

---

# 51. Final Architectural Position

The recommended model is:

```text
                     Nexora Operations
                            |
          -----------------------------------------
          |                    |                  |
      Domain Model         Demo Data         Scenario Engine
          |                    |                  |
          ---------------- Simulated API ----------
                            |
                  Primary Reference Client
                            |
              UI Library Integration Surface
                            |
                  Optional Parity Client Later
```

The central product is **Nexora Operations itself**.

React and Angular are delivery clients.

The domain should not be duplicated for frameworks, and the reference application should not be designed twice.

The initial goal is to make one implementation excellent, credible, and structurally framework-independent.

Once that baseline is stable, a second framework client can be introduced selectively to validate parity without turning the project into two separate application-development efforts.

---

## Appendix A — Suggested Initial Route Map

This is a starting point rather than a locked contract.

```text
/
  dashboard

/crm
  customers
  customers/:customerId
  contacts

/sales
  quotes
  quotes/:quoteId
  orders
  orders/:orderId
  approvals

/catalog
  products
  products/:productId
  categories
  price-lists

/inventory
  overview
  products/:productId
  warehouses
  warehouses/:warehouseId
  transfers
  movements

/procurement
  suppliers
  suppliers/:supplierId
  purchase-orders
  purchase-orders/:purchaseOrderId
  receiving

/finance
  overview
  invoices
  invoices/:invoiceId
  payments
  reconciliation

/support
  inbox
  tickets/:ticketId

/analytics
  executive
  sales
  inventory
  finance
  support

/automations
  workflows
  workflows/:workflowId
  workflows/:workflowId/runs

/activity
/audit
/notifications

/settings
  organization
  users
  teams
  roles
  warehouses
  preferences
  integrations
```

---

## Appendix B — Recommended First Vertical Slice

The first implementation milestone should be narrow but deep.

```text
Application Shell
    |
Dashboard
    |
Customer List
    |
Customer 360
    |
Sales Order List
    |
Sales Order Workspace
    |
Invoice Detail
    |
Record Payment
```

Minimum behavior:

- shared seeded data;
- realistic pagination/filtering;
- permissions;
- at least one validation error path;
- at least one conflict/error path;
- related entity navigation;
- activity creation;
- persisted mutations;
- deterministic reset;
- demo clock;
- at least one loading state;
- at least one empty state;
- at least one restricted state.

If this slice feels like a real product, the rest of Nexora can grow from a solid foundation.

---

## Appendix C — Design Question for Every New Screen

Before adding a new screen, answer:

1. What business problem does this screen solve?
2. Which domain entities does it operate on?
3. Which user role primarily uses it?
4. What decisions does the user make here?
5. What data volume is realistic?
6. What can fail?
7. What permissions affect it?
8. What state changes can originate here?
9. Which other screens should reflect those changes?
10. Does this screen introduce a legitimate UI requirement not yet exercised elsewhere?

If these questions cannot be answered, the screen is probably being added as a component showcase rather than as part of the product.

---

# Part II — Normative Implementation Contract

# 52. Status, Precedence, and Normative Language

Part I describes the product intent, user experience, domain breadth, and reference-application strategy.

Part II is the **normative implementation contract** for the simulated Nexora backend and shared domain packages.

If Part I and Part II differ, **Part II takes precedence**.

The keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are used intentionally:

- **MUST / MUST NOT**: required for domain coherence;
- **SHOULD / SHOULD NOT**: recommended unless there is a concrete implementation reason not to;
- **MAY**: optional behavior.

The implementation goal is not to model every capability of a production ERP. It is to remove domain ambiguity for the capabilities Nexora does model.

A developer implementing the reference app should not need to invent:

- entity ownership;
- field semantics;
- status transitions;
- financial arithmetic;
- inventory arithmetic;
- approval thresholds;
- authorization semantics;
- cross-domain side effects;
- error semantics;
- seed relationships;
- KPI definitions.

Implementation details such as state-management library, router, query library, IndexedDB wrapper, and framework-specific form implementation remain intentionally open.

---

# 53. Canonical Technical Conventions

## 53.1 Tenant model

V1 contains exactly one seeded tenant:

```text
org_000001
Asteron Industrial Supply
```

All tenant-owned entities MUST contain:

```ts
organizationId: 'org_000001';
```

The domain MUST still treat `organizationId` as a required boundary so a future second tenant does not require redesign.

No API query may return records from a different tenant.

## 53.2 Internal IDs

Internal IDs are stable opaque strings with deterministic prefixes.

Format:

```text
<prefix>_<6-digit-sequence>
```

Examples:

```text
cus_000001
ord_018420
inv_028910
usr_000021
```

The internal ID is used for foreign keys and routes.

Human-readable business numbers are separate fields and MUST NOT be used as foreign keys.

Recommended prefixes:

| Entity                  | Prefix |
| ----------------------- | ------ |
| Organization            | `org`  |
| User                    | `usr`  |
| Team                    | `tem`  |
| Role                    | `rol`  |
| Role assignment         | `ras`  |
| Customer                | `cus`  |
| Contact                 | `con`  |
| Address                 | `adr`  |
| Customer note           | `nte`  |
| Product family          | `prd`  |
| SKU                     | `sku`  |
| Category                | `cat`  |
| Price list              | `prl`  |
| Price entry             | `pre`  |
| Contract price          | `ctp`  |
| Supplier                | `sup`  |
| Supplier SKU mapping    | `ssm`  |
| Quote                   | `qte`  |
| Quote line              | `qln`  |
| Sales order             | `ord`  |
| Sales order line        | `oln`  |
| Approval request        | `apr`  |
| Approval step           | `aps`  |
| Warehouse               | `wh`   |
| Warehouse location      | `loc`  |
| Inventory reservation   | `res`  |
| Stock movement          | `mov`  |
| Transfer                | `trf`  |
| Transfer line           | `trl`  |
| Cycle count             | `ccn`  |
| Shipment                | `shp`  |
| Shipment line           | `shl`  |
| Return                  | `rma`  |
| Return line             | `rml`  |
| Purchase order          | `po`   |
| Purchase order line     | `pol`  |
| Goods receipt           | `grc`  |
| Goods receipt line      | `grl`  |
| Invoice                 | `inv`  |
| Invoice line            | `inl`  |
| Payment                 | `pay`  |
| Payment allocation      | `pal`  |
| Credit memo             | `crm`  |
| Credit memo line        | `crl`  |
| Credit memo application | `cma`  |
| Refund                  | `rfd`  |
| Bank transaction        | `btx`  |
| Ticket                  | `tkt`  |
| Conversation message    | `msg`  |
| SLA event               | `sla`  |
| Support macro           | `mac`  |
| Workflow                | `wfl`  |
| Workflow run            | `wfr`  |
| Activity event          | `act`  |
| Audit event             | `aud`  |
| Notification            | `ntf`  |
| Saved view              | `svw`  |
| Import job              | `imp`  |
| Task                    | `tsk`  |

## 53.3 Human-readable numbers

Business numbers MUST be deterministic and unique inside the organization.

Formats:

```text
Customer            CUS-010428
Quote               Q-2026-004812
Sales order         SO-2026-01842
Shipment            SHP-009841
Return               RMA-001228
Purchase order      PO-2026-00731
Goods receipt       GR-004821
Invoice             INV-2026-02891
Payment             PAY-018921
Credit memo         CM-004291
Refund              RF-001442
Transfer            TR-003821
Cycle count         CC-001202
Support ticket      TCK-10492
```

Sequence allocation MUST be deterministic for seeded records.

Newly created records MUST continue from the seed's maximum sequence.

## 53.4 Entity metadata

All mutable aggregate roots MUST expose:

```ts
interface EntityMetadata {
  id: string;
  organizationId: string;
  createdAt: string; // UTC ISO-8601 instant
  createdBy: string; // user id or system actor id
  updatedAt: string; // UTC ISO-8601 instant
  updatedBy: string;
  version: number; // starts at 1, increments after every successful mutation
  archivedAt?: string;
}
```

Transactional records that are not archivable still carry the metadata except `archivedAt`.

## 53.5 Soft deletion and historical integrity

The following records are archivable rather than hard-deleted:

- users;
- teams;
- customers;
- contacts;
- addresses;
- products;
- SKUs;
- categories;
- price lists;
- suppliers;
- workflows;
- saved views.

The following records MUST NOT be deleted after creation:

- approved/confirmed orders;
- shipments;
- stock movements;
- purchase orders after approval;
- goods receipts;
- invoices after opening;
- posted payments;
- credit memos after opening;
- refunds after posting;
- audit events.

They are cancelled, voided, reversed, archived, or otherwise transitioned according to their domain rules.

## 53.6 Time

Persist timestamps as UTC ISO-8601 instants.

Persist business dates without time as:

```text
YYYY-MM-DD
```

The organization timezone is:

```text
America/Chicago
```

Warehouse-specific operational timestamps are displayed in each warehouse's configured timezone.

All relative business calculations MUST use `demoClock`.

The canonical V1 seed instant is:

```text
2026-09-04T15:00:00Z
```

The UI may expose a release/current-date scenario later, but tests and seeded screenshots MUST be reproducible against the canonical instant.

## 53.7 Currency and money

Supported currencies:

```ts
type CurrencyCode = 'USD' | 'EUR' | 'GBP';
```

USD is the organization reporting currency.

Money MUST NOT use binary floating-point arithmetic for domain calculations.

Canonical representation:

```ts
interface Money {
  currency: CurrencyCode;
  minor: number; // integer minor units; cents for USD/EUR/GBP
}
```

Example:

```ts
{ currency: "USD", minor: 8642000 } // $86,420.00
```

All aggregate monetary totals are rounded to minor units using **round-half-up**.

Percentage/rate calculations MUST use basis points:

```text
100 bps   = 1.00%
10000 bps = 100.00%
```

FX rates are stored as decimal strings with up to 8 fractional digits:

```ts
fxRateToUsd: '1.00000000';
```

A transaction's FX rate is snapshotted when the transaction becomes commercially committed:

- quote: when sent;
- sales order: when confirmed;
- purchase order: when sent;
- invoice: when opened;
- payment: when posted.

Historical transactions MUST NOT be recalculated when seed FX tables change.

V1 MUST NOT support cross-currency payment allocation. A payment and invoice must share the same currency.

## 53.8 Quantities

Quantities use decimal strings with at most 3 fractional digits:

```ts
type Quantity = string;
type SignedQuantity = string; // same precision rules, may be negative
```

Most seeded industrial SKUs use whole units.

Fractional quantities are allowed only when the SKU's unit of measure allows them.

Supported V1 units:

```text
EA   each
PK   pack
FT   foot
M    meter
KG   kilogram
```

Each SKU declares:

```ts
quantityPrecision: 0 | 1 | 2 | 3;
```

Domain commands MUST reject quantities with greater precision.

## 53.9 Address snapshots

Customers and suppliers own mutable address-book records.

Commercial transactions MUST store immutable address snapshots so historical documents do not change when an address is edited.

```ts
interface AddressSnapshot {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
}
```

## 53.10 Text and nullability

Required strings MUST be trimmed and non-empty.

Optional text uses `undefined`/missing field rather than empty string in the canonical domain representation.

UI forms may temporarily contain empty strings before validation.

## 53.11 Optimistic concurrency

Every aggregate mutation MUST provide the version the client last observed.

A stale version MUST fail with:

```text
409 CONFLICT
code = STALE_VERSION
```

No partial side effects may be persisted after a failed command.

---

# 54. Aggregate and Relationship Rules

## 54.1 Aggregate roots

The primary aggregate roots are:

- Organization;
- User;
- Team;
- Customer;
- Product;
- Supplier;
- Quote;
- SalesOrder;
- InventoryTransfer;
- CycleCount;
- Shipment;
- Return;
- PurchaseOrder;
- Invoice;
- Payment;
- CreditMemo;
- Refund;
- BankTransaction;
- SupportTicket;
- ApprovalRequest;
- Workflow;
- SavedView;
- ImportJob.

Child entities are mutated through their aggregate root unless explicitly exposed by a command endpoint.

Examples:

```text
SalesOrder -> SalesOrderLine
Shipment -> ShipmentLine
PurchaseOrder -> PurchaseOrderLine
Invoice -> InvoiceLine
SupportTicket -> ConversationMessage
```

## 54.2 Referential integrity

A foreign key MUST resolve to an entity in the same organization.

A transaction may reference an archived master-data record.

Archiving a customer, supplier, SKU, or user MUST NOT break historical records.

## 54.3 Cardinalities

Canonical cardinalities:

```text
Organization 1 -> many Users
Organization 1 -> many Teams
Organization 1 -> many Roles

Customer 1 -> many Contacts
Customer 1 -> many Addresses
Customer 1 -> many Quotes
Customer 1 -> many SalesOrders
Customer 1 -> many Invoices
Customer 1 -> many Payments
Customer 1 -> many SupportTickets
Customer 1 -> many CustomerNotes

Product 1 -> one-or-many SKUs
SKU many -> one Product
SKU many -> one Category
SKU many <-> many Suppliers through SupplierSkuMapping

Quote 1 -> one-or-many QuoteLines
Quote 0..1 -> 1 SalesOrder through conversion

SalesOrder 1 -> one-or-many SalesOrderLines
SalesOrder 1 -> zero-or-many InventoryReservations
SalesOrder 1 -> zero-or-many Shipments
SalesOrder 1 -> zero-or-many Invoices
SalesOrder 1 -> zero-or-many Returns

Warehouse 1 -> many WarehouseLocations
SKU + Warehouse -> one InventoryBalance projection

PurchaseOrder 1 -> one-or-many PurchaseOrderLines
PurchaseOrder 1 -> zero-or-many GoodsReceipts

Invoice 1 -> one-or-many InvoiceLines
Payment many <-> many Invoices through PaymentAllocation
CreditMemo many <-> many Invoices through CreditMemoApplication

SupportTicket 1 -> many ConversationMessages

ApprovalRequest many -> one target aggregate
Workflow 1 -> many WorkflowRuns
```

## 54.4 Snapshot fields

Transaction lines MUST snapshot commercially significant master-data values.

For example, an order line stores:

- `skuId`;
- `skuCode`;
- `description`;
- `unitOfMeasure`;
- `unitPrice`;
- `unitCost`;
- `taxRateBps`.

Changing the SKU description, price list, or current cost later MUST NOT rewrite existing transaction lines.

---

# 55. Organization, Identity, Authorization, and Demo Personas

## 55.1 User status

```ts
type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';
```

Only `active` users may act as the signed-in user.

A suspended/deactivated user remains visible in historical references.

## 55.2 Team membership

```ts
interface TeamMembership {
  teamId: string;
  userId: string;
  isLead: boolean;
}
```

A user may belong to multiple teams.

## 55.3 Authorization scopes

A granted permission may have one of these scopes:

```ts
type PermissionScope =
  | { type: 'all' }
  | { type: 'own' }
  | { type: 'team'; teamIds: string[] }
  | { type: 'warehouse'; warehouseIds: string[] };
```

The authorization service MUST evaluate both:

1. permission key;
2. resource scope.

UI hiding/disabling is not authorization. The simulated backend MUST perform the same check.

## 55.4 Canonical permission catalog

### Organization and identity

```text
organization.view
organization.edit
users.view
users.invite
users.edit
users.suspend
teams.view
teams.manage
roles.view
roles.manage
```

### CRM

```text
customers.view
customers.create
customers.edit
customers.archive
customers.export
customers.credit_view
customers.credit_edit
contacts.view
contacts.manage
notes.view
notes.create
notes.delete_own
```

### Catalog

```text
catalog.view
catalog.manage
pricing.view
pricing.manage
cost.view
```

### Sales

```text
quotes.view
quotes.create
quotes.edit
quotes.send
quotes.approve
quotes.convert

orders.view
orders.create
orders.edit_draft
orders.edit_confirmed
orders.submit
orders.approve
orders.hold
orders.release_hold
orders.cancel
orders.override_price
orders.export
```

### Inventory and fulfillment

```text
inventory.view
inventory.allocate
inventory.deallocate
inventory.adjust
inventory.transfer
inventory.cycle_count
shipments.view
shipments.create
shipments.pick
shipments.pack
shipments.ship
shipments.mark_delivered
returns.view
returns.create
returns.authorize
returns.receive
returns.inspect
```

### Procurement

```text
suppliers.view
suppliers.manage
purchase_orders.view
purchase_orders.create
purchase_orders.edit
purchase_orders.submit
purchase_orders.approve
purchase_orders.send
purchase_orders.cancel
receipts.view
receipts.create
```

### Finance

```text
finance.dashboard
invoices.view
invoices.create
invoices.edit_draft
invoices.open
invoices.send
invoices.void
invoices.write_off
payments.view
payments.record
payments.reverse
credit_memos.view
credit_memos.create
credit_memos.open
refunds.create
reconciliation.view
reconciliation.manage
```

### Support

```text
support.view
support.create
support.reply
support.assign
support.change_status
support.escalate
support.manage
```

### Workflow and administration

```text
workflows.view
workflows.create
workflows.edit
workflows.activate
workflows.archive
analytics.view
audit.view
audit.export
notifications.manage_own
saved_views.manage_own
imports.run
```

## 55.5 Canonical demo roles

### Administrator

All permissions, all scopes.

### Executive

Read-only access to all business data plus:

```text
analytics.view
finance.dashboard
audit.view
```

No destructive or mutation permissions except personal notification/view preferences.

### Sales Manager

All CRM read/write, pricing view, quote/order creation and management, sales approvals, inventory view, shipment view, invoice view, support view, analytics view.

Scope: all customer and sales records.

### Sales Representative

```text
customers.view
customers.create
customers.edit
customers.credit_view
contacts.view
contacts.manage
notes.view
notes.create
catalog.view
pricing.view
quotes.view
quotes.create
quotes.edit
quotes.send
quotes.convert
orders.view
orders.create
orders.edit_draft
orders.submit
inventory.view
shipments.view
invoices.view
support.view
analytics.view
saved_views.manage_own
```

Mutation scope: own customers/orders/quotes or assigned sales team.

Read scope: all customers and orders.

### Finance Manager

Finance permissions, customer credit permissions, order approval/hold/release permissions, invoice/payment/credit/refund/reconciliation permissions, analytics and audit view.

### Accountant

Invoice/payment/reconciliation operational permissions, but:

- cannot edit credit limits;
- cannot approve high-value sales orders;
- write-off authority limited by the policy in Finance.

### Procurement Manager

Supplier management, purchase-order management/approval, inventory view, receipt view, analytics.

### Buyer

Supplier view, PO create/edit/submit/send, receipt view, inventory view.

Cannot approve their own PO when approval is required.

### Warehouse Manager

Inventory, transfer, cycle-count, shipment, return-receipt permissions for assigned warehouses.

### Warehouse Operator

Inventory view, shipment pick/pack/ship, receipt create, return receive, cycle-count entry for assigned warehouses.

Cannot perform manual stock adjustments unless a Warehouse Manager grants the explicit `inventory.adjust` permission in the Restricted User scenario.

### Support Manager

All support permissions, customer read, order/invoice/product view, analytics.

### Support Agent

Support operational permissions, customer/contact read, related order/invoice/product read.

### Auditor

Read-only access to all modules and audit export.

## 55.6 Demo personas

The seeded environment MUST include at least these switchable personas:

| Persona       | Role                 | Primary context               |
| ------------- | -------------------- | ----------------------------- |
| Maya Chen     | Administrator        | System administration         |
| Evan Brooks   | Executive            | Executive dashboards          |
| Sofia Ramirez | Sales Manager        | Sales approvals and portfolio |
| Noah Bennett  | Sales Representative | Customer/order workflow       |
| Priya Shah    | Finance Manager      | AR and credit                 |
| Marcus Lee    | Buyer                | Procurement                   |
| Jordan Wells  | Warehouse Operator   | Chicago warehouse             |
| Aisha Grant   | Support Agent        | Support inbox                 |
| Owen Price    | Auditor              | Read-only/audit               |

The default signed-in persona is:

```text
Sofia Ramirez — Sales Manager
```

A stand-in persona covers a role, or a decision, the table leaves to no one. `procurement-lead` is the Procurement team's own active Procurement Manager, offered so a purchase order that waits on that role (§65.5) can be approved in the demo. `finance-controller` is the Finance team's other active Finance Manager: Priya Shah asks for a write-off above $5,000 (§66.5) and a requester never decides it (§67.4), so the step is assigned to the controller. `staff-accountant` is the Finance team's own active Accountant, whose write-off authority stops at $500 (§66.5). `support-lead` is the Support team's own active Support Manager: an escalation names no manager by default and goes to them, and only a Support Manager reopens a ticket past the seven-day window or from `closed` (§68.5). Each is a seeded user rather than a new one, never one of the nine personas; a stand-in creates no user and draws nothing from the seed's random sequence, and a scale whose team holds no such user offers none.

---

# 56. CRM Domain Contract

## 56.1 Customer

Canonical shape:

```ts
interface Customer {
  id: string;
  organizationId: string;
  accountNumber: string;
  legalName: string;
  displayName: string;
  status: CustomerStatus;
  segment: CustomerSegment;
  industry: string;
  employeeBand?: string;
  website?: string;
  primaryContactId?: string;
  accountOwnerId: string;
  salesTeamId: string;
  billingAddressId?: string;
  defaultShippingAddressId?: string;
  paymentTermsCode: PaymentTermsCode;
  creditLimit: Money;
  priceListId: string;
  taxProfile: TaxProfile;
  preferredCurrency: CurrencyCode;
  customerSince?: string;
  annualRevenueEstimate?: Money;
  health: CustomerHealth;
  tags: string[];
  metadata: EntityMetadata;
}
```

Customer status:

```ts
type CustomerStatus = 'prospect' | 'active' | 'on_hold' | 'inactive' | 'closed';
```

Customer health is independent from account status:

```ts
type CustomerHealth = 'healthy' | 'watch' | 'at_risk';
```

This replaces the earlier use of `At Risk` as an account status.

## 56.2 Customer rules

- `prospect` customers may receive quotes but not confirmed sales orders.
- converting the first accepted quote to a confirmed order MAY automatically activate the customer;
- `on_hold` customers may be viewed and quoted but new orders cannot be confirmed without Finance Manager override;
- `inactive` customers cannot receive new quotes/orders unless reactivated;
- `closed` is terminal for normal UI operations;
- `creditLimit.currency` MUST be USD in V1;
- account numbers are immutable after creation.

## 56.3 Derived customer financial fields

These values are projections, not directly editable fields:

```text
grossReceivables
unappliedCredit
netReceivables
openOrderExposure
creditExposure
creditUtilizationBps
lifetimeRevenue
ordersLast12Months
averageOrderValueLast12Months
```

Definitions:

```text
grossReceivables =
  sum(outstanding amount of all open customer invoices)

unappliedCredit =
  unapplied posted payments
  + unapplied open credit memos

netReceivables =
  max(0, grossReceivables - unappliedCredit)

openOrderExposure =
  remaining uninvoiced value of orders whose approval is satisfied
  and whose status is confirmed or on_hold

creditExposure =
  grossReceivables + openOrderExposure

creditUtilizationBps =
  creditLimit == 0
    ? 10000 when creditExposure > 0 else 0
    : round(creditExposure / creditLimit * 10000)
```

## 56.4 Contact

Contact status:

```text
active
inactive
```

A customer may have zero active contacts.

Only one contact per customer may have `isPrimary = true`.

Setting a new primary contact MUST clear the previous primary flag atomically.

## 56.5 Notes

Customer notes are internal.

Visibility:

```text
organization
team
private
```

Private notes are visible only to the author.

Team notes are visible to members of the author's selected team plus administrators.

---

# 57. Catalog, SKU, Pricing, Cost, and Tax

## 57.1 Product family and SKU

Implementation MUST use a two-level model:

```text
Product = commercial family
SKU     = mandatory sellable/stocked unit
```

Every Product MUST own at least one SKU.

Order, quote, inventory, supplier mapping, shipment, receipt, and invoice lines MUST reference `skuId`, not `productId`.

The displayed “18,000 products / SKUs” scale refers to SKUs.

## 57.2 Product

```ts
interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  brand?: string;
  manufacturer?: string;
  status: 'draft' | 'active' | 'discontinued';
  tags: string[];
  metadata: EntityMetadata;
}
```

## 57.3 SKU

```ts
interface Sku {
  id: string;
  productId: string;
  sku: string;
  manufacturerPartNumber?: string;
  variantLabel?: string;
  status: 'active' | 'restricted' | 'discontinued';
  unitOfMeasure: 'EA' | 'PK' | 'FT' | 'M' | 'KG';
  quantityPrecision: 0 | 1 | 2 | 3;
  barcode?: string;
  weightGrams?: number;
  dimensionsMm?: { length: number; width: number; height: number };
  taxClass: 'standard' | 'reduced' | 'exempt';
  standardCost: Money;
  leadTimeDays: number;
  reorderPolicy: ReorderPolicy;
  preferredSupplierId?: string;
  metadata: EntityMetadata;
}
```

A discontinued SKU remains visible on historical transactions and cannot be added to a new quote, order, or PO.

`backordered` is **not** a master-data status. It is a derived availability condition:

```text
backordered when open demand > immediately allocatable available quantity
```

A `restricted` SKU is visible but cannot be added to a new commercial transaction in V1. No V1 override permission exists for restricted SKUs.

## 57.4 Reorder policy

```ts
interface ReorderPolicy {
  mode: 'min_max' | 'manual';
  reorderPoint?: Quantity;
  safetyStock?: Quantity;
  maxStock?: Quantity;
}
```

For `min_max`:

```text
inventoryPosition = available + inbound

reorderSuggested when:
inventoryPosition <= reorderPoint

suggestedQuantity =
max(0, maxStock - inventoryPosition)
```

## 57.5 Price lists

```ts
interface PriceList {
  id: string;
  name: string;
  currency: CurrencyCode;
  status: 'active' | 'inactive';
}

interface PriceListEntry {
  priceListId: string;
  skuId: string;
  unitPrice: Money;
  validFrom: string;
  validTo?: string;
}
```

A customer has one default price list.

V1 pricing priority:

```text
1. active customer contract price
2. customer's default price-list entry
3. Standard price-list entry
```

If no price exists, the SKU cannot be added to a quote/order.

## 57.6 Contract price

```ts
interface ContractPrice {
  customerId: string;
  skuId: string;
  unitPrice: Money;
  validFrom: string;
  validTo: string;
  minimumQuantity?: Quantity;
}
```

## 57.7 Line pricing

For a sales line:

```text
gross = quantity * listUnitPrice
discount = gross * discountBps / 10000
net = gross - discount
taxableBase = net
tax = taxableBase * taxRateBps / 10000
lineTotal = net + tax
```

Each intermediate monetary result is rounded half-up to minor units at the line level.

`unitCost` is snapshotted from SKU standard cost when the line is created or repriced.

```text
lineGrossMargin = net - extendedCost
grossMarginBps =
  net == 0 ? 0 : round(lineGrossMargin / net * 10000)
```

Freight is an order/quote/invoice-level amount and is taxable only when the seeded tax profile explicitly marks freight taxable.

## 57.8 Simplified tax model

Nexora is not a legal tax engine.

```ts
interface TaxProfile {
  type: 'taxable' | 'exempt';
  exemptionReason?: string;
}
```

V1 sales tax is determined by the shipping address region using a deterministic seed table.

Example seed rates:

```text
IL  825 bps
TX  625 bps
GA  700 bps
CO  290 bps
NJ  662 bps
other supported US states 500 bps default demo rate
```

Tax-exempt customers use `0 bps`.

The selected tax rate is snapshotted on each commercial line.

---

# 58. Quote Domain Contract

## 58.1 Quote state

Commercial status:

```ts
type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'cancelled';
```

`viewed` is optional simulated customer behavior after `sent`.

## 58.2 Quote invariants

A quote MUST:

- have one customer;
- have one active contact or an explicit billing/contact fallback;
- contain at least one line before submission/sending;
- use one currency across all lines;
- have `expirationDate >= createdBusinessDate`;
- have positive quantities;
- contain no discontinued SKU;
- contain no line with negative net value.

## 58.3 Quote approval policy

Approval thresholds use **commercial value excluding tax**:

```text
approvalValue = subtotal - discount + freight
```

Approval is required when any condition is true:

```text
quote approvalValue >= $50,000 USD equivalent
OR any line discount >= 15%
OR quote gross margin < 20%
```

Required approval:

```text
$50,000–$99,999.99     Sales Manager
>= $100,000            Sales Manager + Finance Manager
margin < 20%           Sales Manager
margin < 15%           Finance Manager also required
discount >= 15%        Sales Manager
discount >= 25%        Finance Manager also required
```

A user MUST NOT approve their own quote when they are the quote owner.

## 58.4 Quote operations

### Create quote

Allowed customer statuses:

```text
prospect
active
on_hold
```

Creates a `draft`.

### Edit quote

Allowed only in:

```text
draft
pending_approval after approval was returned for changes
approved before sent
```

Editing price-sensitive data after approval invalidates approval and returns the quote to `pending_approval` if approval is required.

### Submit for approval

`draft -> pending_approval`

If no approval is required:

```text
draft -> approved
```

### Approve

When all required approval steps are approved:

```text
pending_approval -> approved
```

### Reject

```text
pending_approval -> rejected
```

A rejection requires a reason.

### Send

Allowed from:

```text
approved
```

or directly from `draft` if no approval is required.

Transition:

```text
approved -> sent
```

### Mark viewed

Simulated external event:

```text
sent -> viewed
```

### Accept

Simulated external event:

```text
sent|viewed -> accepted
```

### Reject by customer

```text
sent|viewed -> rejected
```

### Expire

Derived/scheduled when:

```text
status in sent|viewed
AND demoClock.businessDate > expirationDate
```

### Convert to order

Allowed only from `accepted`.

Creates a SalesOrder with snapshotted quote values.

```text
accepted -> converted
```

A quote may convert at most once.

---

# 59. Sales Order Domain Contract

## 59.1 State model

Sales order state is deliberately split into independent dimensions.

### Commercial status

```ts
type OrderStatus = 'draft' | 'pending_approval' | 'confirmed' | 'on_hold' | 'cancelled' | 'closed';
```

### Approval status

```ts
type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'cancelled';
```

### Allocation status — derived

```text
unallocated
partially_allocated
allocated
```

### Fulfillment status — derived

```text
unfulfilled
partially_fulfilled
fulfilled
partially_returned
returned
```

### Invoice status — derived

```text
not_invoiced
partially_invoiced
invoiced
```

### Payment status — derived from linked invoices

```text
not_invoiced
unpaid
partially_paid
paid
overdue
partially_refunded
refunded
```

Part I's linear `Draft -> Processing -> Partially Fulfilled -> Fulfilled` lifecycle is therefore descriptive only. The implementation MUST use these orthogonal state dimensions.

## 59.2 Sales order fields

```ts
interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  sourceQuoteId?: string;
  customerPoNumber?: string;
  contactId: string;
  ownerId: string;
  salesTeamId: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  defaultWarehouseId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
  currency: CurrencyCode;
  fxRateToUsd: string;
  paymentTermsCode: PaymentTermsCode;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  approvalRequestId?: string;
  holdReason?: string;
  riskFlags: OrderRiskFlag[];
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  grossMargin: Money;
  grossMarginBps: number;
  metadata: EntityMetadata;
}
```

## 59.3 Order line fields

```ts
interface SalesOrderLine {
  id: string;
  orderId: string;
  lineNumber: number;
  skuId: string;
  skuCode: string;
  description: string;
  unitOfMeasure: string;
  orderedQuantity: Quantity;
  cancelledQuantity: Quantity;
  reservedQuantity: Quantity; // projection
  fulfilledQuantity: Quantity; // projection
  returnedQuantity: Quantity; // projection
  listUnitPrice: Money;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  preferredWarehouseId: string;
  promisedDate?: string;
}
```

Derived:

```text
openQuantity =
orderedQuantity - cancelledQuantity - fulfilledQuantity

backorderedQuantity =
max(0, openQuantity - reservedQuantity)
```

## 59.4 Order approval policy

Approval thresholds use **commercial value excluding tax**:

```text
approvalValue = subtotal - discount + freight
```

Approval is required when any condition is true:

```text
order approvalValue >= $50,000 USD equivalent
OR gross margin < 22%
OR any line discount >= 12%
OR customer creditExposure after order > creditLimit
OR customer status == on_hold
```

Approval steps:

```text
total $50k–$99,999.99      Sales Manager
total >= $100k             Sales Manager + Finance Manager
margin < 22%               Sales Manager
margin < 15%               Finance Manager also required
line discount >= 12%       Sales Manager
line discount >= 20%       Finance Manager also required
credit limit exceeded      Finance Manager
customer on hold           Finance Manager
```

The order owner cannot approve their own approval step.

## 59.5 Order risk flags

Derived flags include:

```text
credit_limit_exceeded
low_margin
high_discount
inventory_shortage
requested_date_at_risk
customer_on_hold
overdue_receivables
```

`requested_date_at_risk` is true when the order has a requested delivery date and any open line:

- has `promisedDate > requestedDeliveryDate`; or
- is backordered and its earliest known inbound availability is later than the requested delivery date; or
- is backordered with no known inbound availability.

## 59.6 Order operations

### Create

Creates `draft`.

Customer must be `active`, or `prospect` when created through accepted-quote conversion. Quote conversion activates the prospect before order confirmation.

### Edit draft

Allowed with `orders.edit_draft`.

Commercial fields and lines may be changed.

### Submit

Recalculate prices, tax, credit exposure, margin, risk, and approvals.

If approval required:

```text
draft -> pending_approval
approvalStatus = pending
```

Otherwise:

```text
draft -> confirmed
approvalStatus = not_required
```

### Approve

When all required steps are approved:

```text
pending_approval -> confirmed
approvalStatus = approved
```

### Reject

```text
pending_approval -> draft
approvalStatus = rejected
```

A reason is required.

### Edit confirmed

Allowed only if:

- user has `orders.edit_confirmed`;
- no quantity has been shipped for any affected line.

Any change to price, quantity, customer, address, freight, or warehouse MUST:

1. recalculate totals;
2. recalculate approval requirements;
3. cancel active reservations for quantities no longer required;
4. return order to `pending_approval` when the new values require approval not already satisfied.

### Place on hold

Allowed from `confirmed` or `pending_approval`.

A hold reason is required.

Existing reservations remain reserved.

No new shipment may be shipped while on hold.

### Release hold

Returns to:

- `confirmed` if approval is satisfied;
- `pending_approval` otherwise.

### Cancel

A full cancel is allowed only when no fulfilled quantity exists.

Effects:

- release all active reservations;
- cancel pending shipments;
- set all open quantities as cancelled;
- cancel pending approval requests;
- create activity and audit events.

If any fulfilled quantity exists, use **cancel remaining quantities**, not full cancel.

### Cancel remaining quantities

Allowed when at least one line has open quantity.

Only unfulfilled/unshipped remainder is cancelled.

### Close

A confirmed order becomes `closed` when:

- all quantities are fulfilled or cancelled;
- all expected invoices have been created;
- no active operational exception requires the order to remain open.

The backend MAY perform this transition automatically after related commands.

---

# 60. Inventory, Reservation, and Warehouse Contract

## 60.1 Source of truth

`StockMovement` is the immutable inventory ledger.

`InventoryBalance` is a projection/cache derived from movements and active reservations.

The implementation MUST NOT directly mutate an inventory balance without producing the corresponding stock movement or reservation event.

## 60.2 Inventory buckets

For a SKU/warehouse/location:

```text
onHand
damaged
quarantine
reserved
available
inbound
```

Definitions:

```text
sellableOnHand =
onHand - damaged - quarantine

reserved =
sum(active reservation remaining quantity)

available =
sellableOnHand - reserved

inbound =
open PO accepted quantity not yet received
+ in-transit transfer quantity to this warehouse
```

Normal operations MUST maintain:

```text
onHand >= 0
damaged >= 0
quarantine >= 0
reserved >= 0
available >= 0
```

The `System Degraded` or explicit data-anomaly scenario MAY intentionally expose a negative projection as a data-quality issue, but normal commands must never create one.

## 60.3 Stock movement

Canonical movement types:

```ts
type StockMovementType =
  | 'receipt'
  | 'shipment'
  | 'customer_return'
  | 'supplier_return'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damage'
  | 'damage_reversal'
  | 'quarantine'
  | 'quarantine_release'
  | 'cycle_count_adjustment';
```

Allocation/deallocation and pick are not stock movements because they do not change physical on-hand quantity. They are reservation events.

Each stock movement stores:

- SKU;
- warehouse;
- optional location;
- `onHandDelta`;
- `damagedDelta`;
- `quarantineDelta`;
- source entity type/id;
- actor;
- reason;
- timestamp.

`onHandDelta` represents physical quantity entering or leaving the warehouse.
`damagedDelta` and `quarantineDelta` reclassify physical on-hand into or out of non-sellable buckets and therefore do not independently change physical on-hand.

Examples:

```text
normal receipt of 10:
  onHandDelta +10
  damagedDelta 0
  quarantineDelta 0

mark 2 existing units damaged:
  onHandDelta 0
  damagedDelta +2

release 2 damaged units after correction:
  onHandDelta 0
  damagedDelta -2

receive 5 returned units directly into quarantine:
  onHandDelta +5
  quarantineDelta +5

shipment of 4:
  onHandDelta -4
```

Movement records are immutable.

## 60.4 Inventory reservation

```ts
interface InventoryReservation {
  id: string;
  orderId: string;
  orderLineId: string;
  skuId: string;
  warehouseId: string;
  locationId?: string;
  quantity: Quantity;
  consumedQuantity: Quantity;
  status: 'active' | 'consumed' | 'released' | 'cancelled';
  createdAt: string;
}
```

Remaining reservation:

```text
quantity - consumedQuantity
```

Reservations may be split across warehouses.

A line is fully allocated when:

```text
sum(active reservation remaining)
>= openQuantity
```

## 60.5 Allocate order

Preconditions:

- order status is `confirmed`;
- order is not on hold;
- SKU master status is `active`;
- requested reserve quantity > 0;
- warehouse has sufficient `available`.

Effects:

1. create reservation;
2. update allocation projection;
3. recalculate backorder quantity;
4. update order risk flags;
5. activity event when a shortage is resolved or created.

If availability changed since the UI read it, fail with:

```text
409 INVENTORY_CHANGED
```

## 60.6 Deallocate

Allowed only for reservation quantity not already consumed by a shipped shipment.

Deallocation releases availability immediately.

## 60.7 Manual adjustment

Requires `inventory.adjust`.

Requires:

- quantity delta;
- reason code;
- explanatory note for absolute adjustment >= 10 units or >= $1,000 standard-cost value.

Reason codes:

```text
count_correction
damage
found_stock
data_correction
other
```

Creates a stock movement and audit event.

## 60.8 Warehouse locations

All five seeded warehouses support bin locations.

The UI may aggregate at warehouse level, but inventory records SHOULD be location-aware.

Special locations:

```text
RECEIVING
STAGING
QUARANTINE
DAMAGED
```

---

# 61. Inventory Transfer Contract

## 61.1 Transfer state

```ts
type TransferStatus =
  'draft' | 'ready' | 'in_transit' | 'partially_received' | 'received' | 'cancelled';
```

## 61.2 Transfer rules

- source and destination warehouse MUST differ;
- transfer must have at least one line;
- quantity must be positive;
- a ready transfer reserves stock at the source;
- shipping consumes the source reservation and creates `transfer_out`;
- receiving creates `transfer_in`;
- damaged transfer quantity enters destination physical on-hand and is simultaneously classified into the damaged bucket;
- missing quantity remains open until completed or closed with discrepancy.

## 61.3 Operations

```text
create        -> draft
mark ready    -> ready
ship          -> in_transit
partial receive -> partially_received
receive all   -> received
cancel        -> cancelled
```

A transfer cannot be cancelled after any quantity has shipped. After shipping, discrepancy handling must be used instead.

---

# 62. Cycle Count Contract

## 62.1 State

```text
planned
in_progress
submitted
completed
cancelled
```

## 62.2 Rules

A cycle count targets a warehouse plus a set of locations/SKUs.

The counted quantity does not mutate stock until submission is approved/completed.

Variance:

```text
variance = countedOnHand - systemOnHand
```

Completing the count creates one `cycle_count_adjustment` movement per non-zero variance.

Variance with absolute standard-cost impact >= $2,500 requires Warehouse Manager approval.

---

# 63. Shipment and Fulfillment Contract

## 63.1 Shipment structure

A shipment belongs to one sales order and one warehouse.

A shipment line references one order line.

A single order may have many shipments.

A single order line may be split across shipments and warehouses.

## 63.2 Shipment status

```text
pending
picking
packed
ready_to_ship
shipped
in_transit
delivered
exception
returned
cancelled
```

## 63.3 Shipment invariants

Shipment quantity for an order line MUST NOT exceed:

```text
active reservation quantity available to consume
```

and MUST NOT cause:

```text
fulfilledQuantity > orderedQuantity - cancelledQuantity
```

## 63.4 Operations

### Create shipment

Consumes no inventory.

Selected quantities must be backed by active reservations.

### Start picking

```text
pending -> picking
```

### Pack

All shipment lines must be picked.

```text
picking -> packed
```

### Ready

```text
packed -> ready_to_ship
```

### Ship

Allowed only from `ready_to_ship`.

Atomic effects per line:

1. consume reservation;
2. create `shipment` stock movement reducing on-hand;
3. increment order-line fulfilled quantity;
4. set shipment shipped timestamp;
5. recalculate order fulfillment state;
6. recalculate availability;
7. create activity/audit.

Transition:

```text
ready_to_ship -> shipped
```

### In transit

Simulated carrier event:

```text
shipped -> in_transit
```

### Delivered

Simulated/manual carrier event:

```text
shipped|in_transit -> delivered
```

Delivery does not change inventory because inventory left Asteron at shipment time.

### Exception

May occur from shipped/in-transit.

Requires an exception code and message.

### Cancel pending shipment

Allowed before shipment.

All shipment-assigned reservation quantity remains or returns to general order reservation availability.

---

# 64. Customer Return Contract

## 64.1 Return state

```text
requested
authorized
in_transit
received
inspected
completed
rejected
cancelled
```

## 64.2 Return eligibility

A return line must reference a delivered/shipped order quantity.

Maximum returnable quantity:

```text
fulfilledQuantity - previouslyAcceptedReturnQuantity
```

## 64.3 Return reasons

```text
damaged
wrong_item
defective
not_needed
shipment_damage
quality_issue
other
```

## 64.4 Disposition

After inspection:

```text
restock
quarantine
scrap
return_to_supplier
```

Effects:

- `restock` -> `customer_return` movement with positive `onHandDelta`;
- `quarantine` -> `customer_return` positive `onHandDelta` plus `quarantine` positive `quarantineDelta`;
- `scrap` -> no Asteron on-hand increase;
- `return_to_supplier` -> quarantine pending supplier return.

Accepted return value creates a CreditMemo.

If the related invoice is unpaid, the credit memo is applied to the invoice.

If the invoice is already paid, the credit remains available to the customer and MAY be refunded.

---

# 65. Procurement Domain Contract

## 65.1 Supplier

Supplier lifecycle status:

```text
active
on_hold
inactive
```

Supplier relationship tier:

```text
standard
preferred
conditional
```

These are independent fields.

Rules:

- `active + standard` is a normal supplier;
- `active + preferred` is favored for sourcing;
- `active + conditional` is usable but triggers procurement approval;
- `on_hold` and `inactive` suppliers cannot receive new POs.

This replaces Part I's earlier mixed status list, where `Preferred` and `Conditional` appeared as lifecycle statuses.

## 65.2 Supplier SKU mapping

Canonical fields:

```ts
interface SupplierSkuMapping {
  id: string;
  supplierId: string;
  skuId: string;
  supplierSku: string;
  unitCost: Money;
  minimumOrderQuantity: Quantity;
  packMultiple: Quantity;
  leadTimeDays: number;
  currency: CurrencyCode;
  status: 'active' | 'inactive';
  isPreferred: boolean;
}
```

## 65.3 Purchase order state

```ts
type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled';
```

`delayed` and `disputed` are exception flags, not lifecycle statuses.

## 65.4 PO line

```ts
interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  lineNumber: number;
  skuId: string;
  supplierSku: string;
  description: string;
  orderedQuantity: Quantity;
  receivedAcceptedQuantity: Quantity;
  receivedDamagedQuantity: Quantity;
  rejectedQuantity: Quantity;
  unitCost: Money;
  taxRateBps: number;
  lineTotal: Money;
  expectedDate: string;
}
```

## 65.5 PO approval

Approval thresholds use **commercial value excluding recoverable/demo tax**:

```text
approvalValue = subtotal + freight
```

Approval required when:

```text
PO approvalValue USD equivalent >= $25,000
OR supplier relationship tier == conditional
OR unit cost variance > 15% above the last accepted cost
```

Approval steps:

```text
$25k–$99,999.99              Procurement Manager
>= $100k                     Procurement Manager + Finance Manager
conditional supplier tier    Procurement Manager
cost variance > 15%          Procurement Manager
cost variance > 30%          Finance Manager also required
```

A buyer cannot approve their own PO.

## 65.6 PO operations

```text
create             -> draft
submit             -> pending_approval or approved
approve            -> approved
send               -> sent
acknowledge        -> acknowledged
receive partially  -> partially_received
receive all        -> received
close              -> closed
cancel             -> cancelled
```

A PO may be edited freely only in `draft`.

Editing an approved-but-unsent PO invalidates approvals if approval-sensitive values change.

Sent/acknowledged POs cannot change ordered quantity downward below already received quantity.

## 65.7 Goods receipt

A receipt may be created from a PO in:

```text
sent
acknowledged
partially_received
```

For each line:

```text
acceptedQuantity
damagedQuantity
rejectedQuantity
```

Rules:

```text
accepted + damaged + rejected > 0
```

Accepted quantity creates a normal `receipt` movement with positive `onHandDelta`.

Damaged received quantity creates:

1. positive physical `receipt` movement for that quantity; and
2. a `damage` movement with positive `damagedDelta`.

Rejected quantity creates no Asteron inventory movement.

Default over-receipt tolerance:

```text
5% of PO line ordered quantity
```

Above tolerance requires `purchase_orders.approve` and a reason.

When all PO lines are fully satisfied within tolerance, PO becomes `received`.

A user may `close short` a partially received PO with Procurement Manager permission. Remaining inbound quantity is removed and the PO becomes `closed`.

For PO approval cost-variance rules:

```text
lastAcceptedUnitCost =
unit cost from the most recent prior accepted goods-receipt line
for the same supplier + SKU
```

If there is no prior accepted receipt, cost-variance approval is not triggered.

Supplier quality projection:

```text
defectRateBps =
(damaged + rejected received quantity)
/
(total received quantity)
* 10000

qualityScore =
max(0, 100 - defectRateBps / 100)
```

`qualityScore` is therefore a 0–100 display score.

---

# 66. Finance Domain Contract

## 66.1 Payment terms

Supported:

```text
DUE_ON_RECEIPT
NET_15
NET_30
NET_45
NET_60
```

Due date is calculated from invoice issue date.

## 66.2 Invoice model

Internal state is separated from display status.

### Lifecycle

```text
draft
open
voided
written_off
```

### Settlement — derived

```text
unpaid
partially_paid
paid
```

### Collection — derived

```text
current
overdue
disputed
```

UI may compose these into labels such as:

```text
Draft
Open
Partially Paid
Paid
Overdue
Disputed
Voided
Written Off
```

## 66.3 Invoice line

An invoice line SHOULD reference an order line and invoiced fulfilled quantity.

```ts
interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineNumber: number;
  orderLineId?: string;
  shipmentLineId?: string;
  skuId?: string;
  description: string;
  quantity: Quantity;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  unitCostSnapshot?: Money;
}
```

## 66.4 Invoicing policy

V1 uses **shipment-based invoicing**.

An order quantity becomes invoice-eligible after shipment.

Invoice creation selects uninvoiced fulfilled quantities.

A shipment/order line quantity MUST NOT be invoiced more than once.

An order may therefore produce multiple invoices when fulfillment is split.

Invoice freight may be allocated to the first invoice by default; the UI may let the user adjust it while draft.

## 66.5 Invoice operations

### Create draft

Requires one customer and at least one invoice-eligible line, except intentionally seeded manual adjustment invoices.

### Edit draft

Lines, billing contact, address, and reference may be edited.

### Open invoice

Preconditions:

- at least one line;
- total >= 0;
- due date valid;
- invoice currency consistent;
- no line over-invoices order quantity.

Effects:

- lifecycle becomes `open`;
- invoice number is final;
- FX rate snapshots;
- customer receivables update;
- activity/audit created.

### Send invoice

Allowed only when open.

Records `sentAt`.

Does not change financial amount.

### Dispute

An open invoice may be flagged disputed with reason.

Dispute does not pause due-date aging in V1; it changes collection status and dashboards.

### Void

Allowed only if:

- invoice is open;
- no posted payment or credit allocation exists.

Voiding reverses invoice exposure but does not delete the invoice.

### Write off

V1 supports **full remaining-balance write-off only**. Partial write-off is intentionally deferred.

Allowed when the invoice is open and has positive outstanding amount.

The approval threshold is evaluated against the full current outstanding amount:

- Accountant may write off up to $500 USD equivalent;
- above $500 requires Finance Manager;
- above $5,000 requires an ApprovalRequest with Finance Manager approval and reason.

On success:

```text
writtenOffAmount = outstanding immediately before the command
lifecycle = written_off
outstanding = 0
```

Written-off amount reduces customer receivables.

No general-ledger entry is modeled.

## 66.6 Invoice arithmetic

```text
subtotal = sum(line netAmount)
tax = sum(line taxAmount)
total = subtotal + tax + freight
paidAmount = sum(posted payment allocations) + sum(applied credit memos)
writtenOffAmount = explicit write-off amount
outstanding =
max(0, total - paidAmount - writtenOffAmount)
```

Settlement:

```text
outstanding == total          -> unpaid
0 < outstanding < total       -> partially_paid
outstanding == 0              -> paid
```

Overdue:

```text
lifecycle == open
AND outstanding > 0
AND demo business date > dueDate
AND not disputed
```

A disputed invoice has collection state `disputed` even when past due.

## 66.7 Payment

Payment status:

```text
pending
posted
failed
reversed
```

Methods:

```text
ach
wire
credit_card
check
other
```

A posted payment:

- belongs to exactly one customer;
- has one currency;
- may be allocated to zero or more invoices for the same customer/currency.

## 66.8 Payment allocation

Rules:

```text
allocation amount > 0
sum allocations <= payment amount
allocation <= invoice outstanding
invoice customer == payment customer
invoice currency == payment currency
invoice lifecycle == open
```

Unapplied amount:

```text
payment amount - sum(active allocations)
```

## 66.9 Record payment operation

Atomic effects:

1. validate payment;
2. create/mark payment `posted`;
3. create allocations;
4. recalculate invoice outstanding/settlement;
5. recalculate customer receivables;
6. update finance metrics;
7. create activity event;
8. create audit event.

## 66.10 Reverse payment

Allowed only for posted payment.

Reversal:

- marks original payment `reversed`;
- invalidates its allocations;
- reopens affected invoice balances;
- creates audit/activity events.

The original payment record remains immutable except status/reversal metadata.

## 66.11 Credit memo

Credit memo lifecycle:

```text
draft
open
fully_applied
voided
```

A credit memo may originate from:

- return;
- pricing correction;
- service recovery;
- manual adjustment.

When open, credit may be:

- applied to open invoices for the same customer/currency;
- left unapplied as customer credit;
- refunded if already economically settled.

Credit applications MUST NOT exceed either:

- credit memo unapplied amount;
- target invoice outstanding amount.

## 66.12 Refund

Refund status:

```text
pending
posted
failed
reversed
```

Refund amount may not exceed available unapplied customer credit created by a paid invoice/credit memo combination.

V1 does not connect to a real payment processor.

## 66.13 Bank transaction and reconciliation

```ts
interface BankTransaction {
  id: string;
  postedDate: string;
  description: string;
  reference?: string;
  amount: Money; // positive = incoming cash
  status: 'unmatched' | 'suggested' | 'matched' | 'needs_review' | 'ignored';
  matchedPaymentId?: string;
}
```

Matching candidates use this deterministic score:

```text
exact amount match                                 +60
normalized bank reference == payment/invoice ref  +25
description contains customer name/token          +10
description contains invoice/payment number       +15
posted date within 2 calendar days                 +10
posted date within 7 calendar days                  +5
```

Score is capped at `100`.

Suggested match confidence:

```text
high    >= 85
medium  60–84
low     < 60
```

Only a user with `reconciliation.manage` may confirm a match.

Confirming a match either:

- links an existing posted payment; or
- creates and posts a payment from the bank transaction, then optionally allocates it.

A bank transaction may be ignored only with a reason.

---

# 67. Generic Approval Engine

## 67.1 Purpose

Quotes, orders, purchase orders, large write-offs, and high-value cycle-count variances MUST use one shared approval model.

## 67.2 Approval request

```ts
interface ApprovalRequest {
  id: string;
  targetType: 'quote' | 'sales_order' | 'purchase_order' | 'invoice_write_off' | 'cycle_count';
  targetId: string;
  policyCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  steps: ApprovalStep[];
}
```

## 67.3 Approval step

```ts
interface ApprovalStep {
  id: string;
  sequence: number;
  requiredRole: string;
  assignedUserId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decidedBy?: string;
  decidedAt?: string;
  comment?: string;
}
```

Steps with the same sequence may execute in parallel.

Higher sequence steps become actionable only when all lower sequence steps are approved.

## 67.4 Rules

- requester cannot satisfy a step for their own transaction;
- rejected request stops remaining steps;
- `changes_requested` returns the target to editable state where applicable;
- material edits invalidate existing approval requests;
- approval decisions are immutable audit records;
- cancelled target cancels pending approval request.

---

# 68. Support Domain and SLA Contract

## 68.1 Ticket status

```text
new
open
pending_customer
pending_internal
escalated
resolved
closed
```

## 68.2 Ticket priorities

```text
low
normal
high
urgent
```

## 68.3 SLA policy

Default business hours:

```text
Monday–Friday
08:00–18:00
America/Chicago
```

Seeded public holidays are ignored for V1.

Targets:

| Priority |      First response |       Resolution |
| -------- | ------------------: | ---------------: |
| Low      |    8 business hours |  5 business days |
| Normal   |    4 business hours |  2 business days |
| High     |     1 business hour | 8 business hours |
| Urgent   | 15 business minutes | 4 business hours |

## 68.4 SLA clock rules

First-response timer:

- starts when ticket is created;
- stops on first public agent reply;
- does not restart.

Resolution timer:

- starts when ticket is created;
- pauses while status is `pending_customer`;
- continues during `pending_internal`;
- stops when `resolved`;
- resumes if ticket reopens.

`closed` is not an SLA state.

## 68.5 Ticket operations

### Create

```text
-> new
```

### Assign/open

First assignment or first agent action:

```text
new -> open
```

### Reply

Public reply:

- creates conversation message;
- records first response if not already present;
- `new -> open`;
- `pending_customer -> open`.

Internal note does not count as first response.

### Pending customer

```text
open|escalated -> pending_customer
```

Requires a public agent reply or reason.

### Pending internal

```text
open|escalated -> pending_internal
```

### Escalate

```text
new|open|pending_internal -> escalated
```

Requires reason and manager/team target.

### Resolve

```text
open|pending_customer|pending_internal|escalated -> resolved
```

Requires resolution code.

### Reopen

A new customer message within 7 calendar days:

```text
resolved -> open
```

After 7 days a new ticket is preferred, but a Support Manager may reopen manually.

### Close

A resolved ticket closes:

- manually; or
- when `demoClock` advances 72 hours past resolution.

## 68.6 Conversation message visibility

```text
public
internal
```

Internal messages are never presented as customer-visible.

---

# 69. Workflow and Automation Contract

## 69.1 Scope

V1 workflow automation is deterministic and event-driven.

It MUST NOT execute arbitrary user code.

Supported trigger types:

```text
order.created
order.confirmed
order.value_changed
invoice.overdue
inventory.below_reorder_point
ticket.escalated
customer.status_changed
schedule.daily
schedule.weekly
```

## 69.2 Condition tree

```ts
type ConditionNode =
  | {
      type: 'group';
      operator: 'and' | 'or';
      children: ConditionNode[];
    }
  | {
      type: 'condition';
      field: string;
      operator: ConditionOperator;
      value: unknown;
    };
```

Supported operators:

```text
eq
neq
gt
gte
lt
lte
contains
not_contains
in
not_in
is_empty
is_not_empty
```

No group may be empty.

Maximum nesting depth:

```text
5
```

Maximum conditions per workflow:

```text
50
```

## 69.3 Actions

Supported actions:

```text
assign_user
create_task
send_notification
request_approval
add_tag
remove_tag
place_customer_on_hold
place_order_on_hold
create_purchase_order_draft
```

Actions invoke the same domain services as interactive commands.

Automation actor:

```text
usr_system_automation
```

It has only the permissions required for supported actions: `support.assign`, `support.change_status`, `customers.edit`, `customers.credit_edit`, `orders.edit_confirmed`, `orders.hold` and `purchase_orders.create`. Its writes carry the workflow and the run in their audit and activity.

`request_approval` sends a confirmed order back to pending approval with one step for the named role, releasing its reservations, as an edit of a confirmed order does when its policy asks for one.

A workflow's definition is checked at two levels: a save checks its structure (the tree of section 69.2, fields its trigger's subject carries, operators its field types answer, actions its trigger has a record for); activation, and any edit of an active workflow, also checks what would stop a run.

## 69.4 Workflow execution

Workflow run status:

```text
queued
running
succeeded
partially_failed
failed
skipped
```

Each trigger event + workflow pair has idempotency key:

```text
workflowId + ":" + eventId
```

The same event MUST NOT execute the same workflow twice.

Maximum chained workflow depth:

```text
5
```

If exceeded, stop execution with:

```text
WORKFLOW_RECURSION_LIMIT
```

A run executes inside the transaction of the command that produced its event, after that command's own work; an action that fails is taken back alone and the run continues with the next. A run whose actions all fail sets the workflow to `error` and notifies its owner. Run and action codes are one vocabulary:

```text
ACTION_TARGET_NOT_FOUND
ACTION_REFUSED
ACTION_NOT_PERMITTED
ACTION_INVALID
WORKFLOW_RECURSION_LIMIT
```

## 69.5 Scheduled workflow simulation

Because the reference backend is browser-local, scheduled triggers are evaluated:

- on app initialization;
- when the demo clock changes;
- when the scenario engine explicitly advances time.

Missed schedule occurrences since the previous evaluation MAY be collapsed into one run per workflow/day to avoid runaway catch-up. The reference backend collapses them: an evaluation runs each active scheduled workflow once, for the last occurrence that fell due, keyed by that occurrence's date, and the run states how many occurrences it stands for.

---

# 70. Activity, Audit, Notification, and Task Contract

## 70.1 Activity event

Activity is human-facing.

```ts
interface ActivityEvent {
  id: string;
  type: string;
  actorId: string;
  occurredAt: string;
  subjectType: string;
  subjectId: string;
  customerId?: string;
  orderId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
```

Activity may intentionally summarize rather than store a field-by-field diff.

## 70.2 Audit event

Audit is immutable and technical.

Every successful state-changing command MUST create at least one audit event.

```ts
interface AuditEvent {
  id: string;
  occurredAt: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousVersion?: number;
  nextVersion?: number;
  changedFields?: string[];
  before?: unknown;
  after?: unknown;
  correlationId: string;
}
```

Sensitive fields MAY be redacted from before/after snapshots.

## 70.3 Notification

```ts
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
}
```

## 70.4 Task

Tasks are simple internal action items.

```ts
interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  createdBy: string;
  dueDate?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'completed' | 'cancelled';
  relatedEntityType?: string;
  relatedEntityId?: string;
}
```

No full project-management domain is required.

---

# 71. Saved Views, Search, and Import Jobs

## 71.1 Saved view

Saved views are owned by a user.

```ts
interface SavedView {
  id: string;
  userId: string;
  resource:
    | 'customers'
    | 'orders'
    | 'products'
    | 'inventory'
    | 'purchase_orders'
    | 'invoices'
    | 'tickets'
    | 'audit';
  name: string;
  isDefault: boolean;
  state: {
    filters: FilterExpression[];
    sort: SortExpression[];
    visibleColumns: string[];
    columnOrder: string[];
    grouping?: string[];
    density?: 'comfortable' | 'compact';
    pageSize?: 25 | 50 | 100;
  };
  metadata: EntityMetadata;
}
```

Only one default view per user/resource is allowed.

## 71.2 Global search

Searchable entities:

```text
customers
contacts
SKUs/products
sales orders
quotes
invoices
suppliers
purchase orders
tickets
```

Search performs case-insensitive matching against:

- business number;
- name/title;
- relevant external reference;
- SKU;
- customer PO;
- email where appropriate.

Minimum query length:

```text
2 characters
```

Results are grouped by entity type and limited to 8 results per group in the command/search surface.

## 71.3 Import job

The CSV mapper operates through an ImportJob aggregate.

```text
created
mapping
validating
ready
importing
completed
completed_with_errors
failed
cancelled
```

V1 supported import type:

```text
customers
```

Required fields after mapping:

```text
Company Name
```

Optional fields:

```text
External ID
Primary Email
Phone
Billing Address
Segment
Account Owner
Payment Terms
```

Validation categories:

```text
error
warning
```

Rows with errors are not imported.

Rows with warnings may be imported.

Import is transactional per row, not for the entire file.

Completion result MUST report:

```text
totalRows
validRows
warningRows
errorRows
importedRows
skippedRows
```

---

# 72. Analytics and KPI Definitions

Analytics MUST use the same underlying domain data as operational screens.

No dashboard may use unrelated hard-coded totals.

## 72.1 Reporting currency

All cross-currency analytics convert transaction amounts to USD using each transaction's snapshotted `fxRateToUsd`.

## 72.2 Revenue

For Nexora, dashboard revenue means:

```text
sum(net merchandise + freight, excluding tax)
for invoices that were opened and are not voided
by invoice issue date
minus opened credit memos in the same period

Settlement state (`unpaid`, `partially_paid`, `paid`) does not change revenue.
Written-off invoices remain part of historical revenue; the write-off affects collections/receivables, not invoiced revenue.
```

This is operational invoiced revenue, not GAAP revenue recognition.

## 72.3 Gross margin

```text
invoiced net merchandise
- invoice-line snapshotted cost
```

Freight and tax are excluded from gross-margin calculation.

## 72.4 Orders

Order count:

```text
orders confirmed during period
excluding orders subsequently fully cancelled before fulfillment
```

Booked order value:

```text
confirmed order total excluding tax
converted to USD
```

## 72.5 Average order value

```text
booked order value / confirmed order count
```

## 72.6 Receivables

```text
sum outstanding of open invoices
```

Overdue receivables:

```text
sum outstanding where collectionState == overdue
```

## 72.7 DSO

Simplified demo DSO:

```text
receivables / invoiced revenue in trailing 90 days * 90
```

If trailing revenue is zero, DSO is undefined.

If the trailing 90 days start before the invoices the backend keeps (§75.4), DSO is undefined: a ratio over the kept part of the 90 days is not the ratio over 90 days.

## 72.8 Inventory value

```text
sum(sellableOnHand + quarantine + damaged) * SKU standardCost
```

Displayed in USD.

## 72.9 Inventory turns

Simplified:

```text
trailing-12-month shipped cost / average inventory value
```

Seed analytics may precompute monthly inventory-value snapshots.

## 72.10 Supplier on-time delivery

A PO line is on time when accepted receipt quantity sufficient to satisfy the line arrives on or before its expected date.

Supplier OTD:

```text
on-time completed lines / completed lines
```

## 72.11 Support first-response SLA

```text
tickets receiving first public agent response within SLA target
/
tickets with a first-response target
```

## 72.12 Account health

Customer health is calculated nightly/simulated on scenario reset using:

At risk when any:

- overdue receivables > 25% of credit limit;
- urgent/high unresolved support escalation older than 2 business days;
- 2+ delayed orders in trailing 30 days.

Watch when any:

- overdue receivables > 10% of credit limit;
- one delayed active order;
- support CSAT < 3.5 trailing 90 days.

Otherwise healthy.

Curated flagship customers MAY override health for narrative purposes only if the underlying seeded facts still justify the result.

---

# 73. Simulated API Contract

## 73.1 Transport

The primary implementation SHOULD expose HTTP-like semantics through MSW or an equivalent adapter.

The domain/application services MUST remain transport-independent.

## 73.2 Base path

```text
/api/v1
```

## 73.3 List response

```ts
interface ListResponse<T> {
  data: T[];
  page: {
    number: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: Record<string, unknown>;
}
```

Page numbering starts at `1`.

Allowed page sizes:

```text
25
50
100
```

Default:

```text
50
```

## 73.4 Detail response

```ts
interface EntityResponse<T> {
  data: T;
}
```

## 73.5 Sorting

Query:

```text
?sort=-orderDate,orderNumber
```

Prefix `-` means descending.

Unknown/non-sortable fields fail with `400 INVALID_SORT`.

## 73.6 Filtering

Canonical query form:

```text
filter[status]=confirmed
filter[warehouseId]=wh_000001
filter[orderDate][gte]=2026-08-01
filter[orderDate][lte]=2026-09-04
filter[totalMinor][gte]=5000000
```

Multiple enum values:

```text
filter[status]=confirmed,on_hold
```

## 73.7 Full-text query

```text
?q=meridian
```

Full-text query is combined with structured filters using logical AND.

## 73.8 Mutation concurrency

Client sends:

```http
If-Match: "7"
```

where `7` is the entity version.

Missing version on mutation fails:

```text
428 PRECONDITION_REQUIRED
```

Stale version fails:

```text
409 STALE_VERSION
```

## 73.9 Idempotency

Create and command endpoints SHOULD accept:

```http
Idempotency-Key: <client-generated-key>
```

Repeated requests with the same key and identical payload return the first successful result.

Same key with different payload fails:

```text
409 IDEMPOTENCY_KEY_REUSED
```

## 73.10 Error response

```ts
interface ApiError {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    correlationId: string;
    fieldErrors?: Array<{
      field: string;
      code: string;
      message: string;
    }>;
    details?: Record<string, unknown>;
  };
}
```

## 73.11 Error categories

```text
400 INVALID_QUERY
401 UNAUTHENTICATED
403 FORBIDDEN
404 NOT_FOUND
409 STALE_VERSION
409 INVALID_STATE_TRANSITION
409 INVENTORY_CHANGED
409 IDEMPOTENCY_KEY_REUSED
422 VALIDATION_FAILED
428 PRECONDITION_REQUIRED
500 INTERNAL_ERROR
503 SERVICE_UNAVAILABLE
```

## 73.12 Canonical endpoint surface

### Session and demo

```http
GET    /session
POST   /demo/persona
POST   /demo/reset
POST   /demo/scenario
POST   /demo/clock/advance
```

### Customers

```http
GET    /customers
POST   /customers
GET    /customers/:id
PATCH  /customers/:id
POST   /customers/:id/archive
POST   /customers/:id/hold
POST   /customers/:id/release-hold
GET    /customers/:id/activity
```

### Catalog

```http
GET    /products
GET    /products/:id
GET    /skus
GET    /skus/:id
GET    /price-lists
```

### Quotes

```http
GET    /quotes
POST   /quotes
GET    /quotes/:id
PATCH  /quotes/:id
POST   /quotes/:id/submit
POST   /quotes/:id/send
POST   /quotes/:id/accept
POST   /quotes/:id/reject
POST   /quotes/:id/convert
```

Approval decisions use approval endpoints rather than quote-specific approval endpoints.

### Orders

```http
GET    /orders
POST   /orders
GET    /orders/:id
PATCH  /orders/:id
POST   /orders/:id/submit
POST   /orders/:id/hold
POST   /orders/:id/release-hold
POST   /orders/:id/cancel
POST   /orders/:id/cancel-remaining
POST   /orders/:id/allocate
POST   /orders/:id/deallocate
```

### Shipments and returns

```http
GET    /shipments
POST   /shipments
GET    /shipments/:id
POST   /shipments/:id/start-picking
POST   /shipments/:id/pack
POST   /shipments/:id/ready
POST   /shipments/:id/ship
POST   /shipments/:id/deliver
POST   /shipments/:id/exception

GET    /returns
POST   /returns
GET    /returns/:id
POST   /returns/:id/authorize
POST   /returns/:id/receive
POST   /returns/:id/inspect
POST   /returns/:id/complete
```

### Inventory

```http
GET    /inventory
GET    /inventory/:skuId
GET    /stock-movements
POST   /inventory/adjustments
GET    /transfers
POST   /transfers
GET    /transfers/:id
POST   /transfers/:id/ready
POST   /transfers/:id/ship
POST   /transfers/:id/receive
GET    /cycle-counts
POST   /cycle-counts
POST   /cycle-counts/:id/start
POST   /cycle-counts/:id/submit
POST   /cycle-counts/:id/complete
```

### Procurement

```http
GET    /suppliers
POST   /suppliers
GET    /suppliers/:id
PATCH  /suppliers/:id

GET    /purchase-orders
POST   /purchase-orders
GET    /purchase-orders/:id
PATCH  /purchase-orders/:id
POST   /purchase-orders/:id/submit
POST   /purchase-orders/:id/send
POST   /purchase-orders/:id/acknowledge
POST   /purchase-orders/:id/cancel
POST   /purchase-orders/:id/close-short

POST   /goods-receipts
GET    /goods-receipts/:id
```

### Finance

```http
GET    /finance/overview

GET    /invoices
POST   /invoices
GET    /invoices/:id
PATCH  /invoices/:id
POST   /invoices/:id/open
POST   /invoices/:id/send
POST   /invoices/:id/dispute
POST   /invoices/:id/void
POST   /invoices/:id/write-off

GET    /payments
POST   /payments
GET    /payments/:id
POST   /payments/:id/reverse

GET    /credit-memos
POST   /credit-memos
GET    /credit-memos/:id
POST   /credit-memos/:id/open
POST   /credit-memos/:id/apply

POST   /refunds

GET    /bank-transactions
POST   /bank-transactions/:id/match
POST   /bank-transactions/:id/ignore
```

### Support

```http
GET    /support/tickets
POST   /support/tickets
GET    /support/tickets/:id
PATCH  /support/tickets/:id
POST   /support/tickets/:id/reply
POST   /support/tickets/:id/internal-note
POST   /support/tickets/:id/assign
POST   /support/tickets/:id/pending-customer
POST   /support/tickets/:id/pending-internal
POST   /support/tickets/:id/escalate
POST   /support/tickets/:id/resolve
POST   /support/tickets/:id/reopen
POST   /support/tickets/:id/close
```

### Approvals

```http
GET    /approvals
GET    /approvals/:id
POST   /approvals/:id/approve
POST   /approvals/:id/reject
POST   /approvals/:id/request-changes
```

### Workflows

```http
GET    /workflows
POST   /workflows
GET    /workflows/:id
PATCH  /workflows/:id
POST   /workflows/:id/activate
POST   /workflows/:id/pause
POST   /workflows/:id/archive
GET    /workflows/:id/runs
```

### Cross-cutting

```http
GET    /search
GET    /activity
GET    /audit
GET    /notifications
POST   /notifications/:id/read
POST   /notifications/:id/archive
GET    /saved-views
POST   /saved-views
PATCH  /saved-views/:id
DELETE /saved-views/:id
POST   /imports/customers
GET    /imports/:id
```

---

# 74. Persistence, Transaction, and Projection Contract

## 74.1 Persistence

IndexedDB is the default persistence target.

The implementation MAY use Dexie or another wrapper.

Persisted metadata MUST include:

```ts
interface DemoDatabaseMetadata {
  schemaVersion: number;
  seedVersion: string;
  scenarioId: string;
  demoClock: string;
  activePersonaId: string;
  initializedAt: string;
}
```

## 74.2 Schema version

Initial version:

```text
schemaVersion = 1
seedVersion = "nexora-v1"
```

If schema or seed version changes incompatibly, the reference app MAY reset the local database after clearly informing the user.

## 74.3 Atomic commands

Every domain command is an atomic transaction across:

- aggregate mutation;
- related projections;
- stock movements/reservations;
- approval records;
- activity;
- audit;
- notifications required by the command.

A command either commits all visible consequences or none.

## 74.4 Derived projections

The following SHOULD be projections rather than independently edited values:

```text
InventoryBalance
Customer financial summary
Order allocation/fulfillment/payment summaries
Supplier performance
Dashboard KPIs
Notification counts
Approval queue counts
```

## 74.5 Reset

`Reset demo data` MUST:

1. clear mutable persisted state;
2. restore canonical seed;
3. apply selected scenario;
4. reset demo clock;
5. restore canonical persona for that scenario;
6. clear idempotency records and transient API failures.

## 74.6 Scenario switching

Switching a structural scenario MUST reset demo data before applying the new overlay.

Structural scenarios:

```text
healthy
new_tenant
enterprise_scale
heavy_data
month_end
inventory_crisis
collections_pressure
restricted_user
support_incident
```

`system_degraded` is a runtime transport profile and MAY be enabled without resetting business data.

---

# 75. Canonical Seed Scale and Generation Rules

## 75.1 Organizational scale

Canonical tenant profile:

```text
Employees (informational)                 320
User accounts                             205
Active user accounts                      170
Invited                                    20
Suspended                                  10
Deactivated                                 5
Teams                                      14
Roles                                      12
Warehouses                                  5
```

This resolves the earlier ambiguity between employee count and application-user count.

## 75.1.1 Canonical warehouses

```text
wh_000001  CHI-01  Chicago Central       America/Chicago
wh_000002  DAL-01  Dallas Distribution   America/Chicago
wh_000003  ATL-01  Atlanta Hub           America/New_York
wh_000004  DEN-01  Denver Regional       America/Denver
wh_000005  NJ-01   New Jersey East       America/New_York
```

Jordan Wells is scoped to `wh_000001`.

## 75.1.2 Canonical price lists

All five seeded price lists use USD:

```text
prl_000001  Standard
prl_000002  SMB
prl_000003  Enterprise
prl_000004  Strategic Accounts
prl_000005  Distributor
```

Customer-specific contract prices are represented by `ContractPrice`, not by a separate price-list type.

## 75.2 Master data scale

```text
Customers                                4,800
Contacts                                11,600
Customer addresses                      8,900
Suppliers                                1,200
Product families                        9,400
SKUs                                    18,000
Categories                                 160
Price lists                                 5
Supplier-SKU mappings                  28,000
```

## 75.3 Transactional logical scale

The logical seeded business history covers 24 months.

```text
Quotes                                  52,000
Sales orders                           160,000
Sales order lines                      520,000
Shipments                              185,000
Returns                                  6,400
Stock movements                      1,200,000
Inventory reservations                  active/open subset
Purchase orders                         30,000
Goods receipts                          41,000
Invoices                                92,000
Payments                                74,000
Bank transactions                       78,000
Support tickets                         40,000
Activity events                        high-volume
Audit events                           mutation-derived + curated
```

This represents approximately 80,000 sales orders per year.

The implementation does **not** have to materialize every immutable historical row into memory at startup.

## 75.4 Physical data strategy

Use two data tiers:

### Operational tier

Fully materialized and mutable:

- all master data;
- all open transactions regardless of age;
- trailing 120 days of transactions;
- all curated flagship records and their dependencies.

### Historical tier

Older completed/closed records MAY be:

- materialized in IndexedDB;
- generated deterministically on demand;
- stored as prebuilt seed chunks.

Regardless of physical strategy, API totals, search results, detail links, and analytics MUST behave as if the logical dataset exists.

Mutations are only required for operational-tier records.

Historical closed transactions MAY be read-only.

## 75.5 Distribution rules

### Customer segments

```text
SMB            58%
Mid-Market     28%
Enterprise     11%
Strategic       3%
```

### Customer status

```text
Active         82%
Prospect        7%
On Hold         2%
Inactive        8%
Closed          1%
```

### Customer health among active customers

```text
Healthy        70%
Watch          22%
At Risk         8%
```

### Order value distribution

Use a log-normal-like skew.

Targets:

```text
median             ~$3,200
75th percentile    ~$8,500
90th percentile   ~$22,000
95th percentile   ~$42,000
99th percentile  ~$135,000
```

### Order lines

```text
median                 3
75th percentile        5
90th percentile        9
99th percentile       28
curated max          148
```

### Payment methods

```text
ACH               52%
Wire              24%
Credit Card       12%
Check              10%
Other               2%
```

### Support priority

```text
Low               14%
Normal            62%
High              20%
Urgent             4%
```

### Returns

Approximately:

```text
4% of fulfilled orders have at least one returned line
```

### Product demand

SKU demand MUST follow a Pareto-like distribution:

- top 10% of SKUs generate roughly 60% of order lines;
- bottom 40% generate less than 10%.

## 75.6 Data correlation

Generation MUST correlate related data rather than choose each field independently.

Examples:

- enterprise customers have higher order values;
- strategic accounts are more likely to have NET_45/NET_60 terms;
- high-value customers are more likely to have contract prices;
- higher order value increases approval likelihood;
- low stock increases partial allocation/backorder probability;
- delayed shipments increase support-ticket probability;
- overdue invoices worsen customer health;
- poor supplier performance increases delayed PO probability.

---

# 76. Canonical Flagship Narrative

The Meridian Controls Group narrative is mandatory and deterministic.

## 76.1 Customer

```text
Customer: Meridian Controls Group
Account: CUS-010428
Segment: Enterprise
Status: Active
Health: At Risk
Customer since: 2019-04-12
Credit limit: $500,000
```

## 76.2 Current exposure

At canonical demo time:

```text
Gross receivables: approximately $284,930
One highlighted invoice: $41,860 outstanding
Highlighted invoice overdue: 14 days
```

## 76.3 Order

```text
SO-2026-01842
Total: $86,420
Status: confirmed
Fulfillment: partially_fulfilled
Risk: inventory_shortage + overdue_receivables
```

## 76.4 Product

```text
Servo Motor MX-240
6 units backordered for the highlighted order
```

## 76.5 Shipment

```text
SHP-009841
Status: in_transit
```

## 76.6 Support ticket

```text
TCK-10492
Priority: high
Status: escalated or open according to scenario
Subject: Shipment delay for SO-2026-01842
```

## 76.7 Cross-module requirement

Every screen referring to the records above MUST resolve to these same IDs and values.

Scenario overlays may alter status/timing while preserving referential identity.

---

# 77. Scenario Definitions

## 77.1 Healthy Operations

Default baseline.

Characteristics:

- normal latency;
- no forced endpoint failure;
- inventory exceptions present but limited;
- overdue receivables within normal range;
- support SLA mostly healthy.

## 77.2 New Tenant

Structural changes:

- 14 customers;
- 24 SKUs;
- 2 suppliers;
- 1 warehouse;
- 3 active users;
- no historical sales beyond 30 days;
- empty or near-empty analytics;
- no overdue invoices;
- onboarding tasks and empty states.

## 77.3 Enterprise Scale

Logical scale multiplier:

```text
customers x4
SKUs x3
transaction history x5
```

UI pagination totals and search volumes increase.

No change to domain rules.

## 77.4 Heavy Data

Keeps normal business narrative but maximizes difficult UI records:

- order with 148 lines;
- customer with 28 contacts;
- ticket with 120 conversation messages;
- product with 40 supplier mappings;
- dense audit history;
- long names and notes.

## 77.5 Month End

At reset:

- demo business date is last business day of month;
- invoice volume due within 5 days is 2.5x baseline;
- unmatched bank transactions are 3x baseline;
- approval queue is 1.8x baseline;
- finance notifications elevated.

## 77.6 Inventory Crisis

At reset:

- exactly 42 SKUs below safety stock;
- 17 confirmed customer orders have allocation shortage;
- 8 purchase orders are urgent/delayed;
- 3 warehouses have material shortages;
- Meridian's MX-240 shortage is active.

## 77.7 Collections Pressure

At reset:

- overdue receivables are 2.2x baseline;
- 18 customers exceed 90% credit utilization;
- 6 customers are on hold;
- Meridian has the highlighted overdue invoice;
- finance approval/collection tasks increased.

## 77.8 Restricted User

Persona:

```text
Jordan Wells — Warehouse Operator
```

Warehouse scope:

```text
CHI-01
```

No Finance, role-management, or broad CRM edit access.

May:

- view inventory in CHI-01;
- pick/pack/ship;
- receive goods;
- participate in cycle counts.

## 77.9 Support Incident

- one strategic customer has a shipment incident;
- 12 related support tickets created across affected customers;
- 3 high, 1 urgent;
- one SLA breach already present;
- support queue load 2x baseline.

## 77.10 System Degraded

Runtime transport profile:

```text
base latency: 700ms
jitter: 0–900ms
GET /finance/overview: 35% 503
GET /analytics/{executive,sales,inventory,procurement,finance,support}: 35% 503
GET /activity: 15% 503
mutation failure rate: 5% retryable 503
```

Domain validation/conflict failures remain deterministic and are not part of random transport failure rate.

---

# 78. Latency and Failure Profiles

## 78.1 Normal profile

```text
read requests:      120–450ms deterministic jitter
write requests:     180–650ms deterministic jitter
search:             180–500ms
large analytics:    300–900ms
```

Jitter SHOULD be deterministic from request fingerprint in screenshot/test mode.

## 78.2 Explicit conflict fixtures

At least these deterministic conflicts MUST be available:

```text
STALE_VERSION
INVENTORY_CHANGED
INVOICE_ALREADY_PAID
ORDER_ALREADY_CANCELLED
APPROVAL_ALREADY_DECIDED
```

They may be triggered by curated records, debug scenario controls, or a first-attempt-only deterministic handler.

---

# 79. Canonical Domain Operation Catalog

The following operations define the minimum meaningful behavior of Nexora V1.

## CRM

```text
createCustomer
updateCustomer
archiveCustomer
placeCustomerOnHold
releaseCustomerHold
createContact
updateContact
setPrimaryContact
addCustomerNote
```

## Quote

```text
createQuote
addQuoteLine
updateQuoteLine
removeQuoteLine
submitQuote
sendQuote
acceptQuote
rejectQuote
expireQuotes
convertQuoteToOrder
```

## Sales order

```text
createOrder
updateDraftOrder
submitOrder
approveOrderThroughApprovalEngine
rejectOrderThroughApprovalEngine
editConfirmedOrder
placeOrderOnHold
releaseOrderHold
cancelOrder
cancelRemainingOrderQuantity
allocateOrderLine
deallocateOrderLine
closeOrderWhenEligible
```

## Inventory

```text
adjustInventory
createTransfer
readyTransfer
shipTransfer
receiveTransfer
createCycleCount
startCycleCount
submitCycleCount
completeCycleCount
```

## Fulfillment

```text
createShipment
startShipmentPicking
packShipment
markShipmentReady
shipShipment
markShipmentInTransit
deliverShipment
recordShipmentException
createReturn
authorizeReturn
receiveReturn
inspectReturn
completeReturn
```

## Procurement

```text
createSupplier
updateSupplier
createPurchaseOrder
updatePurchaseOrder
submitPurchaseOrder
approvePurchaseOrderThroughApprovalEngine
sendPurchaseOrder
acknowledgePurchaseOrder
cancelPurchaseOrder
receivePurchaseOrder
closePurchaseOrderShort
```

## Finance

```text
createInvoiceFromFulfilledQuantities
updateDraftInvoice
openInvoice
sendInvoice
disputeInvoice
voidInvoice
writeOffInvoice
recordPayment
allocatePayment
reversePayment
createCreditMemo
openCreditMemo
applyCreditMemo
createRefund
matchBankTransaction
ignoreBankTransaction
```

## Support

```text
createTicket
assignTicket
replyToTicket
addInternalTicketNote
setTicketPendingCustomer
setTicketPendingInternal
escalateTicket
resolveTicket
reopenTicket
closeTicket
recalculateSla
```

## Workflow / cross-cutting

```text
createWorkflow
updateWorkflow
activateWorkflow
pauseWorkflow
archiveWorkflow
evaluateWorkflowEvent
executeWorkflowRun
createTask
completeTask
markNotificationRead
archiveNotification
createSavedView
updateSavedView
deleteSavedView
runCustomerImport
```

Every operation MUST:

1. authorize;
2. validate input;
3. validate current aggregate state;
4. apply invariants;
5. perform atomic side effects;
6. increment mutated aggregate versions;
7. emit audit events;
8. emit human-facing activity/notifications when specified;
9. return the resulting authoritative state.

---

# 80. Cross-Domain Invariants

These invariants are non-negotiable.

## 80.1 Commercial

- a confirmed order always references a valid customer and immutable address snapshots;
- line totals always reconcile to header totals;
- an accepted quote converts at most once;
- a cancelled order cannot ship new quantity;
- a held order cannot ship.

## 80.2 Inventory

- normal commands never create negative available inventory;
- physical stock changes always produce stock movements;
- reservations never exceed sellable available inventory at creation time;
- shipped quantity never exceeds consumed reservation;
- returned accepted quantity never exceeds previously fulfilled quantity.

## 80.3 Procurement

- receipt quantity cannot exceed PO tolerance without override;
- rejected receipt quantity never increases inventory;
- received quantity cannot be negative;
- a cancelled PO cannot receive goods.

## 80.4 Finance

- invoice quantity never exceeds uninvoiced fulfilled quantity unless invoice is explicitly manual;
- invoice outstanding never becomes negative;
- payment allocations never exceed payment amount;
- payment allocation never exceeds invoice outstanding;
- a voided invoice has no active payment/credit allocation;
- reversed payment allocations no longer affect invoice settlement;
- credit/refund cannot exceed economically available customer credit.

## 80.5 Authorization

- backend authorization is mandatory;
- UI visibility never substitutes for permission checks;
- scoped warehouse users cannot mutate other warehouses;
- requester cannot self-approve when the policy forbids it.

## 80.6 History

- historical transaction snapshots are not rewritten when master data changes;
- audit records are immutable;
- cancelled/voided/reversed records remain queryable.

---

# 81. Domain Error Codes

Domain errors SHOULD use stable machine codes.

## CRM

```text
CUSTOMER_INACTIVE
CUSTOMER_ON_HOLD
PRIMARY_CONTACT_INVALID
CREDIT_LIMIT_EXCEEDED
```

## Catalog / pricing

```text
SKU_INACTIVE
SKU_DISCONTINUED
PRICE_NOT_FOUND
INVALID_QUANTITY_PRECISION
```

## Quote / order

```text
QUOTE_NOT_EDITABLE
QUOTE_EXPIRED
QUOTE_ALREADY_CONVERTED
APPROVAL_REQUIRED
APPROVAL_ALREADY_DECIDED
ORDER_NOT_EDITABLE
ORDER_ON_HOLD
ORDER_ALREADY_CANCELLED
ORDER_HAS_FULFILLMENT
```

## Inventory

```text
INSUFFICIENT_AVAILABLE_STOCK
INVENTORY_CHANGED
RESERVATION_NOT_FOUND
RESERVATION_ALREADY_CONSUMED
TRANSFER_NOT_SHIPPABLE
TRANSFER_ALREADY_SHIPPED
```

## Procurement

```text
SUPPLIER_ON_HOLD
PO_NOT_EDITABLE
PO_OVER_RECEIPT
PO_ALREADY_CANCELLED
PO_NOT_RECEIVABLE
```

## Finance

```text
NOTHING_TO_INVOICE
OVER_INVOICING_NOT_ALLOWED
INVOICE_NOT_EDITABLE
INVOICE_ALREADY_PAID
INVOICE_HAS_ALLOCATIONS
PAYMENT_ALLOCATION_EXCEEDS_PAYMENT
PAYMENT_ALLOCATION_EXCEEDS_INVOICE
PAYMENT_CURRENCY_MISMATCH
PAYMENT_ALREADY_REVERSED
CREDIT_EXCEEDED
```

## Support

```text
INVALID_TICKET_TRANSITION
SLA_POLICY_NOT_FOUND
```

---

# 82. Seeded Business Rules for UI-Critical Edge Cases

The seed MUST contain discoverable examples of:

1. active customer with no phone number;
2. active customer with no default shipping address;
3. enterprise customer with long legal name;
4. customer on hold because of credit exposure;
5. prospect with accepted quote awaiting conversion;
6. discontinued SKU referenced by historical order;
7. SKU with zero available stock but inbound PO;
8. SKU split across three warehouses;
9. order with one line;
10. order with 148 lines;
11. order requiring sales-manager approval;
12. order requiring finance approval due to margin;
13. confirmed order on hold;
14. partially allocated order;
15. partially fulfilled order;
16. order split across three shipments;
17. shipment exception;
18. delayed PO;
19. partially received PO;
20. goods receipt with damaged units;
21. invoice due today;
22. invoice 14 days overdue;
23. partially paid invoice;
24. paid invoice with later credit memo;
25. unapplied payment;
26. high-confidence bank reconciliation suggestion;
27. ambiguous reconciliation match;
28. urgent ticket close to SLA breach;
29. breached high-priority ticket;
30. ticket with 120 messages;
31. workflow with nested AND/OR conditions;
32. failed workflow run;
33. user with warehouse-only scope;
34. stale-edit conflict;
35. inventory-change conflict.

Each edge case SHOULD have a stable developer-facing fixture key such as:

```text
edge.order.large
edge.invoice.overdue
edge.inventory.conflict
```

The fixture key need not be visible in the user-facing product.

---

# 83. Reference Client Behavior Contract

The canonical reference client MUST treat the simulated API as authoritative.

It MUST NOT:

- import seed arrays directly into screens;
- recalculate server/domain invariants independently as the final authority;
- mutate persisted entities outside domain/API services.

The client MAY calculate provisional display values while editing, but mutation responses are authoritative.

The reference client SHOULD use:

- URL-addressable list filters where useful;
- stable deep links;
- optimistic updates only where rollback is implemented;
- query invalidation or equivalent after cross-domain mutations.

A successful cross-domain command MUST become observable from related routes without resetting the demo.

Examples:

- posting payment updates invoice and customer finance summary;
- receiving a PO updates SKU availability;
- shipment updates order fulfillment and inventory;
- resolving a ticket updates support metrics;
- approval updates target transaction state.

---

# 84. Framework Strategy — Final Decision

Nexora Operations remains **one canonical product**.

V1 MUST have only one full reference client.

The canonical V1 client is **React**.

Angular is intentionally deferred to a parity/reference slice after the React product model is stable.

Naming for V1:

```text
apps/nexora
```

`apps/nexora` is the React application.

The app name SHOULD NOT encode `react` or `angular` until a second client exists.

Shared packages:

```text
packages/nexora-domain
packages/nexora-data
packages/nexora-api
```

If a second framework client is introduced later:

```text
apps/nexora-react
apps/nexora-angular
```

At that point the original `apps/nexora` is renamed to the relevant framework-specific name.

The parity client initially implements only:

```text
Application Shell
Dashboard
Customer List
Customer 360
Sales Order Workspace
Permission Matrix
```

No duplicated domain/data/backend implementation is allowed.

---

# 85. Recommended Shared Package Structure

```text
packages/nexora-domain/
  src/
    common/
      ids.ts
      money.ts
      quantity.ts
      time.ts
      errors.ts
    identity/
    crm/
    catalog/
    pricing/
    approvals/
    sales/
    inventory/
    fulfillment/
    procurement/
    finance/
    support/
    workflow/
    activity/
    analytics/
    permissions/
    index.ts

packages/nexora-data/
  src/
    seed/
      tenant/
      curated/
      generators/
      distributions/
      edge-cases/
    scenarios/
    persistence/
    projections/
    indexes/
    reset.ts
    index.ts

packages/nexora-api/
  src/
    application/
      commands/
      queries/
      authorization/
      transactions/
    transport/
      handlers/
      serialization/
      errors/
    simulation/
      latency/
      failures/
      idempotency/
    index.ts
```

The package names may follow repository naming conventions, but the dependency direction MUST remain:

```text
nexora-domain
     ^
     |
nexora-data
     ^
     |
nexora-api
     ^
     |
reference client
```

`nexora-domain` MUST NOT import from `nexora-data`, `nexora-api`, React, Angular, browser APIs, or UI packages.

---

# 86. Implementation Definition of Done

The domain foundation is implementation-ready when all of the following are true:

- canonical common types exist;
- all IDs and business-number formats are implemented;
- money/rounding helpers are covered by tests;
- quantity precision is enforced;
- demoClock is the only business-time source;
- permission catalog and personas are seeded;
- Product/SKU distinction is implemented;
- pricing and simplified tax calculation are deterministic;
- quote and order approval policies are implemented;
- order states are orthogonal as defined here;
- inventory uses ledger + reservations;
- shipment consumes reservation and inventory atomically;
- returns create the correct inventory/credit effects;
- PO receipt updates inbound and on-hand correctly;
- invoice generation prevents over-invoicing;
- payment allocation and reversal preserve invoice arithmetic;
- credit memo/refund rules preserve customer credit;
- SLA clocks use business-hour rules;
- generic approval engine is shared by all approval-requiring modules;
- workflow execution is idempotent and bounded;
- activity and audit are emitted by mutations;
- API errors use stable codes;
- optimistic concurrency is enforced;
- reset reproduces the exact seed;
- scenario application is deterministic;
- Meridian's cross-module story is internally consistent;
- KPI calculations reconcile with underlying records.

Once these conditions are met, screen implementation may proceed without redefining domain behavior.

---

# 87. Explicitly Deferred Capabilities

The following are intentionally outside V1 and MUST NOT be implicitly invented while implementing screens:

- general ledger;
- chart of accounts;
- double-entry bookkeeping;
- vendor bills/accounts payable;
- bank account balances;
- payroll;
- real tax-jurisdiction compliance;
- landed-cost accounting;
- lot/serial-number tracking;
- manufacturing/BOM/MRP;
- real carrier integration;
- real payment gateway;
- real email delivery;
- EDI;
- customer self-service portal;
- supplier portal;
- multi-entity consolidation;
- currency hedging;
- cross-currency payment allocation;
- advanced revenue recognition;
- legal credit-control compliance;
- warehouse wave planning;
- route optimization;
- field-service dispatch;
- subscription billing.

If a screen appears to require one of these capabilities, it should use a clearly simulated/read-only representation or be deferred rather than silently expanding the domain.

---

# 88. Final Implementation Position

After Part II, Nexora's implementation model is:

```text
                         Nexora Operations
                                  |
                 --------------------------------
                 |                              |
        Normative Domain Contract        Deterministic Seed
                 |                              |
                 -------- Application Services -
                                  |
                     Transaction / Projection Layer
                                  |
                         Simulated API Contract
                                  |
                       Canonical Reference Client
                                  |
                      UI Library Under Real Load
```

The critical implementation rules are:

1. **One product, one domain, one canonical dataset.**
2. **One full framework client in V1.**
3. **Product/SKU, order state, approval, finance, and inventory semantics are fixed by this contract.**
4. **All meaningful mutations execute as domain commands with atomic side effects.**
5. **Historical and cross-module consistency take priority over convenience fixtures.**
6. **The browser-only nature of the demo changes infrastructure, not domain coherence.**
7. **No production-grade ERP subsystems are added unless they materially improve the UI reference application's purpose.**

This document is now intended to be sufficient as the domain baseline for implementation. Any future changes should be treated as explicit product/domain changes, not as gaps that individual screen developers are expected to decide ad hoc.

---

# 89. Canonical Entity Schemas

This section removes any remaining ambiguity about persisted/shared domain shapes.

The interfaces are canonical domain contracts, not necessarily literal database table definitions. An IndexedDB adapter may normalize nested values internally, but API/domain semantics must remain equivalent.

## 89.1 Shared enums

```ts
type CustomerSegment = 'smb' | 'mid_market' | 'enterprise' | 'strategic';

type PaymentTermsCode = 'DUE_ON_RECEIPT' | 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60';

type OrderRiskFlag =
  | 'credit_limit_exceeded'
  | 'low_margin'
  | 'high_discount'
  | 'inventory_shortage'
  | 'requested_date_at_risk'
  | 'customer_on_hold'
  | 'overdue_receivables';
```

## 89.2 Organization

```ts
interface Organization {
  id: string;
  legalName: string;
  displayName: string;
  industry: string;
  primaryCurrency: 'USD';
  supportedCurrencies: CurrencyCode[];
  timezone: 'America/Chicago';
  fiscalYearStartMonth: 1;
  billingAddress: AddressSnapshot;
  operationalRegions: string[];
  status: 'active';
  metadata: EntityMetadata;
}
```

V1 fiscal year is calendar-year based and therefore starts in January.

## 89.3 User

```ts
interface User {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  department?: string;
  managerId?: string;
  status: UserStatus;
  locale: 'en-US';
  timezone: string;
  lastActiveAt?: string;
  notificationPreferences: {
    emailApprovals: boolean;
    emailMentions: boolean;
    inAppApprovals: true;
    inAppMentions: true;
    inAppOperationalAlerts: boolean;
  };
  metadata: EntityMetadata;
}
```

Email is unique case-insensitively inside the organization.

## 89.4 Team

```ts
interface Team {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type:
    'sales' | 'finance' | 'procurement' | 'warehouse' | 'support' | 'executive' | 'administration';
  status: 'active' | 'inactive';
  metadata: EntityMetadata;
}
```

## 89.5 Role

```ts
interface PermissionGrant {
  permission: string;
  defaultScope: 'all' | 'own' | 'team' | 'warehouse';
}

interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  grants: PermissionGrant[];
  metadata: EntityMetadata;
}
```

Seeded system roles may be viewed but SHOULD NOT be deletable.

## 89.6 Role assignment

```ts
interface RoleAssignment {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  scope: PermissionScope;
  createdAt: string;
  createdBy: string;
}
```

A user may have many role assignments. Effective permissions are the union of all grants whose scope matches the target resource.

## 89.7 Contact

```ts
interface Contact {
  id: string;
  organizationId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: 'email' | 'phone' | 'mobile';
  isPrimary: boolean;
  status: 'active' | 'inactive';
  lastContactedAt?: string;
  metadata: EntityMetadata;
}
```

## 89.8 Address

```ts
interface Address {
  id: string;
  organizationId: string;
  ownerType: 'customer' | 'supplier';
  ownerId: string;
  type: 'billing' | 'shipping' | 'headquarters' | 'service_location';
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  metadata: EntityMetadata;
}
```

Only one default address per owner/type is permitted.

Warehouse addresses are stored on Warehouse because warehouses are first-class operational sites rather than customer/supplier address-book entries.

## 89.9 Customer note

```ts
interface CustomerNote {
  id: string;
  organizationId: string;
  customerId: string;
  authorId: string;
  body: string;
  visibility: 'organization' | 'team' | 'private';
  teamId?: string;
  isPinned: boolean;
  mentionedUserIds: string[];
  attachmentIds: string[];
  metadata: EntityMetadata;
}
```

## 89.10 Category

```ts
interface Category {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  metadata: EntityMetadata;
}
```

Category hierarchy maximum depth in V1:

```text
4
```

Cycles are invalid.

## 89.11 Contract price

```ts
interface ContractPrice {
  id: string;
  organizationId: string;
  customerId: string;
  skuId: string;
  currency: CurrencyCode;
  unitPrice: Money;
  minimumQuantity?: Quantity;
  validFrom: string;
  validTo: string;
  metadata: EntityMetadata;
}
```

Overlapping active contract-price ranges for the same customer/SKU/currency are invalid.

## 89.12 Supplier

```ts
interface Supplier {
  id: string;
  organizationId: string;
  supplierNumber: string;
  legalName: string;
  displayName: string;
  status: 'active' | 'on_hold' | 'inactive';
  relationshipTier: 'standard' | 'preferred' | 'conditional';
  category: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  paymentTermsCode: PaymentTermsCode;
  supportedCurrencies: CurrencyCode[];
  preferredShippingTerms?: string;
  tags: string[];
  metadata: EntityMetadata;
}
```

The following are projections, not writable Supplier fields:

```text
onTimeDeliveryBps
qualityScore
averageLeadTimeDays
openPurchaseOrderCount
annualSpendUsd
```

## 89.13 Quote

```ts
interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string;
  customerId: string;
  contactId: string;
  ownerId: string;
  createdBusinessDate: string;
  expirationDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  priceListId: string;
  status: QuoteStatus;
  approvalRequestId?: string;
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  costTotal: Money;
  grossMargin: Money;
  grossMarginBps: number;
  notes?: string;
  terms?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  convertedOrderId?: string;
  metadata: EntityMetadata;
}
```

## 89.14 Quote line

```ts
interface QuoteLine {
  id: string;
  organizationId: string;
  quoteId: string;
  lineNumber: number;
  skuId: string;
  skuCode: string;
  description: string;
  unitOfMeasure: string;
  quantity: Quantity;
  listUnitPrice: Money;
  unitPrice: Money;
  discountBps: number;
  taxRateBps: number;
  unitCost: Money;
  netAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
}
```

Line number is unique within the quote and starts at `1`.

## 89.15 Warehouse

```ts
interface Warehouse {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  address: AddressSnapshot;
  managerId: string;
  timezone: string;
  capacityCubicMeters: number;
  status: 'operational' | 'restricted' | 'closed';
  metadata: EntityMetadata;
}
```

`closed` warehouses cannot receive allocations, transfers, shipments, or receipts.

`restricted` warehouses remain usable only for already-open operational work and manager-authorized adjustments/transfers.

## 89.16 Warehouse location

```ts
interface WarehouseLocation {
  id: string;
  organizationId: string;
  warehouseId: string;
  code: string;
  zone: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  type: 'storage' | 'receiving' | 'staging' | 'quarantine' | 'damaged';
  capacityCubicMeters?: number;
  status: 'active' | 'blocked';
  metadata: EntityMetadata;
}
```

A blocked location cannot receive new reservations or put-away.

## 89.17 Inventory balance projection

```ts
interface InventoryBalance {
  organizationId: string;
  skuId: string;
  warehouseId: string;
  locationId?: string;
  onHand: Quantity;
  damaged: Quantity;
  quarantine: Quantity;
  reserved: Quantity;
  available: Quantity;
  inbound: Quantity;
  safetyStock: Quantity;
  reorderPoint: Quantity;
  projectedAt: string;
}
```

There is no user mutation endpoint for this interface.

## 89.17.1 Stock movement

```ts
interface StockMovement {
  id: string;
  organizationId: string;
  type:
    | 'receipt'
    | 'shipment'
    | 'customer_return'
    | 'supplier_return'
    | 'transfer_out'
    | 'transfer_in'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'damage'
    | 'damage_reversal'
    | 'quarantine'
    | 'quarantine_release'
    | 'cycle_count_adjustment';
  skuId: string;
  warehouseId: string;
  locationId?: string;
  onHandDelta: SignedQuantity;
  damagedDelta: SignedQuantity;
  quarantineDelta: SignedQuantity;
  sourceEntityType: string;
  sourceEntityId: string;
  reason?: string;
  occurredAt: string;
  actorId: string;
}
```

Projection equation:

```text
onHand    = sum(onHandDelta)
damaged   = sum(damagedDelta)
quarantine = sum(quarantineDelta)
reserved  = active reservation remaining
available = onHand - damaged - quarantine - reserved
```

## 89.18 Inventory transfer

```ts
interface InventoryTransfer {
  id: string;
  organizationId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatus;
  requestedBy: string;
  requestedDate: string;
  shippedAt?: string;
  receivedAt?: string;
  notes?: string;
  metadata: EntityMetadata;
}
```

## 89.19 Inventory transfer line

```ts
interface InventoryTransferLine {
  id: string;
  organizationId: string;
  transferId: string;
  lineNumber: number;
  skuId: string;
  requestedQuantity: Quantity;
  shippedQuantity: Quantity;
  receivedQuantity: Quantity;
  damagedQuantity: Quantity;
  sourceLocationId?: string;
  destinationLocationId?: string;
}
```

## 89.20 Cycle count

```ts
interface CycleCount {
  id: string;
  organizationId: string;
  cycleCountNumber: string;
  warehouseId: string;
  status: 'planned' | 'in_progress' | 'submitted' | 'completed' | 'cancelled';
  assignedToIds: string[];
  plannedDate: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  approvalRequestId?: string;
  metadata: EntityMetadata;
}
```

## 89.21 Cycle count line

```ts
interface CycleCountLine {
  id: string;
  organizationId: string;
  cycleCountId: string;
  skuId: string;
  locationId: string;
  systemOnHand: Quantity;
  countedOnHand?: Quantity;
  variance?: Quantity;
  note?: string;
}
```

System on-hand is snapshotted when the count begins.

## 89.22 Shipment

```ts
interface Shipment {
  id: string;
  organizationId: string;
  shipmentNumber: string;
  orderId: string;
  warehouseId: string;
  carrier: string;
  service: string;
  trackingNumber?: string;
  status:
    | 'pending'
    | 'picking'
    | 'packed'
    | 'ready_to_ship'
    | 'shipped'
    | 'in_transit'
    | 'delivered'
    | 'exception'
    | 'returned'
    | 'cancelled';
  shippedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  exceptionCode?: string;
  exceptionMessage?: string;
  metadata: EntityMetadata;
}
```

## 89.23 Shipment line

```ts
interface ShipmentLine {
  id: string;
  organizationId: string;
  shipmentId: string;
  orderLineId: string;
  skuId: string;
  quantity: Quantity;
  reservationIds: string[];
  pickedQuantity: Quantity;
  packedQuantity: Quantity;
}
```

## 89.24 Return

```ts
interface Return {
  id: string;
  organizationId: string;
  returnNumber: string;
  orderId: string;
  customerId: string;
  status:
    | 'requested'
    | 'authorized'
    | 'in_transit'
    | 'received'
    | 'inspected'
    | 'completed'
    | 'rejected'
    | 'cancelled';
  requestedAt: string;
  authorizedAt?: string;
  receivedAt?: string;
  inspectedAt?: string;
  completedAt?: string;
  receivingWarehouseId: string;
  creditMemoId?: string;
  notes?: string;
  metadata: EntityMetadata;
}
```

## 89.25 Return line

```ts
interface ReturnLine {
  id: string;
  organizationId: string;
  returnId: string;
  orderLineId: string;
  shipmentLineId?: string;
  skuId: string;
  requestedQuantity: Quantity;
  receivedQuantity: Quantity;
  acceptedQuantity: Quantity;
  rejectedQuantity: Quantity;
  reason:
    | 'damaged'
    | 'wrong_item'
    | 'defective'
    | 'not_needed'
    | 'shipment_damage'
    | 'quality_issue'
    | 'other';
  disposition?: 'restock' | 'quarantine' | 'scrap' | 'return_to_supplier';
  unitCreditAmount?: Money;
}
```

## 89.26 Purchase order

```ts
interface PurchaseOrder {
  id: string;
  organizationId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  buyerId: string;
  destinationWarehouseId: string;
  status: PurchaseOrderStatus;
  exceptionFlags: Array<'delayed' | 'disputed'>;
  createdBusinessDate: string;
  expectedDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  subtotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  approvalRequestId?: string;
  supplierAcknowledgedAt?: string;
  notes?: string;
  metadata: EntityMetadata;
}
```

## 89.27 Goods receipt

```ts
interface GoodsReceipt {
  id: string;
  organizationId: string;
  receiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receivedBy: string;
  receivedAt: string;
  notes?: string;
  metadata: EntityMetadata;
}
```

## 89.28 Goods receipt line

```ts
interface GoodsReceiptLine {
  id: string;
  organizationId: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  skuId: string;
  acceptedQuantity: Quantity;
  damagedQuantity: Quantity;
  rejectedQuantity: Quantity;
  locationId?: string;
  note?: string;
}
```

## 89.29 Invoice

```ts
interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber?: string; // assigned/finalized when opened
  customerId: string;
  sourceOrderId?: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  fxRateToUsd?: string;
  lifecycle: 'draft' | 'open' | 'voided' | 'written_off';
  collectionState: 'current' | 'overdue' | 'disputed';
  billingContactId?: string;
  billingAddress: AddressSnapshot;
  customerPoNumber?: string;
  paymentTermsCode: PaymentTermsCode;
  subtotal: Money;
  taxTotal: Money;
  freight: Money;
  total: Money;
  writtenOffAmount: Money;
  sentAt?: string;
  disputeReason?: string;
  metadata: EntityMetadata;
}
```

`paidAmount`, `outstanding`, and settlement state are projections from allocations/credits/write-off.

## 89.30 Payment

```ts
interface Payment {
  id: string;
  organizationId: string;
  paymentNumber: string;
  customerId: string;
  amount: Money;
  fxRateToUsd?: string;
  method: 'ach' | 'wire' | 'credit_card' | 'check' | 'other';
  receivedDate: string;
  reference?: string;
  status: 'pending' | 'posted' | 'failed' | 'reversed';
  recordedBy: string;
  reversedAt?: string;
  reversalReason?: string;
  sourceBankTransactionId?: string;
  metadata: EntityMetadata;
}
```

## 89.31 Payment allocation

```ts
interface PaymentAllocation {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string;
  amount: Money;
  status: 'active' | 'reversed';
  createdAt: string;
  reversedAt?: string;
}
```

## 89.32 Credit memo

```ts
interface CreditMemo {
  id: string;
  organizationId: string;
  creditMemoNumber: string;
  customerId: string;
  sourceReturnId?: string;
  sourceInvoiceId?: string;
  reason: 'return' | 'pricing_correction' | 'service_recovery' | 'manual_adjustment';
  issueDate: string;
  currency: CurrencyCode;
  lifecycle: 'draft' | 'open' | 'fully_applied' | 'voided';
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  metadata: EntityMetadata;
}
```

## 89.33 Credit memo line

```ts
interface CreditMemoLine {
  id: string;
  organizationId: string;
  creditMemoId: string;
  invoiceLineId?: string;
  returnLineId?: string;
  description: string;
  quantity?: Quantity;
  amount: Money;
  taxAmount: Money;
}
```

## 89.34 Credit memo application

```ts
interface CreditMemoApplication {
  id: string;
  organizationId: string;
  creditMemoId: string;
  invoiceId: string;
  amount: Money;
  status: 'active' | 'reversed';
  createdAt: string;
  reversedAt?: string;
}
```

Internal ID prefix:

```text
cma
```

## 89.35 Refund

```ts
interface Refund {
  id: string;
  organizationId: string;
  refundNumber: string;
  customerId: string;
  creditMemoId?: string;
  paymentId?: string;
  amount: Money;
  method: 'ach' | 'wire' | 'credit_card' | 'check' | 'other';
  status: 'pending' | 'posted' | 'failed' | 'reversed';
  reason: string;
  postedAt?: string;
  metadata: EntityMetadata;
}
```

## 89.36 Support ticket

```ts
interface SupportTicket {
  id: string;
  organizationId: string;
  ticketNumber: string;
  customerId: string;
  contactId?: string;
  subject: string;
  description: string;
  channel: 'email' | 'phone' | 'portal' | 'chat' | 'internal';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status:
    'new' | 'open' | 'pending_customer' | 'pending_internal' | 'escalated' | 'resolved' | 'closed';
  assignedTeamId: string;
  assigneeId?: string;
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  relatedSkuId?: string;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionCode?: string;
  tags: string[];
  metadata: EntityMetadata;
}
```

## 89.37 Conversation message

```ts
interface ConversationMessage {
  id: string;
  organizationId: string;
  ticketId: string;
  authorType: 'user' | 'customer' | 'system';
  authorUserId?: string;
  authorContactId?: string;
  visibility: 'public' | 'internal';
  body: string;
  attachmentIds: string[];
  createdAt: string;
}
```

## 89.38 SLA event

```ts
interface SlaEvent {
  id: string;
  organizationId: string;
  ticketId: string;
  type:
    | 'first_response_started'
    | 'first_response_met'
    | 'first_response_breached'
    | 'resolution_started'
    | 'resolution_paused'
    | 'resolution_resumed'
    | 'resolution_met'
    | 'resolution_breached';
  occurredAt: string;
}
```

SLA events are system-generated and immutable.

## 89.39 Support macro

```ts
interface SupportMacro {
  id: string;
  organizationId: string;
  name: string;
  body: string;
  setStatus?: 'open' | 'pending_customer' | 'pending_internal' | 'resolved';
  addTags: string[];
  status: 'active' | 'inactive';
  metadata: EntityMetadata;
}
```

Using a macro only pre-fills/applies the specified reply/status/tag operations; it does not bypass normal ticket validation.

## 89.40 Workflow

```ts
interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'error' | 'archived';
  trigger: {
    type:
      | 'order.created'
      | 'order.confirmed'
      | 'order.value_changed'
      | 'invoice.overdue'
      | 'inventory.below_reorder_point'
      | 'ticket.escalated'
      | 'customer.status_changed'
      | 'schedule.daily'
      | 'schedule.weekly';
    config?: Record<string, unknown>;
  };
  conditions: ConditionNode;
  actions: Array<{
    type:
      | 'assign_user'
      | 'create_task'
      | 'send_notification'
      | 'request_approval'
      | 'add_tag'
      | 'remove_tag'
      | 'place_customer_on_hold'
      | 'place_order_on_hold'
      | 'create_purchase_order_draft';
    config: Record<string, unknown>;
  }>;
  ownerId: string;
  lastRunAt?: string;
  runCount: number;
  metadata: EntityMetadata;
}
```

## 89.41 Workflow run

```ts
interface WorkflowRun {
  id: string;
  organizationId: string;
  workflowId: string;
  triggerEventId: string;
  status: 'queued' | 'running' | 'succeeded' | 'partially_failed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  affectedEntityType?: string;
  affectedEntityId?: string;
  actionResults: Array<{
    actionIndex: number;
    status: 'succeeded' | 'failed' | 'skipped';
    errorCode?: string;
    message?: string;
  }>;
  errorCode?: string;
}
```

---

# 90. Conceptual Entities Superseded or Explicitly Deferred

Part I intentionally explored product concepts before the implementation model was fully normalized. The following mappings are authoritative.

| Part I concept                                           | V1 implementation                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Product Variant                                          | `Sku`; every Product has at least one SKU                            |
| Backordered product status                               | Derived availability condition, not master status                    |
| Customer Activity                                        | Shared `ActivityEvent`                                               |
| Supplier Performance                                     | Derived projection from POs/receipts                                 |
| Inventory Balance                                        | Derived projection from stock ledger + reservations                  |
| Allocation                                               | `InventoryReservation`                                               |
| Reconciliation Item                                      | `BankTransaction` plus matching projection                           |
| Approval state embedded independently in every module    | Shared `ApprovalRequest` / `ApprovalStep` engine                     |
| Trigger / Condition / Action as separate domain entities | Embedded workflow definitions                                        |
| SLA Event                                                | Immutable `SlaEvent` generated by SLA service                        |
| Contracts / Commercial Terms aggregate                   | No separate Contract aggregate; use customer terms + `ContractPrice` |
| Expense                                                  | Deferred from V1                                                     |
| Product `Backordered` lifecycle status                   | Removed; use availability projection                                 |
| Supplier `Preferred` lifecycle status                    | Removed; use `relationshipTier`                                      |

A developer MUST use the V1 implementation form in this table rather than creating both models.

---

# 91. Additional Domain Integrity Rules

## 91.1 Currency integrity

Within one transaction aggregate:

- all line Money values use the transaction currency;
- header totals use the same currency;
- standard cost snapshots on sales lines are converted into transaction currency at the aggregate FX snapshot when necessary;
- cross-currency aggregation is allowed only in analytics/reporting via USD conversion.

## 91.2 Rounding reconciliation

The header MUST equal the sum of rounded line values.

Never calculate a header independently from unrounded aggregate math and then force a discrepancy.

Any unavoidable one-cent allocation, such as distributing a header discount in a future feature, MUST be assigned deterministically to the highest-value eligible line. V1 does not include header percentage discounts, so this should rarely be needed.

## 91.3 Business-number immutability

Once a business number is assigned, it is immutable even if the record is cancelled, voided, or archived.

Sequences are never reused.

## 91.4 Person deactivation

Deactivating a user:

- blocks future authentication/persona selection;
- does not remove ownership or historical actor references;
- SHOULD require reassignment before the user can remain owner of active approvals/tasks;
- does not rewrite audit history.

## 91.5 Master-data archive rules

A customer cannot be archived while it has:

- open confirmed/on-hold orders;
- open invoices;
- unresolved support tickets.

A supplier cannot be archived while it has open POs.

A SKU cannot be archived/discontinued through the standard UI while it has open reservations or open PO quantities without an explicit replacement/cleanup flow.

## 91.6 Derived-state recalculation

After any mutation, the transaction service MUST recalculate all derived states affected by the mutation before commit.

Examples:

- order allocation/fulfillment/invoice/payment state;
- customer credit exposure;
- invoice collection/settlement state;
- SKU availability;
- PO receipt state;
- ticket SLA state where time/action changes it.

Derived state MUST NOT wait for the user to navigate away and back.

## 91.7 Read-model consistency

Within a completed command response, directly related read models MUST reflect the committed mutation.

The fake backend does not intentionally model eventual consistency except in an explicit future scenario.

---

# 92. Minimum Automated Domain Test Matrix

This is a domain-correctness matrix, not a UI-library coverage matrix.

At minimum, tests MUST prove:

### Money and pricing

- half-up rounding;
- line/header reconciliation;
- discount arithmetic;
- tax arithmetic;
- FX snapshot immutability;
- gross-margin calculation.

### Quote/order

- approval threshold boundaries;
- self-approval rejection;
- quote single conversion;
- confirmed-edit reapproval;
- hold prevents shipment;
- cancel releases reservations.

### Inventory

- allocation cannot exceed availability;
- deallocation restores availability;
- shipment consumes reservation and on-hand;
- receipt increases on-hand;
- damaged receipt does not increase sellable stock;
- transfer reduces source only when shipped and increases destination only when received;
- cycle-count completion creates exact adjustment.

### Fulfillment/returns

- shipment cannot exceed open order quantity;
- return cannot exceed fulfilled-minus-returned quantity;
- restock/quarantine/scrap dispositions have correct inventory effect;
- return credit memo does not exceed accepted returned value.

### Procurement

- PO approval threshold boundaries;
- buyer cannot self-approve;
- over-receipt tolerance;
- close-short removes inbound remainder.

### Finance

- no over-invoicing;
- payment cannot over-allocate;
- partial payment math;
- payment reversal reopens invoice;
- void blocked when allocations exist;
- write-off threshold;
- credit memo application math;
- refund limited by available credit.

### Support

- first response SLA stops on first public agent reply;
- internal note does not satisfy first response;
- pending customer pauses resolution SLA;
- pending internal does not pause;
- reopen behavior.

### Authorization/concurrency

- resource scope enforcement;
- forbidden mutation returns 403;
- stale version returns 409 and creates no side effects;
- idempotent retry does not duplicate command result.

### Determinism

- same seed + scenario + clock produces same flagship IDs, totals, and KPI values.

These tests are required because the reference application's realism depends on cross-domain arithmetic and state transitions remaining trustworthy.
