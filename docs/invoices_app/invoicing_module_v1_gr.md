# Invoicing System v1.01
 
---

## 1. Σκοπός εγγράφου

Το παρόν έγγραφο ορίζει το invoicing module ως canonical v1 functional brief. Καλύπτει λειτουργικό ρόλο, οθόνες, ροές, data concepts/ownership, υπολογισμούς, permissions και καταστάσεις, μαζί με τα ανοιχτά σημεία που επηρεάζουν τη σταθεροποίηση του v1.

Απευθύνεται σε Product, Engineering και QA για κοινό λεξιλόγιο και κοινή κατανόηση του invoicing μέσα στο συνολικό finance system.

Το κείμενο είναι λειτουργικό brief (όχι storage architecture spec). Οι περιορισμοί της τρέχουσας υλοποίησης σημειώνονται ρητά στα αντίστοιχα σημεία (ιδίως §8/§13).

---

## 2. Πλαίσιο και όρια της ενότητας invoicing

### 2.1 Τι περιλαμβάνεται

Το invoicing καλύπτει τον operational κύκλο από billable work → draft → issued invoice/receivable context → collections follow‑up. Περιλαμβάνει drafts list, draft builder, invoices list, invoice detail και τις σχετικές views για receivables/collections.

Στο v1, τα drafts, τα issued records και το receivable context πρέπει να παραμένουν διαθέσιμα και ανακτήσιμα σε όλη τη ροή. Οι βασικές λειτουργίες του module είναι η δημιουργία και συνέχιση draft, η σύνθεση γραμμών, η αποθήκευση, το issue και το collections follow‑up.
 
**Intended operational role (blueprint)**
- Η `Overview/Επισκόπηση` λειτουργεί ως monitoring shell που οδηγεί σε worklists (`Drafts`, `Invoices`, `Collections`), όχι ως execution workspace.


### 2.2 Σχέση με το ευρύτερο Finance Management & Monitoring System

- **Θέση στο συνολικό μοντέλο**:
  - 1) Κύκλος Εσόδων / Απαιτήσεων
  - 2) Κύκλος Δαπανών / Υποχρεώσεων
  - 3) Προϋπολογισμός / Audit Trail / Κόστος Προσωπικού

**Σχέση με monitoring shell (Overview)**
- Το `Finance Overview Dashboard` παρουσιάζει KPIs/exposure/overdue και κάνει drilldown προς invoicing worklists (`Invoice Drafts`, `Invoices`, `Collections`). Δεν είναι “χώρος έκδοσης”.
- Η αξιοπιστία των KPIs για receivables εξαρτάται από καθαρή σημασιολογία ποσών. Στο v1 υπάρχει γνωστό mismatch (UI gross preview vs net-only issued totals). Αυτό τεκμηριώνεται ρητά στο §10 και στο §13.

---

## 3. Λειτουργικός ρόλος του invoicing module

### 3.1 Revenue loop position

Το invoicing είναι ο κόμβος που μετατρέπει billable work σε invoice context και receivable context μέσα στον revenue loop.

Στο v1, το issue μεταφέρει το draft σε issued invoice context και δημιουργεί το αντίστοιχο receivable context μέσα στο module. Η ροή αυτή υποστηρίζει review και follow‑up. Τυχόν transmission/compliance/λογιστική σημασιολογία παραμένει εκτός scope εκτός αν δηλωθεί ρητά ως υλοποιημένη.

#### 3.1.1 Διάγραμμα — Overall invoicing loop (v1)

![](../finance/invoicing/diagrams/assets/invoicing-loop.svg)

Το διάγραμμα συνοψίζει τη θέση του invoicing μέσα στο revenue loop: από “billable work” σε draft, σε issued invoice/receivable, σε collections follow-up και (ενδεχόμενα) σε collected cash.  
Στο **στόχο v1** αυτό πρέπει να υποστηρίζεται με persistence ώστε drafts/invoices/receivables να είναι ανακτήσιμα. Οι σημερινοί περιορισμοί αποθήκευσης καταγράφονται στο §13.

Το “Collected Cash” εδώ είναι **conceptual end-state** και δεν τεκμηριώνει από μόνο του πλήρως υλοποιημένο payment registration workflow ή accounting cash truth.

**Τι σημαίνει “Issue” σήμερα (canonical phrasing)**
- **Implemented**: “Μετατροπή draft σε minimal issued record + linked receivable”.
- **Placeholder**: `TransmissionStatus`/διαβίβαση ως label/state field.
- **Open decision**: αν/πότε το “Issue” θα σημαίνει immutable παραστατικό με πλήρες snapshot (header+lines) και εξωτερικά identifiers.

**Κρίσιμος περιορισμός**  
Στο v1, το “Issue” είναι **λειτουργική μετάβαση** που δημιουργεί minimal issued record και linked receivable. Δεν ισοδυναμεί με νόμιμη έκδοση παραστατικού, immutable finalization, διαβίβαση (provider/myData), λογιστική καταχώρηση ή compliance completion.

### 3.2 Navigation discipline

- **Canonical navigation paths**:
  - Drafts: `/finance/revenue/drafts`
  - Draft builder: `/finance/revenue/drafts/:draftId/builder`
  - Invoices: `/finance/revenue/invoices`
  - Invoice detail: `/finance/revenue/invoices/:invoiceId`
  - Collections: `/finance/revenue/collections`

**Navigation discipline (v1)**
- Μοντέλο: `Overview → Worklist → Detail → Action → Back`. Τα routes είναι τα canonical entry points του revenue loop (drafts/invoices/collections).

### 3.3 Operational role του module

- **Τι δίνει στους χρήστες**: δημιουργία/σύνθεση draft, issue μετάβαση σε issued invoice/receivable context, παρακολούθηση invoice/receivable και βασικά operational signals.
- **Ανοιχτό scope**: διαβίβαση, immutable invoice snapshot ως document artifact, και κλειδωμένη πολιτική rounding/tax.

**Διάκριση**
- **v1 scope**: Draft → Save/Issue → Invoices list/detail → Receivables/Collections follow-up.
- **UI placeholders**: transmission statuses, compliance-like fields, “πλήρες παραστατικό” preview χωρίς persisted snapshot.
- **Open decisions**: canonical semantics ποσών (net/gross), numbering policy, persistence layer, compliance workflow/state machine.

---

## 4. Χάρτης οθονών και πλοήγησης

Η ενότητα invoicing οργανώνεται ως worklists (Drafts/Invoices/Collections) + builder (Action) + single-record detail (Invoice Detail). Παρακάτω τεκμηριώνεται ο ρόλος κάθε οθόνης με έμφαση στο “primary question” και στην “primary action”.

**Πίνακας 1 — Screen map table**

| Οθόνη | Ρόλος | Κύριο ερώτημα | Κύρια ενέργεια | Κύρια έξοδος |
|---|---|---|---|---|
| Invoice Drafts List | Worklist για drafts (triage/συνέχιση/καθαρισμός) | Ποια drafts χρειάζονται συνέχεια/review/καθάρισμα; | Open draft → “Open in Draft Builder” | Draft προς επεξεργασία |
| Invoice Draft Builder | Action workspace σύνθεσης draft | Τι τιμολογώ και υπό ποιους όρους (header/terms); | Add billable work / add custom line / edit header / save / issue | Saved draft ή issued invoice context |
| Invoices List | Worklist issued invoices/receivables | Ποια invoices είναι open/overdue/με transmission status; | Open detail ή jump to Collections | Επιλεγμένο invoice/receivable για review |
| Invoice Detail View | Single-record view (fidelity constraints) | Ποια είναι η κατάσταση αυτού του receivable; | Add collection note / go to Collections | Ενημερωμένο follow-up context |
| Collections / Receivables | Worklist follow-up/aging | Ποιες απαιτήσεις χρειάζονται follow-up τώρα; | Add note / drilldown σε invoice | Follow-up notes & triage context |

### 4.1 Invoice Drafts List

Η οθόνη είναι worklist για drafts: ανακάλυψη, triage και συνέχιση.

