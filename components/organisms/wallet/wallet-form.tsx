"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Minus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface WalletFormProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  currency: CurrencyType
  amount: string
  isLoading: boolean
  disabled: boolean
  onCurrencyChange: (currency: CurrencyType) => void
  onAmountChange: (amount: string) => void
  onAdd: () => void
  onRemove: () => void
  message: { type: "success" | "error"; text: string } | null
}

export function WalletForm({
  language,
  currency,
  amount,
  isLoading,
  disabled,
  onCurrencyChange,
  onAmountChange,
  onAdd,
  onRemove,
  message,
}: WalletFormProps) {
  const { t } = useLanguage()

  const currencies = [
    { id: "PP", name: t.currencies.platinum },
    { id: "GP", name: t.currencies.gold },
    { id: "EP", name: t.currencies.electrum },
    { id: "SP", name: t.currencies.silver },
    { id: "CP", name: t.currencies.copper },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wallet-currency">{t.wallet.currency}</Label>
          <Select value={currency} onValueChange={(value) => onCurrencyChange(value as CurrencyType)} disabled={disabled}>
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
              onAmountChange(e.target.value)
            }}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onAdd} className="flex-1" size="lg" disabled={isLoading || disabled}>
          <Plus className="w-4 h-4 mr-2" />
          {t.wallet.add}
        </Button>
        <Button onClick={onRemove} variant="destructive" className="flex-1" size="lg" disabled={isLoading || disabled}>
          <Minus className="w-4 h-4 mr-2" />
          {t.wallet.remove}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="text-sm md:text-base">{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

