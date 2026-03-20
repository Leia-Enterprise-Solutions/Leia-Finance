# Finance Management & Monitoring System v1  
## UI Blueprint and Implementation Report

### 1. Document Purpose
Το παρόν έγγραφο ορίζει ένα **implementation-ready UI Blueprint** για το **Finance Management & Monitoring System v1**: οθόνες, ροές χρήστη, δομή σελίδων, καταστάσεις, ορατά δεδομένα, φίλτρα, actions, widgets, κενές/εξαίρεσης καταστάσεις και οδηγίες υλοποίησης για frontend.

Το έγγραφο **δεν** ορίζει backend αρχιτεκτονική, schema αντικειμένων, βάσεις δεδομένων, APIs, λογιστική μηχανή, journal entries, ούτε νομικούς/φορολογικούς κανόνες. Όπου απαιτούνται τέτοιες αποφάσεις, καταγράφονται ρητά ως **OPEN QUESTION / ARCHITECT DECISION**.

Σημείωση εισόδων: Στο brief αναφέρονται δύο “source of truth” έγγραφα (`finance-system-blueprint-v1.md`, `finance-master-workflow.md`). Κατά τη σύνταξη αυτού του report **δεν βρέθηκαν στο repository**. Το παρόν blueprint είναι αυστηρά εναρμονισμένο με τις έννοιες και διαχωρισμούς που ορίζει το brief (π.χ. billable work vs invoice draft vs issued receivable vs collected cash, purchase request vs commitment vs supplier bill vs paid cash out, budget vs committed vs actual). Μόλις προστεθούν τα δύο source docs, το report πρέπει να γίνει **line-by-line validation** για τυχόν αποκλίσεις ορολογίας/κανόνων.

---

### 2. Scope Boundary

#### Included in v1
Το v1 περιλαμβάνει ένα επιχειρησιακό επίπεδο παρακολούθησης χρηματοοικονομικής εκτέλεσης (operational finance & monitoring), με σαφείς διακριτές έννοιες:
- **Invoicing & collections monitoring**: παρακολούθηση τιμολογίων από draft έως issued receivable, και από εκεί έως collected cash.
- **Receivables / payables visibility**: ορατότητα απαιτήσεων (εισπρακτέων) και υποχρεώσεων (πληρωτέων).
- **Expenses / supplier obligations**: supplier bills/expenses, due dates, readiness, πληρωμές.
- **Purchase request → payment workflow**: αιτήματα αγορών, εγκρίσεις, commitments, δημιουργία/σύνδεση supplier bill, queue πληρωμών.
- **Budgeting visibility & control**: budgeted ποσά, committed ποσά, actual paid ποσά, variance/remaining.
- **Finance overview dashboard**: KPI widgets, trends, exposure/overdue, drilldowns.
- **Cashflow widgets**: καθαρή κίνηση μετρητών (net cash movement), collected vs paid, και exposure σε open receivables/payables.
- **Employee cost visibility**: κόστος προσωπικού, billable vs non-billable split, allocation insights και margin-relevant ορατότητα όπου επιτρέπεται.
- **Audit trail visibility**: activity log με actor/action/target, before-after όπου έχει νόημα, φίλτρα.

#### Explicitly excluded from v1
- **Πλήρης λογιστική/λογιστικό καθολικό** (general ledger), journal postings, διπλογραφία.
- **Φορολογική/νομική μηχανή** για υπολογισμούς, αυτόματη συμμόρφωση, αυτοματοποίηση δηλώσεων.
- **Αυτόματη διασύνδεση με τράπεζες** ή reconciliation engine (εκτός αν υπάρξει ρητή απόφαση v1).
- **Πλήρες procurement/ERP** (αποθήκη, παραλαβές, τιμοκατάλογοι, συμβάσεις προμηθευτών ως σύστημα).
- **Forecasting** (ρητά για v2 μόνο).

#### Reserved for v2
- **Forecasting**: προβλέψεις εισπράξεων/πληρωμών, scenario planning, projected cash runway.
- Εμπλουτισμένες αυτοματοποιήσεις (π.χ. προτεινόμενα follow-ups, auto-escalations βάσει κανόνων) εφόσον επιβεβαιωθεί αξία χρήσης.

---

### 3. Core Workflow Summary
Αυτό το τμήμα συνοψίζει τις κύριες ροές που “δένουν” όλες τις οθόνες.

**A. Billable Work → Invoice Draft → Issued Invoice → Payment Collection → Cashflow Update**
Το v1 διατηρεί αυστηρό διαχωρισμό μεταξύ:
- **Billable work** (υποψήφιες χρεώσιμες καταχωρήσεις/εργασία),
- **Invoice draft** (πρόχειρο τιμολόγιο/σύνθεση γραμμών),
- **Issued invoice / receivable** (εκδοθέν έσοδο/απαίτηση),
- **Collected cash** (είσπραξη/καταγεγραμμένο cash-in).
Η UI πρέπει να αποτρέπει διπλο-τιμολόγηση, να δείχνει ακριβώς τι έχει επιλεγεί/δεσμευθεί σε draft, τι έχει εκδοθεί, τι έχει εισπραχθεί και τι εκκρεμεί.

**B. Purchase Request → Approval → Supplier Bill → Payment → Cashflow Update**
Ροή δαπανών με διακριτές έννοιες:
- **Purchase request** (αίτημα),
- **Approved commitment** (έγκριση/δέσμευση),
- **Supplier bill** (τιμολόγιο/υποχρέωση),
- **Paid cash out** (πληρωμή/καταγεγραμμένο cash-out).
Η UI πρέπει να επισημαίνει mismatches (ποσό, κατηγορία, supplier, έλλειψη συνημμένων) και να διαχωρίζει **readiness** από **execution**.

**C. Budget Allocation → Commitment / Actual Consumption → Variance Visibility**
Budget ορατότητα ανά περίοδο και breakdown (department/project/category), με:
- **Budgeted amount**
- **Committed amount**
- **Actual paid amount**
- (προαιρετικά ως ορατότητα) **Open payable amount**
και καθαρές ενδείξεις variance/remaining.

**D. Employee Cost Input → Cost Visibility → Resource / Margin Insight**
Ορατότητα κόστους προσωπικού σε επίπεδο employee ή ομάδας, με:
- περίοδο/ημερομηνίες,
- billable vs non-billable split,
- allocation σε project/department όπου υπάρχει,
- κατανόηση επίπτωσης σε περιθώριο (χωρίς να “ορίζεται” λογιστική).

---

### 4. UI Architecture Overview
Παρακάτω προτείνεται page/module map για το v1. Κάθε σελίδα έχει ρόλο στη συνολική εκτέλεση.

- **Finance Overview Dashboard**: Ενιαία “επιχειρησιακή κονσόλα” για KPIs, exposure, overdue, trends και drilldowns.
- **Invoices List**: Επιχειρησιακή λίστα τιμολογίων/receivables με φίλτρα, aging, overdue, fiscal/transmission status και bulk actions.
- **Invoice Drafts List**: Επιχειρησιακή επιφάνεια διαχείρισης drafts (ανακάλυψη, συνέχιση, review, καθαρισμός/ακύρωση), με έλεγχο “stale” και ενδείξεις reserved lines.
- **Invoice Draft Builder**: Επιφάνεια σύνθεσης draft από billable entries, με σαφή διάκριση υποψηφίων vs επιλεγμένων γραμμών και προ-έλεγχο διπλοτιμολόγησης.
- **Invoice Detail View**: Πλήρης προβολή issued invoice/receivable με πληρωμές, συνδεδεμένη εργασία, external fiscal/transmission status, timeline.
- **Collections / Receivables View**: Εξειδικευμένη οθόνη είσπραξης με prioritization βάσει aging/overdue, owner/follow-up και σημειώσεις συλλογής.
- **Purchase Requests List**: Λίστα αιτημάτων αγοράς με status, urgency, approver, budget context indicators και attachment signals.
- **Purchase Request Detail / Approval View**: Λεπτομέρεια αιτήματος για απόφαση έγκρισης/απόρριψης, σχόλια, escalations, σύνδεση με supplier bill.
- **Supplier Bills / Expenses List**: Λίστα υποχρεώσεων/δαπανών (supplier bills) με match status προς request, readiness, due, payment status, exceptions.
- **Supplier Bill Detail View**: Λεπτομέρεια supplier bill με mismatch panel, attachments, readiness, payment history και audit.
- **Payments Queue**: Ενιαίο queue εκτέλεσης πληρωμών (payables), με “ready”, “blocked”, “due soon”, “overdue” ομαδοποιήσεις και batch selection.
- **Budget Overview**: Dashboard προϋπολογισμών με version/period selectors, breakdowns, committed vs actual, variance, remaining.
- **Employee Cost View**: Οθόνη κόστους προσωπικού με περιορισμούς ορατότητας, billable split, allocations και margin-relevant summaries.
- **Audit Trail / Activity Log**: Κεντρικό χρονολόγιο ενεργειών για auditability, filtering και traceability across modules.

---

### 5. Global UI Rules
Οι παρακάτω κανόνες εφαρμόζονται σε όλες τις οθόνες και πρέπει να υλοποιηθούν ως κοινά UI patterns/components.

- **Status chips (unified)**: Κάθε domain (invoice, collection, request, supplier bill, payment, budget signal) εμφανίζει status chip με σταθερό χρώμα/ένταση. Τα chips δεν είναι διακοσμητικά: οδηγούν φίλτρα, επιτρέπουν quick filtering και επηρεάζουν visual priority.
- **Amount formatting**: Όλα τα ποσά εμφανίζονται σε νόμισμα (default EUR), με consistent formatting (χιλιάδες, δύο δεκαδικά), και σαφή labeling: “Total”, “Paid”, “Outstanding”, “Committed”, “Budgeted”, “Actual Paid”.
- **Overdue highlighting**: Οτιδήποτε overdue (receivable ή payable) λαμβάνει έντονη οπτική σήμανση: κόκκινο status + “days overdue” + pinning/priority στις λίστες. Το overdue δεν πρέπει να κρύβεται σε tooltip.
- **Mismatch / warning banners**: Όταν υπάρχει mismatch (π.χ. supplier bill ≠ approved request), ή “blocked for payment”, ή “external fiscal/transmission issue”, εμφανίζεται banner στην κορυφή detail views και badge στις λίστες.
- **Audit visibility principles**: Κάθε detail view έχει “Timeline / Activity” block που δείχνει κρίσιμες αλλαγές: status transitions, amount changes, due date changes, approvals, attachments added/removed, payment registrations. Όπου είναι διαθέσιμο, πριν/μετά εμφανίζεται με emphasis.
- **Filters behavior**: Τα φίλτρα είναι multi-select όπου έχει νόημα. Κάθε list view έχει “Clear all”, “Save view” (αν επιτραπεί), και εμφανίζει active filters ως chips. Αλλαγές φίλτρων ανανεώνουν το table state χωρίς να “χάνεται” selection.
- **Empty states**: Κάθε οθόνη έχει στοχευμένο empty state με:
  - τι λείπει (π.χ. “Δεν υπάρχουν billable entries για την περίοδο”),
  - τι μπορεί να κάνει ο χρήστης (π.χ. αλλαγή date range, αφαίρεση φίλτρων, δημιουργία draft),
  - link/CTA προς την επόμενη λογική ενέργεια.