**Screen role (blueprint)**: επιχειρησιακή “ουρά drafts” ώστε τα drafts να παραμένουν ανακαλύψιμα και να οδηγούν σε συνέχεια/έλεγχο/καθαρισμό, χωρίς να “χάνονται” στον builder.

**v1 συμπεριφορά (ενδεικτικά)**: worklist με βασικά signals (π.χ. stale/review-needed όπου εφαρμόζεται) και συνεπές άνοιγμα στον draft builder.

### 4.2 Invoice Draft Builder

Ο builder είναι το action workspace για σύνθεση invoice draft (header + lines + preview) με explicit save/issue. Κρίσιμο caveat: VAT/gross preview στο UI vs net-only issued totals (βλ. §10).

**Primary question**: “Τι ακριβώς εκδίδω (γραμμές) και υπό ποιους όρους;”

**Primary actions**
- Επιλογή billable work (drawer) → δημιουργία `DraftLine` με `sourceId`.
- Προσθήκη custom line (`sourceId: custom_*`).
- Επεξεργασία header (series/number, dates, payment terms, notes, related document, movement).
- `Save` για αποθήκευση του draft και `Issue` για μετάβαση σε issued invoice/receivable context.

**v1 συμπεριφορά (ενδεικτικά)**: το issue γίνεται διαθέσιμο μόνο όταν το draft είναι βασικά “έτοιμο” (γραμμές, βασική εγκυρότητα, permission gating). Το UI preview μπορεί να μην ευθυγραμμίζεται με το issued total (βλ. §10).

### 4.3 Invoices List

Η οθόνη είναι worklist για issued invoices/receivables με φίλτρα, aging/overdue και transmission label. Σήμερα το issued model είναι minimal και το transmission είναι placeholder (χωρίς end-to-end workflow).

### 4.4 Invoice Detail View

Η οθόνη είναι single-record review page (fidelity constraints) για ένα issued invoice/receivable: linked work, status, notes και follow‑up context. Στο v1 δεν αποτελεί πλήρες invoice document snapshot· οι “γραμμές” προκύπτουν έμμεσα από linked billable work (όχι από stored invoice lines).

### 4.5 Collections / Receivables

Η οθόνη είναι worklist collections: triage βάσει aging/overdue, owner/follow‑up και notes. Caveat: αν το `outstanding` κληρονομεί net-only totals, το ποσό collections μπορεί να είναι λανθασμένο (βλ. §10/§13). Payment progress/expected payment date δεν είναι end‑to‑end κλειδωμένα στο v1.

### 4.6 Entry points και transitions μεταξύ οθονών

Entry: dashboard/app launcher → drafts/invoices/collections. Core transitions: drafts → builder, issue → invoice detail, invoices/collections → detail. Το Issue παραμένει gated από permissions και βασική πληρότητα/εγκυρότητα draft (γραμμές, εγκυρότητα custom lines).

---

## 5. Screenshot walkthrough

> Σημείωση: Τα screenshots προέρχονται από το τρέχον UI prototype και χρησιμοποιούνται ως οπτική τεκμηρίωση των οθονών/μοτίβων πλοήγησης.

### 5.1 Dashboard / entry screen

#### 5.1.1 Entry point προς Revenue/Invoicing

![](./home_apps_screen.png)

*Σχήμα 1. Entry screen (apps) ως σημείο εκκίνησης προς worklists Revenue (Drafts / Invoices / Collections).*

Η εικόνα δείχνει το “launcher”/entry πλαίσιο από όπου ο χρήστης μπαίνει στις operational οθόνες. Στο v1, το `Overview`/monitoring λειτουργεί ως shell για drilldowns, ενώ η εκτέλεση συμβαίνει στα worklists και στα detail pages.

**Τι πρέπει να παρατηρηθεί**
- **Πειθαρχία πλοήγησης**: “entry → worklist → detail → action → back”.
- **Όρια ρόλου**: το entry/overview δεν είναι workspace έκδοσης — οδηγεί σε οθόνες εκτέλεσης.
- **Εννοιολογική ομαδοποίηση**: revenue loop ως ξεχωριστός operational χώρος.

### 5.2 Drafts list

#### 5.2.1 Λίστα drafts ως operational ουρά (triage)

![](./invoice_drafts_list.png)

*Σχήμα 2. Λίστα invoice drafts με operational triage και context για συνέχιση στο builder.*

Η οθόνη λειτουργεί ως worklist για να εντοπίζονται drafts που χρειάζονται συνέχεια/έλεγχο/καθαρισμό. 

**Τι πρέπει να παρατηρηθεί**
- **Row selection → συνέχεια**: το draft ανοίγει/προβάλλεται και οδηγεί σε builder.
- **Signals**: status/updatedAt και “triage cues” (π.χ. stale) ως ένδειξη προτεραιότητας.
- **Draft ≠ issued**: εδώ μιλάμε για work-in-progress records, όχι παραστατικά.

### 5.3 Draft builder — main

#### 5.3.1 Κύρια επιφάνεια σύνθεσης draft (compact view)

![](./invoice_draft_details.png)

*Σχήμα 3. Κύρια επιφάνεια σύνθεσης invoice draft: header + γραμμές + actions.*

Η εικόνα δείχνει το βασικό workspace σύνθεσης draft: γραμμές, header και ενέργειες (save/issue). Τα VAT/gross σύνολα είναι UI preview, ενώ το issued record παραμένει minimal (βλ. §10, §13).

**Τι πρέπει να παρατηρηθεί**
- **Διάκριση περιοχών**: header πεδία vs πίνακας γραμμών vs actions.
- **Τύποι γραμμών**: source-derived vs custom (διαφορετική “συμπεριφορά”/επεξεργασιμότητα).
- **Preview vs canonical**: η UI μπορεί να δείχνει preview totals που δεν ταυτίζονται με net-only issued totals.

#### 5.3.2 Κύρια επιφάνεια σύνθεσης draft (full view)

![](./invoice_draft_details_full.png)

*Σχήμα 4. Πλήρης προβολή builder (full) για πλήρη ορατότητα πεδίων/στηλών και action area.*

Παρατίθεται και full εκδοχή για να καταγράφεται τι εκτίθεται σήμερα στον χρήστη (πεδία/στήλες, συμπεριλαμβανομένων compliance-like blocks που είναι placeholders).

**Τι πρέπει να παρατηρηθεί**
- **Compliance-like πεδία**: υπάρχουν ως UI fields, αλλά τεκμηριώνονται ως placeholder αν δεν υπάρχει exporter/state machine.
- **Action gating**: πότε είναι διαθέσιμο/disabled το issue (βλ. §11).
- **Σημεία drift**: editing context vs saved draft (save/issue).

### 5.4 Draft builder — add billable work

#### 5.4.1 Drawer επιλογής billable work (source pool)

![](./invoice_draft_add_billable_work_drawer.png)

*Σχήμα 5. Drawer επιλογής billable work για προσθήκη στο draft.*

Ο drawer δείχνει το source pool (billable work) από όπου προκύπτουν draft lines και το gating που αποτρέπει duplicate invoicing (Available/Reserved).

**Τι πρέπει να παρατηρηθεί**
- **Source-of-lines**: οι περισσότερες γραμμές “πηγάζουν” από billable work, όχι από χειροκίνητη καταχώρηση.
- **Gating/κανόνες επιλογής**: διακριτότητα `Available`/`Reserved` και γιατί αυτό υπάρχει.
- **Στόχος**: ασφαλής σύνθεση draft χωρίς διπλοτιμολόγηση.

#### 5.4.2 Προσθήκη custom line (χειροκίνητη γραμμή)

![](./invoice_draft_add_line.png)

*Σχήμα 6. Προσθήκη/επεξεργασία custom γραμμής στο draft.*

Η custom γραμμή καλύπτει περιπτώσεις χωρίς αντίστοιχο billable work ή “ειδικές” γραμμές. Υπάρχει validation που μπορεί να μπλοκάρει save/issue όταν η γραμμή είναι invalid.

