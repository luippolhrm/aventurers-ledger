"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface ConversionFormProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  fromCurrency: CurrencyType | ""
  toCurrency: CurrencyType | ""
  amount: string
  convertedAmount: number
  message: { type: "success" | "error"; text: string } | null
  onFromCurrencyChange: (currency: CurrencyType | "") => void
  onToCurrencyChange: (currency: CurrencyType | "") => void
  onAmountChange: (amount: string) => void
  onConvert: () => void
}

export function ConversionForm({
  language,
  fromCurrency,
  toCurrency,
  amount,
  convertedAmount,
  message,
  onFromCurrencyChange,
  onToCurrencyChange,
  onAmountChange,
  onConvert,
}: ConversionFormProps) {
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
      <div className="space-y-2">
        <Label htmlFor="from-currency">{t.movements.fromCurrency}</Label>
        <Select value={fromCurrency} onValueChange={(value) => onFromCurrencyChange(value as CurrencyType | "")}>
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
            onAmountChange(e.target.value)
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
        <Select value={toCurrency} onValueChange={(value) => onToCurrencyChange(value as CurrencyType | "")}>
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

      {amount && fromCurrency && toCurrency && convertedAmount > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{t.movements.youWillReceive}:</strong> {Number.isInteger(convertedAmount) ? convertedAmount : convertedAmount.toFixed(2)}{" "}
            {currencies.find((c) => c.id === toCurrency)?.name}
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="text-sm md:text-base">{message.text}</AlertDescription>
        </Alert>
      )}

      <Button onClick={onConvert} className="w-full" size="lg">
        {t.movements.convert}
      </Button>
    </div>
  )
}

