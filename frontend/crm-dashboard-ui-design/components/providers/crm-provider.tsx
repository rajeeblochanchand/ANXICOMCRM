'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api, listAll, setToken } from '@/services/api'
import {
  activityInput,
  customerInput,
  emptyDashboard,
  followUpInput,
  leadInput,
  opportunityInput,
  toActivity,
  toAudit,
  toCustomer,
  toFollowUp,
  toLead,
  toOpportunity,
  toUser,
  type ApiRecord,
  type DashboardData,
} from '@/lib/records'
import type {
  Activity,
  Customer,
  FollowUp,
  Lead,
  Opportunity,
  RelatedType,
  Role,
  User,
} from '@/types'
import type { AuditLog } from '@/types'

interface Collections {
  customers: Customer[]
  leads: Lead[]
  opportunities: Opportunity[]
  followUps: FollowUp[]
  activities: Activity[]
  users: User[]
}

type CollectionKey = keyof Collections
type ItemOf<K extends CollectionKey> = Collections[K][number]

const paths: Record<Exclude<CollectionKey, 'users'>, string> = {
  customers: '/customers',
  leads: '/leads',
  opportunities: '/opportunities',
  followUps: '/followups',
  activities: '/activities',
}

interface SessionUser {
  id: string
  name: string
  email: string
  role?: string | null
  teamId?: string | null
}

interface CrmContextValue extends Collections {
  auditLogs: AuditLog[]
  dashboard: DashboardData
  currentUser: User | null
  ready: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  register: (input: { name: string; email: string; password: string }) => Promise<void>
  create: <K extends CollectionKey>(key: K, item: ItemOf<K>) => Promise<void>
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => Promise<void>
  remove: <K extends CollectionKey>(key: K, id: string) => Promise<void>
  convertLead: (id: string) => Promise<void>
  refresh: () => Promise<void>
  loadDashboard: (from?: string, to?: string) => Promise<void>
  scoped: <T>(items: T[]) => T[]
  userName: (id: string) => string
  relatedName: (type: RelatedType, id: string) => string
  can: (...roles: Role[]) => boolean
}

const CrmContext = createContext<CrmContextValue | null>(null)

const empty: Collections = {
  customers: [],
  leads: [],
  opportunities: [],
  followUps: [],
  activities: [],
  users: [],
}

function fromRecord(key: Exclude<CollectionKey, 'users'>, record: ApiRecord) {
  if (key === 'customers') return toCustomer(record)
  if (key === 'leads') return toLead(record)
  if (key === 'opportunities') return toOpportunity(record)
  if (key === 'followUps') return toFollowUp(record)
  return toActivity(record)
}