**Τι πρέπει να παρατηρηθεί**
- **Custom vs source-derived**: διαφορετικές παραδοχές για editability και validation.
- **Validation gating**: invalid γραμμές μπλοκάρουν save/issue (UI gating).
- **Semantics**: τα ποσά εδώ τροφοδοτούν UI preview totals, όχι απαραίτητα canonical issued totals.

#### 5.4.3 Κατάσταση draft μετά την προσθήκη εργασιών/γραμμών

![](./invoice_draft_works_added.png)

*Σχήμα 7. Draft με προστιθέμενες εργασίες/γραμμές — έλεγχος mapping και συνοχής.*

Η εικόνα δείχνει το αποτέλεσμα της επιλογής: οι εργασίες μετατρέπονται σε γραμμές draft (billable work → draft lines).

**Τι πρέπει να παρατηρηθεί**
- **Linkage**: `sourceId`/περιγραφή/τιμή μεταφέρονται στη γραμμή.
- **VAT category defaults**: οι γραμμές συνήθως ξεκινούν με default VAT category (preview).
- **Readiness**: ύπαρξη γραμμών είναι βασικό prerequisite για issue (v1).

### 5.5 Draft builder — bill-to / details

#### 5.5.1 Bill-to και header πεδία παραστατικού (draft-level)

![](./invoice_draft_bill_to.png)

*Σχήμα 8. Bill-to και draft header fields (σειρά/αριθμός/ημερομηνίες/όροι).*

Εδώ φαίνονται τα header fields του draft. Λειτουργικά “κλειδώνουν” με explicit αποθήκευση draft.

**Τι πρέπει να παρατηρηθεί**
- **Draft-level δεδομένα**: series/number, dates, terms και notes ως μέρος `InvoiceDraft`.
- **State ownership**: editing context → draft save (βλ. §8).
- **Issue readiness gap**: UI μπορεί να δείχνει required, αλλά οι κανόνες ετοιμότητας δεν είναι πλήρως κλειδωμένοι/επιβεβλημένοι ως v1 policy (βλ. §11, §13).

### 5.6 Draft builder — preview

#### 5.6.1 Preview/Review πριν από Save/Issue

![](./invoice_draft_preview.png)

*Σχήμα 9. Preview draft παραστατικού πριν την έκδοση.*

Το preview είναι document-like αναπαράσταση για τελικό έλεγχο πριν από save/issue. Δεν αποτελεί persisted invoice document snapshot.

**Τι πρέπει να παρατηρηθεί**
- **Preview-only χαρακτήρας**: σύνοψη για τελικό έλεγχο· δεν ισοδυναμεί με persisted issued document snapshot.
- **Totals display**: μπορεί να δείχνει VAT-inclusive σύνολα που δεν ευθυγραμμίζονται με net-only issued totals.
- **Auditability gap**: μετά το issue δεν υπάρχει πλήρης ανακατασκευή “ακριβώς αυτού” του preview.

### 5.7 Draft builder — save confirmation

#### 5.7.1 Επιβεβαίωση αποθήκευσης draft

![](./invoice_draft_save_confirm.png)

*Σχήμα 10. Επιβεβαίωση αποθήκευσης draft.*

Η οθόνη δείχνει ότι η αποθήκευση είναι ρητή ενέργεια και διαχωρίζει την τρέχουσα επεξεργασία από το αποθηκευμένο draft.

**Τι πρέπει να παρατηρηθεί**
- **Explicit sync point**: η αποθήκευση είναι “όριο” μεταξύ editing context και saved draft.
- **Boundary**: δεν υπονοείται server-side αποθήκευση.
- **Risk**: αλλαγές πριν το save μπορούν να χαθούν (navigation/refresh).

### 5.8 Draft builder — discard confirmation

#### 5.8.1 Επιβεβαίωση απόρριψης/εξόδου χωρίς αποθήκευση

![](./invoice_draft_discard_confirm.png)

*Σχήμα 11. Επιβεβαίωση discard/exit χωρίς save — προστασία από απώλεια αλλαγών.*

Το discard confirmation μειώνει ακούσια απώλεια αλλαγών σε περιβάλλον dual state (editing context vs saved draft).

**Τι πρέπει να παρατηρηθεί**
- **Διαχείριση ρίσκου drift**: το UI αναγνωρίζει ότι μπορεί να υπάρχουν unsaved changes.
- **Operational discipline**: σαφές “save ή discard” πριν την έξοδο.
- **Σχέση με reservations**: πολιτικές release reserved lines είναι open decision (όχι end-to-end κανόνας εδώ).

### 5.9 Invoices list

#### 5.9.1 Worklist issued invoices/receivables

![](./invoices_list.png)

*Σχήμα 12. Λίστα issued invoices με status signals και γρήγορο drilldown σε detail/collections.*

Η οθόνη συγκεντρώνει τα issued records ως operational worklist. Το transmission εμφανίζεται ως status label (placeholder).

**Τι πρέπει να παρατηρηθεί**
- **Status chips/signals**: χρησιμοποιούνται για triage, όχι ως “διακοσμητικά”.
- **Transmission ως placeholder**: `Pending/Accepted/Rejected` δεν προκύπτουν από πραγματική διαβίβαση.
- **Drilldown**: worklist → detail για single-record review.

### 5.10 Invoice detail

#### 5.10.1 Invoice detail (compact) — single-record review

![](./invoice_details.png)

*Σχήμα 13. Invoice detail ως single-record review page (fidelity constraints) για ένα issued record.*

Το invoice detail είναι single-record review page για invoice/receivable και λειτουργεί ως review context (συνδέσεις, σήματα, notes).

**Τι πρέπει να παρατηρηθεί**
- **Linked work vs invoice lines**: εμφανίζεται εργασία συνδεδεμένη με invoiceId, όχι persisted invoice lines.
- **Collections adjacency**: notes/follow-up εμφανίζονται ως operational context.
- **Transmission block**: status πεδίο υπάρχει, αλλά δεν υποστηρίζεται από workflow.

#### 5.10.2 Invoice detail (full) — πλήρης αποτύπωση της τρέχουσας UI αλήθειας

![](./invoice_details_full.png)

*Σχήμα 14. Πλήρης detail οθόνη (full) για να καταγράφονται όλα τα sections που εκτίθενται στον χρήστη.*

Παρατίθεται η full εκδοχή ώστε να είναι σαφές τι εμφανίζει σήμερα το UI (sections, signals, notes), συμπεριλαμβανομένων blocks που είναι placeholders.

**Τι πρέπει να παρατηρηθεί**
- **Τι “υπάρχει” οπτικά**: sections που φαίνονται ακόμα κι αν δεν έχουν backend λειτουργικότητα.
- **Audit/notes**: τι υπάρχει ως timeline και τι ως follow-up note.
- **Fidelity constraints**: τι δεν μπορεί να εμφανιστεί (π.χ. πραγματικό invoice document snapshot).

### 5.11 Revenue views

#### 5.11.1 Revenue list — ευρύτερο revenue context (adjacent)

![](./revenue_list.png)

*Σχήμα 15. Revenue list ως adjacent context του revenue loop (όχι αντικατάσταση του invoicing worklist).*

Η revenue list δίνει ευρύτερο πλαίσιο “revenue items” γύρω από το invoicing/receivables. Δεν αντικαθιστά τις οθόνες invoicing, αλλά βοηθά στη σύνδεση του “τι τιμολογώ” με το “τι παρακολουθώ/εισπράττω”.

Στο παρόν brief παρατίθεται **μόνο** ως adjacent context (βοηθά να μη παρερμηνευτεί το invoicing ως “γενικό revenue dashboard”). Δεν προσθέτει επιπλέον invoicing actions.

**Τι πρέπει να παρατηρηθεί**
- **Adjacency**: πώς συμπληρώνει (όχι αντικαθιστά) τα invoicing worklists.
- **Drilldown discipline**: από λίστα σε detail για context.
- **Όρια**: δεν υπονοεί λογιστική/GL λειτουργικότητα.

#### 5.11.2 Revenue detail — adjacent UI context only (non-canonical for invoicing v1)

