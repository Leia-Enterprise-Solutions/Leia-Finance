# 09 — Open Questions / Stabilization

## 1. Σκοπός του εγγράφου

Το παρόν έγγραφο συγκεντρώνει τα ανοιχτά σημεία, τις controlled αποφάσεις και τους βασικούς άξονες σταθεροποίησης του Finance Management & Monitoring System v1.

Ο ρόλος του είναι:

- να ξεχωρίζει τι έχει ήδη κλειδώσει από τι παραμένει ανοιχτό,
- να αποτρέπει semantic drift μεταξύ canonical brief, domain model, module map, module documents και UI blueprint,
- να παρέχει κοινό decision surface για Product, Engineering, QA και Architecture,
- να ορίζει προσωρινά fallback rules όπου απαιτείται μέχρι να ληφθούν τελικές αποφάσεις,
- να μετατρέπει τα scattered unresolved points των επιμέρους documents σε ένα ενιαίο layer σταθεροποίησης.

Το παρόν έγγραφο δεν επαναορίζει το canonical finance model.  
Δεν αλλάζει το 00 — Finance Canonical Brief, το 00A — Finance Domain Model & System Alignment, το 01 — Finance Module Map ή τα module documents.  
Αντίθετα, λειτουργεί ως μηχανισμός ελέγχου εκκρεμοτήτων και σταθεροποίησης πριν από detailed functional specification και implementation.

## 2. Θέση του εγγράφου στην ιεραρχία finance documentation

Το παρόν document ανήκει στην ακόλουθη πρακτική ακολουθία ωρίμανσης του v1:

- 00 — Finance Canonical Brief
- 00A — Finance Domain Model & System Alignment
- 01 — Finance Module Map
- 02–08 — Module documents
- 09 — Open Questions / Stabilization

Το 09 δεν στέκεται πάνω από τα canonical documents.  
Στέκεται δίπλα τους ως control layer εκκρεμοτήτων και stabilization discipline.

Πρακτικά:

- τα 00, 00A και 01 ορίζουν την ταυτότητα, τη σημασία και τα module boundaries του συστήματος,
- τα 02–08 εξειδικεύουν ρόλους και module semantics,
- το 09 καταγράφει τι μένει να σταθεροποιηθεί χωρίς να ξανανοίγονται ήδη λυμένα θέματα.

Αυτό είναι απαραίτητο επειδή το UI Blueprint ήδη προβλέπει ότι τα unresolved items πρέπει να καταγράφονται ως formal pending decisions, με explicit fallback μέχρι να κλειδώσουν.

## 3. Πώς διαβάζεται το παρόν έγγραφο

Το παρόν έγγραφο αποτελεί decision-control layer.

Κάθε θέμα που εμφανίζεται εδώ πρέπει να ανήκει σε μία από τις ακόλουθες κατηγορίες:

- πραγματικό cross-system unresolved point,
- module-specific stabilization target,
- UI-policy decision που επηρεάζει συνεπή συμπεριφορά σε dashboard, list και detail surfaces,
- controlled open area που δεν ακυρώνει τον v1 semantic πυρήνα.

Αν κάτι έχει ήδη κλειδώσει στα canonical documents, δεν πρέπει να ξαναμπαίνει εδώ ως open question.  
Αν κάτι είναι απλώς implementation detail χωρίς semantic ή workflow impact, επίσης δεν ανήκει εδώ.

Το παρόν document πρέπει να εμποδίζει το γνωστό πρόβλημα όπου το ίδιο θέμα εμφανίζεται με τρία ονόματα σε τέσσερα documents και στο τέλος είναι άγνωστο τι ακριβώς έχει αποφασιστεί.

## 4. Locked canonical decisions που δεν επανανοίγουν

Ο παρακάτω κατάλογος λειτουργεί ως registry ήδη κλειδωμένων canonical αποφάσεων.  
Δεν ανοίγουν ξανά μέσα από το παρόν stabilization document.

