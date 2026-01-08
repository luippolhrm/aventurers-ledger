"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { Package, Edit, Trash2, Archive, ArrowRight } from "lucide-react"
import { canEquipToBodySlots, getSlotTranslationKey } from "@/components/features/inventory/inventory.utils"
import { CONTAINER_SLOTS } from "@/components/features/inventory/inventory.types"
import { useLanguage } from "@/lib/language-context"

interface InventoryGridProps {
  items: InventoryItem[]
  loading: boolean
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: string) => void
  onEquip: (item: InventoryItem) => void
  onStore: (item: InventoryItem) => void
  onRemoveFromContainer: (item: InventoryItem) => void
  onUnequip: (item: InventoryItem) => void
  copperToGold: (copper: number) => string
}

export function InventoryGrid({
  items,
  loading,
  language,
  onEdit,
  onDelete,
  onEquip,
  onStore,
  onRemoveFromContainer,
  onUnequip,
  copperToGold,
}: InventoryGridProps) {
  const { t } = useLanguage()

  if (loading) {
    return <LoadingState message={t.inventory.loading} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t.inventory.noItems}
        description="Add your first item to get started"
      />
    )
  }

  return (
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
                      <span className="text-xs text-primary">📍 {containerItem.item_name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {t.inventory.types[item.item_type as keyof typeof t.inventory.types]}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{item.weight} lb</TableCell>
                <TableCell className="text-right">{copperToGold(item.value_in_copper)} gp</TableCell>
                <TableCell className="text-center">
                  {item.equipped_slot ? (
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
                  ) : item.container_id ? (
                    <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                      📍 {containerItem?.item_name}
                    </span>
                  ) : canEquipToBodySlots(item) || item.is_container ? (
                    <Button variant="outline" size="sm" onClick={() => onEquip(item)}>
                      {t.inventory.equipItem}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

