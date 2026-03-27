## PASS 4–6 — Domain/Data model & υπολογισμοί (Invoices/Drafts/Lines/VAT/myData placeholders)

---

## 1) Οντότητες & σχέσεις (όπως υλοποιούνται σήμερα)

### Finding
Το domain model χωρίζει “Draft” από “Issued invoice” αλλά **δεν υπάρχει πλήρης issued invoice entity** (δεν κρατά lines/header). Οι γραμμές υπάρχουν μόνο ως `DraftLine[]` και μετά το issue η πληροφορία ανακτάται έμμεσα μέσω `BillableWorkItem.invoicedByInvoiceId`.

### Evidence
- `Invoice` type: έχει μόνο `id/number/client/project/issueDate/dueDate/currency/total/paid/status/transmission/owner`. Βλ. `src/domain/types.ts` L25–L38.
- `InvoiceDraft` type: περιέχει draft metadata και “builder-level invoice header fields”. Βλ. `src/domain/types.ts` L40–L82.
- `DraftLine` type: έχει πλούσια line model με VAT/category/classifications/myData placeholders. Βλ. `src/domain/types.ts` L157–L189.
- Σχέση draft→lines: `draftLinesByDraftId: Record<draftId, DraftLine[]>` στο store. Βλ. `src/state/FinancePrototypeState.tsx` L54–L56.
- Σχέση invoice→billableWork: `issueDraft` κάνει mark `billableWork` ως `Invoiced` και θέτει `invoicedByInvoiceId = inv.id`. Βλ. `src/state/FinancePrototypeState.tsx` L276–L289.
- Invoice detail “lines” = linked work: `linkedWork = billableWork.filter(w => w.invoicedByInvoiceId === inv.id)`. Βλ. `src/views/invoices/InvoiceDetailPage.tsx` L46–L47.

### Consequence
- Δεν μπορεί να γίνει αξιόπιστη ανακατασκευή invoice document (header + lines + tax breakdown) από το issued `Invoice` model.
- Οποιαδήποτε myData/compliance/export υποστήριξη είναι πρακτικά **μη υλοποιημένη** end-to-end, παρότι υπάρχουν fields στο `DraftLine`.

### Confidence
High.

---

## 2) InvoiceDraft — field-level map (header)

### Finding
Το `InvoiceDraft` λειτουργεί ως “persistent” store object για header fields, αλλά η UI δημιουργεί default values και τα ενημερώνει μόνο σε explicit save.

### Evidence (type)
`src/domain/types.ts` L40–L82:
- **Core**: `id`, `client`, `project?`, `owner`, `updatedAt`, `currency`, `draftTotal`, `reservedLines`, `status`.
- **Header fields**:
  - `documentType?: string`
  - `paymentWay?: string`
  - `billingEntity?: string`
  - `contractRef?: string`
  - `customerReference?: string`
  - `subject?: string`
  - `issueDate?: string` (YYYY-MM-DD)
  - `paymentTerms?: "Net 15" | "Net 30" | "Net 45"`
  - `dueDate?: string`
  - `externalNote?`, `internalNote?`
  - `series?`, `invoiceNumber?`
  - `relatedDocument? { enabled/reference/number/mark/note }`
  - `movement? { purpose/loadingPlace/deliveryPlace/transportMode/carrier/recipientThirdParty }`

### Evidence (UI defaults)
- Default draft creation sets:
  - `documentType:"ServiceInvoice"`, `billingEntity:"Leia Finance"`, `series:"ΤΠΥ-A"`, `invoiceNumber: buildDraftInvoiceNumber(id)`, `subject:"Υπηρεσίες"`, `paymentTerms:"Net 30"`, `issueDate: today`, `dueDate: issueDate + terms`, notes empty, `contractRef/customerReference` empty.
  Βλ. `src/views/drafts/InvoiceDraftBuilderPage.tsx` L181–L204.

