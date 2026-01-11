"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServices } from "@/hooks/use-services"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { InventoryGrid } from "@/components/organisms/inventory/inventory-grid"
import { InventoryForm } from "@/components/organisms/inventory/inventory-form"
import { InventoryContainerModal } from "@/components/organisms/inventory/inventory-container-modal"
import { InventorySlotSelector } from "@/components/molecules/inventory/inventory-slot-selector"
import { InventoryStats } from "@/components/molecules/inventory/inventory-stats"
import { CarryingCapacityDisplay } from "@/components/molecules/character-sheet"
import { Package, Plus, Shield, TrendingUp, User, Archive, ArrowRight } from "lucide-react"
import Image from "next/image"
import { getCharacterAvatar } from "@/lib/character-utils"
import { useLanguage } from "@/lib/language-context"
import type { InventoryFormData } from "./inventory.types"
import { CONTAINER_SLOTS, BODY_SLOTS } from "./inventory.types"
import { getSlotTranslationKey, canEquipToBodySlots } from "./inventory.utils"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"

interface InventoryViewProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
  campaignId: string
}

export function InventoryView({ language, characterId, campaignId }: InventoryViewProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showSlotSelector, setShowSlotSelector] = useState(false)
  const [itemToEquip, setItemToEquip] = useState<InventoryItem | null>(null)
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

  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  const resetForm = () => {
    setEditingItem(null)
    setSelectedSlot(null)
    setShowSlotSelector(false)
    setItemToEquip(null)
    setShowStoreModal(false)
    setItemToStore(null)
  }

  const handleAddOrUpdateItem = async (formData: InventoryFormData) => {
    if (!characterId) return

    try {
      const itemData = {
        character_id: characterId,
        ...formData,
      }

      if (editingItem) {
        await services.inventory.updateItem(editingItem.id, itemData)
        toast({
          title: t.inventory.success,
          description: t.inventory.itemUpdated,
        })
      } else {
        // Si quantity > 1, crear múltiples items individuales
        if (itemData.quantity > 1) {
          const createdItems = await services.inventory.createMultipleItems(itemData)
          toast({
            title: t.inventory.success,
            description: `${createdItems.length} ${t.inventory.itemsCreated || "items creados"}`,
          })
        } else {
          await services.inventory.createItem(itemData)
          toast({
            title: t.inventory.success,
            description: t.inventory.itemAdded,
          })
        }
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

  const handleEquip = (item: InventoryItem) => {
    setItemToEquip(item)
    setShowSlotSelector(true)
    setSelectedSlot(null)
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
      setSelectedSlot(null)
    } catch (error: any) {
      console.error("Error equipping item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const handleUnequip = async (item: InventoryItem) => {
    try {
      await services.inventory.unequipItem(item.id)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemUnequipped,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error unequipping item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const handleStore = (item: InventoryItem) => {
    setItemToStore(item)
    setShowStoreModal(true)
  }

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
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

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
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

  const getItemInSlot = (slot: string) => {
    return items.find((item) => item.equipped_slot === slot)
  }

  const getItemsInContainer = (containerId: string) => {
    return items.filter((item) => item.container_id === containerId)
  }

  const getEquippedContainers = () => {
    return items.filter(
      (item) =>
        item.is_container &&
        item.equipped &&
        item.equipped_slot &&
        CONTAINER_SLOTS.includes(item.equipped_slot as any),
    )
  }

  const getContainerInSlot = (slot: string) => {
    return items.find((item) => item.is_container && item.equipped && item.equipped_slot === slot)
  }

  const getContainerUsedWeight = (containerId: string) => {
    return getItemsInContainer(containerId).reduce((sum, item) => sum + item.weight * item.quantity, 0)
  }

  const canEquipToBodySlot = (item: InventoryItem, slot: string) => {
    if (CONTAINER_SLOTS.includes(slot as any)) {
      return item.is_container
    }
    if (item.is_container) return false

    if (item.item_category === "wondrous" && item.wondrous_type) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        "wondrous",
        item.item_type || undefined,
        item.wondrous_type || undefined,
      )
      return availableSlots.includes(slot)
    }

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

    return canEquipToBodySlots(item)
  }

  const renderEquipmentSlot = (slotKey: string, slotLabel: string, slotDescription: string) => {
    const item = getItemInSlot(slotKey)
    const isContainerSlot = CONTAINER_SLOTS.includes(slotKey as any)

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
              <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => handleUnequip(item)}>
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

  const renderContainerSlot = (slotKey: string, slotLabel: string, slotDescription: string) => {
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
                <Button variant="ghost" size="sm" onClick={() => handleUnequip(container)}>
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
          <CardDescription className="text-xs md:text-sm">{t.inventory.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="items">{t.inventory.tabs.items}</TabsTrigger>
              <TabsTrigger value="add">{t.inventory.tabs.add}</TabsTrigger>
              <TabsTrigger value="equipped">{t.inventory.tabs.equipped}</TabsTrigger>
              <TabsTrigger value="summary">{t.inventory.tabs.summary}</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-4">
              <InventoryGrid
                items={items}
                loading={loading}
                language={language}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onEquip={handleEquip}
                onStore={handleStore}
                onRemoveFromContainer={handleRemoveFromContainer}
                onUnequip={handleUnequip}
                copperToGold={copperToGold}
              />
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <InventoryForm
                editingItem={editingItem}
                language={language}
                onSubmit={handleAddOrUpdateItem}
                onCancel={resetForm}
                copperToGold={copperToGold}
              />
            </TabsContent>

            <TabsContent value="equipped" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <TabsContent value="summary" className="space-y-4">
              <InventoryStats items={items} language={language} copperToGold={copperToGold} />

              {character && character.carrying_capacity && (
                <CarryingCapacityDisplay
                  currentWeight={items.reduce((sum, item) => sum + item.weight * item.quantity, 0)}
                  maxCapacity={character.carrying_capacity}
                  language={language}
                />
              )}

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
        </CardContent>
      </Card>

      {/* Slot Selector Modal */}
      {showSlotSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <InventorySlotSelector
            item={itemToEquip}
            selectedSlot={selectedSlot}
            items={items}
            language={language}
            onSelectSlot={(slotOrItemId) => {
              if (itemToEquip) {
                // If we have an item, slotOrItemId is the slot
                handleEquipToSlot(itemToEquip, slotOrItemId)
              } else if (selectedSlot) {
                // If we have a selected slot, slotOrItemId is the item id
                const item = items.find((i) => i.id === slotOrItemId)
                if (item) {
                  handleEquipToSlot(item, selectedSlot)
                }
              }
            }}
            onCancel={() => {
              setShowSlotSelector(false)
              setItemToEquip(null)
              setSelectedSlot(null)
            }}
            getItemInSlot={getItemInSlot}
          />
        </div>
      )}

      {/* Container Modal */}
      {showStoreModal && itemToStore && (
        <InventoryContainerModal
          item={itemToStore}
          containers={getEquippedContainers()}
          language={language}
          onStore={handleStoreInContainer}
          onCancel={() => {
            setShowStoreModal(false)
            setItemToStore(null)
          }}
          getContainerUsedWeight={getContainerUsedWeight}
        />
      )}
    </div>
  )
}

