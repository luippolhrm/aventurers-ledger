"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import type { InventoryFormData } from "@/components/features/inventory/inventory.types"
import { Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface InventoryFormProps {
  editingItem: InventoryItem | null
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onSubmit: (data: InventoryFormData) => Promise<void>
  onCancel: () => void
  copperToGold: (copper: number) => string
}

export function InventoryForm({ editingItem, language, onSubmit, onCancel, copperToGold }: InventoryFormProps) {
  const { t } = useLanguage()

  // Form states
  const [itemName, setItemName] = useState("")
  const [itemType, setItemType] = useState("weapon")
  const [itemCategory, setItemCategory] = useState<ItemCategory>("weapon")
  const [equippableSlot, setEquippableSlot] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [weight, setWeight] = useState("0")
  const [valueInCopper, setValueInCopper] = useState("0")
  const [description, setDescription] = useState("")
  const [equipped, setEquipped] = useState(false)
  const [isContainer, setIsContainer] = useState(false)
  const [containerCapacity, setContainerCapacity] = useState("0")
  // Effect fields
  const [wondrousType, setWondrousType] = useState("")
  const [effectDice, setEffectDice] = useState("")
  const [effectType, setEffectType] = useState("")
  const [effectTarget, setEffectTarget] = useState("")
  const [spellLevel, setSpellLevel] = useState("")
  const [spellName, setSpellName] = useState("")
  const [spellSchool, setSpellSchool] = useState("")
  const [effectDescription, setEffectDescription] = useState("")
  // Combat stats
  const [damageDice, setDamageDice] = useState("")
  const [damageType, setDamageType] = useState("")
  const [armorClass, setArmorClass] = useState("")

  // Load item data when editing
  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.item_name)
      setItemType(editingItem.item_type)
      setItemCategory((editingItem.item_category as ItemCategory) || "weapon")
      setEquippableSlot(editingItem.equippable_slot || "")
      setQuantity(editingItem.quantity.toString())
      setWeight(editingItem.weight.toString())
      setValueInCopper(editingItem.value_in_copper.toString())
      setDescription(editingItem.description || "")
      setEquipped(editingItem.equipped)
      setIsContainer(editingItem.is_container)
      setContainerCapacity(editingItem.container_capacity?.toString() || "0")
      setWondrousType(editingItem.wondrous_type || "")
      setEffectDice(editingItem.effect_dice || "")
      setEffectType(editingItem.effect_type || "")
      setEffectTarget(editingItem.effect_target || "")
      setSpellLevel(editingItem.spell_level?.toString() || "")
      setSpellName(editingItem.spell_name || "")
      setSpellSchool(editingItem.spell_school || "")
      setEffectDescription(editingItem.effect_description || "")
      setDamageDice(editingItem.damage_dice || "")
      setDamageType(editingItem.damage_type || "")
      setArmorClass(editingItem.armor_class?.toString() || "")
    } else {
      // Reset form
      setItemName("")
      setItemType("weapon")
      setItemCategory("weapon")
      setEquippableSlot("")
      setQuantity("1")
      setWeight("0")
      setValueInCopper("0")
      setDescription("")
      setEquipped(false)
      setIsContainer(false)
      setContainerCapacity("0")
      setWondrousType("")
      setEffectDice("")
      setEffectType("")
      setEffectTarget("")
      setSpellLevel("")
      setSpellName("")
      setSpellSchool("")
      setEffectDescription("")
      setDamageDice("")
      setDamageType("")
      setArmorClass("")
    }
  }, [editingItem])

  const handleSubmit = async () => {
    const formData: InventoryFormData = {
      item_name: itemName.trim(),
      item_type: itemType,
      item_category: itemCategory || null,
      equippable_slot: equippableSlot || null,
      quantity: Number.parseInt(quantity) || 1,
      weight: Number.parseFloat(weight) || 0,
      value_in_copper: Number.parseInt(valueInCopper) || 0,
      description: description.trim() || null,
      equipped,
      equipped_slot: null,
      container_id: null,
      is_container: isContainer,
      container_capacity: isContainer ? Number.parseFloat(containerCapacity) || 0 : 0,
      wondrous_type: wondrousType || null,
      effect_dice: effectDice || null,
      effect_type: effectType || null,
      effect_target: effectTarget || null,
      spell_level: spellLevel ? Number.parseInt(spellLevel) : null,
      spell_name: spellName || null,
      spell_school: spellSchool || null,
      effect_description: effectDescription || null,
      damage_dice: damageDice || null,
      damage_type: damageType || null,
      armor_class: armorClass ? Number.parseInt(armorClass) : null,
    }

    await onSubmit(formData)
  }

  const categoryFields = ItemFormConfigService.getFieldsForCategory(itemCategory)
  const conditionalFields = ItemFormConfigService.getConditionalFields(itemCategory, {
    wondrous_type: wondrousType,
  })

  return (
    <div className="space-y-4">
      {editingItem && (
        <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
          <p className="text-sm">
            {t.inventory.editingItem}: {editingItem.item_name}
          </p>
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t.inventory.cancelEdit}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">{t.inventory.itemName}</Label>
          <Input
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={t.inventory.itemNamePlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemType">{t.inventory.type}</Label>
          <Select value={itemType} onValueChange={setItemType}>
            <SelectTrigger id="itemType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">{t.inventory.types.weapon}</SelectItem>
              <SelectItem value="armor">{t.inventory.types.armor}</SelectItem>
              <SelectItem value="equipment">{t.inventory.types.equipment}</SelectItem>
              <SelectItem value="consumable">{t.inventory.types.consumable}</SelectItem>
              <SelectItem value="treasure">{t.inventory.types.treasure}</SelectItem>
              <SelectItem value="other">{t.inventory.types.other}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemCategory">{t.marketplace?.itemCategory || "Category"}</Label>
          <Select value={itemCategory} onValueChange={(value) => setItemCategory(value as ItemCategory)}>
            <SelectTrigger id="itemCategory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ItemFormConfigService.getAllCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {ItemFormConfigService.canEquipCategory(itemCategory) && (
          <div className="space-y-2">
            <Label htmlFor="equippableSlot">{t.inventory.equippableSlot}</Label>
            <Select value={equippableSlot} onValueChange={setEquippableSlot}>
              <SelectTrigger id="equippableSlot">
                <SelectValue placeholder={t.inventory.selectSlot} />
              </SelectTrigger>
              <SelectContent>
                {ItemFormConfigService.getAvailableSlots(itemCategory, itemType, wondrousType).map((slot) => {
                  const slotKey = slot.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                  const slotTranslation = t.inventory.slots?.[slotKey as keyof typeof t.inventory.slots]
                  return (
                    <SelectItem key={slot} value={slot}>
                      {slotTranslation?.name || slot}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="quantity">{t.inventory.quantity}</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">{t.inventory.weightLabel}</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valueInCopper">{t.inventory.valueInCopper}</Label>
          <Input
            id="valueInCopper"
            type="number"
            min="0"
            value={valueInCopper}
            onChange={(e) => setValueInCopper(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            ≈ {copperToGold(Number.parseInt(valueInCopper) || 0)} {t.inventory.goldPieces}
          </p>
        </div>

        <div className="space-y-2 flex items-center gap-2 pt-8">
          <input
            type="checkbox"
            id="equipped"
            checked={equipped}
            onChange={(e) => setEquipped(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="equipped">{t.inventory.equippedLabel}</Label>
        </div>

        <div className="space-y-2 flex items-center gap-2 pt-8">
          <input
            type="checkbox"
            id="isContainer"
            checked={isContainer}
            onChange={(e) => {
              setIsContainer(e.target.checked)
              if (e.target.checked) {
                setItemType("equipment")
                if (!equippableSlot) setEquippableSlot("backpack")
              }
            }}
            className="w-4 h-4"
          />
          <Label htmlFor="isContainer">{t.inventory.isContainer}</Label>
        </div>

        {isContainer && (
          <div className="space-y-2">
            <Label htmlFor="containerCapacity">{t.inventory.containerCapacity}</Label>
            <Input
              id="containerCapacity"
              type="number"
              min="0"
              step="0.5"
              value={containerCapacity}
              onChange={(e) => setContainerCapacity(e.target.value)}
            />
          </div>
        )}
      </div>

      {isContainer && (
        <div className="space-y-2">
          <Label>{t.inventory.equippableSlot} ({t.inventory.containerType})</Label>
          <Select value={equippableSlot} onValueChange={setEquippableSlot}>
            <SelectTrigger>
              <SelectValue placeholder={t.inventory.selectSlot} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backpack">{t.inventory.slots.backpack?.name || "Backpack"}</SelectItem>
              <SelectItem value="pouch_left">{t.inventory.slots.pouchLeft?.name || "Left Pouch"}</SelectItem>
              <SelectItem value="pouch_right">{t.inventory.slots.pouchRight?.name || "Right Pouch"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">{t.inventory.descriptionLabel}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.inventory.descriptionPlaceholder}
          rows={3}
        />
      </div>

      {/* Dynamic Fields based on Category */}
      {categoryFields.length > 0 || conditionalFields.length > 0 ? (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">
            {itemCategory === "weapon" || itemCategory === "armor"
              ? "Combat Stats"
              : itemCategory === "potion"
                ? "Potion Effects"
                : itemCategory === "scroll"
                  ? "Spell Information"
                  : itemCategory === "wondrous"
                    ? "Wondrous Item Details"
                    : "Item Effects"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryFields.map((field) => {
              if (field.type === "text" || field.type === "number") {
                const fieldValue =
                  field.id === "damage_dice"
                    ? damageDice
                    : field.id === "armor_class"
                      ? armorClass
                      : field.id === "effect_dice"
                        ? effectDice
                        : field.id === "spell_level"
                          ? spellLevel
                          : field.id === "spell_name"
                            ? spellName
                            : ""

                const setFieldValue = (value: string) => {
                  if (field.id === "damage_dice") setDamageDice(value)
                  else if (field.id === "armor_class") setArmorClass(value)
                  else if (field.id === "effect_dice") setEffectDice(value)
                  else if (field.id === "spell_level") setSpellLevel(value)
                  else if (field.id === "spell_name") setSpellName(value)
                }

                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
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
                const options = field.options || []
                const fieldValue =
                  field.id === "damage_type"
                    ? damageType
                    : field.id === "effect_type"
                      ? effectType
                      : field.id === "effect_target"
                        ? effectTarget
                        : field.id === "spell_school"
                          ? spellSchool
                          : field.id === "wondrous_type"
                            ? wondrousType
                            : ""

                const setFieldValue = (value: string) => {
                  if (field.id === "damage_type") setDamageType(value)
                  else if (field.id === "effect_type") setEffectType(value)
                  else if (field.id === "effect_target") setEffectTarget(value)
                  else if (field.id === "spell_school") setSpellSchool(value)
                  else if (field.id === "wondrous_type") setWondrousType(value)
                }

                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Select value={fieldValue} onValueChange={setFieldValue}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
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

              if (field.type === "textarea") {
                return (
                  <div key={field.id} className="col-span-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Textarea
                      id={field.id}
                      value={effectDescription}
                      onChange={(e) => setEffectDescription(e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                    {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                  </div>
                )
              }

              return null
            })}

            {conditionalFields.map((field) => {
              if (field.type === "select") {
                const options = field.options || []
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Select value={equippableSlot} onValueChange={setEquippableSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
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
      ) : null}

      <Button onClick={handleSubmit} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        {editingItem ? t.inventory.updateItem : t.inventory.addItem}
      </Button>
    </div>
  )
}

