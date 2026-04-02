Finance Semantic Resolutions v1
1. Σκοπός του εγγράφου

Το παρόν έγγραφο λειτουργεί ως **diagram/workflow wording normalization sheet**: επιβάλλει στα artifacts (master flows, diagrams, walkthroughs, UI labels) σταθερά nouns, chains και handoff γλώσσα, χωρίς να ξαναγράφει semantic law.

Canonical authority:
- `00` / `00A` / `01` / module docs (`02+`) είναι τα canonical layers.
- Αυτό το έγγραφο δεν τα υπερισχύει· απλώς ορίζει **επιτρεπτό wording** ώστε τα diagrams να μην τα αντιφάσκουν.

2. Χρήση

Χρησιμοποιείται για:
- review/διόρθωση wording σε Mermaid diagrams και workflow docs,
- έλεγχο ότι UI labels δεν συγχέουν state families,
- καθαρό handoff language μεταξύ modules.

3. Diagram/Workflow wording rules (stable nouns & handoffs)

### 3.1 Monitoring/Controls wording
- Επιτρεπτό: “Overview routes/drilldowns”, “Controls exposes control visibility”.
- Απαγορευμένο: “Overview executes”, “Controls fixes/changes operational truth”.

### 3.2 Revenue wording (Invoice vs Receivable)
- Επιτρεπτό: “Invoice is Issued”, “Receivable is Open/Collected/Closed”, “Receipt reduces outstanding”.
- Απαγορευμένο: “invoice becomes paid/overdue/partially paid”.

### 3.3 Spend wording (Readiness vs Execution)
- Επιτρεπτό: “Supplier Bill is Ready/Blocked”, “Queue is Selected/Prepared (UI-only)”, “Scheduled”, “Executed/Paid”.
- Απαγορευμένο: “Queue makes readiness”, “Selected means paid”.

### 3.4 Commitment relief wording (no double counting)
- Επιτρεπτό: “Commitment relieved when linked Bill or linked Payment exists” (per `00A`).
- Απαγορευμένο: “Commitment + Bill + Payment all add up” όταν υπάρχει linkage.

### 3.5 State-family labeling rule (UI)
Τα labels σε diagrams/UI must not merge:
- Persisted domain status
- Operational signal
- Readiness state
- UI-only / ephemeral selection state

4. Direct cash / reconciliation branch (diagram classification)

Σε workflows/diagrams μπορεί να εμφανίζεται μόνο ως:
- **adjacent/transitional support path** (όχι top-level canonical module),
- με ρητό label ότι δεν αλλάζει ownership/boundaries των modules.

5. Supersession rule (diagrams)

Από το παρόν resolution pass και μετά, ισχύουν οι ακόλουθοι κανόνες:

Αν workflow diagram ή walkthrough συγκρούεται με 00, 00A, 01 ή με τις παρούσες semantic resolutions, το diagram θεωρείται μη canonical μέχρι να διορθωθεί.
Αν UI wording συγκρούεται με canonical object meaning, το wording αλλάζει. Δεν αλλάζει το object meaning.
Αν implementation artifact περιγράφει τρέχουσα συμπεριφορά που αποκλίνει από canonical rule, η περιγραφή πρέπει να φέρει explicit ένδειξη “current implementation deviation” ή να απομακρυνθεί από canonical-level docs.
6. What to check in every diagram (checklist)
- Invoice vs Receivable wording
- Outstanding changes only via settlement effect wording
- Readiness vs execution separation
- Commitment relief wording (no double count)
- UI-selection vs persisted status separation