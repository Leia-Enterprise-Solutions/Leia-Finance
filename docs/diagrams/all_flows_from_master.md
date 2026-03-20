flowchart TD
    O0[Άνοιγμα Finance Overview Dashboard]
    O0 --> O1[Προβολή KPI, exposure, overdue, blocked items]
    O1 --> O2{Τι απαιτεί προσοχή;}
    O2 -->|Έσοδα / εισπράξεις| O3[Drilldown στο Revenue]
    O3 --> O4{Τι τύπος revenue signal είναι;}
    O4 -->|Draft backlog| O5[Άνοιγμα Invoice Drafts List]
    O4 -->|Issued invoices / receivables| O6[Άνοιγμα Invoices List]
    O4 -->|Outstanding / overdue receivables| O7[Άνοιγμα Collections / Receivables View]