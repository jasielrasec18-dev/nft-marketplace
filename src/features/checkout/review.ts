import type { Quote } from '@/contracts/quote'
export function reviewFingerprint(quote: Quote) {
  return JSON.stringify([quote.cartId, quote.cartVersion, quote.network, quote.couponCode, quote.subtotalEth, quote.discountEth, quote.networkFeeEth, quote.totalEth,
    quote.lines.map((line) => [line.nftId, line.editionId, line.quantity, line.unitPriceEth, line.subtotalEth, line.nftVersion])])
}
