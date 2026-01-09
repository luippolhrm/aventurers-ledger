"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import type { ShopItemExtended } from "@/lib/types/shop-item"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"

interface ShopItemFormProps {
  initialData?: Partial<ShopItemExtended>
  onSubmit: (data: Partial<ShopItemExtended>) => void
  onCancel: () => void
  isLoading?: boolean
}

const RARITY_OPTIONS = ["common", "uncommon", "rare", "very_rare", "legendary", "artifact"] as const
const CATEGORY_OPTIONS = ["weapon", "armor", "potion", "scroll", "wondrous", "tool", "gear", "other"] as const
const DAMAGE_TYPE_OPTIONS = [
  "slashing",
  "piercing",
  "bludgeoning",
  "fire",
  "cold",
  "lightning",
  "thunder",
  "poison",
  "acid",
  "necrotic",
  "radiant",
  "psychic",
  "force",
] as const
const PROPERTY_OPTIONS = [
  "finesse",
  "versatile",
  "light",
  "heavy",
  "two-handed",
  "ranged",
  "thrown",
  "ammunition",
  "loading",
  "reach",
  "special",
] as const

export function ShopItemForm({ initialData, onSubmit, onCancel, isLoading }: ShopItemFormProps) {
  const { t } = useLanguage()

  const [formData, setFormData] = useState<Partial<ShopItemExtended>>({
    item_name: initialData?.item_name || "",
    item_type: initialData?.item_type || "",
    description: initialData?.description || "",
    price_in_copper: initialData?.price_in_copper || 0,
    weight: initialData?.weight || 0,
    quantity_available: initialData?.quantity_available || 999,
    image_url: initialData?.image_url || "",
    rarity: initialData?.rarity || "common",
    item_category: initialData?.item_category || "other",
    damage_dice: initialData?.damage_dice || "",
    damage_type: initialData?.damage_type || "",
    armor_class: initialData?.armor_class,
    properties: initialData?.properties || [],
    requirements: initialData?.requirements || "",
    attunement: initialData?.attunement || false,
    // New effect fields
    equippable_slot: initialData?.equippable_slot || "",
    wondrous_type: initialData?.wondrous_type || "",
    effect_dice: initialData?.effect_dice || "",
    effect_type: initialData?.effect_type || "",
    effect_target: initialData?.effect_target || "",
    spell_level: initialData?.spell_level,
    spell_name: initialData?.spell_name || "",
    spell_school: initialData?.spell_school || "",
    effect_description: initialData?.effect_description || "",
  })

  // Get dynamic fields based on category
  const categoryFields = useMemo(() => {
    const category = (formData.item_category || "other") as ItemCategory
    return ItemFormConfigService.getFieldsForCategory(category)
  }, [formData.item_category])

  const conditionalFields = useMemo(() => {
    const category = (formData.item_category || "other") as ItemCategory
    return ItemFormConfigService.getConditionalFields(category, formData)
  }, [formData.item_category, formData.wondrous_type])

  // Get available slots for equippable items
  const availableSlots = useMemo(() => {
    const category = (formData.item_category || "other") as ItemCategory
    return ItemFormConfigService.getAvailableSlots(
      category,
      formData.item_type || undefined,
      formData.wondrous_type || undefined,
    )
  }, [formData.item_category, formData.item_type, formData.wondrous_type])

  const canEquip = useMemo(() => {
    const category = (formData.item_category || "other") as ItemCategory
    return ItemFormConfigService.canEquipCategory(category)
  }, [formData.item_category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const toggleProperty = (property: string) => {
    const properties = formData.properties || []
    if (properties.includes(property)) {
      setFormData({ ...formData, properties: properties.filter((p) => p !== property) })
    } else {
      setFormData({ ...formData, properties: [...properties, property] })
    }
  }

  const priceInGold = ((formData.price_in_copper || 0) / 100).toFixed(2)

  // Helper function to get translation for field labels
  const getFieldLabel = (fieldId: string, defaultLabel: string): string => {
    const marketplace = t.marketplace as any
    return marketplace?.[fieldId] || defaultLabel
  }

  // Helper function to get translation for select options
  const getOptionLabel = (fieldId: string, optionValue: string, defaultLabel: string): string => {
    const pluralKey = `${fieldId}s` as keyof typeof t.marketplace
    const pluralObj = t.marketplace?.[pluralKey] as Record<string, string> | undefined
    return pluralObj?.[optionValue] || defaultLabel
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t.marketplace?.itemDetails || "Detalles del Item"}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="item_name">{t.marketplace?.itemName || "Item Name"} *</Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="item_type">{t.inventory?.type || "Tipo"}</Label>
            <Select
              value={formData.item_type || ""}
              onValueChange={(value) => setFormData({ ...formData, item_type: value })}
            >
              <SelectTrigger id="item_type">
                <SelectValue placeholder={t.inventory?.type || "Seleccionar tipo"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weapon">{t.inventory?.types?.weapon || "Arma"}</SelectItem>
                <SelectItem value="armor">{t.inventory?.types?.armor || "Armadura"}</SelectItem>
                <SelectItem value="equipment">{t.inventory?.types?.equipment || "Equipamiento"}</SelectItem>
                <SelectItem value="consumable">{t.inventory?.types?.consumable || "Consumible"}</SelectItem>
                <SelectItem value="treasure">{t.inventory?.types?.treasure || "Tesoro"}</SelectItem>
                <SelectItem value="other">{t.inventory?.types?.other || "Otro"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="item_category">{t.marketplace?.itemCategory || "Category"}</Label>
            <Select
              value={formData.item_category}
              onValueChange={(value) => setFormData({ ...formData, item_category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => {
                  const categoryTranslations = (t.marketplace as any)?.categories || {}
                  const translatedLabel = categoryTranslations[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)
                  return (
                    <SelectItem key={cat} value={cat}>
                      {translatedLabel}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">{t.marketplace?.description || "Description"}</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image_url">{t.marketplace?.imageUrl || "Image URL"}</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url || ""}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="rarity">{t.marketplace?.rarity || "Rarity"}</Label>
            <Select
              value={formData.rarity}
              onValueChange={(value) =>
                setFormData({ ...formData, rarity: value as ShopItemExtended["rarity"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RARITY_OPTIONS.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {t.marketplace?.rarities?.[rarity] || rarity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Price and Inventory */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">{t.marketplace?.priceAndStock || "Precio y Stock"}</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price_in_copper">{t.marketplace?.pricePerUnit || "Precio por unidad"} (cp)</Label>
            <Input
              id="price_in_copper"
              type="number"
              min="0"
              value={formData.price_in_copper}
              onChange={(e) => setFormData({ ...formData, price_in_copper: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">≈ {priceInGold} gp</p>
          </div>

          <div>
            <Label htmlFor="weight">{t.inventory?.weight || "Peso"} (lb)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="quantity_available">{t.marketplace?.quantity || "Cantidad"}</Label>
            <Input
              id="quantity_available"
              type="number"
              min="0"
              value={formData.quantity_available}
              onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Fields based on Category */}
      {categoryFields.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">
            {(() => {
              const marketplace = t.marketplace as any
              if (formData.item_category === "weapon" || formData.item_category === "armor") {
                return marketplace?.combatStats || "Estadísticas de Combate"
              } else if (formData.item_category === "potion") {
                return marketplace?.potionEffects || "Efectos de Poción"
              } else if (formData.item_category === "scroll") {
                return marketplace?.spellInformation || "Información del Hechizo"
              } else if (formData.item_category === "wondrous") {
                return marketplace?.wondrousItemDetails || "Detalles del Objeto Maravilloso"
              } else {
                return marketplace?.itemEffects || "Efectos del Item"
              }
            })()}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryFields.map((field) => {
              if (field.type === "text" || field.type === "number") {
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{getFieldLabel(field.id, field.label)}</Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      value={(formData[field.id as keyof ShopItemExtended] as string | number) || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.id]: field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value,
                        })
                      }
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
                // Get options from translations or use field options
                const options = field.options || []
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{getFieldLabel(field.id, field.label)}</Label>
                    <Select
                      value={(formData[field.id as keyof ShopItemExtended] as string) || ""}
                      onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
                    >
                      <SelectTrigger>
                                <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {getOptionLabel(field.id, option.value, option.label)}
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
                  <div key={field.id} className="col-span-1 md:col-span-2 lg:col-span-3">
                    <Label htmlFor={field.id}>{getFieldLabel(field.id, field.label)}</Label>
                    <Textarea
                      id={field.id}
                      value={(formData[field.id as keyof ShopItemExtended] as string) || ""}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={4}
                      className="min-h-[100px]"
                    />
                    {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}

      {/* Conditional Fields */}
      {conditionalFields.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conditionalFields.map((field) => {
              if (field.type === "select") {
                const options = field.options || []
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Select
                      value={(formData[field.id as keyof ShopItemExtended] as string) || ""}
                      onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
                    >
                      <SelectTrigger>
                                <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
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
      )}

      {/* Equippable Slot Selector */}
      {canEquip && availableSlots.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">{t.inventory?.equippableSlot || "Equippable Slot"}</h3>
          <div className="max-w-md">
            <Label htmlFor="equippable_slot">{t.inventory?.equippableSlot || "Equippable Slot"}</Label>
            <Select
              value={formData.equippable_slot || undefined}
              onValueChange={(value) => setFormData({ ...formData, equippable_slot: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ranura" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => {
                  // Convert slot name to translation key (e.g., ring_left -> ringLeft)
                  const slotKey = slot.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                  const slotTranslation = t.inventory?.slots?.[slotKey as keyof typeof t.inventory.slots]
                  return (
                    <SelectItem key={slot} value={slot}>
                      {slotTranslation?.name || slot}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Properties - Only for weapons */}
      {formData.item_category === "weapon" && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">{t.marketplace?.properties || "Properties"}</h3>

          <div className="flex flex-wrap gap-2">
            {PROPERTY_OPTIONS.map((property) => {
              const propertyTranslations = (t.marketplace as any)?.weaponProperties || {}
              const translatedLabel = propertyTranslations[property] || property
              return (
                <Button
                  key={property}
                  type="button"
                  variant={formData.properties?.includes(property) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleProperty(property)}
                >
                  {translatedLabel}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Advanced */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Advanced</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="requirements">{t.marketplace?.requirements || "Requirements"}</Label>
            <Input
              id="requirements"
              value={formData.requirements || ""}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="ej: Fuerza 13 o superior"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="attunement"
              checked={formData.attunement}
              onChange={(e) => setFormData({ ...formData, attunement: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="attunement">{t.marketplace?.attunement || "Requires Attunement"}</Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t.inventory?.cancelEdit || "Cancel"}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t.marketplace?.saving || "Saving..."
            : initialData?.item_name
              ? t.marketplace?.updateItem || "Update Item"
              : t.marketplace?.addItem || "Add Item"}
        </Button>
      </div>
    </form>
  )
}
