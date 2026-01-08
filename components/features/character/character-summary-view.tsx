"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { StatCard } from "@/components/molecules/item/stat-card"
import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import { RacialTraitService } from "@/lib/services/racial-traits-service"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { Campaign } from "@/lib/infrastructure/repositories"
import type { WalletData } from "@/lib/infrastructure/repositories"
import type { InventoryItem } from "@/lib/infrastructure/repositories/inventory-repository"
import { BODY_SLOTS, SLOT_TO_TRANSLATION_KEY } from "@/components/features/inventory/inventory.types"
import { Sword, Coins, Package, Activity, User, Weight, Shield } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface CharacterSummaryViewProps {
  characterId: string
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function CharacterSummaryView({ characterId, campaignId, language }: CharacterSummaryViewProps) {
  const { t } = useLanguage()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [itemsCount, setItemsCount] = useState<number>(0)
  const [equippedItems, setEquippedItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (characterId && campaignId) {
      loadData()
    }
  }, [characterId, campaignId])

  const loadData = async () => {
    if (!characterId || !campaignId) return

    setLoading(true)
    try {
      const [characterData, campaignData, walletData, inventoryItems, equipped] = await Promise.all([
        services.character.getCharacter(characterId),
        services.campaign.getCampaign(campaignId),
        services.wallet.getWallet(characterId).catch(() => null),
        services.inventory.getInventory(characterId).catch(() => []),
        services.inventory.getEquippedItems(characterId).catch(() => []),
      ])

      setCharacter(characterData)
      setCampaign(campaignData)
      setWallet(walletData)
      setItemsCount(inventoryItems.length)
      setEquippedItems(equipped)
    } catch (error) {
      console.error("Error loading character summary:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando resumen del personaje..." />
  }

  if (!character || !campaign) {
    return (
      <EmptyState
        icon={Sword}
        title="Error al cargar datos"
        description="No se pudieron cargar los datos del personaje o la campaña"
      />
    )
  }

  const totalWealth = wallet
    ? services.wallet.convertCurrency(services.wallet.calculateTotalInCopper(wallet), "CP", "GP")
    : 0

  // Calcular capacidad de carga
  const carryingCapacity = CharacterSheetConfigService.calculateCarryingCapacity(
    character.strength,
    character.size,
    character.racial_traits
  )

  // Verificar si hay atributos para mostrar
  const hasAbilityScores =
    character.strength ||
    character.dexterity ||
    character.constitution ||
    character.intelligence ||
    character.wisdom ||
    character.charisma

  // Función para traducir clases al español
  const translateClass = (className: string | null | undefined): string => {
    if (!className) return ""
    const classKey = className.toLowerCase() as keyof typeof t.character.classes
    return t.character.classes[classKey] || className
  }

  // Función para traducir alineamientos al español
  const translateAlignment = (alignment: string | null | undefined): string => {
    if (!alignment) return ""
    const alignmentMap: Record<string, string> = {
      lawful_good: "Legal Bueno",
      neutral_good: "Neutral Bueno",
      chaotic_good: "Caótico Bueno",
      lawful_neutral: "Legal Neutral",
      true_neutral: "Neutral Verdadero",
      chaotic_neutral: "Caótico Neutral",
      lawful_evil: "Legal Malvado",
      neutral_evil: "Neutral Malvado",
      chaotic_evil: "Caótico Malvado",
    }
    return alignmentMap[alignment.toLowerCase()] || alignment
  }

  // Función para traducir tamaño al español
  const translateSize = (size: string | null | undefined): string => {
    if (!size) return ""
    const sizeMap: Record<string, string> = {
      small: t.character.sizeSmall || "Pequeño",
      medium: t.character.sizeMedium || "Mediano",
      large: t.character.sizeLarge || "Grande",
    }
    return sizeMap[size.toLowerCase()] || size
  }

  // Función para traducir backgrounds al español
  const translateBackground = (background: string | null | undefined): string => {
    if (!background) return ""
    // Intentar encontrar el background en RacialTraitService
    const bgDefinition = RacialTraitService.getBackgroundById(background.toLowerCase())
    if (bgDefinition) {
      return bgDefinition.name
    }
    // Si no se encuentra, devolver el valor original
    return background
  }

  // Función para traducir razas al español
  const translateRace = (race: string | null | undefined): string => {
    if (!race) return ""
    const raceLower = race.toLowerCase()
    
    // Intentar buscar en el sistema 2024 (Character Origins)
    const origin = RacialTraitService.getOriginById(raceLower)
    if (origin) {
      return origin.name
    }
    
    // Intentar buscar en el sistema 2014 (Races)
    const race2014 = RacialTraitService.getRace2014ById(raceLower)
    if (race2014) {
      return race2014.name
    }
    
    // Si no se encuentra, devolver el valor original
    return race
  }

  // Función para traducir subrazas al español
  const translateSubrace = (race: string | null | undefined, subrace: string | null | undefined): string => {
    if (!subrace || !race) return ""
    const raceLower = race.toLowerCase()
    const subraceLower = subrace.toLowerCase()
    
    // Intentar buscar en el sistema 2014
    const subrace2014 = RacialTraitService.getSubrace2014ById(raceLower, subraceLower)
    if (subrace2014) {
      return subrace2014.name
    }
    
    // Si no se encuentra, devolver el valor original
    return subrace
  }

  // Verificar si hay información general para mostrar
  const hasGeneralInfo = 
    character.race ||
    character.level || 
    character.class || 
    character.subrace ||
    character.selected_lineage ||
    character.size ||
    character.alignment || 
    character.background || 
    character.character_background

  // Función para obtener el nombre traducido del slot
  const getSlotName = (slot: string): string => {
    const translationKey = SLOT_TO_TRANSLATION_KEY[slot] || slot
    return (t.inventory.slots as any)?.[translationKey]?.name || slot
  }

  // Ordenar items equipados por orden de slots
  const sortedEquippedItems = [...equippedItems].sort((a, b) => {
    if (!a.equipped_slot || !b.equipped_slot) return 0
    const indexA = BODY_SLOTS.indexOf(a.equipped_slot as any)
    const indexB = BODY_SLOTS.indexOf(b.equipped_slot as any)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="space-y-4">
      {/* Atributos de Característica */}
      {hasAbilityScores && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atributos de Característica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {character.strength && (
                <div>
                  <p className="text-sm text-muted-foreground">Fuerza</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.strength)}</p>
                </div>
              )}
              {character.dexterity && (
                <div>
                  <p className="text-sm text-muted-foreground">Destreza</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.dexterity)}</p>
                </div>
              )}
              {character.constitution && (
                <div>
                  <p className="text-sm text-muted-foreground">Constitución</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.constitution)}</p>
                </div>
              )}
              {character.intelligence && (
                <div>
                  <p className="text-sm text-muted-foreground">Inteligencia</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.intelligence)}</p>
                </div>
              )}
              {character.wisdom && (
                <div>
                  <p className="text-sm text-muted-foreground">Sabiduría</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.wisdom)}</p>
                </div>
              )}
              {character.charisma && (
                <div>
                  <p className="text-sm text-muted-foreground">Carisma</p>
                  <p className="font-medium text-lg">{CharacterSheetConfigService.formatAbilityScore(character.charisma)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles del Personaje */}
      {hasGeneralInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Detalles del Personaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Raza */}
              {character.race && (
                <div>
                  <p className="text-sm text-muted-foreground">Raza</p>
                  <p className="font-medium text-base">
                    {translateRace(character.race)}
                    {character.subrace && ` (${translateSubrace(character.race, character.subrace)})`}
                    {character.selected_lineage && ` - ${character.selected_lineage}`}
                  </p>
                </div>
              )}

              {/* Nivel */}
              {character.level && (
                <div>
                  <p className="text-sm text-muted-foreground">Nivel</p>
                  <p className="font-medium text-base">Nivel {character.level}</p>
                </div>
              )}

              {/* Clase */}
              {character.class && (
                <div>
                  <p className="text-sm text-muted-foreground">Clase</p>
                  <p className="font-medium text-base">{translateClass(character.class)}</p>
                </div>
              )}

              {/* Tamaño */}
              {character.size && (
                <div>
                  <p className="text-sm text-muted-foreground">Tamaño</p>
                  <p className="font-medium text-base">{translateSize(character.size)}</p>
                </div>
              )}

              {/* Alineamiento */}
              {character.alignment && (
                <div>
                  <p className="text-sm text-muted-foreground">Alineamiento</p>
                  <p className="font-medium text-base">{translateAlignment(character.alignment)}</p>
                </div>
              )}

              {/* Trasfondo */}
              {(character.background || character.character_background) && (
                <div>
                  <p className="text-sm text-muted-foreground">Trasfondo</p>
                  <p className="font-medium text-base">
                    {translateBackground(character.background || character.character_background)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Wealth"
          value={Number.isInteger(totalWealth) ? totalWealth.toString() : totalWealth.toFixed(2)}
          icon={Coins}
          description="En Gold Pieces"
        />
        <StatCard title="Items en Inventario" value={itemsCount.toString()} icon={Package} description="Items totales" />
        <StatCard
          title="Capacidad de Carga"
          value={`${carryingCapacity} lbs`}
          icon={Weight}
          description="Peso máximo"
        />
        
        {/* Items Equipados como StatCard */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Items Equipados</p>
                <p className="text-2xl font-bold">{equippedItems.length}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            {equippedItems.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                {sortedEquippedItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.item_name}</p>
                      {item.equipped_slot && (
                        <p className="text-xs text-muted-foreground">{getSlotName(item.equipped_slot)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aún no tienes items equipados
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

