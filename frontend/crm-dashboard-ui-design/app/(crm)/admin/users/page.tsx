'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RoleGuard } from '@/components/layout/role-guard'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCrm } from '@/components/providers/crm-provider'
import { ApiError, api } from '@/services/api'
import { ROLES } from '@/lib/constants'
import { StatusBadge } from '@/components/crm/status-badge'

export default function UsersPage() {
  return (
    <RoleGuard roles={['Admin']}>
      <UsersBody />
    </RoleGuard>
  )
}

function UsersBody() {
  const { users, refresh } = useCrm()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('SalesExecutive')
  const [teamId, setTeamId] = useState('')
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [nextPassword, setNextPassword] = useState('')

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/users', { name, email, password, role, teamId: teamId || null, isActive: true })
      toast.success('User created')
      setName('')
      setEmail('')
      setPassword('')
      setTeamId('')
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not create the user')
    }
  }

  async function toggleActive(id: string) {
    const user = users.find((item) => item.id === id)
    if (!user) return
    try {
      await api.put(`/users/${id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId ?? null,
        isActive: !user.active,
      })
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update the user')
    }
  }

  async function unlock(id: string) {
    try {
      await api.post(`/users/${id}/unlock`)
      toast.success('Account unlocked')
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not unlock the account')
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetFor) return
    try {
      await api.post(`/users/${resetFor}/reset-password`, { password: nextPassword })
      toast.success('Password reset. Previous sessions are no longer valid.')
      setResetFor(null)
      setNextPassword('')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not reset the password')
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Create staff accounts, assign one role, and manage lockout." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={createUser} className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Initial password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item === 'SalesExecutive' ? 'Sales Executive' : item}
                </option>
              ))}
            </select>
            <Input placeholder="Team id (required for managers)" value={teamId} onChange={(e) => setTeamId(e.target.value)} />
            <Button type="submit">Create user</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-2 border-b pb-4 last:border-0 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}{user.teamId ? ` · team ${user.teamId}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={user.role} />
                <StatusBadge status={user.active ? 'Active' : 'Inactive'} />
                {user.lockedOut && <StatusBadge status="Locked" />}
                <Button variant="outline" size="sm" onClick={() => void toggleActive(user.id)}>
                  {user.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void unlock(user.id)}>
                  Unlock
                </Button>
                <Button variant="outline" size="sm" onClick={() => setResetFor(user.id)}>
                  Reset password
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {resetFor && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={resetPassword} className="flex flex-col gap-3 md:flex-row">
              <Input type="password" placeholder="New password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} required />
              <Button type="submit">Save password</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  )
}
