'use client'

import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const roles = [
  {
    name: 'Admin',
    detail: 'Full CRM access, user administration, password reset, unlock, and the audit log.',
  },
  {
    name: 'Manager',
    detail: 'Customers, leads, opportunities, follow-ups and activities for one team. No user administration.',
  },
  {
    name: 'Sales Executive',
    detail: 'Only records owned by that user. New public registrations, when enabled, always receive this role.',
  },
]

export default function RolesPage() {
  return (
    <RoleGuard roles={['Admin']}>
      <>
        <PageHeader
          title="Roles"
          description="Each account has one ASP.NET Core Identity role. Assign it from Users. There is no separate roles API."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.name}>
              <CardHeader>
                <CardTitle>{role.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{role.detail}</CardContent>
            </Card>
          ))}
        </div>
      </>
    </RoleGuard>
  )
}
