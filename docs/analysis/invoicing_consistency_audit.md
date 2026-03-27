## PASS 6 — Consistency audit (strict) για invoicing

> Μορφή: Finding → Evidence → Consequence → Confidence.

---

## 1) Totals inconsistency: UI δείχνει gross (με ΦΠΑ) αλλά το store εκδίδει net-only

### Finding
Το “issued invoice total” είναι net-only, ενώ ο builder υπολογίζει/παρουσιάζει VAT-inclusive totals.

### Evidence
- Store `issueDraft`: `total = computeDraftNetTotal(lines)` και `Invoice.total = total`. Βλ. `src/state/FinancePrototypeState.tsx` L242–L254.
- Store `computeDraftNetTotal` δεν υπολογίζει VAT· μόνο qty*unitPrice*(1-discount). Βλ. L27–L37.
- Builder totals:
  - `totalVat = sum(computeLineVat)`, `grandTotal = (net+otherTaxes)+vat`. Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L510–L523.
- UI labels: “ΦΠΑ (προεπισκόπηση)” και “Σύνολο” στο builder. Βλ. `InvoiceDraftBuilderPage.tsx` L1396–L1404.

### Consequence
- Κρίσιμο ρίσκο: receivables/outstanding βασίζονται σε `inv.total` (net-only) → λάθος collections ποσά.
- Ο χρήστης βλέπει διαφορετικό “σύνολο” πριν την έκδοση από αυτό που αργότερα παρακολουθείται ως invoice total.

### Confidence
High.

---

## 2) Data loss / model truncation: issued Invoice δεν κρατά lines/header fields

### Finding
Μετά την έκδοση, το “invoice document” δεν διατηρεί τα lines και τα header fields από το draft.

### Evidence
- `Invoice` type δεν έχει lines/header (μόνο minimal fields). Βλ. `src/domain/types.ts` L25–L38.
- `issueDraft` δημιουργεί `Invoice` χωρίς references σε draft header fields (π.χ. series, invoiceNumber, billingEntity). Βλ. `src/state/FinancePrototypeState.tsx` L245–L258.
- `InvoiceDetailPage` δείχνει “linked work” από `billableWork`, όχι invoice lines. Βλ. `src/views/invoices/InvoiceDetailPage.tsx` L46–L47.

### Consequence
- Δεν υπάρχει auditability: δεν μπορεί να ανασυντεθεί τί “εκδόθηκε” ως παραστατικό.
- Οι compliance-like fields (E3/ΣΤ.9/MARK/movement) μένουν “εγκλωβισμένα” στο draft και δεν συσχετίζονται με issued record.

### Confidence
High.

---

## 3) Διπλό state (local vs global) χωρίς robust dirty tracking

### Finding
Το builder κρατά τοπικά state για header/lines και συγχρονίζει στο store μόνο σε explicit save/issue.

### Evidence
- Πολλά `useState` για header fields. Βλ. `InvoiceDraftBuilderPage.tsx` L213–L259.
- Save writes to store: `upsertDraft` + `setDraftLines`. Βλ. L535–L576.
- Δεν εντοπίστηκε central “dirty flag”/diff model.

### Consequence
- Ρίσκο απώλειας αλλαγών αν ο χρήστης κάνει navigate χωρίς save.
- Drift μεταξύ UI preview και stored draft.

### Confidence
High.

---

## 4) Duplicate implementations / legacy remnants: path duplication `src/views` vs `src\\views`

### Finding
Υπάρχουν duplicate paths στο working tree που δείχνουν πιθανή διπλή ύπαρξη ίδιων modules (Windows path separator artifacts).

### Evidence
- Git status δείχνει και:
  - `src/views/...` (tracked modified) και
  - `src\\views\\...` (untracked “νέα” αρχεία με backslashes).
  (Evidence: status snapshot στο prompt του session.)

