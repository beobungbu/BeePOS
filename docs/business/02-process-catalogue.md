# BeePOS Business Process Catalogue

## 1. Purpose and notation

This catalogue organizes retail business processes into L0/L1/L2 levels.

- **L0**: end-to-end value stream or enterprise process family.
- **L1**: major business process.
- **L2**: operational process suitable for SOP / BPMN elaboration.

The catalogue intentionally avoids software-screen names.

---

# L0-01 Merchandise-to-Market

## L1 01.1 Category and assortment management

- L2 Define category strategy
- L2 Define merchandise hierarchy
- L2 Analyze category performance
- L2 Plan assortment by store / cluster / channel
- L2 Introduce new product
- L2 Delist product
- L2 Manage seasonal assortment

## L1 01.2 Product information management

- L2 Create / approve product master
- L2 Maintain SKU and barcode information
- L2 Maintain units and packaging
- L2 Maintain brand / category attributes
- L2 Maintain tax classification
- L2 Maintain product status / lifecycle

## L1 01.3 Pricing

- L2 Establish regular selling price
- L2 Approve price change
- L2 Schedule future price
- L2 Maintain store / channel price differences
- L2 Execute markdown
- L2 Validate store price execution
- L2 Review price competitiveness / margin

## L1 01.4 Promotion

- L2 Define promotion objective and budget
- L2 Select products / stores / customers
- L2 Define promotion mechanics
- L2 Approve promotion
- L2 Publish / communicate promotion
- L2 Execute at store
- L2 Resolve promotion exception
- L2 Evaluate promotion results

---

# L0-02 Source-to-Receive

## L1 02.1 Supplier management

- L2 Identify supplier
- L2 Qualify / approve supplier
- L2 Maintain supplier commercial information
- L2 Maintain supplier-product terms
- L2 Review supplier performance
- L2 Suspend / reactivate supplier

## L1 02.2 Purchase planning

- L2 Review demand / stock requirement
- L2 Consolidate replenishment needs
- L2 Select supplier / source
- L2 Review supplier MOQ / pack / lead time
- L2 Prepare purchase recommendation
- L2 Approve purchase requirement

## L1 02.3 Purchase ordering

- L2 Create purchase order
- L2 Review / approve PO
- L2 Send PO to supplier
- L2 Receive supplier confirmation
- L2 Amend / cancel PO
- L2 Monitor open PO
- L2 Expedite delayed PO

KiotViet's retail purchase-order workflow explicitly covers planning an order, sending it, monitoring supplier confirmation, receiving and completing the transaction. Oracle Retail additionally models supplier constraints and various order/replenishment types.

## L1 02.4 Goods receiving

- L2 Prepare expected receipt
- L2 Identify PO / supplier delivery
- L2 Count delivered quantity
- L2 Check product / condition / expiry where relevant
- L2 Record shortage / overage / damage
- L2 Record actual purchase cost / additional cost
- L2 Accept / reject quantity
- L2 Post goods receipt
- L2 Produce discrepancy evidence
- L2 Update supplier payable basis

## L1 02.5 Supplier return

- L2 Identify returnable supplier stock
- L2 Obtain authorization where required
- L2 Pick / stage return
- L2 Dispatch return
- L2 record supplier credit / settlement adjustment

---

# L0-03 Plan-to-Replenish

## L1 03.1 Demand planning

- L2 Collect historical sales and stock data
- L2 Account for seasonality / promotion / events
- L2 Produce demand forecast
- L2 Review forecast exceptions
- L2 Approve / override forecast

## L1 03.2 Replenishment policy

- L2 Define replenishment method by SKU/location
- L2 Define min / max / target stock
- L2 Define reorder point
- L2 Define safety stock
- L2 Define order cycle / lead time
- L2 Define presentation / shelf stock where relevant

## L1 03.3 Replenishment execution

- L2 Identify replenishment need
- L2 Calculate recommended quantity
- L2 Apply pack / minimum / transport constraints
- L2 Determine source: supplier or warehouse
- L2 Generate recommendation / PO / transfer
- L2 Review exception
- L2 Approve replenishment
- L2 Monitor fulfillment

SAP describes replenishment using forecast or planned demand, current stock, planned receipts and target stock. Oracle notes that replenishment can create supplier purchase orders, warehouse-store transfers, or both.

---

# L0-04 Inventory-to-Availability

## L1 04.1 Inventory visibility

- L2 View stock by product and location
- L2 View available / reserved / in-transit stock
- L2 Identify low / zero / excessive stock
- L2 Identify stock aging / expiry risk

## L1 04.2 Store / warehouse transfer

- L2 Identify transfer need
- L2 Create transfer request
- L2 Approve transfer
- L2 Pick source stock
- L2 Dispatch transfer
- L2 Track in-transit stock
- L2 Receive destination transfer
- L2 resolve shortage / damage

## L1 04.3 Stock counting

- L2 Plan full / cycle count
- L2 Freeze or control stock movement as required
- L2 Count physical stock
- L2 Recount exception
- L2 Review variance
- L2 Approve adjustment
- L2 Post inventory correction
- L2 investigate significant shrinkage

## L1 04.4 Inventory adjustment

- L2 Record damage
- L2 Record expiry / spoilage
- L2 Record loss / shrinkage
- L2 Record found stock
- L2 Record authorized manual correction
- L2 Approve high-risk adjustment

---

# L0-05 Replenish-to-Shelf

## L1 05.1 Store receiving

- L2 Receive supplier / DC delivery
- L2 check delivery documents
- L2 check quantity and condition
- L2 stage goods
- L2 update store inventory
- L2 resolve discrepancy

## L1 05.2 Backroom-to-shelf replenishment

