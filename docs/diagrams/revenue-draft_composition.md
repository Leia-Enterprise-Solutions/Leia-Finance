flowchart TD
    R0[Άνοιγμα Invoice Draft Builder]
    R0 --> R1[Προβολή source billable entries]
    R1 --> R2{Η source entry είναι διαθέσιμη;}
    R2 -->|Όχι| R2N[Disabled add / Already invoiced / Reserved]
    R2 -->|Ναι| R3[Add to selected lines]
    R3 --> R4[Σύνθεση draft: γραμμές, ποσά, όροι, σημειώσεις]
    R4 --> R5{Save draft;}
    R5 -->|Όχι| R6[Συνέχιση edit]
    R5 -->|Ναι| R7[Draft saved]
    R7 --> R8{Το draft είναι πλήρες και valid;}
    R8 -->|Όχι| R9[Επιστροφή για edit / remove lines]
    R8 -->|Ναι| R10[Review before issue]

6. Revenue — Draft Approval & Invoice Issue

Αυτό ενώνει το τέλος του builder με issued receivable creation.

flowchart TD
    R0[Draft ready for issue]
    R0 --> R1{Απαιτείται εσωτερική έγκριση;}
    R1 -->|Ναι| R2[Αποστολή σε approver / billing owner]
    R2 --> R3{Εγκρίθηκε;}
    R3 -->|Όχι| R4[Επιστροφή στο draft με σχόλια]
    R3 -->|Ναι| R5[Έκδοση invoice]
    R1 -->|Όχι| R5
    R5 --> R6[Δημιουργία issued receivable]
    R6 --> R7[Ορατό σε Invoices List και Invoice Detail]
    R7 --> R8{Απαιτείται fiscal / external transmission;}
    R8 -->|Όχι| R12[Invoice treated as issued receivable]
    R8 -->|Ναι| R9[Αποστολή σε fiscal / external channel]
    R9 --> R10{Transmission status}
    R10 -->|Pending / Unknown| R11[Pending warning state]
    R10 -->|Accepted| R12
    R10 -->|Rejected| R13[Correction required]

    Εδώ ένα πράγμα θέλει πειθαρχία: transmission status δεν πρέπει να μπερδεύεται με payment status. Άλλη διάσταση, άλλο chip.

    7. Revenue — Issued Invoice to Collections Worklist

Αυτό είναι το operational πέρασμα από issued invoice σε receivable monitoring.

flowchart TD
    R0[Issued invoice / open receivable]
    R0 --> R1[Ορατό σε Invoices List]
    R1 --> R2[Άνοιγμα Invoice Detail View]
    R2 --> R3[Προβολή total, paid, outstanding, due date, notes, payments]
    R3 --> R4[Go to Collections]
    R4 --> R5[Ορατό στο Collections / Receivables View]
8. Revenue — Collections Follow-up & Receipt State

Αυτό καλύπτει R-05 και R-06.


flowchart TD
    C0[Άνοιγμα Collections / Receivables View]
    C0 --> C1[Προβολή outstanding, due date, owner, expected payment date, notes]
    C1 --> C2{Υπάρχει καταγεγραμμένη είσπραξη;}
    C2 -->|Όχι| C3[Παραμένει open receivable]
    C2 -->|Μερική| C4[Partially paid]
    C2 -->|Πλήρης| C5[Paid]

    C3 --> C6{Due status}
    C6 -->|Not Due| C7[Signal: Not Due]
    C6 -->|Due Soon| C8[Signal: Due Soon]
    C6 -->|Overdue| C9[Signal: Overdue]

    C9 --> C10[Collections follow-up: note / owner / expected payment date]
    C10 --> C11{Εισπράχθηκε μετά το follow-up;}
    C11 -->|Όχι| C12[Remain overdue / escalate]
    C11 -->|Ναι| C5

    C4 --> C13[Update paid and outstanding]
    C13 --> C14{Outstanding > 0;}
    C14 -->|Ναι| C3
    C14 -->|Όχι| C5

    Το safe σημείο εδώ είναι αυτό: Paid μόνο όταν outstanding = 0. Όχι επειδή “υπάρχει payment record κάπου και μας βόλεψε”.




