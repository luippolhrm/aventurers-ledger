"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyAmount } from "@/components/atoms/currency"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletDisplayProps {
  platinum?: number
  gold?: number
  electrum?: number
  silver?: number
  copper?: number
  totalWealth?: number
  variant?: "default" | "compact" | "detailed"
  className?: string
}

/**
 * Componente molecule para mostrar un wallet completo
 * Combina CurrencyAmount con Card para diferentes variantes de display
 */
export function WalletDisplay({
  platinum = 0,
  gold = 0,
  electrum = 0,
  silver = 0,
  copper = 0,
  totalWealth,
  variant = "default",
  className,
}: WalletDisplayProps) {
  // Variante compacta: solo icono y monedas
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Coins className="w-4 h-4 text-muted-foreground" />
        <CurrencyAmount
          platinum={platinum}
          gold={gold}
          electrum={electrum}
          silver={silver}
          copper={copper}
        />
      </div>
    )
  }

  // Variantes default y detailed: Card completo
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CurrencyAmount
          platinum={platinum}
          gold={gold}
          electrum={electrum}
          silver={silver}
          copper={copper}
        />
        {variant === "detailed" && totalWealth !== undefined && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Total Wealth:{" "}
              <span className="font-semibold text-foreground">
                {totalWealth.toFixed(2)} GP
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

