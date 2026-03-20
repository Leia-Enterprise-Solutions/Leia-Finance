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