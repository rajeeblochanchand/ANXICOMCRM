'use client'

import { useRouter } from 'next/navigation'
import { BellIcon, ChevronDownIcon, LogOutIcon, SearchIcon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Kbd } from '@/components/crm/kbd'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDateTime, initials } from '@/lib/format'

export function TopNavbar() {
  const router = useRouter()
  const { currentUser, followUps, scoped, relatedName, signOut } = useCrm()
  if (!currentUser) return null

  const notifications = scoped(followUps)
    .filter((f) => f.status === 'Planned' || f.status === 'Missed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    if (q) router.push(`/customers?q=${encodeURIComponent(q)}`)
  }

  async function handleLogout() {
    await signOut()
    toast.success('You have been signed out')
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <form onSubmit={handleSearch} className="hidden max-w-md flex-1 md:block" role="search">
        <InputGroup className="bg-background">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput name="q" placeholder="Search customers, companies, emails…" aria-label="Global search" />
          <InputGroupAddon align="inline-end">
            <Kbd>Enter</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <BellIcon />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
            )}
            <span className="sr-only">Notifications</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Follow-up reminders</DropdownMenuLabel>
              {notifications.length === 0 && <DropdownMenuItem disabled>No planned follow-ups</DropdownMenuItem>}
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => router.push('/follow-ups')}
                  className="flex flex-col items-start gap-1"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate font-medium">{n.subject}</span>
                    <StatusBadge status={n.status} dot={false} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {relatedName(n.relatedType, n.relatedId)} · {formatDateTime(n.date)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-2.5 px-1.5 py-1" />}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start leading-tight lg:flex">
              <span className="text-sm font-medium">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground">
                {currentUser.role === 'SalesExecutive' ? 'Sales Executive' : currentUser.role}
              </span>
            </span>
            <ChevronDownIcon className="hidden text-muted-foreground lg:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="text-foreground">{currentUser.name}</span>
                <span className="truncate text-xs font-normal">{currentUser.email}</span>
                <StatusBadge status={currentUser.role} className="mt-1" />
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <UserIcon />
                My dashboard
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
