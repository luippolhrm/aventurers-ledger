"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { useLanguage } from "@/lib/language-context"

interface InventoryItemSelectorModalProps {
  container: InventoryItem | null
  availableItems: InventoryItem[]
  onSelectItem: (itemId: string) => void
  onCancel: () => void
}

export function InventoryItemSelectorModal({
  container,
  availableItems,
  onSelectItem,
  onCancel,
}: InventoryItemSelectorModalProps) {
  const { t } = useLanguage()

  if (!container) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t.inventory.selectItemForContainer}</CardTitle>
          <CardDescription>
            {t.inventory.selectContainer}: <strong>{container.item_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">{t.inventory.noAvailableItemsForContainer}</p>
              <p className="text-xs text-muted-foreground">{t.inventory.noAvailableItemsForContainerHint}</p>
            </div>
          ) : (
            availableItems.map((item) => {
              const itemWeight = item.weight * item.quantity

              return (
                <Button
                  key={item.id}
                  variant="outline"
                  className="w-full justify-start bg-transparent h-auto py-3"
                  onClick={() => onSelectItem(item.id)}
                >
                  <div className="flex flex-col items-start w-full gap-1">
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{item.item_name}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      )}
                    </div>
                    <div className="flex justify-between w-full text-xs text-muted-foreground">
                      <span>
                        {item.item_category && t.inventory.categories?.[item.item_category as keyof typeof t.inventory.categories]}
                      </span>
                      <span>{itemWeight.toFixed(1)} lb</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 w-full text-left">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Button>
              )
            })
          )}
        </CardContent>
        <div className="p-6 pt-0">
          <Button variant="outline" className="w-full bg-transparent" onClick={onCancel}>
            {t.inventory.cancel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
