import {
  SupabaseInventoryRepository,
  type InventoryRepository,
  type InventoryItem,
  type CreateInventoryItem,
  type UpdateInventoryItem,
} from "@/lib/infrastructure/repositories/inventory-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"
import { ValidationUtils } from "../utils/validation"

// Slots corporales (items individuales, NO contenedores)
const BODY_SLOTS = [
  "head",
  "neck",
  "shoulders",
  "body",
  "hands",
  "waist",
  "ring_left",
  "ring_right",
  "feet",
  "weapon_main",
  "weapon_off",
] as const

// Slots de contenedores (pueden almacenar items)
const CONTAINER_SLOTS = ["backpack", "pouch_left", "pouch_right"] as const

type BodySlot = (typeof BODY_SLOTS)[number]
type ContainerSlot = (typeof CONTAINER_SLOTS)[number]

// Tipos de items que pueden equiparse en slots corporales
const EQUIPPABLE_ITEM_TYPES = ["weapon", "armor", "equipment", "wondrous"] as const

/**
 * Servicio de aplicación para manejo de inventario
 * Contiene la lógica de negocio relacionada con items, equipamiento y contenedores
 */
export class InventoryService {
  constructor(
    private inventoryRepo: InventoryRepository = new SupabaseInventoryRepository()
  ) {}

  /**
   * Obtiene todos los items del inventario de un personaje
   */
  async getInventory(characterId: string): Promise<InventoryItem[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.inventoryRepo.getByCharacterId(characterId)
  }

  /**
   * Obtiene un item por su ID
   */
  async getItem(itemId: string): Promise<InventoryItem> {
    ValidationUtils.validateId(itemId, "Item ID")

    const item = await this.inventoryRepo.getById(itemId)
    if (!item) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return item
  }

  /**
   * Crea un nuevo item en el inventario
   */
  async createItem(item: CreateInventoryItem): Promise<InventoryItem> {
    this.validateItemData(item)

    return this.inventoryRepo.create(item)
  }

  /**
   * Actualiza un item
   */
  async updateItem(
    itemId: string,
    updates: UpdateInventoryItem
  ): Promise<InventoryItem> {
    ValidationUtils.validateId(itemId, "Item ID")

    // Validar que el item existe
    await this.getItem(itemId)

    return this.inventoryRepo.update(itemId, updates)
  }

  /**
   * Elimina un item
   */
  async deleteItem(itemId: string): Promise<void> {
    ValidationUtils.validateId(itemId, "Item ID")

    await this.getItem(itemId) // Validar que existe
    return this.inventoryRepo.delete(itemId)
  }

