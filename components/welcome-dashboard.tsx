"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type Language, translations } from "@/lib/translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { Coins, User, Wallet, ArrowRight, ArrowLeftRight } from "lucide-react"
import { useActiveCharacter } from "@/lib/active-character-context"

interface WelcomeDashboardProps {
  language: Language
  onNavigate: (module: string) => void
}

interface Character {
  id: string
  name: string
  race: string
  level?: number
  class?: string
}

interface WalletData {
  platinum: number
  gold: number
  electrum: number
  silver: number
  copper: number
  total_wealth: number
}

interface Movement {
  id: string
  from_currency: string
  to_currency: string
  amount_from: number
  amount_to: number
  created_at: string
}

export function WelcomeDashboard({ language, onNavigate }: WelcomeDashboardProps) {
  const t = translations[language]
  const { activeCharacter } = useActiveCharacter()
  const [character, setCharacter] = useState<Character | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [recentMovements, setRecentMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeCharacter) {
      console.log("[v0] Dashboard: Active character changed:", activeCharacter)
      loadData()
    } else {
      setCharacter(null)
      setWallet(null)
      setRecentMovements([])
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
      console.log("[v0] Dashboard: Setting character from activeCharacter:", activeCharacter)
      setCharacter(activeCharacter)

      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("character_id", activeCharacter.id)
        .single()

      if (walletError && walletError.code !== "PGRST116") {
        console.error("[v0] Error loading wallet:", walletError)
      }

      setWallet(walletData)

      const { data: movementsData, error: movementsError } = await supabase
        .from("movements")
        .select("*")
        .eq("character_id", activeCharacter.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (movementsError && movementsError.code !== "PGRST116") {
        console.error("[v0] Error loading movements:", movementsError)
      }

      setRecentMovements(movementsData || [])
    } catch (error) {
      console.error("[v0] Error in loadData:", error)
    } finally {
      setLoading(false)
    }
  }

  const currencyIcons = {
    platinum: "💎",
    gold: "🪙",
    electrum: "⚡",
    silver: "🥈",
    copper: "🔶",
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t.welcome.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t.welcome.loading}</p>
        </CardContent>
      </Card>
    )
  }

  if (!character) {
    return (
      <Card className="w-full max-w-2xl border-2 border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t.welcome.noCharacter}</CardTitle>
          <CardDescription className="text-base">{t.welcome.createCharacterPrompt}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => onNavigate("characters")} size="lg" className="gap-2">
            {t.welcome.goToCharacter}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          {t.welcome.title}
        </h2>
        <p className="text-muted-foreground">{t.welcome.quickStats}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>{t.welcome.characterSummary}</CardTitle>
                <CardDescription>{t.welcome.adventurerDetails}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">{t.welcome.characterName}</span>
                <span className="font-semibold">{character.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">{t.welcome.characterRace}</span>
                <span className="font-semibold">{character.race}</span>
              </div>
              {character.level && (
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">{t.welcome.characterLevel}</span>
                  <span className="font-semibold">{character.level}</span>
                </div>
              )}
              {character.class && (
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">{t.welcome.characterClass}</span>
                  <span className="font-semibold">{character.class}</span>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("character")}>
              <User className="w-4 h-4" />
              {t.sidebar.character}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>{t.welcome.wealthSummary}</CardTitle>
                <CardDescription>{t.welcome.coinCollection}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {wallet ? (
              <>
                <div className="p-4 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">{t.welcome.totalWealth}</p>
                  <p className="text-3xl font-bold">{wallet.total_wealth.toFixed(2)} GP</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t.welcome.coinBreakdown}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries({
                      platinum: wallet.platinum,
                      gold: wallet.gold,
                      electrum: wallet.electrum,
                      silver: wallet.silver,
                      copper: wallet.copper,
                    }).map(([currency, amount]) => (
                      <div key={currency} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span>{currencyIcons[currency as keyof typeof currencyIcons]}</span>
                        <span className="text-sm font-medium">{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("wallet")}>
                  <Coins className="w-4 h-4" />
                  {t.sidebar.wallet}
                </Button>
              </>
            ) : (
              <Alert>
                <AlertDescription>{t.welcome.noWalletData}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {recentMovements.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                {t.movements.recentMovements}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("movements")}>
                {t.movements.viewAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                  <span className="text-muted-foreground">
                    {new Date(movement.created_at).toLocaleDateString(language)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {movement.amount_from} {movement.from_currency}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium">
                      {Number.isInteger(movement.amount_to) ? movement.amount_to : movement.amount_to.toFixed(2)}{" "}
                      {movement.to_currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
