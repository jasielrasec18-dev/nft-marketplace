import { z } from 'zod'
import { ethAmountSchema } from './common'
import { collectorSchema, type CreateOrderInput } from './order'
import { networkSchema } from './wallet'
import type { CartItemInput } from './cart'
import type { QuoteInput } from './quote'

export const quantitySchema = z.number().int().positive().max(10000)
export const cartItemInputSchema: z.ZodType<CartItemInput> = z.object({
  nftId: z.string().min(1), editionId: z.string().min(1), quantity: quantitySchema,
}).strict()
export const cartItemPatchSchema = z.object({ quantity: quantitySchema }).strict()
export const quoteInputSchema: z.ZodType<QuoteInput> = z.object({
  cartId: z.string().min(1), cartVersion: z.number().int().positive(),
  couponCode: z.string().trim().max(40).nullable(), network: networkSchema,
}).strict()
export const createOrderInputSchema: z.ZodType<CreateOrderInput> = z.object({
  quoteId: z.string().min(1), quoteVersion: z.number().int().positive(),
  walletId: z.string().min(1), collector: collectorSchema.strict(),
}).strict()
export const nftUpdateSchema = z.object({
  priceEth: ethAmountSchema.optional(),
  editionId: z.string().optional(),
  availableQuantity: z.number().int().min(0).max(10000).optional(),
}).strict().refine((input) => input.priceEth !== undefined || input.availableQuantity !== undefined, 'Informe preço ou estoque.')
export const avatarSchema = z.object({
  imageDataUrl: z.string().max(350000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Use uma imagem PNG, JPEG ou WebP de até 250 KB.'),
}).strict()
