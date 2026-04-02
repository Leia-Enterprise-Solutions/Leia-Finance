# 02 — Finance Overview Module

## 1. Σκοπός του εγγράφου

Το παρόν έγγραφο ορίζει το `Finance Overview Module` σε επίπεδο module canon: ρόλο, όρια, inputs, drilldown contract και βασικά μοντέλα KPI/alerts/filters.
Δεν αποτελεί implementation spec ή UI blueprint.

---

## 2. Ταυτότητα, ρόλος και boundaries

Το `Finance Overview Module` είναι το monitoring shell του Finance Management & Monitoring System v1.

Ο ρόλος του είναι να συνοψίζει, να επισημαίνει προτεραιότητες και να δρομολογεί τον χρήστη στα κατάλληλα owner modules (deterministic drilldowns).

Boundaries:
- Δεν είναι execution workspace και δεν δημιουργεί/μεταβάλλει transactional business truth.
- Δεν “διορθώνει” ownership ή semantic rules (δεσμεύεται από `00A` και τη δομή του `01`).

---

## 3. Σκοπός του module (operational visibility)

Το module λύνει πρόβλημα συνολικής ορατότητας και επιχειρησιακής προτεραιοποίησης.  
Χωρίς αυτό, η πληροφορία παραμένει κατακερματισμένη στα επιμέρους modules.

Βασικά ερωτήματα που απαντά:
- Πού βρίσκεται σήμερα η επιχειρησιακή εικόνα Revenue και Spend;
- Ποια σημεία έχουν τη μεγαλύτερη πίεση (overdue, exposure, blocked, variance);
- Ποια θέματα απαιτούν άμεση ενέργεια και σε ποιο module;
- Ποια τάση δείχνουν τα βασικά KPIs;

Το `Overview` λειτουργεί ως σημείο παρατήρησης, ιεράρχησης και drilldown (όχι ως χώρος επίλυσης).

---

## 4. Canonical constraints που εφαρμόζει (ως references)

Το `Overview` εφαρμόζει (χωρίς να τα επαναορίζει) τους canonical κανόνες του `00A`:
- **Monitoring non-ownership**: computed views, όχι truth.
- **Computed monitoring concepts**: `Exposure`, `Overdue`, `Upcoming` ως views/signals.
- **State-family separation**: status / signal / readiness / UI-only state δεν συγχωνεύονται.
- **Anti-overlap**: αποφυγή διπλομέτρησης (commitment relief) όπου υπάρχει canonical linkage.
- **Deterministic drilldowns**: κάθε KPI/alert έχει σταθερό drilldown target.

---

## 5. Inputs και εξαρτήσεις (read-only)

Το `Overview` διαβάζει outputs από:
- `Invoicing`
- `Receivables`
- `Purchase Requests / Commitments`
- `Spend / Supplier Bills`
- `Payments Queue`
- `Controls`

Χρησιμοποιεί τα canonical objects/meanings όπως ορίζονται στο `00A`, και τη module δομή/αλυσίδες όπως ορίζονται στο `01`.

---

## 6. Monitoring model (τι “συνθέτει”)

### 6.1 Summary
Συνοψίζει βασική εικόνα Revenue και Spend σε ένα ενιαίο monitoring πλαίσιο.

### 6.2 Trends
Δείχνει μεταβολή βασικών δεικτών στον χρόνο ώστε να είναι ορατή η κατεύθυνση (βελτίωση/επιδείνωση).

### 6.3 Exposure view
Ενοποιεί εικόνα έκθεσης από canonical inputs, με anti-overlap λογική.

### 6.4 Alerts / exceptions
Αναδεικνύει ανωμαλίες, πιέσεις και εξαιρέσεις που χρειάζονται άμεση διαχείριση.

### 6.5 Navigation / routing
Μετατρέπει τα παραπάνω σε καθοδηγούμενη δρομολόγηση προς τα σωστά worklists/details.

---

## 7. Widget taxonomy (κατηγορίες, όχι UI spec)

