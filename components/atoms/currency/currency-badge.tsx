"use client"

import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface CurrencyBadgeProps {
  currency: CurrencyType
  amount: number
  showIcon?: boolean
  variant?: "default" | "outline" | "secondary"
  className?: string
}

const currencyConfig: Record<
  CurrencyType,
  { label: string; color: string }
> = {
  PP: {
    label: "PP",
    color:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
  GP: {
    label: "GP",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  EP: {
    label: "EP",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
  SP: {
    label: "SP",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
  CP: {
    label: "CP",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  },
}

/**
 * Componente atom para mostrar un badge de moneda
 * Muestra la cantidad y tipo de moneda con colores distintivos
 */
export function CurrencyBadge({
  currency,
  amount,
  showIcon = true,
  variant = "default",
  className,
}: CurrencyBadgeProps) {
  const config = currencyConfig[currency]
  const displayAmount =
    Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)

  return (
    <Badge
      variant={variant}
      className={cn(
        "gap-1.5 font-mono",
        variant === "default" && config.color,
        className
      )}
    >
      {showIcon && <Coins className="w-3 h-3" />}
      <span>{displayAmount}</span>
      <span>{config.label}</span>
    </Badge>
  )
}

