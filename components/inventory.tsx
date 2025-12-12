"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Language, translations } from "@/lib/translations"
import { useActiveCharacter } from "@/lib/active-character-context"
import { createBrowserClient } from "@/lib/supabase"
import { Package, Plus, Shield, TrendingUp, Trash2, Edit, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  character_id: string
  item_name: string
  item_type: string
  quantity: number
  weight: number
  value_in_copper: number
  description: string | null
  equipped: boolean
  equipped_slot: string | null
  container_id: string | null
  is_container: boolean
  container_capacity: number
}

interface InventoryProps {
  language: Language
}

export function Inventory({ language }: InventoryProps) {
  const t = translations[language]
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showSlotSelector, setShowSlotSelector] = useState(false)
  const [itemToEquip, setItemToEquip] = useState<InventoryItem | null>(null)

  // Form states
  const [itemName, setItemName] = useState("")
  const [itemType, setItemType] = useState("weapon")
  const [equippableSlot, setEquippableSlot] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [weight, setWeight] = useState("0")
  const [valueInCopper, setValueInCopper] = useState("0")
  const [description, setDescription] = useState("")
  const [equipped, setEquipped] = useState(false)

  useEffect(() => {
    if (activeCharacterId) {
      loadInventory()
    }
  }, [activeCharacterId])

  const loadInventory = async () => {
    if (!activeCharacterId) return

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("character_id", activeCharacterId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error loading inventory:", error)
      toast({
        title: t.inventory.error,
        description: t.inventory.loadError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setItemName("")
    setItemType("weapon")
    setEquippableSlot("")
    setQuantity("1")
    setWeight("0")
    setValueInCopper("0")
    setDescription("")
    setEquipped(false)
    setEditingItem(null)
    setSelectedSlot(null)
    setShowSlotSelector(false)
    setItemToEquip(null)
  }

  const handleAddOrUpdateItem = async () => {
    if (!activeCharacter) return
    if (!itemName.trim()) {
      toast({
        title: t.inventory.error,
        description: t.inventory.itemNameRequired,
        variant: "destructive",
      })
      return
    }

    try {
      const itemData = {
        character_id: activeCharacter.id,
        item_name: itemName.trim(),
        item_type: itemType,
        equippable_slot: equippableSlot || null,
        quantity: Number.parseInt(quantity) || 1,
        weight: Number.parseFloat(weight) || 0,
        value_in_copper: Number.parseInt(valueInCopper) || 0,
        description: description.trim(),
        equipped,
      }

      const supabase = createBrowserClient()

      if (editingItem) {
        // Update existing item
        const { error } = await supabase.from("inventory").update(itemData).eq("id", editingItem.id)

        if (error) throw error

        toast({
          title: t.inventory.success,
          description: t.inventory.itemUpdated,
        })
      } else {
        // Add new item
        const { error } = await supabase.from("inventory").insert([itemData])

        if (error) throw error

        toast({
          title: t.inventory.success,
          description: t.inventory.itemAdded,
        })
      }

      loadInventory()
      resetForm()
    } catch (error) {
      console.error("Error adding/updating item:", error)
      toast({
        title: t.inventory.error,
        description: t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setItemName(item.item_name)
    setItemType(item.item_type)
    setEquippableSlot(item.equipped_slot || "")
    setQuantity(item.quantity.toString())
    setWeight(item.weight.toString())
    setValueInCopper(item.value_in_copper.toString())
    setDescription(item.description || "")
    setEquipped(item.equipped)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("inventory").delete().eq("id", itemId)

      if (error) throw error

      toast({
        title: t.inventory.success,
        description: t.inventory.itemDeleted,
      })

      loadInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: t.inventory.error,
        description: t.inventory.deleteError,
        variant: "destructive",
      })
    }
  }

  const handleToggleEquipped = async (item: InventoryItem) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("inventory").update({ equipped: !item.equipped }).eq("id", item.id)

      if (error) throw error

      loadInventory()
    } catch (error) {
      console.error("Error toggling equipped:", error)
    }
  }

  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  const getTotalWeight = () => items.reduce((sum, item) => sum + item.weight * item.quantity, 0).toFixed(2)

  const getTotalValue = () => items.reduce((sum, item) => sum + item.value_in_copper * item.quantity, 0)

  const equippedItems = items.filter((item) => item.equipped)

  const getItemInSlot = (slot: string) => {
    return items.find((item) => item.equipped_slot === slot)
  }

  const getItemsInContainer = (containerId: string) => {
    return items.filter((item) => item.container_id === containerId)
  }

  const containers = items.filter((item) => item.is_container)

  const handleEquipToSlot = async (item: InventoryItem, slot: string) => {
    try {
      const supabase = createBrowserClient()

      // Check if slot is already occupied
      const existingItem = getItemInSlot(slot)
      if (existingItem && existingItem.id !== item.id) {
        // Unequip the existing item first
        await supabase.from("inventory").update({ equipped: false, equipped_slot: null }).eq("id", existingItem.id)
      }

      // Equip the new item to the slot
      const { error } = await supabase
        .from("inventory")
        .update({
          equipped: true,
          equipped_slot: slot,
        })
        .eq("id", item.id)

      if (error) throw error

      toast({
        title: t.inventory.success,
        description: t.inventory.itemEquipped,
      })

      loadInventory()
      setShowSlotSelector(false)
      setItemToEquip(null)
    } catch (error) {
      console.error("Error equipping item:", error)
      toast({
        title: t.inventory.error,
        description: t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const handleUnequipFromSlot = async (item: InventoryItem) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("inventory")
        .update({
          equipped: false,
          equipped_slot: null,
        })
        .eq("id", item.id)

      if (error) throw error

      toast({
        title: t.inventory.success,
        description: t.inventory.itemUnequipped,
      })

      loadInventory()
    } catch (error) {
      console.error("Error unequipping item:", error)
    }
  }

  const renderEquipmentSlot = (slotKey: string, slotLabel: string, slotDescription: string) => {
    const item = getItemInSlot(slotKey)

    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{slotLabel}</CardTitle>
          <CardDescription className="text-xs">{slotDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {item ? (
            <div className="space-y-2">
              <p className="font-semibold text-sm">{item.item_name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => handleUnequipFromSlot(item)}
              >
                {t.inventory.unequip}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">{t.inventory.emptySlot}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedSlot(slotKey)
                  setShowSlotSelector(true)
                }}
              >
                {t.inventory.equipItem}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!activeCharacterId) {
    return (
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            {t.inventory.title}
          </CardTitle>
          <CardDescription>{t.inventory.noCharacterSelected}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-6 h-6" />
          {t.inventory.title}
        </CardTitle>
        <CardDescription>
          {activeCharacter?.name} - {t.inventory.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items">{t.inventory.tabs.items}</TabsTrigger>
            <TabsTrigger value="add">{t.inventory.tabs.add}</TabsTrigger>
            <TabsTrigger value="equipped">{t.inventory.tabs.equipped}</TabsTrigger>
            <TabsTrigger value="summary">{t.inventory.tabs.summary}</TabsTrigger>
          </TabsList>

          {/* Items List Tab */}
          <TabsContent value="items" className="space-y-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">{t.inventory.loading}</p>
            ) : items.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t.inventory.noItems}</p>
            ) : (
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
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{t.inventory.types[item.item_type as keyof typeof t.inventory.types]}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.weight} lb</TableCell>
                        <TableCell className="text-right">{copperToGold(item.value_in_copper)} gp</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={item.equipped ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleEquipped(item)}
                          >
                            {item.equipped ? t.inventory.yes : t.inventory.no}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Add/Edit Item Tab */}
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              {editingItem && (
                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <p className="text-sm">
                    {t.inventory.editingItem}: {editingItem.item_name}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetForm}>
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

                {(itemType === "weapon" || itemType === "armor" || itemType === "equipment") && (
                  <div className="space-y-2">
                    <Label htmlFor="equippableSlot">{t.inventory.equippableSlot}</Label>
                    <Select value={equippableSlot} onValueChange={setEquippableSlot}>
                      <SelectTrigger id="equippableSlot">
                        <SelectValue placeholder={t.inventory.selectSlot} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="head">{t.inventory.slots.head.name}</SelectItem>
                        <SelectItem value="neck">{t.inventory.slots.neck.name}</SelectItem>
                        <SelectItem value="shoulders">{t.inventory.slots.shoulders.name}</SelectItem>
                        <SelectItem value="body">{t.inventory.slots.body.name}</SelectItem>
                        <SelectItem value="hands">{t.inventory.slots.hands.name}</SelectItem>
                        <SelectItem value="waist">{t.inventory.slots.waist.name}</SelectItem>
                        <SelectItem value="ring_left">{t.inventory.slots.ringLeft.name}</SelectItem>
                        <SelectItem value="ring_right">{t.inventory.slots.ringRight.name}</SelectItem>
                        <SelectItem value="feet">{t.inventory.slots.feet.name}</SelectItem>
                        {itemType === "weapon" && (
                          <>
                            <SelectItem value="weapon_main">{t.inventory.slots.weaponMain.name}</SelectItem>
                            <SelectItem value="weapon_off">{t.inventory.slots.weaponOff.name}</SelectItem>
                          </>
                        )}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.inventory.description}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.inventory.descriptionPlaceholder}
                  rows={3}
                />
              </div>

              <Button onClick={handleAddOrUpdateItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {editingItem ? t.inventory.updateItem : t.inventory.addItem}
              </Button>
            </div>
          </TabsContent>

          {/* Equipped Items Tab */}
          <TabsContent value="equipped" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Head, Neck, Shoulders, Body */}
              <div className="space-y-4">
                {renderEquipmentSlot(
                  "head",
                  t.inventory.slots.head.name as string,
                  t.inventory.slots.head.description as string,
                )}
                {renderEquipmentSlot(
                  "neck",
                  t.inventory.slots.neck.name as string,
                  t.inventory.slots.neck.description as string,
                )}
                {renderEquipmentSlot(
                  "shoulders",
                  t.inventory.slots.shoulders.name as string,
                  t.inventory.slots.shoulders.description as string,
                )}
                {renderEquipmentSlot(
                  "body",
                  t.inventory.slots.body.name as string,
                  t.inventory.slots.body.description as string,
                )}
              </div>

              {/* Center Column - Character visual representation */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-32 h-32 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">{activeCharacter?.name}</p>
                  <p className="text-sm text-muted-foreground">{activeCharacter?.race}</p>
                </div>
              </div>

              {/* Right Column - Hands, Waist, Rings, Feet */}
              <div className="space-y-4">
                {renderEquipmentSlot(
                  "hands",
                  t.inventory.slots.hands.name as string,
                  t.inventory.slots.hands.description as string,
                )}
                {renderEquipmentSlot(
                  "waist",
                  t.inventory.slots.waist.name as string,
                  t.inventory.slots.waist.description as string,
                )}
                {renderEquipmentSlot(
                  "ring_left",
                  t.inventory.slots.ringLeft.name as string,
                  t.inventory.slots.ringLeft.description as string,
                )}
                {renderEquipmentSlot(
                  "ring_right",
                  t.inventory.slots.ringRight.name as string,
                  t.inventory.slots.ringRight.description as string,
                )}
                {renderEquipmentSlot(
                  "feet",
                  t.inventory.slots.feet.name as string,
                  t.inventory.slots.feet.description as string,
                )}
              </div>
            </div>

            {/* Weapons Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t.inventory.weaponsTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEquipmentSlot(
                  "weapon_main",
                  t.inventory.slots.weaponMain.name as string,
                  t.inventory.slots.weaponMain.description as string,
                )}
                {renderEquipmentSlot(
                  "weapon_off",
                  t.inventory.slots.weaponOff.name as string,
                  t.inventory.slots.weaponOff.description as string,
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t.inventory.containersTitle}</h3>
              {containers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t.inventory.noContainers}</p>
              ) : (
                <div className="space-y-4">
                  {containers.map((container) => {
                    const containedItems = getItemsInContainer(container.id)
                    const totalWeight = containedItems.reduce((sum, item) => sum + item.weight * item.quantity, 0)

                    return (
                      <Card key={container.id}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              {container.item_name}
                            </span>
                            <span className="text-sm font-normal text-muted-foreground">
                              {totalWeight.toFixed(2)} / {container.container_capacity} lb
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {containedItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {t.inventory.emptyContainer}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {containedItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                                  <span>
                                    {item.item_name} ({item.quantity})
                                  </span>
                                  <span className="text-muted-foreground">
                                    {(item.weight * item.quantity).toFixed(2)} lb
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {showSlotSelector && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>{t.inventory.selectItemToEquip}</CardTitle>
                    <CardDescription>
                      {t.inventory.equipToSlot}:{" "}
                      {selectedSlot && t.inventory.slots[selectedSlot as keyof typeof t.inventory.slots]?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items
                      .filter((item) => !item.equipped_slot)
                      .map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="w-full justify-start bg-transparent"
                          onClick={() => selectedSlot && handleEquipToSlot(item, selectedSlot)}
                        >
                          {item.item_name} - {t.inventory.types[item.item_type as keyof typeof t.inventory.types]}
                        </Button>
                      ))}
                    {items.filter((item) => !item.equipped_slot).length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">{t.inventory.noAvailableItems}</p>
                    )}
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => {
                        setShowSlotSelector(false)
                        setSelectedSlot(null)
                      }}
                    >
                      {t.inventory.cancel}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {t.inventory.totalItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {equippedItems.length} {t.inventory.equippedCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t.inventory.totalWeight}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{getTotalWeight()}</p>
                  <p className="text-sm text-muted-foreground">{t.inventory.pounds}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t.inventory.totalValue}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{copperToGold(getTotalValue())}</p>
                  <p className="text-sm text-muted-foreground">{t.inventory.goldPieces}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.inventory.itemsByType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    items.reduce(
                      (acc, item) => {
                        acc[item.item_type] = (acc[item.item_type] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span>{t.inventory.types[type as keyof typeof t.inventory.types]}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
