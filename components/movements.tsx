"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/language-context"
import { ArrowRight, Coins, AlertCircle } from "lucide-react"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { ConversionForm } from "@/components/molecules/movement/conversion-form"
import { CurrencyAmount } from "@/components/atoms/currency"
import { WalletDisplay } from "@/components/molecules/wallet/wallet-display"
import type { WalletData } from "@/lib/infrastructure/repositories"
import type { Movement } from "@/lib/infrastructure/repositories"

interface MovementsProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
}

export function Movements({ language, characterId }: MovementsProps) {
  const { t } = useLanguage()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [fromCurrency, setFromCurrency] = useState<"PP" | "GP" | "EP" | "SP" | "CP" | "">("")
  const [toCurrency, setToCurrency] = useState<"PP" | "GP" | "EP" | "SP" | "CP" | "">("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const services = useServices()

  useEffect(() => {
    if (characterId) {
      loadData()
    } else {
      setWallet(null)
      setMovements([])
      setLoading(false)
    }
  }, [characterId])

  const loadData = async () => {
    if (!characterId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      // Cargar wallet y movimientos en paralelo
      const [walletData, movementsData] = await Promise.all([
        services.wallet.getWallet(characterId),
        services.movement.getMovements(characterId),
      ])

      setWallet(walletData)
      setMovements(movementsData)
    } catch (err: any) {
      console.error("[v0] Error loading data:", err)
      setError(err?.message || "Error loading data")
    } finally {
      setLoading(false)
    }
  }

  const calculateConversion = () => {
    if (!amount || !fromCurrency || !toCurrency) return 0

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return 0

    return services.movement.calculateConversion(amountNum, fromCurrency, toCurrency)
  }

  const handleConversion = async () => {
    if (!characterId || !wallet) return

    const amountNum = Number.parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setMessage({ type: "error", text: t.movements.invalidAmount })
      return
    }

    if (!fromCurrency || !toCurrency) {
      setMessage({ type: "error", text: t.movements.selectCurrency })
      return
    }

    if (fromCurrency === toCurrency) {
      setMessage({ type: "error", text: t.movements.sameConversion })
      return
    }

    const currencyMap: Record<string, keyof Omit<WalletData, "total_wealth">> = {
      PP: "platinum",
      GP: "gold",
      EP: "electrum",
      SP: "silver",
      CP: "copper",
    }

    const fromCurrencyKey = currencyMap[fromCurrency]
    const currentBalance = wallet[fromCurrencyKey]

    if (currentBalance < amountNum) {
      setMessage({ type: "error", text: t.movements.insufficientFunds })
      return
    }

    try {
      setMessage(null)
      await services.movement.createConversion(characterId, fromCurrency, toCurrency, amountNum)

      setMessage({ type: "success", text: t.movements.success })
      setAmount("")
      setFromCurrency("")
      setToCurrency("")

      await loadData()
    } catch (err: any) {
      console.error("Error in conversion:", err)
      setMessage({ type: "error", text: err?.message || t.wallet.error })
    }
  }

  const currencies = [
    { id: "PP", name: t.currencies.platinum },
    { id: "GP", name: t.currencies.gold },
    { id: "EP", name: t.currencies.electrum },
    { id: "SP", name: t.currencies.silver },
    { id: "CP", name: t.currencies.copper },
  ]

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.movements as any)?.loading || "Loading movements..."} />
      </div>
    )
  }

  if (!characterId) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Coins}
          title={t.movements.noCharacter || "No character selected"}
          description={t.movements.description || "Please select a character to view movements"}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="text-sm md:text-base">{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Current Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Coins className="w-4 h-4 md:w-5 md:h-5" />
              {t.movements.currentBalance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wallet ? (
              <WalletDisplay
                platinum={wallet.platinum}
                gold={wallet.gold}
                electrum={wallet.electrum}
                silver={wallet.silver}
                copper={wallet.copper}
                totalWealth={wallet.total_wealth}
                variant="detailed"
              />
            ) : (
              <EmptyState icon={Coins} title="Sin wallet" description="No se pudo cargar el wallet" />
            )}
          </CardContent>
        </Card>

        {/* Conversion Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">{t.movements.conversionForm}</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionForm
              language={language}
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              amount={amount}
              convertedAmount={calculateConversion()}
              message={message}
              onFromCurrencyChange={setFromCurrency}
              onToCurrencyChange={setToCurrency}
              onAmountChange={(value) => {
                setAmount(value)
                setMessage(null)
              }}
              onConvert={handleConversion}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">{t.movements.history}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm md:text-base">{error}</AlertDescription>
            </Alert>
          )}
          {movements.length === 0 ? (
            <EmptyState
              icon={Coins}
              title={t.movements.noHistory || "No movement history"}
              description="Your currency conversion history will appear here"
            />
          ) : (
            <div className="space-y-2 md:space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 bg-muted rounded-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4">
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {new Date(movement.created_at).toLocaleString(language)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm md:text-base">
                        {movement.amount_from} {movement.from_currency}
                      </span>
                      {movement.from_currency !== movement.to_currency && (
                        <>
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="font-medium text-sm md:text-base">
                            {Number.isInteger(movement.amount_to)
                              ? movement.amount_to
                              : movement.amount_to.toFixed(2)}{" "}
                            {movement.to_currency}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
                    {movement.movement_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
