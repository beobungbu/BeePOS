# P11 — Grocery Quality, Expiry & Waste Management

Status: Business process specification · working baseline

## 1. Business purpose

Grocery Quality, Expiry & Waste Management protects customer safety, product quality, margin and inventory integrity for date-sensitive, perishable or condition-sensitive merchandise.

The business must distinguish normal commercial stock from goods that are:

- short-dated;
- expired;
- damaged;
- temperature-abused;
- recalled;
- quarantined;
- spoiled;
- unsaleable for quality reasons.

Waste is not simply “inventory shrinkage”. Where cause is known, it should be measured and managed separately from unexplained loss.

## 2. Scope

Includes:

- receiving quality checks;
- minimum remaining shelf-life policy;
- lot/batch/expiry control where relevant;
- storage/temperature condition control;
- FEFO/FIFO shelf rotation;
- near-expiry identification and action;
- damage/spoilage/waste recording;
- quarantine and release;
- product withdrawal/recall;
- disposal/return-to-supplier;
- waste/quality KPI review.

## 3. Actors

| Actor | Responsibility |
|---|---|
| Quality / Food Safety | defines safety/quality policy and manages incidents |
| Category Manager | commercial shelf-life and markdown/exit decisions |
| Buyer / Supplier Manager | supplier quality claim and corrective action |
| Receiver | checks condition and shelf life at receipt |
| Store Manager | local quality accountability |
| Store Stock Staff | rotation, inspection, removal, waste handling |
| Inventory Control | records stock disposition and variance evidence |
| Loss Prevention / Internal Control | distinguishes known waste from unexplained loss |
| Supplier | provides product quality / lot / recall information |

## 4. Quality-control dimensions

Not every grocery item requires the same controls. Policy may depend on category:

- remaining shelf life;
- expiry/best-before date;
- production/batch/lot;
- storage temperature;
- cold-chain evidence;
- packaging integrity;
- freshness/visual quality;
- allergen/label compliance;
- country/category legal requirements.

## 5. Receiving quality process

1. Identify product/category quality requirements.
2. Check transport/storage condition where relevant.
3. Inspect packaging integrity.
4. Verify expiry / remaining shelf life where policy requires.
5. Verify lot/batch information where traceability is required.
6. Separate accepted, conditionally accepted, quarantined and rejected quantities.
7. Record quality reason/evidence for exception.
8. Notify buyer/supplier for claim where applicable.
9. Only accepted/released quantity becomes normal saleable inventory.

## 6. Minimum remaining shelf life

A product can be legally unexpired but commercially unacceptable for receipt if too little saleable life remains.

Example:

- manufacturer shelf life = 180 days;
- retailer minimum remaining life at receipt = 90 days;
- supplier delivers goods with only 35 days remaining.

The correct business question is not “is it expired?” but “can the retailer reasonably sell it within agreed quality/service policy?”

Policy may vary by category, supplier and channel.

## 7. FEFO / FIFO execution

### FEFO

First Expiry, First Out: stock with the earliest expiry should normally be sold/moved first.

### FIFO

First In, First Out: oldest received stock moves first where expiry dates are not the controlling characteristic.

Store execution:

1. inspect shelf/backroom date sequence;
2. move older/earlier-expiry stock forward;
3. place newer stock behind/after it;
4. remove expired/unsaleable goods;
5. record exceptions;
6. investigate repeat failures.

## 8. Near-expiry process

1. Identify stock approaching configured shelf-life threshold.
2. Quantify units/value and likely sell-through before expiry.
3. Choose action:
   - continue normal sale;
   - markdown;
   - targeted promotion;
   - transfer to higher-velocity store;
   - supplier return;
   - donate where policy/legal conditions allow;
   - planned disposal.
4. Approve material margin/write-off impact where required.
5. Execute action.
6. Review remaining exposure.

The objective is not always “sell at any price”; food-safety, brand and legal constraints prevail.

## 9. Waste / spoilage process

Known waste reasons may include:

- expiry;
- spoilage;
- breakage;
- damaged packaging;
- temperature failure;
- preparation/handling loss;
- pest/environmental damage;
- recall destruction;
- customer/store handling damage;
- quality rejection discovered after receipt.

Flow:

1. Identify unsaleable quantity.
2. Remove from customer-accessible stock promptly.
3. Classify reason.
4. Verify quantity/value.
5. Obtain approval/evidence according to threshold.
6. Determine disposition: dispose, supplier return, quarantine, donation, etc.
7. Complete disposal/return evidence.
8. Review root cause where material/repeated.

Oracle Food & Beverage waste guidance explicitly treats breakage, spoilage and expiration as trackable waste reasons, reinforcing the value of known-cause classification instead of hiding all loss under generic shrinkage.

## 10. Waste versus shrinkage

Useful distinction:

- **Known waste** — reason is known and documented (expiry, breakage, spoilage).
- **Known operational adjustment** — documented inventory correction for a known event.
- **Unexplained shrinkage** — physical loss cannot be explained by known recorded events.

If known waste is not recorded, it later appears as unexplained stock variance, weakening both food-waste management and loss-prevention analysis.