9. Spend — Purchase Request Intake & Triage

Αυτό είναι το S-01.

flowchart TD
    P0[Εντοπίζεται ανάγκη αγοράς / δαπάνης]
    P0 --> P1[Δημιουργία purchase request]
    P1 --> P2[Ορατό στο Purchase Requests List]
    P2 --> P3[Προβολή status, urgency, approver, attachments, budget signal]
    P3 --> P4[Άνοιγμα Purchase Request Detail / Approval]



10. Spend — Request Decision / Approval

Αυτό είναι το S-02 και S-03.

flowchart TD
    P0[Άνοιγμα Purchase Request Detail / Approval]
    P0 --> P1[Προβολή request summary, budget context, supplier, attachments]
    P1 --> P2{Το request είναι πλήρες;}
    P2 -->|Όχι| P3[Επιστροφή για συμπλήρωση]
    P2 -->|Ναι| P4{Απόφαση}
    P4 -->|Reject| P5[Status = Rejected]
    P4 -->|Request changes| P6[Επιστροφή για αλλαγές]
    P4 -->|Approve| P7[Status = Approved / Committed]
    P7 --> P8[Το commitment γίνεται ορατό στο Budget Overview]
    P8 --> P9[Αναμονή supplier bill]
11. Spend — Supplier Bill Intake & Linkage

Αυτό είναι το S-04.

flowchart TD
    B0[Λήψη supplier bill]
    B0 --> B1[Καταχώριση supplier bill]
    B1 --> B2[Ορατό σε Supplier Bills List και Bill Detail]
    B2 --> B3{Συνδέεται με approved request;}
    B3 -->|Όχι| B4[Unlinked supplier bill]
    B3 -->|Ναι| B5{Match με approved request;}
    B5 -->|Όχι| B6[Mismatch]
    B5 -->|Ναι| B7[Matched]
12. Spend — Readiness & Mismatch Resolution

Αυτό είναι το S-05.

flowchart TD
    B0[Άνοιγμα Supplier Bill Detail View]
    B0 --> B1[Προβολή linked request, discrepancy panel, attachments, due date]
    B1 --> B2{Υπάρχει unlinked ή mismatch;}
    B2 -->|Ναι| B3[Blocked by default]
    B2 -->|Όχι| B4{Πληρούνται required controls;}
    B4 -->|Όχι| B3
    B4 -->|Ναι| B5[Payment readiness = Ready]

    B3 --> B6[Δείξε blocked reason]
    B6 --> B7{Τι λείπει;}
    B7 -->|Attachment| B8[Add attachment]
    B7 -->|Due date| B9[Add due date]
    B7 -->|Mismatch| B10[Escalate / request correction]
    B7 -->|Unlinked| B11[Link or policy override]

Εδώ είναι όλο το ζουμί του Spend. Αν αυτό δεν είναι crystal clear στο UI, το queue μετά γίνεται απλώς νεκροταφείο κουτιών με badges.

13. Spend — Payments Queue Triage

Αυτό είναι το S-06.

flowchart TD
    Q0[Άνοιγμα Payments Queue]
    Q0 --> Q1[Προβολή segments: Ready / Blocked / Due Soon / Overdue]
    Q1 --> Q2{Το item είναι Ready;}
    Q2 -->|Όχι| Q3[Παραμένει Blocked με reason]
    Q2 -->|Ναι| Q4[Select for batch / handoff]
    Q4 --> Q5[Prepared / selected state]
    Q5 --> Q6{Scheduled for payment;}
    Q6 -->|Όχι| Q5
    Q6 -->|Ναι| Q7[Status = Scheduled]

