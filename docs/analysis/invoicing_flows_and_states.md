## PASS 2–3 — Ροές χρήστη & state model (Invoicing / Drafts / Collections)

> Στόχος: ανακατασκευή end-to-end flows με trace UI→state transitions, και state map (πηγές αλήθειας, duplicates, drift).

---

## Flow A — Δημιουργία νέου προσχεδίου (draft) και canonicalization σε route

### Finding
Η δημιουργία “νέου draft” δεν είναι backend δημιουργία· είναι **άμεσο `upsertDraft` στο in-memory store** και αμέσως μετά route canonicalization σε `/finance/revenue/drafts/:draftId/builder`.

### Evidence
- `InvoiceDraftBuilderPage` δημιουργεί `id = drf_${Date.now()}` όταν δεν υπάρχει `draftId` param και κάνει:
  - `upsertDraft({ ...default header fields ... })`
  - `setDraftLines(id, [])`
  - `navigate(`/finance/revenue/drafts/${id}/builder`, { replace:true })`
  Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L174–L208.

### Consequence
- Η “ύπαρξη draft” εξαρτάται από την τρέχουσα runtime session. Refresh/reload δεν εγγυάται διατήρηση δεδομένων (δεν υπάρχει persistence layer στο repo).

### Confidence
High.

---

## Flow B — Επιλογή πηγών (billable work) και κατασκευή invoice lines

### Finding
Οι invoice lines προκύπτουν από `BillableWorkItem` records (source lines) ή από “custom lines”. Το UI επιβάλει “κανόνα” επιλογής (available ή reserved από το ίδιο draft).

### Evidence
- Source pool: `billableWork` από store, φιλτραρισμένο ανά client/project/search. Βλ. `InvoiceDraftBuilderPage.tsx` L310–L323.
- Rule gating:
  - `canAddToDraft(item, activeDraftId)` επιτρέπει μόνο:
    - `Available`, ή
    - `Reserved` αν `reservedByDraftId === activeDraftId`
    Βλ. `InvoiceDraftBuilderPage.tsx` L102–L106.
- `add(item)` δημιουργεί `DraftLine` με πεδία:
  - `sourceId`, `description`, `quantity:1`, `unit:"ea"`, `unitPrice`, `discountPct:0`, `vatCategory:"Standard 24%"`, `amount: unitPrice`, `currency`.
  Βλ. `InvoiceDraftBuilderPage.tsx` L375–L395.
- Custom line: `addCustomBillableItem()` δημιουργεί `sourceId: custom_${Date.now()}`, με editable qty/unit/unitPrice, κ.λπ. Βλ. L397–L415.

### Consequence
- Υπάρχει dual-origin model:
  - source-derived lines (locked currency, mostly locked qty/unit/unitPrice in UI),
  - custom lines (editable).
- Το store όμως **δεν κρατά ξεχωριστό entity “InvoiceLine”**· κρατά `DraftLine[]` σε `draftLinesByDraftId`.

### Confidence
High.

---

## Flow C — Editing header fields & save draft

### Finding
Τα invoice header fields δεν είναι controlled από global store ως single source of truth· είναι κυρίως **local component state** που “persist” στο store μόνο σε `saveCurrentDraft()`.

### Evidence
- Local state fields στο builder: `billingEntity`, `documentType`, `paymentWay`, `series`, `invoiceNumber`, `contractRef`, `customerReference`, `subject`, `issueDate`, `dueTerms`, `dueDate`, `externalNote`, `notes`, `relatedDocument`, `movement` κ.λπ. Βλ. `InvoiceDraftBuilderPage.tsx` L213–L259.
- Save action:
  - `upsertDraft({ ...draftMeta, client, project, updatedAt, currency, documentType, paymentWay, billingEntity, ...relatedDocument, movement })`
  - `setDraftLines(resolvedDraftId, normalizedLines)`
  Βλ. `InvoiceDraftBuilderPage.tsx` L535–L576.
- Confirm dialog “Prototype: αποθήκευση στο τοπικό state (χωρίς backend).” Βλ. L1897–L1909.

### Consequence
- Πιθανότητα drift:
  - Ο χρήστης αλλάζει header fields/lines αλλά **δεν πατά Save**· το store δεν ενημερώνεται.
  - Μετά από navigation/refresh, τα “draft persisted fields” είναι μόνο όσα έχουν περάσει από `upsertDraft` + `setDraftLines`.
- Δεν υπάρχει explicit dirty/pristine tracking πέρα από disabled states (π.χ. `lines.length === 0`).

### Confidence
High.

---

## Flow D — Totals/VAT preview στο builder vs totals στο store

