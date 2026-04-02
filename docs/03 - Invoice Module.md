# 03 — Invoice Module

## 1. Σκοπός του εγγράφου

Το παρόν έγγραφο ορίζει το `Invoice Module` σε επίπεδο module canon: ρόλο, boundaries, owned truth, surfaces, local lifecycle, issue-readiness gate και handoffs προς άλλα modules.
Δεν αποτελεί semantic-law (αυτό ορίζεται στο `00A`) ούτε UI blueprint.

---

## 2. Ρόλος και boundaries

Το `Invoice Module` είναι το revenue-core module που μετατρέπει `Billable Work` σε **issued invoice document truth** και παραδίδει καθαρό downstream handoff προς `Receivables`.

Boundaries (τι δεν είναι):
- Δεν είναι `Receivables` (follow-up/collection progression).
- Δεν είναι `Overview` (monitoring shell).
- Δεν είναι accounting/compliance engine ή bank/reconciliation truth.

Σημείωση: Το `Issue` είναι semantic transition boundary (per `00A`) και **δεν** αποτελεί απόδειξη πλήρους λογιστικής/φορολογικής/κανονιστικής ολοκλήρωσης.

---

## 3. Core business concepts του module (capsule)

- `Billable Work`: upstream τιμολογήσιμο input.
- `Invoice Draft` + `Draft Lines`: editable προ-issue σύνθεση.
- `Issue`: η μετάβαση που κλειδώνει issued snapshot (κανόνες στο `00A`).
- `Issued Invoice`: το canonical issued record του module (document truth).
- Downstream handoff: παράγωγο `Receivable` context (owner: `Receivables`, derivation κανόνες στο `00A`).
- `Transmission / fiscal context`: υποστηρικτική διάσταση, δεν αλλάζει την issued truth.
- `Audit/Notes/Timeline`: supporting traceability, όχι truth replacement.

---

## 4. Module surfaces / operational surfaces (όχι UI spec)

- `Invoice Drafts List`: worklist για draft backlog/συνέχεια.
- `Invoice Draft Builder`: σύνθεση draft, preview/review και gated `Issue`.
- `Invoices List`: worklist issued invoices (post-issue visibility).
- `Invoice Detail View`: canonical issued context + handoff links (προς `Receivables`).

---

## 5. Core flow του module (local)

```mermaid
flowchart LR
    BW[Billable Work]
    D[Invoice Draft]
    IS[Issue transition]
    II[Issued Invoice<br/>document truth]
    RH[Downstream Receivable handoff]

    BW --> D --> IS --> II --> RH
```

Τι δείχνει: την local ακολουθία του `Invoicing` μέχρι το downstream handoff.  
Τι δεν δείχνει: collection/payment progression ως invoice document statuses.

Local flow capsule:
- Draft discovery/continuation → composition → save/review.
- `Issue` (gated) → δημιουργία issued record + downstream handoff.
- Post-issue review: ανάγνωση issued record (χωρίς εξάρτηση από draft mutations).

---

## 6. Ownership και outputs (module-local)

Owned truth εντός module:
- `InvoiceDraft` / `DraftLine`: truth της pre-issue σύνθεσης.
- `Invoice` (issued): **document truth** μετά το `Issue`.

Μη-owned / read-only contexts:
- `BillableWorkItem`: upstream source context.
- `Receivable` context: downstream claim (owner: `Receivables`).
- `Controls` outputs: visibility μόνο (audit/control), όχι ownership.

Module outputs:
- Issued invoice record (issued snapshot).
- Deterministic handoff προς `Receivables` (linked context/identifier ώστε να μην υπάρχει αμφισημία downstream).

---

## 7. Module-local rules (χωρίς επανάληψη του 00A)

Το module εφαρμόζει τους canonical κανόνες του `00A` (issue boundary, totals alignment, state-family separation). Σε module επίπεδο, οι πρακτικές συνέπειες είναι:

- **Draft vs Issued separation**: post-issue, το issued record δεν “εξηγείται” από μεταγενέστερο draft/preview.
- **No collection statuses στο Invoice**: `Paid/Partially Paid/Overdue/Open` δεν είναι canonical invoice document statuses· ανήκουν στο `Receivables`/cash context.
- **Transmission είναι orthogonal**: transmission/fiscal signals δεν επαναορίζουν το `Issue` ούτε την issued truth.

---

## 8. Lifecycle & status vocabulary (module-specific)

Το `Invoice Module` εκθέτει μόνο module-local vocabulary, συμβατό με το state-family separation του `00A`.

- **Persisted document statuses (module)**: `Draft`, `Issued`
- **Readiness states (pre-issue)**: `Ready for Issue`, `Not Ready`
- **Operational signals (optional)**: `Needs Review`, `Stale` (όπου εφαρμόζεται)
- **UI-only flags (examples)**: `Unsaved Changes`, `Preview Mode`, `Inline Validation Error`

Απαγορεύεται η χρήση downstream receivable/payment outcomes ως invoice document statuses.

---

## 9. Issue-readiness gate (semantic minimum)

Το module ορίζει το ελάχιστο readiness gate για να επιτραπεί το `Issue`, χωρίς να εισάγει implementation detail:
- Τουλάχιστον μία έγκυρη `DraftLine` με σαφή origin.
- Συνεπές totals αποτέλεσμα (preview) ώστε να προκύψει issued snapshot χωρίς αμφισημία.
- Επαρκές billing/customer identity context.
- Επαρκές issue/date/terms context.
- Απουσία blocking validation errors που καθιστούν ambiguous την issued truth ή το downstream derivation.

---

## 10. Relations / handoffs με άλλα modules

- Με `Receivables`: το `Invoicing` παραδίδει issued truth + deterministic handoff. Το `Receivables` αναλαμβάνει progression/collection.
- Με `Overview`: το `Overview` παρακολουθεί/δρομολογεί, δεν επαναορίζει invoice truth.
- Με `Controls`: read-only visibility (ιδίως audit), χωρίς ownership.

Boundary logic (capsule):
- Upstream read: `Billable Work`
- Downstream write/handoff: issued `Invoice` truth → `Receivables` context

---

## 11. v1 limitations / stabilization notes (non-canonical)

Τα παρακάτω είναι **stabilization targets** και δεν αλλάζουν τους canonical κανόνες του `00A`:
- πιθανό mismatch preview totals vs issued totals σε ορισμένες αναπαραστάσεις
- minimal issued record / missing full snapshot risk (πέρα από totals)
- numbering linkage ambiguity μεταξύ draft και issued context
- transmission status ως placeholder signal χωρίς πλήρες lifecycle policy
- controlled/open policy για void/cancel/credit

---

## 12. Τελική διατύπωση module statement

Το `Invoice Module` είναι το canonical revenue-core module του Finance Management & Monitoring System v1: συνθέτει `Invoice Draft` από `Billable Work`, εφαρμόζει gated `Issue` ώστε να παραχθεί issued invoice document truth (issued snapshot per `00A`), και παραδίδει deterministic downstream handoff προς `Receivables`, χωρίς να απορροφά collections/payment progression ή να μετατρέπεται σε monitoring/compliance/accounting surface.

