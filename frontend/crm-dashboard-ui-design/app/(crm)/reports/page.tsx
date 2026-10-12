'use client'

import { useEffect, useState } from 'react'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrm } from '@/components/providers/crm-provider'
import { api } from '@/services/api'
import { formatCurrency } from '@/lib/format'
import type { ApiRecord } from '@/lib/records'

interface ReportPage {
  items: ApiRecord[]
  total: number
}

interface ConversionReport {
  items: { id: string; name: string; status: string; source?: string | null; converted: boolean }[]
  total: number
  converted: number
  notConverted: number
  conversionRate: number
}

interface ActivityRow {
  userId?: string | null
  action: string
  count: number
}

export default function ReportsPage() {
  return (
    <RoleGuard roles={['Admin', 'Manager', 'SalesExecutive']}>
      <ReportsBody />
    </RoleGuard>
  )
}

function ReportsBody() {
  const { can, userName } = useCrm()
  const [customers, setCustomers] = useState<ReportPage | null>(null)
  const [leads, setLeads] = useState<ReportPage | null>(null)
  const [followUps, setFollowUps] = useState<ReportPage | null>(null)
  const [opportunities, setOpportunities] = useState<ReportPage | null>(null)
  const [conversion, setConversion] = useState<ConversionReport | null>(null)
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [customerReport, leadReport, followReport, opportunityReport, conversionReport] = await Promise.all([
          api.get<ReportPage>('/reports/customers?pageSize=20'),
          api.get<ReportPage>('/reports/leads?pageSize=20'),
          api.get<ReportPage>('/reports/followups?pageSize=20'),
          api.get<ReportPage>('/reports/opportunities?pageSize=20'),
          api.get<ConversionReport>('/reports/conversion?pageSize=20'),
        ])
        const userActivity = can('Admin', 'Manager') ? await api.get<ActivityRow[]>('/reports/user-activity') : []
        if (!active) return
        setCustomers(customerReport)
        setLeads(leadReport)
        setFollowUps(followReport)
        setOpportunities(opportunityReport)
        setConversion(conversionReport)
        setActivity(userActivity)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load reports')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [can])

  return (
    <>
      <PageHeader title="Reports" description="Scoped customer, lead, follow-up, opportunity and conversion reports." />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary title="Customers" value={customers?.total ?? '—'} />
        <Summary title="Leads" value={leads?.total ?? '—'} />
        <Summary title="Follow-ups" value={followUps?.total ?? '—'} />
        <Summary title="Opportunities" value={opportunities?.total ?? '—'} />
      </section>
      {conversion && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {conversion.converted} converted · {conversion.notConverted} not converted · {Number(conversion.conversionRate).toFixed(1)}%
          </CardContent>
        </Card>
      )}
      <ReportTable title="Customers" rows={customers?.items ?? []} columns={['name', 'status', 'owner']} userName={userName} />
      <ReportTable title="Leads" rows={leads?.items ?? []} columns={['name', 'status', 'source']} userName={userName} />
      <ReportTable title="Follow-ups" rows={followUps?.items ?? []} columns={['name', 'status', 'type']} userName={userName} />
      <ReportTable title="Opportunities" rows={opportunities?.items ?? []} columns={['name', 'stage', 'amount']} userName={userName} />
      {can('Admin', 'Manager') && (
        <Card>
          <CardHeader>
            <CardTitle>User activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {activity.length === 0 && <p className="text-muted-foreground">No activity in scope.</p>}
            {activity.map((row) => (
              <p key={`${row.userId}-${row.action}`}>
                {userName(row.userId ?? '')} · {row.action} · {row.count}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}

function Summary({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
    </Card>
  )
}

function ReportTable({
  title,
  rows,
  columns,
  userName,
}: {
  title: string
  rows: ApiRecord[]
  columns: string[]
  userName: (id: string) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {rows.length === 0 && <p className="text-muted-foreground">No rows in your scope.</p>}
        {rows.map((row) => (
          <p key={row.id}>
            {columns
              .map((column) => {
                if (column === 'owner') return userName(row.ownerId ?? '')
                if (column === 'amount') return formatCurrency(Number(row.amount))
                const value = row[column as keyof ApiRecord]
                return value == null || value === '' ? '—' : String(value)
              })
              .join(' · ')}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