### 7.1 Summary KPI widgets
Widgets συνοπτικής εικόνας για κατάσταση Revenue/Spend και βασικά υπόλοιπα.

### 7.2 Trend widgets
Widgets που δείχνουν εξέλιξη KPIs στον χρόνο για έγκαιρη ανίχνευση μεταβολών.

### 7.3 Exposure widgets
Widgets που αποτυπώνουν έκθεση, με σαφή διάκριση computed monitoring από transactional truth.

### 7.4 Alert / exception widgets
Widgets που εμφανίζουν prioritized εξαιρέσεις με σαφές severity.

### 7.5 Action-oriented list widgets
Widgets λίστας που δίνουν τα πιο κρίσιμα items και οδηγούν σε drilldown worklists.

### 7.6 Control visibility widgets
Widgets που φέρνουν ορατότητα από `Budget`, `Audit Trail`, `Employee Cost`.

---

## 8. KPI / metric catalog (monitoring semantics + drilldown contract)

Το `Overview` ορίζει **μόνο**: (α) τι δείχνει, (β) από πού διαβάζει, (γ) πού κάνει drilldown.  
Δεν κλειδώνει formulas/thresholds όπου υπάρχουν stabilization notes.

| KPI / Signal | Τροφοδότηση (owner source) | Τύπος | Default drilldown target |
|---|---|---|---|
| Outstanding Receivables | `Receivables` | Summary | `Collections / Receivables` |
| Overdue Receivables | `Receivables` | Alert-oriented | `Collections / Receivables` |
| Issued Invoice Throughput (period) | `Invoicing` | Trend | `Invoices List` |
| Committed Spend | `Purchase Requests / Commitments` | Summary / control-relevant | `Purchase Requests List` |
| Outstanding Payables | `Spend / Supplier Bills` | Summary | `Supplier Bills / Expenses List` |
| Ready vs Blocked Payables | `Spend / Supplier Bills` (+ execution visibility από `Payments Queue`) | Readiness / bottleneck | `Payments Queue` |
| Exposure | Revenue + Spend outputs (anti-overlap per `00A`) | Computed cross-system | Primary target ανά subtype (Revenue → `Collections / Receivables`, Spend → `Supplier Bills / Expenses List`) |
| Upcoming (Receivables / Obligations) | `Receivables`, `Spend / Supplier Bills` (και `Payments Queue` όπου εφαρμόζεται) | Forward-looking | Αντίστοιχο worklist με pre-filtered horizon |
| Budget Pressure Signal | `Controls` (`Budget`) | Control signal | `Budget Overview` |
| Audit Attention Signal | `Controls` (`Audit Trail`) | Exception / governance | `Audit Trail` |

---

## 9. Filters model (global consistency)

### 9.1 Required global filters
- χρονική περίοδος (period)
- οργανωτικό scope (π.χ. business unit / entity όπου υποστηρίζεται)
- πλευρά παρακολούθησης (`Revenue`, `Spend`, `Cross-system`)

### 9.2 Acceptable secondary filters
- severity
- ownership / responsible context
- status family (χωρίς σύγχυση status/signal/readiness)
- segment tags όπου υπάρχουν canonical labels

### 9.3 Filter principles
- ίδια φίλτρα σημαίνουν ίδιο πράγμα σε όλα τα widgets
- τα φίλτρα επηρεάζουν visualization και drilldown με συνεπή τρόπο
- το filter model δεν δημιουργεί νέα business state

---

## 10. Alerts / exception model

### 10.1 Revenue alerts
- overdue pressure σε receivables
- υψηλό outstanding χωρίς αντίστοιχη πρόοδο follow-up

### 10.2 Spend alerts
- blocked payable clusters
- due/overdue payable pressure
- mismatch concentration σε supplier obligations

### 10.3 Control alerts
- budget pressure/breach signals
- audit attention signals