| Decision | Status | Authority refs | Locked meaning |
| --- | --- | --- | --- |
| Monitoring shell boundary | Locked | `00`, `00A`, `02` | Το `Overview` συνοψίζει, επισημαίνει και δρομολογεί· δεν είναι execution workspace. |
| Invoice issue boundary | Locked | `00A`, `03` | Το `Issue` είναι semantic transition προς issued truth, όχι πλήρης compliance/accounting completion. |
| Totals alignment rule | Locked | `00A`, `03` | `Preview totals must become issued totals snapshot`. |
| Issued snapshot non-mutability | Locked | `00A`, `03` | Η issued truth δεν επηρεάζεται από μεταγενέστερο draft/preview context. |
| Receivable derivation rule | Locked | `00A`, `05` | Το `Receivable` προκύπτει από issued invoice context, όχι από draft, preview ή workflow notes. |
| Readiness ownership on spend side | Locked | `01`, `07`, `04` | Το `Spend / Supplier Bills` σχηματίζει readiness· το `Payments Queue` εκτελεί πάνω σε αυτό. |
| Unlinked supplier bills fallback | Locked | `07`, `04`, UI Blueprint | Unlinked supplier bills είναι visible ως warning και blocked-by-default για πληρωμή στο v1. |
| State-type separation | Locked | `00A`, UI Blueprint | `domain status`, `operational signal`, `readiness state` και `UI-only temporary state` δεν συγχωνεύονται. |

## 5. Τι θεωρείται πραγματικό open question στο v1

Ως πραγματικό open question για το v1 ορίζεται μόνο ένα θέμα που πληροί τουλάχιστον ένα από τα παρακάτω:

- επηρεάζει business meaning ή metric semantics,
- επηρεάζει συνέπεια μεταξύ dashboard, worklist και detail surfaces,
- επηρεάζει workflow ownership ή module boundary,
- απαιτεί product/architect/policy απόφαση για να μην υπάρξει ασυμβατότητα στην υλοποίηση,
- δεν έχει ήδη λυθεί από τα canonical rules και δεν μπορεί να "κρυφτεί" πίσω από ασαφές label.

Θέματα που είναι καθαρά cosmetic, wording-only ή implementation mechanics χωρίς semantic impact δεν ανήκουν στο παρόν έγγραφο.

## 6. Cross-system stabilization themes

Το παρόν section συγκεντρώνει ανοιχτά θέματα που επηρεάζουν περισσότερα από ένα modules και άρα δεν πρέπει να μείνουν θαμμένα σε τοπικά notes.

### 6.1 Metric date semantics and as-of consistency

Παρότι το UI Blueprint δίνει locked fallback date semantics για βασικές metric families, παραμένει ανάγκη πλήρους stabilization στο πώς αποδίδεται το "as-of" basis για point-in-time metrics, ειδικά σε dashboard period context.  
Το θέμα είναι πιο εμφανές σε metrics όπως Outstanding Receivables και Outstanding Payables, όπου το question δεν είναι μόνο "τι μετράμε", αλλά και "σε ποιο χρονικό σημείο ακριβώς θεωρείται ότι το μετράμε".

Current fallback:  
cash metrics = payment date, invoicing metrics = issue date, commitments = approval date, overdue signals = due date versus today.

Stabilization need:  
να σταθεροποιηθεί ενιαία γλώσσα για point-in-time versus period-based KPI presentation.

### 6.2 Exposure anti-double-count discipline

Το domain model έχει ήδη κλειδώσει ότι monitoring views δεν πρέπει να διπλομετρούν upstream και downstream economic objects όταν υπάρχει canonical linkage ή relief rule.  
Ωστόσο, το ακριβές operational rendering αυτού του κανόνα σε dashboard/widget/budget surfaces παραμένει stabilization concern, κυρίως στα spend-side layers όπου συνυπάρχουν Commitment, Supplier Bill και Outgoing Payment visibility.

Stabilization need:  
να οριστεί ξεκάθαρα πότε ένα upstream amount παραμένει exposure και πότε έχει ήδη ανακουφιστεί επαρκώς ώστε να μην προβάλλεται αθροιστικά με downstream layers.

