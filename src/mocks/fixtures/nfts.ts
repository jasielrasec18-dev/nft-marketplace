import type { NFT } from '@/contracts/nft'
import { eth } from '@/lib/money'
const artwork = new URL('../../assets/hero.png', import.meta.url).href

const collections = ['golden', 'jungle', 'cosmic', 'pixel'] as const
const names = ['Golden Ape', 'Jungle Panther', 'Cosmic Owl', 'Pixel Fox'] as const
const prices = ['1.19', '0.05', '2.5', '0.000000000000000001', '3.75', '0.8', '5', '1.29'] as const

export function createNfts(): NFT[] {
  return Array.from({ length: 32 }, (_, index) => {
    const stock = index === 31 ? 0 : 8 + index % 5
    return {
      id: `nft-${String(index + 1).padStart(3, '0')}`,
      name: `${names[index % names.length]} #${String(index + 1).padStart(3, '0')}`,
      description: 'Colecionável fictício para demonstração e testes do marketplace.',
      collection: collections[index % collections.length] ?? 'golden',
      imageUrl: artwork, gallery: [artwork],
      priceEth: eth(prices[index % prices.length] ?? '1.19'),
      editions: [
        { id: 'standard', name: 'Standard', availableQuantity: stock },
        { id: 'limited', name: 'Limited', availableQuantity: index % 4 === 0 ? 0 : 2 },
      ],
      availableQuantity: stock + (index % 4 === 0 ? 0 : 2),
      version: 1,
      createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    }
  })
}
