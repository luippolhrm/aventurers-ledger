"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InventorySlotSelector } from "@/components/molecules/inventory/inventory-slot-selector"
import { InventoryItemSelectorModal } from "@/components/organisms/inventory/inventory-item-selector-modal"
import { Shield, User, Archive, ArrowRight, Plus } from "lucide-react"
import Image from "next/image"
import { getCharacterAvatar } from "@/lib/character-utils"
import { useLanguage } from "@/lib/language-context"
import { useInventoryData } from "./use-inventory-data"
import { CONTAINER_SLOTS } from "./inventory.types"
import {
  getCurrentWeaponDamage,
  isVersatileWeaponTwoHanded,
} from "@/lib/application/utils/weapon-properties.utils"

interface InventoryEquippedViewProps {
  characterId: string
  campaignId: string
  language?: "es"
}

export function InventoryEquippedView({ characterId, campaignId, language }: InventoryEquippedViewProps) {
  const { t } = useLanguage()
  const {
    character,
    items,
    selectedSlot,
    showSlotSelector,
    itemToEquip,
    showItemSelectorModal,
    selectedContainer,
    handleEquipToSlot,
    handleUnequip,
    handleRemoveFromContainer,
    handleAddToContainer,
    handleSelectItemForContainer,
    getItemInSlot,
    getContainerInSlot,
    getItemsInContainer,
    getContainerUsedWeight,
    getAvailableItemsForContainer,
    resetForm,
    openSlotSelector,
    handleChangeVersatileUsage,
  } = useInventoryData(characterId)

  // Calcular items con attunement equipados
  const attunedItemsCount = items.filter(
    (item) => item.equipped && item.attunement === true
  ).length

  const renderEquipmentSlot = (slotKey: string, slotLabel: string, slotDescription: string) => {
    const item = getItemInSlot(slotKey)

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
              {item.item_category === "weapon" && item.damage_dice && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const weaponOffItem = slotKey === "weapon_main" ? getItemInSlot("weapon_off") ?? null : null
                    const currentDamage = getCurrentWeaponDamage(item, weaponOffItem)
                    const isTwoHanded = isVersatileWeaponTwoHanded(item, weaponOffItem)
                    
                    return (
                      <span>
                        {currentDamage} {item.damage_type || ""}
                        {item.properties?.includes("versatile") && (
                          <span className="ml-1 text-muted-foreground/70">
                            ({isTwoHanded ? "2 manos" : "1 mano"})
                          </span>
                        )}
                      </span>
                    )
                  })()}
                </div>
              )}
              {item.properties?.includes("versatile") && item.equipped_slot === "weapon_main" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Uso:</span>
                  <div className="flex gap-1">
                    <Button
                      variant={item.versatile_usage === "one-handed" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleChangeVersatileUsage(item, "one-handed")}
                      disabled={!!getItemInSlot("weapon_off")}
                    >
                      1 Mano
                    </Button>
                    <Button
                      variant={item.versatile_usage === "two-handed" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleChangeVersatileUsage(item, "two-handed")}
                      disabled={!!getItemInSlot("weapon_off")}
                    >
                      2 Manos
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => handleUnequip(item)}>
                {t.inventory.unequip}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">{t.inventory.emptySlot}</p>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => openSlotSelector(slotKey)}>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2" 
                onClick={() => handleAddToContainer(container)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {t.inventory.addItemToContainer}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Archive className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground mb-2">{t.inventory.emptySlot}</p>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => openSlotSelector(slotKey)}>
                {t.inventory.equipItem}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.inventory.noCharacterSelected}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Character Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
              <Image
                src={getCharacterAvatar(character)}
                alt={character.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{character.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{character.race}</span>
                <span>•</span>
                <span>{character.class || "Clase no definida"}</span>
                {attunedItemsCount > 0 && (
                  <>
                    <span>•</span>
                    <span className={attunedItemsCount >= 3 ? "text-amber-500" : ""}>
                      {t.inventory.attunementLimit?.replace("{count}", attunedItemsCount.toString()) || 
                        `Items sintonizados: ${attunedItemsCount}/3`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Body Equipment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Equipamiento de Cuerpo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderEquipmentSlot("head", t.inventory.slots.head?.name || "Cabeza", t.inventory.slots.head?.description || "")}
          {renderEquipmentSlot("neck", t.inventory.slots.neck?.name || "Cuello", t.inventory.slots.neck?.description || "")}
          {renderEquipmentSlot("shoulders", t.inventory.slots.shoulders?.name || "Hombros", t.inventory.slots.shoulders?.description || "")}
          {renderEquipmentSlot("body", t.inventory.slots.body?.name || "Cuerpo", t.inventory.slots.body?.description || "")}
          {renderEquipmentSlot("hands", t.inventory.slots.hands?.name || "Manos", t.inventory.slots.hands?.description || "")}
          {renderEquipmentSlot("waist", t.inventory.slots.waist?.name || "Cintura", t.inventory.slots.waist?.description || "")}
          {renderEquipmentSlot("ring_left", t.inventory.slots.ringLeft?.name || "Anillo Izq.", t.inventory.slots.ringLeft?.description || "")}
          {renderEquipmentSlot("ring_right", t.inventory.slots.ringRight?.name || "Anillo Der.", t.inventory.slots.ringRight?.description || "")}
          {renderEquipmentSlot("feet", t.inventory.slots.feet?.name || "Pies", t.inventory.slots.feet?.description || "")}
        </div>
      </div>

      {/* Weapons */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t.inventory.weaponsTitle || "Armas y Escudos"}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderEquipmentSlot("weapon_main", t.inventory.slots.weaponMain?.name || "Mano Principal", t.inventory.slots.weaponMain?.description || "")}
          {renderEquipmentSlot("weapon_off", t.inventory.slots.weaponOff?.name || "Mano Secundaria", t.inventory.slots.weaponOff?.description || "")}
        </div>
      </div>

      {/* Containers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t.inventory.containerSlotsTitle || "Contenedores Equipados"}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderContainerSlot("backpack", t.inventory.slots.backpack?.name || "Mochila", t.inventory.slots.backpack?.description || "")}
          {renderContainerSlot("pouch_left", t.inventory.slots.pouchLeft?.name || "Bolso Izquierdo", t.inventory.slots.pouchLeft?.description || "")}
          {renderContainerSlot("pouch_right", t.inventory.slots.pouchRight?.name || "Bolso Derecho", t.inventory.slots.pouchRight?.description || "")}
        </div>
      </div>

      {/* Slot Selector Modal */}
      {showSlotSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <InventorySlotSelector
            items={items}
            item={itemToEquip}
            selectedSlot={selectedSlot}
            onSelectSlot={(slotOrItemId) => {
              if (itemToEquip) {
                handleEquipToSlot(itemToEquip, slotOrItemId)
              } else if (selectedSlot) {
                const item = items.find((i) => i.id === slotOrItemId)
                if (item) {
                  handleEquipToSlot(item, selectedSlot)
                }
              }
            }}
            onCancel={() => {
              resetForm()
            }}
            getItemInSlot={getItemInSlot}
          />
        </div>
      )}

      {/* Item Selector Modal for Containers */}
      {showItemSelectorModal && selectedContainer && (
        <InventoryItemSelectorModal
          container={selectedContainer}
          availableItems={getAvailableItemsForContainer()}
          onSelectItem={handleSelectItemForContainer}
          onCancel={() => {
            resetForm()
          }}
        />
      )}
    </div>
  )
}
