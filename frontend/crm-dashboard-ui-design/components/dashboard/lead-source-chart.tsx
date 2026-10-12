'use client'

import { Doughnut } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrm } from '@/components/providers/crm-provider'
import { chartPalette } from '@/lib/chart-setup'

export function LeadSourceChart() {
  const { dashboard } = useCrm()
  const data = dashboard.leadStatus.filter((item) => item.value > 0)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead status</CardTitle>
        <CardDescription>Authorized leads in the selected range</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No leads in this range.</p>
        ) : (
          <div className="mx-auto h-48 w-full max-w-56">
            <Doughnut
              data={{
                labels: data.map((item) => item.label),
                datasets: [{ data: data.map((item) => item.value), backgroundColor: data.map((_, index) => chartPalette[index % chartPalette.length]) }],
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </div>
        )}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {data.map((item, index) => (
            <li key={item.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: chartPalette[index % chartPalette.length] }} />
                <span className="truncate text-muted-foreground">{item.label}</span>
              </span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </li>
          ))}
        </ul>
        {total > 0 && <p className="text-center text-xs text-muted-foreground">{total} leads</p>}
      </CardContent>
    </Card>
  )
}
