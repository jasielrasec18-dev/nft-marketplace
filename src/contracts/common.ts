import { z } from 'zod'

export const ethAmountSchema = z.string()
  .regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Informe um valor ETH decimal não negativo, com até 18 casas.')
  .brand<'EthAmount'>()

export type EthAmount = z.infer<typeof ethAmountSchema>
export type ResourceId = string
export type IsoDate = string

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
