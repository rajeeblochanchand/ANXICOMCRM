'use client'

import { BuildingIcon, UserCheckIcon, UserMinusIcon, UsersIcon } from 'lucide-react'
import { CrudPage } from '@/components/crm/crud-page'
import { KpiCard } from '@/components/crm/kpi-card'
import { PersonCell } from '@/components/crm/person-cell'
import { StatusBadge } from '@/components/crm/status-badge'
import { toOptions } from '@/components/forms/app-select'
import { useCrm } from '@/components/providers/crm-provider'
import { CUSTOMER_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { includesQ, userOptions } from '@/lib/form-helpers'
import type { Customer, CustomerStatus } from '@/types'

export function CustomersView({ openNew, initialQuery }: { openNew?: boolean; initialQuery?: string }) {
  const { customers, users, scoped, userName, create, update, remove, can, currentUser } = useCrm()
  const rows = scoped(customers)

  return (
    <CrudPage<Customer>
      title="Customers"
      description="Manage accounts, contacts and ownership across your book of business."
      singular="Customer"
      rows={rows}
      openNew={openNew}
      initialQuery={initialQuery}
      canDelete={can('Admin', 'Manager')}
      searchPlaceholder="Search by name, company, email…"
      searchFn={(c, q) => includesQ(q, c.name, c.company, c.email, c.code, c.city)}
      filters={[
        { id: 'status', label: 'Status', options: CUSTOMER_STATUSES, getValue: (c) => c.status },
      ]}
      summary={
        <section aria-label="Customer summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total customers" value={rows.length} icon={UsersIcon} tone="blue" />
          <KpiCard label="Active" value={rows.filter((c) => c.status === 'Active').length} icon={UserCheckIcon} tone="green" />
          <KpiCard label="Inactive" value={rows.filter((c) => c.status === 'Inactive').length} icon={UserMinusIcon} tone="violet" />
          <KpiCard label="Companies" value={new Set(rows.map((c) => c.company)).size} icon={BuildingIcon} tone="amber" />
        </section>
      }
      columns={[
        {
          id: 'name',
          header: 'Customer',
          sortValue: (c) => c.name,
          cell: (c) => <PersonCell name={c.name} subtitle={c.email} />,
        },
        {
          id: 'company',
          header: 'Company',
          sortValue: (c) => c.company,
          cell: (c) => (
            <div className="flex flex-col">
              <span className="font-medium">{c.company}</span>
              <span className="text-xs text-muted-foreground">{c.code}</span>
            </div>
          ),
        },
        { id: 'phone', header: 'Phone', className: 'hidden lg:table-cell', sortValue: (c) => c.phone, cell: (c) => <span className="text-muted-foreground tabular-nums">{c.phone}</span> },
        { id: 'city', header: 'Location', className: 'hidden md:table-cell', sortValue: (c) => `${c.city}, ${c.state}`, cell: (c) => <span className="text-muted-foreground">{c.city}, {c.state}</span> },
        { id: 'status', header: 'Status', sortValue: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
        { id: 'owner', header: 'Owner', className: 'hidden xl:table-cell', sortValue: (c) => userName(c.ownerId), cell: (c) => <PersonCell name={userName(c.ownerId)} size="sm" /> },
        { id: 'created', header: 'Created', className: 'hidden xl:table-cell', sortValue: (c) => c.createdAt, cell: (c) => <span className="text-muted-foreground">{formatDate(c.createdAt)}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Contact name', required: true, placeholder: 'Jane Cooper' },
        { name: 'company', label: 'Company', required: true, placeholder: 'Acme Inc.' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@acme.com' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+919876543210' },
        { name: 'address', label: 'Address', full: true },
        { name: 'city', label: 'City', required: true },
        { name: 'state', label: 'State', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: toOptions(CUSTOMER_STATUSES) },
        { name: 'ownerId', label: 'Owner', type: 'select', required: true, options: userOptions(users) },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      toForm={(c) => ({
        name: c?.name ?? '',
        company: c?.company ?? '',
        email: c?.email ?? '',
        phone: c?.phone ?? '',
        address: c?.address ?? '',
        city: c?.city ?? '',
        state: c?.state ?? '',
        status: c?.status ?? 'Active',
        ownerId: c?.ownerId ?? currentUser?.id ?? '',
        notes: c?.notes ?? '',
      })}
      onSave={async (v, existing) => {
        const patch = { ...v, status: v.status as CustomerStatus }
        if (existing) await update('customers', existing.id, patch)
        else
          await create('customers', {
            name: v.name,
            company: v.company,
            email: v.email,
            phone: v.phone,
            address: v.address,
            city: v.city,
            state: v.state,
            status: v.status as CustomerStatus,
            ownerId: v.ownerId,
            notes: v.notes,
            id: '',
            code: '',
            createdAt: new Date().toISOString(),
          })
      }}
      onDelete={(c) => remove('customers', c.id)}
    />
  )
}