### Finding
Υπάρχουν **δύο διαφορετικές υλοποιήσεις** totals:
1) Store-side `computeDraftNetTotal` (μόνο net, χωρίς VAT),
2) Builder-side `computeLineNet/computeLineVat` και invoice-level totals (net + VAT + gross).

### Evidence
- Store `computeDraftNetTotal(lines)`:
  - net = qty * unitPrice * (1 - discountPct/100) με fallbacks στο `amount`.
  - Χρησιμοποιείται σε `setDraftLines` για `draftTotal` και σε `issueDraft` για `Invoice.total`.
  Βλ. `src/state/FinancePrototypeState.tsx` L27–L37, L190–L206, L242–L243, L252–L254.
- Builder VAT preview:
  - VAT options και rates: `VAT_OPTIONS` (24/13/6/0/exempt/reverse). Βλ. `InvoiceDraftBuilderPage.tsx` L128–L135.
  - `computeLineNet`, `computeLineVat` (VAT = net * rate). Βλ. L146–L157.
  - Totals: `totalNet`, `totalVat`, `totalGross`, `grandTotal`. Βλ. L510–L523.

### Consequence
- Το issued `Invoice.total` είναι **net-only** (από store), ενώ το UI δείχνει “Σύνολο” ως `totalGross`/`grandTotal` (net+VAT). Αυτό είναι σοβαρή ασυνέπεια business-wise.
- Ακόμα κι αν θεωρείται “prototype”, είναι stabilization-critical γιατί επηρεάζει receivables (`outstanding = inv.total`) και dashboards.

### Confidence
High (ο κώδικας είναι άμεσος).

---

## Flow E — Issue/Finalize (prototype issuance)

### Finding
Η “Υποβολή για Έκδοση” μετατρέπει draft σε invoice + receivable μέσα στο store. Δεν υπάρχει πραγματική finalization workflow (e.g. provider transmission, myData submission).

### Evidence
- Builder `submitCurrentDraft()`:
  - `saveCurrentDraft()`
  - `issueDraft(draftId, {client, project, owner})`
  - `navigate` σε invoice detail
  Βλ. `InvoiceDraftBuilderPage.tsx` L578–L588.
- Store `issueDraft`:
  - Preconditions: draft exists & `lines.length > 0`, αλλιώς null. Βλ. `FinancePrototypeState.tsx` L226–L230.
  - Invoice id/number generation: `inv_${seq}` και `INV-${year}-${padStart(5)}`. Βλ. L231–L258.
  - Dates: `issueDate` από draft ή today, `dueDate` από draft ή today+30. Βλ. L233–L241.
  - `total = computeDraftNetTotal(lines)` (net-only). Βλ. L242–L243, L253–L254.
  - `status:"Issued"`, `transmission:"Pending"`. Βλ. L255–L257.
  - Receivable creation (outstanding = inv.total). Βλ. L261–L274.
  - Mark billableWork as `Invoiced` by matching `DraftLine.sourceId`. Βλ. L276–L289.
  - Mark draft status `Issued` (draft record stays). Βλ. L291–L293.
  - Audit event `invoice issued (prototype)`. Βλ. L294–L300.

### Consequence
- “Issue” σήμερα δεν διασώζει invoice lines/header. Το invoice detail ανασυνθέτει “linked work” από `billableWork` και όχι από invoice lines entity.
- `transmission` είναι μόνο status field/label, χωρίς state machine και χωρίς handlers για Accepted/Rejected transitions.

### Confidence
High.

---

## Flow F — Invoices list & invoice detail (read paths)

### Finding
Τα invoices είναι list/detail UI πάνω στο store `invoices[]`· οι εισπράξεις/notes έρχονται από `receivables[]` και `collectionNotesByInvoiceId`.

### Evidence
- `InvoicesPage` reads:
  - `invoices`, `receivables`, `addCollectionNote`. Βλ. `src/views/invoices/InvoicesPage.tsx` L41–L45.
  - Filters (status/q/date range) αποθηκεύονται στο query string. Βλ. L70–L83.
  - SidePanel linking σε invoice detail και collections. Βλ. L493–L520.
- `InvoiceDetailPage` reads:
  - `invoices`, `receivables`, `billableWork`, `auditEvents`, `getLastCollectionNote`, `addCollectionNote`. Βλ. `src/views/invoices/InvoiceDetailPage.tsx` L23–L27.
  - `linkedWork = billableWork.filter(w => w.invoicedByInvoiceId === inv.id)`. Βλ. L46–L47.
  - Timeline από `auditEvents` που έχουν `target === inv.id`. Βλ. L44–L45.

### Consequence
- Το invoice detail δεν μπορεί να εμφανίσει “ακριβείς invoice lines” γιατί δεν υπάρχουν ως persisted invoice entity. Εμφανίζει μόνο linked `billableWork`.

### Confidence
High.

---