### Consequence
- Υπάρχει “προϊόν-υπόσχεση” header model (σειρά/αριθμός/οντότητα τιμολόγησης/σχετικό παραστατικό/διακίνηση) αλλά δεν καταλήγει σε issued invoice document.

### Confidence
High.

---

## 3) DraftLine — canonical line model (field-level)

### Finding
Το `DraftLine` έχει 3 επίπεδα πεδίων:
1) core (πάντα παρόντα),
2) “official-practical” υπολογιστικά (qty/unit/unitPrice/discount/vatCategory),
3) compliance/classification placeholders (ΣΤ.9, Ε3, myData extra, withholding/stamp duty/etc.).

### Evidence
`src/domain/types.ts` L157–L189:
- **Core**:
  - `id`, `sourceId`, `description`, `amount` (net, prototype), `currency`
- **Calc fields**:
  - `quantity?`, `unit?`, `unitPrice?`, `discountPct?`, `vatCategory?` (6 enums)
- **Classifications**:
  - `st9IncomeCategory?`, `e3IncomeClassification?`
- **Conditional/advanced**:
  - `vatExemptionReason?`, `reverseChargeNote?`, `withholdingPct?`, `stampDutyPct?`, `otherTaxesAmount?`
  - `lineComment?`, `incomeClassification?`, `expenseClassification?`, `specialUnitCode?`, `mydataExtra?`

### Consequence
- Το type “προβλέπει” πολύ πλουσιότερο compliance payload από αυτό που τελικά υπολογίζεται/αποθηκεύεται/εκδίδεται.

### Confidence
High.

---

## 4) Υπολογισμοί γραμμών (net/VAT) — location & consistency

### 4.1 Builder: computeLineNet / computeLineVat

### Finding
Ο builder χρησιμοποιεί canonical (για UI) κανόνα net = qty*unitPrice*(1-discountPct), VAT = net*rate(vatCategory).

### Evidence
- `computeLineNet` στο `InvoiceDraftBuilderPage.tsx`:
  - qty default 1, unitPrice fallback σε `amount`, discount clamped 0..100. Βλ. L146–L152.
- VAT options + rates: `VAT_OPTIONS` + `vatRateFor`. Βλ. L128–L144.
- `computeLineVat`: uses default `"Standard 24%"`. Βλ. L154–L157.

### Consequence
- UI εμφανίζει VAT breakdown και totals, αλλά αυτά είναι **τοπικοί υπολογισμοί UI**, όχι persisted calculations.

### Confidence
High.

### 4.2 Store: computeDraftNetTotal (draftTotal & inv.total)

### Finding
Το store υπολογίζει draft/invoice totals ως **net-only** και με fallbacks στο `DraftLine.amount`.

### Evidence
- `computeDraftNetTotal(lines)` στο `src/state/FinancePrototypeState.tsx` L27–L37.
- Χρήση:
  - `setDraftLines`: sets `draftTotal` από computeDraftNetTotal. Βλ. L195–L205.
  - `issueDraft`: sets `total` στο `Invoice` από computeDraftNetTotal. Βλ. L242–L254.

### Consequence
- Το issued invoice `total` δεν συμφωνεί με το UI’s `grandTotal` όταν υπάρχει VAT.

### Confidence
High.

---

## 5) VAT/discount/rounding rules

### Finding
Δεν υπάρχει κοινή βιβλιοθήκη υπολογισμών ούτε σαφείς rounding rules· οι υπολογισμοί γίνονται με JS numbers, χωρίς στρογγυλοποίηση ανά γραμμή/σύνολο.

### Evidence
- Builder totals: απλά `reduce` και `+` (L510–L523).
- Store totals: `reduce` και JS arithmetic (L27–L37).
- Formatting: `formatCurrency` κάνει formatting σε 2 decimals αλλά δεν αλλάζει τις υποκείμενες τιμές. Βλ. `src/domain/format.ts` L1–L8.