![](./revenue_details.png)

*Σχήμα 16. Revenue detail ως adjacent UI context (non-canonical για invoicing v1).*

Το revenue detail είναι drilldown σε revenue αντικείμενο. Εδώ παρατίθεται μόνο ως adjacent UI context και δεν αποτελεί canonical μέρος του invoicing v1 brief.

**Τι πρέπει να παρατηρηθεί**
- **Σύνδεση εννοιών**: revenue item ↔ invoicing/receivables (conceptual adjacency).
- **Operational focus**: οι ενέργειες invoicing παραμένουν στο draft builder / invoices / collections.
- **Note**: η έκταση end-to-end linkage είναι open decision.

---

## 6. Βασικές ροές χρήστη

Οι ροές παρακάτω ακολουθούν το μοτίβο “v1 συμπεριφορά → intended operational role → open decisions”.

#### 6.0.1 Διάγραμμα — Draft lifecycle (v1)

![](../finance/invoicing/diagrams/assets/draft-lifecycle.svg)

Το διάγραμμα αποτυπώνει τον κύκλο ζωής ενός draft στο v1: δημιουργία, επιλογή γραμμών, συμπλήρωση header, save/review και τελικά issue ή discard. Οι έλεγχοι “issue readiness” δεν επιβάλλονται πλήρως ως κλειδωμένη v1 policy (βλ. §11/§13).

#### 6.0.2 Διάγραμμα — Issue flow (v1 transitions)

Το διάγραμμα του issue flow παρατίθεται μέσα στο **Flow E**, στο σημείο που περιγράφεται η μετάβαση “Issue”.

#### 6.0.3 Διάγραμμα — Collections follow-up flow (v1)

Το διάγραμμα του collections follow‑up παρατίθεται μέσα στο **Flow G**, στο σημείο που περιγράφεται η ροή follow‑up.

### 6.1 Flow A — Ανακάλυψη / συνέχιση draft

**Στόχος χρήστη**
- Να εντοπίσει ένα draft που έχει μείνει σε εκκρεμότητα και να το συνεχίσει.

**v1 βήματα**
- Από το worklist των drafts επιλέγει draft και ανοίγει τον draft builder.
- Συνεχίζει από το σημείο που είχε μείνει.

![](./invoice_drafts_list.png)

*Σχήμα. Flow A — Drafts worklist (ανακάλυψη/συνέχιση).*

**Intended operational role**
- Να λειτουργεί ως triage queue για drafts (π.χ. stale/needs review/reserved lines warning) ώστε να μην “χάνονται” μέσα στο builder.

**Open decision**
- Τυπικός κανόνας “stale draft” (σήμερα εμφανίζεται ως σήμα/label, όχι ως πλήρως κλειδωμένος κανόνας μετάβασης).

### 6.2 Flow B — Σύνθεση draft από billable work

**v1 συμπεριφορά**
- Υπάρχει source pool billable work. Το UI gating αποτρέπει duplicate invoicing: επιτρέπει add όταν item είναι `Available` ή `Reserved` από το ίδιο draft. Το add δημιουργεί `DraftLine` με defaults (π.χ. `quantity:1`, `unit:"ea"`, `discountPct:0`, `vatCategory:"Standard 24%"`).

![](./invoice_draft_add_billable_work_drawer.png)

*Σχήμα. Flow B — Επιλογή billable work για προσθήκη στο draft.*

**Intended operational role**
- “Ασφαλής” μετατροπή billable work σε τιμολογήσιμες γραμμές, με ορατότητα για reservations.

**Open decisions**
- Grouping/aggregation κανόνες (π.χ. 1 work item = 1 line ή aggregation ανά project/service).

### 6.3 Flow C — Επεξεργασία invoice header

**Στόχος χρήστη**
- Να συμπληρώσει/διορθώσει τα header στοιχεία (bill-to, series/number, ημερομηνίες, όροι πληρωμής, notes).

**v1 συμπεριφορά**
- Οι αλλαγές γίνονται στον draft builder και “καταγράφονται” με explicit αποθήκευση draft.

![](./invoice_draft_bill_to.png)

*Σχήμα. Flow C — Header/bill‑to πεδία στο draft.*

**Caveat**
- UI μπορεί να δείχνει `*` required, αλλά η “ετοιμότητα για issue” δεν είναι πλήρως κλειδωμένη/επιβεβλημένη ως v1 policy.

**Open decision**
- Canonical required fields policy πριν issue.

### 6.4 Flow D — Save draft

**Στόχος χρήστη**
- Να καταγράψει την πρόοδο του draft (ώστε να μπορεί να το συνεχίσει/κάνει review).

**v1 βήματα**
- Επιλέγει “Save” και επιβεβαιώνει την αποθήκευση.
- Το draft εμφανίζεται/παραμένει διαθέσιμο στη λίστα drafts.

![](./invoice_draft_save_confirm.png)

*Σχήμα. Flow D — Επιβεβαίωση αποθήκευσης draft.*

**Known limitation**
**Limitation**
- Χωρίς persistence, refresh/reload μπορεί να χάσει drafts και in-progress αλλαγές (βλ. §13).

**Open decision**
- Μελλοντικό persistence (backend vs local) και conflict/locking μοντέλο.

### 6.5 Flow E — Issue draft

**Στόχος χρήστη**
- Να μετατρέψει ένα draft σε issued invoice context ώστε να ξεκινήσει παρακολούθηση/είσπραξη (receivable follow-up).

**v1 βήματα**
- Κάνει issue από τον draft builder (μετά από save).
- Δημιουργείται minimal issued record και linked receivable.

![](../finance/invoicing/diagrams/assets/issue-flow.svg)

*Σχήμα. Flow E — Issue flow (από draft σε issued invoice/receivable context).*

**Enforced today**
- Το issue δεν είναι διαθέσιμο/δεν ολοκληρώνεται αν το draft δεν έχει γραμμές.

**Caveats**
- **Data truncation**: issued `Invoice` δεν κρατά header/lines snapshot.
- **Totals mismatch**: UI δείχνει VAT-inclusive preview totals, αλλά το issued invoice context κρατά net-only totals (βλ. §10).
- **Transmission**: `TransmissionStatus: "Pending"` χωρίς workflow (placeholder).

**Κρίσιμος περιορισμός (υπενθύμιση)**  
Το “Issue” στο v1 **δεν** είναι νομική/αμετάβλητη έκδοση παραστατικού, ούτε ολοκλήρωση διαβίβασης/συμμόρφωσης ή λογιστική καταχώρηση. Είναι module transition.

**Open decisions**
- Τι σημαίνει “Issue” ως immutable παραστατικό σε v1/v2 (approval/transmission/credit notes).

### 6.6 Flow F — Παρακολούθηση issued invoice

**Στόχος χρήστη**
- Να εντοπίσει και να κάνει review ένα issued record (status/aging/notes) και να κινηθεί προς collections follow-up.

**v1 βήματα**
- Από τη λίστα invoices ανοίγει το invoice detail.
- Προσθέτει follow-up context (π.χ. note) ή μεταβαίνει στο collections worklist.

![](./invoices_list.png)

*Σχήμα. Flow F — Worklist issued invoices για review/drilldown.*

**Note**
- Transmission status υπάρχει ως UI signal (`TransmissionStatus`) χωρίς end-to-end διαβίβαση.

**Open decisions**
- Immutable audit model, cancel/credit note flows, payments registration semantics.

### 6.7 Flow G — Collections follow-up

**Στόχος χρήστη**
- Να οργανώσει την εργασία είσπραξης πάνω σε ανοικτές απαιτήσεις (receivables).

**v1 βήματα**
- Από το collections worklist φιλτράρει/προτεραιοποιεί με βάση aging/overdue.
- Προσθέτει follow-up note/owner context και κάνει drilldown σε invoice detail όταν χρειάζεται.

![](../finance/invoicing/diagrams/assets/collections-flow.svg)

*Σχήμα. Flow G — Collections follow‑up flow (review → follow‑up → progress).*

