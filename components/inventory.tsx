"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Language, translations } from "@/lib/translations"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"
import { useServices } from "@/hooks/use-services"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { Package, Plus, Shield, TrendingUp, Trash2, Edit, User, Archive, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCharacterAvatar } from "@/lib/character-utils"
import Image from "next/image"

// Slots corporales (items individuales, NO contenedores)
const BODY_SLOTS = [
  "head",
  "neck",
  "shoulders",
  "body",
  "hands",
  "waist",
  "ring_left",
  "ring_right",
  "feet",
  "weapon_main",
  "weapon_off",
] as const

// Slots de contenedores (pueden almacenar items)
const CONTAINER_SLOTS = ["backpack", "pouch_left", "pouch_right"] as const

type BodySlot = (typeof BODY_SLOTS)[number]
type ContainerSlot = (typeof CONTAINER_SLOTS)[number]

// Mapeo de slot keys (snake_case) a translation keys (camelCase)
const SLOT_TO_TRANSLATION_KEY: Record<string, string> = {
  ring_left: "ringLeft",
  ring_right: "ringRight",
  weapon_main: "weaponMain",
  weapon_off: "weaponOff",
  pouch_left: "pouchLeft",
  pouch_right: "pouchRight",
}

const getSlotTranslationKey = (slot: string): string => {
  return SLOT_TO_TRANSLATION_KEY[slot] || slot
}

// Tipos de items que pueden equiparse en slots corporales
const EQUIPPABLE_ITEM_TYPES = ["weapon", "armor", "equipment", "wondrous"] as const

// Verifica si un item puede equiparse en slots corporales
const canEquipToBodySlots = (item: {
  item_type: string
  item_category?: string | null
  is_container: boolean
}): boolean => {
  if (item.is_container) return false

  // Si tiene item_category, usar el servicio para verificar
  if (item.item_category) {
    return ItemFormConfigService.canEquipCategory(item.item_category as ItemCategory)
  }

  // Fallback a item_type
  return (EQUIPPABLE_ITEM_TYPES as readonly string[]).includes(item.item_type)
}

interface InventoryProps {
  language: Language
  characterId: string
  campaignId: string
}

