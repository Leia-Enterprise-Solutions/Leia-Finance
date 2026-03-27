## PASS 7 — Stabilization backlog (προτεραιοποίηση με βάση audit findings)

> Στόχος: backlog “κατευθύνσεων” (όχι κώδικας ακόμη). Κάθε item: Severity, Rationale, Affected area/files, Suggested direction.

---

## Must fix πριν βασιστούμε στο module (Critical)

### 1) **Critical** — Ευθυγράμμιση totals: net vs gross/VAT (single source of truth)
- **Rationale**: Σήμερα το UI δείχνει VAT-inclusive σύνολα, αλλά το issued invoice/receivable κρατά net-only ποσό → λάθος business ποσά.
- **Evidence**: `InvoiceDraftBuilderPage.tsx` (VAT totals L510–L523) vs `FinancePrototypeState.tsx` (`computeDraftNetTotal`, issueDraft total L242–L254).
- **Affected**: `src/views/drafts/InvoiceDraftBuilderPage.tsx`, `src/state/FinancePrototypeState.tsx`, `src/views/invoices/*`, `src/views/collections/CollectionsPage.tsx`.
- **Direction**:
  - Ορισμός canonical “amount model” (net/gross/VAT breakdown) και serialization που να χρησιμοποιείται σε draft + issued.
  - Απόφαση: αποθηκεύουμε VAT breakdown per line ή υπολογίζουμε deterministically κατά το issue.

### 2) **Critical** — Εισαγωγή issued invoice payload (διατήρηση header+lines)
- **Rationale**: Issued invoice entity σήμερα δεν διατηρεί περιεχόμενο παραστατικού → μη audit-able, μη exportable.
- **Evidence**: `Invoice` type minimal (`src/domain/types.ts` L25–L38) + `issueDraft` δεν μεταφέρει header/lines (`FinancePrototypeState.tsx` L245–L258).
- **Affected**: `src/domain/types.ts`, `src/state/FinancePrototypeState.tsx`, detail/list pages.
- **Direction**:
  - Επέκταση issued invoice model ή εισαγωγή `IssuedInvoiceDocument` entity που αποθηκεύει snapshot header+lines+tax totals.

### 3) **Critical** — Repository hygiene: εξάλειψη διπλών paths (`src/views` vs `src\\views\\...`)
- **Rationale**: Κίνδυνος διπλού compile/λάθος imports/απρόβλεπτων runtime διαφορών.
- **Evidence**: git status snapshot δείχνει untracked duplicates σε `src\\...`.
- **Affected**: repo structure, build config.
- **Direction**:
  - Καθαρισμός/ενοποίηση paths, έλεγχος `tsconfig include`, bundler config, και case/path sensitivity.

---

## Should fix για αξιοπιστία (High)

### 4) **High** — Ενιαία βιβλιοθήκη υπολογισμών & rounding policy
- **Rationale**: Υπάρχουν διπλοί υπολογισμοί (store vs builder) χωρίς rounding rules.
- **Evidence**: `computeDraftNetTotal` (`FinancePrototypeState.tsx` L27–L37) vs `computeLineNet/computeLineVat` (`InvoiceDraftBuilderPage.tsx` L146–L157).
- **Direction**:
  - Canonical calculation helpers (pure functions), testable, με ρητό rounding (per line vs per invoice).

### 5) **High** — Validation κανόνες για issue (required fields, completeness)
- **Rationale**: UI δείχνει υποχρεωτικά πεδία αλλά store επιτρέπει issue μόνο με lines>0.
- **Evidence**: Issue gating `InvoiceDraftBuilderPage.tsx` L663–L671 και store preconditions `FinancePrototypeState.tsx` L226–L230.
- **Direction**:
  - Ορισμός “issue readiness” schema και shared validation (UI + store).

### 6) **High** — Καθαρός διαχωρισμός draft vs issued state machine
- **Rationale**: Draft status auto-ορίζεται με βάση lines, ενώ issued invoice status/transmission είναι placeholder.
- **Evidence**: `setDraftLines` status logic `FinancePrototypeState.tsx` L195–L204; `transmission:"Pending"` `FinancePrototypeState.tsx` L255–L257.
- **Direction**:
  - Ορισμός transitions και event model (auditEvents ήδη υπάρχουν ως scaffold).

---

## Maintainability improvements (Medium)

### 7) **Medium** — Μείωση διπλού local state στο builder (single draft form model)
- **Rationale**: Πολύς local state → drift risk.
- **Evidence**: builder `useState` fields `InvoiceDraftBuilderPage.tsx` L213–L259.
- **Direction**:
  - Συγκέντρωση draft form state σε ένα object, με explicit save/dirty tracking.

### 8) **Medium** — Τεκμηρίωση semantics για E3/ΣΤ.9/MARK/movement fields
- **Rationale**: Fields υπάρχουν σε UI/types αλλά δεν έχουν downstream χρήση.
- **Evidence**: `DraftLine` fields `src/domain/types.ts` L172–L189 και UI columns `InvoiceDraftBuilderPage.tsx` L1179–L1277.
- **Direction**:
  - Σαφής δήλωση “prototype-only” μέχρι να υπάρξει myData/export adapter.

---

## Documentation-only clarifications (Low)

### 9) **Low** — Τεκμηρίωση querystring filters στις λίστες
- **Evidence**: `InvoicesPage` sync query string `InvoicesPage.tsx` L70–L83; `DraftsPage` L64–L72; `CollectionsPage` L45–L57.
- **Direction**: Ενότητα docs “Deep links & filters”.

---

## Open product decisions (requires PM/Finance/Compliance) — για να κλείσουν τα κενά

### 10) VAT model & compliance
- **Decision needed**: Το ποσό στο invoice/receivable είναι net ή gross; πώς παρουσιάζεται/λογίζεται; rounding rules.
- **Where it blocks**: totals alignment, myData payload readiness.

### 11) Numbering/series policy
- **Decision needed**: Σειρές ανά doc type/οντότητα/έτος; canonical sequence source; σχέση draft invoiceNumber vs issued number.
- **Evidence**: dual numbering in builder vs store.

---

## PASS checkpoint (stabilization risks → backlog)

### Τι επαληθεύτηκε
- Η κύρια τεχνική αστάθεια είναι “domain truncation” και inconsistent totals.

### Τι παραμένει αβέβαιο
- Αν το project σκοπεύει να παραμείνει prototype-only ή να γίνει production module (επηρεάζει scope stabilization).

