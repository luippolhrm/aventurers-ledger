"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { Edit, Trash2, Archive, ArrowRight } from "lucide-react"
import { canEquipToBodySlots, getSlotTranslationKey } from "@/components/features/inventory/inventory.utils"
import { CONTAINER_SLOTS } from "@/components/features/inventory/inventory.types"
import { useLanguage } from "@/lib/language-context"

interface InventoryItemCardProps {
  item: InventoryItem
  containerItem?: InventoryItem | null
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: string) => void
  onEquip: (item: InventoryItem) => void
  onStore: (item: InventoryItem) => void
  onRemoveFromContainer: (item: InventoryItem) => void
  onUnequip: (item: InventoryItem) => void
  copperToGold: (copper: number) => string
}

export function InventoryItemCard({
  item,
  containerItem,
  language,
  onEdit,
  onDelete,
  onEquip,
  onStore,
  onRemoveFromContainer,
  onUnequip,
  copperToGold,
}: InventoryItemCardProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold truncate">{item.item_name}</h3>
              {item.is_container && (
                <span className="text-xs text-muted-foreground">
                  📦 {item.container_capacity} lb cap.
                </span>
              )}
              {containerItem && (
                <span className="text-xs text-primary">📍 {containerItem.item_name}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{t.inventory.types[item.item_type as keyof typeof t.inventory.types]}</span>
              <span>•</span>
              <span>{t.inventory.quantity}: {item.quantity}</span>
              <span>•</span>
              <span>{item.weight} lb</span>
              <span>•</span>
              <span>{copperToGold(item.value_in_copper)} gp</span>
            </div>
            {item.equipped_slot && (
              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => onUnequip(item)}
                  title={t.inventory.unequip}
                >
                  {t.inventory.slots[getSlotTranslationKey(item.equipped_slot) as keyof typeof t.inventory.slots]?.name ||
                    item.equipped_slot}
                </Button>
              </div>
            )}
            {item.container_id && !item.equipped_slot && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                  📍 {containerItem?.item_name}
                </span>
              </div>
            )}
            {!item.equipped_slot && !item.container_id && (canEquipToBodySlots(item) || item.is_container) && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => onEquip(item)}>
                  {t.inventory.equipItem}
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {!item.is_container && !item.container_id && !item.equipped_slot && (
              <Button variant="ghost" size="sm" onClick={() => onStore(item)} title={t.inventory.storeIn}>
                <Archive className="w-4 h-4" />
              </Button>
            )}
            {item.container_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFromContainer(item)}
                title={t.inventory.removeFromContainer}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

