flowchart TD
    O0[Άνοιγμα Finance Overview Dashboard]
    O0 --> O1[Προβολή KPI, exposure, overdue, blocked items]
    O1 --> O2{Τι απαιτεί προσοχή;}
    O2 -->|Δαπάνες / πληρωμές| O3[Drilldown στο Spend]
    O3 --> O4{Τι τύπος spend signal είναι;}
    O4 -->|Approval / commitments| O5[Άνοιγμα Purchase Requests List]
    O4 -->|Open / overdue payables| O6[Άνοιγμα Supplier Bills / Expenses List]
    O4 -->|Ready / blocked payments| O7[Άνοιγμα Payments Queue]