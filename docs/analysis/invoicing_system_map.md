## Εκτελεστική σύνοψη (audit pass – invoicing)

### Finding
Το invoicing module (draft → issue → invoice list/detail → collections) είναι **UI-driven prototype** χωρίς πραγματικό persistence/API· ο canonical “source of truth” είναι ένα in-memory React Context store (`FinancePrototypeState`) που αρχικοποιείται από `src/mock/data.ts`.

### Evidence
- Routes/entry points στο `src/router/router.tsx`:
  - Drafts: `/finance/revenue/drafts` → `DraftsPage`, Builder: `/finance/revenue/drafts/:draftId/builder` → `InvoiceDraftBuilderPage`, Invoices: `/finance/revenue/invoices` → `InvoicesPage`, Invoice detail: `/finance/revenue/invoices/:invoiceId` → `InvoiceDetailPage`, Collections: `/finance/revenue/collections` → `CollectionsPage`. Βλ. `src/router/router.tsx` L67–L77.
- Providers: `src/state/AppProviders.tsx` τυλίγει το app με `PermissionsProvider`, `DateRangeProvider`, `FinancePrototypeStateProvider`. Βλ. `src/state/AppProviders.tsx` L6–L12.
- Canonical store: `src/state/FinancePrototypeState.tsx` ορίζει `FinancePrototypeState` και κρατά arrays για `invoiceDrafts`, `draftLinesByDraftId`, `invoices`, `receivables`, `billableWork` κ.λπ. Βλ. `src/state/FinancePrototypeState.tsx` L46–L75, L117–L125.
- Απουσία πραγματικού persistence/API:
  - Δεν βρέθηκαν χρήσεις `localStorage/sessionStorage/indexedDB` ούτε `fetch/axios` στο repo (search evidence: μηδενικά matches).
  - Όλα τα δεδομένα αρχικοποιούνται από `src/mock/data.ts` (imports στο `FinancePrototypeState.tsx` L15–L25).

### Consequence
- Η “έκδοση τιμολογίου” σήμερα είναι **εσωτερικό state transition** (draft → δημιουργία `Invoice` + `ReceivableWorkItem` + audit event) και όχι πραγματική έκδοση/διαβίβαση/λογιστική καταχώρηση.
- Για stabilization, το πιο κρίσιμο είναι να ξεκαθαριστεί τι θεωρείται canonical domain model και πού πρέπει να ζει (UI vs store vs backend), επειδή ήδη υπάρχουν πεδία “compliance-like” (π.χ. `mydataExtra`, E3/ΣΤ.9) που **δεν έχουν end-to-end υποστήριξη**.

### Confidence
High (η αλυσίδα routes→pages→store→mock είναι πλήρως ορατή στον κώδικα).

---

## Repository coverage statement (τι καλύφθηκε σε αυτό το pass)

### Verified coverage (από κώδικα)
- **Routes**: `src/router/router.tsx`
- **Invoicing pages**:
  - `src/views/drafts/DraftsPage.tsx`
  - `src/views/drafts/InvoiceDraftBuilderPage.tsx`
  - `src/views/invoices/InvoicesPage.tsx`
  - `src/views/invoices/InvoiceDetailPage.tsx`
  - `src/views/collections/CollectionsPage.tsx`
- **State/store**:
  - `src/state/FinancePrototypeState.tsx` (drafts, invoices, receivables, issue flow, audit events)
  - `src/state/permissions.tsx` (gating issue action)
  - `src/state/AppProviders.tsx`
- **Domain types & mock data**:
  - `src/domain/types.ts` (InvoiceDraft/DraftLine/Invoice/ReceivableWorkItem κ.λπ.)
  - `src/mock/data.ts` (initial datasets)
- **Adjacent finance view (ενδεικτικό)**:
  - `src/views/dashboard/charts/InvoicedVsCollectedChart.tsx` (στατικό chart, όχι σύνδεση με invoices)

