# 06 — Purchase Requests / Commitments Module

## 1. Σκοπός του εγγράφου

Το παρόν έγγραφο ορίζει το `Purchase Requests / Commitments Module` σε επίπεδο module canon: role/boundaries, core concepts (request/approval/commitment), local lifecycle/status vocabulary, approval readiness gate, commitment visibility προς `Controls`, και handoff προς `Spend / Supplier Bills`.
Δεν αποτελεί semantic-law (αυτό ορίζεται στο `00A`) ούτε module map (αυτό ορίζεται στο `01`) ούτε UI blueprint.

---

## 2. Ρόλος και upstream spend boundary

Το module καλύπτει το upstream spend initiation/approval layer: από την καταγραφή ανάγκης δαπάνης έως την απόδοση απόφασης που δημιουργεί **commitment visibility**, πριν από οποιαδήποτε supplier-side obligation.

Module truth:
- Οργανώνει `Purchase Request` (spend intent) και `Approval Decision`.
- Δημιουργεί `Commitment` ως distinct concept/visibility μετά από έγκριση.
- Παράγει downstream linkage context προς `Spend / Supplier Bills` (όχι supplier obligation truth).

Boundaries (τι δεν είναι):
- Δεν είναι `Spend / Supplier Bills` (supplier obligation + readiness).
- Δεν είναι `Payments Queue` (execution).
- Δεν είναι `Controls/Budget` module· τροφοδοτεί visibility, δεν “αποφασίζει” το control model.
- Δεν εκτελεί πληρωμές και δεν κατέχει payable truth.

---

## 3. Canonical constraints που εφαρμόζει (ως references)

Το module εφαρμόζει (χωρίς να τα επαναορίζει) τους canonical κανόνες των `00A/01`:
- **Commitment ως ξεχωριστό concept** (όχι bill, όχι payment).
- **Commitment relief / anti-overlap discipline** σε monitoring/control (κανόνας στο `00A`).
- **State-family separation**: status/outcome/signals/UI-only δεν συγχωνεύονται.

---

## 4. Core concepts (capsule)

- `Purchase Request`: τεκμηριωμένο upstream αίτημα δαπάνης.
- `Approval Context`: approver, reason, comments, required evidence.
- `Approval Decision`: `Approve`, `Reject`, `Request Changes`.
- `Commitment`: εγκεκριμένη δέσμευση (budgetary truth/visibility) πριν το supplier bill.
- `Commitment Visibility`: παρουσία σε `Controls`/monitoring και ως reference για downstream linkage.
- `Downstream Linkage Context`: γέφυρα προς `Spend / Supplier Bills` για μελλοντική σύνδεση.

---

## 5. Inputs και outputs (module-level)

Inputs:
- spend need + requester/department/cost center context
- amount/currency + category/reason/urgency
- supplier context (όπου υπάρχει ή απαιτείται από policy)
- attachments/evidence (όπου απαιτείται)

Outputs:
- approval outcome (approve/reject/request changes) + traceability
- commitment visibility προς `Controls` (`Budget`) και monitoring surfaces
- downstream linkage context προς `Spend / Supplier Bills`

---

## 6. Module surfaces (όχι UI spec)

- `Purchase Requests List`: upstream triage worklist (review/approval pressure).
- `Purchase Request Detail / Approval View`: single-record decision surface για approve/reject/request changes.

---

## 7. Core flow (local)

```mermaid
flowchart LR
    N[Spend Need]
    PR[Purchase Request]
    RV[Review & Completeness]
    AD[Approval Decision]
    CM[Commitment Visibility]
    HL[Downstream Linkage Context]

    N --> PR --> RV --> AD
    AD --> CM --> HL
```

Flow capsule:
- Καταγραφή request → triage/review → decision outcome.
- `Approve` → commitment visibility + downstream linkage eligibility.
- `Reject`/`Request Changes` → no active commitment, αλλά traceable outcome.
- Controlled revision/cancellation δεν “ξαναγράφει” downstream truth.

---

## 8. Lifecycle & status vocabulary (module-specific)

**Persisted request statuses**
- `Draft`
- `Submitted`
- `Approved`
- `Rejected`
- `Cancelled`

**Approval outcomes**
- `Approve`
- `Reject`
- `Request Changes`

**Commitment meaning**
- `Approved` ⇒ `Committed` (semantic meaning στο module)

**Operational signals (examples)**
- `Urgent`
- `Missing Attachment`
- `Budget Warning`
- `Budget Breach`
- `Waiting for Revision`
- `Linked to Supplier Bill`
- `No Linked Supplier Bill Yet`

**UI-only flags (examples)**
- `Selected`
- `Expanded`
- `Inline Validation Error`
- `Approval Panel Active`

Απαγορεύεται η σύγχυση:
- request status με supplier bill status,
- commitment meaning με payable readiness,
- budget signal με persisted status,
- linkage visibility με approval outcome.

---

## 9. Approval readiness gate (semantic minimum)

Για να δοθεί `Approve` (και άρα commitment visibility), το module πρέπει να εκθέτει ελάχιστα:
- σαφή request identity + requester context
- amount + spend reason/category
- επαρκή justification
- required evidence/attachments όπου η policy το απαιτεί
- traceable approval actor/outcome
- απουσία blocking ambiguity που θα έκανε ασαφές το commitment meaning

Αν κάτι λείπει: `Request Changes` με explicit reason (όχι “σιωπηλό approve”).

---

## 10. Relations / handoffs

- Προς `Spend / Supplier Bills`: παρέχει approved/committed context + linkage reference. Δεν δημιουργεί supplier obligation.
- Προς `Controls (Budget)`: παρέχει commitment visibility + approval traceability.
- Προς `Overview`: παρέχει committed spend / backlog pressure / drilldown target προς requests worklist.
- Προς `Payments Queue`: καμία άμεση σχέση· επηρεάζει μόνο έμμεσα μέσω downstream supplier bills.

---

## 11. v1 limitations / controlled decisions (non-canonical)

- role-based approval policy thresholds
- required-vs-optional attachment policy
- supplier context mandatory policy πριν από approval
- controlled cancellation/revision semantics μετά από approval
- SLA/monitoring για “Approved but not yet linked to Supplier Bill”
- decomposition/presentation details για anti-double-count (ο relief κανόνας παραμένει canonical στο `00A`)

---

## 12. Final canonical statement

Το `Purchase Requests / Commitments Module` είναι το canonical upstream spend initiation/approval layer του Finance Management & Monitoring System v1: καταγράφει `Purchase Request`, αποδίδει approve/reject/request-changes outcome, δημιουργεί `Commitment` visibility όταν εγκρίνεται, τροφοδοτεί `Controls (Budget)` και monitoring surfaces με committed spend visibility, και παραδίδει downstream linkage context προς `Spend / Supplier Bills`, χωρίς να κατέχει supplier obligation truth ή να εκτελεί πληρωμές.