## 11. Quarantine process

Quarantine is for stock physically present but not approved for sale/use pending decision.

Triggers:

- suspected quality defect;
- damaged packaging;
- uncertain temperature exposure;
- supplier alert;
- recall investigation;
- unidentified lot/batch;
- customer complaint requiring investigation.

Flow:

1. identify affected stock;
2. physically segregate where practical;
3. block normal sale/use;
4. record reason and affected quantity/lot;
5. investigate/await supplier/quality decision;
6. release, return or dispose;
7. retain decision evidence.

## 12. Recall / withdrawal process

### Trigger

- supplier recall;
- regulator instruction;
- internal quality finding;
- contamination/allergen concern;
- critical labeling error.

### Flow

1. Validate recall notice and affected product/lot/date scope.
2. Immediately stop sale/distribution where required.
3. Communicate to all affected stores/locations/channels.
4. Identify on-hand, in-transit and possibly sold quantities where traceability permits.
5. Remove/quarantine affected stock.
6. Confirm location completion / quantity removed.
7. Return/dispose under recall instruction.
8. Handle customer communication/refund where required.
9. Reconcile expected affected stock versus recovered/removed quantity.
10. Close incident only after quality/compliance owner approval.

## 13. Quality incident severity

Example tiers:

### Critical

Potential customer safety/regulatory risk; immediate stop-sale/recall.

### High

Material quality defect, likely broad customer impact but not immediate safety threat.

### Medium

Localized quality/packaging/shelf-life nonconformance.

### Low

Minor defect suitable for routine supplier/store corrective action.

Exact taxonomy belongs to retailer quality policy.

## 14. Exceptions

| Exception | Business response |
|---|---|
| Expiry data missing on controlled category | quarantine / master/supplier resolution |
| Mixed lots with different expiry | preserve distinct handling where traceability needed |
| Near-expiry goods delivered | receipt policy / supplier claim |
| Store finds expired item on shelf | remove immediately, count, investigate rotation failure |
| Temperature excursion | quarantine and quality decision |
| Recall affects in-transit stock | intercept/hold destination receipt |
| Disposal quantity unusually high | manager/quality review |
| Waste recorded after count discrepancy | evidence required to avoid retroactive concealment |
| Supplier repeatedly short-dates | supplier performance escalation |

## 15. Controls

Recommended baseline:

- category-specific shelf-life rules;
- expiry/lot capture where business/legal risk warrants;
- FEFO execution for date-sensitive stock;
- expired goods removed from sale promptly;
- quarantine physically/operationally distinguishable;
- disposal requires reason and evidence above threshold;
- recall completion tracked by location;
- supplier quality claims monitored;
- known waste recorded separately from unexplained shrinkage;
- repeated expiry/waste feeds assortment/replenishment review.

## 16. KPI framework

### Quality

- quality rejection rate at receiving;
- customer quality complaint rate;
- supplier defect rate;
- recall incident count;
- recall completion time.

### Shelf life

- short-dated receipt rate;
- near-expiry inventory value;
- expired stock value;
- FEFO/rotation compliance.

### Waste

- waste value / sales;
- waste units/value by reason;
- expiry waste %;
- spoilage/breakage %;
- waste recovery / supplier credit value.

### Root cause

- waste by supplier;
- waste by category/SKU;
- waste by store;
- repeated incident rate;
- unknown shrinkage after known waste is excluded.

## 17. Management questions

- Which categories/stores create the most expiry waste?
- Are suppliers delivering acceptable remaining shelf life?
- Which products should have lower replenishment targets due to waste?
- How much waste is recovered through supplier claims?
- Which stores repeatedly fail FEFO rotation?
- How quickly can the chain execute a recall?
- Can the retailer identify affected inventory by lot/date where needed?
- Is “shrinkage” hiding avoidable operational waste?

## 18. Worked example

A yogurt SKU has 20 units on shelf expiring in 5 days and 50 units in backroom expiring in 20 days.

Daily sales average 4 units.

Without action, the 20 earliest units could sell within 5 days if FEFO is executed properly. If staff replenish shelf using newer backroom stock first, the older batch may expire despite total demand being adequate.

This is a store-execution failure, not necessarily a forecasting failure.

## 19. Research anchors

- Oracle Inventory Management, expiration/grade attributes: https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/25c/famml/how-you-manage-product-genealogy-with-lot-and-serial.html
- Oracle Food and Beverage inventory/waste documentation: https://docs.oracle.com/en/industries/food-beverage/inventory-management/
- SAP S/4HANA shelf-life/expiration inventory concepts: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/3556c1e9d31c48c5b026aa0f4695d7f2/3ac9b65334e6b54ce10000000a174cb4.html

## 20. Open business-policy questions

- Which categories require expiry and/or lot tracking?
- Minimum remaining shelf life by category/supplier?
- Which products use FEFO vs FIFO?
- When does near-expiry stock trigger markdown/transfer?
- Who may approve disposal above value threshold?
- Is donation permitted and under what conditions?
- What is the quarantine release authority?
- How is temperature-control evidence handled?
- What recall traceability level is required?
- How are supplier credits for waste/quality claims pursued?
