# 01 — Finance Module Map

## 1. Document Purpose

Το παρόν έγγραφο αποτελεί τον κανονιστικό δομικό χάρτη του Finance Management & Monitoring System v1. Ορίζει την αρχιτεκτονική διάσπαση σε Modules, τους διακριτούς ρόλους τους και τις μεταξύ τους εξαρτήσεις.

Τι ορίζει: Ιδιοκτησία δεδομένων (Ownership), αρχιτεκτονική θέση, και ροή επιχειρησιακής πληροφορίας.
Τι ΔΕΝ ορίζει: UI/UX flows, API specs ή τεχνική υλοποίηση βάσεων δεδομένων.

---

## 2. Αρχιτεκτονική Δομή

Το σύστημα οργανώνεται σε 4 επίπεδα (layers):
- **Layer 1 — Monitoring Shell (Overview):** συνολική εποπτεία και δρομολόγηση.
- **Layer 2 — Revenue Chain:** διαχείριση εσόδων και απαιτήσεων.
- **Layer 3 — Spend Chain:** διαχείριση δαπανών και πληρωμών.
- **Layer 4 — Supporting Control Layer:** ερμηνεία, έλεγχος και διακυβέρνηση.

---

## 3. Top-Level Module Inventory

Το σύστημα απαρτίζεται από 7 βασικά modules. Κάθε module έχει συγκεκριμένο αρχιτεκτονικό τύπο και κύριο ρόλο.

| Module | Αρχιτεκτονικός Τύπος | Κύριος Ρόλος |
|---|---|---|
| `Overview` | Monitoring Shell | Συνοπτική εικόνα, σήματα προτεραιότητας (`Exposure`, `Overdue`) και routing. |
| `Invoicing` | Operational (Core) | Μετατροπή εργασίας σε issued invoice. Παραγωγή «αλήθειας» ποσών (snapshot). |
| `Receivables` | Operational (Follow-up) | Παρακολούθηση και είσπραξη απαιτήσεων μετά την τιμολόγηση. |
| `Purchase Requests / Commitments` | Operational (Upstream) | Αιτήματα δαπάνης και έγκριση δεσμεύσεων (commitments). |
| `Spend / Supplier Bills` | Operational (Readiness) | Διαχείριση υποχρεώσεων και σχηματισμός readiness σήματος πληρωμής. |
| `Payments Queue` | Execution Handoff | Εκτέλεση και δρομολόγηση πληρωμών (execution) βάσει readiness. |
| `Controls` | Supporting Layer | Παρακολούθηση Budget, Audit Trail, Employee Cost και επισήμανση αποκλίσεων. |

---

## 4. Λειτουργικές Αλυσίδες (Chains)

### 4.1 Revenue-side Chain (Κύκλος Εσόδων)

Η ροή ξεκινά από το `Invoicing` (έκδοση) και καταλήγει στο `Receivables` (είσπραξη).
- Το `Invoicing` κατέχει το **snapshot των ποσών** (issued invoice truth).
- Το `Receivables` κατέχει την **επιχειρησιακή κατάσταση** της απαίτησης (follow-up/collection).

### 4.2 Spend-side Chain (Κύκλος Δαπανών)

Η ροή ακολουθεί την αλληλουχία: Commitment \( \rightarrow \) Bill Readiness \( \rightarrow \) Execution.
- **Upstream:** `Purchase Requests / Commitments` (έγκριση/δέσμευση δαπάνης).
- **Midstream:** `Spend / Supplier Bills` (έλεγχος παραστατικού και «ξεκλείδωμα» πληρωμής).
- **Downstream:** `Payments Queue` (τελική εκτέλεση/δρομολόγηση).

---

## 5. Κανόνες Εξαρτήσεων (Dependency Rules)

Για τη διασφάλιση της ακεραιότητας ισχύουν οι εξής περιορισμοί:
- **Overview rule:** το `Overview` δεν παράγει πρωτογενή δεδομένα· αντλεί πληροφορία αποκλειστικά από operational modules και `Controls`.
- **Receivables rule:** το `Receivables` δεν νοείται ανεξάρτητα από issued invoice στο `Invoicing`.
- **Spend rule:** το `Payments Queue` δεν εκτελεί πληρωμή χωρίς readiness σήμα από `Spend / Supplier Bills`.
- **Controls rule:** το `Controls` δεν παρεμβαίνει στην εκτέλεση (execution)· παρακολουθεί και επισημαίνει αποκλίσεις.

---

## 6. System Relationship Map (Mermaid)

Το παρακάτω διάγραμμα είναι ο ενοποιημένος χάρτης σχέσεων του v1 (layers + βασικές εξαρτήσεις).  
Διαβάζεται ως αρχιτεκτονική modules/ownership, όχι ως UI navigation ή λεπτομερές workflow.

```mermaid
flowchart TB
    subgraph L1[Layer 1: Monitoring Shell]
        O[Overview<br/>Monitoring & Routing]
    end

    subgraph L2[Layer 2: Revenue Chain]
        I[Invoicing<br/>Truth Creation] --> R[Receivables<br/>Follow-up]
    end

    subgraph L3[Layer 3: Spend Chain]
        PRC[Purchase Requests / Commitments<br/>Upstream Approval] --> SSB[Spend / Supplier Bills<br/>Readiness Formation]
        SSB --> PQ[Payments Queue<br/>Execution Handoff]
    end

    subgraph L4[Layer 4: Controls]
        C[Controls<br/>Budget - Audit - Cost]
    end

    %% Dependencies
    I & R & PRC & SSB & PQ --> C
    C & I & R & PRC & SSB & PQ --> O
    O -.-> I & R & PRC & SSB & PQ
```

