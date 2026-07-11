"use client"

import { CurrencyBadge, type CurrencyType } from "./currency-badge"
import { cn } from "@/lib/utils"

interface CurrencyAmountProps {
  platinum?: number
  gold?: number
  electrum?: number
  silver?: number
  copper?: number
  showZero?: boolean
  className?: string
}

/**
 * Componente atom para mostrar múltiples monedas
 * Combina varios CurrencyBadge en un display flexible
 */
export function CurrencyAmount({
  platinum = 0,
  gold = 0,
  electrum = 0,
  silver = 0,
  copper = 0,
  showZero = false,
  className,
}: CurrencyAmountProps) {
  const allCurrencies: Array<{ type: CurrencyType; amount: number }> = [
    { type: "PP", amount: platinum },
    { type: "GP", amount: gold },
    { type: "EP", amount: electrum },
    { type: "SP", amount: silver },
    { type: "CP", amount: copper },
  ]
  const currencies = allCurrencies.filter((c) => showZero || c.amount > 0)

  if (currencies.length === 0) {
    return <span className={cn("text-muted-foreground", className)}>0 GP</span>
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {currencies.map(({ type, amount }) => (
        <CurrencyBadge key={type} currency={type} amount={amount} />
      ))}
    </div>
  )
}

