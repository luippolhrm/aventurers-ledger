"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"
import { Coins, Plus, Minus, ArrowRight, Send, TrendingUp, AlertCircle } from "lucide-react"
import { useServices } from "@/hooks/use-services"
import { useAuth } from "@/lib/auth-context"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import type { WalletData } from "@/lib/infrastructure/repositories"
import type { MovementWithDetails } from "@/lib/infrastructure/repositories"
import type { TransferWithDetails } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories"

interface FinancesProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
}

export function Finances({ language, characterId }: FinancesProps) {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [movements, setMovements] = useState<MovementWithDetails[]>([])
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([])
  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const services = useServices()

  // Balance tab states
  const [balanceCurrency, setBalanceCurrency] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")

  // Transactions tab states
  const [transFromCurrency, setTransFromCurrency] = useState("")
  const [transToCurrency, setTransToCurrency] = useState("")
  const [transAmount, setTransAmount] = useState("")

  // Transfers tab states
  const [transferToCharacter, setTransferToCharacter] = useState("")
  const [transferCurrency, setTransferCurrency] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")

  const currencies = [
    { id: "PP", name: t.currencies.platinum },
    { id: "GP", name: t.currencies.gold },
    { id: "EP", name: t.currencies.electrum },
    { id: "SP", name: t.currencies.silver },
    { id: "CP", name: t.currencies.copper },
  ]

  useEffect(() => {
    if (characterId) {
      loadAllData()
    } else {
      setWallet(null)
      setMovements([])
      setTransfers([])
      setLoading(false)
    }
  }, [characterId])

  const loadAllData = async () => {
    if (!characterId) return

    setLoading(true)
    setMessage(null)
    try {
      await Promise.all([loadWallet(), loadMovements(), loadTransfers(), loadAllCharacters()])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setMessage({ type: "error", text: "Error loading data" })
    } finally {
      setLoading(false)
    }
  }

  const loadWallet = async () => {
    if (!characterId) return

    try {
      const walletData = await services.wallet.getWallet(characterId)
      setWallet(walletData)
    } catch (error: any) {
      console.error("[v0] Error loading wallet:", error)
      setWallet({ platinum: 0, gold: 0, electrum: 0, silver: 0, copper: 0, total_wealth: 0 })
    }
  }

  const loadMovements = async () => {
    if (!characterId) return

    try {
      const movementsData = await services.movement.getMovementsWithDetails(characterId, 20)
      setMovements(movementsData)
    } catch (error: any) {
      console.error("[v0] Error loading movements:", error)
      setMovements([])
    }
  }

  const loadTransfers = async () => {
    if (!characterId) return

    try {
      const transfersData = await services.transfer.getTransfersWithDetails(characterId, 20)
      setTransfers(transfersData)
    } catch (error: any) {
      console.error("[v0] Error loading transfers:", error)
      setTransfers([])
    }
  }

  const loadAllCharacters = async () => {
    try {
      // Note: This intentionally loads ALL characters (not filtered by user_id)
      // because users need to be able to transfer money to characters from other users
      const characters = await services.character.getAllCharacters(false)
      setAllCharacters(characters)
    } catch (error: any) {
      console.error("[v0] Error loading characters:", error)
      setAllCharacters([])
    }
  }

  const handleAddCoins = async () => {
    if (!characterId || !wallet) return

    const amount = Number.parseFloat(balanceAmount)
    if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    if (!balanceCurrency) {
      setMessage({ type: "error", text: t.wallet.selectCurrency })
      return
    }

    try {
      setMessage(null)
      // Create add movement - the trigger will automatically update the wallet balance
      await services.movement.createAdd(characterId, balanceCurrency as "PP" | "GP" | "EP" | "SP" | "CP", amount)

      setMessage({ type: "success", text: t.wallet.success })
      setBalanceAmount("")
      await loadAllData()
    } catch (error: any) {
      console.error("Error adding coins:", error)
      setMessage({ type: "error", text: error?.message || t.wallet.error })
    }
  }

  const handleRemoveCoins = async () => {
    if (!characterId || !wallet) return

    const amount = Number.parseFloat(balanceAmount)
    if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
      setMessage({ type: "error", text: t.wallet.error })
      return
    }

    if (!balanceCurrency) {
      setMessage({ type: "error", text: t.wallet.selectCurrency })
      return
    }

    const currencyMap: Record<string, keyof Omit<WalletData, "total_wealth">> = {
      PP: "platinum",
      GP: "gold",
      EP: "electrum",
      SP: "silver",
      CP: "copper",
    }

    const key = currencyMap[balanceCurrency]

    if (wallet[key] < amount) {
      setMessage({ type: "error", text: t.wallet.insufficientFunds })
      return
    }

    try {
      setMessage(null)
      // Create remove movement - the trigger will automatically update the wallet balance
      await services.movement.createRemove(characterId, balanceCurrency as "PP" | "GP" | "EP" | "SP" | "CP", amount)

      setMessage({ type: "success", text: t.wallet.success })
      setBalanceAmount("")
      await loadAllData()
    } catch (error: any) {
      console.error("Error removing coins:", error)
      setMessage({ type: "error", text: error?.message || t.wallet.error })
    }
  }

  const calculateConversion = () => {
    if (!transAmount || !transFromCurrency || !transToCurrency) return 0

    const amountNum = Number.parseFloat(transAmount)
    if (isNaN(amountNum) || amountNum <= 0) return 0

    return services.movement.calculateConversion(
      amountNum,
      transFromCurrency as "PP" | "GP" | "EP" | "SP" | "CP",
      transToCurrency as "PP" | "GP" | "EP" | "SP" | "CP"
    )
  }

  const handleConversion = async () => {
    if (!characterId || !wallet) return

    const amount = Number.parseFloat(transAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: "error", text: t.movements.invalidAmount })
      return
    }

    if (!transFromCurrency || !transToCurrency) {
      setMessage({ type: "error", text: t.movements.selectCurrency })
      return
    }

    if (transFromCurrency === transToCurrency) {
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

    const fromKey = currencyMap[transFromCurrency]

    if (wallet[fromKey] < amount) {
      setMessage({ type: "error", text: t.movements.insufficientFunds })
      return
    }

    try {
      setMessage(null)
      await services.movement.createConversion(
        characterId,
        transFromCurrency as "PP" | "GP" | "EP" | "SP" | "CP",
        transToCurrency as "PP" | "GP" | "EP" | "SP" | "CP",
        amount
      )

      setMessage({ type: "success", text: t.movements.success })
      setTransAmount("")
      setTransFromCurrency("")
      setTransToCurrency("")
      await loadAllData()
    } catch (error: any) {
      console.error("Error in conversion:", error)
      setMessage({ type: "error", text: error?.message || t.wallet.error })
    }
  }

  const handleTransfer = async () => {
    if (!characterId || !wallet) return

    const amount = Number.parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: "error", text: t.finances.invalidAmount })
      return
    }

    if (!transferToCharacter) {
      setMessage({ type: "error", text: t.finances.selectRecipient })
      return
    }

    if (transferToCharacter === characterId) {
      setMessage({ type: "error", text: t.finances.cannotTransferSelf })
      return
    }

    if (!transferCurrency) {
      setMessage({ type: "error", text: t.wallet.selectCurrency })
      return
    }

    const currencyMap: Record<string, keyof Omit<WalletData, "total_wealth">> = {
      PP: "platinum",
      GP: "gold",
      EP: "electrum",
      SP: "silver",
      CP: "copper",
    }

    const key = currencyMap[transferCurrency]

    if (wallet[key] < amount) {
      setMessage({ type: "error", text: t.finances.insufficientFunds })
      return
    }

    if (!user?.id) {
      setMessage({ type: "error", text: t.wallet?.error || "You must be signed in" })
      return
    }

    try {
      setMessage(null)
      await services.transfer.createTransfer(
        user.id,
        characterId,
        transferToCharacter,
        transferCurrency as "PP" | "GP" | "EP" | "SP" | "CP",
        amount,
        transferDescription || null
      )

      setMessage({ type: "success", text: t.finances.transferSuccess })
      setTransferAmount("")
      setTransferToCharacter("")
      setTransferDescription("")
      await loadAllData()
    } catch (error: any) {
      console.error("Error in transfer:", error)
      setMessage({ type: "error", text: error?.message || t.wallet.error })
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <LoadingState message={(t.finances as any)?.loading || "Loading finances..."} />
      </div>
    )
  }

  if (!characterId) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <EmptyState
          icon={Coins}
          title={t.wallet.noCharacter || "No character selected"}
          description={t.finances.description || "Please select a character to view finances"}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          {t.finances.title}
        </h2>
        <p className="text-muted-foreground">{t.finances.description}</p>
      </div>

      <Tabs defaultValue="balance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balance">{t.finances.balanceTab}</TabsTrigger>
          <TabsTrigger value="transactions">{t.finances.transactionsTab}</TabsTrigger>
          <TabsTrigger value="transfers">{t.finances.transfersTab}</TabsTrigger>
          <TabsTrigger value="history">{t.finances.historyTab}</TabsTrigger>
        </TabsList>

        {/* Balance Tab */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                {t.wallet.balance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {currencies.map((currency) => {
                  const currencyMap: Record<string, keyof Omit<WalletData, "total_wealth">> = {
                    PP: "platinum",
                    GP: "gold",
                    EP: "electrum",
                    SP: "silver",
                    CP: "copper",
                  }
                  const balance = wallet?.[currencyMap[currency.id]] ?? 0
                  return (
                    <div key={currency.id} className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{currency.id}</div>
                      <div className="font-bold text-2xl">{balance}</div>
                      <div className="text-xs text-muted-foreground mt-1">{currency.name}</div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{t.wallet.totalWealth}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {wallet?.total_wealth && Number.isInteger(wallet.total_wealth)
                        ? wallet.total_wealth
                        : wallet?.total_wealth.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.wallet.totalInGold}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.wallet.currency}</Label>
                    <Select value={balanceCurrency} onValueChange={setBalanceCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.wallet.selectCurrency} />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.wallet.amount}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={t.wallet.enterAmount}
                      value={balanceAmount}
                      onChange={(e) => {
                        setBalanceAmount(e.target.value)
                        setMessage(null)
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAddCoins} className="flex-1" size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.wallet.add}
                  </Button>
                  <Button onClick={handleRemoveCoins} variant="destructive" className="flex-1" size="lg">
                    <Minus className="w-4 h-4 mr-2" />
                    {t.wallet.remove}
                  </Button>
                </div>
              </div>

              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className="mt-4">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.finances.conversionTitle}</CardTitle>
              <CardDescription>{t.finances.conversionDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.movements.fromCurrency}</Label>
                <Select value={transFromCurrency} onValueChange={setTransFromCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.movements.selectCurrency} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.movements.amount}</Label>
                <Input
                  type="number"
                  value={transAmount}
                  onChange={(e) => {
                    setTransAmount(e.target.value)
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
                <Label>{t.movements.toCurrency}</Label>
                <Select value={transToCurrency} onValueChange={setTransToCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.movements.selectCurrency} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {transAmount && transFromCurrency && transToCurrency && (
                <Alert>
                  <AlertDescription>
                    <strong>{t.movements.youWillReceive}:</strong>{" "}
                    {Number.isInteger(calculateConversion()) ? calculateConversion() : calculateConversion().toFixed(2)}{" "}
                    {currencies.find((c) => c.id === transToCurrency)?.name}
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
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {t.finances.sendMoney}
              </CardTitle>
              <CardDescription>{t.finances.transferDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.finances.recipient}</Label>
                <Select value={transferToCharacter} onValueChange={setTransferToCharacter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.finances.selectRecipient} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCharacters
                      .filter((c) => c.id !== characterId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.wallet.currency}</Label>
                  <Select value={transferCurrency} onValueChange={setTransferCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.wallet.selectCurrency} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.wallet.amount}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t.wallet.enterAmount}
                    value={transferAmount}
                    onChange={(e) => {
                      setTransferAmount(e.target.value)
                      setMessage(null)
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.finances.note}</Label>
                <Textarea
                  placeholder={t.finances.noteOptional}
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleTransfer} className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                {t.finances.sendTransfer}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.finances.transferHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              {transfers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.finances.noTransfers}</p>
              ) : (
                <div className="space-y-3">
                  {transfers.map((transfer) => {
                    const isSender = transfer.from_character_id === characterId
                    return (
                      <div
                        key={transfer.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isSender
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-green-500/10 border border-green-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">
                              {isSender ? (
                                <>
                                  {t.finances.sentTo} {transfer.to_character ? transfer.to_character.name : "Unknown"}
                                </>
                              ) : (
                                <>
                                  {t.finances.receivedFrom}{" "}
                                  {transfer.from_character ? transfer.from_character.name : "Unknown"}
                                </>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transfer.created_at).toLocaleString(language)}
                            </div>
                            {transfer.description && (
                              <div className="text-sm text-muted-foreground italic">{transfer.description}</div>
                            )}
                          </div>
                        </div>
                        <div className={`font-bold text-lg ${isSender ? "text-red-600" : "text-green-600"}`}>
                          {isSender ? "-" : "+"}
                          {transfer.amount} {transfer.currency}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t.movements.history}</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.movements.noHistory}</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-sm text-muted-foreground">
                          {new Date(movement.created_at).toLocaleString(language)}
                        </div>
                        {movement.movement_type === "purchase" ? (
                          <div className="flex-1">
                            <div className="font-medium text-red-600">
                              {movement.description || `Compra: ${movement.amount_from} ${movement.from_currency}`}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>-{movement.amount_from} {movement.from_currency}</div>
                              {movement.shop && movement.location && (
                                <div className="text-xs italic">
                                  {movement.shop.name} • {movement.location.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {movement.amount_from} {movement.from_currency}
                            </span>
                            {movement.from_currency !== movement.to_currency && (
                              <>
                                <ArrowRight className="w-4 h-4" />
                                <span className="font-medium">
                                  {Number.isInteger(movement.amount_to)
                                    ? movement.amount_to
                                    : movement.amount_to.toFixed(2)}{" "}
                                  {movement.to_currency}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
                          {movement.movement_type}
                        </span>
                      </div>
                      {movement.movement_type === "purchase" && (
                        <div className="font-bold text-lg text-red-600">
                          -{movement.amount_from} {movement.from_currency}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
