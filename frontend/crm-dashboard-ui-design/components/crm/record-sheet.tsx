'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { SelectField, TextareaField, TextField } from '@/components/forms/form-fields'
import type { SelectOption } from '@/components/forms/app-select'
import { cn } from '@/lib/utils'

export type FormValues = Record<string, string>

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea'
  options?: SelectOption[]
  required?: boolean
  full?: boolean
  placeholder?: string
  hint?: string
  validate?: (value: string, values: FormValues) => string | undefined
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+[1-9]\d{7,14}$/

function check(field: FieldDef, values: FormValues) {
  const v = (values[field.name] ?? '').trim()
  if (field.required && !v) return `${field.label} is required`
  if (v && field.type === 'email' && !EMAIL.test(v)) return 'Enter a valid email address'
  if (v && field.type === 'tel' && !PHONE.test(v)) return 'Use international format, for example +919876543210'
  if (v && field.type === 'number' && Number.isNaN(Number(v))) return `${field.label} must be a number`
  return field.validate?.(v, values)
}

export function RecordSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = 'Save',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FieldDef[]
  initial: FormValues
  submitLabel?: string
  onSubmit: (values: FormValues) => void | Promise<void>
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {open && (
          <RecordForm
            key={JSON.stringify(initial)}
            fields={fields}
            initial={initial}
            submitLabel={submitLabel}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RecordForm({
  fields,
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  fields: FieldDef[]
  initial: FormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: FormValues) => void | Promise<void>
}) {
  const [values, setValues] = useState<FormValues>(initial)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)

  const set = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = Object.fromEntries(fields.map((f) => [f.name, check(f, values)]))
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSaving(true)
    try {
      await onSubmit(values)
    } catch {
      // The page shows the API message and keeps the sheet open.
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <FieldGroup className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          {fields.map((f) => {
            const id = `field-${f.name}`
            const common = { id, label: f.label, required: f.required, error: errors[f.name], hint: f.hint }
            const span = cn((f.full || f.type === 'textarea') && 'sm:col-span-2')
            if (f.type === 'select')
              return (
                <SelectField
                  key={f.name}
                  {...common}
                  className={span}
                  items={f.options ?? []}
                  value={values[f.name] ?? ''}
                  onValueChange={(v) => set(f.name, v)}
                  placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}`}
                />
              )
            if (f.type === 'textarea')
              return (
                <TextareaField
                  key={f.name}
                  {...common}
                  className={span}
                  value={values[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )
            return (
              <TextField
                key={f.name}
                {...common}
                className={span}
                type={f.type ?? 'text'}
                value={values[f.name] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )
          })}
        </FieldGroup>
      </ScrollArea>
      <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}
