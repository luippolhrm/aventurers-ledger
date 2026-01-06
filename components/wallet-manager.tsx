"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type Language, translations } from "@/lib/translations"
import { Coins, Plus, Minus } from "lucide-react"
import { useServices } from "@/hooks/use-services"
import { ErrorService } from "@/lib/infrastructure/errors"
import { CharacterService } from "@/lib/application/services/character-service"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

interface WalletManagerProps {
  language: Language
  characterId: string
}

type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

interface Wallet {
  PP: number
  GP: number
  EP: number
  SP: number
  CP: number
}

export function WalletManager({ language, characterId }: WalletManagerProps) {
  const t = translations[language]
  const services = useServices()
  const characterService = new CharacterService()
  const [character, setCharacter] = useState<Character | null>(null)
  const [wallet, setWallet] = useState<Wallet>({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
  const [currency, setCurrency] = useState<CurrencyType>("GP")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [totalWealth, setTotalWealth] = useState<number>(0)

  useEffect(() => {
    if (characterId) {
      loadCharacter()
      loadWalletFromSupabase()
    } else {
      setWallet({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
      setTotalWealth(0)
      setCharacter(null)
    }
  }, [characterId])

  const loadCharacter = async () => {
    if (!characterId) return
    try {
      const char = await characterService.getCharacter(characterId)
      setCharacter(char)
    } catch (error) {
      console.error("Error loading character:", error)
      setCharacter(null)
    }
  }

  const loadWalletFromSupabase = async () => {
    if (!characterId) return

    setIsLoading(true)
    try {
      // El wallet se crea automáticamente mediante trigger al crear el personaje
      // Si no existe, esperar un poco y reintentar (el trigger puede estar procesando)
      let retries = 3
      let walletData = null

      while (retries > 0) {
        try {
          walletData = await services.wallet.getWallet(characterId)
          if (walletData) {
            break
          }
        } catch (error: any) {
          // Si es un error de "not found", continuar con reintentos
          if (error?.code !== "NOT_FOUND" && error?.code !== "PGRST116") {
            throw error
          }
        }

        retries--
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500)) // Esperar 500ms
        }
      }

      if (walletData) {
        setWallet({
          PP: walletData.platinum,
          GP: walletData.gold,
          EP: walletData.electrum,
          SP: walletData.silver,
          CP: walletData.copper,
        })
        // Calcular el total en copper y convertir a gold
        const totalInCopper = services.wallet.calculateTotalInCopper(walletData)
        const totalInGold = services.wallet.convertCurrency(totalInCopper, "CP", "GP")
        setTotalWealth(totalInGold)
      } else {
        // Si después de los reintentos aún no existe, inicializar con valores por defecto
        setWallet({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 })
        setTotalWealth(0)
      }
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

  const saveWalletToSupabase = async (
    updatedWallet: Wallet,
    movementType: "add" | "remove",
    currency: CurrencyType,
    amount: number,
  ) => {
    try {
      if (!characterId) {
        throw new Error("No character ID provided")
      }

      // Actualizar wallet usando WalletService
      await services.wallet.updateWallet(characterId, {
        platinum: updatedWallet.PP,
        gold: updatedWallet.GP,
        electrum: updatedWallet.EP,
        silver: updatedWallet.SP,
        copper: updatedWallet.CP,
      })

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
    } catch (error) {
      console.error("Error saving wallet:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      setMessage({ type: "error", text: errorMessage || "Error saving wallet to database" })
      throw error
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
    if (isNaN(amt) || amt <= 0 || !Number.isFinite(amt)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    setIsLoading(true)
    try {
      const updatedWallet = { ...wallet, [currency]: wallet[currency] + amt }
      console.log("[v0] Saving wallet:", { character: characterId, updatedWallet, currency, amt })

      await saveWalletToSupabase(updatedWallet, "add", currency, amt)
      setWallet(updatedWallet)
      setAmount("")
      console.log("[v0] Wallet saved successfully")
    } catch (error) {
      console.error("[v0] Error in handleAdd:", error)
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    const amt = Number.parseFloat(amount)
    if (isNaN(amt) || amt <= 0 || !Number.isFinite(amt)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    if (wallet[currency] < amt) {
      setMessage({ type: "error", text: t.wallet.insufficientFunds })
      return
    }

    setIsLoading(true)
    try {
      const updatedWallet = { ...wallet, [currency]: wallet[currency] - amt }
      console.log("[v0] Removing wallet:", { character: characterId, updatedWallet, currency, amt })

      await saveWalletToSupabase(updatedWallet, "remove", currency, amt)
      setWallet(updatedWallet)
      setAmount("")
      console.log("[v0] Wallet removed successfully")
    } catch (error) {
      console.error("[v0] Error in handleRemove:", error)
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
    } finally {
      setIsLoading(false)
    }
  }

  const hasCharacter = !!characterId && !!character

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
          <div className="space-y-2 md:space-y-3">
            <h3 className="font-semibold text-base md:text-lg">{t.wallet.balance}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {currencies.map((curr) => (
                <div
                  key={curr.id}
                  className="bg-muted rounded-lg p-2 md:p-3 text-center border border-border hover:border-primary transition-colors"
                >
                  <div className="text-xs text-muted-foreground mb-1">{curr.id}</div>
                  <div className="font-bold text-base md:text-lg">{wallet[curr.id as CurrencyType]}</div>
                  <div className="text-xs text-muted-foreground mt-1">{curr.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-3 md:p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="font-semibold text-sm md:text-base">{t.wallet.totalWealth}</span>
              </div>
              <div className="text-right">
                <div className="text-xl md:text-2xl font-bold text-primary">
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
              <AlertDescription className="text-sm md:text-base">{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
