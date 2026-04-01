Finance Semantic Resolutions v1
1. Σκοπός του εγγράφου

Το παρόν έγγραφο καταγράφει τις ρητές σημασιολογικές αποφάσεις που κλειδώνουν για το Finance Management & Monitoring System v1, με στόχο την επίλυση ασάφειας, drift και αντικρουόμενων ερμηνειών μέσα στο υπάρχον documentation set.

Ο ρόλος του είναι να λειτουργήσει ως resolution layer πριν από:

την ανασύνταξη των canonical flows,
την παραγωγή wireframes,
τον σχεδιασμό reusable UI components,
και τη σταθεροποίηση implementation-facing documentation.

Το παρόν έγγραφο δεν εισάγει νέο business scope.
Δεν δημιουργεί νέα modules.
Δεν αντικαθιστά το 00 — Finance Canonical Brief ή το 00A — Finance Domain Model & System Alignment.
Λειτουργεί ως ρητή πράξη ευθυγράμμισης των ήδη υπαρχουσών canonical αρχών.

2. Θέση του εγγράφου στην ιεραρχία

Η κανονιστική ιεραρχία παραμένει:

00 — Finance Canonical Brief
00A — Finance Domain Model & System Alignment
01 — Finance Module Map
02+ — Module Documents
UI Blueprint / Workflow / Presentation artifacts

Το παρόν resolution document δεν υπερισχύει των ανώτερων canonical documents.
Αντίθετα, ξεκαθαρίζει πώς πρέπει να διαβαστούν και να εφαρμοστούν με συνέπεια στα χαμηλότερα layers.

3. Κλειδωμένες σημασιολογικές αποφάσεις
3.1 Το Overview είναι monitoring shell και όχι execution workspace

Κλειδώνει ότι το Overview λειτουργεί αποκλειστικά ως επιφάνεια παρακολούθησης, ιεράρχησης και drilldown routing.
Δεν δημιουργεί transactional truth.
Δεν αναλαμβάνει primary execution actions που ανήκουν στα operational modules.

Οποιοδήποτε workflow, UI walkthrough ή screen description υπονοεί ότι το Overview λειτουργεί ως χώρος πρωτογενούς εκτέλεσης ενεργειών θεωρείται μη canonical και πρέπει να διορθωθεί.

3.2 Το Invoice δεν συγχέεται με το Receivable

Κλειδώνει ότι το Invoice και το Receivable είναι διακριτές έννοιες με διαφορετικό semantic role.

Το Invoice είναι document truth στο revenue side.
Το Receivable είναι η downstream απαίτηση που προκύπτει από το issued invoice truth.
Η είσπραξη, το outstanding, το overdue, το partially collected και το closure ανήκουν στο receivable/payment context και όχι στο invoice document lifecycle.

Συνεπώς, διατυπώσεις όπως:

“invoice becomes paid”
“invoice becomes overdue”
“invoice status = partially paid”

δεν είναι canonical wording για το v1 και πρέπει να αντικατασταθούν από wording που ξεχωρίζει document lifecycle από receivable/payment progression.

3.3 Το Invoicing κατέχει το issued invoice truth

Κλειδώνει ότι το Invoicing module είναι owner του issued invoice truth στο σημείο του Issue.

Το Issue αποτελεί semantic transition από draft / preview context σε canonical issued snapshot truth.
Μετά το Issue, το issued invoice record δεν επιτρέπεται να εξαρτάται σημασιολογικά από μεταγενέστερο mutable draft / preview context.

Το Receivables / Collections δεν κατέχει invoice truth.
Το Overview δεν κατέχει invoice truth.
Τα control surfaces δεν κατέχουν invoice truth.

3.4 Το Preview totals γίνονται issued totals snapshot

Κλειδώνει ως canonical rule ότι:

Preview totals must become issued totals snapshot.

Μετά το Issue:

τα preview totals παγώνουν,
τα issued totals αποτελούν την canonical οικονομική αλήθεια του invoice,
και το downstream receivable derivation βασίζεται σε αυτά τα issued totals.

Οποιοδήποτε implementation behavior, legacy description ή workflow note αφήνει να εννοηθεί ότι τα issued totals μπορεί να παραμένουν εξαρτημένα από mutable preview context θεωρείται deviation και όχι εναλλακτική canonical ερμηνεία.

3.5 Το Receivable παράγεται από issued invoice truth

Κλειδώνει ότι το Receivable δημιουργείται μόνο από issued invoice context και όχι από draft, preview ή UI-only ενδιάμεσο state.

Το base amount της απαίτησης πρέπει να στηρίζεται στο issued snapshot truth.
Το collection workflow δεν επιτρέπεται να επαναορίζει αυτό το base amount.
Οι collection notes, owners, expected payment dates, reminders και escalations λειτουργούν ως operational follow-up context και όχι ως source-of-truth replacement.

3.6 Το Outstanding αλλάζει μόνο από payment / settlement effect