**Caveat**
- Το collections amount/outstanding κληρονομεί `Invoice.total` → άρα επηρεάζεται από το net-only vs gross mismatch (βλ. §10.4, §10.6).

**Open decisions**
- Partial payments, allocation, reconciliation, dunning/escalations.

---

## 7. Οντότητες και δεδομένα

Οι οντότητες παρακάτω είναι τα βασικά data concepts του invoicing module στο v1. Η βασική διαφοροποίηση είναι ότι το issued `Invoice` είναι minimal και **δεν** λειτουργεί ως πλήρες document snapshot.

**Πίνακας 2 — Entity ownership table**

| Οντότητα | Ρόλος | Canonical source | Χρησιμοποιείται σε | Παρατηρήσεις |
|---|---|---|---|---|
| `InvoiceDraft` | Draft header + metadata | Prototype store (v1 persistence target) | Drafts list, Draft builder | Τα header fields “κλειδώνουν” λειτουργικά με explicit save |
| `DraftLine` | Draft γραμμή (source-derived ή custom) | Prototype store (v1 persistence target) | Draft builder, draft preview | Περιέχει preview/tax/compliance-like fields που δεν είναι end-to-end |
| `Invoice` | Issued record (minimal) | Prototype store (v1 persistence target) | Invoices list, Invoice detail | **Δεν** κρατά lines/header snapshot |
| `ReceivableWorkItem` | Απαίτηση/collections unit | Prototype store (v1 persistence target) | Collections, Invoice detail | `outstanding` συνδέεται με `Invoice.total` (semantics risk) |
| `BillableWorkItem` | Πηγή τιμολόγησης | Prototype store (v1 persistence target) | Draft builder, Invoice detail | Χρησιμοποιείται για line sourcing και για linkage μετά το issue |
| `AuditEvent` / notes | Traceability & follow-up | Prototype store (v1 persistence target) | Invoice detail, Collections | Timeline/notes context· όχι immutable ledger |

### 7.1 InvoiceDraft

Draft entity με header fields και metadata. Ανοιχτό σημείο: canonical required fields και mapping σε issued invoice snapshot.

**Σημερινή χρήση**
- Κρατά payment terms/dates, series/number, notes, related document, movement, κ.λπ.
- Δεν μεταφέρεται ως πλήρες snapshot στο issued `Invoice` entity (limitation).

### 7.2 DraftLine

Γραμμή draft με qty/unitPrice/discount/VAT category και classification placeholders. Caveat: οι line‑level υπολογισμοί γίνονται στον builder (UI) και όχι σε κοινό canonical engine.

**Origins**
- **Source-derived**: από `BillableWorkItem` (`sourceId`).
- **Custom**: `sourceId: custom_*` (editable line semantics).

### 7.3 Invoice

- **Τι είναι**: minimal issued invoice record (v1 context, με περιορισμούς).
- **Known limitation**: δεν κρατά lines/header snapshot.

**Συνέπεια**
- Στο v1, το issued invoice context δεν διατηρεί πλήρες snapshot γραμμών. Ως αποτέλεσμα, το detail view λειτουργεί ως review context με linked work και όχι ως πλήρης αναπαράσταση invoice document lines.

**Canonical interpretation (v1)**: το issued `Invoice` είναι minimal operational record που δημιουργείται από το issue transition. Δεν αποτελεί πλήρες document artifact και δεν τεκμηριώνει immutable invoice snapshot.

### 7.4 ReceivableWorkItem

Work item απαίτησης (outstanding/paid) συνδεδεμένο με invoice. Caveat: το `ReceivableWorkItem.outstanding` βασίζεται σε net-only issued totals (v1 mismatch risk).

**v1 συμπεριφορά**
- Δημιουργείται κατά issue, με `outstanding = Invoice.total` (net-only στο v1).

### 7.5 BillableWorkItem

Πηγή για draft lines (work to bill). Linkage: draft line `sourceId`, και μετά το issue σύνδεση με issued invoice ώστε να φαίνεται “τι τιμολογήθηκε” ως work context.

### 7.6 Audit / notes / related operational data

**v1 συμπεριφορά**
- `AuditEvent` χρησιμοποιείται ως timeline για invoice detail (context, όχι immutable ledger).
- Collection notes συσχετίζονται με `invoiceId` (follow-up context).

**Open decision**
- Αν/πότε το audit γίνεται immutable/compliance-grade trail.

---

## 8. Κανόνες δεδομένων και πηγές αλήθειας

### 8.1 Runtime storage ownership

**v1 scope**
- **v1 στόχος**: persistence για drafts/invoices/receivables (ανακτήσιμα records).
- **Τρέχουσα υλοποίηση**: prototype store χωρίς durable persistence, άρα refresh/reload δεν πρέπει να θεωρείται ότι διατηρεί δεδομένα (βλ. §13).

#### 8.0.1 Διάγραμμα — State ownership map (v1)

![](../finance/invoicing/diagrams/assets/state-ownership-map.svg)

Το διάγραμμα χαρτογραφεί ποια δεδομένα ζουν στον builder (editing context), ποια “αποθηκεύονται” ως saved draft, και πώς προκύπτει το issued invoice/receivable context. Επισημαίνεται επίσης το drift σημείο: UI preview totals (VAT-inclusive) vs net-only issued totals.

### 8.2 Editing context vs saved draft

Ο builder δείχνει την τρέχουσα επεξεργασία του draft. Με το `Save`, αυτή η έκδοση γίνεται το αποθηκευμένο draft που εμφανίζεται στη λίστα και χρησιμοποιείται στη συνέχεια της ροής. Μετά το `Issue`, η ροή περνά στο issued invoice/receivable context.

### 8.3 Persisted vs derived vs preview-only values

Στο invoicing υπάρχουν stored τιμές, derived τιμές και preview-only στοιχεία. Οι stored τιμές ανήκουν στο draft ή στο issued record. Οι derived τιμές προκύπτουν από υπολογισμό, όπως το VAT preview και τα σύνολα. Τα preview-only ή placeholder στοιχεία εμφανίζονται στο UI χωρίς πλήρη downstream λειτουργία στο v1 (π.χ. transmission/compliance-like).

### 8.4 Ready-made / seeded prototype data

**v1 note**
Το UI prototype μπορεί να χρησιμοποιεί ενδεικτικά δεδομένα και statuses για την παρουσίαση της ροής. Όπου δεν υπάρχει κλειδωμένος κανόνας v1, η σημασία τους παραμένει ενδεικτική.

---

## 9. Ελεγχόμενες λίστες τιμών και πηγές επιλογής

## Διαθέσιμες επιλογές ανά πεδίο

### Τύπος παραστατικού
- `SalesInvoice` — Τιμολόγιο Πώλησης
- `ServiceInvoice` — Τιμολόγιο Παροχής Υπηρεσιών
- `CreditNote` — Πιστωτικό
- `InvoiceWithMovement` — Παραστατικό με Διακίνηση
- `DispatchDocument` — Δελτίο / Παραστατικό Διακίνησης

### Τύπος παραστατικού ΑΑΔΕ / myDATA
- `1.1` — Τιμολόγιο Πώλησης
- `1.2` — Τιμολόγιο Πώλησης / Ενδοκοινοτικές Παραδόσεις
- `1.3` — Τιμολόγιο Πώλησης / Παραδόσεις Τρίτων Χωρών
- `2.1` — Τιμολόγιο Παροχής Υπηρεσιών
- `2.2` — Τιμολόγιο Παροχής Υπηρεσιών / Ενδοκοινοτική Παροχή
- `2.3` — Τιμολόγιο Παροχής Υπηρεσιών / Παροχή Τρίτων Χωρών
- `5.1` — Πιστωτικό Τιμολόγιο / Συσχετιζόμενο
- `5.2` — Πιστωτικό Τιμολόγιο / Μη Συσχετιζόμενο
- `8.1` — Δελτίο Αποστολής
- `11.1` — ΑΛΠ
- `11.2` — ΑΠΥ
- `11.4` — Πιστωτικό Στοιχείο Λιανικής
- `11.5` — Δελτίο Αποστολής Λιανικής

