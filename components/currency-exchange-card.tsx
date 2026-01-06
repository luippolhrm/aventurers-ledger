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
import {
  CurrencyConverterService,
  type CurrencyType,
} from "@/lib/application/services"

interface CurrencyExchangeCardProps {
  language: Language
}

export function CurrencyExchangeCard({ language }: CurrencyExchangeCardProps) {
  const t = translations[language].card
  const converterService = new CurrencyConverterService()
  const currencies = converterService.getCurrencies(language)

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

    try {
      const convertedAmount = converterService.convert(
        inputAmount,
        fromCurrency,
        toCurrency
      )
      setResult(convertedAmount)
    } catch (error) {
      console.error("Error converting currency:", error)
      setResult(null)
    }
  }

  const getResultText = () => {
    if (result === null) return null

    const toCurrencyData = currencies.find((c) => c.id === toCurrency)
    const fromCurrencyData = currencies.find((c) => c.id === fromCurrency)

    const displayResult = converterService.formatResult(result)

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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-center">
      <Card className="w-full max-w-[600px] shadow-xl">
        <CardHeader className="text-center space-y-2 p-4 md:p-6">
          <div className="flex justify-center mb-2">
            <div className="p-2 md:p-3 rounded-full bg-primary/10">
              <Coins className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl lg:text-3xl">{t.title}</CardTitle>
          <CardDescription className="text-sm md:text-base">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
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
    </div>
  )
}