- **Permission-dependent actions**: Actions όπως “Approve request”, “Issue invoice”, “Mark as paid”, “Execute payment”, “Edit employee costs” πρέπει να κρύβονται ή να εμφανίζονται disabled με reason (π.χ. “Δεν έχετε δικαίωμα”) χωρίς να αλλοιώνεται η ορατότητα του record.
- **Linked records behavior**: Όπου υπάρχει σύνδεση (invoice ↔ billable work, supplier bill ↔ purchase request, payment ↔ invoice/bill), η UI παρέχει:
  - inline link με reference,
  - hover preview (side panel mini),
  - click-through σε full detail,
  - “Open in new tab” συμπεριφορά.
- **Side panel vs full page**: Οι λίστες ανοίγουν record σε **side detail panel** για γρήγορη triage. Η πλήρης σελίδα detail είναι για “deep work” (επισυνάψεις, approvals, ιστορικό, actions).
- **Dashboard widget interaction rules**: Κάθε widget είναι clickable και οδηγεί σε συγκεκριμένη λίστα με προ-εφαρμοσμένα φίλτρα (drilldown), ποτέ σε “generic search”.
- **Date range rule**: Όλες οι βασικές οθόνες έχουν date range συμβατό με dashboard: current month, quarter, YTD, last-year-to-date, με σαφή ορισμό τι σημαίνει “period” ανά metric (βλ. section 10).

---

### 6. Screen-by-Screen Blueprint

#### 6.1 Finance Overview Dashboard

##### a. Screen Purpose
Να παρέχει μια ενιαία εικόνα εκτέλεσης finance: τι έχει εκδοθεί, τι έχει εισπραχθεί, τι οφείλεται, τι έχει δεσμευθεί, τι έχει πληρωθεί, και ποιο είναι το exposure σε overdue/ρίσκο, με γρήγορα drilldowns.

##### b. Primary User Types
Finance operator, COO/ops, founders/management, team leads (σε περιορισμένη ορατότητα), account managers (για receivables follow-up).

##### c. Layout Structure
- **Top bar**: Date range switcher (current month / quarter / YTD / last-year-to-date) + optional global filters (client, supplier, department, project, category) + “Reset”.
- **KPI strip (sticky on scroll)**: 8–12 KPI cards (βλ. section 10).
- **Trends row**: 2–3 charts (π.χ. collected vs paid, invoiced vs collected, committed vs actual).
- **Exposure row**: Receivables snapshot + Payables snapshot (aging).
- **Budget & commitments row**: Commitment vs Budget snapshot (by department/project).
- **Overdue focus panel**: Overdue receivables + overdue payables + top 10 items.
- **Drilldown shortcuts**: Quick links (Invoices, Collections, Purchase Requests, Supplier Bills, Payments Queue, Budget Overview).

##### d. Sections / Components
- **KPI widgets**: Gross Invoiced, Income Collected, Expenses Paid, Net Cash Movement, Outstanding Receivables, Outstanding Payables, Committed Spend, Budget Utilization, Overdue Receivables, Overdue Payables.
- **Trend charts**:
  - “Invoiced vs Collected” (μηνιαίο/εβδομαδιαίο).
  - “Paid Expenses” trend.
  - “Committed vs Actual Paid” trend.
- **Receivables snapshot**: Aging buckets (Not due, 1–15, 16–30, 31–60, 60+), total outstanding, count, top clients.
- **Payables snapshot**: Aging buckets (Not due, 1–15, 16–30, 31–60, 60+), total open payables, count, top suppliers.
- **Commitment vs Budget**: stacked bars ανά department/project/category.
- **Overdue exposure list**: “Top overdue items” με amount, days overdue, owner/next action.