### ΦΠΑ
- `Standard 24%` — 24% (Κανονικό)
- `Reduced 13%` — 13% (Μειωμένο)
- `Super Reduced 6%` — 6% (Υπερμειωμένο)
- `Zero 0%` — 0% (Μηδενικό)
- `Exempt` — Απαλλασσόμενο
- `Reverse charge` — Αντίστροφη χρέωση

### Λόγος απαλλαγής / ειδικής μεταχείρισης ΦΠΑ
- Ενδοκοινοτική παράδοση
- Εξαγωγή εκτός ΕΕ
- Απαλλαγή άρθρου ΦΠΑ
- Αντίστροφη χρέωση
- Λοιπή απαλλαγή
- Εκτός πεδίου ΦΠΑ

### Τρόπος πληρωμής
- `1` — Επαγ. Λογαριασμός Πληρωμών Ημεδαπής
- `2` — Επαγ. Λογαριασμός Πληρωμών Αλλοδαπής
- `3` — Μετρητά
- `4` — Επιταγή
- `5` — Επί πιστώσει
- `6` — Web Banking
- `7` — POS / e-POS
- `8` — Άμεσες πληρωμές IRIS

### Νόμισμα
- `EUR` — Ευρώ

### Μονάδα μέτρησης
- `ea` — Τεμάχια
- `hour` — Ώρες
- `person_hour` — Ανθρωποώρες
- `m` — Μέτρα
- `sqm` — Τετραγωνικά μέτρα
- `kg` — Κιλά

### Όροι πληρωμής
- `Net 15`
- `Net 30`
- `Net 45`

### Κατηγορία εσόδων ΣΤ.9
- `services` — Υπηρεσίες
- `goods` — Πώληση αγαθών
- `other` — Λοιπά έσοδα

### Κατηγορία χαρακτηρισμού ΣΤ.9
- Πώληση αγαθών
- Παροχή υπηρεσιών
- Λοιπά έσοδα
- Πάγια / λοιπές ειδικές περιπτώσεις εσόδου

### Κατηγορία Ε3
- `E3_SERVICES` — Παροχή υπηρεσιών
- `E3_GOODS` — Πώληση αγαθών
- `E3_OTHER` — Λοιπά

### Κατηγορία χαρακτηρισμού Ε3
- Έσοδα από πώληση εμπορευμάτων
- Έσοδα από πώληση προϊόντων
- Έσοδα από παροχή υπηρεσιών
- Λοιπά συνήθη έσοδα
- Λοιπά μη συνήθη έσοδα

### Αιτία συσχέτισης πιστωτικού
- Έκπτωση / εμπορική πολιτική
- Επιστροφή αγαθών
- Διόρθωση αξίας
- Διόρθωση ποσότητας
- Ακύρωση προηγούμενης χρέωσης

### Σχετικό παραστατικό
- Τιμολόγιο
- Πιστωτικό
- Δελτίο αποστολής
- Παραγγελία πελάτη
- Σύμβαση / συμφωνητικό

### MARK προηγούμενου παραστατικού
- MARK

### Τύπος γραμμής παραστατικού
- Από billable work (source-derived)
- Χειροκίνητη γραμμή (custom)

### Τρόπος διακίνησης
- `Ιδιόκτητο`
- `Μεταφορέας`
- `Τρίτος / Courier`

### Τρόπος / μέσο διακίνησης
- Ιδιόκτητο όχημα
- Μεταφορική εταιρεία
- Courier
- Τρίτος μεταφορέας
- Παραλαβή από πελάτη

### Ρόλος αντισυμβαλλομένου
- Επιχείρηση εσωτερικού
- Επιχείρηση ΕΕ
- Επιχείρηση τρίτης χώρας
- Ιδιώτης εσωτερικού
- Δημόσιο / φορέας γενικής κυβέρνησης

### Τύπος ποσότητας γραμμής
- Ποσότητα με μονάδα μέτρησης
- Κατ’ αποκοπή αξία
- Ώρες εργασίας
- Ανθρωποώρες
- Μήνας υπηρεσίας
- Έργο / πακέτο

---

## 10. Υπολογισμοί και financial semantics

> Εδώ κρατάμε αυστηρό διαχωρισμό “UI preview calc” vs “issued totals semantics” και κάνουμε τα caveats ρητά.

### 9.1 Line-level calculations

**UI preview (v1)**
- \(net = qty \times unitPrice \times (1 - discountPct/100)\) με defaults/fallbacks.
- \(vat = net \times rate(vatCategory)\).
- Default VAT για νέα lines: `"Standard 24%"`.

**Open decision**
- Rounding policy (ανά γραμμή ή ανά σύνολο) και precision ανά νόμισμα.

### 10.2 VAT / taxes

- **UI preview**: VAT categories/rates ως επιλογές UI. Δεν υπάρχει canonical tax engine ούτε downstream χρήση των fields `withholdingPct`, `stampDutyPct`, `otherTaxesAmount`.

### 10.3 Draft totals

**v1 συμπεριφορά**
- Το draft διατηρεί “stored” total που σήμερα λειτουργεί ως **net-only**.
- Το UI δείχνει net + VAT + gross/grand totals ως **preview**.

### 10.4 Issued invoice totals

**v1 συμπεριφορά (known inconsistency)**
- Το issued invoice context διατηρεί total που σήμερα λειτουργεί ως **net-only**.
- Το UI στο builder εμφανίζει VAT-inclusive totals ως preview.

**Συνέπεια**
- Η έννοια “total” δεν είναι σταθερή σήμερα μεταξύ builder και issued record, επηρεάζοντας receivables/collections.

### 10.5 Receivable amounts

**v1 συμπεριφορά**
- Το receivable “outstanding” συνδέεται με το issued invoice total.
- Δεν υπάρχει end-to-end payment registration workflow ως canonical λειτουργία v1 (η “πρόοδος πληρωμής” μπορεί να είναι ενδεικτική).

**Open decisions**
- Partial payments, allocation rules, reconciliation boundaries.

### 10.6 Mismatches / caveats

**Mismatches (v1)**
- **Totals mismatch**: UI VAT-inclusive preview vs net-only issued totals.
- **Model truncation**: issued `Invoice` δεν διατηρεί lines/header snapshot.
- **Transmission placeholder**: `TransmissionStatus` υπάρχει αλλά χωρίς state machine/API.
- **Numbering mismatch**: draft `series/invoiceNumber` vs issued `Invoice.number` χωρίς σύνδεση.

**Πίνακας 3 — Value semantics table**

| Τιμή / ποσό | Πού υπολογίζεται | Πού εμφανίζεται | Αν αποθηκεύεται | Παρατήρηση |
|---|---|---|---|---|
| Line net (preview) | Draft builder (UI preview) | Draft builder | Όχι (ως canonical calc) | JS numbers, χωρίς locked rounding policy |
| Line VAT (preview) | Draft builder (UI preview) | Draft builder (VAT preview) | Όχι | UI-only preview |
| Draft total (stored) | v1 stored draft total | Drafts list / draft record | Ναι (`InvoiceDraft.draftTotal`) | Net-only |
| Invoice total (issued) | v1 issue transition | Invoices list/detail | Ναι (`Invoice.total`) | Net-only (mismatch vs UI preview) |
| Receivable outstanding | v1 receivable linkage | Collections/Invoice detail | Ναι (`ReceivableWorkItem.outstanding`) | Κληρονομεί net-only semantics → risk |
| Gross/grand total (preview) | Draft builder totals (net+VAT+extras) | Draft builder preview | Όχι | Μπορεί να διαφέρει από issued `Invoice.total` |

---

## 11. Permissions και action gating

### 11.1 UI gating

**v1 συμπεριφορά**
- `Issue` γίνεται disabled αν:
  - δεν υπάρχουν γραμμές στο draft, ή
  - υπάρχουν μη έγκυρες custom γραμμές, ή
  - ο χρήστης δεν έχει δικαίωμα issue.
