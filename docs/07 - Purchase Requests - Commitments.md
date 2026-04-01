# 07 — Purchase Requests / Commitments Module

## 1. Σκοπός του εγγράφου

Το παρόν έγγραφο ορίζει το `Purchase Requests / Commitments Module` σε module-definition επίπεδο, ως canonical περιγραφή ρόλου, ορίων, semantics και εξαρτήσεων.

Ορίζει:

* τον ρόλο του module στο σύστημα
* τα core business concepts του upstream spend-initiation flow
* τη σχέση μεταξύ `Purchase Request`, `Approval` και `Commitment`
* τους canonical κανόνες commitment visibility, budget/exposure impact και downstream linkage
* τις σχέσεις του module με τα υπόλοιπα finance modules

Δεν είναι:

* implementation specification
* pixel-level UI spec
* route tree
* API / storage logic
* detailed screen blueprint

---

## 2. Θέση του εγγράφου στην ιεραρχία finance documentation

Το παρόν document δεσμεύεται από:

* `00 — Finance Canonical Brief`
* `00A — Finance Domain Model & System Alignment`
* `01 — Finance Module Map`

Και εξειδικεύει τα παραπάνω για το `Purchase Requests / Commitments` module, με συνέπεια προς το συνολικό documentation set του v1.

---

## 3. Ταυτότητα και ρόλος του module

Το `Purchase Requests / Commitments Module` είναι το canonical upstream spend-initiation και spend-approval module του συστήματος.

Ο ρόλος του είναι να καλύπτει το τμήμα της spend chain που ξεκινά από την αναγνώριση μιας ανάγκης δαπάνης και σταματά στο σημείο όπου η δαπάνη έχει αποκτήσει εγκεκριμένη επιχειρησιακή βαρύτητα ως `Commitment`, πριν εμφανιστεί downstream supplier obligation.

Σε canonical μορφή, η θέση του είναι:

`Purchase Request -> Approval -> Commitment -> downstream Supplier Bill context`

Το module είναι ξεχωριστό γιατί:

* κατέχει το upstream spend-intent context
* οργανώνει το `Purchase Request` ως τεκμηριωμένο αίτημα δαπάνης
* αποδίδει approve / reject / request-changes απόφαση με operational σημασία
* δημιουργεί `Commitment` visibility πριν από το actual supplier-side payable context
* τροφοδοτεί downstream modules και control surfaces με approved spend intent

Δεν ταυτίζεται με:

* `Spend / Supplier Bills`, που είναι downstream supplier-obligation και readiness module
* `Payments Queue`, που είναι downstream execution / handoff workspace
* `Overview`, που είναι monitoring shell
* generic procurement ERP
* accounting ledger
* bank / reconciliation engine

---

## 4. Σκοπός του module μέσα στο Finance System

Η canonical spend chain του v1 είναι:

`Purchase Request -> Commitment -> Supplier Bill -> Outgoing Payment`

Μέσα σε αυτήν τη συνολική αλυσίδα, το παρόν module καλύπτει το upstream initiation / approval / commitment τμήμα.

Upstream:

* παραλαμβάνει επιχειρησιακή ανάγκη δαπάνης
* οργανώνει justification, supplier context, amount context και approval context

Core objects:

* `Purchase Request`
* `Commitment`

Downstream:

* τροφοδοτεί το `Spend / Supplier Bills` με approved / committed context
* τροφοδοτεί το `Controls` με commitment visibility και budget-relevant effect
* επηρεάζει monitoring signals μέσω `Overview`

Ο ρόλος του module ολοκληρώνεται στο semantic handoff:

`Approved request + commitment visibility + downstream linkage eligibility`

Η supplier obligation, το payable readiness και η payment execution progression συνεχίζουν εκτός του παρόντος module.

---

## 5. Αρχές που διέπουν το Purchase Requests / Commitments Module

### 5.1 Purchase request truth ownership