- L2 detect shelf need
- L2 pick backroom stock
- L2 replenish shelf
- L2 rotate stock / FEFO where required
- L2 check labels / price communication
- L2 record unavailable stock / shelf gap

## L1 05.3 Store execution

- L2 execute merchandising / display
- L2 execute promotion materials
- L2 execute markdown / price label changes
- L2 conduct availability walk
- L2 resolve shelf availability issue

---

# L0-06 Customer-to-Cash (Retail Store)

## L1 06.1 Register / shift opening

- L2 assign cashier / register
- L2 count opening float
- L2 confirm register readiness
- L2 open shift

## L1 06.2 Sale transaction

- L2 identify / scan item
- L2 determine quantity
- L2 identify customer if applicable
- L2 determine applicable price
- L2 apply promotion
- L2 request / approve manual discount if needed
- L2 calculate tax and total
- L2 accept tender
- L2 issue receipt / invoice
- L2 complete sale

## L1 06.3 Tender and payment

- L2 accept cash
- L2 accept card / bank / QR
- L2 accept loyalty redemption where applicable
- L2 split payment
- L2 calculate change
- L2 handle failed / cancelled payment

## L1 06.4 Suspend / void / correction

- L2 suspend basket
- L2 resume basket
- L2 void line
- L2 void transaction before completion
- L2 obtain manager override where required

## L1 06.5 Shift / register close

- L2 stop selling / close register session
- L2 count cash
- L2 reconcile tenders
- L2 record variance
- L2 review / approve variance
- L2 generate shift / day summary
- L2 prepare cash handover / deposit

---

# L0-07 Return-to-Resolution

## L1 07.1 Customer return eligibility

- L2 identify original sale where possible
- L2 validate return window / condition
- L2 determine item returnability
- L2 determine return price / benefit treatment
- L2 obtain authorization for exception

## L1 07.2 Return / exchange execution

- L2 receive returned item
- L2 select refund / exchange outcome
- L2 calculate refund
- L2 reverse / adjust loyalty benefit
- L2 issue refund
- L2 produce return document

## L1 07.3 Returned-stock disposition

- L2 inspect item condition
- L2 return to saleable stock
- L2 quarantine damaged item
- L2 return to supplier
- L2 dispose / write off

---

# L0-08 Cash-and-Tender-to-Reconciliation

## L1 08.1 Store cash movement

- L2 add opening float
- L2 record paid-in
- L2 record paid-out
- L2 record safe drop
- L2 record authorized correction

## L1 08.2 Tender reconciliation

- L2 calculate expected cash
- L2 count actual cash
- L2 compare cash variance
- L2 reconcile card / bank / QR settlement
- L2 investigate tender difference
- L2 approve close

## L1 08.3 Business day close

- L2 confirm all shifts addressed
- L2 confirm unresolved transactions
- L2 confirm tender reconciliation
- L2 produce day sales summary
- L2 close business day

---

# L0-09 Customer-to-Loyalty

## L1 09.1 Customer management

- L2 enroll customer
- L2 verify / update contact information
- L2 manage consent
- L2 review purchase history
- L2 classify / segment customer

## L1 09.2 Loyalty

- L2 calculate earn eligibility
- L2 award points / benefits
- L2 redeem points / benefits
- L2 reverse benefits on return
- L2 adjust points with authorization
- L2 manage customer tier

---

# L0-10 Sales-to-Assurance

## L1 10.1 Sales audit

- L2 identify missing transaction
- L2 identify duplicate transaction
- L2 identify invalid / suspicious transaction
- L2 reconcile sales with tender
- L2 resolve transaction exception
- L2 release clean sales data for reporting/accounting

Oracle Retail Sales Audit uses this pattern explicitly: checking multi-channel sales for missing, duplicate, erroneous or suspicious data so downstream systems operate from cleansed sales information.

## L1 10.2 Operational exception management

- L2 low stock exception
- L2 negative stock exception
- L2 overdue PO exception
- L2 receiving discrepancy exception
- L2 excessive discount exception
- L2 high refund exception
- L2 cash variance exception
- L2 unusual stock adjustment exception

---

# L0-11 Record-to-Performance

## L1 11.1 Operational reporting

- L2 daily sales
- L2 store comparison
- L2 category / SKU performance
- L2 gross margin
- L2 average basket
- L2 stock availability
- L2 inventory aging
- L2 shrinkage
- L2 cashier performance
- L2 supplier service performance

## L1 11.2 Management review

- L2 review KPI versus target
- L2 identify material variance
- L2 assign corrective action
- L2 monitor action completion

---

# L0-12 Wholesale Order-to-Cash — later scope

- Manage B2B customer
- Maintain commercial terms
- Create quotation / sales order
- Check credit
- Reserve / allocate stock
- Pick / pack / deliver
- Invoice
- Collect payment
- Manage receivable / aging
- Handle B2B return

---

# L0-13 Distributor / Route-to-Market — later scope

- Manage distributor / dealer hierarchy
- Manage territory
- Set sales target
- Perform pre-sales / route sales
- Fulfill dealer order
- Monitor sell-in / sell-out
- Manage distributor stock
- Manage rebate / trade promotion
- Manage distributor receivable

## 2. Research priorities for detailed SOP/BPMN

The next detailed process specifications should be developed in this order:

1. Source-to-Receive
2. Inventory-to-Availability
3. Replenish-to-Shelf
4. Customer-to-Cash
5. Return-to-Resolution
6. Cash-and-Tender-to-Reconciliation
7. Merchandise-to-Market: pricing/promotion
8. Plan-to-Replenish
9. Sales-to-Assurance

These processes contain the highest operational risk and determine most of the business requirements that a POS/retail platform must eventually support.
