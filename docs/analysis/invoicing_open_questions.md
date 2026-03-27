## PASS 8 — Ανοικτά ερωτήματα & ασάφειες (μη επαληθεύσιμα πλήρως από τον κώδικα)

> Κάθε item: Question → Evidence gap → Why it matters → Confidence (στο ότι “είναι άγνωστο”).

---

## 1) Canonical amount semantics: `Invoice.total` είναι net ή gross;

### Question
Τι σημαίνει “total” στο issued invoice και τι πρέπει να σημαίνει στο receivable (`outstanding`) — καθαρή αξία ή τελικό ποσό με ΦΠΑ;

### Evidence gap
- Ο builder παρουσιάζει VAT-inclusive totals, αλλά το store εκδίδει net-only totals. Δεν υπάρχει σχόλιο/τύπος που να ορίζει τη σημασιολογία.

### Why it matters
- Επηρεάζει collections/prioritization, reporting, compliance, και τις λογιστικές εγγραφές.

### Confidence
High (ότι είναι ουσιαστικά άγνωστο/ασυνεπές).

---

## 2) Rounding rules και VAT calculation policy

### Question
Ποια είναι η πολιτική στρογγυλοποίησης (ανά γραμμή ή ανά σύνολο) και πώς πρέπει να υπολογίζεται ο ΦΠΑ σε ειδικές περιπτώσεις (exempt, reverse charge, παρακρατήσεις, χαρτόσημο);

### Evidence gap
- Υπάρχουν fields (`withholdingPct`, `stampDutyPct`, `otherTaxesAmount`) στο `DraftLine` type αλλά δεν υπάρχει καμία εφαρμογή/υπολογισμός.
- Ο κώδικας χρησιμοποιεί JS numbers χωρίς rounding rules.

### Why it matters
- Compliance/audit drift, myData mismatches, και διαφορές ποσών.

### Confidence
High.

---

## 3) myData / AADE payload και διαβίβαση μέσω παρόχου

### Question
Υπάρχει πρόθεση να γίνει πραγματική διαβίβαση (provider/myData) μέσα σε αυτό το repo; αν ναι, ποιο είναι το canonical payload/schema;

### Evidence gap
- `TransmissionStatus` υπάρχει αλλά δεν υπάρχει adapter ή API.
- `relatedDocument.mark` και `DraftLine.mydataExtra` υπάρχουν αλλά δεν χρησιμοποιούνται.

### Why it matters
- Καθορίζει scope stabilization: UI scaffold vs πραγματική έκδοση/διαβίβαση.

### Confidence
High.

---

## 4) “Issue” semantics: τι σημαίνει “Υποβολή για Έκδοση”;

### Question
Το “Υποβολή για Έκδοση” είναι τελικό issue (και immutable invoice) ή ένα intermediate step (approval/transmission/preview);

### Evidence gap
- `issueDraft` δημιουργεί `Invoice` με status Issued και transmission Pending, αλλά δεν υπάρχει workflow για αλλαγές/διορθώσεις/credit notes.
- Υπάρχουν document types όπως `CreditNote`, `DispatchDocument` στο UI, αλλά δεν υπάρχει αντίστοιχο issued domain.

### Why it matters
- Καθορίζει lifecycle states, edits after issue, audit trail requirements.

### Confidence
Medium–High.

---

## 5) Numbering policy: draft `series/invoiceNumber` vs issued `Invoice.number`

### Question
Ποιο είναι το νόμιμο/επιχειρησιακό invoice number; το UI `series+invoiceNumber` ή το issued `INV-YYYY-xxxxx`;

### Evidence gap
- Υπάρχουν δύο παράλληλοι μηχανισμοί αρίθμησης χωρίς σύνδεση.

### Why it matters
- Συμφωνία με ERP/λογιστήριο, εμφανίσεις σε πελάτη, myData identifiers.

### Confidence
High.

---

## 6) Draft “stale” status: ποιος το ορίζει και τι σημαίνει;

### Question
Ποιος κανόνας κάνει ένα draft “Stale”; είναι χρόνος αδράνειας ή αλλαγές στη source εργασία;

### Evidence gap
- Υπάρχει `status:"Stale"` σε mock data και UI warnings, αλλά δεν υπάρχει logic που μετατρέπει draft σε stale.

### Why it matters
- Δεσμεύσεις billable work, UX, και κανόνες review πριν issue.

### Confidence
High.

---

## 7) Persistence expectations (post-refresh)

### Question
Πρέπει τα drafts/invoices να επιβιώνουν refresh/browser restart; αν ναι, ποιο persistence layer θα είναι canonical (backend vs local storage);

### Evidence gap
- Δεν υπάρχει persistence κώδικας στο repo.

### Why it matters
- Καθορίζει stabilization scope και architecture boundaries.

### Confidence
High.

---

## 8) Duplicate path artifacts (`src\\views\\...`) — πραγματικό πρόβλημα ή incidental;

### Question
Τα untracked `src\\views\\...` είναι artifacts από tooling ή παράλληλη δεύτερη υλοποίηση;

### Evidence gap
- Έχουμε μόνο git status snapshot που δείχνει duplicates· δεν έχουμε επιβεβαιώσει tsconfig/bundler includes.

### Why it matters
- Μπορεί να δημιουργεί “διπλές” σελίδες/logic και να προκαλεί μη ντετερμινιστική συμπεριφορά.

### Confidence
Medium.