### Out-of-scope / not found (με βάση searches, όχι “απόδειξη ανυπαρξίας”)
- Backend/API services, persistence adapters, myData exporters: **δεν εντοπίστηκαν** στο repo (no matches σε `fetch/axios/localStorage`).
- Tests/stories ειδικά για invoicing: δεν έγινε ακόμα πλήρης εξόρυξη tests (θα συνεχιστεί σε επόμενο pass αν υπάρχουν).

---

## PASS 1 — DISCOVERY / INVENTORY (ομαδοποιημένος κατά κατηγορία)

### Routes / entry points
- `src/router/router.tsx`
  - Canonical finance IA: `/finance/revenue/...` (L67–L77)
  - Backward-compatible redirects: `/invoices`, `/drafts`, κ.λπ. (L104–L125)

### Pages (UI routes)
- Drafts list: `src/views/drafts/DraftsPage.tsx`
- Draft builder: `src/views/drafts/InvoiceDraftBuilderPage.tsx`
- Invoices list: `src/views/invoices/InvoicesPage.tsx`
- Invoice detail: `src/views/invoices/InvoiceDetailPage.tsx`
- Collections / receivables: `src/views/collections/CollectionsPage.tsx`

### State / store / providers
- `src/state/FinancePrototypeState.tsx`
  - State containers: `invoiceDrafts`, `draftLinesByDraftId`, `invoices`, `receivables`, `billableWork`, `auditEvents`, `collectionNotesByInvoiceId` (L46–L75, L83–L125)
  - Mutations: `upsertDraft`, `setDraftLines`, `discardDraft`, `issueDraft`, `addCollectionNote` (L150–L303)
  - Invoice numbering: `invoiceSeqRef` seeded από `initialInvoices` IDs (L128–L135)
- `src/state/AppProviders.tsx` (composition)
- `src/state/permissions.tsx` (`canIssueInvoice` gate)

### Domain types / interfaces (canonical στο prototype)
- `src/domain/types.ts`
  - `Invoice`, `InvoiceStatus`, `TransmissionStatus` (L1–L38)
  - `InvoiceDraft` + persisted header fields (L40–L82)
  - `DraftLine` + VAT/E3/ΣΤ.9 + myData placeholder fields (L157–L189)
  - `ReceivableWorkItem` (collections linkage) (L84–L94)
  - `BillableWorkItem` (line source) (L139–L155)
  - `AuditEvent` (L217–L225)

### Mock/test/demo data
- `src/mock/data.ts`
  - `invoices`, `invoiceDrafts`, `draftLinesByDraftId`, `receivables`, `billableWork`, `auditEvents` (πολλαπλές ενότητες)

### Calculations / validation / mapping (εντοπισμένα)
- Draft totals (net-only) στο store: `computeDraftNetTotal(lines)` στο `src/state/FinancePrototypeState.tsx` L27–L37.
- Builder line calcs (net + VAT preview):
  - `computeLineNet`, `computeLineVat`, VAT rates (24/13/6/0/Exempt/Reverse charge) στο `src/views/drafts/InvoiceDraftBuilderPage.tsx` L126–L157.
  - Invoice-level totals στο builder: `totalNet`, `totalVat`, `grandTotal` κ.λπ. (L510–L523).
- Due date derivation: `computeDueDateFromTerms` στο builder (L112–L117).
- Draft invoiceNumber builder (UI): `buildDraftInvoiceNumber(draftId)` (L119–L124).

### Integrations / exports / myData
- `DraftLine` έχει `mydataExtra?: Record<string,string>` και “advanced fields” (`withholdingPct`, `stampDutyPct`, `specialUnitCode`, κ.λπ.) στο `src/domain/types.ts` L176–L189.
- **Δεν εντοπίστηκε** adapter/exporter/mapping layer που να χρησιμοποιεί αυτά τα πεδία (search hits μόνο σε `types.ts` και `InvoiceDraftBuilderPage.tsx`).

---

## Entry points (PASS 2 — αρχικό mapping, πριν το πλήρες trace)

### 1) Δημιουργία νέου draft
- **Entry**: `/finance/revenue/drafts/builder` → `InvoiceDraftBuilderPage`.
- **Mechanism**: αν δεν υπάρχει `draftId` param, δημιουργείται νέο `drf_${Date.now()}` και γίνεται `navigate` σε canonical route με id. Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L174–L208.

