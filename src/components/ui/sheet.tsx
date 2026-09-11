import type { ComponentProps } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close
export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription
export function SheetContent({ className, children, side = 'right', ...props }: ComponentProps<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }) {
  return <DialogPrimitive.Portal><DialogOverlay />
    <DialogPrimitive.Content data-side={side} className={cn('sheet-motion fixed inset-y-0 z-modal h-dvh w-[calc(100%-2rem)] max-w-sm overflow-y-auto border-border bg-popover p-6 pt-16 text-popover-foreground shadow-xl', side === 'right' ? 'right-0 border-l' : 'left-0 border-r', className)} {...props}>
      {children}
      <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" className="absolute top-2 right-2 text-primary" aria-label="Fechar painel"><X /></Button></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
}