### Diagram A — Revenue-side chain

```mermaid
flowchart LR
    BW[Billable Work] --> I[Invoicing] --> R[Receivables]
    I --> O[Overview]
    R --> O
    I --> C[Controls]
    R --> C
```

### Diagram B — Spend-side chain

```mermaid
flowchart LR
    PRC[Purchase Requests / Commitments] --> SSB[Spend / Supplier Bills] --> PQ[Payments Queue]
    PRC --> O[Overview]
    SSB --> O
    PQ --> O
    PRC --> C[Controls]
    SSB --> C
    PQ --> C
```

### Diagram C — Monitoring / Control relation (module επίπεδο)

```mermaid
flowchart LR
    subgraph OPS[Operational modules]
      I[Invoicing]
      R[Receivables]
      PRC[Purchase Requests / Commitments]
      SSB[Spend / Supplier Bills]
      PQ[Payments Queue]
    end

    C[Controls<br/>interpretive/control visibility]
    O[Overview<br/>monitoring composition]

    I --> C
    R --> C
    PRC --> C
    SSB --> C
    PQ --> C

    I --> O
    R --> O
    PRC --> O
    SSB --> O
    PQ --> O
    C --> O
```

---

## 7. Module Inventory and Roles

### 7.1 Overview
- Monitoring shell: συνοψίζει, επισημαίνει προτεραιότητες και δρομολογεί προς owner modules.
- Δεν δημιουργεί transactional truth και δεν εκτελεί operational actions.

### 7.2 Invoicing
- Revenue core: μετατρέπει `Billable Work` σε issued invoice truth.
- Τροφοδοτεί downstream το `Receivables` με issued context.

### 7.3 Receivables
- Revenue follow-up: οργανώνει την παρακολούθηση και είσπραξη issued απαιτήσεων.
- Δεν νοείται χωρίς upstream issued truth από το `Invoicing`.

### 7.4 Purchase Requests / Commitments
- Upstream spend initiation / approval layer.
- Παράγει commitment visibility και downstream context προς `Spend / Supplier Bills`.

### 7.5 Spend / Supplier Bills
- Supplier obligation + payable readiness layer.
- Παράγει `Ready / Blocked` outcome προς `Payments Queue`, χωρίς execution ownership.

### 7.6 Payments Queue
- Downstream execution / handoff workspace για πληρωμές βάσει upstream readiness.
- Δεν σχηματίζει readiness και δεν λειτουργεί ως matching module.

### 7.7 Controls
- Supporting control layer για `Budget`, `Audit Trail` και `Employee Cost`.
- Παρέχει control visibility προς `Overview`, χωρίς execution ownership.

## 8. Dependency Matrix

| Module | Module Type | Upstream Dependencies | Downstream Effects | Should Not Be Mistaken For |
|---|---|---|---|---|
| `Overview` | Monitoring shell | Operational outputs + Controls outputs | Routing προς operational focus | Execution workspace |
| `Invoicing` | Operational workspace (Revenue core) | Billable Work context | Issued invoice context -> `Receivables` | Collections module ή accounting engine |
| `Receivables` | Operational follow-up workspace | `Invoicing` issued context | Follow-up outputs προς `Overview`/`Controls` | Issue/draft module ή payment registration engine |
| `Purchase Requests / Commitments` | Operational upstream workspace (Spend initiation/approval) | Spend initiation context | Approved/Committed context -> `Spend / Supplier Bills` | Payable execution module |
| `Spend / Supplier Bills` | Operational readiness workspace | `Purchase Requests / Commitments` | Ready/Blocked payable context -> `Payments Queue` | Final payment execution module |
| `Payments Queue` | Execution handoff workspace | `Spend / Supplier Bills` readiness | Payment outcomes προς `Controls`/`Overview` | Matching/readiness formation module |
| `Controls` | Supporting control layer | Inputs από όλα τα operational modules | Control visibility προς `Overview` | Operational core loop |

---

## 9. Boundary Notes

Το παρόν Module Map δεν είναι:
- database entity map
- API dependency tree
- UI route tree
- screen blueprint
- detailed workflow spec

Το έγγραφο διαβάζεται μαζί με:
- `00 — Finance Canonical Brief`
- `00A — Finance Domain Model & System Alignment`
- UI Blueprint
- module briefs
- workflow docs

---

## 10. Τελική Δήλωση Αρχιτεκτονικής

Το Finance System v1 είναι δομημένο οικοσύστημα όπου η επιχειρησιακή κίνηση (Revenue/Spend) τροφοδοτεί συνεπαγωγικά τον έλεγχο (`Controls`) και την εποπτεία (`Overview`). Η σαφής διάκριση μεταξύ **Creation** (`Invoicing` / `Commitments`), **Readiness** (`Spend / Supplier Bills`) και **Execution** (`Payments Queue`) διατηρεί το σύστημα ελέγξιμο και επεκτάσιμο.
