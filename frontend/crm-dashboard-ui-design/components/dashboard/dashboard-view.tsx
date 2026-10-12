'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarClockIcon, HandshakeIcon, PlusIcon, TargetIcon, TrophyIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/crm/kpi-card'
import { PageHeader } from '@/components/layout/page-header'
import { useCrm } from '@/components/providers/crm-provider'
import { LeadSourceChart } from '@/components/dashboard/lead-source-chart'
import { PipelineCard } from '@/components/dashboard/pipeline-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopDeals } from '@/components/dashboard/top-deals'
import { UpcomingFollowUps } from '@/components/dashboard/upcoming-follow-ups'
import { formatCompactCurrency, todayISO } from '@/lib/format'
import { AppSelect } from '@/components/forms/app-select'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function rangeDates(range: string) {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  if (range === 'today') return { from: end, to: end }
  if (range === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return { from: start.toISOString().slice(0, 10), to: end }
  }
  if (range === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: start.toISOString().slice(0, 10), to: end }
  }
  return {}
}

export function DashboardView() {
  const { currentUser, dashboard, followUps, loadDashboard } = useCrm()
  const [range, setRange] = useState('all')
  if (!currentUser) return null

  const today = todayISO()
  const planned = followUps.filter((f) => f.status === 'Planned')
  const overdue = planned.filter((f) => f.date.slice(0, 10) < today).length
  const dueToday = planned.filter((f) => f.date.slice(0, 10) === today).length
  const decided = dashboard.wonOpportunities + dashboard.lostOpportunities
  const winRate = decided ? Math.round((dashboard.wonOpportunities / decided) * 100) : 0
  const scope =
    currentUser.role === 'SalesExecutive' ? 'Here is your personal pipeline for today.' : 'Here is how your team is performing today.'

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${currentUser.name.split(' ')[0]}`}
        description={scope}
        actions={
          <>
            <AppSelect
              value={range}
              onValueChange={(value) => {
                setRange(value)
                const dates = rangeDates(value)
                void loadDashboard(dates.from, dates.to)
              }}
              items={[
                { label: 'All time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'This week', value: 'week' },
                { label: 'This month', value: 'month' },
              ]}
              ariaLabel="Dashboard date range"
            />
            <Button variant="outline" render={<Link href="/leads/new" />} nativeButton={false}>
              <TargetIcon data-icon="inline-start" />
              New lead
            </Button>
            <Button render={<Link href="/opportunities/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              New opportunity
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total customers" value={dashboard.totalCustomers} icon={UsersIcon} tone="blue" />
        <KpiCard label="Open leads" value={dashboard.openLeads} icon={TargetIcon} tone="violet" hint={`${dashboard.totalLeads} total`} />
        <KpiCard label="Open opportunities" value={dashboard.openOpportunities} icon={HandshakeIcon} tone="amber" hint={`${dashboard.totalOpportunities} total`} />
        <KpiCard label="Weighted pipeline" value={formatCompactCurrency(dashboard.weightedPipeline)} icon={WalletIcon} tone="green" hint="amount × probability" />
        <KpiCard label="Win rate" value={`${winRate}%`} icon={TrophyIcon} tone="green" hint={`${dashboard.wonOpportunities} won · ${dashboard.lostOpportunities} lost`} />
        <KpiCard label="Follow-ups due" value={dueToday} icon={CalendarClockIcon} tone={overdue ? 'red' : 'blue'} hint={overdue ? `${overdue} overdue need attention` : 'Nothing overdue'} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <LeadSourceChart />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopDeals />
        </div>
        <PipelineCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <UpcomingFollowUps />
        <RecentActivity />
      </section>
    </>
  )
}
