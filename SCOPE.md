# Scope boundary

## Included

The implementation is limited to the first delivery milestone described in
`CXOS-29441-cci-postpaid.pdf`, together with the relevant offer-management
foundations from `CXOS-25577-offer-management.pdf`:

- self-service configuration of single-line postpaid plans;
- core plan and add-on archetypes;
- service entitlements and fair-use caps;
- one recurring commercial price per listing;
- basic eligibility rules;
- postpaid billing, payment, tax, revenue-allocation, and fee choices needed to
  configure the offer;
- overage rates, because overage treatment is part of the governing offer model.

Two reviewed exceptions are intentionally carried into this package:

- the current Product listings table is included with all rows and its
  Promotions reference/count column;
- the line-count pricing switch and tier editor are included and labelled
  `CCI · Day 60`.

## Explicitly excluded

- broader multi-line offer configuration beyond the labelled price tiers;
- affinity and member cohorts, minimum-line rules, and group discounts;
- offer-to-offer relationship builders and downstream fulfilment references;
- end-to-end purchase, activation, consumption, bill-run, or runtime proof;
- pay-as-you-go usage rates;
- alternative pricing-model controls, exploratory options, and device-finance,
  lease, return, shipping, or penalty logic;
- promotion creation/management, discounts, engagement, portfolio, and unrelated
  application pages. Only the listing-table reference link is retained.

The exclusion list is deliberate. If an engineer needs one of these capabilities,
it should be taken from its own approved milestone rather than inferred from this
package.