Το module κατέχει την αλήθεια του `Purchase Request` ως upstream spend-intent object. Δεν επαναορίζει supplier bill truth, payment truth ή monitoring truth.

### 5.2 Commitment as separate business concept

Το `Commitment` είναι ξεχωριστή έννοια. Δεν ταυτίζεται με το request, δεν ταυτίζεται με το supplier bill και δεν ταυτίζεται με το outgoing payment.

### 5.3 Approval creates commitment visibility

Στο v1, η approval απόφαση είναι το semantic boundary όπου το request αποκτά εγκεκριμένη επιχειρησιακή βαρύτητα και παράγει commitment visibility.

### 5.4 Upstream before downstream obligation

Το module ανήκει πριν από το `Supplier Bill`. Δεν πρέπει να παρακάμπτεται σιωπηρά από downstream payable creation αν το σύστημα θέλει να κρατά καθαρή spend ακολουθία.

### 5.5 Budget and exposure relevance without accounting inflation

Το approved request επηρεάζει budget / exposure visibility, αλλά δεν πρέπει να παρουσιάζεται σαν actual payable ή paid fact.

### 5.6 Anti-overlap discipline

Το monitoring και το control layer δεν πρέπει να μετρούν `Commitment`, `Supplier Bill` και `Outgoing Payment` ως ανεξάρτητα αθροιστικά exposure layers όταν υπάρχει canonical linkage ή relief logic.

### 5.7 State-type separation

Διαχωρίζονται ρητά:

* persisted request status
* approval outcome
* commitment state / visibility
* operational signal
* UI-only temporary state

Το module δεν επιτρέπεται να τα συγχέει σε έναν θολό γενικό “status”.

### 5.8 Monitoring non-ownership

Το `Overview` και τα control surfaces διαβάζουν outputs του module, αλλά δεν κατέχουν την primary truth του request ή του commitment.

---

## 6. Inputs, dependencies και πηγές module truth

### Upstream input

* επιχειρησιακή ανάγκη αγοράς ή δαπάνης
* requester context
* department / cost center context
* supplier context όπου είναι διαθέσιμος
* category / reason / urgency context
* attachments / supporting evidence όπου απαιτούνται

### Core module objects

* `Purchase Request`
* approval / decision context
* `Commitment` visibility context

### Downstream output

* approved / rejected / returned-for-changes outcome
* commitment visibility προς `Budget Overview` και `Overview`
* downstream linkage context προς `Spend / Supplier Bills`
* exception visibility όταν δεν υπάρχει επαρκές context ή όταν η δαπάνη πιέζει budget / policy boundaries

### Monitoring / control impact

* `Committed Spend`
* budget pressure / variance interpretation
* upstream spend pressure visibility
* audit trail context για approvals και αλλαγές

---

## 7. Core business concepts του module

### Purchase Request

Το τεκμηριωμένο αίτημα αγοράς ή δαπάνης πριν από οποιαδήποτε actual supplier obligation.

### Requester Context

Το επιχειρησιακό πλαίσιο του ποιος αιτείται τη δαπάνη, για ποιο λόγο και για ποια οργανωτική ανάγκη.

### Approval Context

Το decision layer πάνω στο request, με approver, reason, comments και required evidence.

### Approval Decision

Η απόφαση πάνω στο request. Στο v1 το canonical decision vocabulary είναι `Approve`, `Reject`, `Request Changes`.

### Commitment

Η εγκεκριμένη spend δέσμευση που δείχνει ότι η ανάγκη δαπάνης έχει αποκτήσει επιχειρησιακή βαρύτητα πριν εμφανιστεί downstream supplier-side payable truth.

### Commitment Visibility

Η ορατή παρουσία του commitment στα monitoring / control surfaces και στις downstream συνδέσεις.

### Budget Context

Το supporting control πλαίσιο που δείχνει πώς το approved request επηρεάζει budget pressure, variance ή restriction visibility.