function toInput(key: Exclude<CollectionKey, 'users'>, item: ItemOf<Exclude<CollectionKey, 'users'>>) {
  if (key === 'customers') return customerInput(item as Customer)
  if (key === 'leads') return leadInput(item as Lead)
  if (key === 'opportunities') return opportunityInput(item as Opportunity)
  if (key === 'followUps') return followUpInput(item as FollowUp)
  return activityInput(item as Activity)
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Collections>(empty)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const ready = true

  const load = useCallback(async (role?: string | null) => {
    setLoading(true)
    try {
      const [customers, leads, opportunities, followUps, activities, dashboardData] = await Promise.all([
        listAll<ApiRecord>('/customers'),
        listAll<ApiRecord>('/leads'),
        listAll<ApiRecord>('/opportunities'),
        listAll<ApiRecord>('/followups'),
        listAll<ApiRecord>('/activities'),
        api.get<DashboardData>('/dashboard'),
      ])
      let users: User[] = []
      if (role === 'Admin') {
        const listed = await api.get<{ items: Parameters<typeof toUser>[0][] }>('/users')
        users = listed.items.map(toUser)
      } else {
        const listed = await api.get<Parameters<typeof toUser>[0][]>('/users/assignable')
        users = listed.map(toUser)
      }
      let logs: AuditLog[] = []
      if (role === 'Admin') {
        const audit = await api.get<{ items: Parameters<typeof toAudit>[0][] }>('/audit')
        logs = audit.items.map(toAudit)
      }
      setData({
        customers: customers.map(toCustomer),
        leads: leads.map(toLead),
        opportunities: opportunities.map(toOpportunity),
        followUps: followUps.map(toFollowUp),
        activities: activities.map(toActivity),
        users,
      })
      setDashboard(dashboardData)
      setAuditLogs(logs)
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<{ token: string; user: SessionUser }>('/auth/login', { email, password })
      setToken(result.token)
      const user = toUser({ ...result.user, isActive: true })
      setCurrentUser(user)
      await load(user.role)
    },
    [load],
  )

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // The local session still ends if the token is already invalid.
    }
    setToken(null)
    setCurrentUser(null)
    setData(empty)
    setAuditLogs([])
    setDashboard(emptyDashboard)
  }, [])

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    await api.post('/auth/register', input)
  }, [])

  const refresh = useCallback(async () => {
    if (currentUser) await load(currentUser.role)
  }, [currentUser, load])

  const loadDashboard = useCallback(async (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    setDashboard(await api.get<DashboardData>(`/dashboard${query ? `?${query}` : ''}`))
  }, [])

  const create = useCallback(
    async <K extends CollectionKey>(key: K, item: ItemOf<K>) => {
      if (key === 'users') return
      const recordKey = key as Exclude<CollectionKey, 'users'>
      const saved = await api.post<ApiRecord>(paths[recordKey], toInput(recordKey, item as ItemOf<Exclude<CollectionKey, 'users'>>))
      const mapped = fromRecord(recordKey, saved) as ItemOf<K>
      setData((prev) => ({ ...prev, [key]: [mapped, ...prev[key]] }))
    },
    [],
  )

  const update = useCallback(async <K extends CollectionKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => {
    if (key === 'users') return
    const recordKey = key as Exclude<CollectionKey, 'users'>
    const current = (data[key] as { id: string }[]).find((item) => item.id === id) as ItemOf<K> | undefined
    if (!current) throw new Error('Record not found. Refresh and try again.')
    const next = { ...current, ...patch } as ItemOf<Exclude<CollectionKey, 'users'>>
    const saved = await api.put<ApiRecord>(`${paths[recordKey]}/${id}`, toInput(recordKey, next))
    const mapped = fromRecord(recordKey, saved) as ItemOf<K>
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] as { id: string }[]).map((item) => (item.id === id ? mapped : item)),
    }))
  }, [data])

  const remove = useCallback(async <K extends CollectionKey>(key: K, id: string) => {
    if (key === 'users') return
    const recordKey = key as Exclude<CollectionKey, 'users'>
    await api.delete(`${paths[recordKey]}/${id}`)
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] as { id: string }[]).filter((item) => item.id !== id),
    }))
  }, [])

  const convertLead = useCallback(
    async (id: string) => {
      await api.post(`/leads/${id}/convert`, {})
      await load(currentUser?.role)
    },
    [currentUser?.role, load],
  )

  const value = useMemo<CrmContextValue>(() => {
    const userMap = new Map(data.users.map((user) => [user.id, user.name]))
    if (currentUser && !userMap.has(currentUser.id)) userMap.set(currentUser.id, currentUser.name)
    return {
      ...data,
      auditLogs,
      dashboard,
      currentUser,
      ready,
      loading,
      signIn,
      signOut,
      register,
      create,
      update,
      remove,
      convertLead,
      refresh,
      loadDashboard,
      scoped: (items) => items,
      userName: (id) => userMap.get(id) ?? 'Unassigned',
      relatedName: (type, id) => {
        if (type === 'Customer') return data.customers.find((item) => item.id === id)?.company || data.customers.find((item) => item.id === id)?.name || 'Unknown customer'
        if (type === 'Lead') return data.leads.find((item) => item.id === id)?.name ?? 'Unknown lead'
        return data.opportunities.find((item) => item.id === id)?.name ?? 'Unknown opportunity'
      },
      can: (...roles) => (currentUser ? roles.includes(currentUser.role) : false),
    }
  }, [data, auditLogs, dashboard, currentUser, loading, signIn, signOut, register, create, update, remove, convertLead, refresh, loadDashboard])

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm must be used within CrmProvider')
  return ctx
}