### Consequence
- Critical build risk σε Windows: duplication μπορεί να μπερδέψει imports, bundler include patterns, και να δημιουργήσει “δύο εκδόσεις” components/types.
- Stabilization must include repository hygiene για να αποφευχθεί drift/διπλο-compile.

### Confidence
Medium (το status είναι snapshot· χρειάζεται επιβεβαίωση με filesystem/tsconfig include patterns).

---

## 5) “Transmission” semantics είναι placeholder (no state machine, no transitions)

### Finding
Η “διαβίβαση μέσω παρόχου” εμφανίζεται σε UI και types, αλλά δεν υπάρχει logic που να την ενημερώνει βάσει γεγονότων.

### Evidence
- `TransmissionStatus` enum (`Not Required|Pending|Accepted|Rejected`) στο `src/domain/types.ts` L9.
- `issueDraft` sets `transmission:"Pending"`. Βλ. `FinancePrototypeState.tsx` L255–L257.
- UI messaging για Pending/Rejected σε `InvoicesPage` και `InvoiceDetailPage`. Βλ. `src/views/invoices/InvoicesPage.tsx` L485–L492 και `src/views/invoices/InvoiceDetailPage.tsx` L109–L123.
- Δεν βρέθηκαν handlers/transformations/API calls για αλλαγή `transmission`.

### Consequence
- Σταθεροποίηση/τεκμηρίωση πρέπει να δηλώσει ρητά ότι η διαβίβαση είναι UX scaffold και όχι λειτουργία compliance.

### Confidence
High.

---

## 6) Classification fields υπάρχουν (E3/ΣΤ.9) αλλά δεν επηρεάζουν calculations/persistence

### Finding
`st9IncomeCategory`/`e3IncomeClassification` μπορούν να συμπληρωθούν ανά γραμμή, αλλά δεν χρησιμοποιούνται downstream (issue/export/persistence).

### Evidence
- UI inputs γράφουν `DraftLine.st9IncomeCategory` και `DraftLine.e3IncomeClassification`. Βλ. `InvoiceDraftBuilderPage.tsx` L1247–L1277.
- `issueDraft` δεν μεταφέρει lines ούτε classifications σε issued invoice. Βλ. `FinancePrototypeState.tsx` L245–L258.

### Consequence
- Εμφάνιση compliance choices χωρίς αποτέλεσμα → κίνδυνος παρανόησης από χρήστες/PM ότι “υποστηρίζεται myData/E3”.

### Confidence
High.

---

## 7) Validation gaps: υποχρεωτικά πεδία σε UI δεν enforced πριν issue

### Finding
UI δείχνει `*` (π.χ. Πελάτης/Σειρά/Αριθμός/Ημ/νία) αλλά issue επιτρέπει χωρίς επιβεβαίωση αυτών των constraints (πέρα από permissions & line validity).

### Evidence
- Issue button gating: `disabled={lines.length === 0 || hasInvalidCustomRows || !perms.canIssueInvoice}`. Βλ. `InvoiceDraftBuilderPage.tsx` L663–L671.
- `issueDraft` precondition μόνο `draft exists` + `lines.length>0`. Βλ. `FinancePrototypeState.tsx` L226–L230.

### Consequence
- Stabilization: πρέπει να καθοριστούν canonical required fields για “Issued” και να ευθυγραμμιστεί UI/store validation.

### Confidence
High.

---

## PASS checkpoint (consistency)

### Τι επαληθεύτηκε
- Κρίσιμες ασυνέπειες totals, data truncation, placeholder transmission, validation gaps.

### Τι παραμένει αβέβαιο
- Το εύρος των duplicate path artifacts και αν επηρεάζουν build/runtime.

### Πιο canonical αρχεία
`src/state/FinancePrototypeState.tsx`, `src/views/drafts/InvoiceDraftBuilderPage.tsx`, `src/domain/types.ts`, `src/router/router.tsx`.