### Supplier Readiness Context

Το upstream context που βοηθά downstream supplier bill linkage, χωρίς να ισοδυναμεί ακόμη με bill readiness.

### Attachment / Evidence Context

Το supporting evidence layer που χρησιμοποιείται για approval confidence ή policy-required validation.

### Downstream Linkage Context

Η γέφυρα προς το `Spend / Supplier Bills`, ώστε το supplier bill να μπορεί να συνδεθεί με εγκεκριμένο request / commitment.

---

## 8. Module surfaces / operational surfaces

### Purchase Requests List

* **Ρόλος:** primary upstream spend worklist για triage αιτημάτων.
* **Primary question:** ποια requests χρειάζονται review, approval ή completion με βάση status, urgency και budget signal.
* **Primary action:** άνοιγμα request detail / approval surface.

### Purchase Request Detail / Approval View

* **Ρόλος:** single-record decision surface για full-context review και approve / reject / request-changes action.
* **Primary question:** είναι αυτό το request επαρκώς τεκμηριωμένο και operationally αποδεκτό ώστε να γίνει commitment;
* **Primary action:** λήψη approval απόφασης με reasoned outcome.

Σημαντική boundary note:
Οι παραπάνω surfaces ανήκουν στο upstream initiation / approval / commitment layer. Το `Supplier Bill` detail, το `Ready / Blocked` payable context και η payment execution progression παραμένουν downstream concerns άλλων modules.

---

## 9. Core flows του module

### 9.1 Request creation

Η ανάγκη δαπάνης καταγράφεται ως `Purchase Request` με requester, amount, reason, category, supplier context και supporting evidence όπου απαιτείται.

### 9.2 Request intake and triage

Το request αποκτά operational visibility στη λίστα requests και γίνεται ορατό ως item προς review με urgency, approver context και budget signal.

### 9.3 Completeness and context review

Το module ελέγχει αν υπάρχουν επαρκή στοιχεία για meaningful approval: supplier context, amount, justification, attachments και τυχόν budget-relevant information.

### 9.4 Approval decision

Το request λαμβάνει μία από τις canonical αποφάσεις:

* `Approve`
* `Reject`
* `Request Changes`

### 9.5 Commitment creation / visibility

Με το `Approve`, το request αποκτά commitment visibility και τροφοδοτεί downstream / control surfaces.

### 9.6 Budget and exposure impact visibility

Το approved request επηρεάζει committed spend visibility και budget interpretation, χωρίς να μετατρέπεται σε actual payable ή paid event.

### 9.7 Downstream supplier-bill linkage readiness

Το approved request παραμένει διαθέσιμο ως upstream context για σύνδεση με downstream `Supplier Bill`.

### 9.8 Change / cancellation / revision handling

Το module επιτρέπει controlled revision semantics του request, χωρίς να θολώνει την έννοια του commitment ή να παράγει σιωπηρά downstream truth rewrite.

---

## 10. Entity model και ownership

Κύριες οντότητες / contexts:

* `Purchase Request`
* request detail / justification context
* approval decision context
* `Commitment` visibility context
* budget signal / impact context
* linked supplier-bill context (downstream visibility)
* `Audit / Notes / Timeline` context

Διαχωρισμός ownership:

* `Purchase Request`: upstream spend-intent truth
* approval decision: decision truth πάνω στο request
* `Commitment`: approved spend commitment truth / visibility layer πριν το actual supplier obligation
* `Supplier Bill`: downstream supplier obligation truth
* `Outgoing Payment`: downstream cash-out truth
* `Audit / Notes / Timeline`: supporting traceability

Τυπολογία semantic ρόλου:

* **source-of-truth:** `Purchase Request`, approval outcome, commitment creation / visibility
* **derived / operational:** budget pressure signal, urgency signal, missing-attachment signal
* **downstream-driven visibility:** linked supplier bill existence / status
* **supporting:** notes, comments, attachments, timeline

