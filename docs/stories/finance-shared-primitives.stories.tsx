import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type StatusChipProps = {
  label: string;
  tone: Tone;
};

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

type BannerProps = {
  title: string;
  description: string;
  tone: Tone;
};

const toneMap: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: '#f3f4f6', fg: '#374151', border: '#e5e7eb' },
  primary: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  success: { bg: '#ecfdf5', fg: '#047857', border: '#a7f3d0' },
  warning: { bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  danger: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
};

function StatusChip({ label, tone }: StatusChipProps) {
  const t = toneMap[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {label}
    </span>
  );
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 18,
        borderRadius: 18,
        border: '1px solid #e5e7eb',
        background: '#fff',
        width: 280,
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 800, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#4b5563' }}>{helper}</div>
    </div>
  );
}

function Banner({ title, description, tone }: BannerProps) {
  const t = toneMap[tone];
  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, sans-serif',
        padding: 16,
        borderRadius: 16,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
        maxWidth: 700,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

const meta = {
  title: 'Finance/Shared Primitives',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StatusChips: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <StatusChip label="Draft" tone="primary" />
      <StatusChip label="Ready for Payment" tone="success" />
      <StatusChip label="Due Soon" tone="warning" />
      <StatusChip label="Overdue" tone="danger" />
      <StatusChip label="Selected for Batch" tone="neutral" />
    </div>
  ),
};

export const MetricCards: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <MetricCard label="Gross Invoiced" value="€112,400" helper="Issue date based" />
      <MetricCard label="Income Collected" value="€67,800" helper="Payment date based" />
      <MetricCard label="Outstanding Payables" value="€21,300" helper="Point-in-time open amount" />
    </div>
  ),
};

export const WarningAndBlockedBanners: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Banner
        title="Unallocated payment amount"
        description="A payment exists, but part of the amount is not allocated to the target document. The UI must not display the record as fully paid until outstanding reaches zero."
        tone="warning"
      />
      <Banner
        title="Blocked for payment"
        description="This supplier bill cannot move to execution because it is missing a critical attachment and the approved amount does not match the billed amount."
        tone="danger"
      />
    </div>
  ),
};
