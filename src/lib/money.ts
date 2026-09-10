import Big from 'big.js'
import { ethAmountSchema } from '@/contracts/common'
import type { EthAmount } from '@/contracts/common'

// Isolated constructor: no global rounding settings leak to other consumers.
const Decimal = Big()
Decimal.strict = true

export function eth(value: string): EthAmount {
  return ethAmountSchema.parse(value)
}

function decimal(value: EthAmount) {
  return new Decimal(eth(value))
}

export function sumEth(values: readonly EthAmount[]): EthAmount {
  return eth(values.reduce((sum, value) => sum.plus(decimal(value)), new Decimal('0')).toFixed())
}

export function subtractEth(value: EthAmount, amount: EthAmount): EthAmount {
  return eth(decimal(value).minus(decimal(amount)).toFixed())
}

export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError('A quantidade deve ser um inteiro seguro não negativo.')
  }
  return eth(decimal(value).times(String(quantity)).toFixed())
}

export function compareEth(left: EthAmount, right: EthAmount): -1 | 0 | 1 {
  return decimal(left).cmp(decimal(right))
}

// Display-only rounding; API values retain all 18 supported decimal places.
export function formatEth(value: EthAmount, decimalPlaces = 6): string {
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 18) {
    throw new RangeError('Use de 0 a 18 casas decimais.')
  }
  return `${decimal(value).toFixed(decimalPlaces, Decimal.roundHalfUp)} ETH`
}