export function Inventory({ language, characterId, campaignId }: InventoryProps) {
  const t = translations[language]
  const { toast } = useToast()
  const services = useServices()
  const [character, setCharacter] = useState<Character | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showSlotSelector, setShowSlotSelector] = useState(false)
  const [itemToEquip, setItemToEquip] = useState<InventoryItem | null>(null)

  // Form states
  const [itemName, setItemName] = useState("")
  const [itemType, setItemType] = useState("weapon")
  const [itemCategory, setItemCategory] = useState<ItemCategory>("weapon")
  const [equippableSlot, setEquippableSlot] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [weight, setWeight] = useState("0")
  const [valueInCopper, setValueInCopper] = useState("0")
  const [description, setDescription] = useState("")
  const [equipped, setEquipped] = useState(false)
  const [isContainer, setIsContainer] = useState(false)
  const [containerCapacity, setContainerCapacity] = useState("0")
  // New effect fields
  const [wondrousType, setWondrousType] = useState("")
  const [effectDice, setEffectDice] = useState("")
  const [effectType, setEffectType] = useState("")
  const [effectTarget, setEffectTarget] = useState("")
  const [spellLevel, setSpellLevel] = useState("")
  const [spellName, setSpellName] = useState("")
  const [spellSchool, setSpellSchool] = useState("")
  const [effectDescription, setEffectDescription] = useState("")
  // Combat stats
  const [damageDice, setDamageDice] = useState("")
  const [damageType, setDamageType] = useState("")
  const [armorClass, setArmorClass] = useState("")

  // Store in container modal states
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [itemToStore, setItemToStore] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (characterId) {
      loadCharacter()
      loadInventory()
    }
  }, [characterId])

  const loadCharacter = async () => {
    if (!characterId) return

    try {
      const characterData = await services.character.getCharacter(characterId)
      setCharacter(characterData)
    } catch (error) {
      console.error("Error loading character:", error)
    }
  }

  const loadInventory = async () => {
    if (!characterId) return

    setLoading(true)
    try {
      const inventoryItems = await services.inventory.getInventory(characterId)
      setItems(inventoryItems)
    } catch (error) {
      console.error("Error loading inventory:", error)
      toast({
        title: t.inventory.error,
        description: t.inventory.loadError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setItemName("")
    setItemType("weapon")
    setItemCategory("weapon")
    setEquippableSlot("")
    setQuantity("1")
    setWeight("0")
    setValueInCopper("0")
    setDescription("")
    setEquipped(false)
    setIsContainer(false)
    setContainerCapacity("0")
    setWondrousType("")
    setEffectDice("")
    setEffectType("")
    setEffectTarget("")
    setSpellLevel("")
    setSpellName("")
    setSpellSchool("")
    setEffectDescription("")
    setDamageDice("")
    setDamageType("")
    setArmorClass("")
    setEditingItem(null)
    setSelectedSlot(null)
    setShowSlotSelector(false)
    setItemToEquip(null)
    setShowStoreModal(false)
    setItemToStore(null)
  }

  const handleAddOrUpdateItem = async () => {
    if (!characterId) return
    if (!itemName.trim()) {
      toast({
        title: t.inventory.error,
        description: t.inventory.itemNameRequired,
        variant: "destructive",
      })
      return
    }

    try {
      const itemData = {
        character_id: characterId,
        item_name: itemName.trim(),
        item_type: itemType,
        item_category: itemCategory || null,
        equippable_slot: equippableSlot || null,
        quantity: Number.parseInt(quantity) || 1,
        weight: Number.parseFloat(weight) || 0,
        value_in_copper: Number.parseInt(valueInCopper) || 0,
        description: description.trim() || null,
        equipped,
        equipped_slot: null,
        container_id: null,
        is_container: isContainer,
        container_capacity: isContainer ? Number.parseFloat(containerCapacity) || 0 : 0,
        // New effect fields
        wondrous_type: wondrousType || null,
        effect_dice: effectDice || null,
        effect_type: effectType || null,
        effect_target: effectTarget || null,
        spell_level: spellLevel ? Number.parseInt(spellLevel) : null,
        spell_name: spellName || null,
        spell_school: spellSchool || null,
        effect_description: effectDescription || null,
        // Combat stats
        damage_dice: damageDice || null,
        damage_type: damageType || null,
        armor_class: armorClass ? Number.parseInt(armorClass) : null,
      }

      if (editingItem) {
        // Update existing item
        await services.inventory.updateItem(editingItem.id, itemData)
        toast({
          title: t.inventory.success,
          description: t.inventory.itemUpdated,
        })
      } else {
        // Add new item
        await services.inventory.createItem(itemData)
        toast({
          title: t.inventory.success,
          description: t.inventory.itemAdded,
        })
      }

      loadInventory()
      resetForm()
    } catch (error: any) {
      console.error("Error adding/updating item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || (typeof error === "string" ? error : t.inventory.failedToSave),
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setItemName(item.item_name)
    setItemType(item.item_type)
    setItemCategory((item.item_category as ItemCategory) || "weapon")
    setEquippableSlot(item.equippable_slot || "")
    setQuantity(item.quantity.toString())
    setWeight(item.weight.toString())
    setValueInCopper(item.value_in_copper.toString())
    setDescription(item.description || "")
    setEquipped(item.equipped)
    setIsContainer(item.is_container)
    setContainerCapacity(item.container_capacity?.toString() || "0")
    // New effect fields
    setWondrousType(item.wondrous_type || "")
    setEffectDice(item.effect_dice || "")
    setEffectType(item.effect_type || "")
    setEffectTarget(item.effect_target || "")
    setSpellLevel(item.spell_level?.toString() || "")
    setSpellName(item.spell_name || "")
    setSpellSchool(item.spell_school || "")
    setEffectDescription(item.effect_description || "")
    // Combat stats
    setDamageDice(item.damage_dice || "")
    setDamageType(item.damage_type || "")
    setArmorClass(item.armor_class?.toString() || "")
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await services.inventory.deleteItem(itemId)

      toast({
        title: t.inventory.success,
        description: t.inventory.itemDeleted,
      })

      loadInventory()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      const errorMessage = error?.message || t.inventory.deleteError
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleToggleEquipped = async (item: InventoryItem) => {
    try {
      if (item.equipped) {
        await services.inventory.unequipItem(item.id)
      } else if (item.equippable_slot) {
        await services.inventory.equipItem(item.id, item.equippable_slot)
      }
      loadInventory()
    } catch (error: any) {
      console.error("Error toggling equipped:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  const getTotalWeight = () => items.reduce((sum, item) => sum + item.weight * item.quantity, 0).toFixed(2)

  const getTotalValue = () => items.reduce((sum, item) => sum + item.value_in_copper * item.quantity, 0)

  const equippedItems = items.filter((item) => item.equipped)

  const getItemInSlot = (slot: string) => {
    return items.find((item) => item.equipped_slot === slot)
  }

  const getItemsInContainer = (containerId: string) => {
    return items.filter((item) => item.container_id === containerId)
  }

  const containers = items.filter((item) => item.is_container)

  // Get containers that are equipped in container slots
  const getEquippedContainers = () => {
    return items.filter(
      (item) =>
        item.is_container &&
        item.equipped &&
        item.equipped_slot &&
        (CONTAINER_SLOTS as readonly string[]).includes(item.equipped_slot),
    )
  }

  // Get container equipped in specific slot
  const getContainerInSlot = (slot: ContainerSlot) => {
    return items.find((item) => item.is_container && item.equipped && item.equipped_slot === slot)
  }

  // Calculate total weight of items in a container
  const getContainerUsedWeight = (containerId: string) => {
    return getItemsInContainer(containerId).reduce((sum, item) => sum + item.weight * item.quantity, 0)
  }

  // Calculate available capacity in a container
  const getContainerAvailableCapacity = (container: InventoryItem) => {
    const usedWeight = getContainerUsedWeight(container.id)
    return container.container_capacity - usedWeight
  }

  // Store item in container
  const handleStoreInContainer = async (item: InventoryItem, containerId: string) => {
    try {
      await services.inventory.storeInContainer(item.id, containerId)

      toast({
        title: t.inventory.success,
        description: t.inventory.itemStored,
      })

      loadInventory()
      setShowStoreModal(false)
      setItemToStore(null)
    } catch (error: any) {
      console.error("Error storing item:", error)
      const errorMessage = error?.message || t.inventory.failedToSave
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Remove item from container
  const handleRemoveFromContainer = async (item: InventoryItem) => {
    try {
      await services.inventory.removeFromContainer(item.id)

      toast({
        title: t.inventory.success,
        description: t.inventory.itemRemovedFromContainer,
      })

      loadInventory()
    } catch (error: any) {
      console.error("Error removing item from container:", error)
      const errorMessage = error?.message || t.inventory.failedToSave
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Check if item can be equipped in a body slot (NOT a container slot)
  const canEquipToBodySlot = (item: InventoryItem, slot: string) => {
    // Container slots are only for containers
    if ((CONTAINER_SLOTS as readonly string[]).includes(slot)) {
      return item.is_container
    }
    // Body slots are for non-container items
    if (item.is_container) return false

    // For wondrous items, validate slot based on wondrous_type
    if (item.item_category === "wondrous" && item.wondrous_type) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        "wondrous",
        item.item_type || undefined,
        item.wondrous_type || undefined,
      )
      return availableSlots.includes(slot)
    }

    // For other equippable items, check if slot is available for category
    if (item.item_category) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        item.item_category as ItemCategory,
        item.item_type || undefined,
        item.wondrous_type || undefined,
      )
      if (availableSlots.length > 0) {
        return availableSlots.includes(slot)
      }
    }

    // Default: allow if item can be equipped
    return canEquipToBodySlots(item)
  }

  const handleEquipToSlot = async (item: InventoryItem, slot: string) => {
    try {
      await services.inventory.equipItem(item.id, slot)

      toast({
        title: t.inventory.success,
        description: t.inventory.itemEquipped,
      })

      loadInventory()
      setShowSlotSelector(false)
      setItemToEquip(null)
    } catch (error: any) {
      console.error("Error equipping item:", error)
      const errorMessage = error?.message || t.inventory.equipError
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleUnequipFromSlot = async (item: InventoryItem) => {
    try {
      await inventoryService.unequipItem(item.id)

      toast({
        title: t.inventory.success,
        description: t.inventory.itemUnequipped,
      })

      loadInventory()
    } catch (error: any) {
      console.error("Error unequipping item:", error)
      const errorMessage = error?.message || t.inventory.equipError
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const renderEquipmentSlot = (slotKey: string, slotLabel: string, slotDescription: string) => {
    const item = getItemInSlot(slotKey)
    const isContainerSlot = (CONTAINER_SLOTS as readonly string[]).includes(slotKey)

    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{slotLabel}</CardTitle>
          <CardDescription className="text-xs">{slotDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {item ? (
            <div className="space-y-2">
              <p className="font-semibold text-sm">{item.item_name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => handleUnequipFromSlot(item)}
              >
                {t.inventory.unequip}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">{t.inventory.emptySlot}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedSlot(slotKey)
                  setItemToEquip(null)
                  setShowSlotSelector(true)
                }}
              >
                {t.inventory.equipItem}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render a container slot with its contents
  const renderContainerSlot = (slotKey: ContainerSlot, slotLabel: string, slotDescription: string) => {
    const container = getContainerInSlot(slotKey)

    return (
      <Card className="hover:border-primary/50 transition-colors h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Archive className="w-4 h-4" />
            {slotLabel}
          </CardTitle>
          <CardDescription className="text-xs">{slotDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {container ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{container.item_name}</p>
                <Button variant="ghost" size="sm" onClick={() => handleUnequipFromSlot(container)}>
                  {t.inventory.unequip}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{t.inventory.currentLoad}:</span>{" "}
                {getContainerUsedWeight(container.id).toFixed(2)} / {container.container_capacity} lb
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((getContainerUsedWeight(container.id) / container.container_capacity) * 100, 100)}%`,
                  }}
                />
              </div>
              {/* Items in container */}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {getItemsInContainer(container.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">{t.inventory.emptyContainer}</p>
                ) : (
                  getItemsInContainer(container.id).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b pb-1">
                      <span className="truncate flex-1">
                        {item.item_name} {item.quantity > 1 && `(x${item.quantity})`}
                      </span>
                      <span className="text-muted-foreground ml-2">{(item.weight * item.quantity).toFixed(1)} lb</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => handleRemoveFromContainer(item)}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Archive className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground mb-2">{t.inventory.emptySlot}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedSlot(slotKey)
                  setItemToEquip(null)
                  setShowSlotSelector(true)
                }}
              >
                {t.inventory.equipItem}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!characterId) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              {t.inventory.title}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">{t.inventory.noCharacterSelected}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5" />
            {t.inventory.title}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t.inventory.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="items">{t.inventory.tabs.items}</TabsTrigger>
            <TabsTrigger value="add">{t.inventory.tabs.add}</TabsTrigger>
            <TabsTrigger value="equipped">{t.inventory.tabs.equipped}</TabsTrigger>
            <TabsTrigger value="summary">{t.inventory.tabs.summary}</TabsTrigger>
          </TabsList>

          {/* Items List Tab */}
          <TabsContent value="items" className="space-y-4">
            {loading ? (
              <LoadingState message={t.inventory.loading} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t.inventory.noItems}
                description="Add your first item to get started"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.inventory.itemName}</TableHead>
                      <TableHead>{t.inventory.type}</TableHead>
                      <TableHead className="text-right">{t.inventory.quantity}</TableHead>
                      <TableHead className="text-right">{t.inventory.weight}</TableHead>
                      <TableHead className="text-right">{t.inventory.value}</TableHead>
                      <TableHead className="text-center">{t.inventory.equipped}</TableHead>
                      <TableHead className="text-right">{t.inventory.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const containerItem = item.container_id
                        ? items.find((c) => c.id === item.container_id)
                        : null

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{item.item_name}</span>
                              {item.is_container && (
                                <span className="text-xs text-muted-foreground">
                                  📦 {item.container_capacity} lb cap.
                                </span>
                              )}
                              {containerItem && (
                                <span className="text-xs text-primary">
                                  📍 {containerItem.item_name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{t.inventory.types[item.item_type as keyof typeof t.inventory.types]}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.weight} lb</TableCell>
                          <TableCell className="text-right">{copperToGold(item.value_in_copper)} gp</TableCell>
                          <TableCell className="text-center">
                            {item.equipped_slot ? (
                              // Item is equipped in a slot - show badge, click to unequip
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleUnequipFromSlot(item)}
                                title={t.inventory.unequip}
                              >
                                {t.inventory.slots[getSlotTranslationKey(item.equipped_slot) as keyof typeof t.inventory.slots]?.name ||
                                  item.equipped_slot}
                              </Button>
                            ) : item.container_id ? (
                              // Item is stored in a container - show container name (no equip option)
                              <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                                📍 {containerItem?.item_name}
                              </span>
                            ) : canEquipToBodySlots(item) || item.is_container ? (
                              // Item can be equipped (weapon/armor/equipment or container)
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setItemToEquip(item)
                                  setShowSlotSelector(true)
                                  setSelectedSlot(null)
                                }}
                              >
                                {t.inventory.equipItem}
                              </Button>
                            ) : (
                              // Item cannot be equipped (consumable, treasure, other) - show dash
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {/* Store in container button - only for non-containers that aren't already stored */}
                              {!item.is_container && !item.container_id && !item.equipped_slot && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setItemToStore(item)
                                    setShowStoreModal(true)
                                  }}
                                  title={t.inventory.storeIn}
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Remove from container button */}
                              {item.container_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFromContainer(item)}
                                  title={t.inventory.removeFromContainer}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Add/Edit Item Tab */}
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              {editingItem && (
                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <p className="text-sm">
                    {t.inventory.editingItem}: {editingItem.item_name}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    {t.inventory.cancelEdit}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">{t.inventory.itemName}</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={t.inventory.itemNamePlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemType">{t.inventory.type}</Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger id="itemType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weapon">{t.inventory.types.weapon}</SelectItem>
                      <SelectItem value="armor">{t.inventory.types.armor}</SelectItem>
                      <SelectItem value="equipment">{t.inventory.types.equipment}</SelectItem>
                      <SelectItem value="consumable">{t.inventory.types.consumable}</SelectItem>
                      <SelectItem value="treasure">{t.inventory.types.treasure}</SelectItem>
                      <SelectItem value="other">{t.inventory.types.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCategory">{t.marketplace?.itemCategory || "Category"}</Label>
                  <Select value={itemCategory} onValueChange={(value) => setItemCategory(value as ItemCategory)}>
                    <SelectTrigger id="itemCategory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ItemFormConfigService.getAllCategories().map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic equippable slot selector */}
                {ItemFormConfigService.canEquipCategory(itemCategory) && (
                  <div className="space-y-2">
                    <Label htmlFor="equippableSlot">{t.inventory.equippableSlot}</Label>
                    <Select value={equippableSlot} onValueChange={setEquippableSlot}>
                      <SelectTrigger id="equippableSlot">
                        <SelectValue placeholder={t.inventory.selectSlot} />
                      </SelectTrigger>
                      <SelectContent>
                        {ItemFormConfigService.getAvailableSlots(itemCategory, itemType, wondrousType).map((slot) => {
                          const slotKey = slot.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                          const slotTranslation = t.inventory.slots?.[slotKey as keyof typeof t.inventory.slots]
                          return (
                            <SelectItem key={slot} value={slot}>
                              {slotTranslation?.name || slot}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity">{t.inventory.quantity}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">{t.inventory.weightLabel}</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueInCopper">{t.inventory.valueInCopper}</Label>
                  <Input
                    id="valueInCopper"
                    type="number"
                    min="0"
                    value={valueInCopper}
                    onChange={(e) => setValueInCopper(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    ≈ {copperToGold(Number.parseInt(valueInCopper) || 0)} {t.inventory.goldPieces}
                  </p>
                </div>

                <div className="space-y-2 flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="equipped"
                    checked={equipped}
                    onChange={(e) => setEquipped(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="equipped">{t.inventory.equippedLabel}</Label>
                </div>

                <div className="space-y-2 flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isContainer"
                    checked={isContainer}
                    onChange={(e) => {
                      setIsContainer(e.target.checked)
                      if (e.target.checked) {
                        setItemType("equipment")
                        if (!equippableSlot) setEquippableSlot("backpack")
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isContainer">{t.inventory.isContainer}</Label>
                </div>

                {isContainer && (
                  <div className="space-y-2">
                    <Label htmlFor="containerCapacity">{t.inventory.containerCapacity}</Label>
                    <Input
                      id="containerCapacity"
                      type="number"
                      min="0"
                      step="0.5"
                      value={containerCapacity}
                      onChange={(e) => setContainerCapacity(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {isContainer && (
                <div className="space-y-2">
                  <Label>{t.inventory.equippableSlot} ({t.inventory.containerType})</Label>
                  <Select value={equippableSlot} onValueChange={setEquippableSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.inventory.selectSlot} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backpack">{t.inventory.slots.backpack?.name || "Backpack"}</SelectItem>
                      <SelectItem value="pouch_left">{t.inventory.slots.pouchLeft?.name || "Left Pouch"}</SelectItem>
                      <SelectItem value="pouch_right">{t.inventory.slots.pouchRight?.name || "Right Pouch"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">{t.inventory.descriptionLabel}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.inventory.descriptionPlaceholder}
                  rows={3}
                />
              </div>

              {/* Dynamic Fields based on Category */}
              {(() => {
                const categoryFields = ItemFormConfigService.getFieldsForCategory(itemCategory)
                const conditionalFields = ItemFormConfigService.getConditionalFields(itemCategory, {
                  wondrous_type: wondrousType,
                })

                if (categoryFields.length === 0 && conditionalFields.length === 0) return null

                return (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">
                      {itemCategory === "weapon" || itemCategory === "armor"
                        ? "Combat Stats"
                        : itemCategory === "potion"
                          ? "Potion Effects"
                          : itemCategory === "scroll"
                            ? "Spell Information"
                            : itemCategory === "wondrous"
                              ? "Wondrous Item Details"
                              : "Item Effects"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryFields.map((field) => {
                        if (field.type === "text" || field.type === "number") {
                          const fieldValue =
                            field.id === "damage_dice"
                              ? damageDice
                              : field.id === "armor_class"
                                ? armorClass
                                : field.id === "effect_dice"
                                  ? effectDice
                                  : field.id === "spell_level"
                                    ? spellLevel
                                    : field.id === "spell_name"
                                      ? spellName
                                      : ""

                          const setFieldValue = (value: string) => {
                            if (field.id === "damage_dice") setDamageDice(value)
                            else if (field.id === "armor_class") setArmorClass(value)
                            else if (field.id === "effect_dice") setEffectDice(value)
                            else if (field.id === "spell_level") setSpellLevel(value)
                            else if (field.id === "spell_name") setSpellName(value)
                          }

                          return (
                            <div key={field.id}>
                              <Label htmlFor={field.id}>{field.label}</Label>
                              <Input
                                id={field.id}
                                type={field.type}
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                placeholder={field.placeholder}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                              />
                              {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                            </div>
                          )
                        }

                        if (field.type === "select") {
                          const options = field.options || []
                          const fieldValue =
                            field.id === "damage_type"
                              ? damageType
                              : field.id === "effect_type"
                                ? effectType
                                : field.id === "effect_target"
                                  ? effectTarget
                                  : field.id === "spell_school"
                                    ? spellSchool
                                    : field.id === "wondrous_type"
                                      ? wondrousType
                                      : ""

                          const setFieldValue = (value: string) => {
                            if (field.id === "damage_type") setDamageType(value)
                            else if (field.id === "effect_type") setEffectType(value)
                            else if (field.id === "effect_target") setEffectTarget(value)
                            else if (field.id === "spell_school") setSpellSchool(value)
                            else if (field.id === "wondrous_type") setWondrousType(value)
                          }

                          return (
                            <div key={field.id}>
                              <Label htmlFor={field.id}>{field.label}</Label>
                              <Select value={fieldValue} onValueChange={setFieldValue}>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                            </div>
                          )
                        }

                        if (field.type === "textarea") {
                          return (
                            <div key={field.id} className="col-span-2">
                              <Label htmlFor={field.id}>{field.label}</Label>
                              <Textarea
                                id={field.id}
                                value={effectDescription}
                                onChange={(e) => setEffectDescription(e.target.value)}
                                placeholder={field.placeholder}
                                rows={3}
                              />
                              {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                            </div>
                          )
                        }

                        return null
                      })}

                      {/* Conditional Fields */}
                      {conditionalFields.map((field) => {
                        if (field.type === "select") {
                          const options = field.options || []
                          return (
                            <div key={field.id}>
                              <Label htmlFor={field.id}>{field.label}</Label>
                              <Select value={equippableSlot} onValueChange={setEquippableSlot}>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )
              })()}

              <Button onClick={handleAddOrUpdateItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {editingItem ? t.inventory.updateItem : t.inventory.addItem}
              </Button>
            </div>
          </TabsContent>

          {/* Equipped Items Tab */}
          <TabsContent value="equipped" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Head, Neck, Shoulders, Body */}
              <div className="space-y-4">
                {renderEquipmentSlot(
                  "head",
                  t.inventory.slots.head.name as string,
                  t.inventory.slots.head.description as string,
                )}
                {renderEquipmentSlot(
                  "neck",
                  t.inventory.slots.neck.name as string,
                  t.inventory.slots.neck.description as string,
                )}
                {renderEquipmentSlot(
                  "shoulders",
                  t.inventory.slots.shoulders.name as string,
                  t.inventory.slots.shoulders.description as string,
                )}
                {renderEquipmentSlot(
                  "body",
                  t.inventory.slots.body.name as string,
                  t.inventory.slots.body.description as string,
                )}
              </div>

              {/* Center Column - Character visual representation */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {character ? (
                  <div className="relative w-48 h-48 rounded-full overflow-hidden bg-muted border-2 border-primary/20 flex-shrink-0">
                    <Image
                      src={getCharacterAvatar(character)}
                      alt={character.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-32 h-32 text-muted-foreground/30" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold">{character?.name || "No character selected"}</p>
                  <p className="text-sm text-muted-foreground">{character?.race || ""}</p>
                </div>
              </div>

              {/* Right Column - Hands, Waist, Rings, Feet */}
              <div className="space-y-4">
                {renderEquipmentSlot(
                  "hands",
                  t.inventory.slots.hands.name as string,
                  t.inventory.slots.hands.description as string,
                )}
                {renderEquipmentSlot(
                  "waist",
                  t.inventory.slots.waist.name as string,
                  t.inventory.slots.waist.description as string,
                )}
                {renderEquipmentSlot(
                  "ring_left",
                  t.inventory.slots.ringLeft.name as string,
                  t.inventory.slots.ringLeft.description as string,
                )}
                {renderEquipmentSlot(
                  "ring_right",
                  t.inventory.slots.ringRight.name as string,
                  t.inventory.slots.ringRight.description as string,
                )}
                {renderEquipmentSlot(
                  "feet",
                  t.inventory.slots.feet.name as string,
                  t.inventory.slots.feet.description as string,
                )}
              </div>
            </div>

            {/* Weapons Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t.inventory.weaponsTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEquipmentSlot(
                  "weapon_main",
                  t.inventory.slots.weaponMain.name as string,
                  t.inventory.slots.weaponMain.description as string,
                )}
                {renderEquipmentSlot(
                  "weapon_off",
                  t.inventory.slots.weaponOff.name as string,
                  t.inventory.slots.weaponOff.description as string,
                )}
              </div>
            </div>

            {/* Container Slots Section - 3 columns */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t.inventory.containerSlotsTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderContainerSlot(
                  "pouch_left",
                  t.inventory.slots.pouchLeft?.name || "Left Pouch",
                  t.inventory.slots.pouchLeft?.description || "Small container",
                )}
                {renderContainerSlot(
                  "backpack",
                  t.inventory.slots.backpack?.name || "Backpack",
                  t.inventory.slots.backpack?.description || "Main container",
                )}
                {renderContainerSlot(
                  "pouch_right",
                  t.inventory.slots.pouchRight?.name || "Right Pouch",
                  t.inventory.slots.pouchRight?.description || "Small container",
                )}
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {t.inventory.totalItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {equippedItems.length} {t.inventory.equippedCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t.inventory.totalWeight}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{getTotalWeight()}</p>
                  <p className="text-sm text-muted-foreground">{t.inventory.pounds}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t.inventory.totalValue}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{copperToGold(getTotalValue())}</p>
                  <p className="text-sm text-muted-foreground">{t.inventory.goldPieces}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.inventory.itemsByType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    items.reduce(
                      (acc, item) => {
                        acc[item.item_type] = (acc[item.item_type] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span>{t.inventory.types[type as keyof typeof t.inventory.types]}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal: Select item for a slot (from Equipped tab) */}
        {showSlotSelector && selectedSlot && !itemToEquip && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{t.inventory.selectItemToEquip}</CardTitle>
                <CardDescription>
                  {t.inventory.equipToSlot}:{" "}
                  {selectedSlot && t.inventory.slots[getSlotTranslationKey(selectedSlot) as keyof typeof t.inventory.slots]?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {items
                  .filter((item) => {
                    if (item.equipped_slot) return false
                    if (item.container_id) return false
                    if ((CONTAINER_SLOTS as readonly string[]).includes(selectedSlot)) {
                      return item.is_container
                    }
                    if (item.is_container) return false

                    // Validate that item can be equipped to this slot
                    return canEquipToBodySlot(item, selectedSlot)
                  })
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => handleEquipToSlot(item, selectedSlot)}
                    >
                      <span className="flex-1 text-left">
                        {item.item_name} - {t.inventory.types[item.item_type as keyof typeof t.inventory.types]}
                      </span>
                      {item.is_container && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.container_capacity} lb cap.)
                        </span>
                      )}
                    </Button>
                  ))}
                {items.filter((item) => {
                  if (item.equipped_slot) return false
                  if (item.container_id) return false
                  if ((CONTAINER_SLOTS as readonly string[]).includes(selectedSlot)) {
                    return item.is_container
                  }
                  return !item.is_container
                }).length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">{t.inventory.noAvailableItems}</p>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowSlotSelector(false)
                    setSelectedSlot(null)
                  }}
                >
                  {t.inventory.cancel}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal: Select slot for an item (from Items tab) */}
        {showSlotSelector && itemToEquip && !selectedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t.inventory.equipToSlot}</CardTitle>
                <CardDescription>{itemToEquip.item_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {itemToEquip.is_container ? (
                  // Container: show container slots
                  <>
                    {CONTAINER_SLOTS.map((slot) => {
                      const existingItem = getItemInSlot(slot)
                      return (
                        <Button
                          key={slot}
                          variant="outline"
                          className="w-full justify-between bg-transparent"
                          onClick={() => handleEquipToSlot(itemToEquip, slot)}
                        >
                          <span>{t.inventory.slots[getSlotTranslationKey(slot) as keyof typeof t.inventory.slots]?.name || slot}</span>
                          {existingItem && (
                            <span className="text-xs text-muted-foreground">({existingItem.item_name})</span>
                          )}
                        </Button>
                      )
                    })}
                  </>
                ) : (
                  // Regular item: show body slots (filtered by item type/category)
                  <>
                    {(() => {
                      // Get available slots for this item
                      const availableSlots =
                        itemToEquip.item_category && itemToEquip.item_category !== "equipment"
                          ? ItemFormConfigService.getAvailableSlots(
                              itemToEquip.item_category as ItemCategory,
                              itemToEquip.item_type || undefined,
                              itemToEquip.wondrous_type || undefined,
                            )
                          : BODY_SLOTS

                      // If no specific slots, show all body slots
                      const slotsToShow = availableSlots.length > 0 ? availableSlots : BODY_SLOTS

                      return slotsToShow
                        .filter((slot) => !(CONTAINER_SLOTS as readonly string[]).includes(slot))
                        .map((slot) => {
                          const existingItem = getItemInSlot(slot)
                          return (
                            <Button
                              key={slot}
                              variant="outline"
                              className="w-full justify-between bg-transparent"
                              onClick={() => handleEquipToSlot(itemToEquip, slot)}
                            >
                              <span>
                                {t.inventory.slots[getSlotTranslationKey(slot) as keyof typeof t.inventory.slots]?.name ||
                                  slot}
                              </span>
                              {existingItem && (
                                <span className="text-xs text-muted-foreground">({existingItem.item_name})</span>
                              )}
                            </Button>
                          )
                        })
                    })()}
                  </>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowSlotSelector(false)
                    setItemToEquip(null)
                  }}
                >
                  {t.inventory.cancel}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Store in container modal */}
        {showStoreModal && itemToStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t.inventory.storeInContainer}</CardTitle>
                <CardDescription>
                  {t.inventory.selectContainer}: <strong>{itemToStore.item_name}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getEquippedContainers().length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">{t.inventory.noEquippedContainers}</p>
                ) : (
                  getEquippedContainers().map((container) => {
                    const usedWeight = getContainerUsedWeight(container.id)
                    const availableCapacity = container.container_capacity - usedWeight
                    const itemWeight = itemToStore.weight * itemToStore.quantity
                    const canFit = itemWeight <= availableCapacity

                    return (
                      <Button
                        key={container.id}
                        variant="outline"
                        className={`w-full justify-start bg-transparent ${!canFit ? "opacity-50" : ""}`}
                        onClick={() => canFit && handleStoreInContainer(itemToStore, container.id)}
                        disabled={!canFit}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">{container.item_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.inventory.availableCapacity}: {availableCapacity.toFixed(1)} lb
                            {!canFit && ` (${t.inventory.capacityExceeded})`}
                          </span>
                        </div>
                      </Button>
                    )
                  })
                )}
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowStoreModal(false)
                    setItemToStore(null)
                  }}
                >
                  {t.inventory.cancel}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  )
}
