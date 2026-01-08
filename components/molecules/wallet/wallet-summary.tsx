"use client"

import { Card, CardContent } from "@/components/ui/card"
import { WalletDisplay } from "@/components/molecules/wallet/wallet-display"
import { StatCard } from "@/components/molecules/item/stat-card"
import type { WalletData } from "@/lib/infrastructure/repositories"
import { Coins } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface WalletSummaryProps {
  wallet: WalletData | null
  totalWealth: number
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function WalletSummary({ wallet, totalWealth, language }: WalletSummaryProps) {
  const { t } = useLanguage()

  if (!wallet) {
    return null
  }

  return (
    <div className="space-y-4">
      <WalletDisplay
        platinum={wallet.platinum}
        gold={wallet.gold}
        electrum={wallet.electrum}
        silver={wallet.silver}
        copper={wallet.copper}
        totalWealth={totalWealth}
        variant="detailed"
      />
      <StatCard
        title={t.wallet.totalWealth}
        value={Number.isInteger(totalWealth) ? totalWealth.toString() : totalWealth.toFixed(2)}
        icon={Coins}
        description={t.wallet.totalInGold}
      />
    </div>
  )
}