Κλειδώνει ότι:

το receivable outstanding μειώνεται μόνο από applied incoming payment / settlement input,
και το payable outstanding μειώνεται μόνο από allocated outgoing payment effect.

Οποιαδήποτε note, reminder, follow-up action, readiness action ή UI marker δεν αλλάζει από μόνη της την οικονομική αλήθεια outstanding / paid / open.

3.7 Το Spend / Supplier Bills κατέχει το payable readiness

Κλειδώνει ότι το Spend / Supplier Bills module:

οργανώνει το Supplier Bill ως πραγματική supplier obligation,
διαχειρίζεται linkage / no-linkage,
διαμορφώνει Match / Mismatch,
και αποδίδει Ready for Payment ή Blocked readiness outcome.

Το readiness δεν σχηματίζεται στο Payments Queue.
Το Payments Queue το διαβάζει και εκτελεί πάνω σε αυτό.
Οποιοδήποτε flow ή screen description εμφανίζει το queue ως owner της readiness formation θεωρείται μη canonical.

3.8 Το Payments Queue κατέχει execution handoff, όχι readiness formation

Κλειδώνει ότι το Payments Queue είναι downstream execution / handoff workspace.

Το canonical role του είναι:

queue triage πάνω σε ήδη γνωστό payable readiness,
batch / selection handling,
scheduling,
execution registration / paid outcome visibility στο spend side.

Δεν είναι:

readiness owner,
supplier bill investigation module,
request approval module,
generic banking engine,
reconciliation engine.

Συνεπώς, αν blocked item χρειάζεται επίλυση, η canonical επιστροφή είναι προς το source detail στο Spend / Supplier Bills, όχι μέσα από αυθαίρετη mutation logic στο queue.

3.9 Τα state families παραμένουν αυστηρά διακριτά

Κλειδώνει ο ακόλουθος διαχωρισμός:

Persisted domain status
Operational signal
Readiness state
UI-only temporary state

Τα παραπάνω δεν πρέπει να συγχωνεύονται λεκτικά, οπτικά ή τεκμηριωτικά.

Ειδικά για το spend/payment side:

Ready for Payment = readiness state
Blocked = readiness / blocking outcome
Due Soon / Overdue = operational signals
Selected for batch / Prepared = UI-only temporary states
Scheduled / Executed / Paid = execution statuses

Αντίστοιχα για το revenue side:

Draft / Issued = invoice document statuses
Open / Partially Collected / Collected / Closed = receivable statuses
Overdue / Due Soon = operational signals
Needs Review, Stale, Unsaved Changes = operational or UI-only markers ανάλογα με το context

Οποιοδήποτε artifact δεν τηρεί αυτή τη διάκριση πρέπει να ευθυγραμμιστεί.

3.10 Το Commitment relief κλειδώνει ως canonical rule

Κλειδώνει ότι:

Το Commitment relieved όταν υπάρχει linked Supplier Bill ή linked Outgoing Payment, σύμφωνα με τους canonical linkage rules του συστήματος.

Αυτό σημαίνει ότι το monitoring layer και ειδικά οι exposure / budget / spend visibility surfaces δεν επιτρέπεται να εμφανίζουν Commitment, Supplier Bill και Outgoing Payment ως αθροιστικά ανεξάρτητα exposure layers όταν υπάρχει ήδη canonical linkage / relief.

Όπου το current corpus χρησιμοποιεί πιο provisional διατύπωση, αυτή πρέπει να αντικατασταθεί ή να επισημανθεί ως παλαιότερη / transitional wording.

3.11 Τα Exposure, Overdue, Upcoming παραμένουν computed monitoring concepts

Κλειδώνει ότι:

Exposure,
Overdue,
Upcoming

είναι computed monitoring concepts και όχι transactional source objects.

Το Overview και τα control surfaces τα διαβάζουν και τα προβάλλουν.
Δεν τα κατέχουν ως primary transactional truth.
Δεν δημιουργούν από μόνα τους οικονομικό γεγονός.

3.12 Τα KPI και οι date semantics πρέπει να διαβάζονται με canonical discipline

Κλειδώνει ότι οι date semantics για τα core KPI surfaces πρέπει να παραμένουν οι εξής:

cash metrics -> payment date
invoicing metrics -> issue date
commitment metrics -> approval date
overdue / aging signals -> due date versus today

Αν κάποιο KPI ή widget στο UI / workflow material παρουσιάζεται σαν απόλυτα finalized formula ενώ το underlying semantic area παραμένει provisional, αυτό δεν ακυρώνει την canonical date semantics. Απλώς σημαίνει ότι το συγκεκριμένο widget wording πρέπει να ξαναγραφτεί ως provisional ή να μετακινηθεί εκτός locked v1 formula language.

4. Ρητή αναγνώριση implementation deviations