### Consequence
- Μελλοντικά (σε πραγματικό persistence/compliance) υπάρχει υψηλός κίνδυνος rounding drift και audit mismatches, ειδικά αν πρέπει να γίνει rounding per line σύμφωνα με myData/λογιστικά standards.

### Confidence
Medium (ο κώδικας δείχνει απουσία rounding, αλλά το repo δεν έχει backend για να επιβεβαιωθεί απαιτούμενη πολιτική).

---

## 6) Numbering / series

### Finding
Υπάρχουν δύο παράλληλοι μηχανισμοί “invoice number”:
- Draft builder: `invoiceNumber` string που βασίζεται σε `draftId` digits.
- Issued invoice: `Invoice.number` που βασίζεται σε global sequence `invoiceSeqRef` seeded από `initialInvoices`.

### Evidence
- Draft invoiceNumber: `buildDraftInvoiceNumber(draftId)` στο builder. Βλ. `InvoiceDraftBuilderPage.tsx` L119–L124.
- Issued invoice numbering:
  - `invoiceSeqRef` seeded από `initialInvoices` IDs `inv_1001...`. Βλ. `FinancePrototypeState.tsx` L128–L135.
  - `inv.number = INV-${year}-${padStart(seq,5)}`. Βλ. L245–L258.
- Draft series field: `series: "ΤΠΥ-A"` default στο draft creation. Βλ. `InvoiceDraftBuilderPage.tsx` L194–L196.

### Consequence
- Το draft “Σειρά/Αριθμός” δεν συνδέεται με το issued `Invoice.number`.
- Δεν υπάρχει canonical rule για series/sequence per entity/legal doc type.

### Confidence
High.

---

## 7) myData / compliance picture (τι υπάρχει vs τι υπονοείται)

### Finding
Υπάρχουν UI labels/fields που μοιάζουν με myData/compliance (π.χ. Ε3, ΣΤ.9, MARK, transmission status), αλλά δεν υπάρχει end-to-end mapping/export ή state machine.

### Evidence
- Builder line fields for ΣΤ.9 και Ε3: UI columns και `patchLine` σε `st9IncomeCategory`, `e3IncomeClassification`. Βλ. `InvoiceDraftBuilderPage.tsx` L1179–L1277.
- Related document fields include `mark`. Βλ. `InvoiceDraftBuilderPage.tsx` L240–L245 και `InvoiceDraft` type `relatedDocument.mark`. Βλ. `src/domain/types.ts` L66–L72.
- `TransmissionStatus` exists on `Invoice`, and UI uses Pending/Rejected/Accepted messaging. Βλ. `src/domain/types.ts` L9; `FinancePrototypeState.tsx` L255–L257; `InvoicesPage.tsx` L485–L492; `InvoiceDetailPage.tsx` L109–L123.
- No myData adapter files found; search hits only in `types.ts` and `InvoiceDraftBuilderPage.tsx`.

### Consequence
- Το προϊόν δίνει “σήματα” φορολογικής/ηλεκτρονικής διαβίβασης, αλλά σήμερα είναι **placeholder UX**. Αυτό είναι κρίσιμο για τεκμηρίωση: πρέπει να χαρακτηριστεί ως “prototype-only”.

### Confidence
High (για το “τι υπάρχει”), Low–Medium (για “τι intended” από naming).

---

## PASS checkpoint (domain+calculations)

### Τι επαληθεύτηκε
- Πλήρης field-level map για Draft/Line/Invoice/Receivable.
- Διπλή υλοποίηση totals και ξεκάθαρη net vs gross ασυνέπεια.

### Τι παραμένει αβέβαιο
- Οποιαδήποτε πραγματική πολιτική VAT rounding / myData schema mapping (δεν υπάρχει υλοποίηση στο repo).

### Πιο canonical αρχεία
`src/domain/types.ts`, `src/views/drafts/InvoiceDraftBuilderPage.tsx`, `src/state/FinancePrototypeState.tsx`.