### 2) Συνέχιση draft / επιλογή από λίστα
- **Entry**: `/finance/revenue/drafts` → `DraftsPage` με SidePanel που οδηγεί σε `/finance/revenue/drafts/:id/builder`. Βλ. `src/views/drafts/DraftsPage.tsx` L228–L309.

### 3) Έκδοση (prototype)
- **Entry**: κουμπί “Υποβολή για Έκδοση” στο builder.
- **Mechanism**: `submitCurrentDraft()` καλεί `issueDraft(draftId, {client, project, owner})` από store και μετά `navigate` σε invoice detail. Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L578–L588.

### 4) Παρακολούθηση εκδοθέντων / collections
- **Invoices list**: `/finance/revenue/invoices` → `InvoicesPage` (filters, sort, sidepanel).
- **Invoice detail**: `/finance/revenue/invoices/:invoiceId` → `InvoiceDetailPage` (receivable linkage, audit timeline, linked work).
- **Collections**: `/finance/revenue/collections` → `CollectionsPage` (receivables + notes).

---

## Αρχιτεκτονική εικόνα (prose dependency map)

### Finding
Το invoicing είναι μονολιθικά “δεμένο” με το prototype store: UI pages διαβάζουν/γράφουν απευθείας στο context (`useFinancePrototypeState`), και το store υπολογίζει μόνο net totals για draft/invoice.

### Evidence
- `InvoiceDraftBuilderPage`:
  - Διαβάζει `billableWork`, `invoiceDrafts`, `draftLinesByDraftId` και γράφει `upsertDraft`, `setDraftLines`, `issueDraft`. Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L163–L170.
  - Κρατά **πολύ μεγάλο local state** για header fields (π.χ. `billingEntity`, `series`, `invoiceNumber`, `movement...`). Βλ. L211–L259.
- Store:
  - `issueDraft` δημιουργεί `Invoice` και `ReceivableWorkItem` και κάνει mark billable work ως `Invoiced`. Βλ. `src/state/FinancePrototypeState.tsx` L226–L303.
  - `Invoice` model δεν περιέχει lines ή header fields πέρα από λίγα (client/project/dates/currency/total/transmission). Βλ. `src/domain/types.ts` L25–L38.

### Consequence
- Υπάρχει **ασυνέχεια**: το builder μοντελοποιεί πλούσιο invoice header + line VAT/classification, αλλά το issued `Invoice` που αποθηκεύεται στο store **χάνει** σχεδόν όλα τα header/line details (μένει μόνο `total` + βασικά metadata).
- Ρίσκο stabilization: drift μεταξύ “αυτό που δείχνει/υπολογίζει ο builder” και “αυτό που τελικά θεωρείται issued invoice” επειδή το issued invoice δεν έχει πλήρες payload/serialization.

### Confidence
High.

---

## Πιθανές “canonical” μονάδες (με βάση ρόλο & συγκέντρωση ευθύνης)

- **Canonical store / business transitions**: `src/state/FinancePrototypeState.tsx`
- **Canonical domain type definitions**: `src/domain/types.ts`
- **Canonical draft builder UI & calculations (προς το παρόν)**: `src/views/drafts/InvoiceDraftBuilderPage.tsx`
- **Canonical routing & entry points**: `src/router/router.tsx`

---

## PASS 8 — Documentation foundation (skeleton για μελλοντικά internal docs)

### Finding
Το υπάρχον invoicing module χρειάζεται τεκμηρίωση που να διαχωρίζει ρητά “prototype scaffold” από “production-ready behaviors”, ειδικά στα κομμάτια totals/VAT/transmission/myData.

### Evidence
- Prototype δηλώσεις στο UI (“Prototype: ... χωρίς backend”) και in-memory store. Βλ. `InvoiceDraftBuilderPage.tsx` L1897–L1909 και `FinancePrototypeState.tsx` συνολικά.
- Placeholder compliance fields: `DraftLine.mydataExtra`, `TransmissionStatus`, E3/ΣΤ.9. Βλ. `src/domain/types.ts` L9, L172–L189.

