import type { ComponentProps } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

export const Tabs = TabsPrimitive.Root
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex max-w-full gap-4 overflow-x-auto border-b border-border px-1', className)} {...props} />
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cn('min-h-11 shrink-0 border-b-2 border-transparent px-1 py-2 text-sm text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary disabled:opacity-50 focus-visible:-outline-offset-2', className)} {...props} />
}
export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring', className)} {...props} />
}