- Το `Save` λειτουργεί ως ρητή ενέργεια αποθήκευσης του draft.
- Η εγκυρότητα των custom lines επηρεάζει τη διαθεσιμότητα του `Save` και του `Issue`.

**Intended (blueprint)**
- Permission-dependent actions να εμφανίζονται disabled/hidden με reason (χωρίς να κρύβεται το record).

### 11.2 v1 issue preconditions

**v1 συμπεριφορά**
- Το v1 issue transition απαιτεί να υπάρχει draft και να υπάρχουν γραμμές (σε επίπεδο βασικών προϋποθέσεων).

**Gap**
- Δεν υπάρχει canonical enforcement για required header fields πριν issue (π.χ. series/number/issueDate), πέρα από UI hints.

### 11.3 Current gaps

**Gaps (v1)**
- Mismatch μεταξύ UI required indicators και των ελάχιστων προϋποθέσεων issue στο v1.
- Δεν υπάρχει ενιαίος “issue readiness ruleset” σε ένα canonical σημείο.

**Open decisions**
- Permission matrix (roles → actions) και audit requirements για sensitive actions.

---

## 12. Καταστάσεις και lifecycle

### 12.1 Draft statuses

**v1 συμπεριφορά**
- Draft status ενημερώνεται με βάση την ύπαρξη γραμμών (π.χ. “In Progress”, “Ready to Issue”) και το issue transition (“Issued”).
- “Stale Draft” εμφανίζεται ως status/label, χωρίς κλειδωμένο κανόνα μετάβασης.

**Open decision**
- Canonical lifecycle transitions/invariants.

### 12.2 Invoice statuses

**v1 vocabulary**
- Υπάρχει vocabulary για invoice statuses (π.χ. Issued / Partially Paid / Paid / Overdue / Cancelled), αλλά τα end-to-end transitions δεν είναι κλειδωμένα ως πλήρες v1 workflow.

**Open decisions**
- Cancel/void/credit note flows και invariants.

### 12.3 Transmission statuses

**v1 placeholder**
- Το v1 αρχικοποιεί `TransmissionStatus` ως `Pending` κατά issue.
- Δεν υπάρχει state machine/API που να οδηγεί σε `Accepted/Rejected`.

**Doc rule**
- Κάθε αναφορά σε transmission διαβάζεται ως **placeholder** μέχρι να υπάρξει end-to-end υλοποίηση.

### 12.4 Operational signals

**v1 συμπεριφορά**
- Η due date προκύπτει από τους όρους πληρωμής ή από default fallback rule όπου απαιτείται στο v1 context.
- “Overdue”/aging εμφανίζεται ως UI concept, αλλά δεν τεκμηριώνεται ως πλήρες end-to-end rule engine στο v1.

**Intended operational role (blueprint)**
- Overdue highlighting και status chips να οδηγούν triage/filtering και drilldowns.

**Open decisions**
- Canonical aging buckets/overdue rule set και alignment με KPI drilldowns του monitoring shell.

---  

## 13. Περιορισμοί του v1

Η παρούσα έκδοση του invoicing module περιλαμβάνει ορισμένους λειτουργικούς περιορισμούς που επηρεάζουν τη συνοχή, την ερμηνεία ορισμένων ποσών και την πληρότητα της ροής.

- Το issued invoice παραμένει minimal record και δεν διατηρεί πλήρες snapshot των header fields και των γραμμών.
- Τα totals του draft builder και του issued invoice context δεν ακολουθούν ακόμη ενιαία σημασιολογία, με αποτέλεσμα ασυμφωνία μεταξύ UI preview και issued totals.
- Το outstanding του receivable κληρονομεί αυτή τη σημασιολογία και μπορεί να επηρεάζει την ακρίβεια του collections follow-up.
- Το transmission εμφανίζεται ως status/label, χωρίς πλήρες end-to-end workflow.
- Τα compliance-like fields υπάρχουν στο UI, αλλά δεν υποστηρίζονται ακόμη από ολοκληρωμένο downstream mapping ή exporter.
- Οι κανόνες ετοιμότητας πριν από issue δεν έχουν πλήρως ενοποιηθεί, ιδιαίτερα στα header fields.
- Η αποθήκευση και η ανάκτηση draft/issued records δεν έχουν ακόμη σταθεροποιηθεί πλήρως σε επίπεδο persistence.

---

## 14. Ανοικτές αποφάσεις

Τα παρακάτω σημεία χρειάζονται απόφαση πριν θεωρηθεί σταθεροποιημένο το v1 σε λειτουργικό και σημασιολογικό επίπεδο.

- **Canonical invoice document snapshot**: πότε και με ποιο μοντέλο αποθηκεύονται header και lines για το issued invoice.
- **Totals policy**: ποιο ποσό θεωρείται canonical σε draft, issued invoice και receivable context, και με ποιους κανόνες rounding.
- **VAT / compliance scope**: ποια πεδία θα υποστηρίζονται λειτουργικά και ποια θα παραμείνουν εκτός scope.
- **Transmission workflow**: ποια θα είναι η τελική λογική των transmission states, των retries και του audit.
- **Collections model**: πώς θα υποστηρίζονται partial payments, allocation και payment progress.
- **Issue-readiness rules**: ποια πεδία και ποιοι έλεγχοι απαιτούνται πριν από issue.
- **Permissions matrix**: ποιοι ρόλοι θα μπορούν να δημιουργούν, να τροποποιούν, να εκδίδουν και να σχολιάζουν records.

**Σύνδεση με τις άμεσες ανάγκες σταθεροποίησης**

Οι παραπάνω αποφάσεις δεν έχουν όλες το ίδιο βάρος. Για την άμεση σταθεροποίηση του v1, προτεραιότητα έχουν η ενοποίηση των totals semantics, ο ορισμός του issued invoice snapshot, το κλείδωμα των issue-readiness rules και η βασική στρατηγική persistence για drafts και issued records.

---

## 15. Appendix

### 15.1 Canonical vocabulary (Terms & definitions)

| Όρος | Canonical meaning (v1) |
|---|---| 
| **Billable Work** | `BillableWorkItem`: πηγή τιμολόγησης που μπορεί να μετατραπεί σε draft lines. |
| **Invoice Draft / Draft** | `InvoiceDraft` + `DraftLine[]` στο prototype store: editable record πριν το issue. |
| **Draft line** | `DraftLine`: γραμμή draft (source-derived ή custom) με preview calc πεδία και optional compliance-like fields. |
| **Preview** | UI-only document-like αναπαράσταση πριν από issue. Δεν είναι persisted “issued document snapshot”. | 
| **Issued Invoice** | `Invoice`: minimal issued record που δημιουργείται από το issue transition. Δεν κρατά lines/header snapshot. | 
| **Receivable** | `ReceivableWorkItem`: collections-facing work item linked σε issued invoice (`invoiceId`). |
| **Collections follow-up** | Notes/triage στο `CollectionsPage` πάνω σε receivables, με `addCollectionNote`. |
| **Transmission** | `TransmissionStatus` field/labels (π.χ. Pending) χωρίς end-to-end workflow. | Placeholder |
| **Draft total** | `InvoiceDraft.draftTotal`: net-only total που διατηρείται ως stored value στο v1. |
| **Invoice total (issued)** | `Invoice.total`: net-only total που ορίζεται κατά issue. |  
| **Outstanding** | `ReceivableWorkItem.outstanding`: αρχικοποιείται από `Invoice.total`. |  
| **Collected Cash** | Conceptual end-state του revenue loop. Στο v1 **δεν** πρέπει να διαβάζεται ως απόδειξη πλήρους payment registration workflow ή accounting cash truth, εκτός αν αυτό δηλωθεί/επαληθευτεί ρητά ως κλειδωμένη v1 λειτουργία. | 
| **Revenue item** | Adjacent UI concept (π.χ. revenue list/detail). Δεν αποτελεί canonical invoicing entity στο v1 brief. |  


### 15.2 Field matrix — Invoice header (draft-level)