---

## 11. Canonical rules του module

### 11.1 Purchase request creation rule

Το `Purchase Request` είναι η upstream έκφραση ανάγκης δαπάνης. Δεν είναι supplier bill, δεν είναι commitment by default και δεν είναι payment execution object.

### 11.2 Approval-to-commitment rule

Στο v1, approved request δημιουργεί commitment visibility. Το request δεν θεωρείται committed πριν από approval outcome.

### 11.3 Rejection / request-changes rule

`Reject` και `Request Changes` δεν παράγουν ενεργό commitment. Το request παραμένει visible ως rejected / returned item με traceable reason.

### 11.4 Commitment non-payable rule

Το `Commitment` δεν είναι actual payable και δεν πρέπει να εμφανίζεται σαν supplier bill ή σαν πληρωτέα row στο `Payments Queue`.

### 11.5 Budget-impact rule

Approved commitments επηρεάζουν budget / exposure visibility και control interpretation, χωρίς να υποκαθιστούν actual paid ή supplier-obligation truth.

### 11.6 Downstream-linkage rule

Το approved request λειτουργεί ως upstream canonical reference για downstream supplier-bill linkage όπου η policy το απαιτεί.

### 11.7 Anti-overlap / relief discipline

Το commitment δεν πρέπει να παραμένει semantic duplicate exposure layer όταν downstream canonical linkage / relief έχει ήδη εφαρμοστεί μέσω `Supplier Bill` ή `Outgoing Payment`, σύμφωνα με το system-level canonical model.

### 11.8 Monitoring-shell non-ownership rule

Το `Overview` μπορεί να δείχνει committed spend, budget pressure και drilldowns, αλλά δεν κατέχει request ή commitment truth.

---

## 12. Canonical purchase request / commitment lifecycle

### 12.1 Request drafted / recorded

Η ανάγκη δαπάνης καταγράφεται ως request context.

### 12.2 Request submitted / awaiting decision

Το request είναι ορατό ως item προς review και approval.

### 12.3 Request approved

Το request λαμβάνει approve decision και αποκτά commitment visibility.

### 12.4 Request rejected

Το request απορρίπτεται και παραμένει traceable ως rejected upstream item.

### 12.5 Request returned for changes

Το request επιστρέφεται για completion / correction χωρίς να δημιουργηθεί ενεργό commitment.

### 12.6 Commitment visible for downstream linkage

Το approved request λειτουργεί ως upstream committed context για budget / exposure visibility και downstream supplier-bill connection.

Σημαντικό boundary:
Το lifecycle του `Purchase Request / Commitment` δεν πρέπει να συγχέεται με:

* το lifecycle του `Supplier Bill`
* το readiness lifecycle του payable context
* το queue lifecycle (`Selected`, `Scheduled`, `Executed / Paid`)

---

## 13. Status model

### 13.1 Persisted request statuses

Καταστάσεις που ανήκουν στο purchase request ως upstream business object.

### 13.2 Approval outcomes

Καταστάσεις που εκφράζουν το decision αποτέλεσμα πάνω στο request.

### 13.3 Commitment states / visibility

Καταστάσεις που εκφράζουν αν το request έχει αποκτήσει commitment meaning.

### 13.4 Operational signals

Σήματα προτεραιότητας, πληρότητας ή budget πίεσης.

### 13.5 UI-only temporary states

Προσωρινά UI states selection / focus / inline validation.

### 13.6 v1 vocabulary

**Persisted request statuses**

* `Draft`
* `Submitted`
* `Approved`
* `Rejected`
* `Cancelled`

**Approval outcomes**

* `Approve`
* `Reject`
* `Request Changes`

**Commitment meaning**

* `Approved` σημαίνει `Committed` σε semantic επίπεδο
* προτεινόμενο UI wording: `Approved (Committed)` όπου απαιτείται αποσαφήνιση

**Operational signals**