### 6.3 Partial allocation / partial payment semantics

Υπάρχει ήδη ασφαλές fallback για partial payment allocation behavior στο UI, τόσο για paid state derivation όσο και για outstanding computation. Παρ' όλα αυτά, η πλήρης policy για partial / multi-allocation remains controlled open area, ειδικά στο spend side και σε πιο σύνθετα payment records.

Current fallback:

- outstanding = total - allocated amount
- Partially Paid μόνο όταν allocated > 0 και outstanding > 0
- Paid μόνο όταν outstanding = 0
- explicit warning για unallocated remainder.

Stabilization need:  
να οριστεί αν και πώς το v1 επιτρέπει multi-target allocations, partial settlement visibility σε lists, και πιο σύνθετη spend-side allocation policy.

### 6.4 Readiness versus execution boundary rendering

Το canonical boundary είναι ξεκάθαρο: readiness σχηματίζεται upstream, execution γίνεται downstream.  
Το stabilization problem δεν είναι η έννοια, αλλά το αν το UI τηρεί αυτή τη διάκριση παντού χωρίς να κάνει το Ready, το Scheduled, το Selected και το Executed / Paid να μοιάζουν με την ίδια οικογένεια state.

Stabilization need:  
να υπάρξει ενιαίο UI language και visual hierarchy ώστε selection, scheduling και paid outcome να μη συγχέονται.

## 7. Module-specific stabilization targets

### 7.1 Invoice Module

Το Invoice Module έχει ήδη καταγεγραμμένα known gaps και open stabilization notes. Τα πραγματικά unresolved items είναι τα εξής:

- βάθος immutable issued snapshot πέρα από totals,
- τελική policy για numbering linkage μεταξύ draft και issued context,
- πλήρης transmission lifecycle policy ως v1 ή vNext απόφαση,
- controlled policy για void / cancel / credit,
- λεπτομέρειες line model σε ειδικά σενάρια.

Τα παραπάνω είναι πραγματικά open επειδή επηρεάζουν document lifecycle completeness, downstream consistency και potential legal / workflow clarity.

Δεν είναι open:

- το Issue ως semantic transition,
- το totals alignment rule,
- η non-mutability μετά το issue,
- η receivable derivation από issued totals.

Stabilization objective for v1:  
να φτάσει το invoicing σε σαφές, σταθερό draft -> issue -> issued model, χωρίς να μένει γκρίζα περιοχή μεταξύ document truth και downstream collection semantics.

### 7.2 Receivables / Collections Module

Το Receivables / Collections έχει ίσως το πιο ύπουλο stabilization profile, επειδή αν δεν μπει σωστό boundary κινδυνεύει να γίνει μισό collection CRM, μισό invoice extension, μισό settlement console. Ναι, εξακολουθεί να είναι τρία μισά. Αυτό λέγεται πραγματικό product danger, όχι μαθηματικό λάθος.

Known stabilization targets:

- ακριβής εναρμόνιση issued totals -> receivable base amount -> outstanding,
- καθαρός διαχωρισμός receivable financial status από collection workflow state,
- σταθεροποίηση owner / next action / expected payment date vocabulary,
- policy για reminder levels και escalation thresholds,
- partial collection semantics και visibility,
- controlled handling για dispute / suspension / non-standard closure states,
- ευθυγράμμιση dashboard overdue / outstanding metrics με collections worklist.

Controlled/open decisions που μπορούν να παραμείνουν open χωρίς να χαλάσει ο semantic πυρήνας:

- αν το Expected Payment έχει ελεύθερη ή ελεγχόμενη vocabulary,
- αν το Promise to Pay εμφανίζεται ως ξεχωριστή έννοια ή απορροφάται μέσα στο expected payment / note context,
- αν το Dispute γίνεται πλήρες subflow ή controlled operational flag,
- ποιο threshold ενεργοποιεί High-Risk Overdue,
- ποιες bulk reminder / escalation actions ανήκουν στο πρώτο release.

