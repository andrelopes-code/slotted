import type { Store } from './store';

/** Child indexes used across projections, queries and commands. */
export function createIndexes(store: Store) {
  return {
    linesByOrder: store.index('linesByOrder', 'salesOrderLines', (line) => line.orderId),
    linesBySkuWarehouse: store.index(
      'linesBySkuWarehouse',
      'salesOrderLines',
      (line) => `${line.skuId}:${line.preferredWarehouseId}`,
    ),
    ordersByCustomer: store.index('ordersByCustomer', 'salesOrders', (order) => order.customerId),
    ordersByOwner: store.index('ordersByOwner', 'salesOrders', (order) => order.ownerId),
    quotesByCustomer: store.index('quotesByCustomer', 'quotes', (quote) => quote.customerId),
    quoteLinesByQuote: store.index('quoteLinesByQuote', 'quoteLines', (line) => line.quoteId),
    contactsByCustomer: store.index(
      'contactsByCustomer',
      'contacts',
      (contact) => contact.customerId,
    ),
    addressesByOwner: store.index('addressesByOwner', 'addresses', (address) => address.ownerId),
    notesByCustomer: store.index('notesByCustomer', 'customerNotes', (note) => note.customerId),
    contractPricesByCustomer: store.index(
      'contractPricesByCustomer',
      'contractPrices',
      (price) => price.customerId,
    ),
    reservationsByOrder: store.index(
      'reservationsByOrder',
      'reservations',
      (reservation) => reservation.orderId,
    ),
    reservationsByLine: store.index(
      'reservationsByLine',
      'reservations',
      (reservation) => reservation.orderLineId,
    ),
    reservationsBySkuWarehouse: store.index(
      'reservationsBySkuWarehouse',
      'reservations',
      (reservation) => `${reservation.skuId}:${reservation.warehouseId}`,
    ),
    movementsBySkuWarehouse: store.index(
      'movementsBySkuWarehouse',
      'stockMovements',
      (movement) => `${movement.skuId}:${movement.warehouseId}`,
    ),
    movementsBySku: store.index('movementsBySku', 'stockMovements', (movement) => movement.skuId),
    shipmentsByOrder: store.index('shipmentsByOrder', 'shipments', (shipment) => shipment.orderId),
    shipmentLinesByShipment: store.index(
      'shipmentLinesByShipment',
      'shipmentLines',
      (line) => line.shipmentId,
    ),
    shipmentLinesByOrderLine: store.index(
      'shipmentLinesByOrderLine',
      'shipmentLines',
      (line) => line.orderLineId,
    ),
    returnsByOrder: store.index('returnsByOrder', 'returns', (ret) => ret.orderId),
    returnLinesByReturn: store.index('returnLinesByReturn', 'returnLines', (line) => line.returnId),
    invoicesByOrder: store.index('invoicesByOrder', 'invoices', (invoice) => invoice.sourceOrderId),
    invoicesByCustomer: store.index(
      'invoicesByCustomer',
      'invoices',
      (invoice) => invoice.customerId,
    ),
    invoiceLinesByInvoice: store.index(
      'invoiceLinesByInvoice',
      'invoiceLines',
      (line) => line.invoiceId,
    ),
    invoiceLinesByOrderLine: store.index(
      'invoiceLinesByOrderLine',
      'invoiceLines',
      (line) => line.orderLineId,
    ),
    paymentsByCustomer: store.index(
      'paymentsByCustomer',
      'payments',
      (payment) => payment.customerId,
    ),
    allocationsByPayment: store.index(
      'allocationsByPayment',
      'paymentAllocations',
      (allocation) => allocation.paymentId,
    ),
    allocationsByInvoice: store.index(
      'allocationsByInvoice',
      'paymentAllocations',
      (allocation) => allocation.invoiceId,
    ),
    creditMemosByCustomer: store.index(
      'creditMemosByCustomer',
      'creditMemos',
      (memo) => memo.customerId,
    ),
    creditMemoLinesByMemo: store.index(
      'creditMemoLinesByMemo',
      'creditMemoLines',
      (line) => line.creditMemoId,
    ),
    applicationsByMemo: store.index(
      'applicationsByMemo',
      'creditMemoApplications',
      (application) => application.creditMemoId,
    ),
    applicationsByInvoice: store.index(
      'applicationsByInvoice',
      'creditMemoApplications',
      (application) => application.invoiceId,
    ),
    refundsByCustomer: store.index('refundsByCustomer', 'refunds', (refund) => refund.customerId),
    purchaseOrdersBySupplier: store.index(
      'purchaseOrdersBySupplier',
      'purchaseOrders',
      (po) => po.supplierId,
    ),
    poLinesByPo: store.index('poLinesByPo', 'purchaseOrderLines', (line) => line.purchaseOrderId),
    poLinesBySku: store.index('poLinesBySku', 'purchaseOrderLines', (line) => line.skuId),
    receiptsByPo: store.index(
      'receiptsByPo',
      'goodsReceipts',
      (receipt) => receipt.purchaseOrderId,
    ),
    receiptLinesByReceipt: store.index(
      'receiptLinesByReceipt',
      'goodsReceiptLines',
      (line) => line.goodsReceiptId,
    ),
    receiptLinesByPoLine: store.index(
      'receiptLinesByPoLine',
      'goodsReceiptLines',
      (line) => line.purchaseOrderLineId,
    ),
    mappingsBySku: store.index('mappingsBySku', 'supplierSkuMappings', (mapping) => mapping.skuId),
    mappingsBySupplier: store.index(
      'mappingsBySupplier',
      'supplierSkuMappings',
      (mapping) => mapping.supplierId,
    ),
    skusByProduct: store.index('skusByProduct', 'skus', (sku) => sku.productId),
    priceEntriesBySku: store.index('priceEntriesBySku', 'priceListEntries', (entry) => entry.skuId),
    priceEntriesByList: store.index(
      'priceEntriesByList',
      'priceListEntries',
      (entry) => entry.priceListId,
    ),
    ticketsByCustomer: store.index('ticketsByCustomer', 'tickets', (ticket) => ticket.customerId),
    ticketsByOrder: store.index('ticketsByOrder', 'tickets', (ticket) => ticket.relatedOrderId),
    messagesByTicket: store.index(
      'messagesByTicket',
      'conversationMessages',
      (message) => message.ticketId,
    ),
    slaEventsByTicket: store.index('slaEventsByTicket', 'slaEvents', (event) => event.ticketId),
    transferLinesByTransfer: store.index(
      'transferLinesByTransfer',
      'transferLines',
      (line) => line.transferId,
    ),
    transferLinesBySku: store.index('transferLinesBySku', 'transferLines', (line) => line.skuId),
    cycleCountLinesByCount: store.index(
      'cycleCountLinesByCount',
      'cycleCountLines',
      (line) => line.cycleCountId,
    ),
    locationsByWarehouse: store.index(
      'locationsByWarehouse',
      'warehouseLocations',
      (location) => location.warehouseId,
    ),
    runsByWorkflow: store.index('runsByWorkflow', 'workflowRuns', (run) => run.workflowId),
    notificationsByUser: store.index(
      'notificationsByUser',
      'notifications',
      (notification) => notification.userId,
    ),
    tasksByAssignee: store.index('tasksByAssignee', 'tasks', (task) => task.assigneeId),
    savedViewsByUser: store.index('savedViewsByUser', 'savedViews', (view) => view.userId),
    roleAssignmentsByUser: store.index(
      'roleAssignmentsByUser',
      'roleAssignments',
      (assignment) => assignment.userId,
    ),
    approvalsByTarget: store.index(
      'approvalsByTarget',
      'approvalRequests',
      (request) => request.targetId,
    ),
    auditByEntity: store.index('auditByEntity', 'auditEvents', (event) => event.entityId),
  };
}

export type Indexes = ReturnType<typeof createIndexes>;