* `Urgent`
* `Missing Attachment`
* `Budget Warning`
* `Budget Breach`
* `Waiting for Revision`
* `Linked to Supplier Bill`
* `No Linked Supplier Bill Yet`

**UI-only flags**

* `Selected`
* `Expanded`
* `Inline Validation Error`
* `Approval Panel Active`

Απαγορεύεται η σύγχυση:

* request status με supplier bill status
* commitment meaning με payable readiness
* budget signal με persisted business status
* linked/unlinked downstream visibility με approval outcome

---

## 14. Request fields και supporting field families

### 14.1 Request header field families

* request reference / identification context
* requester / department / cost center context
* supplier context
* category / spend-type context
* amount / currency context
* urgency / desired date context

### 14.2 Justification and evidence field families

* business reason / justification
* notes / internal explanation
* attachments / supporting evidence
* policy-related required documentation

### 14.3 Approval and budget field families

* approver context
* decision reason / comments
* budget signal / availability context
* commitment impact visibility

### 14.4 Downstream linkage and traceability families

* linked supplier-bill indicator
* downstream reference visibility
* audit / timeline context
* internal notes / comments trail

### 14.5 Semantic minimum for meaningful approval

Για να είναι ένα request semantic approval candidate, πρέπει να είναι ορατά τουλάχιστον:

* σαφής requester identity
* amount
* category ή spend reason
* επαρκής justification
* supplier context όπου είναι διαθέσιμος ή policy-required
* required evidence / attachment visibility όπου η policy το απαιτεί
* clear approval area με traceable decision outcome

---

## 15. Actions και permissions

### Allowed actions

Ενέργειες που ανήκουν φυσικά στο upstream request / commitment layer:

* create purchase request
* edit draft request
* submit request
* open detail
* add comment
* attach document / evidence
* approve / reject / request changes όπου επιτρέπεται
* view linked supplier bill όταν υπάρχει

### Gated actions

Ενέργειες που προϋποθέτουν policy ή approval authority:

* approval actions
* cancellation after submission
* controlled revision after approval
* create linked supplier bill από request detail, αν αυτό αποφασιστεί product / architect-wise

### Forbidden / out-of-bound actions

Το module δεν πρέπει να υπονοεί:

* supplier-bill truth ownership
* payable readiness ownership
* payment execution
* bank-confirmed completion
* hidden downstream state rewrite μέσω απλής approval αλληλεπίδρασης

---

## 16. Validations και approval rules

### 16.1 Field-level validations

Έλεγχοι εγκυρότητας requester, amount, category, supplier context και required dates / fields.

### 16.2 Justification-level validations

Έλεγχοι για επαρκή explanation της ανάγκης δαπάνης και clarity του spend intent.

### 16.3 Evidence / controls validations

Έλεγχοι για required attachments, supporting evidence και policy-required documentation.

### 16.4 Budget / policy validations

Έλεγχοι budget pressure, restriction warning ή escalation ανάγκης, όπου η policy το απαιτεί.

### 16.5 Canonical semantic minimum before approval

Για να αποκτήσει ένα request semantic outcome `Approved` (με commitment visibility), το module πρέπει να εκθέτει τουλάχιστον:

* σαφή request identity
* amount και spend reason
* requester context
* required supporting evidence όπου η policy το απαιτεί
* approval context με traceable actor / outcome
* απουσία unresolved blocking ambiguity που θα έκανε ασαφή τη commitment meaning

Αν κάποιο από τα παραπάνω λείπει, το αποτέλεσμα πρέπει να παραμένει non-approved ή returned-for-changes με explicit reason visibility.

---

## 17. Financial semantics και monitoring interaction

### 17.1 Committed spend visibility

Το `Committed Spend` στο monitoring layer στηρίζεται σε approved / committed request context.

### 17.2 Budget pressure interaction

Το approved commitment επηρεάζει budget pressure, variance ή restriction visibility, ανάλογα με το canonical control model.

