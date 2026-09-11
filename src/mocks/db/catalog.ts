import type { EthAmount } from '@/contracts/common'
import type { NFT } from '@/contracts/nft'
import { eth } from '@/lib/money'
import { fail } from '../utils/responses'
import type { MockDatabase } from './types'

export function findNft(db: MockDatabase, id: string): NFT {
  return db.nfts.find((nft) => nft.id === id) ?? fail(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
}
export function updateNftPrice(db: MockDatabase, id: string, price: EthAmount): NFT {
  const nft = findNft(db, id)
  nft.priceEth = eth(price)
  nft.version += 1
  return nft
}
export function updateNftAvailability(db: MockDatabase, id: string, quantity: number, editionId?: string): NFT {
  const nft = findNft(db, id)
  if (!Number.isSafeInteger(quantity) || quantity < 0) fail(422, 'INVALID_QUANTITY', 'Estoque inválido.')
  if (editionId) {
    const edition = nft.editions.find((item) => item.id === editionId) ?? fail(404, 'EDITION_NOT_FOUND', 'Edição não encontrada.')
    edition.availableQuantity = quantity
  } else {
    // Without an edition only a complete sell-out is unambiguous.
    if (quantity !== 0) fail(422, 'EDITION_REQUIRED', 'Informe a edição para definir estoque.')
    for (const edition of nft.editions) edition.availableQuantity = 0
  }
  nft.availableQuantity = nft.editions.reduce((sum, edition) => sum + edition.availableQuantity, 0)
  nft.version += 1
  return nft
}
export function validateStock(db: MockDatabase, nftId: string, editionId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) fail(422, 'INVALID_QUANTITY', 'A quantidade deve ser um inteiro positivo.')
  const nft = findNft(db, nftId)
  const edition = nft.editions.find((item) => item.id === editionId) ?? fail(422, 'INVALID_EDITION', 'Edição inválida para este NFT.')
  if (quantity > edition.availableQuantity) fail(409, 'OUT_OF_STOCK', 'Estoque insuficiente para esta edição.')
  return { nft, edition }
}
