"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { NpcInventoryItem } from "@/lib/infrastructure/repositories/npc-inventory-repository"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { ArrowLeft, Package, Coins, User } from "lucide-react"

interface NpcLootViewProps {
  campaignId: string
  npcId: string
}

export function NpcLootView({ campaignId, npcId }: NpcLootViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [inventory, setInventory] = useState<NpcInventoryItem[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [currencyAmount, setCurrencyAmount] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId && npcId) {
      loadData()
    }
  }, [user, campaignId, npcId])

  const loadData = async () => {
    if (!user || !campaignId || !npcId) return

    setLoading(true)
    try {
      const [campaign, npc, inventoryData, members] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.npc.getNpc(npcId),
        services.npc.getNpcInventory(npcId),
        services.campaign.getCampaignMembers(campaignId),
      ])

      setIsOwner(campaign.game_master_id === user.id)

      // Obtener personajes de los miembros
      const characterIds = members
        .map((m: any) => m.character_id)
        .filter((id: string | null | undefined): id is string => id !== null && id !== undefined)

      const charactersData = await Promise.all(
        characterIds.map((id: string) => services.character.getCharacter(id))
      )

      setCharacters(charactersData)
      setInventory(inventoryData)
    } catch (error: any) {
      console.error("[v0] NpcLootView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = inventory.find((item) => item.id === selectedItemId)

  const handleDistributeItem = async () => {
    if (!user || !selectedItemId || !selectedCharacterId || !quantity) return

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    setDistributing(true)
    try {
      await services.npc.distributeItemToPlayer(npcId, selectedItemId, selectedCharacterId, qty, user.id)
      toast({
        title: "Éxito",
        description: "Item distribuido correctamente",
      })
      loadData()
      setSelectedItemId("")
      setQuantity("1")
    } catch (error: any) {
      console.error("Error distributing item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al distribuir el item",
        variant: "destructive",
      })
    } finally {
      setDistributing(false)
    }
  }

  const handleDistributeCurrency = async () => {
    if (!user || !selectedCharacterId || !currencyAmount) return

    const amount = parseInt(currencyAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    setDistributing(true)
    try {
      await services.npc.distributeCurrencyToPlayer(npcId, amount, selectedCharacterId, user.id)
      toast({
        title: "Éxito",
        description: "Monedas distribuidas correctamente",
      })
      loadData()
      setCurrencyAmount("0")
    } catch (error: any) {
      console.error("Error distributing currency:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al distribuir las monedas",
        variant: "destructive",
      })
    } finally {
      setDistributing(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npcId}`)} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al NPC
        </Button>
        <EmptyState icon={Package} title="Acceso Denegado" description="Solo el Game Master puede distribuir tesoro" />
      </div>
    )
  }

  const currencyItems = inventory.filter((item) => item.item_type === "currency")
  const totalCurrency = currencyItems.reduce(
    (sum, item) => sum + item.value_in_copper * item.quantity,
    0
  )

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npcId}`)} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al NPC
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t.marketplace?.npcs?.distributeItem || "Distribuir Tesoro"}
          </CardTitle>
          <CardDescription>
            Distribuye items y monedas del inventario del NPC a los personajes de los jugadores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distribuir Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Distribuir Items
            </h3>

            {inventory.filter((item) => item.item_type !== "currency").length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay items para distribuir</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory
                        .filter((item) => item.item_type !== "currency")
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.item_name} (x{item.quantity})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <>
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedItem.quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Cantidad"
                      />
                      <p className="text-xs text-muted-foreground">
                        Disponible: {selectedItem.quantity}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Personaje</Label>
                      <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un personaje" />
                        </SelectTrigger>
                        <SelectContent>
                          {characters.map((char) => (
                            <SelectItem key={char.id} value={char.id}>
                              {char.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleDistributeItem}
                      disabled={distributing || !selectedItemId || !selectedCharacterId || !quantity}
                      className="w-full"
                    >
                      {distributing ? "Distribuyendo..." : "Distribuir Item"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Distribuir Monedas */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Distribuir Monedas
            </h3>

            {totalCurrency === 0 ? (
              <p className="text-sm text-muted-foreground">No hay monedas para distribuir</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total disponible: {totalCurrency} CP</p>
                  <p className="text-xs text-muted-foreground">
                    ({Math.floor(totalCurrency / 1000)} PP, {Math.floor((totalCurrency % 1000) / 100)} GP,{" "}
                    {Math.floor((totalCurrency % 100) / 10)} SP, {totalCurrency % 10} CP)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad (en Copper Pieces)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={totalCurrency}
                    value={currencyAmount}
                    onChange={(e) => setCurrencyAmount(e.target.value)}
                    placeholder="Cantidad en CP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personaje</Label>
                  <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un personaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id}>
                          {char.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleDistributeCurrency}
                  disabled={distributing || !selectedCharacterId || !currencyAmount || parseInt(currencyAmount) <= 0}
                  className="w-full"
                >
                  {distributing ? "Distribuyendo..." : "Distribuir Monedas"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

