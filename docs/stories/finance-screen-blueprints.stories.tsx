import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type Signal = {
  label: string;
  tone: Tone;
};

type ScreenBlueprintProps = {
  area: string;
  screen: string;
  purpose: string;
  primaryQuestion: string;
  primaryAction: string;
  sections: string[];
  mustVisible: string[];
  signals?: Signal[];
  rows?: Array<Record<string, string>>;
};

const toneStyles: Record<Tone, React.CSSProperties> = {
  neutral: { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
  primary: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  success: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
  warning: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
  danger: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
};

function Chip({ label, tone }: Signal) {
  return (
    <span
      style={{
        ...toneStyles[tone],
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 600,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {label}
    </span>
  );
}

function ScreenBlueprint({
  area,
  screen,
  purpose,
  primaryQuestion,
  primaryAction,
  sections,
  mustVisible,
  signals = [],
  rows = [],
}: ScreenBlueprintProps) {
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, sans-serif',
        background: '#ffffff',
        color: '#111827',
        padding: 24,
        borderRadius: 20,
        border: '1px solid #e5e7eb',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: '#6b7280', textTransform: 'uppercase' }}>
          {area}
        </div>
        <h2 style={{ margin: '8px 0 6px', fontSize: 30, lineHeight: 1.15 }}>{screen}</h2>
        <p style={{ margin: 0, fontSize: 16, color: '#4b5563', maxWidth: 900 }}>{purpose}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Primary Question</div>
          <div style={{ fontSize: 15, marginBottom: 16 }}>{primaryQuestion}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Primary Action</div>
          <div style={{ fontSize: 15 }}>{primaryAction}</div>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Operational Signals</div>
          <div>
            {signals.length ? signals.map((signal) => <Chip key={signal.label} {...signal} />) : <span style={{ color: '#6b7280' }}>No signals defined</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>Layout Regions</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {sections.map((section) => (
              <li key={section}>{section}</li>
            ))}
          </ul>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>Must-visible Fields</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {mustVisible.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>Example Table Shape</div>
        {rows.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 700 }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#6b7280' }}>No table preview</div>
        )}
      </div>
    </div>
  );
}