Σημαντικό: Prepared/Selected είναι UI-only workbench state. Δεν είναι lifecycle status. Αν το σχεδιάσεις σαν κανονικό status, θα παραπλανήσεις τον χρήστη.

14. Spend — Payment Execution / Paid State

Αυτό είναι το S-07.

flowchart TD
    Q0[Scheduled payable]
    Q0 --> Q1{Καταχωρήθηκε cash-out / εκτελέστηκε πληρωμή;}
    Q1 -->|Όχι| Q2[Παραμένει Scheduled]
    Q1 -->|Ναι| Q3[Payment status = Executed / Paid]
    Q3 --> Q4[Supplier bill becomes Paid / closed]
    Q4 --> Q5[Ενημέρωση Expenses Paid]
    Q5 --> Q6[Μείωση Outstanding Payables]
    Q6 --> Q7[Ενημέρωση Net Cash Movement]

    
15. Control — Budget Monitoring

Αυτό είναι το C-01.

flowchart TD
    B0[Άνοιγμα Budget Overview]
    B0 --> B1[Προβολή budgeted / committed / actual paid / variance]
    B1 --> B2{Υπάρχει signal;}
    B2 -->|Healthy| B3[Monitoring only]
    B2 -->|Warning| B4[Approaching threshold]
    B2 -->|Breach| B5[Escalation / management attention]
    B5 --> B6[Drilldown σε commitments ή actuals]


16. Control — Audit Investigation

Αυτό είναι το C-02.

flowchart TD
    A0[Άνοιγμα Audit Trail]
    A0 --> A1[Προβολή actor / action / target / time / before-after]
    A1 --> A2{Απαιτείται investigation;}
    A2 -->|Όχι| A3[Συνέχιση traceability review]
    A2 -->|Ναι| A4[Άνοιγμα target record]
    A4 --> A5[Review detail context]


17. Control — Employee Cost Visibility

Αυτό είναι το C-03.

flowchart TD
    E0[Άνοιγμα Employee Cost View]
    E0 --> E1[Προβολή labor cost summary]
    E1 --> E2[Billable vs non-billable split]
    E2 --> E3{Ο ρόλος επιτρέπει detail visibility;}
    E3 -->|Όχι| E4[Aggregate-only / restricted visibility]
    E3 -->|Ναι| E5[Employee / team / department breakdown]
    E5 --> E6[Allocation / project / trend drilldown]


18. Exception Flow — Transmission Rejection
flowchart TD
    X0[Invoice sent to fiscal / external channel]
    X0 --> X1{Transmission status}
    X1 -->|Rejected| X2[Show rejected transmission state]
    X2 --> X3[Display error / reason]
    X3 --> X4[Correction required]
    X4 --> X5[Return to relevant invoice correction path]


19. Exception Flow — Blocked Payable
flowchart TD
    X0[Supplier bill appears in Bill Detail / Payments Queue]
    X0 --> X1[Show blocked reason]
    X1 --> X2{Reason type}
    X2 -->|Mismatch| X3[Escalate / request correction]
    X2 -->|Missing attachment| X4[Add attachment]
    X2 -->|Missing due date| X5[Add due date]
    X2 -->|Unlinked bill| X6[Link request / policy override]
    X3 --> X7[Re-evaluate readiness]
    X4 --> X7
    X5 --> X7
    X6 --> X7
    X7 --> X8{Ready now;}
    X8 -->|Όχι| X1
    X8 -->|Ναι| X9[Move to Ready segment]


20. Exception Flow — Escalated Overdue Receivable
flowchart TD
    X0[Receivable becomes overdue]
    X0 --> X1[Collections follow-up]
    X1 --> X2{Payment received;}
    X2 -->|Ναι| X3[Update payment state]
    X2 -->|Όχι| X4[Remain overdue]
    X4 --> X5{Risk threshold exceeded;}
    X5 -->|Όχι| X1
    X5 -->|Ναι| X6[Escalated overdue receivable]
    X6 --> X7[Management / owner attention]