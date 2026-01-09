"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { SHOP_TYPE_OPTIONS, SHOP_TYPE_METADATA, type ShopType } from "@/lib/constants/shop-constants"
import { MapPin, Info } from "lucide-react"

interface ShopFormData {
  name: string
  description: string
  shop_type: ShopType
  selectedNpcId: string
}

interface ShopFormProps {
  initialData?: Shop
  locationInfo?: { name: string; type: string | null }
  standaloneNpcs?: Npc[]
  selectedNpcId?: string
  onSubmit: (data: ShopFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  getLocationTypeLabel?: (type: string) => string
  getLocationTypeBadgeColor?: (type: string | null) => string
}

export function ShopForm({
  initialData,
  locationInfo,
  standaloneNpcs = [],
  selectedNpcId: initialSelectedNpcId,
  onSubmit,
  onCancel,
  isLoading = false,
  getLocationTypeLabel,
  getLocationTypeBadgeColor,
}: ShopFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<ShopFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    shop_type: (initialData?.shop_type as ShopType) || "general_store",
    selectedNpcId: initialSelectedNpcId || "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        shop_type: (initialData.shop_type as ShopType) || "general_store",
        selectedNpcId: initialSelectedNpcId || "",
      })
    } else if (initialSelectedNpcId) {
      setFormData((prev) => ({ ...prev, selectedNpcId: initialSelectedNpcId }))
    }
  }, [initialData, initialSelectedNpcId])

  const getShopTypeLabel = (type: string) => {
    return t.marketplace?.shopTypes?.[type as ShopType] || type
  }

  const getSelectedShopTypeMetadata = () => {
    if (!formData.shop_type) return null
    const metadata = SHOP_TYPE_METADATA[formData.shop_type as ShopType]
    const description = t.marketplace?.shopTypeDescriptions?.[formData.shop_type as ShopType]
    const characteristics = t.marketplace?.shopTypeCharacteristics?.[formData.shop_type as ShopType]
    return { metadata, description, characteristics }
  }

  const selectedTypeInfo = getSelectedShopTypeMetadata()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onSubmit(formData)
  }

  const handleNpcSelect = (npcId: string) => {
    if (npcId === "none") {
      setFormData({ ...formData, selectedNpcId: "" })
    } else {
      setFormData({
        ...formData,
        selectedNpcId: npcId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {locationInfo && (
        <div className="p-3 bg-muted rounded-lg border">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ubicación:</span>
            <span className="text-sm font-medium">{locationInfo.name}</span>
            {locationInfo.type && getLocationTypeLabel && getLocationTypeBadgeColor && (
              <span
                className={`inline-block text-xs px-2 py-1 rounded-full uppercase ${getLocationTypeBadgeColor(locationInfo.type)}`}
              >
                {getLocationTypeLabel(locationInfo.type)}
              </span>
            )}
          </div>
        </div>
      )}

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
        {selectedTypeInfo && selectedTypeInfo.description && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <p className="text-sm">{selectedTypeInfo.description}</p>
              {selectedTypeInfo.characteristics && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTypeInfo.characteristics.typicalItems && (
                    <Badge variant="secondary" className="text-xs">
                      Items: {selectedTypeInfo.characteristics.typicalItems}
                    </Badge>
                  )}
                  {selectedTypeInfo.characteristics.maxRarity && (
                    <Badge variant="secondary" className="text-xs">
                      Rareza máx: {selectedTypeInfo.characteristics.maxRarity}
                    </Badge>
                  )}
                  {selectedTypeInfo.characteristics.services && (
                    <Badge variant="secondary" className="text-xs">
                      Servicios: {selectedTypeInfo.characteristics.services}
                    </Badge>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
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

      {/* Campo unificado para NPC */}
      <div className="space-y-2">
        <Label>Asignar NPC (Opcional)</Label>
        {standaloneNpcs.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay NPCs disponibles. Crea NPCs en la sección de NPCs de tu campaña.
          </p>
        )}
      </div>

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