Τα παρακάτω δεν αποτελούν εναλλακτικές canonical ερμηνείες. Αποτελούν γνωστές αποκλίσεις υλοποίησης ή transitional artifacts που πρέπει να αντιμετωπιστούν ως stabilization targets.

4.1 Invoice totals / outstanding mismatch

Η γνωστή αντίφαση μεταξύ gross-oriented preview εικόνας και net-oriented issued total / outstanding semantics αντιμετωπίζεται ως implementation deviation και όχι ως αποδεκτή δεύτερη σημασιολογία.

4.2 Provisional KPI wording

Σημεία του overview / KPI material που μιλούν με υπερβολικά οριστικό τρόπο για budget utilization ή anti-overlap formulas, ενώ η underlying formula language δεν έχει αποσαφηνιστεί πλήρως σε όλα τα artifacts, θεωρούνται transitional wording και όχι νέα canonical truth.

4.3 Legacy workflow drift

Οποιοδήποτε workflow artifact εισάγει μη αγκυρωμένο direct cash / reconciliation path ως να αποτελεί επίσημο top-level module ή canonical alternative route θεωρείται legacy / adjacent artifact μέχρι να ενταχθεί ρητά στη canonical module hierarchy.

5. Απόφαση για το direct cash / reconciliation path

Για το v1, το Direct Receipt / Payment Registration / Reconciliation path δεν αντιμετωπίζεται ως ξεχωριστό top-level module της canonical architecture.

Μπορεί να αντιμετωπιστεί μόνο με έναν από τους εξής δύο τρόπους:

είτε ως adjacent operational support path,
είτε ως legacy/transitional workflow artifact που δεν χρησιμοποιείται ως canonical source για module ownership.

Μέχρι να υπάρξει ρητή μεταγενέστερη απόφαση, δεν επιτρέπεται να εμφανίζεται σε diagrams ή master flows σαν να αναθεωρεί τη top-level δομή που έχει ήδη κλειδώσει στο 01 — Finance Module Map.

6. Κανόνες supersession

Από το παρόν resolution pass και μετά, ισχύουν οι ακόλουθοι κανόνες:

Αν workflow diagram ή walkthrough συγκρούεται με 00, 00A, 01 ή με τις παρούσες semantic resolutions, το diagram θεωρείται μη canonical μέχρι να διορθωθεί.
Αν UI wording συγκρούεται με canonical object meaning, το wording αλλάζει. Δεν αλλάζει το object meaning.
Αν implementation artifact περιγράφει τρέχουσα συμπεριφορά που αποκλίνει από canonical rule, η περιγραφή πρέπει να φέρει explicit ένδειξη “current implementation deviation” ή να απομακρυνθεί από canonical-level docs.
7. Τι πρέπει να διορθωθεί αμέσως μετά
7.1 Πριν από flow redesign

Πρέπει να καθαριστούν:

το commitment relief wording,
το invoice vs receivable wording,
το preview totals / issued snapshot wording,
και η θέση του direct cash / reconciliation path.
7.2 Πριν από wireframes

Πρέπει να καθαριστούν:

τα screen labels που συγχέουν state families,
τα invoice/receivable list/detail labels,
το KPI wording σε overview/dashboard artifacts,
και το ποιο workflow artifact είναι canonical source narrative.
7.3 Πριν από component system design

Πρέπει να κλειδωθούν:

status taxonomy,
readiness taxonomy,
KPI semantic contracts,
money summary derivation rules,
και action ownership boundaries ανά module.

Αυτά είναι αναγκαία για να οριστούν σωστά reusable components όπως StatusChip, SignalBadge, ReadinessPill, KpiCard, MoneySummary και action surfaces.

8. Ασφαλής βάση για την επόμενη φάση

Με βάση τις παρούσες αποφάσεις, μπορούν να προχωρήσουν με ασφάλεια:

η high-level navigation skeleton,
η μακρο-αρχιτεκτονική των modules,
το macro flow Overview -> Worklist -> Detail -> Action -> Back,
τα μη-authoritative visual conventions,
τα layout foundations,
και η διακριτή section scaffolding για Budget, Audit Trail, Employee Cost.

Δεν πρέπει ακόμη να κλειδώσουν ως τελικές:

detailed KPI formulas όπου υπάρχει transitional wording,
component prop contracts για financial summaries αν δεν καθαριστούν πρώτα τα known implementation deviations,
και detailed execution/reconciliation side paths που δεν έχουν canonical anchoring.
9. Τελική δήλωση

Το Finance Management & Monitoring System v1 συνεχίζει να διαβάζεται ως σύστημα με:

ένα monitoring shell,
δύο operational core loops,
και ένα supporting control layer.

Οι παρούσες semantic resolutions δεν αλλάζουν αυτή τη δομή.
Τη σταθεροποιούν.
Οποιοδήποτε επόμενο flow, wireframe ή component design οφείλει να στηρίζεται στις παραπάνω κλειδωμένες αποφάσεις και όχι σε legacy drift ή σε implementation-specific ασυνέπειες.