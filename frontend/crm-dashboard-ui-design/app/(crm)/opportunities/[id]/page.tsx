'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/crm/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { useCrm } from '@/components/providers/crm-provider'
import { formatCurrency, formatDate } from '@/lib/format'

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { opportunities, relatedName, userName } = useCrm()
  const opportunity = opportunities.find((item) => item.id === id)

  if (!opportunity) {
    return (
      <PageHeader
        title="Opportunity not found"
        description="This record is outside your access or no longer active."
        actions={
          <Button variant="outline" render={<Link href="/opportunities" />} nativeButton={false}>
            Back to opportunities
          </Button>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        title={opportunity.name}
        description={relatedName('Customer', opportunity.customerId)}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Opportunities', href: '/opportunities' }, { label: opportunity.name }]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {formatCurrency(opportunity.amount)}
            <StatusBadge status={opportunity.stage} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>Probability: {opportunity.probability}%</p>
          <p>Expected close: {formatDate(opportunity.expectedCloseDate)}</p>
          <p>Owner: {userName(opportunity.ownerId)}</p>
          <p className="sm:col-span-2 text-muted-foreground">{opportunity.notes || 'No notes'}</p>
        </CardContent>
      </Card>
    </>
  )
}
