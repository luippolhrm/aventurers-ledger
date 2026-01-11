"use client"

import { useState, useEffect } from "react"
import { useServices } from "@/hooks/use-services"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { InventoryFormData } from "./inventory.types"
import { CONTAINER_SLOTS } from "./inventory.types"
import { canEquipToBodySlots } from "./inventory.utils"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"

interface UseInventoryDataResult {
  character: Character | null
  items: InventoryItem[]
  loading: boolean
  editingItem: InventoryItem | null
  selectedSlot: string | null
  showSlotSelector: boolean
  itemToEquip: InventoryItem | null
  showStoreModal: boolean
  itemToStore: InventoryItem | null
  showItemSelectorModal: boolean
  selectedContainer: InventoryItem | null
  loadInventory: () => Promise<void>
  handleAddOrUpdateItem: (formData: InventoryFormData) => Promise<void>
  handleEditItem: (item: InventoryItem) => void
  handleDeleteItem: (itemId: string) => Promise<void>
  handleEquip: (item: InventoryItem) => void
  handleEquipToSlot: (item: InventoryItem, slot: string) => Promise<void>
  handleUnequip: (item: InventoryItem) => Promise<void>
  handleStore: (item: InventoryItem) => void
  handleStoreInContainer: (item: InventoryItem, containerId: string) => Promise<void>
  handleRemoveFromContainer: (item: InventoryItem) => Promise<void>
  handleAddToContainer: (container: InventoryItem) => void
  handleSelectItemForContainer: (itemId: string) => Promise<void>
  resetForm: () => void
  openSlotSelector: (slot: string) => void
  getItemInSlot: (slot: string) => InventoryItem | undefined
  getItemsInContainer: (containerId: string) => InventoryItem[]
  getEquippedContainers: () => InventoryItem[]
  getContainerInSlot: (slot: string) => InventoryItem | undefined
  getContainerUsedWeight: (containerId: string) => number
  getAvailableItemsForContainer: () => InventoryItem[]
  canEquipToBodySlot: (item: InventoryItem, slot: string) => boolean
  copperToGold: (copper: number) => string
  handleChangeVersatileUsage: (item: InventoryItem, usage: "one-handed" | "two-handed") => Promise<void>
}