Stabilization objective for v1:  
να παραμείνει το module canonical follow-up workspace, με settlement-driven outstanding truth και όχι note-driven "ψευδοείσπραξη".

### 7.3 Spend / Supplier Bills Module

Το Spend / Supplier Bills είναι structurally σταθερό ως readiness layer, αλλά θέλει κλείδωμα σε policy λεπτομέρειες που επηρεάζουν queue handoff και monitoring συνέπεια.

Κύρια stabilization themes:

- explicit blocked reason taxonomy,
- πλήρες semantic minimum για readiness before queue handoff,
- controlled open area για partial / multi-allocation policy,
- καθαρή διάκριση μεταξύ bill status, match state, readiness state και operational signal,
- συνεπής rendering του linkage / unlinked / mismatch logic σε list, detail, queue και overview surfaces.

Το module έχει ήδη κλειδώσει ότι:

- το Supplier Bill είναι πραγματική supplier-side obligation,
- το Unlinked δεν είναι harmless info badge αλλά blocking meaning για v1 payment flow,
- η readiness δεν σχηματίζεται στο queue,
- το primary next-step dimension του module είναι το readiness και όχι το execution status.

Stabilization objective for v1:  
να μη γίνει το bill layer ψευτο-queue ή ψευτο-accounting screen, αλλά καθαρό obligation/readiness workspace.

### 7.4 Payments Queue Module

Το Payments Queue έχει σαφή structural ρόλο, αλλά αφήνει ανοιχτά κάποια κρίσιμα execution questions που πρέπει να κλειδώσουν πριν από σοβαρή implementation ωρίμανση.

Known open decisions:

- αν το Scheduled είναι μόνο queue state ή αποκτά ανεξάρτητο business object,
- πώς ακριβώς καταγράφεται το Execute σε επίπεδο payment record,
- αν υπάρχει ρητό payment batch object ή μόνο grouped selection / handoff,
- ποια είναι η πλήρης πολιτική για partial / multi-allocation στο spend side,
- αν θα υπάρξει αργότερα Confirmed / Reconciled state ή το v1 σταματά στο Executed / Paid.

Αυτά είναι πραγματικά open γιατί επηρεάζουν:

- status progression,
- auditability,
- payment record semantics,
- clarity προς QA και frontend,
- αποφυγή fake completion cues.

Το module έχει ήδη κλειδώσει ότι:

- Selected / Prepared είναι UI-only state,
- Scheduled δεν είναι Paid,
- το queue δεν πρέπει να υπονοεί hidden state rewrite από checkbox selection,
- το queue δεν είναι matching ή investigation module.

Stabilization objective for v1:  
να υπάρχει καθαρή progression λογική Ready / Blocked -> Selected / Prepared -> Scheduled -> Executed / Paid χωρίς semantic inflation.

### 7.5 Overview / Metrics / Dashboard Layer

Το Overview δεν έχει ownership problem· έχει interpretation problem.  
Δηλαδή ξέρουμε τι είναι, αλλά αν δεν σταθεροποιηθούν κάποια metric semantics και drilldown rules, εύκολα θα γίνει το μέρος όπου όλα "φαίνονται σωστά" ενώ εννοούν άλλα.

Critical stabilization points:

- as-of semantics για dashboard point-in-time metrics,
- rendering των unresolved metric definitions με deterministic fallback,
- decomposition του Committed Spend χωρίς anti-double-count bugs,
- clarification του Budget Utilization ως προς versioning, editability και open payable inclusion,
- συνεπής αντιστοίχιση KPI -> drilldown target -> source family.

Το UI Blueprint ήδη κλειδώνει ότι όταν metric definition παραμένει pending, η UI οφείλει να χρησιμοποιεί το safest operational interpretation και να το κάνει explicit. Αυτό είναι σωστό και πρέπει να μείνει ως canonical stabilization rule.

### 7.6 Controls Layer

Το control layer δεν πρέπει να διορθώνει κρυφά πράγματα που δεν έχουν λυθεί στα operational modules.  
Ο ρόλος του είναι να παρακολουθεί, να ερμηνεύει και να φωτίζει, όχι να γίνεται κρυφό transaction owner.

