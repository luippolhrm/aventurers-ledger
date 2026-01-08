"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useServices } from "@/hooks/use-services"
import { ErrorService } from "@/lib/infrastructure/errors"
import type { WalletData } from "@/lib/infrastructure/repositories"
import { LoadingState } from "@/components/molecules/loading"
import { WalletSummary } from "@/components/molecules/wallet/wallet-summary"
import { WalletForm } from "@/components/organisms/wallet/wallet-form"
import { Coins } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface WalletViewProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
}

export function WalletView({ language, characterId }: WalletViewProps) {
  const { t } = useLanguage()
  const services = useServices()

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [currency, setCurrency] = useState<CurrencyType>("GP")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [totalWealth, setTotalWealth] = useState<number>(0)

  useEffect(() => {
    if (characterId) {
      loadWallet()
    } else {
      setWallet(null)
      setTotalWealth(0)
    }
  }, [characterId])

  const loadWallet = async () => {
    if (!characterId) return

    setIsLoading(true)
    try {
      // Usar getByCharacterIdWithRetry que ya maneja los reintentos en el repositorio
      const walletData = await services.wallet.getWallet(characterId)
      
      setWallet(walletData)
      
      // Calcular el total en copper y convertir a gold
      const totalInCopper = services.wallet.calculateTotalInCopper(walletData)
      const totalInGold = services.wallet.convertCurrency(totalInCopper, "CP", "GP")
      setTotalWealth(totalInGold)
    } catch (error) {
      console.error("Error loading wallet:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      setMessage({ type: "error", text: errorMessage || "Error loading wallet from database" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveWallet = async (
    updatedWallet: Partial<WalletData>,
    movementType: "add" | "remove",
    currency: CurrencyType,
    amount: number,
  ) => {
    if (!characterId) {
      throw new Error("No character ID provided")
    }

    // Actualizar wallet usando WalletService
    await services.wallet.updateWallet(characterId, updatedWallet)

    // Crear movimiento usando MovementService
    if (movementType === "add") {
      await services.movement.createAdd(characterId, currency, amount)
    } else {
      await services.movement.createRemove(characterId, currency, amount)
    }

    // Recalcular total - obtener wallet actualizado y calcular
    const walletData = await services.wallet.getWallet(characterId)
    if (walletData) {
      const totalInCopper = services.wallet.calculateTotalInCopper(walletData)
      const totalInGold = services.wallet.convertCurrency(totalInCopper, "CP", "GP")
      setTotalWealth(totalInGold)
    }
    setMessage({ type: "success", text: t.wallet.success })
  }

  const handleAdd = async () => {
    if (!wallet) return

    const amt = Number.parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || !Number.isFinite(amt)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    setIsLoading(true)
    try {
      const currencyKey = currency.toLowerCase() as keyof Omit<WalletData, "total_wealth">
      const updatedWallet = {
        ...wallet,
        [currencyKey]: (wallet[currencyKey] as number) + amt,
      }

      await saveWallet(updatedWallet, "add", currency, amt)
      setWallet(updatedWallet as WalletData)
      setAmount("")
    } catch (error) {
      console.error("Error in handleAdd:", error)
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!wallet) return

    const amt = Number.parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || !Number.isFinite(amt)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    const currencyKey = currency.toLowerCase() as keyof Omit<WalletData, "total_wealth">
    if ((wallet[currencyKey] as number) < amt) {
      setMessage({ type: "error", text: t.wallet.insufficientFunds })
      return
    }

    setIsLoading(true)
    try {
      const updatedWallet = {
        ...wallet,
        [currencyKey]: (wallet[currencyKey] as number) - amt,
      }

      await saveWallet(updatedWallet, "remove", currency, amt)
      setWallet(updatedWallet as WalletData)
      setAmount("")
    } catch (error) {
      console.error("Error in handleRemove:", error)
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
    } finally {
      setIsLoading(false)
    }
  }

  const hasCharacter = !!characterId

  if (isLoading && !wallet) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
        <LoadingState message={t.wallet.loading || "Loading wallet..."} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Coins className="w-4 h-4 md:w-5 md:h-5" />
            {t.wallet.title}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">{t.wallet.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {wallet && (
            <>
              <div className="space-y-2 md:space-y-3">
                <h3 className="font-semibold text-base md:text-lg">{t.wallet.balance}</h3>
                <WalletSummary wallet={wallet} totalWealth={totalWealth} language={language} />
              </div>

              <WalletForm
                language={language}
                currency={currency}
                amount={amount}
                isLoading={isLoading}
                disabled={!hasCharacter}
                onCurrencyChange={setCurrency}
                onAmountChange={(value) => {
                  setAmount(value)
                  setMessage(null)
                }}
                onAdd={handleAdd}
                onRemove={handleRemove}
                message={message}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