const meta = {
  title: 'Finance/Blueprint Screens',
  component: ScreenBlueprint,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ScreenBlueprint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverviewDashboard: Story = {
  args: {
    area: 'Monitoring Shell',
    screen: 'Finance Overview Dashboard',
    purpose: 'Show financial exposure and route the user to the correct operational worklist.',
    primaryQuestion: 'What needs attention right now across revenue, spend, and control signals?',
    primaryAction: 'Click a KPI or drilldown shortcut to open a pre-filtered worklist.',
    sections: ['Top bar filters', 'KPI strip', 'Trend row', 'Exposure row', 'Overdue focus panel', 'Drilldown shortcuts'],
    mustVisible: ['Gross Invoiced', 'Income Collected', 'Outstanding Receivables', 'Outstanding Payables', 'Overdue signals', 'Clickable drilldown cues'],
    signals: [
      { label: 'Overdue Receivables', tone: 'danger' },
      { label: 'Blocked Payables', tone: 'warning' },
      { label: 'Budget Warning', tone: 'warning' },
    ],
    rows: [
      { Widget: 'Outstanding Receivables', Amount: '€48,200', Count: '23', Action: 'Open Collections' },
      { Widget: 'Overdue Payables', Amount: '€17,900', Count: '8', Action: 'Open Payments Queue' },
      { Widget: 'Committed Spend', Amount: '€92,000', Count: '14', Action: 'Open Budget Overview' },
    ],
  },
};

export const InvoiceDraftsList: Story = {
  args: {
    area: 'Revenue Core',
    screen: 'Invoice Drafts List',
    purpose: 'Surface drafts, stale items, and reserved lines so draft work does not disappear.',
    primaryQuestion: 'Which drafts need continuation, review, or discard right now?',
    primaryAction: 'Open a row preview and continue in the Draft Builder.',
    sections: ['Header stats', 'Filter bar', 'Drafts table', 'Side preview panel', 'Bulk action bar'],
    mustVisible: ['Draft reference', 'Owner', 'Stale age', 'Selected lines count', 'Reserved lines indicator', 'Review-needed flag'],
    signals: [
      { label: 'Draft', tone: 'primary' },
      { label: 'Stale Draft', tone: 'warning' },
      { label: 'Review Needed', tone: 'danger' },
    ],
    rows: [
      { Draft: 'DR-1042', Client: 'Acme SA', Owner: 'Sofia', 'Stale Age': '12 days', Reserved: '12 items' },
      { Draft: 'DR-1049', Client: 'Orbit Labs', Owner: 'Nikos', 'Stale Age': '3 days', Reserved: '4 items' },
    ],
  },
};

export const InvoiceDraftBuilder: Story = {
  args: {
    area: 'Revenue Core',
    screen: 'Invoice Draft Builder',
    purpose: 'Compose an invoice draft from billable work without duplicate invoicing.',
    primaryQuestion: 'Which billable entries should become invoice lines in this draft?',
    primaryAction: 'Add valid source entries and continue to Review.',
    sections: ['Source entries pane', 'Selected lines pane', 'Totals and terms pane', 'Sticky bottom bar'],
    mustVisible: ['Source reference', 'Entry status', 'Selected line amount', 'Subtotal', 'Total', 'Due terms'],
    signals: [
      { label: 'Available', tone: 'success' },
      { label: 'Reserved in Draft', tone: 'warning' },
      { label: 'Already Invoiced', tone: 'danger' },
    ],
    rows: [
      { Entry: 'WK-2201', Description: 'UX review sprint', Status: 'Available', Amount: '€1,200' },
      { Entry: 'WK-2202', Description: 'Frontend integration', Status: 'Reserved in DR-1038', Amount: '€2,600' },
      { Entry: 'WK-2203', Description: 'Support retainer', Status: 'Already invoiced', Amount: '€900' },
    ],
  },
};

export const InvoicesList: Story = {
  args: {
    area: 'Revenue Core',
    screen: 'Invoices List',
    purpose: 'Triage issued receivables and move quickly into detail or collections.',
    primaryQuestion: 'Which issued invoices require detail review or collection follow-up?',
    primaryAction: 'Open detail or jump to Collections.',
    sections: ['Header stats', 'Filter bar', 'Invoices table', 'Side detail panel'],
    mustVisible: ['Invoice reference', 'Client', 'Issue date', 'Due date', 'Paid amount', 'Outstanding amount', 'Fiscal status'],
    signals: [
      { label: 'Issued', tone: 'primary' },
      { label: 'Partially Paid', tone: 'warning' },
      { label: 'Overdue', tone: 'danger' },
    ],
    rows: [
      { Invoice: 'INV-2026-021', Client: 'Acme SA', Due: '2026-03-10', Outstanding: '€4,800', Status: 'Overdue 10d' },
      { Invoice: 'INV-2026-024', Client: 'Nova Group', Due: '2026-03-26', Outstanding: '€1,200', Status: 'Not due' },
    ],
  },
};

export const InvoiceDetailView: Story = {
  args: {
    area: 'Revenue Core',
    screen: 'Invoice Detail View',
    purpose: 'Show the full truth of one receivable, including work, payments, and collections history.',
    primaryQuestion: 'What is the receivable state and what follow-up comes next?',
    primaryAction: 'Add collection note or continue to Collections.',
    sections: ['Sticky summary header', 'Linked work section', 'Payments section', 'Collections notes', 'Fiscal block', 'Timeline'],
    mustVisible: ['Invoice ref', 'Total', 'Paid', 'Outstanding', 'Linked work references', 'Payment allocation', 'Latest note'],
    signals: [
      { label: 'Partially Paid', tone: 'warning' },
      { label: 'Unallocated Amount', tone: 'danger' },
      { label: 'Follow-up Due Today', tone: 'warning' },
    ],
    rows: [
      { Section: 'Payment #1', Value: '€2,000', Date: '2026-03-04', Note: 'Allocated' },
      { Section: 'Payment #2', Value: '€500', Date: '2026-03-08', Note: '€200 unallocated' },
    ],
  },
};

export const CollectionsView: Story = {
  args: {
    area: 'Revenue Core',
    screen: 'Collections / Receivables View',
    purpose: 'Run collection follow-up work with overdue-driven prioritization.',
    primaryQuestion: 'Which receivables should be chased first?',
    primaryAction: 'Open the top-risk row and update follow-up context.',
    sections: ['Header totals', 'Filter bar', 'Collections table', 'Today focus panel', 'Collection side panel'],
    mustVisible: ['Outstanding amount', 'Days overdue', 'Owner', 'Expected payment date', 'Last note snippet', 'Next action'],
    signals: [
      { label: 'Due Soon', tone: 'warning' },
      { label: 'Overdue', tone: 'danger' },
      { label: 'High Risk 60+', tone: 'danger' },
    ],
    rows: [
      { Invoice: 'INV-2026-011', Client: 'Helios AE', Overdue: '64 days', Owner: 'Maria', 'Next Action': 'Call finance director' },
      { Invoice: 'INV-2026-021', Client: 'Acme SA', Overdue: '10 days', Owner: 'Sofia', 'Next Action': 'Email reminder' },
    ],
  },
};

export const PurchaseRequestsList: Story = {
  args: {
    area: 'Spend Core',
    screen: 'Purchase Requests List',
    purpose: 'Triage incoming spend requests before approval and commitment.',
    primaryQuestion: 'Which requests need decision first based on urgency and budget signal?',
    primaryAction: 'Open a request detail for approval review.',
    sections: ['Status summary row', 'Filter bar', 'Requests table', 'Side summary panel'],
    mustVisible: ['Requester', 'Department', 'Supplier', 'Estimated amount', 'Approver', 'Urgency', 'Attachment signal', 'Budget signal'],
    signals: [
      { label: 'Submitted', tone: 'primary' },
      { label: 'Urgent', tone: 'warning' },
      { label: 'Budget Breach', tone: 'danger' },
    ],
    rows: [
      { Request: 'PR-2201', Requester: 'Ops Team', Supplier: 'Dell', Amount: '€3,800', Status: 'Submitted' },
      { Request: 'PR-2204', Requester: 'Support', Supplier: 'AWS', Amount: '€1,200', Status: 'Urgent' },
    ],
  },
};

export const PurchaseRequestDetailView: Story = {
  args: {
    area: 'Spend Core',
    screen: 'Purchase Request Detail / Approval View',
    purpose: 'Support a documented approval decision with budget and attachment context.',
    primaryQuestion: 'Can this request be approved safely, or does it need escalation or changes?',
    primaryAction: 'Approve, Reject, or Request changes with a reason.',
    sections: ['Header summary', 'Request content', 'Budget context rail', 'Decision area', 'Comments thread', 'Activity timeline'],
    mustVisible: ['Supplier', 'Estimated amount', 'Budget impact', 'Attachments', 'Decision reason', 'Approval history'],
    signals: [
      { label: 'Approval Pending', tone: 'primary' },
      { label: 'Missing Attachment', tone: 'warning' },
      { label: 'Over Budget', tone: 'danger' },
    ],
    rows: [
      { Field: 'Budget Remaining', Value: '€1,000', State: 'Below request amount', Note: 'Escalation required' },
      { Field: 'Attachments', Value: '1 file', State: 'Present', Note: 'Quote attached' },
    ],
  },
};

export const SupplierBillsList: Story = {
  args: {
    area: 'Spend Core',
    screen: 'Supplier Bills / Expenses List',
    purpose: 'Surface open payables, readiness, and blocked reasons before payment execution.',
    primaryQuestion: 'Which supplier bills are ready, and which are blocked?',
    primaryAction: 'Open the bill detail and resolve the blocker.',
    sections: ['Header totals', 'Filter bar', 'Exception shortcuts', 'Bills table', 'Side panel'],
    mustVisible: ['Supplier', 'Bill reference', 'Due date', 'Amount', 'Match status', 'Readiness', 'Blocked reason', 'Attachment indicator'],
    signals: [
      { label: 'Ready for Payment', tone: 'success' },
      { label: 'Mismatch', tone: 'danger' },
      { label: 'Unlinked', tone: 'warning' },
    ],
    rows: [
      { Bill: 'SB-1034', Supplier: 'Dell', Due: '2026-03-18', Amount: '€3,800', Readiness: 'Blocked: mismatch' },
      { Bill: 'SB-1037', Supplier: 'AWS', Due: '2026-03-25', Amount: '€1,200', Readiness: 'Ready' },
    ],
  },
};

export const SupplierBillDetailView: Story = {
  args: {
    area: 'Spend Core',
    screen: 'Supplier Bill Detail View',
    purpose: 'Explain exactly why one supplier bill is ready or blocked for payment.',
    primaryQuestion: 'What must be fixed to make this payable executable?',
    primaryAction: 'Resolve the blocker or send the bill to the Payments Queue.',
    sections: ['Header summary', 'Linked request summary', 'Mismatch panel', 'Attachments', 'Payment history', 'Timeline'],
    mustVisible: ['Billed amount', 'Approved amount', 'Readiness reason', 'Attachment list', 'Linked request ref', 'Payment history'],
    signals: [
      { label: 'Blocked', tone: 'danger' },
      { label: 'Missing Due Date', tone: 'danger' },
      { label: 'Ready', tone: 'success' },
    ],
    rows: [
      { Check: 'Approved vs Billed', Result: '€3,000 vs €3,800', Status: 'Mismatch', Action: 'Escalate' },
      { Check: 'Attachments', Result: '1 missing document', Status: 'Blocked', Action: 'Add attachment' },
    ],
  },
};

export const PaymentsQueue: Story = {
  args: {
    area: 'Spend Core',
    screen: 'Payments Queue',
    purpose: 'Execute or hand off ready payables while keeping blockers visible and separate.',
    primaryQuestion: 'Which items can be paid now, and which still need resolution?',
    primaryAction: 'Select ready items and use the batch action.',
    sections: ['Segment tabs', 'Queue table', 'Detail side panel', 'Sticky batch bar'],
    mustVisible: ['Selection state', 'Ready vs Blocked segmentation', 'Due context', 'Blocked reason', 'Scheduled vs Executed distinction'],
    signals: [
      { label: 'Prepared (UI only)', tone: 'neutral' },
      { label: 'Scheduled', tone: 'primary' },
      { label: 'Executed / Paid', tone: 'success' },
      { label: 'Blocked', tone: 'danger' },
    ],
    rows: [
      { Bill: 'SB-1037', Supplier: 'AWS', Segment: 'Ready', Amount: '€1,200', State: 'Selected for batch' },
      { Bill: 'SB-1034', Supplier: 'Dell', Segment: 'Blocked', Amount: '€3,800', State: 'Mismatch amount' },
    ],
  },
};

export const BudgetOverview: Story = {
  args: {
    area: 'Supporting Control Layer',
    screen: 'Budget Overview',
    purpose: 'Show budget pressure, remaining capacity, and variance drivers.',
    primaryQuestion: 'Where are we approaching or exceeding budget?',
    primaryAction: 'Open a drilldown row to inspect commitments and actuals.',
    sections: ['Version selector', 'Period selector', 'Summary KPIs', 'Breakdown table', 'Drilldown panel'],
    mustVisible: ['Budgeted', 'Committed', 'Actual Paid', 'Remaining', 'Variance', 'Clickable breakdown rows'],
    signals: [
      { label: 'Healthy', tone: 'success' },
      { label: 'Warning', tone: 'warning' },
      { label: 'Breach', tone: 'danger' },
    ],
    rows: [
      { Dimension: 'Engineering', Budgeted: '€40,000', Committed: '€31,000', 'Actual Paid': '€9,500', Signal: 'Warning' },
      { Dimension: 'Infrastructure', Budgeted: '€8,000', Committed: '€7,500', 'Actual Paid': '€2,100', Signal: 'Breach risk' },
    ],
  },
};

export const AuditTrail: Story = {
  args: {
    area: 'Supporting Control Layer',
    screen: 'Audit Trail / Activity Log',
    purpose: 'Provide evidence and traceability for actions across finance records.',
    primaryQuestion: 'Who changed what, when, and on which record?',
    primaryAction: 'Open an event and jump to the target record.',
    sections: ['Filter row', 'Chronological log', 'Event detail panel', 'Target record link'],
    mustVisible: ['Timestamp', 'Actor', 'Action', 'Target reference', 'Source module', 'Before/after summary'],
    signals: [
      { label: 'Status Change', tone: 'primary' },
      { label: 'Amount Change', tone: 'warning' },
      { label: 'Payment Registered', tone: 'success' },
    ],
    rows: [
      { Time: '2026-03-20 10:12', Actor: 'Sofia', Action: 'Approved request', Target: 'PR-2201' },
      { Time: '2026-03-20 11:05', Actor: 'System', Action: 'Payment registered', Target: 'INV-2026-021' },
    ],
  },
};

export const EmployeeCostView: Story = {
  args: {
    area: 'Supporting Control Layer',
    screen: 'Employee Cost View',
    purpose: 'Show employee cost concentration and billable split with permission-aware visibility.',
    primaryQuestion: 'Where is labor cost concentrated, and where is non-billable share high?',
    primaryAction: 'Open a team or employee drilldown.',
    sections: ['Period controls', 'Grouping selector', 'Summary KPIs', 'Cost table', 'Allocation drilldown'],
    mustVisible: ['Team or employee label', 'Total labor cost', 'Billable split', 'Allocation insight', 'Visibility restriction banner'],
    signals: [
      { label: 'High Non-Billable Share', tone: 'warning' },
      { label: 'Visibility Restricted', tone: 'neutral' },
      { label: 'Missing Allocation Data', tone: 'danger' },
    ],
    rows: [
      { Group: 'Frontend', Cost: '€12,400', Billable: '58%', Signal: 'Warning' },
      { Group: 'Operations', Cost: '€8,100', Billable: '22%', Signal: 'High non-billable share' },
    ],
  },
};
