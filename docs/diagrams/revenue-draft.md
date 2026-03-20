flowchart TD
    R0[Άνοιγμα Invoice Drafts List]
    R0 --> R1[Προβολή drafts με stale age, reserved lines, review-needed]
    R1 --> R2{Τι χρειάζεται το draft;}
    R2 -->|Συνέχιση| R3[Open in Draft Builder]
    R2 -->|Review| R4[Άνοιγμα side preview]
    R2 -->|Discard| R5[Επιβεβαίωση discard]
    R5 --> R6[Release reserved lines]
    R6 --> R7[Επιστροφή στο Drafts List]
    R3 --> R8[Συνέχιση edit στο Draft Builder]