Stabilization points που επηρεάζουν τα control surfaces:

- budget versions editability,
- inclusion ή μη inclusion open payable context σε budget views,
- employee cost redaction policy για non-privileged roles,
- depth of audit detail, especially on before/after visibility and export scope.

Current locked fallbacks:

- budget versions = read-only selector until explicit unlock,
- employee cost for non-privileged roles = aggregates only.

## 8. UI fallback rules for unresolved decisions

Όταν ένα θέμα παραμένει unresolved, η UI δεν επιτρέπεται να συμπεριφέρεται σαν να έχει λυθεί "σιωπηλά".  
Πρέπει να ακολουθεί explicit safe fallback.

Στο current v1, τα ελάχιστα locked fallback rules είναι τα εξής:

- cash-in / cash-out metrics derive from payment registrations,
- paid states derive from payment execution records,
- open / outstanding amounts derive from document total minus allocated payments,
- overdue derives from due date versus today,
- fiscal / transmission vocabulary παραμένει Pending / Unknown μέχρι να κλειδώσει πλήρης policy,
- employee cost για μη προνομιούχους ρόλους δείχνει aggregates only,
- budget versions παραμένουν read-only,
- unlinked supplier bills παραμένουν warning και blocked-by-default.

Αυτός ο κανόνας είναι βασικός γιατί μειώνει τον χώρο για "temporary hacks" που αργότερα πουλάνε μόνιμη σύγχυση σαν feature.

## 9. Decision record format

Κάθε open item του παρόντος εγγράφου πρέπει να ακολουθεί σταθερό decision-record format, ώστε να μη μετατρέπεται το document σε ακατάστατο ημερολόγιο σκέψης.

Προτεινόμενο format:

**ID**  
Μοναδικό αναγνωριστικό του θέματος.

**Τίτλος**  
Σύντομη και ακριβής ονομασία.

**Κατηγορία**  
Business, Workflow, Data semantics, UI policy, Controls, Permissions, Metric semantics.

**Modules affected**  
Τα modules που επηρεάζονται άμεσα.

**Current status**  
Locked, Open, Controlled Open, Needs Product Decision, Needs Architect Decision, Deferred.

**Question**  
Η ακριβής ερώτηση που πρέπει να απαντηθεί.

**Why it matters**  
Γιατί το θέμα έχει σημασία σε επίπεδο meaning, workflow ή implementation safety.

**Current fallback**  
Ποιος κανόνας εφαρμόζεται μέχρι την τελική απόφαση.

**Risk if unresolved**  
Τι κινδυνεύει να σπάσει ή να μπερδευτεί.

**Decision owner**  
Ποιος πρέπει να αποφασίσει.

**Target phase**  
Before functional spec, Before implementation, Before QA, Post-v1.

## 10. Πίνακας παρακολούθησης αποφάσεων

Ο παρακάτω πίνακας αποτελεί την operational tracking surface για τα open decisions και τα stabilization items του v1, ώστε η παρακολούθηση να παραμένει ενιαία, συγκρίσιμη και άμεσα αξιοποιήσιμη από Product, Engineering, QA και Architecture.

