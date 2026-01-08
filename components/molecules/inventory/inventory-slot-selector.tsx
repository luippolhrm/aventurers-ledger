"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"
import { getSlotTranslationKey, isContainerSlot } from "@/components/features/inventory/inventory.utils"
import { BODY_SLOTS, CONTAINER_SLOTS } from "@/components/features/inventory/inventory.types"
import { useLanguage } from "@/lib/language-context"

interface InventorySlotSelectorProps {
  item: InventoryItem | null
  selectedSlot: string | null
  items: InventoryItem[]
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onSelectSlot: (slot: string) => void
  onCancel: () => void
  getItemInSlot: (slot: string) => InventoryItem | undefined
}

export function InventorySlotSelector({
  item,
  selectedSlot,
  items,
  language,
  onSelectSlot,
  onCancel,
  getItemInSlot,
}: InventorySlotSelectorProps) {
  const { t } = useLanguage()

  if (!item) return null

  // Si hay un slot seleccionado, mostrar items disponibles para ese slot
  if (selectedSlot) {
    const availableItems = items.filter((invItem) => {
      if (invItem.equipped_slot) return false
      if (invItem.container_id) return false
      if (isContainerSlot(selectedSlot)) {
        return invItem.is_container
      }
      if (invItem.is_container) return false

      // Validar que el item puede equiparse en este slot
      if (invItem.item_category && invItem.item_category !== "equipment") {
        const availableSlots = ItemFormConfigService.getAvailableSlots(
          invItem.item_category as ItemCategory,
          invItem.item_type || undefined,
          invItem.wondrous_type || undefined,
        )
        return availableSlots.includes(selectedSlot)
      }

      return true
    })

    return (
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t.inventory.selectItemToEquip}</CardTitle>
          <CardDescription>
            {t.inventory.equipToSlot}:{" "}
            {t.inventory.slots[getSlotTranslationKey(selectedSlot) as keyof typeof t.inventory.slots]?.name ||
              selectedSlot}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableItems.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t.inventory.noAvailableItems}</p>
          ) : (
            availableItems.map((invItem) => (
              <Button
                key={invItem.id}
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => onSelectSlot(invItem.id)}
              >
                <span className="flex-1 text-left">
                  {invItem.item_name} - {t.inventory.types[invItem.item_type as keyof typeof t.inventory.types]}
                </span>
                {invItem.is_container && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({invItem.container_capacity} lb cap.)
                  </span>
                )}
              </Button>
            ))
          )}
          <Button variant="outline" className="w-full bg-transparent" onClick={onCancel}>
            {t.inventory.cancel}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Si no hay slot seleccionado, mostrar slots disponibles para el item
  const availableSlots = item.is_container
    ? CONTAINER_SLOTS
    : item.item_category && item.item_category !== "equipment"
      ? ItemFormConfigService.getAvailableSlots(
          item.item_category as ItemCategory,
          item.item_type || undefined,
          item.wondrous_type || undefined,
        )
      : BODY_SLOTS.filter((slot) => !CONTAINER_SLOTS.includes(slot as any))

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.inventory.equipToSlot}</CardTitle>
        <CardDescription>{item.item_name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {availableSlots.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{t.inventory.noAvailableSlots}</p>
        ) : (
          availableSlots.map((slot) => {
            const existingItem = getItemInSlot(slot)
            return (
              <Button
                key={slot}
                variant="outline"
                className="w-full justify-between bg-transparent"
                onClick={() => onSelectSlot(slot)}
              >
                <span>
                  {t.inventory.slots[getSlotTranslationKey(slot) as keyof typeof t.inventory.slots]?.name || slot}
                </span>
                {existingItem && (
                  <span className="text-xs text-muted-foreground">({existingItem.item_name})</span>
                )}
              </Button>
            )
          })
        )}
        <Button variant="outline" className="w-full bg-transparent" onClick={onCancel}>
          {t.inventory.cancel}
        </Button>
      </CardContent>
    </Card>
  )
}

