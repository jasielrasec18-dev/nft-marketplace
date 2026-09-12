import type { ComponentProps } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn('overlay-motion fixed inset-0 z-overlay bg-overlay', className)} {...props} />
}
export function DialogContent({ className, children, closeDisabled, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { closeDisabled?: boolean }) {
  return <DialogPrimitive.Portal><DialogOverlay />
    <DialogPrimitive.Content className={cn('dialog-motion fixed top-1/2 left-1/2 z-modal max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border border-b-primary bg-popover p-6 pt-14 text-popover-foreground shadow-xl sm:p-8 sm:pt-14', className)} {...props}>
      {children}
      <DialogPrimitive.Close asChild><Button disabled={closeDisabled} variant="ghost" size="icon" className="absolute top-2 right-2 text-primary" aria-label="Fechar diálogo"><X /></Button></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
}
export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('type-section', className)} {...props} />
}
export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('type-small mt-2 text-muted-foreground', className)} {...props} />
}
