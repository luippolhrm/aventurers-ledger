"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type Language, translations } from "@/lib/translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { ArrowRight, Coins, AlertCircle } from "lucide-react"
import { useActiveCharacter } from "@/lib/active-character-context"

interface MovementsProps {
  language: Language
}

interface Character {
  id: string
  name: string
}

interface WalletData {
  platinum: number
  gold: number
  electrum: number
  silver: number
  copper: number
}

interface Movement {
  id: string
  from_currency: string
  to_currency: string
  amount_from: number
  amount_to: number
  created_at: string
  movement_type: string
}

const CONVERSION_RATES = {
  PP: 10,
  GP: 1,
  EP: 0.5,
  SP: 0.1,
  CP: 0.01,
}

export function Movements({ language }: MovementsProps) {
  const t = translations[language]
  const { activeCharacter } = useActiveCharacter()
  const [character, setCharacter] = useState<Character | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [fromCurrency, setFromCurrency] = useState("")
  const [toCurrency, setToCurrency] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeCharacter) {
      loadData()
    } else {
      setCharacter(null)
      setWallet(null)
      setMovements([])
      setLoading(false)
    }
  }, [activeCharacter])

  const loadData = async () => {
    if (!activeCharacter) {
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()
      setCharacter(activeCharacter)

      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("character_id", activeCharacter.id)
        .single()

      if (!walletData || walletError?.code === "PGRST116") {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({
            character_id: activeCharacter.id,
            platinum: 0,
            gold: 0,
            electrum: 0,
            silver: 0,
            copper: 0,
          })
          .select()
          .single()

        if (createError) {
          console.error("[v0] Error creating wallet:", createError)
        }

        setWallet({ platinum: 0, gold: 0, electrum: 0, silver: 0, copper: 0 })
      } else {
        setWallet({
          platinum: Number(walletData.platinum),
          gold: Number(walletData.gold),
          electrum: Number(walletData.electrum),
          silver: Number(walletData.silver),
          copper: Number(walletData.copper),
        })
      }

      const { data: movementsData, error: movementsError } = await supabase
        .from("movements")
        .select("*")
        .eq("character_id", activeCharacter.id)
        .order("created_at", { ascending: false })

      if (movementsError) {
        console.error("[v0] Error loading movements:", movementsError)
      }

      setMovements(movementsData || [])
    } catch (error) {
      console.error("[v0] Error in loadData:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateConversion = () => {
    if (!amount || !fromCurrency || !toCurrency) return 0

    const amountNum = Number.parseFloat(amount)
    const fromRate = CONVERSION_RATES[fromCurrency as keyof typeof CONVERSION_RATES]
    const toRate = CONVERSION_RATES[toCurrency as keyof typeof CONVERSION_RATES]

    return (amountNum * fromRate) / toRate
  }

  const handleConversion = async () => {
    if (!activeCharacter || !wallet) return

    const amountNum = Number.parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setMessage({ type: "error", text: t.movements.invalidAmount })
      return
    }

    if (fromCurrency === toCurrency) {
      setMessage({ type: "error", text: t.movements.sameConversion })
      return
    }

    const currencyMap: Record<string, keyof WalletData> = {
      PP: "platinum",
      GP: "gold",
      EP: "electrum",
      SP: "silver",
      CP: "copper",
    }

    const fromCurrencyKey = currencyMap[fromCurrency]
    const toCurrencyKey = currencyMap[toCurrency]
    const currentBalance = wallet[fromCurrencyKey]

    if (currentBalance < amountNum) {
      setMessage({ type: "error", text: t.movements.insufficientFunds })
      return
    }

    try {
      const supabase = createBrowserClient()
      const convertedAmount = calculateConversion()

      const newFromBalance = currentBalance - amountNum
      const newToBalance = wallet[toCurrencyKey] + convertedAmount

      const { error: walletError } = await supabase
        .from("wallets")
        .update({
          [fromCurrencyKey]: newFromBalance,
          [toCurrencyKey]: newToBalance,
        })
        .eq("character_id", activeCharacter.id)

      if (walletError) throw walletError

      const { error: movementError } = await supabase.from("movements").insert({
        character_id: activeCharacter.id,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount_from: amountNum,
        amount_to: convertedAmount,
        movement_type: "conversion",
      })

      if (movementError) throw movementError

      setMessage({ type: "success", text: t.movements.success })
      setAmount("")
      setFromCurrency("")
      setToCurrency("")

      await loadData()
    } catch (error) {
      console.error("Error in conversion:", error)
      setMessage({ type: "error", text: t.wallet.error })
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
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>{t.movements.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!character) {
    return (
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>{t.movements.title}</CardTitle>
          <CardDescription>{t.movements.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.movements.noCharacter}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          {t.movements.title}
        </h2>
        <p className="text-muted-foreground">{t.movements.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {t.movements.currentBalance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currencies.map((currency) => {
                const currencyMap: Record<string, keyof WalletData> = {
                  PP: "platinum",
                  GP: "gold",
                  EP: "electrum",
                  SP: "silver",
                  CP: "copper",
                }
                const walletKey = currencyMap[currency.id]
                const balance = wallet?.[walletKey] ?? 0
                console.log(`[v0] Rendering balance for ${currency.id}:`, balance, "from wallet:", wallet)
                return (
                  <div key={currency.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">
                      {currency.name} ({currency.id})
                    </span>
                    <span className="text-lg font-bold">{balance}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t.movements.conversionForm}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-currency">{t.movements.fromCurrency}</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger id="from-currency">
                  <SelectValue placeholder={t.movements.selectCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.name} ({currency.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t.movements.amount}</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setMessage(null)
                }}
                placeholder={t.movements.enterAmount}
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-currency">{t.movements.toCurrency}</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger id="to-currency">
                  <SelectValue placeholder={t.movements.selectCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.name} ({currency.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {amount && fromCurrency && toCurrency && (
              <Alert>
                <AlertDescription>
                  <strong>{t.movements.youWillReceive}:</strong>{" "}
                  {Number.isInteger(calculateConversion()) ? calculateConversion() : calculateConversion().toFixed(2)}{" "}
                  {currencies.find((c) => c.id === toCurrency)?.name}
                </AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleConversion} className="w-full" size="lg">
              {t.movements.convert}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.movements.history}</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t.movements.noHistory}</p>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {new Date(movement.created_at).toLocaleString(language)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {movement.amount_from} {movement.from_currency}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium">
                        {Number.isInteger(movement.amount_to) ? movement.amount_to : movement.amount_to.toFixed(2)}{" "}
                        {movement.to_currency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
