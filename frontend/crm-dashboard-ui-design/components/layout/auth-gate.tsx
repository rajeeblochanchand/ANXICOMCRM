'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCrm } from '@/components/providers/crm-provider'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { currentUser, ready } = useCrm()

  useEffect(() => {
    if (ready && !currentUser) router.replace('/login')
  }, [ready, currentUser, router])

  if (!currentUser) {
    return <div className="p-8 text-sm text-muted-foreground">Checking your session…</div>
  }

  return <>{children}</>
}
