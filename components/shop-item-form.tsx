"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { translations, type Language } from "@/lib/translations"
import type { ShopItemExtended } from "@/lib/services/item-api-service"

interface ShopItemFormProps {
  language: Language
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

export function ShopItemForm({ language, initialData, onSubmit, onCancel, isLoading }: ShopItemFormProps) {
  const t = translations[language]

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
  })

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t.marketplace?.itemDetails || "Item Details"}</h3>

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
            <Label htmlFor="item_type">{t.inventory?.type || "Type"}</Label>
            <Input
              id="item_type"
              value={formData.item_type || ""}
              onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
              placeholder="e.g., Longsword, Leather Armor"
            />
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
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t.inventory?.priceAndStock || "Price & Stock"}</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price_in_copper">{t.inventory?.price || "Price"} (cp)</Label>
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
            <Label htmlFor="weight">{t.inventory?.weight || "Weight"} (lb)</Label>
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
            <Label htmlFor="quantity_available">{t.marketplace?.quantity || "Quantity"}</Label>
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

      {/* Combat Stats (for weapons/armor) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Combat Stats</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="damage_dice">{t.marketplace?.damageDice || "Damage Dice"}</Label>
            <Input
              id="damage_dice"
              value={formData.damage_dice || ""}
              onChange={(e) => setFormData({ ...formData, damage_dice: e.target.value })}
              placeholder="e.g., 1d8, 2d6"
            />
          </div>

          <div>
            <Label htmlFor="damage_type">{t.marketplace?.damageType || "Damage Type"}</Label>
            <Select
              value={formData.damage_type || "none"}
              onValueChange={(value) => setFormData({ ...formData, damage_type: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DAMAGE_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="armor_class">{t.marketplace?.armorClass || "Armor Class"}</Label>
            <Input
              id="armor_class"
              type="number"
              min="0"
              max="30"
              value={formData.armor_class || ""}
              onChange={(e) => setFormData({ ...formData, armor_class: parseInt(e.target.value) || undefined })}
              placeholder="AC"
            />
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t.marketplace?.properties || "Properties"}</h3>

        <div className="flex flex-wrap gap-2">
          {PROPERTY_OPTIONS.map((property) => (
            <Button
              key={property}
              type="button"
              variant={formData.properties?.includes(property) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleProperty(property)}
            >
              {property}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Advanced</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="requirements">{t.marketplace?.requirements || "Requirements"}</Label>
            <Input
              id="requirements"
              value={formData.requirements || ""}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g., Strength 13 or higher"
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
          {t.characterSelector?.cancel || "Cancel"}
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
