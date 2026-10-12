'use client'

import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrm } from '@/components/providers/crm-provider'
import { chartPalette } from '@/lib/chart-setup'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'

export function RevenueChart() {
  const { dashboard } = useCrm()
  const monthlySales = dashboard.monthlySales
  const total = monthlySales.reduce((sum, month) => sum + month.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue performance</CardTitle>
        <CardDescription>Won opportunity amounts by month</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(total)}</span>
          <span className="text-sm text-muted-foreground">closed won</span>
        </div>
        {monthlySales.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No won opportunities in this range.</p>
        ) : (
          <div className="h-64">
            <Bar
              data={{
                labels: monthlySales.map((point) => point.label),
                datasets: [{ label: 'Won revenue', data: monthlySales.map((point) => point.value), backgroundColor: chartPalette[0], borderRadius: 6 }],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: (value) => formatCompactCurrency(Number(value)) } } },
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
