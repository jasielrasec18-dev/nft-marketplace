import type { QuoteLine, QuoteTotals } from '@/contracts/quote'
import { ETHPrice } from '@/components/shared/eth-price'
export function OrderSummary({ lines, totals }: { lines: readonly Readonly<QuoteLine>[]; totals: QuoteTotals }) {
  return <div className="space-y-5">
    <ul aria-label="Itens do pedido" className="space-y-3">{lines.map((line) => <li key={line.nftId + ':' + line.editionId} className="flex min-w-0 items-start gap-3 rounded-md bg-card p-3">
      <img src={line.imageUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1"><p className="type-card break-words">{line.name}</p><p className="type-caption text-muted-foreground">{line.editionName} · {line.quantity} unidade(s)</p><p className="type-caption text-muted-foreground">Preço unitário: <ETHPrice value={line.unitPriceEth} /></p></div><ETHPrice value={line.subtotalEth} className="max-w-[40%] text-right" />
    </li>)}</ul>
    <dl className="type-small space-y-3">{([['Subtotal', totals.subtotalEth], ['Desconto', totals.discountEth], ['Taxa de rede', totals.networkFeeEth], ['Total', totals.totalEth]] as const).map(([label, value]) => <div key={label} className={'flex flex-wrap items-start justify-between gap-2 ' + (label === 'Total' ? 'border-t border-border pt-4 font-bold' : '')}><dt>{label}</dt><dd><ETHPrice value={value} data-testid={'order-' + label.toLowerCase().replaceAll(' ', '-')} /></dd></div>)}</dl>
  </div>
}
