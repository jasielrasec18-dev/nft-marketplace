import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }
type FormFieldProps = {
  id?: string
  label: string
  description?: string
  error?: string
  required?: boolean
  className?: string
  children: (props: ControlProps) => ReactNode
}

export function FormField({ id, label, description, error, required, className, children }: FormFieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const describedBy = [description && `${controlId}-description`, error && `${controlId}-error`].filter(Boolean).join(' ') || undefined
  return <div className={cn('space-y-2', className)}>
    <Label htmlFor={controlId}>{label}{required && <span className="text-primary" aria-hidden="true"> *</span>}</Label>
    {children({ id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
    {description && <p id={`${controlId}-description`} className="type-caption text-muted-foreground">{description}</p>}
    {error && <p id={`${controlId}-error`} className="type-caption text-destructive">Erro: {error}</p>}
  </div>
}