##### e. Required Visible Data
- σαφείς ορισμοί των KPI labels (π.χ. “Gross Invoiced” ≠ “Collected”),
- ποσά + περίοδος,
- counts (π.χ. # invoices overdue),
- aging distribution,
- breakdown tags (client/supplier/department/project/category),
- drilldown hints (π.χ. “Click to view 23 invoices”).

##### f. Filters
- date range: current month / quarter / YTD / last-year-to-date / custom range
- client (multi-select)
- supplier (multi-select)
- department (multi-select)
- project (multi-select)
- category (multi-select)

##### g. Sorting / Grouping
Στα “Top lists” δυνατότητα sort by amount, days overdue, due date.

##### h. Row / Card Actions
- Click KPI card → αντίστοιχη λίστα με προ-φίλτρα.
- Click aging bucket → Collections/Payables view με bucket φίλτρο.
- Click top item → ανοίγει detail panel του record.

##### i. Bulk Actions
Δεν εφαρμόζονται στο dashboard (μόνο drilldown).

##### j. Detail View / Side Panel Requirements
Side panel για invoice/supplier bill από top lists:
- header με reference + status chips
- amounts (total/paid/outstanding ή open payable)
- due/issue dates
- owner/follow-up (για receivables)
- primary actions (π.χ. “Open full detail”, “Add note” όπου επιτρέπεται)

##### k. Statuses Shown on This Screen
Συνοπτικά status chips/badges:
- Invoice: Draft / Issued / Partially Paid / Paid / Overdue / Cancelled-Credited (αν υπάρχει)
- Payables: Ready / Blocked / Scheduled / Paid / Overdue
- Budget signals: Healthy / Warning / Breach (βλ. section 8)

##### l. Empty / Error / Exception States
- **No data in date range**: Εμφάνιση “Δεν υπάρχουν κινήσεις/records στην επιλεγμένη περίοδο” + suggestion να αλλάξει range ή αφαιρέσει φίλτρα.
- **Filter yields zero**: Εμφάνιση active filters chips + “Clear filters”.
- **Data unavailable**: Banner “Προσωρινή αδυναμία φόρτωσης metrics” με retry.

##### m. Notes for Frontend Implementation
- Τα widgets πρέπει να είναι “deterministic drilldowns”: κάθε widget έχει σταθερό target screen + pre-applied filters.
- Όλες οι κάρτες εμφανίζουν “definition tooltip” (σύντομος ορισμός) που παραπέμπει στο section 10.
- Οι charts πρέπει να έχουν hover values, αλλά και “Open list view” CTA.

---

#### 6.2 Invoices List

##### a. Screen Purpose
Λίστα διαχείρισης τιμολογίων/receivables για αναζήτηση, φίλτρα, triage overdue, και πρόσβαση σε details/ενέργειες.

##### b. Primary User Types
Finance operator, account managers (για follow-up), management.

##### c. Layout Structure
- Top header: “Invoices” + quick stats (count, total outstanding) για το ενεργό φίλτρο.
- Filter bar: status, client, project/contract, issue/due date, aging bucket, fiscal/transmission.
- Main table: invoices με προτεινόμενες στήλες.
- Side detail panel: ανοίγει με click σε row.
- Bulk action bar: εμφανίζεται όταν υπάρχουν selected rows.

##### d. Sections / Components
- **Table** με sticky header, column visibility menu.
- **Aging summary strip** πάνω από table (optional): buckets με counts/outstanding.
- **Saved views** (optional) για Finance: “Overdue 30+”, “Pending transmission”, “Partially paid”.

##### e. Required Visible Data
Προτεινόμενες στήλες:
- invoice reference
- client
- related project / contract
- issue date
- due date
- total amount
- paid amount
- outstanding amount
- payment status
- days overdue ή aging bucket
- fiscal / transmission status
Επιπλέον χρήσιμα:
- owner (collection owner)
- last activity / last note date (για follow-up)
- external reference (αν υπάρχει: επίσημος αριθμός/παραστατικό)

##### f. Filters
- payment status (multi-select)
- aging bucket (Not due, 1–15, 16–30, 31–60, 60+)
- client
- project/contract
- issue date range
- due date range
- fiscal/transmission status
- outstanding amount range (min/max)
- owner / follow-up owner

##### g. Sorting / Grouping
- default sorting: due date asc, then days overdue desc για overdue views
- sorting: issue date, due date, outstanding amount, client, fiscal status
- grouping (optional): by client, by aging bucket, by fiscal status

##### h. Row / Card Actions
Row actions (ellipsis):
- Open detail
- Copy invoice reference
- Add collection note
- View linked billable work (read-only)
- View payments (read-only)
- Go to Collections view filtered to this invoice/client

##### i. Bulk Actions
Μόνο UI-level actions χωρίς backend “φαντασία”, π.χ.:
- Bulk export (CSV) των εμφανιζόμενων columns
- Bulk assign owner (αν επιτρέπεται)
- Bulk add follow-up tag / reminder (αν προβλέπεται ως UI capability)
Οτιδήποτε επηρεάζει status (π.χ. “Mark as paid”) απαιτεί ARCHITECT DECISION (βλ. section 12).

##### j. Detail View / Side Panel Requirements
Side panel περιλαμβάνει:
- header: invoice ref + status chips (invoice, fiscal/transmission)
- amounts: total/paid/outstanding
- dates: issue/due
- client + project/contract link
- collection summary: expected payment date (αν υπάρχει), owner, last note snippet
- actions: “Open full detail”, “Add note”, “Go to Collections”

##### k. Statuses Shown on This Screen
Invoice statuses (βλ. section 8) και fiscal/transmission statuses ως ξεχωριστό chip (δεν συγχωνεύεται με payment status).

##### l. Empty / Error / Exception States
- No invoices in range
- All invoices paid (για συγκεκριμένο φίλτρο): προτείνει αλλαγή φίλτρων
- Data load error: retry + diagnostics hint (“Try removing filters”)

##### m. Notes for Frontend Implementation
- Overdue visual treatment: row tint + overdue badge + days overdue column always visible όταν υπάρχει overdue filter.
- Fiscal/transmission status πρέπει να είναι εμφανές ως ξεχωριστό dimension (όχι απλά icon).

---

#### 6.2A Invoice Drafts List

##### a. Screen Purpose
Να λειτουργεί ως **επιχειρησιακή “ουρά” drafts** ώστε τα draft invoices να είναι ανακαλύψιμα, να μπορούν να συνεχιστούν/ελεγχθούν/καθαριστούν, και να αποφεύγεται το φαινόμενο “drafts που χάνονται μέσα στον builder”.

##### b. Primary User Types
Finance operator, operations. (Προαιρετικά: management σε read-only για ορατότητα backlog.)

##### c. Layout Structure
- Top header: “Invoice Drafts” + quick stats (count, total draft preview sum, # stale).
- Filter bar: owner, client, project/contract, last updated range, stale age bucket, review-needed, reserved-lines.
- Main table: drafts με προτεινόμενες στήλες.
- Side detail panel: ανοίγει με click σε row, με preview του draft και primary actions.
- Bulk action bar: εμφανίζεται όταν υπάρχουν selected rows.

##### d. Sections / Components
- **Drafts table** με sticky header, column visibility menu.
- **Stale strip** (optional): buckets π.χ. “7–14 ημέρες”, “15–30”, “30+” με counts.
- **Review-needed indicator**: badge/flag που ενεργοποιείται από κανόνες UI (βλ. exception states).

##### e. Required Visible Data
Προτεινόμενες στήλες (must include):
- draft reference
- client
- project/contract
- owner
- last updated
- stale age (ημέρες από last updated)
- selected lines count
- draft total preview
- review-needed flag
- reserved-lines indicator (π.χ. “Reserving 12 items”)
Επιπλέον χρήσιμα:
- “has unsaved changes” indicator (αν υποστηρίζεται)
- notes/labels (π.χ. “Waiting on tax terms”) ως ελαφρύ operational tagging

##### f. Filters
- owner
- client
- project/contract
- last updated date range
- stale age bucket (e.g. <7, 7–14, 15–30, 30+)
- review-needed (yes/no)
- reserved-lines indicator (yes/no)
- “empty draft” (selected lines count = 0) yes/no

##### g. Sorting / Grouping
- Default sorting: stale age desc, then last updated asc (ώστε να ανεβαίνουν τα πιο “ξεχασμένα”).
- Sorting: last updated, draft total preview, selected lines count, client, owner.
- Grouping (optional): by owner, by client.

##### h. Row / Card Actions
Row actions (ellipsis):
- Resume/Edit in Draft Builder (navigation)
- Open read-only preview (side panel)
- Mark as “Needs review” / clear flag (UI-only tagging, αν επιτραπεί)
- Duplicate (creates a new draft copy) (OPEN QUESTION / ARCHITECT DECISION — αν επιτρέπεται)
- Discard/Cancel draft (requires confirmation) (policy dependent)

##### i. Bulk Actions
- Bulk export (CSV)
- Bulk assign owner (αν επιτρέπεται)
- Bulk discard/cancel drafts (requires confirmation, restricted to stale drafts by default)

##### j. Detail View / Side Panel Requirements
Side panel draft preview:
- header: draft reference + “Draft” status + stale badge (αν stale)
- client + project/contract
- totals preview (subtotal/taxes/total ως preview)
- selected lines list (top 10) + count
- reserved-lines summary (how many source items currently reserved)
- last updated + last editor (αν διαθέσιμο)
- primary CTAs: “Open in Draft Builder”, “Discard draft”

##### k. Statuses Shown on This Screen
Εμφανίζονται operational statuses/flags:
- Draft (baseline)
- Stale draft (warning/danger ανά bucket)
- Review-needed (flag)
Σημείωση: δεν εισάγεται νέο “λογιστικό” lifecycle εδώ· είναι management surface για drafts.

##### l. Empty / Error / Exception States
- **No drafts exist**: empty state με CTA “Create new draft” (οδηγεί στο Draft Builder) και εξήγηση ότι drafts εμφανίζονται όταν γίνεται “Save draft”.
- **Only stale drafts view**: αν κανένα δεν είναι stale, εμφανίζει “0 stale drafts” + link “View all drafts”.
- **Draft with zero lines**: εμφανίζεται ως exception badge “Empty draft” και προτείνεται discard.
- **Draft reserves lines for too long**: warning banner στο side panel “Το draft δεσμεύει γραμμές για Χ ημέρες” + CTA “Resume & finalize” ή “Discard to release”.

##### m. Notes for Frontend Implementation
- Το “reserved-lines indicator” είναι κρίσιμο για αποφυγή “αόρατου lock” σε billable entries. Η UI πρέπει να κάνει το reservation ορατό και να δίνει καθαρές επιλογές (resume ή discard).
- Η διαχείριση “discard/cancel” δεν πρέπει να εκτελείται χωρίς confirmation modal που συνοψίζει: client, total preview, reserved lines count, last updated.

---

#### 6.3 Invoice Draft Builder

##### a. Screen Purpose
Να επιτρέπει την επιχειρησιακή σύνθεση ενός **invoice draft** από **billable work** με καθαρότητα επιλογής, αποφυγή διπλο-τιμολόγησης και έλεγχο totals πριν την έκδοση.

##### b. Primary User Types
Finance operator, operations.

##### c. Layout Structure
Διάταξη 3-pane:
- **Left: Source billable entries** (candidate work)
- **Center: Selected invoice lines** (draft content)
- **Right: Totals & terms** (summary, taxes/terms/notes)
Sticky bottom bar: “Save draft”, “Discard changes”, “Review”.

##### d. Sections / Components
- **Source billable entries area**
  - table/list με **επιλέξιμες χρεώσιμες μονάδες** (billable source items)
  - search + filters (client, project, period, type)
  - indicators: already invoiced / reserved in another draft / unavailable
- **Selected lines area**
  - re-order lines
  - edit description/quantity/amount at UI level (μόνο αν επιτραπεί)
  - remove line
- **Totals summary area**
  - subtotal
  - taxes (ως UI section, χωρίς να ορίζει κανόνες)
  - total
  - due terms (π.χ. net 30) και due date preview
  - notes / internal memo

##### e. Required Visible Data
Για **source entries** (billable source items):
- περιγραφή εργασίας
- ημερομηνία/περίοδος
- client + project
- ποσό ή units + rate (όπως είναι διαθέσιμο)
- κατάσταση τιμολόγησης: “Available”, “Already invoiced”, “In draft (reserved)”
Ελάχιστη ορατή αναφορά/ταυτότητα (για να μην είναι “αφηρημένο ποσό”):
- ένα **source reference** (π.χ. work item ID / time entry reference / deliverable reference) ή, αν αυτό δεν έχει οριστεί, ένα σταθερό “Entry reference” που μπορεί να αντιγραφεί (OPEN QUESTION / ARCHITECT DECISION ως προς την canonical πηγή).
Σημείωση canonical source type:
- Αν δεν έχει αποφασιστεί αν το source είναι **time entry**, **task/work item**, **deliverable line**, **manual billable candidate** ή **hybrid**, η UI πρέπει να το χειριστεί ως **ενιαία επιλέξιμη μονάδα** με κοινά ελάχιστα ορατά στοιχεία: reference, περιγραφή, περίοδος, client/project, ποσό/units, κατάσταση (available/reserved/invoiced) και origin badge (π.χ. “Time”, “Task”, “Manual”) όπου είναι διαθέσιμο.
Για **selected lines**:
- line description
- amount
- linked source reference (όπου υπάρχει)
Για totals:
- subtotal, taxes (labelled), total, due terms, notes.

##### f. Filters
Source entries filters:
- client
- project/contract
- date range / work period
- type/category of billable work
- availability status (Available only / include reserved / include already invoiced as read-only)

##### g. Sorting / Grouping
Source sorting: by date, by amount, by project.
Selected sorting: manual (drag).

##### h. Row / Card Actions
Source entry actions:
- Add to draft
- View entry details (side mini panel)
Selected line actions:
- Remove
- Edit (if allowed)
- Jump to source entry

##### i. Bulk Actions
Source entries:
- “Add selected to draft”
- “Select all visible”

##### j. Detail View / Side Panel Requirements
Mini panel για source entry:
- full description
- date/time
- project/contract
- amount breakdown
- invoicing status history (read-only)

##### k. Statuses Shown on This Screen
Availability statuses for billable entries:
- Available
- Reserved in draft
- Already invoiced
Draft status (header):
- Draft (Unsaved changes / Saved)
- Stale draft warning (αν έχει παλαιότητα)

##### l. Empty / Error / Exception States
- **No billable entries available**: empty state με προτεινόμενες ενέργειες (change period, client, include other projects).
- **All billable entries already invoiced**: informative state + link σε Invoices List filtered to that period/client.
- **Duplicate prevention**: αν ο χρήστης επιχειρεί να προσθέσει ήδη invoiced/reserved entry, εμφανίζεται blocking modal με explanation.
- **Stale draft**: banner “Το draft έχει να ενημερωθεί Χ ημέρες” + CTA “Review lines”.

##### m. Notes for Frontend Implementation
- Η UI πρέπει να εφαρμόζει “duplicate prevention” σε επίπεδο interaction: disable “Add” για μη διαθέσιμες εγγραφές, με tooltip “Already invoiced / Reserved”.
- Να υπάρχει καθαρή διάκριση UI μεταξύ candidate list και selected draft lines (π.χ. διαφορετικό background, pinned counts).
- Τα “Reserved in draft” items πρέπει να εμφανίζουν **πού είναι δεσμευμένα** (draft reference + link σε `Invoice Drafts List`), ώστε ο χρήστης να μπορεί να τα απελευθερώσει μέσω resume/discard.

---

#### 6.4 Invoice Detail View

##### a. Screen Purpose
Να παρέχει πλήρη εικόνα ενός issued invoice/receivable: τι περιλαμβάνει, τι πληρωμές έχουν καταγραφεί, ποια είναι η κατάσταση είσπραξης, και τι ισχύει για fiscal/transmission.

##### b. Primary User Types
Finance operator, collections owner, management.

##### c. Layout Structure
- **Header summary** (sticky): invoice ref, client, total/paid/outstanding, payment status, due, fiscal/transmission chip.
- **Tabs ή sections** σε single page:
  - Overview
  - Linked billable work
  - Payments
  - Collections notes/history
  - Fiscal / external transmission
  - Timeline / activity log
Right rail (optional): quick actions + next follow-up.

##### d. Sections / Components
- **Invoice summary header**
- **Linked billable work section** (read-only list)
- **Payment section** (payment registrations, allocations)
- **Collections notes / history section** (owner, next action, expected date)
- **Fiscal / external transmission status section**
- **Timeline / activity log block**

##### e. Required Visible Data
- invoice reference + external official reference (αν υπάρχει)
- client + project/contract
- issue date, due date, terms
- total amount, paid amount, outstanding
- payment status + aging/overdue days
- linked work lines with references
- payments list: date, amount, method (if known), allocation notes
- collection notes: latest note, follow-up owner, expected payment date
- fiscal/transmission: status + last update time + error reason (if failed) + reference id (if available)

##### f. Filters
Στα embedded lists:
- linked work: filter by project, period
- payments: filter by date range, allocation status

##### g. Sorting / Grouping
Linked work: by date asc.
Payments: by date desc.
Timeline: by time desc (default) με option chronological asc.

##### h. Row / Card Actions
- Add collection note
- Set / update expected payment date (UI action; backend decision)
- Open Collections view pre-filtered
- View fiscal/transmission details

##### i. Bulk Actions
Δεν εφαρμόζονται στο detail.

##### j. Detail View / Side Panel Requirements
Το ίδιο είναι full detail. Από άλλα screens, side panel πρέπει να δίνει CTA “Open full detail”.

##### k. Statuses Shown on This Screen
Invoice + payment statuses, fiscal/transmission status, collection follow-up status (π.χ. “Follow-up due today”).

##### l. Empty / Error / Exception States
- **Invoice partially paid**: εμφανίζει allocation breakdown και outstanding banner.
- **Invoice overdue**: prominent overdue banner + CTA προς collection actions.
- **Payment registered without full allocation**: warning banner στο payment section.
- **Cancelled/Credited invoice**: read-only state + banner “Δεν είναι εισπρακτέο” (χωρίς λογιστική ερμηνεία).

##### m. Notes for Frontend Implementation
- Το fiscal/transmission block πρέπει να είναι “operational”: δείχνει τι εκκρεμεί, όχι τεχνικές λεπτομέρειες integration.
- Timeline entries πρέπει να εμφανίζουν actor και source module.

---

#### 6.5 Collections / Receivables View

##### a. Screen Purpose
Να οργανώνει την εργασία είσπραξης με βάση aging/overdue, ownership και follow-up cadence, χωρίς να συγχέεται με “Invoices List”.

##### b. Primary User Types
Collections owners, finance operator, account managers.

##### c. Layout Structure
- Header: “Collections” + totals (outstanding, overdue).
- Filter bar: overdue bucket, client, amount, owner, expected payment date range.
- Main table: invoices/receivables oriented στη συλλογή.
- Right side panel: collection-focused detail.
- “Today focus” subpanel: follow-ups due today.

##### d. Sections / Components
- **Aging-driven list/table** με buckets
- **Overdue prioritization**: pinned “60+ days” και “largest outstanding”
- **Follow-up fields**: expected payment date, next action, owner
- **Collection notes preview**: τελευταίο note snippet + date

##### e. Required Visible Data
Για κάθε item:
- invoice reference + client
- outstanding amount
- due date + days overdue/aging bucket
- expected payment date (αν υπάρχει)
- owner / follow-up owner
- last note date + snippet
- “next action” label (π.χ. “Call”, “Email”, “Meeting requested”) ως operational tag

##### f. Filters
- overdue bucket
- client
- outstanding amount range
- owner
- expected payment date: none / this week / overdue expected date
- “has notes” / “no notes”

##### g. Sorting / Grouping
Default: overdue desc, then outstanding desc.
Group (optional): by owner, by client, by aging bucket.

##### h. Row / Card Actions
- Add note
- Assign / change owner (if permitted)
- Set expected payment date (if permitted)
- Open invoice detail

##### i. Bulk Actions
- Bulk assign owner
- Bulk add follow-up tag (π.χ. “Chase this week”) αν υποστηρίζεται ως UI feature
- Bulk export

##### j. Detail View / Side Panel Requirements
Collection side panel:
- invoice header + overdue banner
- client contact hints (αν υπάρχουν διαθέσιμα από άλλα modules) ως link-only
- notes timeline (last 5)
- expected payment date + owner controls
- CTA: open full invoice detail

##### k. Statuses Shown on This Screen
Collection status signals:
- Not due
- Due soon
- Overdue
- Overdue high risk (60+)
και payment status (e.g. Partially Paid) χωρίς να αντικαθιστά την collection signal.

##### l. Empty / Error / Exception States
- “No receivables in selection”
- “All receivables not due” (αν user φιλτράρει only overdue)

##### m. Notes for Frontend Implementation
- Το UI πρέπει να προωθεί “worklist behavior”: keyboard-friendly navigation, quick add note, minimal clicks.

---

#### 6.6 Purchase Requests List

##### a. Screen Purpose
Να συγκεντρώνει αιτήματα αγορών και να επιτρέπει triage/έγκριση/παρακολούθηση μέχρι να γίνουν commitments και να συνδεθούν με supplier bills.

##### b. Primary User Types
Requesters, approvers, finance operator, department heads.

##### c. Layout Structure
- Header: “Purchase Requests” + counters per status.
- Filter bar: requester, department, supplier, category, status, urgency, submitted date.
- Main table: requests.
- Side panel: request snapshot + approval CTA (αν επιτρέπεται).

##### d. Sections / Components
- Status summary (chips) row: Draft/Submitted/Approved/Rejected/Cancelled (τελικό mapping στο section 8).
- Table με attachment indicator και mismatch/budget signals.

##### e. Required Visible Data
Στήλες (must include):
- requester
- department
- supplier
- category
- estimated amount
- submitted date
- approver
- status
- urgency
- attachment indicator
Επιπλέον:
- budget context signal (e.g. “Over budget”)
- link indicator προς supplier bill (αν υπάρχει)

##### f. Filters
- status (multi)
- requester
- department
- supplier
- category
- urgency (Normal/High/Critical)
- submitted date range
- “has attachment” yes/no
- “linked supplier bill exists” yes/no

##### g. Sorting / Grouping
Sort: submitted date desc (default), urgency, estimated amount, status.
Group (optional): by department, by approver.

##### h. Row / Card Actions
- Open detail
- Quick approve/reject (μόνο αν policy επιτρέπει από list)
- Request changes / add comment (UI action; backend decision)

##### i. Bulk Actions
- Bulk export
- Bulk reassign approver (αν επιτρέπεται)

##### j. Detail View / Side Panel Requirements
Side panel:
- request summary (amount, category, supplier, urgency)
- approval status + approver
- attachments preview
- CTA “Open full detail”

##### k. Statuses Shown on This Screen
Purchase request statuses (section 8) + budget signal badge (section 8).

##### l. Empty / Error / Exception States
- No requests
- Filter yields none
- Attachment missing warning badge visible when required by policy

##### m. Notes for Frontend Implementation
- Urgency πρέπει να έχει strong visual (icon + chip) και να επηρεάζει default sort όταν status=Submitted.

---

#### 6.7 Purchase Request Detail / Approval View

##### a. Screen Purpose
Να επιτρέπει τεκμηριωμένη έγκριση/απόρριψη με πλήρες context: budget, supplier, justification, attachments, και να συνδέει το request με το resulting supplier bill.

##### b. Primary User Types
Approvers, finance operator, requester.

##### c. Layout Structure
- Header: request reference + status + urgency.
- Left/main: request details + justification + attachments.
- Right rail: budget context + approval decision area (sticky).
- Bottom: comments thread + activity timeline.

##### d. Sections / Components
- **Request summary**: requester, department, supplier, category, estimated amount, desired date.
- **Budget context**: διαθέσιμο budget/remaining, committed, impact indicator.
- **Supplier info**: supplier identity + link to supplier bills list filtered.
- **Description & justification**: structured fields.
- **Approval decision area**: Approve / Reject / Request changes + reason.
- **Approval comments area**: mandatory comment on reject/escalation.
- **Mismatch / escalation indicators**: over budget, missing attachment, unclear supplier.
- **Links to resulting supplier bill**: εμφανίζεται όταν υπάρχει.

##### e. Required Visible Data
- πλήρης περιγραφή αιτήματος
- συνημμένα (λίστα + preview where possible)
- budget availability context (ορατό, χωρίς να ορίζει υπολογισμό)
- ιστορικό εγκρίσεων/αποφάσεων (actor, time)
- link προς supplier bill (αν δημιουργηθεί)

##### f. Filters
Δεν είναι list screen. Στα comments/timeline: filter by “system events” vs “human comments”.

##### g. Sorting / Grouping
Timeline chronological.

##### h. Row / Card Actions
- Approve / Reject / Request changes
- Add comment
- Download attachment
- Create linked supplier bill (ARCHITECT DECISION αν γίνεται από UI)

##### i. Bulk Actions
N/A

##### j. Detail View / Side Panel Requirements
N/A (full page).

##### k. Statuses Shown on This Screen
Purchase request status + budget signal + “approval pending” state.

##### l. Empty / Error / Exception States
- Approved request exceeds available budget: blocking banner + requires escalation path
- Missing attachment: warning or blocking based on policy
- Rejected request: read-only with reason prominently visible

##### m. Notes for Frontend Implementation
- Approval actions πρέπει να απαιτούν confirmation modal με summary (amount, supplier, budget impact) για αποφυγή λάθους.

---

#### 6.8 Supplier Bills / Expenses List

##### a. Screen Purpose
Λίστα supplier bills/expenses ως open payables με due dates, match-to-request κατάσταση, readiness, και payment status, με ισχυρή προβολή εξαιρέσεων.

##### b. Primary User Types
Finance operator, procurement/ops, management.

##### c. Layout Structure
- Header: “Supplier Bills / Expenses” + totals (open payables, overdue payables).
- Filter bar: supplier, due, status, match status, linked request, category, payment readiness.
- Main table + side panel.
- Exception strip: quick filters “Blocked”, “Missing attachment”, “Mismatch amount”.

##### d. Sections / Components
Table must include:
- supplier
- bill reference
- invoice date
- due date
- amount
- category
- linked request
- match status
- payment readiness
- payment status

##### e. Required Visible Data
- open payable amount (typically equals amount unless partial payments supported)
- due date + days to due / days overdue
- match indicators (matched/mismatch/no request)
- readiness reasons (blocked reason)
- attachment indicator

##### f. Filters
- supplier
- category
- due date range
- invoice date range
- payment status (open/paid/partial/overdue)
- payment readiness (ready/blocked)
- match status (matched/mismatch/unlinked)
- linked request (yes/no)
- “missing attachment” yes/no

##### g. Sorting / Grouping
Default: due date asc, then blocked first (optional toggle).
Group: by supplier, by readiness, by due bucket.

##### h. Row / Card Actions
- Open detail
- View linked purchase request
- Add internal note
- “Send to payments queue” (αν readiness=ready, policy permitting)

##### i. Bulk Actions
- Bulk export
- Bulk assign payment batch tag
- Bulk move to payments queue (μόνο για ready items; backend decision)

##### j. Detail View / Side Panel Requirements
Side panel:
- bill header + status chips
- amount + due
- match status + reason
- linked request summary
- readiness reason + CTA “Resolve”
- CTA “Open full detail”

##### k. Statuses Shown on This Screen
Supplier bill status, match status, payment readiness, payment status (section 8).

##### l. Empty / Error / Exception States
- No bills in period
- Blocked items only view: shows count + resolution guidance

##### m. Notes for Frontend Implementation
- Exception visibility is core: blocked/mismatch must be immediately scannable via badges and filter shortcuts.

---

#### 6.9 Supplier Bill Detail View

##### a. Screen Purpose
Να προσφέρει πλήρη εικόνα μιας supplier obligation: σύνδεση με request, έλεγχο mismatch, readiness, payment execution/handoff, attachments, audit.

##### b. Primary User Types
Finance operator, approvers (for escalations), ops.

##### c. Layout Structure
- Header summary: supplier, bill ref, amount, due, status, readiness.
- Main sections: linked request, discrepancy/match, payment readiness/history, attachments, audit timeline.
- Right rail: quick actions (resolve mismatch, move to payments).

##### d. Sections / Components
- **Bill header summary**
- **Linked purchase request** (if exists)
- **Discrepancy / match section**
  - approved amount vs billed amount (visible)
  - category/department mismatch indicators
  - escalation CTA
- **Payment readiness / payment history**
- **Attachments section**
- **Audit / timeline section**

##### e. Required Visible Data
- supplier identity
- billed amount + due
- linked request details (requester, approved amount, approver)
- discrepancy details (what differs)
- readiness reason if blocked
- payment history entries (date, amount, reference)
- attachments list with preview/download
- timeline of changes

##### f. Filters
Embedded history filters: show only system events / only payments / only comments.

##### g. Sorting / Grouping
History by date desc.

##### h. Row / Card Actions
- Add note
- Attach document
- Mark as ready / request resolution (policy dependent)
- Open linked request
- “Send to payments queue” when ready

##### i. Bulk Actions
N/A

##### j. Detail View / Side Panel Requirements
N/A (full detail).

##### k. Statuses Shown on This Screen
Bill status + readiness + match + payment statuses.

##### l. Empty / Error / Exception States
- Missing attachment: warning or blocking
- Mismatch amount: blocking banner + escalation route
- Open payable missing due date: critical warning + requires due date action (section 9)

##### m. Notes for Frontend Implementation
- Το mismatch panel πρέπει να είναι “actionable”: να δείχνει ακριβώς τι λείπει/διαφέρει και ποιο action το ξεμπλοκάρει.

---

#### 6.10 Payments Queue

##### a. Screen Purpose
Να συγκεντρώνει πληρωτέα items για εκτέλεση πληρωμών, διαχωρίζοντας “ready” από “blocked”, και να επιτρέπει batch επιλογή/hand-off.

##### b. Primary User Types
Finance operator, treasury/ops (όπου υπάρχει).

##### c. Layout Structure
- Header: “Payments Queue” + totals due soon/overdue.
- Tabs ή segments:
  - Ready for payment
  - Blocked / mismatch
  - Due soon
  - Overdue payables
- Table per segment + right detail panel.
- Sticky batch bar with primary action (“Execute” ή “Handoff”).

##### d. Sections / Components
- **Ready-for-payment items**: supplier bills που πληρούν readiness criteria.
- **Blocked / mismatch items**: με reason.
- **Due soon**: items με due in X days.
- **Overdue**: items past due.
- **Batch selection**: multi-select with totals sum.
Επιπλέον UI διάκριση execution semantics (χωρίς banking integration):
- **Selected / Prepared**: items που έχει επιλέξει ο χρήστης για batch, αλλά δεν έχει γίνει “schedule/execute”.
- **Scheduled**: items που έχουν “δεσμευθεί” σε batch/ημερομηνία πληρωμής (UI state), αλλά δεν είναι ακόμη “paid”.
- **Executed**: items που έχουν καταχωρηθεί ως “πληρωμένα” (cash-out registered) (πώς γίνεται η καταχώρηση είναι OPEN QUESTION / ARCHITECT DECISION).
- **Confirmed / Reconciled**: *δεν είναι απαιτούμενο στο v1* εκτός αν ήδη υπάρχει διαθέσιμη έννοια επιβεβαίωσης. Αν δεν υλοποιηθεί, η UI δεν πρέπει να υπονοεί “τραπεζική επιβεβαίωση”· παραμένει στο “Executed” ως τελικό operational state.

##### e. Required Visible Data
Columns (suggested):
- supplier
- bill reference
- due date
- amount
- readiness status + reason (if blocked)
- linked request reference (if exists)
- category/department/project tags
- payment status
- “next step” label (e.g. “Add attachment”, “Resolve mismatch”)

##### f. Filters
- segment (ready/blocked/due soon/overdue)
- supplier
- due date range
- amount range
- category/department/project
- linked request exists yes/no
- blocked reason type (missing attachment/mismatch/no due date)

##### g. Sorting / Grouping
Ready: sort by due date asc, then amount desc.
Blocked: sort by severity (missing critical) then due date.
Group: by supplier (useful for batch payments).

##### h. Row / Card Actions
- Open bill detail
- Resolve blocking issue (jump)
- Add to batch selection

##### i. Bulk Actions
Batch actions (UI-level, backend decided):
- Create payment batch (handoff)
- Mark as “scheduled for payment” (καθαρό UI state: scheduled ≠ executed)
- Export batch list

##### j. Detail View / Side Panel Requirements
Side panel:
- bill summary + readiness reason
- attachments quick view
- linked request quick view
- CTA: open full detail

##### k. Statuses Shown on This Screen
Payment readiness, payment execution status, due/overdue signals.
Ελάχιστο v1 execution status vocabulary (UI):
- **Prepared (Selected)**: μόνο UI selection state (δεν είναι persisted status εκτός αν αποφασιστεί).
- **Scheduled**: σε batch/ημερομηνία πληρωμής.
- **Executed (Paid)**: cash-out καταχωρημένο.
Οτιδήποτε πέρα από τα παραπάνω (π.χ. “Confirmed/Reconciled”) είναι Later Polish και απαιτεί ρητή απόφαση.

##### l. Empty / Error / Exception States
- No ready items: empty state + link “View blocked items” + common reasons counts.
- No data in filter range.

##### m. Notes for Frontend Implementation
- The queue must feel operational: quick triage, minimal navigation, obvious “why blocked”.

---

#### 6.11 Budget Overview

##### a. Screen Purpose
Να δίνει ορατότητα budgeted vs committed vs actual paid και variance, με breakdowns και versioning, χωρίς να μετατρέπεται σε forecasting/GL.

##### b. Primary User Types
Management, finance operator, department heads.

##### c. Layout Structure
- Header: “Budget” + version selector + period selector.
- Summary row: budget utilization KPIs.
- Breakdown table: category/department/project rows.
- Right panel: row drilldown details + linked commitments/actuals lists.

##### d. Sections / Components
- **Version selector** (v1, v1.1, etc.) (policy decision αν editable)
- **Period selector** (month/quarter/YTD/custom)
- **Breakdown table**:
  - budgeted
  - committed
  - actual paid
  - open payable (αν αποφασιστεί ορατό)
  - variance
  - remaining available
- **Variance indicators**: color coding and breach signals.

##### e. Required Visible Data
Για κάθε γραμμή breakdown:
- dimension label (category/department/project)
- budgeted amount
- committed amount
- actual paid amount
- remaining available amount
- variance indicator (absolute + % where useful)
Στο drilldown:
- list of commitments (linked purchase requests/approved commitments)
- list of actual paid items (linked payments/supplier bills)

##### f. Filters
- version
- period
- dimension type (category/department/project)
- department/project/category selection
- show only “breach/warning”

##### g. Sorting / Grouping
Sort by variance severity, by remaining, by budgeted size.
Group by department > category (optional).

##### h. Row / Card Actions
- click row → opens drilldown panel
- export view

##### i. Bulk Actions
- export selected rows

##### j. Detail View / Side Panel Requirements
Budget drilldown panel:
- summary numbers
- top drivers list (largest commitments/actuals)
- CTA to Purchase Requests list filtered
- CTA to Supplier Bills list filtered

##### k. Statuses Shown on This Screen
Budget signal states: Healthy/Warning/Breach (section 8).

##### l. Empty / Error / Exception States
- No budget version configured: empty state + “Add version” (ARCHITECT/PRODUCT decision)
- No data for period: show baseline explanation.

##### m. Notes for Frontend Implementation
- The UI must keep budgeted/committed/actual visually separated (distinct columns + legend).

---

#### 6.12 Employee Cost View

##### a. Screen Purpose
Να προσφέρει ορατότητα κόστους προσωπικού για operational έλεγχο και margin insight, με role-based περιορισμούς, χωρίς να ορίζει payroll/accounting.

##### b. Primary User Types
Management, finance operator, team leads (περιορισμένα), HR/ops (αν υπάρχει).

##### c. Layout Structure
- Header: “Employee Costs” + period selector + grouping selector.
- Summary KPIs: total labor cost, billable vs non-billable.
- Main table: employees ή teams.
- Drilldown panel: allocations, projects, trend.

##### d. Sections / Components
- **Grouping**: by employee / by team / by department.
- **Cost split**: billable vs non-billable.
- **Allocation insight**: project allocation (where available).
- **Margin-relevant summary**: where allowed, shows cost vs billable output signal (χωρίς να “υπολογίζει” λογιστικά).

##### e. Required Visible Data
- employee/team name (ή anonymized όπου απαιτείται)
- cost rate visibility where appropriate (role-based)
- total labor cost over selected period
- billable vs non-billable cost split
- project allocation insight
- margin-relevant visibility (π.χ. “High non-billable share”)

##### f. Filters
- period
- team/department
- billable/non-billable focus
- project
- visibility mode (if role-based): “Aggregate only” vs “Employee level”

##### g. Sorting / Grouping
Sort by total cost desc, billable ratio, team.
Group by team.

##### h. Row / Card Actions
- Open drilldown
- Export (if permitted)

##### i. Bulk Actions
- Export view

##### j. Detail View / Side Panel Requirements
Drilldown:
- trend over time (period)
- allocation by project
- notes/flags (if any)

##### k. Statuses Shown on This Screen
Signals (not accounting statuses):
- “Missing allocation data”
- “High non-billable share”
- “Visibility restricted” banner for limited roles

##### l. Empty / Error / Exception States
- No employee cost data in period
- Restricted view: shows only aggregates with explanation

##### m. Notes for Frontend Implementation
- Role-based redaction must be consistent: hide exact rates but keep aggregates where allowed.

---

#### 6.13 Audit Trail / Activity Log

##### a. Screen Purpose
Να προσφέρει auditability και traceability: ποιος έκανε τι, πότε, σε ποιο record, και τι άλλαξε (όπου διαθέσιμο).

##### b. Primary User Types
Finance operator, management, auditors/internal ops.

##### c. Layout Structure
- Header: “Audit Trail”.
- Filters row: module, actor, date range, record type, action type.
- Main chronological list with expandable entries.
- Right panel: selected event details.

##### d. Sections / Components
- **Chronological log** entries
- **Event detail drawer** with before/after emphasis where relevant
- **Source module tags** (Invoices/Collections/Requests/Bills/Payments/Budget/Employee Costs)

##### e. Required Visible Data
Για κάθε event:
- timestamp
- actor
- action (approve/reject/edit/status change/attachment added/payment registered)
- target record (type + reference)
- source module
- important before/after emphasis where relevant

##### f. Filters
- module
- actor
- date range
- record type
- action type
- target reference search

##### g. Sorting / Grouping
Default: newest first.
Optional grouping: by target record (thread view).

##### h. Row / Card Actions
- Open target record
- Copy event details
- Export filtered events (if allowed)

##### i. Bulk Actions
- Export current filtered log

##### j. Detail View / Side Panel Requirements
Event detail:
- full before/after (for amount/status/due date)
- related events (previous/next)
- link to record

##### k. Statuses Shown on This Screen
Δεν εμφανίζει domain statuses ως primary, αλλά “status change” events περιλαμβάνουν from→to chips.

##### l. Empty / Error / Exception States
- No events for range
- Permissions restricted (if some modules hidden)

##### m. Notes for Frontend Implementation
- Ensure events are consistent across modules (same actor display, same timestamp format, same target linking).

---

### 7. Cross-Screen Actions and Navigation Logic
Η πλοήγηση πρέπει να είναι predictable και action-driven:

- Από **Dashboard KPI widgets**:
  - “Outstanding Receivables” → ανοίγει `Collections / Receivables` με φίλτρο outstanding>0 και date range.
  - “Overdue Receivables” → `Collections` με overdue bucket preselected.
  - “Outstanding Payables” → `Supplier Bills / Expenses List` με open payables.
  - “Overdue Payables” → `Payments Queue` στο segment Overdue.
  - “Committed Spend” → `Budget Overview` με focus σε committed dimension breakdown και drilldown link σε Purchase Requests.
  - “Expenses Paid” → `Supplier Bills` ή `Payments` (ARCHITECT DECISION ποια είναι canonical για paid view).
- Από **Invoice Drafts List**:
  - click row → side panel preview
  - click draft reference / CTA “Open in Draft Builder” → `Invoice Draft Builder` (resume/edit)
  - discard/cancel draft (με confirmation) → επιστρέφει στη λίστα και “απελευθερώνει” reserved lines (UI intent· backend execution ARCHITECT DECISION)
- Από **Invoices List**:
  - click row → side panel
  - click invoice reference → `Invoice Detail View`
  - click client → `Collections` filtered by client (optional shortcut)
- Από **Invoice Detail View**:
  - “Go to Collections” → `Collections` filtered to invoice/client
  - click linked work line → opens source entry mini panel (read-only)
- Από **Collections**:
  - click invoice → `Invoice Detail`
  - click client → filtered view of same screen
- Από **Purchase Requests List**:
  - click row → side panel
  - click request reference → `Purchase Request Detail / Approval`
- Από **Purchase Request Detail**:
  - link to supplier bill → `Supplier Bill Detail`
  - CTA “View related bills” → `Supplier Bills` filtered by supplier/request
- Από **Supplier Bills List**:
  - click row → side panel
  - click bill reference → `Supplier Bill Detail`
  - click linked request → `Purchase Request Detail`
- Από **Supplier Bill Detail**:
  - CTA “Payments Queue” → opens queue filtered to this supplier bill
- Από **Budget Overview**:
  - click row → drilldown panel
  - “View commitments” → `Purchase Requests` filtered
  - “View actual paid” → `Payments Queue` / `Supplier Bills` filtered (architect decision)
- Από **Audit Trail**:
  - click target record → ανοίγει αντίστοιχο detail view

---

### 8. Status System Definition
Ο παρακάτω πίνακας είναι reference για frontend/UI. Δεν ορίζει backend states, αλλά ορίζει **τι πρέπει να εμφανίζεται** και **πώς επηρεάζει UI actions**.

#### 8.1 Invoice-related statuses
- **Draft**: Πρόχειρο/μη εκδοθέν. Εμφανίζεται σε Draft Builder και (αν υπάρχει) draft list. UI: neutral chip. Actions: edit, discard, review.
- **Issued**: Εκδοθέν receivable. UI: primary chip. Actions: view detail, add collection note.
- **Partially Paid**: Έχει καταγραφεί πληρωμή < total. UI: warning chip + show paid/outstanding. Actions: view payments, add note.
- **Paid**: outstanding=0. UI: success chip. Actions: view history (read-only).
- **Overdue**: due date passed και outstanding>0. UI: danger chip + days overdue. Actions: prioritize follow-up.
- **Cancelled / Credited**: δεν θεωρείται ενεργό receivable. UI: muted chip + banner. Actions: read-only, view audit.

#### 8.2 Collection-related statuses (signals)
- **Not Due**: due in future. UI: neutral.
- **Due Soon**: due within configured window (e.g. 7 days). UI: warning.
- **Overdue**: due passed. UI: danger, pinned in lists.
- **High Risk Overdue (60+)**: overdue beyond threshold. UI: danger+emphasis; escalations suggested.

#### 8.3 Purchase request statuses
- **Draft**: μη υποβληθέν. UI: neutral. Actions: edit/submit.
- **Submitted**: αναμένει έγκριση. UI: primary. Actions (approver): approve/reject/request changes.
- **Approved (Committed)**: δημιουργεί/αντιστοιχεί commitment. UI: success + budget impact visible. Actions: link/create supplier bill.
- **Rejected**: UI: danger + reason visible. Actions: read-only, resubmit (optional).
- **Cancelled**: UI: muted. Actions: read-only.

#### 8.4 Supplier bill statuses
- **Received / Open**: καταγεγραμμένη υποχρέωση. UI: primary.
- **Matched**: ταιριάζει με approved request. UI: success.
- **Mismatch**: αποκλίσεις σε ποσό/κατηγορία/supplier. UI: danger + blocked for payment by default.
- **Unlinked**: δεν υπάρχει request. UI: warning (όχι απαραίτητα blocked, policy decision).
- **Overdue Payable**: due passed και unpaid. UI: danger.
- **Paid**: UI: success.

#### 8.5 Payment statuses (payables execution)
- **Ready for Payment**: πληροί readiness criteria. UI: success/ready badge.
- **Blocked**: δεν μπορεί να πληρωθεί λόγω missing info/mismatch/no due date. UI: danger + reason.
- **Scheduled**: έχει μπει σε batch/προγραμματισμό. UI: primary.
- **Executed / Paid**: ολοκληρώθηκε cash-out. UI: success.

#### 8.6 Budget signal states
- **Healthy**: committed+actual εντός budget. UI: success.
- **Warning**: πλησιάζει όριο (threshold). UI: warning + “approaching”.
- **Breach**: committed ή actual υπερβαίνει budget. UI: danger + escalation guidance.

---

### 9. Exception and Edge Case Handling
Το v1 πρέπει να είναι “operationally safe”: κάθε edge case να επισημαίνεται καθαρά και να οδηγεί σε επόμενη ενέργεια.

- **No billable entries available** (Draft Builder):
  - UI: empty state στο source pane με αιτιολογία (period/client filters) και CTA “Change period” / “Clear filters”.
  - Προτείνεται link σε Invoices List για έλεγχο αν η περίοδος έχει ήδη τιμολογηθεί.

- **All billable entries already invoiced**:
  - UI: informational banner “Όλες οι εγγραφές έχουν ήδη τιμολογηθεί” + link σε Invoices filtered.
  - Source entries εμφανίζονται προαιρετικά read-only με status “Already invoiced” (χωρίς “Add”).

- **Invoice partially paid**:
  - UI: στο Invoice Detail εμφανίζει breakdown πληρωμών και outstanding banner.
  - Στις λίστες: “Partially paid” chip + columns paid/outstanding.

- **Invoice overdue**:
  - UI: overdue banner (detail) και έντονη επισήμανση row (list).
  - Στο Collections: pinned priority και default sort.

- **Supplier bill amount does not match approved request**:
  - UI: mismatch banner (detail) + blocked badge (list/queue).
  - Discrepancy panel δείχνει: Approved vs Billed amounts, και απαιτούμενη ενέργεια (“Escalate” / “Request correction”).

- **Missing supplier attachment**:
  - UI: warning ή blocking ανά policy. Στο Payments Queue: blocked reason “Missing attachment”.
  - CTA: “Add attachment” οδηγεί στο Bill Detail στην attachments ενότητα.

- **Approved request exceeds available budget**:
  - UI: στο Approval view blocking banner “Υπέρβαση διαθέσιμου budget” + escalation path (π.χ. “Request budget override”).
  - Δεν πρέπει να “εγκρίνεται σιωπηρά” χωρίς ορατότητα.

- **Payment registered without full allocation** (Invoice Detail):
  - UI: warning banner + “unallocated amount” display + request to allocate (architect decision).

- **Stale draft invoice**:
  - UI: banner “Draft παλιότερο από Χ ημέρες” + CTA “Review before issuing”.

- **Cancelled or credited invoice**:
  - UI: read-only state, muted styling, εμφανές reason και audit trail. Δεν εμφανίζεται στα collections worklists (εκτός αν ζητηθεί).

- **Rejected purchase request**:
  - UI: εμφανές reason, read-only, CTA “Create new request” (όχι silent edit).

- **Open payable with missing due date**:
  - UI: critical badge σε lists/queue, και blocking reason στο Payments Queue.
  - Bill Detail: banner + CTA “Add due date” (backend decision).

- **No data in selected filter range**:
  - UI: empty state με “Reset date range” και υπενθύμιση των ενεργών φίλτρων.

---

### 10. Dashboard Metric Definitions
Αυτό το τμήμα αποσαφηνίζει τα widgets ώστε να μην συγχέονται οι έννοιες “invoiced/collected/committed/paid”.

- **Gross Invoiced**: Το σύνολο των **issued invoices** (εκδοθέντα receivables) εντός της επιλεγμένης περιόδου (με βάση **issue date**). Δεν ισούται με εισπραχθέν.
- **Income Collected**: Το σύνολο των **cash-in** (καταγεγραμμένες εισπράξεις) εντός της περιόδου (με βάση **payment date**). Μπορεί να αφορά invoices προηγούμενων περιόδων.
- **Expenses Paid**: Το σύνολο των **cash-out** (καταγεγραμμένες πληρωμές προμηθευτών/δαπανών) εντός της περιόδου (με βάση **payment date**).
- **Net Cash Movement**: \(Income\ Collected - Expenses\ Paid\) εντός της περιόδου (cash basis). Δεν είναι “profit”.
- **Outstanding Receivables**: Το τρέχον σύνολο **outstanding amount** για issued invoices (as-of “now” ή as-of end of period, ARCHITECT DECISION).
- **Outstanding Payables**: Το τρέχον σύνολο **open payables** για supplier bills (όχι paid).
- **Committed Spend**: Το σύνολο των **approved commitments** (π.χ. approved purchase requests) εντός της περιόδου/έκδοσης (ορισμός περιόδου: approval date, ARCHITECT DECISION).
- **Budget Utilization**: Αναλογία/ποσοστό χρήσης budget: \((Committed + Actual Paid) / Budgeted\) για την επιλεγμένη περίοδο και dimension.
- **Overdue Receivables**: Outstanding receivables όπου due date < σήμερα, με sum outstanding και count.
- **Overdue Payables**: Open payables όπου due date < σήμερα, με sum amount και count.

---

### 10A. Canonical Source-of-Truth Matrix for Metrics
Ο παρακάτω πίνακας ορίζει, για UI σκοπούς, την **canonical πηγή** και τα **date semantics** κάθε KPI/widget. Δεν ορίζει object model ή persistence — αλλά καθορίζει τι πρέπει να “μετράει” η UI ώστε να αποφεύγεται ασάφεια.

| Metric / Widget | Business meaning (UI) | Primary source module/screen | Primary record type (UI concept) | Primary date semantics | Period-based ή point-in-time | Key exclusions / notes | Architect decision dependency |
|---|---|---|---|---|---|---|---|
| Gross Invoiced | Σύνολο εκδοθέντων invoices/receivables μέσα στην περίοδο | Invoices List / Invoice Detail | Issued invoice (receivable) | Issue date | Period-based | Δεν περιλαμβάνει drafts· δεν ισούται με collected | Αν υπάρχουν “credited/cancelled” rules για inclusion/exclusion |
| Income Collected | Σύνολο καταγεγραμμένων εισπράξεων (cash-in) | Invoice Detail (Payments) + Dashboard | Payment collection entry | Payment date | Period-based | Μπορεί να αφορά invoices άλλης περιόδου | OPEN QUESTION: mode καταχώρησης πληρωμών (manual/imported/hybrid) |
| Expenses Paid | Σύνολο καταγεγραμμένων πληρωμών (cash-out) | Payments Queue + Supplier Bill Detail | Payment execution entry | Payment date | Period-based | Δεν ισούται με “bills received”· αφορά μόνο executed/paid | OPEN QUESTION: canonical “paid” source (Payments vs Bills flagged paid) |
| Net Cash Movement | Collected - Paid εντός περιόδου (cash basis) | Dashboard | Derived metric | Payment date (both inflow/outflow) | Period-based | Δεν είναι κερδοφορία | Εξαρτάται από ορισμό Collected/Paid παραπάνω |
| Outstanding Receivables | Τρέχον outstanding ποσό σε issued invoices | Collections / Invoices List | Issued invoice (receivable) | As-of date (today ή end-of-period) | Point-in-time | Excludes cancelled/credited; includes overdue+not due | OPEN QUESTION: as-of semantics για dashboard period |
| Outstanding Payables | Τρέχον open payable ποσό σε supplier bills | Supplier Bills List / Payments Queue | Supplier bill (payable) | As-of date (today ή end-of-period) | Point-in-time | Excludes paid; mismatch/blocked still count as open | OPEN QUESTION: partial payments on payables (supported?) |
| Committed Spend | Σύνολο εγκεκριμένων commitments (π.χ. approved requests) | Purchase Request Detail/List + Budget | Approved commitment | Approval date (default) | Period-based | Δεν διπλομετράται με supplier bills εκτός αν οριστεί κανόνας | OPEN QUESTION: commitment definition & anti-double-count logic |
| Budget Utilization | (Committed + Actual Paid) / Budgeted | Budget Overview + Dashboard | Budget line summary | Period of budget (month/quarter/YTD) | Period-based | Πρέπει να δείχνει components ξεχωριστά | OPEN QUESTION: budget versioning, editability, open payable inclusion |
| Overdue Receivables | Outstanding όπου due < today | Collections | Issued invoice (receivable) | Due date compared to today | Point-in-time | Χρησιμοποιεί outstanding, όχι total invoice | None (αν οριστεί overdue threshold=due date) |
| Overdue Payables | Open payables όπου due < today | Payments Queue / Supplier Bills | Supplier bill (payable) | Due date compared to today | Point-in-time | Χρησιμοποιεί open payable amount | None (αν οριστεί overdue threshold=due date) |

UI implication όταν υπάρχει ARCHITECT DECISION: μέχρι να αποφασιστεί, η UI πρέπει να εμφανίζει info tooltip “Definition pending” και να κρατά τους υπολογισμούς συνεπείς με το πιο ασφαλές operational νόημα (cash-in/out από payment registrations, open amounts από unpaid records).

---

### 11. Implementation Phasing
Η υλοποίηση προτείνεται να γίνει σε φάσεις ώστε να παραδοθεί λειτουργική αξία γρήγορα χωρίς να μπλεχτούν domains.

#### Phase 1: Revenue and Collections UI
- **Goals**: Ορατότητα issued receivables, aging, overdue, collection workflow, invoice detail, βασικό dashboard.
- **Included screens**: Finance Overview Dashboard (limited), Invoices List, **Invoice Drafts List**, Invoice Draft Builder, Invoice Detail View, Collections / Receivables.
- **Dependencies**: UI-level linking billable work → draft → invoice, βασικά status chips, audit blocks.
- **Done when**:
  - οι χρήστες μπορούν να δουν/φιλτράρουν invoices και να κάνουν collections triage,
  - να χτίζουν draft με duplicate prevention,
  - να βλέπουν partial payments/outstanding,
  - να κάνουν drilldown από dashboard σε λίστες.

#### Phase 2: Purchase Requests, Supplier Bills, Payments UI
- **Goals**: Ορατότητα payables και execution queue, approvals με budget context, mismatch/blocked handling.
- **Included screens**: Purchase Requests List, Purchase Request Detail/Approval, Supplier Bills/Expenses List, Supplier Bill Detail, Payments Queue.
- **Dependencies**: readiness/mismatch rules ως UI signals, linking request ↔ bill, exception surfaces.
- **Done when**:
  - purchase requests έχουν σαφείς statuses και approval UX,
  - supplier bills δείχνουν match/readiness,
  - payments queue λειτουργεί ως operational worklist με blocked reasons.

#### Phase 3: Budgeting and Employee Cost UI
- **Goals**: Budget visibility (budgeted/committed/actual) και employee cost insights με role controls.
- **Included screens**: Budget Overview, Employee Cost View, dashboard widgets επεκτείνονται.
- **Dependencies**: budget version/period selectors, dimension breakdown, employee cost visibility rules.
- **Done when**:
  - budget table δείχνει ξεκάθαρα committed vs actual vs remaining,
  - drilldowns οδηγούν σε commitments/actuals lists,
  - employee cost view λειτουργεί με περιορισμούς ορατότητας.

#### Phase 4: Auditability, polish, consolidated refinements
- **Goals**: Συνεκτικότητα, performance, saved views, cross-module audit trail, polish σε empty/error states.
- **Included screens**: Audit Trail/Activity Log + refinements σε όλες τις προηγούμενες.
- **Dependencies**: standardized event rendering, consistent linking.
- **Done when**:
  - το audit trail καλύπτει όλα τα modules με φίλτρα,
  - τα status chips/filters είναι συνεπή,
  - όλα τα exception states έχουν καθορισμένο UX.

---

### 11A. Action Matrix by Screen and Status
Ο παρακάτω πίνακας αποσαφηνίζει **τι ακριβώς μπορεί να κάνει ο χρήστης** ανά οθόνη/κατάσταση, με διάκριση: visible/hidden/disabled, reason, confirmation, navigation-only, και state transition intent. Δεν ορίζει backend transitions· ορίζει UI behavior και gating.

> Legend:  
> - **Visible**: εμφανίζεται ως action.  
> - **Hidden**: δεν εμφανίζεται (π.χ. permission).  
> - **Disabled**: εμφανίζεται αλλά δεν εκτελείται.  
> - **Confirm**: απαιτεί confirmation modal.  
> - **Nav**: navigation-only.  
> - **State**: προκαλεί UI state transition (operational), subject to ARCHITECT DECISION όπου απαιτείται.

**Invoices List**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Open side panel | Visible | — | No | Nav |
| Any | Open full Invoice Detail | Visible | — | No | Nav |
| Any | Copy invoice reference | Visible | — | No | Nav |
| Issued / Overdue / Partially Paid | Add collection note | Visible | — | No | State (note entry) |
| Paid | Add collection note | Disabled (optional) | Read-only policy για paid | No | State (if allowed) |
| Any | Bulk export CSV | Visible | — | No | Nav |
| Any | Bulk assign owner | Visible/Hidden | Hidden if no permission | No | State |
| Any | “Mark as paid” | Hidden/Disabled | ARCHITECT DECISION + permissions | Confirm | State |

**Invoice Draft Builder**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Draft (unsaved) | Save draft | Visible | — | No | State |
| Draft | Discard changes | Visible | — | Confirm (if changes) | State |
| Any source item = Available | Add to draft | Visible | — | No | State |
| Source item = Reserved in draft | Add to draft | Disabled | Reserved elsewhere | No | Nav (link to reserving draft) |
| Source item = Already invoiced | Add to draft | Disabled | Already invoiced | No | Nav (link to invoice if available) |
| Draft | Review | Visible | — | No | Nav (review modal/step) |
| Draft | Issue/Finalize (if present) | Hidden/Disabled | OPEN QUESTION / ARCHITECT DECISION | Confirm | State |

**Invoice Detail View**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Issued / Overdue / Partially Paid | Add collection note | Visible | — | No | State |
| Any | Open Collections view (pre-filtered) | Visible | — | No | Nav |
| Any | View fiscal/transmission details | Visible/Hidden | Hidden if not applicable | No | Nav |
| Issued / Partially Paid | Register payment | Hidden/Disabled | Payment registration mode unresolved | Confirm | State |
| Cancelled/Credited | Edit monetary fields | Disabled | Read-only | No | State (blocked) |

**Collections / Receivables View**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Add note (quick) | Visible | — | No | State |
| Any | Assign/change owner | Visible/Hidden | Hidden if no permission | No | State |
| Any | Set expected payment date | Visible/Hidden | Hidden if no permission | No | State |
| Any | Open Invoice Detail | Visible | — | No | Nav |
| Any | Bulk assign owner | Visible/Hidden | Hidden if no permission | No | State |

**Purchase Requests List**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Open side panel | Visible | — | No | Nav |
| Any | Open full Request Detail | Visible | — | No | Nav |
| Submitted | Quick approve/reject | Visible/Hidden | Hidden if not approver | Confirm | State |
| Approved/Rejected/Cancelled | Approve/reject | Disabled | Terminal state | No | State (blocked) |
| Any | Export | Visible | — | No | Nav |

**Purchase Request Detail / Approval View**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Submitted | Approve | Visible/Hidden | Hidden if no permission | Confirm | State |
| Submitted | Reject | Visible/Hidden | Hidden if no permission | Confirm (requires reason) | State |
| Submitted | Request changes | Visible/Hidden | Hidden if no permission | No | State |
| Any | Download attachment | Visible | — | No | Nav |
| Approved | Create/link supplier bill | Visible/Disabled | ARCHITECT DECISION / policy | Confirm | Nav/State |

**Supplier Bills / Expenses View**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Open side panel / detail | Visible | — | No | Nav |
| Matched + Ready | Send to Payments Queue | Visible/Hidden | Hidden if no permission | No | State |
| Blocked (missing attachment/mismatch/no due date) | Send to Payments Queue | Disabled | Not ready | No | Nav (resolve) |
| Any | Export | Visible | — | No | Nav |

**Payments Queue**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Ready | Add to batch selection | Visible | — | No | State (selection) |
| Blocked | Add to batch selection | Disabled | Blocked reason | No | Nav (resolve) |
| Prepared (selected) | Create batch / Handoff | Visible/Hidden | Hidden if no permission | Confirm | State |
| Scheduled | Mark executed/paid | Hidden/Disabled | Payment registration unresolved | Confirm | State |
| Any | Open Bill Detail | Visible | — | No | Nav |

**Budget Overview**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Change version/period | Visible | — | No | State |
| Any | Drilldown row | Visible | — | No | Nav |
| Any | Export | Visible | — | No | Nav |
| Any | Edit budget version | Hidden/Disabled | Budget editability unresolved | Confirm | State |

**Employee Cost View**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Change grouping/period | Visible | — | No | State |
| Restricted role | View exact rates | Hidden | Permission restriction | No | Nav |
| Any | Export | Visible/Hidden | Hidden if restricted | No | Nav |

**Audit Trail / Activity Log**
| Status context | Action | Visible/Hidden/Disabled | Disabled reason | Confirm | Nav/State |
|---|---|---|---|---|---|
| Any | Filter log | Visible | — | No | State |
| Any | Open target record | Visible/Hidden | Hidden if no permission on target | No | Nav |
| Any | Export filtered events | Visible/Hidden | Hidden if restricted | Confirm (optional) | Nav |

---

### 11B. Screen Priority Matrix (MVP / v1 Optional / Later Polish)
Ο παρακάτω πίνακας “κλειδώνει” προτεραιότητες ώστε να αποφεύγεται scope inflation. Όλες οι οθόνες παραμένουν στη λίστα του report, αλλά δεν είναι όλες MVP.

| Screen | Priority tier | Why | Minimum acceptable v1 implementation | Can be postponed without breaking system |
|---|---|---|---|---|
| Finance Overview Dashboard | v1 Optional | Χρήσιμο για management, αλλά οι ροές μπορούν να δουλέψουν από τις λίστες | KPI strip + drilldowns (χωρίς charts) | Trends charts, top lists, saved views |
| Invoices List | MVP Mandatory | Βασική ορατότητα receivables, overdue, drilldown | Table + core filters + overdue highlighting + side panel | Column customization, saved views |
| Invoice Drafts List | MVP Mandatory | Χωρίς draft management surface, τα drafts “χάνονται” και τα reservations γίνονται αόρατα | Table + stale indicator + resume/discard | Bulk actions, review-needed automation |
| Invoice Draft Builder | MVP Mandatory | Απαραίτητο για δημιουργία draft από billable work | 3-pane + select/add/remove + totals preview + duplicate prevention | Advanced edit of quantities/rates, templates |
| Invoice Detail View | MVP Mandatory | Απαραίτητη για receivable truth και πληρωμές/notes | Header + amounts + payments list (read-only αν χρειαστεί) + notes + fiscal status block | Rich timeline filters, advanced allocation UI |
| Collections / Receivables View | MVP Mandatory | Operational worklist για είσπραξη/overdue | Aging list + owner + notes + expected date | Bulk tagging, advanced prioritization heuristics |
| Purchase Requests List | v1 Optional | Μπορεί να παραδοθεί στη Phase 2 χωρίς να μπλοκάρει revenue | Table + status + attachments indicator | Saved views, bulk reassign |
| Purchase Request Detail / Approval View | v1 Optional | Απαιτείται όταν μπει procurement flow (Phase 2) | Summary + approval actions + budget context banner | Advanced escalation workflows |
| Supplier Bills / Expenses List | v1 Optional | Phase 2: απαραίτητο για payables, όχι για revenue MVP | Table + readiness/mismatch + due/overdue | Exception strip shortcuts |
| Supplier Bill Detail View | v1 Optional | Needed for resolving blocked payments (Phase 2) | Header + mismatch panel + attachments | Rich payment history UX |
| Payments Queue | v1 Optional | Phase 2: operational execution surface | Segments + ready/blocked + batch selection + scheduled vs executed clarity | Batch exports, advanced supplier grouping |
| Budget Overview | Later Polish | Ωφέλιμο αλλά δεν μπλοκάρει βασικές ροές invoices/requests αν scope περιοριστεί | Read-only breakdown + variance signals | Version editing, deep drilldowns |
| Employee Cost View | Later Polish | Εξαρτάται από permissions και availability δεδομένων | Aggregated view only + billable split (αν υπάρχει) | Employee-level rates, allocation deep dives |
| Audit Trail / Activity Log | Later Polish | Auditability σημαντικό, αλλά μπορεί να έρθει ως Phase 4 | Minimal event feed per detail view | Full cross-module log + exports |

---

### 12. Open Questions and Architect Decisions
Τα παρακάτω πρέπει να απαντηθούν/οριστούν από product owner/architect. Το report **δεν** τα “εφευρίσκει”.

1. **Missing source docs**: Πού βρίσκονται/ποιο είναι το canonical περιεχόμενο των `finance-system-blueprint-v1.md` και `finance-master-workflow.md`; απαιτείται validation και ενδεχόμενη προσαρμογή ορολογίας/κανόνων.
2. **Fiscal / external transmission flow (Greece)**:
   - Ποιες ακριβώς καταστάσεις θα εκτεθούν (π.χ. pending/sent/accepted/rejected) και ποια references πρέπει να εμφανίζονται;
   - Είναι manual update ή imported status;
3. **Payment registration**:
   - Είναι manual (UI entry) ή imported (bank/provider);
   - Επιτρέπεται partial payments και πώς γίνεται allocation;
4. **Canonical “paid” source**:
   - Το “Expenses Paid” προκύπτει από Payments module ή από Supplier Bills flagged as paid;
5. **Permissions model**:
   - Ποιος μπορεί να approve requests, να βλέπει employee rates, να εκτελεί payments, να βλέπει fiscal statuses;
6. **Budget versions editability**:
   - Τα budget versions είναι read-only στο v1 ή επιτρέπεται δημιουργία/επεξεργασία από UI;
7. **Commitment definition**:
   - Το “committed amount” μετριέται στο approval time, ή όταν δημιουργείται supplier bill, ή και τα δύο (με κανόνες αποφυγής διπλομέτρησης);
8. **Handling of unlinked supplier bills**:
   - Είναι επιτρεπτά (operational reality) και ποια policy απαιτείται για readiness;
9. **Date semantics per metric**:
   - Για κάθε KPI, ποια ημερομηνία είναι primary (issue date, due date, payment date, approval date);
10. **Saved views**:
   - Θα υποστηριχθούν στο v1; αν ναι, σε ποια screens (Invoices, Collections, Bills, Payments);

#### UI-Blocking Decisions Requiring Resolution Before Build
Τα παρακάτω δεν είναι απλώς “nice-to-know”· **μπλοκάρουν** συγκεκριμένες UI συμπεριφορές ή κάνουν την υλοποίηση υψηλού ρίσκου για αλλαγές αργότερα. Δεν αντικαθιστούν architect ownership — αλλά πρέπει να κλειδώσουν πριν ξεκινήσει build.

1. **Canonical “paid” source (Expenses Paid)**
   - **Why it blocks UI**: Το KPI “Expenses Paid” και τα “Paid” states στα payables πρέπει να δείχνουν ένα συνεπές “truth source”.
   - **Affected screens/components**: Finance Overview Dashboard (widgets/charts), Payments Queue (Executed/Paid), Supplier Bills List/Detail (Paid indicator).
   - **Safest fallback assumption**: Θεώρησε ως canonical την **Payments Queue / payment execution registrations** (cash-out entries) και εμφάνισε “Paid” μόνο όταν υπάρχει executed payment record. Τα supplier bills παραμένουν “Open” μέχρι να συνδεθούν με executed payment.

2. **Payment registration mode (manual / imported / hybrid)**
   - **Why it blocks UI**: Καθορίζει αν υπάρχει “Register payment” UI, ποια fields ζητούνται, και πώς ενημερώνονται statuses.
   - **Affected screens/components**: Invoice Detail (Payments section), Payments Queue (execute/mark paid), Dashboard (Collected/Paid).
   - **Safest fallback assumption**: Manual registration στο v1 ως “minimal form” (date, amount, reference) *χωρίς* να υπονοείται τραπεζική επιβεβαίωση, μέχρι να αποφασιστεί imported/hybrid.

3. **Partial payment allocation behavior**
   - **Why it blocks UI**: Χωρίς κανόνα allocation, δεν μπορεί να υλοποιηθεί σωστά “Partially Paid”, “Unallocated amount”, και outstanding updates.
   - **Affected screens/components**: Invoice Detail (allocation UI/warnings), Invoices List (paid/outstanding), Collections (prioritization), Dashboard (Outstanding/Collected).
   - **Safest fallback assumption**: Επιτρέπεται partial payment, αλλά αν allocation δεν έχει οριστεί, η UI δείχνει “Unallocated amount” warning και κρατά outstanding με απλό arithmetic (total - sum payments) μέχρι να υπάρξει architect decision για allocation granularity.

4. **Fiscal / transmission status vocabulary**
   - **Why it blocks UI**: Χρειάζονται σαφή status chips, error surfaces, και drilldowns που δεν είναι “τεχνικά”.
   - **Affected screens/components**: Invoices List (fiscal/transmission column + filter), Invoice Detail (fiscal block), Dashboard (pending/failed counts if used).
   - **Safest fallback assumption**: Minimal operational statuses: Pending / Sent / Accepted / Rejected / Unknown, με “Unknown” να εμφανίζει banner “Status source pending”.

5. **Permissions for employee exact rates**
   - **Why it blocks UI**: Καθορίζει αν το Employee Cost View δείχνει rates ή μόνο aggregates, και πώς γίνεται redaction.
   - **Affected screens/components**: Employee Cost View (columns, drilldown), exports.
   - **Safest fallback assumption**: v1 δείχνει **aggregated costs** by team/department για μη-privileged roles, και κρύβει exact rates (redaction), με σαφές banner “Visibility restricted”.

6. **Budget version editability**
   - **Why it blocks UI**: Αν τα versions είναι editable, χρειάζεται UI για create/edit/lock. Αν όχι, το UI είναι read-only.
   - **Affected screens/components**: Budget Overview (version selector + actions).
   - **Safest fallback assumption**: Read-only versions στο v1 (μόνο selector), με placeholder CTA “Manage versions” hidden μέχρι να αποφασιστεί.

7. **Whether unlinked supplier bills are allowed**
   - **Why it blocks UI**: Επηρεάζει match status, readiness gating, και exception handling.
   - **Affected screens/components**: Supplier Bills List/Detail (Unlinked state), Payments Queue (Ready vs Blocked), Budget (commitment vs actual interpretation).
   - **Safest fallback assumption**: Επιτρέπονται ως operational reality αλλά εμφανίζονται ως **Warning** και είναι **Blocked by default** για πληρωμή μέχρι να οριστεί policy (π.χ. απαιτείται manual approval override).

8. **Date semantics per KPI (issue/due/payment/approval)**
   - **Why it blocks UI**: Χωρίς αυτό, οι date range selectors και οι charts/widgets μπορεί να λένε διαφορετικές “αλήθειες”.
   - **Affected screens/components**: Dashboard widgets/charts, metric tooltips, exports, saved views.
   - **Safest fallback assumption**: Cash metrics (Collected/Paid/Net) = payment date, invoice issuance metrics = issue date, overdue/exposure = due date vs today, commitments = approval date. Η UI πρέπει να εμφανίζει “Date basis” label σε κάθε widget μέχρι να κλειδώσει.

---

### 13. Final Delivery Checklist
- [ ] Τηρήθηκε ο διαχωρισμός: **billable work → invoice draft → issued receivable → collected cash**.
- [ ] Τηρήθηκε ο διαχωρισμός: **purchase request → approved commitment → supplier bill → paid cash out**.
- [ ] Ορίστηκαν όλες οι απαιτούμενες οθόνες με: layout, sections, visible data, filters, sorting, actions, empty/exception states.
- [ ] Δεν εφευρέθηκε backend schema/architecture ή λογιστική μηχανή.
- [ ] Τα widgets/metrics έχουν σαφείς ορισμούς και δεν “μπερδεύουν” invoiced/collected/committed/paid.
- [ ] Το forecasting παραμένει v2-only.
- [ ] Οι αβεβαιότητες καταγράφηκαν ως **Open Questions / Architect Decisions**.
- [ ] Το report είναι αρκετά συγκεκριμένο ώστε designer και frontend να ξεκινήσουν υλοποίηση χωρίς να μαντεύουν UX/ροές.

Revision note: This version is a targeted tightening pass focused on action clarity, source-of-truth clarity, draft management visibility, UI-blocking decisions, and MVP prioritization. It does not replace architect ownership of object model, persistence, or API contracts.