  /**
   * Equipa un item en un slot específico
   * Valida que el slot sea válido y desequipa cualquier item que esté en ese slot
   */
  async equipItem(itemId: string, slot: string): Promise<InventoryItem> {
    const item = await this.getItem(itemId)

    // Validar que el item puede equiparse en ese slot
    if (!this.canEquipToSlot(item, slot)) {
      throw ErrorService.create(
        ErrorCode.INVALID_EQUIPMENT_SLOT,
        `Item cannot be equipped in slot: ${slot}`
      )
    }

    // Si el item está en un contenedor, no se puede equipar
    if (item.container_id) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Cannot equip item that is stored in a container"
      )
    }

    // Desequipar cualquier item que esté en ese slot
    if (item.character_id) {
      await this.inventoryRepo.unequipSlot(item.character_id, slot)
    }

    // Equipar el nuevo item
    return this.inventoryRepo.equipItem(itemId, slot)
  }

  /**
   * Desequipa un item
   */
  async unequipItem(itemId: string): Promise<InventoryItem> {
    const item = await this.getItem(itemId)

    if (!item.equipped) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Item is not equipped"
      )
    }

    return this.inventoryRepo.unequipItem(itemId)
  }

  /**
   * Almacena un item en un contenedor
   * Valida capacidad y peso
   */
  async storeInContainer(
    itemId: string,
    containerId: string
  ): Promise<InventoryItem> {
    const item = await this.getItem(itemId)
    const container = await this.getItem(containerId)

    // Validar que el contenedor es realmente un contenedor
    if (!container.is_container) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Target item is not a container"
      )
    }

    // Validar que el item no es el mismo contenedor (evitar loops)
    if (item.id === container.id) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Cannot store container in itself"
      )
    }

    // Validar que el item no está equipado
    if (item.equipped) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Cannot store equipped item"
      )
    }

    // Validar capacidad
    const itemTotalWeight = item.weight * item.quantity
    const availableCapacity = await this.getContainerAvailableCapacity(container)

    if (itemTotalWeight > availableCapacity) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        `Container capacity exceeded: ${itemTotalWeight.toFixed(2)} lb > ${availableCapacity.toFixed(2)} lb`
      )
    }

    return this.inventoryRepo.storeInContainer(itemId, containerId)
  }

  /**
   * Remueve un item de su contenedor
   */
  async removeFromContainer(itemId: string): Promise<InventoryItem> {
    const item = await this.getItem(itemId)

    if (!item.container_id) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Item is not in a container"
      )
    }

    return this.inventoryRepo.removeFromContainer(itemId)
  }

  /**
   * Obtiene items equipados de un personaje
   */
  async getEquippedItems(characterId: string): Promise<InventoryItem[]> {
    return this.inventoryRepo.getEquippedByCharacterId(characterId)
  }

  /**
   * Obtiene items en un contenedor
   */
  async getItemsInContainer(containerId: string): Promise<InventoryItem[]> {
    return this.inventoryRepo.getByContainerId(containerId)
  }

  /**
   * Obtiene contenedores de un personaje
   */
  async getContainers(characterId: string): Promise<InventoryItem[]> {
    return this.inventoryRepo.getContainersByCharacterId(characterId)
  }

  /**
   * Obtiene el item equipado en un slot específico
   */
  async getItemInSlot(
    characterId: string,
    slot: string
  ): Promise<InventoryItem | null> {
    const equipped = await this.getEquippedItems(characterId)
    return equipped.find((item) => item.equipped_slot === slot) || null
  }

  /**
   * Calcula el peso total del inventario de un personaje
   */
  async calculateTotalWeight(characterId: string): Promise<number> {
    const items = await this.getInventory(characterId)
    return items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
  }

  /**
   * Calcula el valor total del inventario en copper pieces
   */
  async calculateTotalValue(characterId: string): Promise<number> {
    const items = await this.getInventory(characterId)
    return items.reduce(
      (sum, item) => sum + item.value_in_copper * item.quantity,
      0
    )
  }

  /**
   * Calcula el peso usado en un contenedor
   */
  async getContainerUsedWeight(containerId: string): Promise<number> {
    const items = await this.getItemsInContainer(containerId)
    return items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
  }

  /**
   * Calcula la capacidad disponible en un contenedor
   */
  async getContainerAvailableCapacity(
    container: InventoryItem
  ): Promise<number> {
    if (!container.is_container) {
      return 0
    }

    const usedWeight = await this.getContainerUsedWeight(container.id)
    return container.container_capacity - usedWeight
  }

  /**
   * Valida si un item puede equiparse en un slot específico
   */
  canEquipToSlot(item: InventoryItem, slot: string): boolean {
    // Container slots son solo para contenedores
    if ((CONTAINER_SLOTS as readonly string[]).includes(slot)) {
      return item.is_container
    }

    // Body slots son para items no-contenedores
    if (item.is_container) {
      return false
    }

    // Para wondrous items, validar slot basado en wondrous_type
    if (item.item_category === "wondrous" && item.wondrous_type) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        "wondrous",
        item.item_type || undefined,
        item.wondrous_type || undefined
      )
      return availableSlots.includes(slot)
    }

    // Para otros items equipables, verificar si el slot está disponible para la categoría
    if (item.item_category) {
      const availableSlots = ItemFormConfigService.getAvailableSlots(
        item.item_category as ItemCategory,
        item.item_type || undefined,
        item.wondrous_type || undefined
      )
      if (availableSlots.length > 0) {
        return availableSlots.includes(slot)
      }
    }

    // Default: permitir si el item puede equiparse en slots corporales
    return this.canEquipToBodySlots(item)
  }

  /**
   * Valida si un item puede equiparse en slots corporales
   */
  canEquipToBodySlots(item: InventoryItem): boolean {
    if (item.is_container) return false

    // Si tiene item_category, usar el servicio para verificar
    if (item.item_category) {
      return ItemFormConfigService.canEquipCategory(
        item.item_category as ItemCategory
      )
    }

    // Fallback a item_type
    return (EQUIPPABLE_ITEM_TYPES as readonly string[]).includes(
      item.item_type as any
    )
  }

  /**
   * Valida los datos de un item antes de crear/actualizar
   */
  private validateItemData(item: CreateInventoryItem | UpdateInventoryItem): void {
    if ("item_name" in item && item.item_name !== undefined) {
      ValidationUtils.validateNonEmptyString(item.item_name, "Item name")
    }

    if ("quantity" in item && item.quantity !== undefined) {
      ValidationUtils.validatePositiveNumber(item.quantity, "Quantity")
    }

    if ("weight" in item && item.weight !== undefined) {
      ValidationUtils.validateNonNegativeNumber(item.weight, "Weight")
    }

    if ("value_in_copper" in item && item.value_in_copper !== undefined) {
      ValidationUtils.validateNonNegativeNumber(item.value_in_copper, "Value")
    }

    if ("container_capacity" in item && item.container_capacity !== undefined) {
      ValidationUtils.validateNonNegativeNumber(item.container_capacity, "Container capacity")
    }
  }
}

