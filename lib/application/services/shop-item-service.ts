import {
  SupabaseShopItemRepository,
  type ShopItemRepository,
  type ShopItem,
  type CreateShopItem,
  type UpdateShopItem,
} from "@/lib/infrastructure/repositories/shop-item-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para gestión de items de tienda
 * Maneja la lógica de negocio relacionada con shop items
 */
export class ShopItemService {
  constructor(
    private shopItemRepo: ShopItemRepository = new SupabaseShopItemRepository()
  ) {}

  /**
   * Obtiene un item de tienda por su ID
   */
  async getShopItem(shopItemId: string): Promise<ShopItem> {
    ValidationUtils.validateId(shopItemId, "Shop Item ID")

    const item = await this.shopItemRepo.getById(shopItemId)
    if (!item) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop item not found")
    }

    return item
  }

  /**
   * Obtiene todos los items de una tienda
   */
  async getShopItems(shopId: string): Promise<ShopItem[]> {
    ValidationUtils.validateId(shopId, "Shop ID")
    return this.shopItemRepo.getByShopId(shopId)
  }

  /**
   * Obtiene items disponibles (quantity_available > 0) de una tienda
   */
  async getAvailableShopItems(shopId: string): Promise<ShopItem[]> {
    ValidationUtils.validateId(shopId, "Shop ID")
    return this.shopItemRepo.getAvailableByShopId(shopId)
  }

  /**
   * Crea un nuevo item de tienda
   */
  async createShopItem(item: CreateShopItem): Promise<ShopItem> {
    ValidationUtils.validateId(item.shop_id, "Shop ID")
    ValidationUtils.validateNonEmptyString(item.item_name, "Item name")
    ValidationUtils.validateNonNegativeNumber(item.price_in_copper, "Price in copper")
    ValidationUtils.validateNonNegativeNumber(item.quantity_available, "Quantity available")

    return this.shopItemRepo.create(item)
  }

  /**
   * Actualiza un item de tienda
   */
  async updateShopItem(shopItemId: string, updates: UpdateShopItem): Promise<ShopItem> {
    ValidationUtils.validateId(shopItemId, "Shop Item ID")

    if (updates.item_name !== undefined) {
      ValidationUtils.validateNonEmptyString(updates.item_name, "Item name")
    }
    if (updates.price_in_copper !== undefined) {
      ValidationUtils.validateNonNegativeNumber(updates.price_in_copper, "Price in copper")
    }
    if (updates.quantity_available !== undefined) {
      ValidationUtils.validateNonNegativeNumber(updates.quantity_available, "Quantity available")
    }

    return this.shopItemRepo.update(shopItemId, updates)
  }

  /**
   * Elimina un item de tienda
   */
  async deleteShopItem(shopItemId: string): Promise<void> {
    ValidationUtils.validateId(shopItemId, "Shop Item ID")
    await this.shopItemRepo.delete(shopItemId)
  }

  /**
   * Actualiza el stock de un item
   */
  async updateStock(shopItemId: string, quantityChange: number): Promise<ShopItem> {
    ValidationUtils.validateId(shopItemId, "Shop Item ID")
    return this.shopItemRepo.updateStock(shopItemId, quantityChange)
  }
}