| key | UI label (ενδεικτικό) | Owner | Visible | Editable | Stored in draft | Carried into issued `Invoice` | Affects totals | Affects issue readiness | Compliance relevance | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `client` | Πελάτης | `InvoiceDraft` | Ναι | Ναι | Ναι | Ναι | Έμμεσα | De facto | — | Χρησιμοποιείται στο issue payload |
| `project` | Έργο | `InvoiceDraft` | Ναι | Ναι | Ναι | Ναι | Έμμεσα | Open | — | Optional |
| `owner` | Owner | `InvoiceDraft` | Ναι | Ναι | Ναι | Ναι | — | Open | — | Operational ownership |
| `currency` | Νόμισμα | `InvoiceDraft` | Ναι | Ναι/locked* | Ναι | Ναι | Ναι | — | — | *Lock όταν υπάρχουν source lines (UI rule) |
| `issueDate` | Ημ/νία έκδοσης | `InvoiceDraft` | Ναι | Ναι | Ναι | Ναι | Aging | Open | — | Fallback σε today αν λείπει |
| `paymentTerms` | Όροι πληρωμής | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι (direct) | Due date | Open | — | Used κυρίως για UI due date derivation |
| `dueDate` | Ημ/νία λήξης | `InvoiceDraft` | Ναι | Ναι | Ναι | Ναι | Aging | Open | — | Default fallback rule όταν λείπει (policy TBD) |
| `series` | Σειρά | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | UI-only | Potential | Draft numbering ≠ issued `Invoice.number` |
| `invoiceNumber` | Αριθμός | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | UI-only | Potential | Draft numbering ≠ issued `Invoice.number` |
| `billingEntity` | Οντότητα τιμολόγησης | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | Open | Potential | Visible στο UI, όχι στο issued model |
| `subject` | Θέμα | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | Open | — | UI/document-like |
| `externalNote` | Σημείωση (external) | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | — | — | Draft-only στο v1 |
| `internalNote` | Σημείωση (internal) | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | — | — | Visibility policy = open decision |
| `relatedDocument.*` | Σχετικό παραστατικό/MARK | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | — | Placeholder | Field exists, no exporter/workflow |
| `movement.*` | Διακίνηση | `InvoiceDraft` | Ναι | Ναι | Ναι | Όχι | — | — | Placeholder | UI placeholder στο v1 |

### 15.3 Field matrix — Draft line (line-level)

> Στόχος: τι είναι canonical για issue totals και τι είναι preview/compliance placeholder.

| key | Meaning | Source-derived / custom | Required | Stored | Computed | Used in issue | Preview-only | Compliance placeholder | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| `sourceId` | Link προς billable work ή custom id | Και τα δύο | Ναι | Ναι | — | Έμμεσα (mark work invoiced) | — | — | Source-derived lines το χρησιμοποιούν για linkage |
| `description` | Περιγραφή γραμμής | Και τα δύο | Ναι | Ναι | — | Όχι (στο issued model) | Ναι | — | Issued invoice δεν κρατά lines |
| `quantity` | Ποσότητα | Και τα δύο | Όχι | Ναι | — | Ναι (net calc) | Ναι | — | Fallbacks υπάρχουν |
| `unitPrice` | Τιμή μονάδας | Και τα δύο | Όχι | Ναι | — | Ναι (net calc) | Ναι | — | Used σε net-only issued total |
| `discountPct` | Έκπτωση % | Και τα δύο | Όχι | Ναι | — | Ναι (net calc) | Ναι | — | Clamped 0..100 στο UI |
| `amount` | Net amount fallback | Και τα δύο | Ναι | Ναι | — | Ναι (fallback net calc) | — | — | Used όταν λείπουν qty/unitPrice |
| `vatCategory` | VAT category | Και τα δύο | Όχι | Ναι | UI preview | Όχι | Ναι | Potential | Δεν επηρεάζει issued totals στο v1 |
| `st9IncomeCategory` | ΣΤ.9 κατηγορία | Και τα δύο | Όχι | Ναι | — | Όχι | — | Placeholder | Visible, no downstream use |
| `e3IncomeClassification` | Ε3 classification | Και τα δύο | Όχι | Ναι | — | Όχι | — | Placeholder | Visible, no downstream use |
| `withholdingPct` / `stampDutyPct` / `otherTaxesAmount` | Extra tax fields | Και τα δύο | Όχι | Ναι | — | Όχι | Possible | Placeholder | Fields exist, no calc engine |
| `mydataExtra` | Arbitrary myData extras | Και τα δύο | Όχι | Ναι | — | Όχι | — | Placeholder | No adapter/exporter in v1 |

### 15.4 Role & permission matrix (v1: implemented vs intended)

> Στόχος: τι μπλοκάρει σήμερα και ποιο policy θεωρούμε canonical μέχρι νεωτέρας.

**Legend**
- **Implemented gating**: επιβεβαιωμένο στο τρέχον UI prototype.
- **Intended policy**: τι θα θεωρούμε canonical μέχρι νεωτέρας (pending backend/roles).
- **Open**: δεν υπάρχει ακόμα policy/υλοποίηση.

| Action | Implemented gating (v1) | Intended policy (canonical until changed) | Open gaps |
|---|---|---|---|
| Create draft | Δεν υπάρχει explicit permission gate | Επιτρέπεται σε “Revenue/Finance operator” roles | Ρόλοι δεν είναι fully modeled |
| Edit header | Δεν υπάρχει explicit permission gate | Επιτρέπεται σε draft owners/operators μέχρι issue | Lock-after-issue policy |
| Add billable work line | UI gating από availability/reservation rules | Επιτρέπεται σε draft editors | Reservation release policy |
| Add/delete custom line | UI validation blocks invalid rows | Επιτρέπεται σε draft editors, με validation | Line-level approval rules |
| Save draft | Επιτρέπεται αν δεν υπάρχουν invalid custom rows | Επιτρέπεται σε draft editors | Validation parity (UI vs v1 preconditions) |
| Issue draft | UI: permission gating + γραμμές + εγκυρότητα custom lines | Μόνο roles με “Issue” permission | Required fields readiness rules |
| Add collection note | Δεν υπάρχει explicit permission gate | Επιτρέπεται σε Collections users/operators | Visibility/ownership model |
| View compliance/transmission fields | UI shows fields/status | Read-only visibility by role | Need explicit “placeholder” badge rules |
| View internal vs external notes | Υπάρχουν fields | Internal notes μόνο σε internal roles | Role-based visibility not implemented |

### 15.5 Invariants (canonical μέχρι νεωτέρας)

Οι παρακάτω κανόνες είναι οι “σταθερές” που πρέπει να ισχύουν/ελέγχονται, ακόμα κι αν η τρέχουσα υλοποίηση είναι περιορισμένη:

- **Preview is not persisted**: Το preview δεν είναι ποτέ canonical persisted document artifact.
- **Issued invoice has at least one line origin**: Ένα issue πρέπει να προκύπτει από draft με τουλάχιστον μία γραμμή.
- **Receivable always linked**: Κάθε `ReceivableWorkItem` πρέπει να συνδέεται με ένα issued `Invoice` (`invoiceId`).
- **Issue ≠ compliance/accounting**: Transmission/compliance/accounting completion δεν μπορεί να συναχθεί από “Issue” στο v1.
- **Outstanding semantics must be explicit**: Ό,τι χρησιμοποιείται ως `outstanding` πρέπει να έχει ρητή σημασιολογία (net vs gross) και να ευθυγραμμίζεται με UI.

### 15.6 Adjacent αλλά μη-canonical concepts (v1)

Τα παρακάτω εμφανίζονται ως UI/types/labels αλλά δεν είναι canonical “υλοποιημένες λειτουργίες” του v1 invoicing:

- **Transmission workflow**: status labels χωρίς end-to-end state machine.
- **myData/E3/ΣΤ.9 compliance**: fields χωρίς exporter/mapping/calc engine.
- **Rounding policy**: δεν υπάρχει locked rounding spec.
- **Stale rules**: stale status χωρίς deterministic transition rule.
- **Numbering policy**: draft numbering (series/number) δεν ταυτίζεται με issued `Invoice.number`.
