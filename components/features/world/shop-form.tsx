"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { Plus } from "lucide-react"

const SHOP_TYPE_OPTIONS = ["inn", "general", "smith", "jewelry", "market", "atelier"] as const
type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

interface ShopFormData {
  name: string
  description: string
  shop_type: ShopType
  shopkeeper_name: string
  selectedNpcId: string
}

interface ShopFormProps {
  initialData?: Shop
  standaloneNpcs?: Npc[]
  selectedNpcId?: string
  onSubmit: (data: ShopFormData) => Promise<void>
  onCancel: () => void
  onCreateNpc?: () => void
  isLoading?: boolean
}

export function ShopForm({
  initialData,
  standaloneNpcs = [],
  selectedNpcId: initialSelectedNpcId,
  onSubmit,
  onCancel,
  onCreateNpc,
  isLoading = false,
}: ShopFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<ShopFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    shop_type: (initialData?.shop_type as ShopType) || "general",
    shopkeeper_name: initialData?.shopkeeper_name || "",
    selectedNpcId: initialSelectedNpcId || "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        shop_type: (initialData.shop_type as ShopType) || "general",
        shopkeeper_name: initialData.shopkeeper_name || "",
        selectedNpcId: initialSelectedNpcId || "",
      })
    } else if (initialSelectedNpcId) {
      setFormData((prev) => ({ ...prev, selectedNpcId: initialSelectedNpcId }))
    }
  }, [initialData, initialSelectedNpcId])

  const getShopTypeLabel = (type: string) => {
    return t.marketplace?.shopTypes?.[type as ShopType] || type
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onSubmit(formData)
  }

  const handleNpcSelect = (npcId: string) => {
    if (npcId === "none") {
      setFormData({ ...formData, selectedNpcId: "", shopkeeper_name: "" })
    } else {
      const selectedNpc = standaloneNpcs.find((npc) => npc.id === npcId)
      setFormData({
        ...formData,
        selectedNpcId: npcId,
        shopkeeper_name: selectedNpc?.name || "",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.marketplace?.shopName || "Nombre de la Tienda"}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t.marketplace?.enterShopName || "Ingresa el nombre de la tienda"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shop_type">{t.marketplace?.shopType || "Tipo de Tienda"}</Label>
        <Select
          value={formData.shop_type}
          onValueChange={(value) => setFormData({ ...formData, shop_type: value as ShopType })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.marketplace?.selectShopType || "Selecciona un tipo"} />
          </SelectTrigger>
          <SelectContent>
            {SHOP_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {getShopTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.marketplace?.description || "Descripción"}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t.marketplace?.describeShop || "Describe esta tienda"}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="shopkeeper">{t.marketplace?.shopkeeperName || "Tendero (Opcional)"}</Label>
          {onCreateNpc && (
            <Button type="button" variant="outline" size="sm" onClick={onCreateNpc}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Nuevo NPC
            </Button>
          )}
        </div>
        <Input
          id="shopkeeper"
          value={formData.shopkeeper_name}
          onChange={(e) => setFormData({ ...formData, shopkeeper_name: e.target.value })}
          placeholder={t.marketplace?.enterShopkeeperName || "Ingresa el nombre del tendero o selecciona un NPC"}
        />
      </div>

      {standaloneNpcs.length > 0 && (
        <div className="space-y-2">
          <Label>Asignar NPC Existente (Opcional)</Label>
          <Select value={formData.selectedNpcId || "none"} onValueChange={handleNpcSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un NPC de tu campaña" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {standaloneNpcs.map((npc) => (
                <SelectItem key={npc.id} value={npc.id}>
                  {npc.name} {npc.title && `- ${npc.title}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  )
}