## Flow G — Collections (receivables) και σημειώσεις follow-up

### Finding
Το collections module είναι λειτουργικό task list πάνω σε `receivables[]` (store) και notes per invoiceId. Δεν υπάρχει πραγματική ενημέρωση πληρωμών που να ενημερώνει invoice/receivable (πέρα από mock).

### Evidence
- `CollectionsPage` reads `receivables`, `getLastCollectionNote`, `addCollectionNote`. Βλ. `src/views/collections/CollectionsPage.tsx` L36–L37.
- Filters αποθηκεύονται στο query string (signal/q/fromDue/toDue). Βλ. L45–L57.
- “Expected payment date” εμφανίζεται ως `—` (not modeled). Βλ. L287–L292.
- Notes persistence: `FinancePrototypeState.addCollectionNote` γράφει σε `collectionNotesByInvoiceId` + audit event. Βλ. `src/state/FinancePrototypeState.tsx` L152–L173.

### Consequence
- Collections είναι “adjacent” και εξαρτάται από invoicing totals (outstanding)· άρα η net-only issue total ασυνέπεια επηρεάζει άμεσα follow-up prioritization.

### Confidence
High.

---

## PASS 3 — State model map (πηγές αλήθειας & drift points)

### 1) Canonical sources of truth (στο prototype)
- **Draft headers**: `invoiceDrafts[]` entries (`InvoiceDraft` fields) στο store. Βλ. `src/domain/types.ts` L40–L82, και `FinancePrototypeState.tsx` L120–L123, L179–L189.
- **Draft lines**: `draftLinesByDraftId[draftId]: DraftLine[]`. Βλ. `src/state/FinancePrototypeState.tsx` L54–L56, L190–L206.
- **Issued invoices (minimal)**: `invoices[]` (`Invoice` model). Βλ. `src/domain/types.ts` L25–L38.
- **Receivables linkage**: `receivables[]` keyed by `invoiceId`. Βλ. `src/domain/types.ts` L84–L94, `FinancePrototypeState.tsx` L261–L274.
- **Billable work**: `billableWork[]` with status/reservations/invoicedByInvoiceId. Βλ. `src/domain/types.ts` L139–L155.

### 2) Duplicate / parallel state representations
- Draft header fields exist twice:
  - as local React state in `InvoiceDraftBuilderPage` (many `useState` fields),
  - as persisted-ish `InvoiceDraft` in store.
- Draft lines exist twice during editing:
  - local `lines` state in builder,
  - store `draftLinesByDraftId[draftId]`.

### 3) Drift / inconsistency hotspots (verified)
- Totals:
  - Builder shows VAT-inclusive totals (`grandTotal`) but store persists net-only totals (`draftTotal`, `inv.total`). Evidence: `InvoiceDraftBuilderPage.tsx` L510–L523 vs `FinancePrototypeState.tsx` L27–L37, L242–L254.
- Currency:
  - Builder locks currency when there are source lines (`currencyLocked = hasSourceLines`). Βλ. `InvoiceDraftBuilderPage.tsx` L523–L527.
  - Store chooses invoice currency as `lines[0]?.currency ?? draft.currency ?? "EUR"`. Βλ. `FinancePrototypeState.tsx` L243–L244.
- Status:
  - Draft status in store auto-updates in `setDraftLines` based on lines length (In Progress / Ready to Issue) and preserved Issued. Βλ. `FinancePrototypeState.tsx` L195–L204.
  - UI has additional derived warnings “stale” but no global stale transition logic besides mock status.

### 4) Async/loading/error/validation state
- Δεν υπάρχει async fetching/saving, ούτε network errors.
- Validation:
  - Only “custom line validity” is checked (`hasInvalidCustomRows`) and blocks save/issue. Βλ. `InvoiceDraftBuilderPage.tsx` L527–L533, L535–L537, L578–L580.
  - Δεν εντοπίστηκε πλήρης validation για υποχρεωτικά header fields (π.χ. σειρά/αριθμός) πέρα από UI labels “*”.

---

## PASS checkpoint (μετά flows & state)

### Τι επαληθεύτηκε
- End-to-end draft→issue→invoice/receivable υπάρχει, αλλά είναι prototype χωρίς persistence.
- Το state model είναι διπλό (local UI + global store) με πολλαπλά drift points.

### Τι παραμένει αβέβαιο
- Αν υπάρχουν “κρυφές” ροές πληρωμών/receipt registration που ενημερώνουν `paid`/status (προς το παρόν βλέπουμε μόνο mock `auditEvents` που το υπονοούν).

### Πιο canonical αρχεία
`src/state/FinancePrototypeState.tsx`, `src/views/drafts/InvoiceDraftBuilderPage.tsx`, `src/domain/types.ts`.

