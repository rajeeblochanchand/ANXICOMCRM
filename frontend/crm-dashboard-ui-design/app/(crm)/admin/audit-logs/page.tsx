'use client'

import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDateTime } from '@/lib/format'

export default function AuditPage() {
  return (
    <RoleGuard roles={['Admin']}>
      <AuditBody />
    </RoleGuard>
  )
}

function AuditBody() {
  const { auditLogs, userName } = useCrm()
  return (
    <>
      <PageHeader title="Audit logs" description="Security and CRM changes recorded by the API. Entries cannot be edited here." />
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No audit events yet.</p>}
          {auditLogs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 border-b pb-4 text-sm last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={log.action} />
                <span className="font-medium">{log.entity}</span>
                <span className="text-muted-foreground">{formatDateTime(log.timestamp)}</span>
              </div>
              <p className="text-muted-foreground">
                {userName(log.userId)} · {log.recordId || '—'} · {log.ipAddress || 'no IP'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
