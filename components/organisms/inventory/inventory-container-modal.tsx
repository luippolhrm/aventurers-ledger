"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { useLanguage } from "@/lib/language-context"

interface InventoryContainerModalProps {
  item: InventoryItem | null
  containers: InventoryItem[]
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onStore: (item: InventoryItem, containerId: string) => void
  onCancel: () => void
  getContainerUsedWeight: (containerId: string) => number
}

export function InventoryContainerModal({
  item,
  containers,
  language,
  onStore,
  onCancel,
  getContainerUsedWeight,
}: InventoryContainerModalProps) {
  const { t } = useLanguage()

  if (!item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t.inventory.storeInContainer}</CardTitle>
          <CardDescription>
            {t.inventory.selectContainer}: <strong>{item.item_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {containers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t.inventory.noEquippedContainers}</p>
          ) : (
            containers.map((container) => {
              const usedWeight = getContainerUsedWeight(container.id)
              const availableCapacity = container.container_capacity - usedWeight
              const itemWeight = item.weight * item.quantity
              const canFit = itemWeight <= availableCapacity

              return (
                <Button
                  key={container.id}
                  variant="outline"
                  className={`w-full justify-start bg-transparent ${!canFit ? "opacity-50" : ""}`}
                  onClick={() => canFit && onStore(item, container.id)}
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
          <Button variant="outline" className="w-full bg-transparent" onClick={onCancel}>
            {t.inventory.cancel}
          </Button>
        </div>
      </Card>
    </div>
  )
}

