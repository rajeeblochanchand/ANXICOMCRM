'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useCrm } from '@/components/providers/crm-provider'
import { ApiError } from '@/services/api'
import { firstError, rules } from '@/lib/validation'

export function LoginForm() {
  const router = useRouter()
  const { signIn } = useCrm()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const next = {
      email: firstError(rules.required(email, 'Email'), rules.email(email)),
      password: rules.required(password, 'Password'),
    }
    setErrors(next)
    if (next.email || next.password) return

    setLoading(true)
    try {
      await signIn(email.trim(), password)
      if (remember) toast.message('This session still ends after 30 minutes.')
      toast.success('Signed in')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen w-full flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
            alt="Modern workspace"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-12">
          <form className="w-full max-w-md space-y-8" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <h2 className="text-foreground text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground text-sm">Sign in to pick up right where you left off.</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="bg-muted h-10 w-full gap-2 border-0 font-medium"
              onClick={() => toast.message('Google sign-in is not enabled. Use your work email.')}
            >
              <FcGoogle className="text-base" />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm font-medium tracking-widest">or</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">Work Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email || undefined}
                className="bg-muted focus-visible:ring-primary/20 focus-visible:border-primary/50 h-10 border-transparent"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button
                  type="button"
                  onClick={() => toast.message('Ask an administrator to reset your password.')}
                  className="text-primary text-xs underline-offset-4 transition-all hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password || undefined}
                  className="bg-muted focus-visible:ring-primary/20 focus-visible:border-primary/50 h-10 border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-3">
              <Switch id="remember" checked={remember} onCheckedChange={setRemember} />
              <Label htmlFor="remember" className="text-muted-foreground cursor-pointer text-sm select-none">
                Keep me signed in for 30 days
              </Label>
            </div>

            <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              New here?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-primary font-medium underline-offset-4 transition-all hover:underline"
              >
                Create a free account
              </button>
            </p>
          </form>
        </div>
      </div>

      <footer className="border-border text-muted-foreground flex flex-col items-center justify-between gap-2 border-t bg-white px-6 py-4 text-xs sm:flex-row">
        <span>© 2026 AcxiomCRM. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  )
}