### 17.3 Exposure anti-overlap

Το monitoring δεν πρέπει να εμφανίζει `Commitment`, `Supplier Bill` και `Outgoing Payment` ως σωρευτικά independent spend exposure layers όταν υπάρχει canonical linkage / relief logic.

### 17.4 Overview-facing semantics

Το primary overview-facing output του module είναι:

* committed spend visibility
* request backlog / approval pressure
* budget pressure signals
* deterministic drilldown προς `Purchase Requests List`

---

## 18. Σχέσεις με τα υπόλοιπα modules

### 18.1 Relation με Overview

Το `Overview` διαβάζει outputs του module για committed spend, budget pressure και request backlog / urgency signals, αλλά δεν εκτελεί request ή approval actions και δεν κατέχει upstream truth.

### 18.2 Relation με Controls

Το module τροφοδοτεί τα `Controls` με commitment visibility, auditability, budget interpretation context και approval traceability.

### 18.3 Relation με Spend / Supplier Bills

Η σχέση είναι structural και non-optional:
Το `Purchase Requests / Commitments` σχηματίζει upstream approved / committed context. Το `Spend / Supplier Bills` οργανώνει πάνω σε αυτό το downstream supplier obligation και την payable readiness.

### 18.4 Relation με Payments Queue

Η σχέση με το `Payments Queue` είναι έμμεση και downstream:
Το module δεν στέλνει request rows στην queue. Επηρεάζει την queue μόνο μέσω downstream supplier-bill linkage και readiness formation.

### 18.5 Relation με Revenue-side modules

Canonical ορολογία:

* `Purchase Request` και `Commitment` ανήκουν στο spend side
* `Invoice` και `Receivable` ανήκουν στο revenue side

Άρα το παρόν module δεν συγχέεται με invoicing, receivables ή incoming payment logic.

---

## 19. Open / controlled areas for v1 stabilization

Τα παρακάτω σημεία πρέπει να παραμείνουν ρητά ως controlled ή open areas αν δεν έχουν ακόμη formalized decision:

* ακριβής anti-double-count formula μεταξύ `Committed`, `Supplier Bill` και `Actual Paid` πάνω στον ήδη κλειδωμένο canonical κανόνα relief
* threshold / role-based approval policy
* required-vs-optional attachment policy
* αν supplier context είναι mandatory πριν την approval σε όλες τις περιπτώσεις
* controlled cancellation / revision semantics μετά από approval
* SLA / monitoring rule για `Approved but not yet linked to Supplier Bill`

Σημείωση canonical alignment:
Ο v1 ελάχιστος κανόνας commitment relief (`linked Supplier Bill` ή `linked Outgoing Payment`) θεωρείται ήδη κλειδωμένος από τα ανώτερα canonical docs και από το `Finance Semantic Resolutions`.
Άρα open παραμένει μόνο η λεπτομέρεια formula decomposition και presentation behavior, όχι ο βασικός κανόνας relief.

Το document πρέπει να τα καταγράφει ως open decisions και όχι να τα καμουφλάρει ως δήθεν κλειδωμένα truths.

---

## 20. Final canonical statement

Το `Purchase Requests / Commitments Module` είναι το canonical upstream spend-initiation και approval module του Finance Management & Monitoring System v1. Παραλαμβάνει επιχειρησιακή ανάγκη δαπάνης, οργανώνει το `Purchase Request` ως τεκμηριωμένο spend-intent object, αποδίδει approve / reject / request-changes outcome, δημιουργεί commitment visibility όταν το request εγκρίνεται, επηρεάζει budget και exposure interpretation μέσω control surfaces, και παραδίδει downstream approved / committed context προς το `Spend / Supplier Bills`. Δεν είναι supplier-obligation module, δεν είναι payment execution module, δεν είναι monitoring shell, και δεν λειτουργεί ως generic procurement ERP ή λογιστική μηχανή.
