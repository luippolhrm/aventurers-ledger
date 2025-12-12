"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type Language, translations } from "@/lib/translations"
import { Coins, Plus, Minus, User } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useActiveCharacter } from "@/lib/active-character-context"

interface WalletManagerProps {
  language: Language
}

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface Wallet {
  PP: number
  GP: number
  EP: number
  SP: number
  CP: number
}

export function WalletManager({ language }: WalletManagerProps) {
  const t = translations[language]
  const { activeCharacter } = useActiveCharacter()
  const [wallet, setWallet] = useState<Wallet>({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
  const [currency, setCurrency] = useState<CurrencyType>("GP")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [totalWealth, setTotalWealth] = useState<number>(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (activeCharacter) {
      loadWalletFromSupabase()
    } else {
      setWallet({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
      setTotalWealth(0)
    }
  }, [activeCharacter])

  const loadWalletFromSupabase = async () => {
    if (!activeCharacter) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("wallets").select("*").eq("character_id", activeCharacter.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newWallet, error: insertError } = await supabase
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

          if (insertError) throw insertError
          setWallet({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
          setTotalWealth(0)
        } else {
          throw error
        }
      } else {
        setWallet({
          PP: data.platinum,
          GP: data.gold,
          EP: data.electrum,
          SP: data.silver,
          CP: data.copper,
        })
        setTotalWealth(Number.parseFloat(data.total_wealth) || 0)
      }
    } catch (error) {
      console.error("Error loading wallet:", error)
      setMessage({ type: "error", text: "Error loading wallet from database" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveWalletToSupabase = async (
    updatedWallet: Wallet,
    movementType: "add" | "remove",
    currency: CurrencyType,
    amount: number,
  ) => {
    try {
      if (!activeCharacter) {
        throw new Error("No active character")
      }

      const { data, error } = await supabase
        .from("wallets")
        .update({
          platinum: updatedWallet.PP,
          gold: updatedWallet.GP,
          electrum: updatedWallet.EP,
          silver: updatedWallet.SP,
          copper: updatedWallet.CP,
        })
        .eq("character_id", activeCharacter.id)
        .select()
        .single()

      if (error) throw error

      const { error: movementError } = await supabase.from("movements").insert({
        character_id: activeCharacter.id,
        from_currency: currency,
        to_currency: currency,
        amount_from: movementType === "add" ? amount : -amount,
        amount_to: movementType === "add" ? amount : -amount,
        movement_type: movementType,
      })

      if (movementError) {
        console.error("Error recording movement:", movementError)
      }

      if (data) {
        setTotalWealth(Number.parseFloat(data.total_wealth) || 0)
      }
    } catch (error) {
      console.error("Error saving wallet:", error)
      setMessage({ type: "error", text: "Error saving wallet to database" })
    }
  }

  const currencies = [
    { id: "PP", name: t.currencies.platinum },
    { id: "GP", name: t.currencies.gold },
    { id: "EP", name: t.currencies.electrum },
    { id: "SP", name: t.currencies.silver },
    { id: "CP", name: t.currencies.copper },
  ]

  const handleAdd = async () => {
    const amt = Number.parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    const updatedWallet = { ...wallet, [currency]: wallet[currency] + amt }
    setWallet(updatedWallet)
    await saveWalletToSupabase(updatedWallet, "add", currency, amt)
    setMessage({ type: "success", text: t.wallet.success })
    setAmount("")
  }

  const handleRemove = async () => {
    const amt = Number.parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    if (wallet[currency] < amt) {
      setMessage({ type: "error", text: t.wallet.insufficientFunds })
      return
    }

    const updatedWallet = { ...wallet, [currency]: wallet[currency] - amt }
    setWallet(updatedWallet)
    await saveWalletToSupabase(updatedWallet, "remove", currency, amt)
    setMessage({ type: "success", text: t.wallet.success })
    setAmount("")
  }

  const hasCharacter = !!activeCharacter

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="text-center border-b">
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t.wallet.title}
        </CardTitle>
        <CardDescription>{t.wallet.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {hasCharacter && activeCharacter && (
          <div className="bg-accent/20 rounded-lg p-4 border border-accent/30">
            <div className="flex items-center gap-3">
              <div className="bg-accent/30 p-2 rounded-full">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t.wallet.managingWallet}</div>
                <div className="font-semibold text-lg">{activeCharacter.name}</div>
                <div className="text-sm text-muted-foreground">{activeCharacter.race}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">{t.wallet.balance}</h3>
          <div className="grid grid-cols-5 gap-3">
            {currencies.map((curr) => (
              <div
                key={curr.id}
                className="bg-muted rounded-lg p-3 text-center border border-border hover:border-primary transition-colors"
              >
                <div className="text-xs text-muted-foreground mb-1">{curr.id}</div>
                <div className="font-bold text-lg">{wallet[curr.id as CurrencyType]}</div>
                <div className="text-xs text-muted-foreground mt-1">{curr.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.wallet.totalWealth}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Number.isInteger(totalWealth) ? totalWealth : totalWealth.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">{t.wallet.totalInGold}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-currency">{t.wallet.currency}</Label>
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value as CurrencyType)}
                disabled={!hasCharacter}
              >
                <SelectTrigger id="wallet-currency">
                  <SelectValue placeholder={t.wallet.selectCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.id} value={curr.id}>
                      {curr.name} ({curr.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-amount">{t.wallet.amount}</Label>
              <Input
                id="wallet-amount"
                type="number"
                min="0"
                step="1"
                placeholder={t.wallet.enterAmount}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setMessage(null)
                }}
                disabled={!hasCharacter}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAdd} className="flex-1" size="lg" disabled={isLoading || !hasCharacter}>
              <Plus className="w-4 h-4 mr-2" />
              {t.wallet.add}
            </Button>
            <Button
              onClick={handleRemove}
              variant="destructive"
              className="flex-1"
              size="lg"
              disabled={isLoading || !hasCharacter}
            >
              <Minus className="w-4 h-4 mr-2" />
              {t.wallet.remove}
            </Button>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
