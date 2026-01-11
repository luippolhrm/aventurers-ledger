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
import { useToast } from "@/hooks/use-toast"
import { ValidationUtils } from "@/lib/application/utils/validation"
import { WeightInput } from "@/components/molecules/inventory/weight-input"

interface InventoryFormProps {
  editingItem: InventoryItem | null
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onSubmit: (data: InventoryFormData) => Promise<void>
  onCancel: () => void
  copperToGold: (copper: number) => string
}

export function InventoryForm({ editingItem, language, onSubmit, onCancel, copperToGold }: InventoryFormProps) {
  const { t } = useLanguage()
  const { toast } = useToast()

  // Form states
  const [itemName, setItemName] = useState("")
  const [itemType, setItemType] = useState("weapon")
  const [itemCategory, setItemCategory] = useState<ItemCategory>("weapon")
  const [equippableSlot, setEquippableSlot] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [weight, setWeight] = useState("0")
  const [valueInCopper, setValueInCopper] = useState("0")
  const [description, setDescription] = useState("")
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
  const [weaponMastery, setWeaponMastery] = useState("")
  const [weaponRangeNormal, setWeaponRangeNormal] = useState("")
  const [weaponRangeLong, setWeaponRangeLong] = useState("")
  const [properties, setProperties] = useState<string[]>([])
  // Attunement
  const [attunement, setAttunement] = useState(false)

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
      setWeaponMastery(editingItem.weapon_mastery || "")
      setWeaponRangeNormal(editingItem.weapon_range_normal?.toString() || "")
      setWeaponRangeLong(editingItem.weapon_range_long?.toString() || "")
      setProperties(editingItem.properties || [])
      setAttunement(editingItem.attunement ?? false)
    } else {
      // Reset form
      setItemName("")
      setItemType("")
      setItemCategory("weapon" as ItemCategory)
      setEquippableSlot("")
      setQuantity("1")
      setWeight("0")
      setValueInCopper("0")
      setDescription("")
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
      setWeaponMastery("")
      setWeaponRangeNormal("")
      setWeaponRangeLong("")
      setProperties([])
      setAttunement(false)
    }
  }, [editingItem])

  // Resetear categoría cuando cambia el tipo
  useEffect(() => {
    if (!editingItem) {
      // Solo resetear si no estamos editando
      const availableCategories = ItemFormConfigService.getCategoriesForType(itemType)
      if (availableCategories.length > 0 && !availableCategories.includes(itemCategory)) {
        setItemCategory(availableCategories[0])
      }
    }
  }, [itemType, editingItem])

  // Validaciones client-side usando utilidades compartidas
  // Helper para validar sin lanzar excepciones (retorna mensaje de error o null)
  const validateField = (fieldName: string, value: any): string | null => {
    try {
      switch (fieldName) {
        case "itemName":
          try {
            ValidationUtils.validateNonEmptyString(value, "Nombre del objeto")
            // Validación adicional: mínimo 2 caracteres
            if (value && value.trim().length < 2) {
              return t.inventory.validation.itemNameMinLength
            }
            return null
          } catch (error: any) {
            return t.inventory.validation.itemNameRequired
          }

        case "quantity":
          const qty = Number.parseInt(value)
          if (isNaN(qty)) {
            return t.inventory.validation.quantityRequired
          }
          try {
            ValidationUtils.validatePositiveNumber(qty, "Cantidad")
            return null
          } catch (error: any) {
            return t.inventory.validation.quantityMin
          }

        case "weight":
          const wgt = Number.parseFloat(value)
          if (isNaN(wgt)) {
            return t.inventory.validation.weightRequired
          }
          try {
            ValidationUtils.validateNonNegativeNumber(wgt, "Peso")
            return null
          } catch (error: any) {
            return t.inventory.validation.weightNegative
          }

        case "valueInCopper":
          const val = Number.parseInt(value)
          if (isNaN(val)) {
            return t.inventory.validation.valueRequired
          }
          try {
            ValidationUtils.validateNonNegativeNumber(val, "Valor")
            return null
          } catch (error: any) {
            return t.inventory.validation.valueNegative
          }

        case "containerCapacity":
          if (isContainer) {
            const cap = Number.parseFloat(value)
            if (isNaN(cap)) {
              return t.inventory.validation.containerCapacityRequired
            }
            try {
              ValidationUtils.validateNonNegativeNumber(cap, "Capacidad del contenedor")
              return null
            } catch (error: any) {
              return t.inventory.validation.containerCapacityNegative
            }
          }
          return null

        default:
          return null
      }
    } catch (error: any) {
      return t.inventory.validation.validationError
    }
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    const itemNameError = validateField("itemName", itemName)
    if (itemNameError) errors.itemName = itemNameError

    const quantityError = validateField("quantity", quantity)
    if (quantityError) errors.quantity = quantityError

    const weightError = validateField("weight", weight)
    if (weightError) errors.weight = weightError

    const valueError = validateField("valueInCopper", valueInCopper)
    if (valueError) errors.valueInCopper = valueError

    if (isContainer) {
      const capacityError = validateField("containerCapacity", containerCapacity)
      if (capacityError) errors.containerCapacity = capacityError
    }

    return errors
  }

  const handleSubmit = async () => {
    // Validar formulario antes de enviar
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorKey = Object.keys(validationErrors)[0]
      const firstErrorMessage = validationErrors[firstErrorKey]

      toast({
        title: t.inventory.validation.validationError,
        description: firstErrorMessage || t.inventory.validation.pleaseFixErrors,
        variant: "destructive",
      })

      // Scroll al primer campo con error
      const errorField = document.getElementById(firstErrorKey)
      if (errorField) {
        errorField.scrollIntoView({ behavior: "smooth", block: "center" })
        errorField.focus()
      }

      return
    }
    const formData: InventoryFormData = {
      item_name: itemName.trim(),
      item_type: itemType,
      item_category: itemCategory || null,
      equippable_slot: null, // Equipamiento se maneja desde la vista de inventario
      quantity: Number.parseInt(quantity) || 1,
      weight: Number.parseFloat(weight) || 0,
      value_in_copper: Number.parseInt(valueInCopper) || 0,
      description: description.trim() || null,
      equipped: false, // Equipamiento se maneja desde la vista de inventario
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
      weapon_mastery: weaponMastery || null,
      weapon_range_normal: weaponRangeNormal ? Number.parseInt(weaponRangeNormal) : null,
      weapon_range_long: weaponRangeLong ? Number.parseInt(weaponRangeLong) : null,
      properties: properties.length > 0 ? properties : null,
      attunement: attunement || null,
    }

    await onSubmit(formData)
  }

  // Preparar formData para condiciones
  const formDataForConditions = {
    wondrous_type: wondrousType,
    properties: properties,
  }

  const categoryFields = ItemFormConfigService.getFieldsForCategory(itemCategory, formDataForConditions)
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
            name="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={t.inventory.itemNamePlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemType">{t.inventory.type}</Label>
          <Select value={itemType} onValueChange={setItemType}>
            <SelectTrigger id="itemType">
              <SelectValue placeholder={t.inventory.placeholders?.selectType || "Pendiente de selección"} />
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
          <Select
            value={itemCategory}
            onValueChange={(value) => setItemCategory(value as ItemCategory)}
            disabled={!itemType}
          >
            <SelectTrigger id="itemCategory">
              <SelectValue placeholder={itemType ? "Seleccione una categoría" : "Primero seleccione un tipo"} />
            </SelectTrigger>
            <SelectContent>
              {ItemFormConfigService.getCategoriesForType(itemType).map((cat) => {
                const categoryTranslation =
                  t.inventory.categories?.[cat as keyof typeof t.inventory.categories] ||
                  cat.charAt(0).toUpperCase() + cat.slice(1)
                return (
                  <SelectItem key={cat} value={cat}>
                    {categoryTranslation}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">{t.inventory.quantity}</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <WeightInput
          id="weight"
          name="weight"
          label={t.inventory.weightLabel}
          value={weight}
          onChange={setWeight}
          min={0}
          step={0.1}
        />

        <div className="space-y-2">
          <Label htmlFor="valueInCopper">{t.inventory.valueInCopper}</Label>
          <Input
            id="valueInCopper"
            name="valueInCopper"
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
            id="isContainer"
            checked={isContainer}
            onChange={(e) => {
              setIsContainer(e.target.checked)
              if (e.target.checked) {
                setItemType("equipment")
              }
            }}
            className="w-4 h-4"
          />
          <Label htmlFor="isContainer">{t.inventory.isContainer}</Label>
        </div>

        <div className="space-y-2 flex items-center gap-2 pt-8">
          <input
            type="checkbox"
            id="attunement"
            checked={attunement}
            onChange={(e) => setAttunement(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="attunement">{t.inventory.attunement || "Requiere Sintonización"}</Label>
        </div>

        {isContainer && (
          <WeightInput
            id="containerCapacity"
            name="containerCapacity"
            label={t.inventory.containerCapacity}
            value={containerCapacity}
            onChange={setContainerCapacity}
            min={0}
            step={0.5}
          />
        )}
      </div>

      {/* Dynamic Fields based on Category */}
      {categoryFields.length > 0 || conditionalFields.length > 0 || description ? (
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
                    : "Propiedades Mágicas"}
          </h3>

          {/* Propiedades de Arma (solo para weapons) */}
          {itemCategory === "weapon" && (
            <div className="space-y-2">
              <Label>Propiedades del Arma</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "finesse", label: t.marketplace?.weaponProperties?.finesse || "Sutil" },
                  { value: "versatile", label: t.marketplace?.weaponProperties?.versatile || "Versátil" },
                  { value: "light", label: t.marketplace?.weaponProperties?.light || "Liviana" },
                  { value: "heavy", label: t.marketplace?.weaponProperties?.heavy || "Pesada" },
                  { value: "two-handed", label: t.marketplace?.weaponProperties?.["two-handed"] || "A dos manos" },
                  { value: "ranged", label: t.marketplace?.weaponProperties?.ranged || "A distancia" },
                  { value: "thrown", label: t.marketplace?.weaponProperties?.thrown || "Arrojadiza" },
                  { value: "ammunition", label: t.marketplace?.weaponProperties?.ammunition || "Munición" },
                  { value: "loading", label: t.marketplace?.weaponProperties?.loading || "Recarga" },
                  { value: "reach", label: t.marketplace?.weaponProperties?.reach || "Alcance" },
                  { value: "special", label: t.marketplace?.weaponProperties?.special || "Especial" },
                ].map((prop) => {
                  const isSelected = properties.includes(prop.value)
                  return (
                    <Button
                      key={prop.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setProperties(properties.filter((p) => p !== prop.value))
                        } else {
                          setProperties([...properties, prop.value])
                        }
                      }}
                    >
                      {prop.label}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona las propiedades del arma. Las armas ranged/thrown mostrarán campos de alcance.
              </p>
            </div>
          )}

          {/* Descripción dentro de Propiedades Mágicas */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">{t.inventory.descriptionLabel}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.inventory.descriptionPlaceholder}
              rows={3}
            />
          </div>

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
                            : field.id === "weapon_range_normal"
                              ? weaponRangeNormal
                              : field.id === "weapon_range_long"
                                ? weaponRangeLong
                                : ""

                const setFieldValue = (value: string) => {
                  if (field.id === "damage_dice") setDamageDice(value)
                  else if (field.id === "armor_class") setArmorClass(value)
                  else if (field.id === "effect_dice") setEffectDice(value)
                  else if (field.id === "spell_level") setSpellLevel(value)
                  else if (field.id === "spell_name") setSpellName(value)
                  else if (field.id === "weapon_range_normal") setWeaponRangeNormal(value)
                  else if (field.id === "weapon_range_long") setWeaponRangeLong(value)
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
                            : field.id === "weapon_mastery"
                              ? weaponMastery
                              : ""

                const setFieldValue = (value: string) => {
                  if (field.id === "damage_type") setDamageType(value)
                  else if (field.id === "effect_type") setEffectType(value)
                  else if (field.id === "effect_target") setEffectTarget(value)
                  else if (field.id === "spell_school") setSpellSchool(value)
                  else if (field.id === "wondrous_type") setWondrousType(value)
                  else if (field.id === "weapon_mastery") setWeaponMastery(value)
                }

                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Select value={fieldValue} onValueChange={setFieldValue}>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || `Seleccione ${field.label.toLowerCase()}`} />
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

            {/* Campos condicionales removidos - equipamiento se maneja desde la vista de inventario */}
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