### 10.4 Severity levels
- `High`: απαιτεί άμεση επιχειρησιακή ενέργεια
- `Medium`: απαιτεί προτεραιοποίηση εντός κύκλου εργασίας
- `Low`: απαιτεί παρακολούθηση

### 10.5 Business-level trigger logic
Οι ειδοποιήσεις βασίζονται σε επιχειρησιακά σήματα και όχι σε UI-only flags.  
Τα trigger criteria ορίζονται ως business-level κανόνες και όχι ως implementation λεπτομέρειες στο παρόν έγγραφο.

### 10.6 Alert ownership
Το `Overview` δείχνει και ιεραρχεί alerts.  
Η επίλυση ανήκει στα αντίστοιχα operational ή control modules.

---

## 11. Drilldowns (routing contract)

### 11.1 Revenue drilldowns
- από draft backlog / stale draft / reservation pressure signals -> `Invoice Drafts List`
- από issued/throughput KPI -> `Invoices List`
- από outstanding/overdue KPI -> `Collections / Receivables`

### 11.2 Spend drilldowns
- από commitment signals -> `Purchase Requests List`
- από payable/mismatch signals -> `Supplier Bills / Expenses List`
- από readiness/execution signals -> `Payments Queue`

### 11.3 Control drilldowns
- από budget signals -> `Budget Overview`
- από audit signals -> `Audit Trail`
- από cost visibility signals -> `Employee Cost View`

### 11.4 Drilldown behavior rules
- deterministic target ανά signal/KPI
- χωρίς αμφισημία routing
- χωρίς bypass του κατάλληλου operational module

---

## 12. Navigation role (canonical pattern)

Το `Overview` λειτουργεί ως σημείο εκκίνησης και δρομολόγησης με το μοτίβο:

`Overview -> Worklist -> Detail -> Action -> Back`

Ο ρόλος του είναι να κατευθύνει τον χρήστη προς το κατάλληλο owner module, όχι να εκτελεί τη ροή μέσα στο ίδιο module.

Βασικοί drilldown προορισμοί:
- `Invoice Drafts List`
- `Invoices List`
- `Collections / Receivables`
- `Purchase Requests List`
- `Supplier Bills / Expenses List`
- `Payments Queue`
- `Budget Overview`
- `Audit Trail`
- `Employee Cost View`

---

## 13. In-scope / Out-of-scope (capsule)

### 13.1 In-scope
- ενοποιημένη monitoring εικόνα
- KPI, trend και exposure αποτύπωση
- alerts/exceptions ιεράρχηση
- deterministic drilldowns
- control visibility

### 13.2 Out-of-scope
- issue, collection execution, matching, payment execution
- owner transactional state management
- detailed UI blueprint περιγραφή
- route tree, API contracts, storage schema

---

## 14. Σχέση με το Finance Overview Dashboard του UI Blueprint

Το UI Blueprint ορίζει screen behavior, visible fields, actions και exceptions· το παρόν έγγραφο ορίζει μόνο module boundaries, monitoring role και drilldown determinism.

---

## 15. Open questions / stabilization notes

- σταθεροποίηση ονομασιών ορισμένων metrics σε διατμηματικό επίπεδο
- ακριβέστερη decomposition του `Exposure` σε επιμέρους views
- alert thresholds ανά severity
- scope preview panels σε detail drilldowns
- επιτρεπόμενες inline actions στο `Overview` χωρίς παραβίαση monitoring-shell ρόλου

Σημείωση:  
Τα παραπάνω είναι σημεία σταθεροποίησης και όχι κλειδωμένες implementation αποφάσεις.

---

## 16. Τελική διατύπωση module statement

Το `Finance Overview Module` είναι το canonical monitoring shell του Finance Management & Monitoring System v1: συγκεντρώνει computed εικόνα από Revenue, Spend και Controls, επισημαίνει προτεραιότητες, και δρομολογεί με deterministic drilldowns προς τα κατάλληλα execution modules, χωρίς να κατέχει ή να παράγει transactional business truth.

