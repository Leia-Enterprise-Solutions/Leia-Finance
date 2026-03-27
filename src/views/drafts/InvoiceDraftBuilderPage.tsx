import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Chip } from "../../ui/Chip";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { Popover } from "../../ui/Popover";
import { SidePanel } from "../../ui/SidePanel";
import type { BillableWorkItem, DraftLine } from "../../domain/types";
import { formatCurrency } from "../../domain/format";
import {
  clampPct,
  computeInvoiceTotals,
  computeLineNet,
  computeLineVat,
  normalizeDraftLine,
  vatRateFor,
  type VatCategory
} from "../../domain/invoicingCalc";
import { useFinancePrototypeState } from "../../state/FinancePrototypeState";
import { usePermissions } from "../../state/permissions";

type DraftDocumentTypeId =
  | "SalesInvoice"
  | "ServiceInvoice"
  | "CreditNote"
  | "InvoiceWithMovement"
  | "DispatchDocument";

const DOCUMENT_TYPE_OPTIONS: {
  id: DraftDocumentTypeId;
  label: string;
  requiresMovement: boolean;
  suggestsRelated: boolean;
}[] = [
  { id: "SalesInvoice", label: "Τιμολόγιο Πώλησης", requiresMovement: false, suggestsRelated: false },
  { id: "ServiceInvoice", label: "Τιμολόγιο Παροχής Υπηρεσιών", requiresMovement: false, suggestsRelated: false },
  { id: "CreditNote", label: "Πιστωτικό", requiresMovement: false, suggestsRelated: true },
  { id: "InvoiceWithMovement", label: "Παραστατικό με Διακίνηση", requiresMovement: true, suggestsRelated: false },
  { id: "DispatchDocument", label: "Δελτίο / Παραστατικό Διακίνησης", requiresMovement: true, suggestsRelated: false }
];

function docTypeMeta(id: DraftDocumentTypeId) {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.id === id) ?? DOCUMENT_TYPE_OPTIONS[1];
}

const PAYMENT_WAY_OPTIONS: { id: string; label: string }[] = [
  { id: "1", label: "1 - Επαγ. Λογαριασμός Πληρωμών Ημεδαπής" },
  { id: "2", label: "2 - Επαγ. Λογαριασμός Πληρωμών Αλλοδαπής" },
  { id: "3", label: "3 - Μετρητά" },
  { id: "4", label: "4 - Επιταγή" },
  { id: "5", label: "5 - Επί Πιστώσει" },
  { id: "6", label: "6 - Web Banking" },
  { id: "7", label: "7 - POS/e-POS" },
  { id: "8", label: "8 - Άμεσες πληρωμές IRIS" }
];

const UNIT_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: "ea", label: "τμχ" },
  { id: "hour", label: "ώρες" },
  { id: "person_hour", label: "ανθρωποώρες" },
  { id: "m", label: "μέτρα" },
  { id: "sqm", label: "τ.μ." },
  { id: "kg", label: "kg" }
];

// v1 compact selections (extend later as needed).
const ST9_INCOME_CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: "services", label: "Υπηρεσίες (ΣΤ.9)" },
  { id: "goods", label: "Πώληση αγαθών (ΣΤ.9)" },
  { id: "other", label: "Λοιπά έσοδα (ΣΤ.9)" }
];

const E3_CLASSIFICATION_OPTIONS: { id: string; label: string }[] = [
  { id: "E3_SERVICES", label: "Ε3 - Παροχή υπηρεσιών" },
  { id: "E3_GOODS", label: "Ε3 - Πώληση αγαθών" },
  { id: "E3_OTHER", label: "Ε3 - Λοιπά" }
];

function toneForWorkStatus(s: BillableWorkItem["status"]) {
  if (s === "Available") return "success";
  if (s === "Reserved") return "warning";
  if (s === "Invoiced") return "neutral";
  return "neutral";
}

function labelForWorkStatus(s: BillableWorkItem["status"]) {
  if (s === "Available") return "Διαθέσιμο";
  if (s === "Reserved") return "Δεσμευμένο";
  if (s === "Invoiced") return "Τιμολογημένο";
  return s;
}

function toneForBillingType(t: BillableWorkItem["billingType"]) {
  return t === "Hourly" ? "neutral" : "success";
}

function labelForBillingType(t: BillableWorkItem["billingType"]) {
  return t === "Hourly" ? "Ωριαία" : "Σταθερή";
}

function computeWorkAmount(w: BillableWorkItem) {
  if (w.billingType === "Hourly") {
    const hours = w.hours ?? 0;
    const rate = w.rate ?? 0;
    const amt = hours * rate;
    return Number.isFinite(amt) ? amt : w.amount;
  }
  return w.amount;
}

function canAddToDraft(item: BillableWorkItem, activeDraftId: string) {
  if (item.status === "Available") return true;
  if (item.status === "Reserved" && item.reservedByDraftId === activeDraftId) return true;
  return false;
}

function toDateInputValue(v: Date) {
  return v.toISOString().slice(0, 10);
}

function computeDueDateFromTerms(issueDate: string, dueTerms: "Net 15" | "Net 30" | "Net 45") {
  const dueDays = dueTerms === "Net 15" ? 15 : dueTerms === "Net 30" ? 30 : 45;
  const d = new Date(issueDate || new Date().toISOString().slice(0, 10));
  d.setDate(d.getDate() + dueDays);
  return toDateInputValue(d);
}

function buildDraftInvoiceNumber(draftId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const numericSeed = draftId.replace(/\D/g, "").slice(-5).padStart(5, "0");
  return `INV-${year}-${numericSeed}`;
}

const VAT_OPTIONS: { id: VatCategory; label: string; rate: number }[] = [
  { id: "Standard 24%", label: "24% (Κανονικό)", rate: 0.24 },
  { id: "Reduced 13%", label: "13% (Μειωμένο)", rate: 0.13 },
  { id: "Super Reduced 6%", label: "6% (Υπερμειωμένο)", rate: 0.06 },
  { id: "Zero 0%", label: "0% (Μηδενικό)", rate: 0 },
  { id: "Exempt", label: "Απαλλαγή", rate: 0 },
  { id: "Reverse charge", label: "Αντίστροφη χρέωση", rate: 0 }
];

export function InvoiceDraftBuilderPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const perms = usePermissions();
  const {
    billableWork,
    invoiceDrafts,
    draftLinesByDraftId,
    upsertDraft,
    setDraftLines,
    issueDraft
  } = useFinancePrototypeState();

  const [activeDraftId, setActiveDraftId] = React.useState<string | null>(draftId ?? null);

  React.useEffect(() => {
    if (draftId) {
      setActiveDraftId(draftId);
      return;
    }
    // Canonicalize new draft into an id route so it can be referenced & audited.
    const id = `drf_${Date.now()}`;
    upsertDraft({
      id,
      client: "Acme Holding",
      project: "Implementation",
      owner: "Finance Operator",
      updatedAt: new Date().toISOString(),
      currency: "EUR",
      draftTotal: 0,
      reservedLines: 0,
      status: "In Progress",
      documentType: "ServiceInvoice",
      paymentWay: "",
      billingEntity: "Leia Finance",
      series: "ΤΠΥ-A",
      invoiceNumber: buildDraftInvoiceNumber(id),
      subject: "Υπηρεσίες",
      paymentTerms: "Net 30",
      issueDate: toDateInputValue(new Date()),
      dueDate: computeDueDateFromTerms(toDateInputValue(new Date()), "Net 30"),
      externalNote: "",
      internalNote: "",
      contractRef: "",
      customerReference: ""
    });
    setDraftLines(id, []);
    setActiveDraftId(id);
    navigate(`/finance/revenue/drafts/${encodeURIComponent(id)}/builder`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const resolvedDraftId = activeDraftId ?? (draftId ?? "drf_new");
  const draftMeta = invoiceDrafts.find((d) => d.id === resolvedDraftId) ?? null;
  const [selectedClient, setSelectedClient] = React.useState<string>(draftMeta?.client ?? "Acme Holding");
  const [selectedProject, setSelectedProject] = React.useState<string>(draftMeta?.project ?? "Implementation");
  const [extraClients, setExtraClients] = React.useState<string[]>([]);
  const [clientPickerOpen, setClientPickerOpen] = React.useState(false);
  const [newClientOpen, setNewClientOpen] = React.useState(false);
  const [newClientName, setNewClientName] = React.useState("");
  const [clientSearch, setClientSearch] = React.useState("");
  const [billingEntity, setBillingEntity] = React.useState<string>(draftMeta?.billingEntity ?? "Leia Finance");
  const [documentType, setDocumentType] = React.useState<DraftDocumentTypeId>(
    (draftMeta?.documentType as DraftDocumentTypeId) ?? "ServiceInvoice"
  );
  const [paymentWay, setPaymentWay] = React.useState<string>(draftMeta?.paymentWay ?? "");
  const [draftCurrency, setDraftCurrency] = React.useState<string>(draftMeta?.currency ?? "EUR");
  const [invoiceSeries, setInvoiceSeries] = React.useState<string>(draftMeta?.series ?? "ΤΠΥ-A");
  const [invoiceNumber, setInvoiceNumber] = React.useState<string>(
    draftMeta?.invoiceNumber ?? buildDraftInvoiceNumber(draftId ?? "drf_new")
  );
  const [contractRef, setContractRef] = React.useState<string>(draftMeta?.contractRef ?? "");
  const [customerReference, setCustomerReference] = React.useState<string>(draftMeta?.customerReference ?? "");
  const [invoiceSubject, setInvoiceSubject] = React.useState<string>(draftMeta?.subject ?? "");
  const [dueTerms, setDueTerms] = React.useState<"Net 15" | "Net 30" | "Net 45">(draftMeta?.paymentTerms ?? "Net 30");
  const [issueDate, setIssueDate] = React.useState<string>(draftMeta?.issueDate ?? toDateInputValue(new Date()));
  const [dueDate, setDueDate] = React.useState<string>(
    draftMeta?.dueDate ?? computeDueDateFromTerms(draftMeta?.issueDate ?? toDateInputValue(new Date()), draftMeta?.paymentTerms ?? "Net 30")
  );
  const [externalNote, setExternalNote] = React.useState<string>(draftMeta?.externalNote ?? "");
  const [notes, setNotes] = React.useState<string>(draftMeta?.internalNote ?? "");
  const [relatedEnabled, setRelatedEnabled] = React.useState<boolean>(draftMeta?.relatedDocument?.enabled ?? false);
  const [relatedReference, setRelatedReference] = React.useState<string>(draftMeta?.relatedDocument?.reference ?? "");
  const [relatedNumber, setRelatedNumber] = React.useState<string>(draftMeta?.relatedDocument?.number ?? "");
  const [relatedMark, setRelatedMark] = React.useState<string>(draftMeta?.relatedDocument?.mark ?? "");
  const [relatedNote, setRelatedNote] = React.useState<string>(draftMeta?.relatedDocument?.note ?? "");

  const [movementPurpose, setMovementPurpose] = React.useState<string>(draftMeta?.movement?.purpose ?? "");
  const [movementLoadingPlace, setMovementLoadingPlace] = React.useState<string>(draftMeta?.movement?.loadingPlace ?? "");
  const [movementDeliveryPlace, setMovementDeliveryPlace] = React.useState<string>(draftMeta?.movement?.deliveryPlace ?? "");
  const [movementTransportMode, setMovementTransportMode] = React.useState<string>(draftMeta?.movement?.transportMode ?? "");
  const [movementCarrier, setMovementCarrier] = React.useState<string>(draftMeta?.movement?.carrier ?? "");
  const [movementRecipientThirdParty, setMovementRecipientThirdParty] = React.useState<string>(
    draftMeta?.movement?.recipientThirdParty ?? ""
  );
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = React.useState(false);
  const [addWorkMenuOpen, setAddWorkMenuOpen] = React.useState(false);

  const initial = React.useMemo(() => draftLinesByDraftId[resolvedDraftId] ?? [], [resolvedDraftId, draftLinesByDraftId]);
  const [lines, setLines] = React.useState<DraftLine[]>(initial);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setLines(draftLinesByDraftId[resolvedDraftId] ?? []);
  }, [resolvedDraftId, draftLinesByDraftId]);

  const initializedDraftIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (initializedDraftIdRef.current === resolvedDraftId) return;
    initializedDraftIdRef.current = resolvedDraftId;
    const nextClient = draftMeta?.client ?? "Acme Holding";
    const nextProject = draftMeta?.project ?? "Implementation";
    const nextIssueDate = draftMeta?.issueDate ?? toDateInputValue(new Date());
    setSelectedClient(nextClient);
    setSelectedProject(nextProject);
    setBillingEntity(draftMeta?.billingEntity ?? "Leia Finance");
    setDocumentType(((draftMeta?.documentType as DraftDocumentTypeId) ?? "ServiceInvoice") as DraftDocumentTypeId);
    setPaymentWay(draftMeta?.paymentWay ?? "");
    setDraftCurrency(draftMeta?.currency ?? "EUR");
    setInvoiceSeries(draftMeta?.series ?? "ΤΠΥ-A");
    setInvoiceNumber(draftMeta?.invoiceNumber ?? buildDraftInvoiceNumber(resolvedDraftId));
    setContractRef(draftMeta?.contractRef ?? "");
    setCustomerReference(draftMeta?.customerReference ?? "");
    setInvoiceSubject(draftMeta?.subject ?? (nextProject ? `Υπηρεσίες για ${nextProject}` : "Υπηρεσίες"));
    setDueTerms(draftMeta?.paymentTerms ?? "Net 30");
    setIssueDate(nextIssueDate);
    setDueDate(draftMeta?.dueDate ?? computeDueDateFromTerms(nextIssueDate, draftMeta?.paymentTerms ?? "Net 30"));
    setExternalNote(draftMeta?.externalNote ?? "");
    setNotes(draftMeta?.internalNote ?? "");
    setRelatedEnabled(draftMeta?.relatedDocument?.enabled ?? false);
    setRelatedReference(draftMeta?.relatedDocument?.reference ?? "");
    setRelatedNumber(draftMeta?.relatedDocument?.number ?? "");
    setRelatedMark(draftMeta?.relatedDocument?.mark ?? "");
    setRelatedNote(draftMeta?.relatedDocument?.note ?? "");
    setMovementPurpose(draftMeta?.movement?.purpose ?? "");
    setMovementLoadingPlace(draftMeta?.movement?.loadingPlace ?? "");
    setMovementDeliveryPlace(draftMeta?.movement?.deliveryPlace ?? "");
    setMovementTransportMode(draftMeta?.movement?.transportMode ?? "");
    setMovementCarrier(draftMeta?.movement?.carrier ?? "");
    setMovementRecipientThirdParty(draftMeta?.movement?.recipientThirdParty ?? "");
  }, [resolvedDraftId, draftMeta?.client, draftMeta?.project]);

  const dtMeta = docTypeMeta(documentType);
  const showMovement = dtMeta.requiresMovement;
  const showRelated = dtMeta.suggestsRelated || relatedEnabled;
  const showCarrierField = showMovement && movementTransportMode === "Μεταφορέας";
  const showThirdRecipientField = showMovement && movementTransportMode === "Τρίτος / Courier";

  const pool = billableWork
    .filter((w) => w.status !== "Non-billable")
    .filter((w) => (selectedClient ? w.client === selectedClient : true))
    .filter((w) => (selectedProject ? (w.project ?? "") === selectedProject : true))
    .filter((w) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        w.id.toLowerCase().includes(needle) ||
        w.description.toLowerCase().includes(needle) ||
        w.client.toLowerCase().includes(needle)
      );
    });

  const reservedByOther = pool.filter((w) => w.status === "Reserved" && w.reservedByDraftId !== resolvedDraftId)
    .length;
  const invoicedCount = pool.filter((w) => w.status === "Invoiced").length;

  const clientOptions = React.useMemo(() => {
    const fromWork = billableWork.map((w) => w.client);
    return Array.from(new Set([...fromWork, ...extraClients])).sort((a, b) => a.localeCompare(b));
  }, [billableWork, extraClients]);

  const filteredClientOptions = React.useMemo(() => {
    const needle = clientSearch.trim().toLowerCase();
    if (!needle) return clientOptions;
    return clientOptions.filter((c) => c.toLowerCase().includes(needle));
  }, [clientOptions, clientSearch]);

  const contractRefOptions = React.useMemo(() => {
    const refs = invoiceDrafts
      .filter((d) => d.client === selectedClient)
      .map((d) => d.contractRef)
      .filter((v): v is string => typeof v === "string" && !!v.trim())
      .map((v) => v.trim());
    return Array.from(new Set(refs)).sort((a, b) => a.localeCompare(b));
  }, [invoiceDrafts, selectedClient]);

  function saveNewClient() {
    const name = newClientName.trim();
    if (!name) return;
    setExtraClients((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setSelectedClient(name);
    setNewClientName("");
    setClientSearch("");
    setNewClientOpen(false);
    setClientPickerOpen(false);
  }

  const selectedSourceIds = React.useMemo(() => new Set(lines.map((l) => l.sourceId)), [lines]);
  const workById = React.useMemo(() => new Map(billableWork.map((w) => [w.id, w] as const)), [billableWork]);
  const reservedByThisDraft = lines.length;
  const availableCount = pool.filter((w) => w.status === "Available" && !selectedSourceIds.has(w.id)).length;

  function staleAgeDays(d: { updatedAt: string }) {
    const updated = new Date(d.updatedAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - updated) / (1000 * 60 * 60 * 24)));
  }

  const isStale = draftMeta?.status === "Stale";
  const staleDays = draftMeta ? staleAgeDays(draftMeta) : 0;

  const dueDatePreview = dueDate;

  function add(item: BillableWorkItem) {
    if (!canAddToDraft(item, resolvedDraftId)) return;
    if (lines.some((l) => l.sourceId === item.id)) return;
    const id = `dl_${Math.random().toString(16).slice(2)}`;
    const unitPrice = computeWorkAmount(item);
    setLines((prev) => [
      ...prev,
      {
        id,
        sourceId: item.id,
        description: item.description,
        quantity: 1,
        unit: "ea",
        unitPrice,
        discountPct: 0,
        vatCategory: "Standard 24%",
        amount: unitPrice,
        currency: item.currency
      }
    ]);
  }

  function addCustomBillableItem() {
    const id = `dl_custom_${Math.random().toString(16).slice(2)}`;
    const currencyForNewLine = lines[0]?.currency ?? draftCurrency ?? draftMeta?.currency ?? "EUR";
    setLines((prev) => [
      ...prev,
      {
        id,
        sourceId: `custom_${Date.now()}`,
        description: "",
        quantity: 1,
        unit: "ea",
        unitPrice: 0,
        discountPct: 0,
        vatCategory: "Standard 24%",
        amount: 0,
        currency: currencyForNewLine
      }
    ]);
  }

  function remove(sourceId: string) {
    setLines((prev) => {
      return prev.filter((l) => l.sourceId !== sourceId);
    });
  }

  function updateLineDescription(lineId: string, nextDescription: string) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, description: nextDescription } : l)));
  }

  function updateLineAmount(lineId: string, raw: string) {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    const safe = Number.isFinite(parsed) ? parsed : 0;
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, amount: safe } : l)));
  }

  function updateLineQuantity(lineId: string, raw: string) {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    const quantity = Number.isFinite(parsed) ? parsed : 0;
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, quantity };
        return { ...next, amount: computeLineNet(next) };
      })
    );
  }

  function updateLineUnit(lineId: string, unit: string) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, unit } : l)));
  }

  function updateLineUnitPrice(lineId: string, raw: string) {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    const unitPrice = Number.isFinite(parsed) ? parsed : 0;
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, unitPrice };
        return { ...next, amount: computeLineNet(next) };
      })
    );
  }

  function updateLineDiscountPct(lineId: string, raw: string) {
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    const discountPct = clampPct(Number.isFinite(parsed) ? parsed : 0);
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, discountPct };
        return { ...next, amount: computeLineNet(next) };
      })
    );
  }

  function updateLineVatCategory(lineId: string, cat: VatCategory) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next: DraftLine = { ...l, vatCategory: cat };
        // Clean up conditional fields when switching back to taxable.
        if (cat !== "Exempt") next.vatExemptionReason = undefined;
        if (cat !== "Reverse charge") next.reverseChargeNote = undefined;
        return next;
      })
    );
  }

  function patchLine(lineId: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  }

  // Normalize legacy lines (pre-migration) into computed schema.
  const normalizedLines = React.useMemo(() => {
    return lines.map(normalizeDraftLine);
  }, [lines]);

  React.useEffect(() => {
    // Keep state upgraded (one-way).
    if (normalizedLines === lines) return;
    setLines(normalizedLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedDraftId]);

  const totals = React.useMemo(() => computeInvoiceTotals(normalizedLines), [normalizedLines]);
  const totalNet = totals.totalNet;
  const totalVat = totals.totalVat;
  const totalOtherTaxes = totals.totalOtherTaxes;
  const totalGross = totals.grandTotal;
  const totalPreDiscount = totals.totalPreDiscount;
  const totalDiscount = totals.totalDiscount;
  const netAfterDiscountAndCharges = totalNet + totalOtherTaxes;
  const grandTotal = totals.grandTotal;
  const currency = lines[0]?.currency ?? draftCurrency ?? "EUR";
  const customLines = normalizedLines.filter((l) => l.sourceId.startsWith("custom_"));
  const hasSourceLines = normalizedLines.some((l) => !l.sourceId.startsWith("custom_"));
  const currencyLocked = hasSourceLines;
  const hasInvalidCustomRows = customLines.some((l) => {
    const descriptionOk = !!l.description.trim();
    const quantityOk = (l.quantity ?? 0) > 0;
    const unitPriceOk = (l.unitPrice ?? 0) > 0;
    const amountOk = Number.isFinite(computeLineNet(l)) && computeLineNet(l) > 0;
    return !(descriptionOk && quantityOk && unitPriceOk && amountOk);
  });

  function saveCurrentDraft() {
    if (hasInvalidCustomRows) return;
    if (!draftMeta) return;
    upsertDraft({
      ...draftMeta,
      client: selectedClient,
      project: selectedProject || undefined,
      updatedAt: new Date().toISOString(),
      currency: draftCurrency || "EUR",
      documentType,
      paymentWay: paymentWay || undefined,
      billingEntity,
      contractRef: contractRef || undefined,
      customerReference: customerReference || undefined,
      subject: invoiceSubject || undefined,
      issueDate,
      paymentTerms: dueTerms,
      dueDate,
      externalNote,
      internalNote: notes,
      series: invoiceSeries,
      invoiceNumber,
      relatedDocument: {
        enabled: relatedEnabled,
        reference: relatedReference || undefined,
        number: relatedNumber || undefined,
        mark: relatedMark || undefined,
        note: relatedNote || undefined
      },
      movement: showMovement
        ? {
            purpose: movementPurpose || undefined,
            loadingPlace: movementLoadingPlace || undefined,
            deliveryPlace: movementDeliveryPlace || undefined,
            transportMode: movementTransportMode || undefined,
            carrier: showCarrierField ? movementCarrier || undefined : undefined,
            recipientThirdParty: showThirdRecipientField ? movementRecipientThirdParty || undefined : undefined
          }
        : undefined
    });
    setDraftLines(resolvedDraftId, normalizedLines);
  }

  function submitCurrentDraft() {
    if (hasInvalidCustomRows) return;
    if (!draftMeta) return;
    saveCurrentDraft();
    const invId = issueDraft(resolvedDraftId, {
      client: selectedClient,
      project: selectedProject || undefined,
      owner: draftMeta.owner
    });
    if (invId) navigate(`/finance/revenue/invoices/${encodeURIComponent(invId)}`);
  }

  function resetBuilderForm() {
    const nextClient = draftMeta?.client ?? "Acme Holding";
    const nextProject = draftMeta?.project ?? "Implementation";
    const nextIssueDate = draftMeta?.issueDate ?? toDateInputValue(new Date());
    setSelectedClient(nextClient);
    setSelectedProject(nextProject);
    setBillingEntity(draftMeta?.billingEntity ?? "Leia Finance");
    setDocumentType(((draftMeta?.documentType as DraftDocumentTypeId) ?? "ServiceInvoice") as DraftDocumentTypeId);
    setPaymentWay(draftMeta?.paymentWay ?? "");
    setInvoiceSeries(draftMeta?.series ?? "ΤΠΥ-A");
    setInvoiceNumber(draftMeta?.invoiceNumber ?? buildDraftInvoiceNumber(resolvedDraftId));
    setContractRef(draftMeta?.contractRef ?? "");
    setCustomerReference(draftMeta?.customerReference ?? "");
    setInvoiceSubject(draftMeta?.subject ?? (nextProject ? `Υπηρεσίες για ${nextProject}` : "Υπηρεσίες"));
    setDueTerms(draftMeta?.paymentTerms ?? "Net 30");
    setIssueDate(nextIssueDate);
    setDueDate(draftMeta?.dueDate ?? computeDueDateFromTerms(nextIssueDate, draftMeta?.paymentTerms ?? "Net 30"));
    setExternalNote(draftMeta?.externalNote ?? "");
    setNotes(draftMeta?.internalNote ?? "");
    setRelatedEnabled(draftMeta?.relatedDocument?.enabled ?? false);
    setRelatedReference(draftMeta?.relatedDocument?.reference ?? "");
    setRelatedNumber(draftMeta?.relatedDocument?.number ?? "");
    setRelatedMark(draftMeta?.relatedDocument?.mark ?? "");
    setRelatedNote(draftMeta?.relatedDocument?.note ?? "");
    setMovementPurpose(draftMeta?.movement?.purpose ?? "");
    setMovementLoadingPlace(draftMeta?.movement?.loadingPlace ?? "");
    setMovementDeliveryPlace(draftMeta?.movement?.deliveryPlace ?? "");
    setMovementTransportMode(draftMeta?.movement?.transportMode ?? "");
    setMovementCarrier(draftMeta?.movement?.carrier ?? "");
    setMovementRecipientThirdParty(draftMeta?.movement?.recipientThirdParty ?? "");
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn btn--sm" to="/finance/revenue/drafts" title="Πίσω στα Πρόχειρα" aria-label="Πίσω στα Πρόχειρα">
              <i className="bi bi-arrow-left" aria-hidden="true" />
            </Link>
            <h1>Σύνθεση Προσχεδίου Τιμολογίου</h1>
          </div>
        </div>
        <div className="row invoice-builder-head-actions">
          <div className="row invoice-builder-icon-actions">
            <button
              className="btn btn--sm invoice-builder-icon-btn"
              title="Αποθήκευση Προσχεδίου"
              aria-label="Αποθήκευση Προσχεδίου"
              disabled={lines.length === 0 || hasInvalidCustomRows}
              onClick={() => setConfirmSaveOpen(true)}
            >
              <i className="bi bi-floppy" aria-hidden="true" />
            </button>
            <button
              className="btn btn--sm invoice-builder-icon-btn"
              title="Έλεγχος Προσχεδίου"
              aria-label="Έλεγχος Προσχεδίου"
              disabled={lines.length === 0 || hasInvalidCustomRows}
              onClick={() => setReviewOpen(true)}
            >
              <i className="bi bi-eye" aria-hidden="true" />
            </button>
            <button
              className="btn btn--sm invoice-builder-icon-btn"
              title="Απόρριψη αλλαγών"
              aria-label="Απόρριψη αλλαγών"
              disabled={lines.length === 0}
              onClick={() => setConfirmDiscardOpen(true)}
            >
              <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
            </button>
          </div>
          <button
            className="btn primary"
            disabled={lines.length === 0 || hasInvalidCustomRows || !perms.canIssueInvoice}
            title={!perms.canIssueInvoice ? "Δεν έχετε δικαίωμα έκδοσης." : undefined}
            onClick={() => submitCurrentDraft()}
          >
            <i className="bi bi-send" aria-hidden="true" />
            Υποβολή για Έκδοση
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, 0.9fr)",
          gap: 16,
          alignItems: "start"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card title="Στοιχεία Χρέωσης">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
                gap: 12,
                padding: 4
              }}
            >
              <div className="field">
                <label>Είδος Παραστατικού *</label>
                <select
                  className="select"
                  value={documentType}
                  onChange={(e) => {
                    const next = e.target.value as DraftDocumentTypeId;
                    setDocumentType(next);
                    const meta = docTypeMeta(next);
                    if (meta.suggestsRelated) setRelatedEnabled(true);
                    if (!meta.requiresMovement) {
                      setMovementPurpose("");
                      setMovementLoadingPlace("");
                      setMovementDeliveryPlace("");
                      setMovementTransportMode("");
                      setMovementCarrier("");
                      setMovementRecipientThirdParty("");
                    }
                  }}
                >
                  {DOCUMENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Οντότητα τιμολόγησης</label>
                <input
                  className="input"
                  placeholder="π.χ. Leia Finance Μονοπρόσωπη ΙΚΕ"
                  value={billingEntity}
                  onChange={(e) => setBillingEntity(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Πελάτης / Οντότητα χρέωσης *</label>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Popover
                      placement="bottom-start"
                      open={clientPickerOpen}
                      onOpenChange={(open) => {
                        setClientPickerOpen(open);
                        if (!open) setClientSearch("");
                      }}
                      trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                        <button
                          ref={ref}
                          type="button"
                          className="select"
                          onClick={onClick}
                          aria-expanded={ariaExpanded}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selectedClient || "—"}</span>
                          <i className="bi bi-chevron-down" aria-hidden="true" />
                        </button>
                      )}
                    >
                      <div className="popover-menu" role="menu" aria-label="Επιλογή πελάτη">
                        <div style={{ padding: 10 }}>
                          <input
                            className="input"
                            placeholder="Αναζήτηση πελάτη…"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            autoFocus
                          />
                        </div>

                        <button
                          type="button"
                          className="popover-menu__item"
                          role="menuitem"
                          onClick={() => {
                            setNewClientName(clientSearch.trim());
                            setNewClientOpen(true);
                            setClientPickerOpen(false);
                          }}
                        >
                          <span className="popover-menu__left">
                            <span className="popover-menu__icon" aria-hidden="true">
                              <i className="bi bi-plus-lg" aria-hidden="true" />
                            </span>
                            <span>Νέος πελάτης</span>
                          </span>
                        </button>
                        <div className="divider" />

                        <div style={{ maxHeight: 220, overflow: "auto" }}>
                          {filteredClientOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="popover-menu__item"
                              role="menuitem"
                              onClick={() => {
                                setSelectedClient(c);
                                setClientPickerOpen(false);
                                setClientSearch("");
                              }}
                              aria-current={c === selectedClient}
                            >
                              <span className="popover-menu__left">
                                <span className="popover-menu__icon" aria-hidden="true">
                                  <i className={`bi ${c === selectedClient ? "bi-check2" : "bi-building"}`} />
                                </span>
                                <span>{c}</span>
                              </span>
                            </button>
                          ))}
                          {filteredClientOptions.length === 0 ? (
                            <div className="muted" style={{ padding: 10, fontSize: 12 }}>
                              Δεν βρέθηκαν πελάτες.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Popover>
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Έργο / Σύμβαση</label>
                <select className="select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  {Array.from(
                    new Set(
                      billableWork
                        .filter((w) => w.client === selectedClient)
                        .map((w) => w.project ?? "—")
                    )
                  ).map((p) => (
                    <option key={p} value={p === "—" ? "" : p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Αρ. Σύμβασης / Contract ref</label>
                <input
                  className="input"
                  placeholder="π.χ. CTR-2026-09"
                  list="contract-ref-options"
                  value={contractRef}
                  onChange={(e) => setContractRef(e.target.value)}
                />
                <datalist id="contract-ref-options">
                  {contractRefOptions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>Σειρά *</label>
                <input
                  className="input"
                  placeholder="π.χ. ΤΠΥ-A"
                  list="invoice-series-options"
                  value={invoiceSeries}
                  onChange={(e) => setInvoiceSeries(e.target.value)}
                />
                <datalist id="invoice-series-options">
                  <option value="ΤΠΥ-A" />
                  <option value="ΤΠΥ-B" />
                  <option value="ΤΠΥ-ΕΞ" />
                </datalist>
              </div>
              <div className="field">
                <label>Αριθμός *</label>
                <input className="input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="field">
                <label>Αναφορά πελάτη / PO / Σύμβαση</label>
                <input
                  className="input"
                  placeholder="π.χ. PO-2026-014"
                  value={customerReference}
                  onChange={(e) => setCustomerReference(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Περιγραφή τιμολόγησης / Θέμα</label>
                <input
                  className="input"
                  placeholder="π.χ. Υπηρεσίες υλοποίησης Μαρτίου"
                  value={invoiceSubject}
                  onChange={(e) => setInvoiceSubject(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Ημερομηνία έκδοσης *</label>
                <input
                  className="input"
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    const nextIssueDate = e.target.value || toDateInputValue(new Date());
                    setIssueDate(nextIssueDate);
                    setDueDate(computeDueDateFromTerms(nextIssueDate, dueTerms));
                  }}
                />
              </div>
              <div className="field">
                <label>Όροι πληρωμής (Πίστωση) *</label>
                <select
                  className="select"
                  value={dueTerms}
                  onChange={(e) => {
                    const nextDueTerms = e.target.value as "Net 15" | "Net 30" | "Net 45";
                    setDueTerms(nextDueTerms);
                    setDueDate(computeDueDateFromTerms(issueDate, nextDueTerms));
                  }}
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                </select>
              </div>
              <div className="field">
                <label>Τρόπος Πληρωμής</label>
                <select className="select" value={paymentWay} onChange={(e) => setPaymentWay(e.target.value)}>
                  <option value="">—</option>
                  {PAYMENT_WAY_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Νόμισμα</label>
                <select
                  className="select"
                  value={draftCurrency}
                  disabled={currencyLocked}
                  title={currencyLocked ? "Το νόμισμα κλειδώνει όταν υπάρχουν γραμμές από πηγή." : undefined}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDraftCurrency(next);
                    // Keep custom lines consistent with header currency when editable.
                    setLines((prev) =>
                      prev.map((l) => (l.sourceId.startsWith("custom_") ? { ...l, currency: next } : l))
                    );
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="field">
                <label>Προθεσμία Εξόφλησης *</label>
                <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <details
                open={showRelated}
                style={{ border: "1px solid var(--c-border)", borderRadius: "var(--radius-md)", padding: 10 }}
              >
                <summary style={{ cursor: "pointer", userSelect: "none" }}>
                  <span style={{ fontWeight: 650 }}>Σχετικό Παραστατικό</span>
                  <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                    (προαιρετικό)
                  </span>
                </summary>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 12 }}>
                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="checkbox" checked={relatedEnabled} onChange={(e) => setRelatedEnabled(e.target.checked)} />
                      Συσχέτιση με άλλο παραστατικό
                    </label>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Χρησιμοποιήστε το όταν πρόκειται για πιστωτικό/διόρθωση ή όταν χρειάζεται επίσημη συσχέτιση.
                    </div>
                  </div>

                  {showRelated ? (
                    <>
                      <div className="field">
                        <label>Αναφορά / Ref</label>
                        <input
                          className="input"
                          placeholder="π.χ. INV-2026-01002"
                          value={relatedReference}
                          onChange={(e) => setRelatedReference(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Αριθμός</label>
                        <input
                          className="input"
                          placeholder="π.χ. 102"
                          value={relatedNumber}
                          onChange={(e) => setRelatedNumber(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>MARK (προαιρετικό)</label>
                        <input
                          className="input"
                          placeholder="π.χ. 4000123456789"
                          value={relatedMark}
                          onChange={(e) => setRelatedMark(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Σημείωση συσχέτισης</label>
                        <input
                          className="input"
                          placeholder="π.χ. Πιστωτικό για διόρθωση ποσότητας"
                          value={relatedNote}
                          onChange={(e) => setRelatedNote(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="muted" style={{ fontSize: 12, gridColumn: "1 / -1" }}>
                      Ενεργοποιήστε τη συσχέτιση για να εισάγετε στοιχεία.
                    </div>
                  )}
                </div>
              </details>

              {showMovement ? (
                <details open style={{ border: "1px solid var(--c-border)", borderRadius: "var(--radius-md)", padding: 10 }}>
                  <summary style={{ cursor: "pointer", userSelect: "none" }}>
                    <span style={{ fontWeight: 650 }}>Στοιχεία Διακίνησης</span>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                      (μόνο για παραστατικά διακίνησης)
                    </span>
                  </summary>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 12 }}>
                    <div className="field">
                      <label>Σκοπός Διακίνησης</label>
                      <input
                        className="input"
                        placeholder="π.χ. Πώληση / Μεταφορά / Επιστροφή"
                        value={movementPurpose}
                        onChange={(e) => setMovementPurpose(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Τρόπος Διακίνησης</label>
                      <select className="select" value={movementTransportMode} onChange={(e) => setMovementTransportMode(e.target.value)}>
                        <option value="">—</option>
                        <option value="Ιδιόκτητο">Ιδιόκτητο</option>
                        <option value="Μεταφορέας">Μεταφορέας</option>
                        <option value="Τρίτος / Courier">Τρίτος / Courier</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Τόπος Φόρτωσης</label>
                      <input
                        className="input"
                        placeholder="π.χ. Αποθήκη Αθηνών"
                        value={movementLoadingPlace}
                        onChange={(e) => setMovementLoadingPlace(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Τόπος Παράδοσης / Ολοκλήρωσης</label>
                      <input
                        className="input"
                        placeholder="π.χ. Έδρα πελάτη"
                        value={movementDeliveryPlace}
                        onChange={(e) => setMovementDeliveryPlace(e.target.value)}
                      />
                    </div>

                    {showCarrierField ? (
                      <div className="field">
                        <label>Μεταφορέας</label>
                        <input
                          className="input"
                          placeholder="π.χ. Example Transport SA"
                          value={movementCarrier}
                          onChange={(e) => setMovementCarrier(e.target.value)}
                        />
                      </div>
                    ) : null}

                    {showThirdRecipientField ? (
                      <div className="field">
                        <label>Παραλήπτης / Τρίτος Παραλήπτης</label>
                        <input
                          className="input"
                          placeholder="π.χ. Παραλαβή από τρίτο"
                          value={movementRecipientThirdParty}
                          onChange={(e) => setMovementRecipientThirdParty(e.target.value)}
                        />
                      </div>
                    ) : null}

                    {!showCarrierField && !showThirdRecipientField ? (
                      <div className="muted" style={{ fontSize: 12, gridColumn: "1 / -1" }}>
                        Συμπληρώστε επιπλέον στοιχεία (μεταφορέα/παραλήπτη) μόνο όταν επιλεγεί αντίστοιχος τρόπος διακίνησης.
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </div>
          </Card>

          <Card title="Γραμμές Τιμολογίου">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Η σύνθεση βασίζεται σε επιλεγμένη χρεώσιμη εργασία από την πηγή.
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Popover
                    placement="bottom-end"
                    open={addWorkMenuOpen}
                    onOpenChange={(open) => setAddWorkMenuOpen(open)}
                    trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                      <button ref={ref} className="btn btn--sm primary" onClick={onClick} aria-expanded={ariaExpanded}>
                        <span className="row" style={{ gap: 8, alignItems: "center" }}>
                          <i className="bi bi-plus-lg" aria-hidden="true" />
                          Προσθήκη εργασίας
                        </span>
                      </button>
                    )}
                  >
                    <div className="popover-menu" role="menu" aria-label="Προσθήκη εργασίας">
                      <button
                        className="popover-menu__item"
                        role="menuitem"
                        onClick={() => {
                          setAddWorkMenuOpen(false);
                          setSourcePickerOpen(true);
                        }}
                      >
                        <span className="popover-menu__left">
                          <span className="popover-menu__icon" aria-hidden="true">
                            <i className="bi bi-receipt" aria-hidden="true" />
                          </span>
                          <span className="popover-menu__label">Χρεώσιμη εργασία</span>
                        </span>
                      </button>
                      <button
                        className="popover-menu__item"
                        role="menuitem"
                        onClick={() => {
                          setAddWorkMenuOpen(false);
                          addCustomBillableItem();
                        }}
                      >
                        <span className="popover-menu__left">
                          <span className="popover-menu__icon" aria-hidden="true">
                            <i className="bi bi-pencil-square" aria-hidden="true" />
                          </span>
                          <span className="popover-menu__label">Προσαρμοσμένη εργασία</span>
                        </span>
                      </button>
                    </div>
                  </Popover>
                </div>
              </div>
              <div
                style={{
                  overflow: "auto",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 6,
                  background: "var(--c-surface)"
                }}
              >
                <table className="table">
                  <thead>
                    <tr>
                      <th>Πηγή/Ref</th>
                      <th>Περιγραφή</th>
                      <th className="num">Qty</th>
                      <th>Μον.</th>
                      <th>Κατ. Εσόδων (ΣΤ.9)</th>
                      <th>Ε3</th>
                      <th className="num">Τιμή</th>
                      <th className="num">Disc %</th>
                      <th>ΦΠΑ</th>
                      <th className="num">Καθαρή</th>
                      <th className="num">ΦΠΑ</th>
                      <th className="num">Σύνολο</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedLines.map((l) => {
                      const isCustom = l.sourceId.startsWith("custom_");
                      const net = computeLineNet(l);
                      const vat = computeLineVat(l);
                      const vatCat = (l.vatCategory ?? "Standard 24%") as VatCategory;
                      const total = net + vat;

                      return (
                        <React.Fragment key={l.id}>
                          <tr>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                              <div style={{ display: "grid", gap: 4 }}>
                                <div>{isCustom ? "—" : l.sourceId}</div>
                                <div className="muted" style={{ fontSize: 11 }}>
                                  <Chip tone="neutral">{isCustom ? "Custom" : "Source"}</Chip>
                                </div>
                              </div>
                            </td>
                            <td>
                              <input
                                className="input"
                                style={{ width: "100%" }}
                                value={l.description}
                                onChange={(e) => updateLineDescription(l.id, e.target.value)}
                                aria-label="Περιγραφή γραμμής"
                              />
                            </td>
                            <td className="num">
                              <input
                                className="input"
                                style={{ width: 84 }}
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(l.quantity ?? 1)}
                                disabled={!isCustom}
                                onChange={(e) => updateLineQuantity(l.id, e.target.value)}
                                aria-label="Ποσότητα"
                              />
                            </td>
                            <td>
                              <select
                                className="select"
                                style={{ width: 120 }}
                                value={l.unit ?? "ea"}
                                disabled={!isCustom}
                                onChange={(e) => updateLineUnit(l.id, e.target.value)}
                                aria-label="Μονάδα μέτρησης"
                              >
                                {UNIT_TYPE_OPTIONS.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="select"
                                style={{ width: 190 }}
                                value={l.st9IncomeCategory ?? ""}
                                onChange={(e) => patchLine(l.id, { st9IncomeCategory: e.target.value || undefined })}
                                aria-label="Κατηγορία Εσόδων (ΣΤ.9)"
                              >
                                <option value="">—</option>
                                {ST9_INCOME_CATEGORY_OPTIONS.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="select"
                                style={{ width: 190 }}
                                value={l.e3IncomeClassification ?? ""}
                                onChange={(e) => patchLine(l.id, { e3IncomeClassification: e.target.value || undefined })}
                                aria-label="Χαρακτηρισμός Ε3"
                              >
                                <option value="">—</option>
                                {E3_CLASSIFICATION_OPTIONS.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="num">
                              <input
                                className="input"
                                style={{ width: 104 }}
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(l.unitPrice ?? 0)}
                                disabled={!isCustom}
                                onChange={(e) => updateLineUnitPrice(l.id, e.target.value)}
                                aria-label="Τιμή μονάδας"
                              />
                            </td>
                            <td className="num">
                              <input
                                className="input"
                                style={{ width: 84 }}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={String(l.discountPct ?? 0)}
                                onChange={(e) => updateLineDiscountPct(l.id, e.target.value)}
                                aria-label="Έκπτωση %"
                              />
                            </td>
                            <td>
                              <select
                                className="select"
                                value={vatCat}
                                onChange={(e) => updateLineVatCategory(l.id, e.target.value as VatCategory)}
                                aria-label="Κατηγορία ΦΠΑ"
                              >
                                {VAT_OPTIONS.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              {formatCurrency(net, l.currency)}
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              {formatCurrency(vat, l.currency)}
                            </td>
                            <td className="num" style={{ whiteSpace: "nowrap" }}>
                              {formatCurrency(total, l.currency)}
                            </td>
                            <td className="num">
                              <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                                <button
                                  className="btn btn--sm ghost"
                                  onClick={() => remove(l.sourceId)}
                                  aria-label="Αφαίρεση γραμμής"
                                >
                                  <i className="bi bi-x-lg" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                    {hasInvalidCustomRows ? (
                      <tr>
                        <td colSpan={13} style={{ padding: 10 }}>
                          <div className="muted" style={{ color: "#92400e", fontSize: 12 }}>
                            Οι προσαρμοσμένες γραμμές απαιτούν περιγραφή, ποσότητα &gt; 0 και τιμή μονάδας &gt; 0.
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="muted" style={{ padding: 16 }}>
                          Κενό προσχέδιο. Πατήστε «Προσθήκη εργασίας» για να προσθέσετε χρεώσιμη ή προσαρμοσμένη εργασία.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card title="Παρατηρήσεις">
            <textarea
              className="input"
              style={{ minHeight: 100, paddingTop: 8, width: "100%", resize: "vertical", lineHeight: 1.45 }}
              placeholder="Κείμενο που προορίζεται για τον πελάτη."
              value={externalNote}
              onChange={(e) => setExternalNote(e.target.value)}
            />
          </Card>

          <Card title="Σημείωμα (εσωτερικό)">
            <textarea
              className="input"
              style={{ minHeight: 100, paddingTop: 8, width: "100%", resize: "vertical", lineHeight: 1.45 }}
              placeholder="Π.χ. παρατηρήσεις, οδηγίες έκδοσης…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>
        </div>

        <Card title="Σύνολα και Όροι">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Γραμμές</span>
              <strong>{lines.length}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Καθαρή αξία</span>
              <strong>{formatCurrency(totalNet, currency)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">ΦΠΑ (προεπισκόπηση)</span>
              <strong>{formatCurrency(totalVat, currency)}</strong>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Σύνολο</span>
              <strong>{formatCurrency(totalGross, currency)}</strong>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Όροι: {dueTerms} · Λήξη: {dueDatePreview}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Κανόνας: δεν τιμολογούμε δεσμευμένη αλλού ή ήδη τιμολογημένη εργασία.
            </div>
            {hasInvalidCustomRows ? (
              <div className="muted" style={{ color: "#92400e", fontSize: 12 }}>
                Διορθώστε τις προσαρμοσμένες γραμμές πριν από αποθήκευση, έλεγχο ή έκδοση.
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <SidePanel
        open={reviewOpen}
        title="Έλεγχος Προσχεδίου"
        onClose={() => setReviewOpen(false)}
        size="lg"
      >
        <div className="finance-stack" style={{ gap: 14 }}>

          {isStale ? (
            <div className="finance-warning-box">
              <div className="finance-warning-box__title">Παρωχημένο πρόχειρο</div>
              <div className="finance-warning-box__body">
                Αυτό το πρόχειρο είναι παρωχημένο για {staleDays} ημέρες. Ελέγξτε τις γραμμές πριν την υποβολή.
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Card title="Στοιχεία Χρέωσης">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 0.9fr) minmax(0, 1.1fr)", gap: 10, fontSize: 13 }}>
                <div className="muted">Πελάτης</div>
                <div>{selectedClient || "—"}</div>

                <div className="muted">Έργο</div>
                <div>{selectedProject || "—"}</div>

                <div className="muted">Οντότητα τιμολόγησης</div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{billingEntity || "—"}</div>

                <div className="muted">Αρ. Σύμβασης</div>
                <div>{contractRef || "—"}</div>
              </div>
            </Card>

            <Card title="Παραστατικό & Όροι">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 0.9fr) minmax(0, 1.1fr)", gap: 10, fontSize: 13 }}>
                <div className="muted">Είδος παραστατικού</div>
                <div>{docTypeMeta(documentType).label}</div>

                <div className="muted">Σειρά / Αρ. Τιμολογίου</div>
                <div>{`${invoiceSeries} / ${invoiceNumber || "—"}`}</div>

                <div className="muted">Αναφορά</div>
                <div>{customerReference || "—"}</div>

                <div className="muted">Θέμα</div>
                <div>{invoiceSubject || "—"}</div>

                <div className="muted">Ημερομηνία έκδοσης</div>
                <div>{issueDate || "—"}</div>

                <div className="muted">Όροι</div>
                <div>{dueTerms}</div>

                <div className="muted">Τρόπος πληρωμής</div>
                <div>{paymentWay ? PAYMENT_WAY_OPTIONS.find((o) => o.id === paymentWay)?.label ?? paymentWay : "—"}</div>

                <div className="muted">Λήξη</div>
                <div>{dueDatePreview || "—"}</div>
              </div>
            </Card>
          </div>

          <Card title="Γραμμές (προεπισκόπηση)">
            <div className="finance-table-wrap">
              <table className="table" style={{ marginBottom: 0, minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Περιγραφή</th>
                    <th className="num">Καθαρή</th>
                    <th className="num">ΦΠΑ</th>
                    <th className="num">Σύνολο</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedLines.map((l) => {
                    const net = computeLineNet(l);
                    const vat = computeLineVat(l);
                    const total = net + vat;
                    return (
                      <tr key={l.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.sourceId.startsWith("custom_") ? "—" : l.sourceId}</td>
                        <td>{l.description}</td>
                        <td className="num">{formatCurrency(net, l.currency)}</td>
                        <td className="num">{formatCurrency(vat, l.currency)}</td>
                        <td className="num">{formatCurrency(total, l.currency)}</td>
                      </tr>
                    );
                  })}
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted" style={{ padding: 16 }}>
                        Κενό πρόχειρο. Προσθέστε μη τιμολογημένη εργασία πρώτα.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Card title="Ανάλυση ΦΠΑ">
              <div className="finance-table-wrap">
                <table className="table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Συντ. ΦΠΑ</th>
                      <th className="num">Καθ. αξία</th>
                      <th className="num">Αξία ΦΠΑ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      normalizedLines.reduce((acc, l) => {
                        const cat = (l.vatCategory ?? "Standard 24%") as VatCategory;
                        const rate = vatRateFor(cat);
                        const key = String(rate);
                        const cur = acc.get(key) ?? { rate, net: 0, vat: 0 };
                        cur.net += computeLineNet(l);
                        cur.vat += computeLineVat(l);
                        acc.set(key, cur);
                        return acc;
                      }, new Map<string, { rate: number; net: number; vat: number }>())
                    )
                      .map(([, v]) => v)
                      .sort((a, b) => b.rate - a.rate)
                      .map((v) => (
                        <tr key={v.rate}>
                          <td>{`${Math.round(v.rate * 100)}%`}</td>
                          <td className="num">{formatCurrency(v.net, currency)}</td>
                          <td className="num">{formatCurrency(v.vat, currency)}</td>
                        </tr>
                      ))}
                    <tr>
                      <td style={{ fontWeight: 650 }}>Σύνολο</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(totalNet, currency)}</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(totalVat, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Ανάλυση Συνόλων">
              <div className="finance-table-wrap">
                <table className="table" style={{ marginBottom: 0 }}>
                  <tbody>
                    <tr>
                      <td className="muted">Αξία προ έκπτωσης</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(totalPreDiscount, currency)}</td>
                    </tr>
                    <tr>
                      <td className="muted">Έκπτωση τιμολογίου</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(totalDiscount, currency)}</td>
                    </tr>
                    <tr>
                      <td className="muted">Αξία μετά έκπτωσης & επιβαρύνσεις</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(netAfterDiscountAndCharges, currency)}</td>
                    </tr>
                    <tr>
                      <td className="muted">Συνολικό ποσό ΦΠΑ</td>
                      <td className="num" style={{ fontWeight: 650 }}>{formatCurrency(totalVat, currency)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 750 }}>Τελική αξία</td>
                      <td className="num" style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(grandTotal, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Σημειώσεις">
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Παρατηρήσεις</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.45 }}>
                    {externalNote.trim() ? externalNote : <span className="muted">—</span>}
                  </div>
                </div>
                <div className="divider" />
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Σημείωμα (εσωτερικό)</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.45 }}>
                    {notes.trim() ? notes : <span className="muted">—</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="finance-sticky-batchbar">
            <div className="finance-sticky-batchbar__inner">
              <button className="btn" onClick={() => setReviewOpen(false)}>
                Πίσω στη σύνθεση
              </button>
              <div className="row">
                <button className="btn" disabled={lines.length === 0 || hasInvalidCustomRows} onClick={() => setConfirmSaveOpen(true)}>
                  Αποθήκευση Προσχεδίου
                </button>
                <button
                  className="btn primary"
                  disabled={lines.length === 0 || hasInvalidCustomRows || !perms.canIssueInvoice}
                  title={!perms.canIssueInvoice ? "Δεν έχετε δικαίωμα έκδοσης." : undefined}
                  onClick={() => submitCurrentDraft()}
                >
                  Υποβολή για Έκδοση
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidePanel>

      <SidePanel
        open={sourcePickerOpen}
        title="Μη Τιμολογημένη Εργασία"
        onClose={() => setSourcePickerOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="filters">
            <div className="field" style={{ minWidth: 200 }}>
              <label>Πελάτης</label>
              <Popover
                placement="bottom-start"
                open={clientPickerOpen}
                onOpenChange={(open) => {
                  setClientPickerOpen(open);
                  if (!open) setClientSearch("");
                }}
                trigger={({ ref, onClick, "aria-expanded": ariaExpanded }) => (
                  <button
                    ref={ref}
                    type="button"
                    className="select"
                    onClick={onClick}
                    aria-expanded={ariaExpanded}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selectedClient || "—"}</span>
                    <i className="bi bi-chevron-down" aria-hidden="true" />
                  </button>
                )}
              >
                <div className="popover-menu" role="menu" aria-label="Επιλογή πελάτη">
                  <div style={{ padding: 10 }}>
                    <input
                      className="input"
                      placeholder="Αναζήτηση πελάτη…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: 220, overflow: "auto" }}>
                    {filteredClientOptions.map((c) => (
                      <button
                        key={c}
                        className="popover-menu__item"
                        role="menuitem"
                        onClick={() => {
                          setSelectedClient(c);
                          setClientPickerOpen(false);
                          setClientSearch("");
                        }}
                        aria-current={c === selectedClient}
                      >
                        <span className="popover-menu__left">
                          <span className="popover-menu__icon" aria-hidden="true">
                            <i className={`bi ${c === selectedClient ? "bi-check2" : "bi-building"}`} />
                          </span>
                          <span>{c}</span>
                        </span>
                      </button>
                    ))}
                    {filteredClientOptions.length === 0 ? (
                      <div className="muted" style={{ padding: 10, fontSize: 12 }}>
                        Δεν βρέθηκαν πελάτες.
                      </div>
                    ) : null}
                  </div>

                  <div className="divider" />
                  <button
                    className="popover-menu__item"
                    role="menuitem"
                    onClick={() => {
                      setNewClientOpen(true);
                      setClientPickerOpen(false);
                      setNewClientName(clientSearch.trim());
                    }}
                  >
                    <span className="popover-menu__left">
                      <span className="popover-menu__icon" aria-hidden="true">
                        <i className="bi bi-plus-lg" />
                      </span>
                      <span>Νέος πελάτης</span>
                    </span>
                  </button>
                </div>
              </Popover>
            </div>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Έργο</label>
              <select className="select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                {Array.from(
                  new Set(
                    billableWork
                      .filter((w) => w.client === selectedClient)
                      .map((w) => w.project ?? "—")
                  )
                ).map((p) => (
                  <option key={p} value={p === "—" ? "" : p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 240 }}>
              <label>Αναζήτηση εργασίας</label>
              <input
                className="input"
                placeholder="Κωδικός, τίτλος ή περιγραφή"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="billable-picker-summary">
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className="muted" style={{ fontSize: 12 }}>
                {pool.length} αποτελέσματα
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {pool.filter((w) => selectedSourceIds.has(w.id)).length} ήδη σε προσχέδιο
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {availableCount} διαθέσιμα · {reservedByOther} δεσμευμένα αλλού · {invoicedCount} τιμολογημένα
              </span>
            </div>
          </div>

          <div style={{ overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
              {pool.length === 0 ? (
                <div className="muted" style={{ padding: 16 }}>
                  Δεν υπάρχουν διαθέσιμες εγγραφές για αυτή την επιλογή. Αλλάξτε πελάτη/έργο ή καθαρίστε την αναζήτηση.
                </div>
              ) : null}

              {pool.map((w) => {
                const isSelected = selectedSourceIds.has(w.id);
                const displayStatus: BillableWorkItem["status"] | "Reserved" = isSelected ? "Reserved" : w.status;
                const reservedElsewhere =
                  w.status === "Reserved" && !!w.reservedByDraftId && w.reservedByDraftId !== resolvedDraftId;
                const invoiced = w.status === "Invoiced" && !!w.invoicedByInvoiceId;
                const available = w.status === "Available";
                const stateTone = isSelected ? "success" : toneForWorkStatus(displayStatus);
                const workMeta = `${w.client} · ${w.project ?? "—"} · ${w.date} · ${w.id}`;

                return (
                  <div key={w.id} className="billable-picker-card">
                    <div className="billable-picker-card__header">
                      <div className="billable-picker-card__title" title={w.description}>
                        {w.description}
                      </div>
                      <div className="billable-picker-card__amount num">{formatCurrency(computeWorkAmount(w), w.currency)}</div>
                    </div>

                    <div className="billable-picker-card__meta muted">{workMeta}</div>

                    {w.billingType === "Hourly" ? (
                      <div className="billable-picker-card__detail muted">
                        {(w.hours ?? 0).toFixed(2)}h × {formatCurrency(w.rate ?? 0, w.currency)} /h
                      </div>
                    ) : null}

                    <div className="billable-picker-card__state">
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <Chip tone="neutral">{labelForBillingType(w.billingType)}</Chip>
                        <Chip tone={stateTone}>
                          {isSelected ? "Προστέθηκε" : labelForWorkStatus(displayStatus as BillableWorkItem["status"])}
                        </Chip>
                      </div>
                      {reservedElsewhere ? (
                        <div className="billable-picker-card__ref muted">Δεσμευμένο στο {w.reservedByDraftId}</div>
                      ) : invoiced ? (
                        <div className="billable-picker-card__ref muted">Τιμολογήθηκε στο {w.invoicedByInvoiceId}</div>
                      ) : null}
                    </div>

                    <div className="billable-picker-card__action">
                      {available ? (
                        <button className="btn primary btn--sm" onClick={() => add(w)}>
                          Προσθήκη
                        </button>
                      ) : isSelected ? (
                        <button className="btn btn--sm" disabled title="Ήδη στο πρόχειρο">
                          Προστέθηκε
                        </button>
                      ) : reservedElsewhere ? (
                        <Link className="btn btn--sm" to={`/finance/revenue/drafts/${w.reservedByDraftId}/builder`}>
                          Άνοιγμα δεσμευμένου προσχεδίου
                        </Link>
                      ) : invoiced ? (
                        <Link className="btn btn--sm" to={`/finance/revenue/invoices/${w.invoicedByInvoiceId}`}>
                          Προβολή τιμολογίου
                        </Link>
                      ) : (
                        <button className="btn btn--sm" disabled>
                          Μη διαθέσιμο
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => setSourcePickerOpen(false)}>
              Κλείσιμο επιλογής
            </button>
          </div>
        </div>
      </SidePanel>

      <SidePanel open={newClientOpen} title="Νέος πελάτης" onClose={() => setNewClientOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>Όνομα πελάτη *</label>
            <input
              className="input"
              placeholder="π.χ. Example SA"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn ghost" onClick={() => setNewClientOpen(false)}>
              Ακύρωση
            </button>
            <button className="btn primary" onClick={() => saveNewClient()} disabled={!newClientName.trim()}>
              Αποθήκευση
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Prototype: ο νέος πελάτης προστίθεται τοπικά στη λίστα επιλογών.
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Απόρριψη αλλαγών"
        description={`Prototype: discarding will clear ${lines.length} selected line(s) and release reservations in this UI.`}
        confirmLabel="Απόρριψη"
        tone="danger"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          setLines(initial);
          resetBuilderForm();
          setReviewOpen(false);
          setSourcePickerOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmSaveOpen}
        title="Αποθήκευση Προσχεδίου"
        description="Prototype: αποθήκευση στο τοπικό state (χωρίς backend)."
        confirmLabel="Αποθήκευση"
        tone="neutral"
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false);
          setReviewOpen(false);
          saveCurrentDraft();
        }}
      />
    </>
  );
}

