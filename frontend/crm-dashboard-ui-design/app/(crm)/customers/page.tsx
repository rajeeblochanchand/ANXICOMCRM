'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CustomersView } from '@/components/modules/customers-view'

function CustomersPage() {
  const query = useSearchParams().get('q') ?? undefined
  return <CustomersView initialQuery={query} />
}

export default function Page() {
  return (
    <Suspense>
      <CustomersPage />
    </Suspense>
  )
}