export function useInventoryData(characterId: string): UseInventoryDataResult {
  const { t } = useLanguage()
  const { toast } = useToast()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showSlotSelector, setShowSlotSelector] = useState(false)
  const [itemToEquip, setItemToEquip] = useState<InventoryItem | null>(null)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [itemToStore, setItemToStore] = useState<InventoryItem | null>(null)
  const [showItemSelectorModal, setShowItemSelectorModal] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (characterId) {
      loadCharacter()
      loadInventory()
    }
  }, [characterId])

  const loadCharacter = async () => {
    if (!characterId) return
    try {
      const characterData = await services.character.getCharacter(characterId)
      setCharacter(characterData)
    } catch (error) {
      console.error("Error loading character:", error)
    }
  }

  const loadInventory = async () => {
    if (!characterId) return
    setLoading(true)
    try {
      const inventoryItems = await services.inventory.getInventory(characterId)
      setItems(inventoryItems)
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

  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  const resetForm = () => {
    setEditingItem(null)
    setSelectedSlot(null)
    setShowSlotSelector(false)
    setItemToEquip(null)
    setShowStoreModal(false)
    setItemToStore(null)
    setShowItemSelectorModal(false)
    setSelectedContainer(null)
  }

  const openSlotSelector = (slot: string) => {
    setSelectedSlot(slot)
    setShowSlotSelector(true)
    setItemToEquip(null)
  }

  const handleAddOrUpdateItem = async (formData: InventoryFormData) => {
    if (!characterId) return

    try {
      const itemData = {
        character_id: characterId,
        ...formData,
      }

      if (editingItem) {
        await services.inventory.updateItem(editingItem.id, itemData)
        toast({
          title: t.inventory.success,
          description: t.inventory.itemUpdated,
        })
      } else {
        // Si quantity > 1, crear múltiples items individuales
        if (itemData.quantity > 1) {
          const createdItems = await services.inventory.createMultipleItems(itemData)
          toast({
            title: t.inventory.success,
            description: `${createdItems.length} ${t.inventory.itemsCreated || "items creados"}`,
          })
        } else {
          await services.inventory.createItem(itemData)
          toast({
            title: t.inventory.success,
            description: t.inventory.itemAdded,
          })
        }
      }

      loadInventory()
      resetForm()
    } catch (error: any) {
      console.error("Error adding/updating item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || (typeof error === "string" ? error : t.inventory.failedToSave),
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await services.inventory.deleteItem(itemId)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemDeleted,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      const errorMessage = error?.message || t.inventory.deleteError
      toast({
        title: t.inventory.error,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEquip = (item: InventoryItem) => {
    setItemToEquip(item)
    setShowSlotSelector(true)
    setSelectedSlot(null)
  }

  const handleEquipToSlot = async (item: InventoryItem, slot: string) => {
    try {
      await services.inventory.equipItem(item.id, slot)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemEquipped,
      })
      loadInventory()
      setShowSlotSelector(false)
      setItemToEquip(null)
      setSelectedSlot(null)
    } catch (error: any) {
      console.error("Error equipping item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const handleUnequip = async (item: InventoryItem) => {
    try {
      await services.inventory.unequipItem(item.id)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemUnequipped,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error unequipping item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.equipError,
        variant: "destructive",
      })
    }
  }

  const handleStore = (item: InventoryItem) => {
    setItemToStore(item)
    setShowStoreModal(true)
  }

  const handleStoreInContainer = async (item: InventoryItem, containerId: string) => {
    try {
      await services.inventory.storeInContainer(item.id, containerId)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemStored,
      })
      loadInventory()
      setShowStoreModal(false)
      setItemToStore(null)
    } catch (error: any) {
      console.error("Error storing item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromContainer = async (item: InventoryItem) => {
    try {
      await services.inventory.removeFromContainer(item.id)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemRemovedFromContainer,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error removing item from container:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

  const handleAddToContainer = (container: InventoryItem) => {
    setSelectedContainer(container)
    setShowItemSelectorModal(true)
  }

  const handleSelectItemForContainer = async (itemId: string) => {
    if (!selectedContainer) return

    try {
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      await services.inventory.storeInContainer(itemId, selectedContainer.id)
      toast({
        title: t.inventory.success,
        description: t.inventory.itemStored,
      })
      loadInventory()
      setShowItemSelectorModal(false)
      setSelectedContainer(null)
    } catch (error: any) {
      console.error("Error storing item:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || t.inventory.failedToSave,
        variant: "destructive",
      })
    }
  }

  const getItemInSlot = (slot: string) => {
    return items.find((item) => item.equipped_slot === slot)
  }

  const getItemsInContainer = (containerId: string) => {
    return items.filter((item) => item.container_id === containerId)
  }

  const getEquippedContainers = () => {
    return items.filter(
      (item) =>
        item.is_container &&
        item.equipped &&
        item.equipped_slot &&
        CONTAINER_SLOTS.includes(item.equipped_slot as any),
    )
  }

  const getContainerInSlot = (slot: string) => {
    return items.find((item) => item.is_container && item.equipped && item.equipped_slot === slot)
  }

  const getContainerUsedWeight = (containerId: string) => {
    return getItemsInContainer(containerId).reduce((sum, item) => sum + item.weight * item.quantity, 0)
  }

  const getAvailableItemsForContainer = () => {
    return items.filter((item) => !item.equipped && !item.container_id && !item.is_container)
  }

  const canEquipToBodySlot = (item: InventoryItem, slot: string) => {
    if (CONTAINER_SLOTS.includes(slot as any)) {
      return item.is_container
    }
    if (item.is_container) return false

    if (item.item_category === "wondrous" && item.wondrous_type) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        "wondrous",
        item.item_type || undefined,
        item.wondrous_type || undefined,
      )
      if (availableSlots.length > 0) {
        return availableSlots.includes(slot)
      }
    }

    if (item.item_category) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        item.item_category as ItemCategory,
        item.item_type || undefined,
        item.wondrous_type || undefined,
      )
      if (availableSlots.length > 0) {
        return availableSlots.includes(slot)
      }
    }

    return canEquipToBodySlots(item)
  }

  const handleChangeVersatileUsage = async (
    item: InventoryItem,
    usage: "one-handed" | "two-handed"
  ) => {
    try {
      await services.inventory.setVersatileUsage(item.id, usage)
      toast({
        title: t.inventory.success,
        description: `Arma configurada para uso con ${usage === "one-handed" ? "una mano" : "dos manos"}`,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error changing versatile usage:", error)
      toast({
        title: t.inventory.error,
        description: error?.message || "Error al cambiar el uso del arma",
        variant: "destructive",
      })
    }
  }

  return {
    character,
    items,
    loading,
    editingItem,
    selectedSlot,
    showSlotSelector,
    itemToEquip,
    showStoreModal,
    itemToStore,
    showItemSelectorModal,
    selectedContainer,
    loadInventory,
    handleAddOrUpdateItem,
    handleEditItem,
    handleDeleteItem,
    handleEquip,
    handleEquipToSlot,
    handleUnequip,
    handleStore,
    handleStoreInContainer,
    handleRemoveFromContainer,
    handleAddToContainer,
    handleSelectItemForContainer,
    resetForm,
    openSlotSelector,
    getItemInSlot,
    getItemsInContainer,
    getEquippedContainers,
    getContainerInSlot,
    getContainerUsedWeight,
    getAvailableItemsForContainer,
    canEquipToBodySlot,
    copperToGold,
    handleChangeVersatileUsage,
  }
}