| ID | Θέμα | Κατηγορία | Modules affected | Status | Current fallback | Decision owner | Target phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-01 | As-of semantics for outstanding dashboard metrics | Metric semantics | Overview, Receivables, Spend / Supplier Bills, Payments Queue | Open | Point-in-time interpretation with current due-date and allocation logic | Product + Architecture | Before functional spec |
| OQ-02 | Partial / multi-allocation behavior | Data semantics / Workflow | Receivables, Spend / Supplier Bills, Payments Queue, Overview | Controlled Open | Outstanding = total - allocated amount, partial paid only when outstanding > 0 | Architecture | Before implementation |
| OQ-03 | Depth of immutable issued snapshot beyond totals | Data semantics | Invoice Module, Receivables, Audit | Open | Issued totals treated as frozen canonical truth | Architecture | Before implementation |
| OQ-04 | Numbering linkage between draft and issued invoice context | Workflow / Data semantics | Invoice Module, Audit | Open | Current numbering behavior remains controlled until explicit policy | Product + Architecture | Before implementation |
| OQ-05 | Full transmission lifecycle policy | Workflow / UI policy | Invoice Module, Overview, Invoice Detail | Open | `Pending / Unknown` fallback vocabulary | Product | Before QA |
| OQ-06 | Void / cancel / credit policy | Business / Workflow | Invoice Module, Receivables, Audit | Open | Controlled area, no expanded lifecycle beyond current v1 boundary | Product + Architecture | Before implementation |
| OQ-07 | Expected payment / promise-to-pay vocabulary | Workflow / UI policy | Receivables / Collections | Controlled Open | Use expected payment context without treating it as settlement | Product | Before QA |
| OQ-08 | High-Risk Overdue threshold | Workflow / Metric semantics | Receivables, Overview | Open | Use overdue-age plus weak follow-up context as interim signal | Product + Operations | Before QA |
| OQ-09 | Dispute handling depth in collections | Workflow | Receivables / Collections | Controlled Open | Keep dispute as controlled operational flag, not full subflow | Product | Post-v1 unless needed earlier |
| OQ-10 | `Scheduled` state semantics in Payments Queue | Workflow / Data semantics | Payments Queue, Audit, Overview | Open | `Scheduled` remains distinct from `Executed / Paid` | Architecture | Before implementation |
| OQ-11 | Payment batch object vs grouped selection | Workflow / Data semantics | Payments Queue, Audit | Open | Continue with grouped selection / handoff unless batch object is defined | Architecture | Before implementation |
| OQ-12 | Final stop of v1 payment progression | Workflow | Payments Queue, Controls, Overview | Open | v1 stops at `Executed / Paid` | Product + Architecture | Before QA |
| OQ-13 | Budget version editability | Controls / UI policy | Budget Overview, Overview | Controlled Open | Budget versions remain read-only | Product | Post-v1 unless explicitly unlocked |
| OQ-14 | Employee cost visibility for non-privileged roles | Permissions / Controls | Employee Cost View | Controlled Open | Aggregate-only visibility, exact rates hidden | Product + Management | Before implementation |

Κάθε γραμμή του πίνακα πρέπει τελικά να μετακινηθεί σε κατάσταση `Locked` ή `Deferred`, ώστε να μην παραμένει κανένα item μόνιμα ασαφές. Μέχρι να ληφθεί formal απόφαση, εφαρμόζεται υποχρεωτικά το δηλωμένο fallback behavior του αντίστοιχου item.

## 11. Προτεινόμενος αρχικός κατάλογος decision items

Το παρακάτω set είναι η σωστή αρχική ύλη για το 09, επειδή βασίζεται στα ήδη καταγεγραμμένα unresolved σημεία και δεν ξανανοίγει locked semantics.

### OQ-01 — As-of semantics for outstanding dashboard metrics

- Κατηγορία: Metric semantics
- Επηρεάζει: Overview, Receivables, Spend / Supplier Bills, Payments Queue
- Status: Open
- Fallback: point-in-time interpretation with consistent due-date and allocation logic.

### OQ-02 — Full policy for partial / multi-allocation behavior

- Κατηγορία: Data semantics / Workflow
- Επηρεάζει: Receivables, Spend / Supplier Bills, Payments Queue, Overview
- Status: Controlled Open
- Fallback: outstanding = total - allocated amount, partial paid only when outstanding remains positive.

### OQ-03 — Depth of immutable issued snapshot beyond totals

- Κατηγορία: Data semantics
- Επηρεάζει: Invoice Module, Receivables, Audit
- Status: Open
- Fallback: totals and issued truth treated as frozen even if deeper persistence model is not fully matured yet.

### OQ-04 — Numbering linkage policy between draft and issued invoice context

- Κατηγορία: Workflow / Data semantics
- Επηρεάζει: Invoice Module, Audit
- Status: Open.

### OQ-05 — Full transmission lifecycle policy

