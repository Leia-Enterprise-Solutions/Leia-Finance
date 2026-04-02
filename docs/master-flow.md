# Finance Management & Monitoring System v1
## Master Workflow (Mermaid Source)

This file contains the corrected large Mermaid workflow aligned to the latest **Finance Management & Monitoring System v1 UI Blueprint**.

Canonical scope note:
- This workflow is a downstream operational visualization artifact.
- It does not override module ownership defined in `00`, `00A`, `01`.
- Any direct cash/reconciliation branch in this file is treated as adjacent/transitional support path, not as a new top-level canonical module.

### Main corrections applied
- Fixed the obvious typo: `marSSked` -> `marked`
- Removed duplicate/conflicting exception node IDs that would break or confuse Mermaid parsing
- Aligned the workflow to the blueprint's canonical separations:
  - `billable work -> invoice draft -> issued receivable -> collected cash`
  - `purchase request -> approved commitment -> supplier bill -> paid cash out`
- Added explicit references to the actual UI surfaces from the blueprint:
  - `Invoice Drafts List`
  - `Invoice Draft Builder`
  - `Invoices List`
  - `Invoice Detail`
  - `Collections / Receivables`
  - `Purchase Requests List`
  - `Purchase Request Detail / Approval`
  - `Supplier Bills List / Bill Detail`
  - `Payments Queue`
  - `Budget Overview`
  - `Employee Cost View`
  - `Audit Trail`
- Kept the flow operational and UI-aligned without inventing backend schema or accounting engine behavior

![diagram](./../../docs/diagrams/_rendered/from_md/master-flow./master-flow.-1.svg)