### Consequence
Η πρώτη έκδοση docs πρέπει να χτίζεται πάνω σε “map of reality” και να δηλώνει gaps/assumptions· αλλιώς υπάρχει κίνδυνος να θεωρηθούν υλοποιημένες λειτουργίες που είναι μόνο UI.

### Confidence
High.

### Προτεινόμενη δομή docs (έτοιμη να μεταφερθεί σε `/docs/` module docs)
- **Module purpose & scope**
  - Τι καλύπτει: draft creation, line selection, prototype issue, receivables follow-up.
  - Τι δεν καλύπτει: persistence, πραγματική διαβίβαση/myData, immutable issued document.
- **Entry points & navigation**
  - Routes (canonical + redirects): `src/router/router.tsx`.
- **Entities**
  - `InvoiceDraft`, `DraftLine`, `Invoice`, `ReceivableWorkItem`, `BillableWorkItem` από `src/domain/types.ts`.
- **User flows**
  - Draft creation → line selection → save → review → issue → invoice list/detail → collections.
- **State model**
  - `FinancePrototypeState` ως source of truth, τοπικό builder state, drift risks.
- **Calculations**
  - Builder VAT preview vs store net-only totals (explicitly documented as inconsistency μέχρι να σταθεροποιηθεί).
- **Persistence model**
  - In-memory only, initialized from `src/mock/data.ts`.
- **Integrations**
  - “Transmission/myData/E3/ΣΤ.9” ως placeholders (πότε/πώς θα γίνουν πραγματικά).
- **Known gaps & risks**
  - Net vs gross totals, issued invoice truncation, duplicate path artifacts.
- **Open questions**
  - Παραπομπή στο `docs/analysis/invoicing_open_questions.md`.

## PASS checkpoint (μετά το inventory)

### Τι επαληθεύτηκε
- Τα βασικά entry points και η end-to-end prototype ροή draft→issue→invoice→receivable είναι παρούσα και λειτουργεί ως state-only flow.

### Κρίσιμα verified ευρήματα (high-signal)
- **Canonical source of truth**: `src/state/FinancePrototypeState.tsx` (in-memory, seeded από `src/mock/data.ts`) — δεν εντοπίστηκε persistence/API layer στο repo. (Δες `docs/analysis/invoicing_flows_and_states.md`, `docs/analysis/invoicing_system_map.md` “Repository coverage statement”.)
- **Draft vs issued data model**: ο `InvoiceDraftBuilderPage` μοντελοποιεί πλούσιο header+lines, αλλά το issued `Invoice` είναι truncated (δεν κρατά lines/header snapshot). (Δες `docs/analysis/invoicing_domain_and_calculations.md` §§1–3.)
- **Totals ασυνέπεια (net vs VAT-inclusive)**: ο builder δείχνει VAT-inclusive totals, ενώ το store εκδίδει net-only `Invoice.total` και `ReceivableWorkItem.outstanding`. (Δες `docs/analysis/invoicing_flows_and_states.md` “Flow D” και `docs/analysis/invoicing_consistency_audit.md` §1.)
- **Transmission/myData/E3/ΣΤ.9 είναι placeholders**: υπάρχουν ως UI/fields/types αλλά χωρίς downstream adapter/workflow. (Δες `docs/analysis/invoicing_domain_and_calculations.md` §7 και `docs/analysis/invoicing_consistency_audit.md` §§5–6.)

### Τι παραμένει αβέβαιο / άγνωστο (θα τεκμηριωθεί στα επόμενα passes)
- Αν υπάρχει “κρυμμένη” υποστήριξη myData/compliance σε docs ή stories (μη κώδικα) που δεν έχει χαρτογραφηθεί πλήρως.
- Αν υπάρχουν παράλληλες/legacy υλοποιήσεις (π.χ. δεύτερα copies σε `src\views\...` vs `src/views/...` φαίνονται στο git status) που μπορεί να μπερδεύουν build/resolve σε Windows.

### Ποια αρχεία φαίνονται πιο canonical
`src/state/FinancePrototypeState.tsx`, `src/domain/types.ts`, `src/views/drafts/InvoiceDraftBuilderPage.tsx`, `src/router/router.tsx`.

