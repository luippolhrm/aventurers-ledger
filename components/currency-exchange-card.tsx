"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Coins, ArrowRightLeft } from "lucide-react"
import { type Language, translations } from "@/lib/translations"

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface Currency {
  id: CurrencyType
  text: string
  valueInCP: number
}

const getCurrencies = (language: Language): Currency[] => {
  const t = translations[language].currencies
  return [
    { id: "PP", text: t.platinum, valueInCP: 1000 },
    { id: "GP", text: t.gold, valueInCP: 100 },
    { id: "EP", text: t.electrum, valueInCP: 50 },
    { id: "SP", text: t.silver, valueInCP: 10 },
    { id: "CP", text: t.copper, valueInCP: 1 },
  ]
}

interface CurrencyExchangeCardProps {
  language: Language
}

export function CurrencyExchangeCard({ language }: CurrencyExchangeCardProps) {
  const t = translations[language].card
  const currencies = getCurrencies(language)

  const [fromCurrency, setFromCurrency] = useState<CurrencyType>("GP")
  const [toCurrency, setToCurrency] = useState<CurrencyType>("SP")
  const [amount, setAmount] = useState<string>("")
  const [result, setResult] = useState<number | null>(null)

  const handleConvert = () => {
    const inputAmount = Number.parseFloat(amount)

    if (isNaN(inputAmount) || inputAmount <= 0) {
      setResult(null)
      return
    }

    const fromCurrencyData = currencies.find((c) => c.id === fromCurrency)
    const toCurrencyData = currencies.find((c) => c.id === toCurrency)

    if (!fromCurrencyData || !toCurrencyData) return

    const amountInCP = inputAmount * fromCurrencyData.valueInCP
    const convertedAmount = amountInCP / toCurrencyData.valueInCP

    setResult(convertedAmount)
  }

  const getResultText = () => {
    if (result === null) return null

    const toCurrencyData = currencies.find((c) => c.id === toCurrency)
    const fromCurrencyData = currencies.find((c) => c.id === fromCurrency)

    const displayResult = Number.isInteger(result) ? result.toString() : result.toFixed(2)

    return t.resultText(
      amount,
      fromCurrencyData?.text || "",
      fromCurrencyData?.id || "",
      displayResult,
      toCurrencyData?.text || "",
      toCurrencyData?.id || "",
    )
  }

  return (
    <Card className="w-full max-w-[600px] shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl md:text-3xl">{t.title}</CardTitle>
        <CardDescription className="text-base">{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="from-currency">{t.fromCurrency}</Label>
            <Select
              value={fromCurrency}
              onValueChange={(value) => {
                setFromCurrency(value as CurrencyType)
                setResult(null)
              }}
            >
              <SelectTrigger id="from-currency">
                <SelectValue placeholder={t.selectCurrency} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.text} ({currency.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="amount">{t.amount}</Label>
            <Input
              id="amount"
              type="number"
              placeholder={t.enterAmount}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setResult(null)
              }}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-accent/10">
            <ArrowRightLeft className="h-5 w-5 text-accent" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-currency">{t.toCurrency}</Label>
          <Select
            value={toCurrency}
            onValueChange={(value) => {
              setToCurrency(value as CurrencyType)
              setResult(null)
            }}
          >
            <SelectTrigger id="to-currency">
              <SelectValue placeholder={t.selectCurrency} />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.text} ({currency.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleConvert} className="w-full text-base font-semibold" size="lg">
          {t.transform}
        </Button>

        {result !== null && (
          <Alert className="bg-accent/10 border-accent">
            <Coins className="h-4 w-4 text-accent" />
            <AlertDescription className="text-base">{getResultText()}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