- Κατηγορία: Workflow / UI policy
- Επηρεάζει: Invoice Module, Overview, Invoice Detail
- Status: Open
- Fallback: Pending / Unknown vocabulary until final status model is defined.

### OQ-06 — Controlled policy for void / cancel / credit

- Κατηγορία: Business / Workflow
- Επηρεάζει: Invoice Module, Receivables, Audit
- Status: Open.

### OQ-07 — Vocabulary and policy for expected payment / promise to pay

- Κατηγορία: Workflow / UI policy
- Επηρεάζει: Receivables / Collections
- Status: Controlled Open.

### OQ-08 — Threshold and criteria for High-Risk Overdue

- Κατηγορία: Workflow / Metric semantics
- Επηρεάζει: Receivables, Overview
- Status: Open.

### OQ-09 — Dispute handling depth in collections

- Κατηγορία: Workflow
- Επηρεάζει: Receivables / Collections
- Status: Controlled Open.

### OQ-10 — Scheduled state semantics in Payments Queue

- Κατηγορία: Workflow / Data semantics
- Επηρεάζει: Payments Queue, Audit, Overview
- Status: Open.

### OQ-11 — Payment batch object versus grouped selection

- Κατηγορία: Workflow / Data semantics
- Επηρεάζει: Payments Queue, Audit
- Status: Open.

### OQ-12 — Final stop of v1 payment progression

- Κατηγορία: Workflow
- Επηρεάζει: Payments Queue, Controls, Overview
- Status: Open
- Question: σταματά το v1 στο Executed / Paid ή υπάρχει και μεταγενέστερο Confirmed / Reconciled;
- Fallback: v1 stops at Executed / Paid.

### OQ-13 — Budget versioning and editability

- Κατηγορία: Controls / UI policy
- Επηρεάζει: Budget Overview, Overview
- Status: Controlled Open
- Fallback: read-only versions with selector.

### OQ-14 — Employee cost visibility for non-privileged roles

- Κατηγορία: Permissions / Controls
- Επηρεάζει: Employee Cost View
- Status: Controlled Open
- Fallback: aggregates only, exact rates hidden.

## 12. Κριτήρια εξόδου από το stabilization phase

Το stabilization phase του v1 θεωρείται επαρκώς ώριμο όταν ισχύουν τα παρακάτω:

- δεν υπάρχουν semantic contradictions μεταξύ 00A, module docs και UI blueprint,
- κάθε critical KPI έχει σαφές source family, date semantics και drilldown target,
- invoice truth, receivable truth, readiness truth και payment execution truth δεν συγχέονται,
- τα blocked-by-default και partial allocation fallback rules εφαρμόζονται συνεπώς σε όλες τις relevant surfaces,
- τα πραγματικά open items είναι λίγα, named, owned και έχουν fallback,
- κανένα unresolved point δεν αφήνεται να περάσει στην implementation με vague labels ή implicit assumptions.

Με πιο απλά λόγια: το σύστημα είναι έτοιμο να υλοποιηθεί όταν σταματήσει να χρειάζεται "ερμηνευτή" για να καταλάβει κανείς τι σημαίνει κάθε state.

## 13. Τελική διατύπωση

Το 09 — Open Questions / Stabilization είναι το decision-control document του Finance Management & Monitoring System v1.  
Συγκεντρώνει τα πραγματικά unresolved points του συστήματος, ξεχωρίζει τα open areas από τις ήδη locked canonical αποφάσεις, επιβάλλει explicit fallback rules μέχρι την τελική απόφαση, και λειτουργεί ως μηχανισμός προστασίας απέναντι σε semantic drift, duplicated ambiguity και workflow confusion κατά τη μετάβαση από canonical design σε functional specification και implementation. Βασίζεται στη σταθερή αρχιτεκτονική του συστήματος ως monitoring shell, δύο operational chains και supporting control layer, χωρίς να επιτρέπει σε open questions να υπονομεύσουν τα ήδη κλειδωμένα boundaries μεταξύ truth, monitoring, readiness και execution.
