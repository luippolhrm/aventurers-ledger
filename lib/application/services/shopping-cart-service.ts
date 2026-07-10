import {
  SupabaseShoppingCartRepository,
  type ShoppingCartRepository,
  type ShoppingCart,
  type CartWithItems,
  type CheckoutResult,
} from "@/lib/infrastructure/repositories/shopping-cart-repository"
import { SupabaseShopRepository, type ShopRepository } from "@/lib/infrastructure/repositories/shop-repository"
import { SupabaseShopItemRepository, type ShopItemRepository } from "@/lib/infrastructure/repositories/shop-item-repository"
import { CharacterService } from "./character-service"
import { WalletService } from "./wallet-service"
import { CampaignService } from "./campaign-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"
import { PermissionUtils } from "../utils/permissions"
import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

/**
 * Multiplicador de precio según shop_bonuses.discount_percent del personaje (0–99).
 */
function getShopPriceMultiplier(character: Character): number {
  const p = character.shop_bonuses?.discount_percent
  if (p == null || p <= 0 || p >= 100) {
    return 1
  }
  return Math.max(0, 1 - p / 100)
}

/**
 * Servicio de aplicación para gestión de carritos de compras
 * Maneja la lógica de negocio relacionada con carritos, checkout y validaciones
 */
export class ShoppingCartService {
  constructor(
    private cartRepo: ShoppingCartRepository = new SupabaseShoppingCartRepository(),
    private shopRepo: ShopRepository = new SupabaseShopRepository(),
    private shopItemRepo: ShopItemRepository = new SupabaseShopItemRepository(),
    private characterService: CharacterService = new CharacterService(),
    private walletService: WalletService = new WalletService(),
    private campaignService: CampaignService = new CampaignService(),
    private supabase: SupabaseClient = createBrowserClient()
  ) {}

  /**
   * Resuelve el character_id dueño de un ítem de carrito (para permisos).
   */
  private async getCharacterIdForCartItem(cartItemId: string): Promise<string | null> {
    const { data: row, error } = await this.supabase
      .from("shopping_cart_items")
      .select("cart_id")
      .eq("id", cartItemId)
      .maybeSingle()

    if (error || !row?.cart_id) {
      return null
    }

    const { data: cart } = await this.supabase
      .from("shopping_carts")
      .select("character_id")
      .eq("id", row.cart_id)
      .maybeSingle()

    return cart?.character_id ?? null
  }

  /**
   * Obtiene o crea un carrito para un personaje y tienda
   */
  async getOrCreateCart(userId: string, characterId: string, shopId: string): Promise<ShoppingCart | null> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validateId(shopId, "Shop ID")

    try {
      await PermissionUtils.ensureCharacterOwner(userId, characterId)

      // Intentar obtener carrito existente
      const existingCart = await this.cartRepo.getByCharacterAndShop(characterId, shopId)
      if (existingCart) {
        return existingCart
      }

      // Validar que el personaje puede comprar antes de crear el carrito
      const canPurchase = await this.canCharacterPurchase(userId, characterId, shopId, false)
      if (!canPurchase) {
        return null
      }

      // Crear nuevo carrito
      return await this.cartRepo.create({
        character_id: characterId,
        shop_id: shopId,
      })
    } catch (error) {
      console.error("[ShoppingCartService] Error in getOrCreateCart:", error)
      return null
    }
  }

  /**
   * Obtiene un carrito con todos sus items
   */
  async getCartWithItems(userId: string, characterId: string, shopId: string): Promise<CartWithItems | null> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validateId(shopId, "Shop ID")

    await PermissionUtils.ensureCharacterOwner(userId, characterId)

    return this.cartRepo.getCartWithItems(characterId, shopId)
  }

  /**
   * Agrega un item al carrito (o actualiza la cantidad si ya existe)
   */
  async addItemToCart(
    userId: string,
    characterId: string,
    shopId: string,
    shopItemId: string,
    quantity: number
  ): Promise<boolean> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validateId(shopId, "Shop ID")
    ValidationUtils.validateId(shopItemId, "Shop Item ID")
    ValidationUtils.validatePositiveNumber(quantity, "Quantity")

    try {
      await PermissionUtils.ensureCharacterOwner(userId, characterId)

      // Obtener o crear carrito
      const cart = await this.getOrCreateCart(userId, characterId, shopId)
      if (!cart) {
        return false
      }

      // Validar que el shop_item pertenece a la tienda correcta
      const shopItem = await this.shopItemRepo.getById(shopItemId)
      if (!shopItem || shopItem.shop_id !== shopId) {
        return false
      }

      // Agregar item al carrito
      await this.cartRepo.addCartItem({
        cart_id: cart.id,
        shop_item_id: shopItemId,
        quantity,
      })

      return true
    } catch (error) {
      console.error("[ShoppingCartService] Error adding item to cart:", error)
      return false
    }
  }

  /**
   * Actualiza la cantidad de un item del carrito
   */
  async updateCartItem(userId: string, cartItemId: string, quantity: number): Promise<boolean> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(cartItemId, "Cart Item ID")

    if (quantity <= 0) {
      // Si la cantidad es 0 o menos, eliminar el item
      return this.removeCartItem(userId, cartItemId)
    }

    try {
      const ownerCharacterId = await this.getCharacterIdForCartItem(cartItemId)
      if (!ownerCharacterId) {
        return false
      }
      await PermissionUtils.ensureCharacterOwner(userId, ownerCharacterId)

      ValidationUtils.validatePositiveNumber(quantity, "Quantity")
      await this.cartRepo.updateCartItem(cartItemId, { quantity })
      return true
    } catch (error) {
      console.error("[ShoppingCartService] Error updating cart item:", error)
      return false
    }
  }

  /**
   * Elimina un item del carrito
   */
  async removeCartItem(userId: string, cartItemId: string): Promise<boolean> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(cartItemId, "Cart Item ID")

    try {
      const ownerCharacterId = await this.getCharacterIdForCartItem(cartItemId)
      if (!ownerCharacterId) {
        return false
      }
      await PermissionUtils.ensureCharacterOwner(userId, ownerCharacterId)

      await this.cartRepo.removeCartItem(cartItemId)
      return true
    } catch (error) {
      console.error("[ShoppingCartService] Error removing cart item:", error)
      return false
    }
  }

  /**
   * Calcula el costo total del carrito en copper pieces
   */
  async calculateCartTotal(userId: string, characterId: string, shopId: string): Promise<number> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validateId(shopId, "Shop ID")

    await PermissionUtils.ensureCharacterOwner(userId, characterId)

    const character = await this.characterService.getCharacter(characterId)
    const mult = getShopPriceMultiplier(character)

    const cart = await this.cartRepo.getCartWithItems(characterId, shopId)
    if (!cart || !cart.items) {
      return 0
    }

    return cart.items.reduce((total, item) => {
      if (!item.shop_item) return total
      const unit = Math.round(item.shop_item.price_in_copper * mult)
      return total + unit * item.quantity
    }, 0)
  }

  /**
   * Valida si un personaje puede comprar de una tienda
   * (no es GM, está inscrito como player en la campaña)
   */
  async canCharacterPurchase(
    userId: string,
    characterId: string,
    shopId: string,
    isGm: boolean
  ): Promise<boolean> {
    if (isGm) {
      return false
    }

    try {
      ValidationUtils.validateId(userId, "User ID")
      ValidationUtils.validateId(characterId, "Character ID")
      ValidationUtils.validateId(shopId, "Shop ID")

      await PermissionUtils.ensureCharacterOwner(userId, characterId)

      // Verificar que el personaje existe
      const character = await this.characterService.getCharacter(characterId)
      if (!character) {
        return false
      }

      // Obtener la tienda con información de ubicación
      const shop = await this.shopRepo.getByIdWithLocation(shopId)
      if (!shop || !shop.location) {
        return false
      }

      // Verificar que el personaje está inscrito como player en la campaña
      const members = await this.campaignService.getCampaignMembers(shop.location.campaign_id)
      const member = members.find(
        (m) => m.character_id === characterId && m.role === "player"
      )

      return !!member
    } catch (error) {
      console.error("[ShoppingCartService] Error in canCharacterPurchase:", error)
      return false
    }
  }

  /**
   * Valida el checkout antes de procesarlo
   */
  async validateCheckout(
    userId: string,
    characterId: string,
    shopId: string,
    isGm: boolean
  ): Promise<{ valid: boolean; error?: string }> {
    // 1. GMs no pueden comprar
    if (isGm) {
      return { valid: false, error: "Game Masters cannot purchase items" }
    }

    try {
      ValidationUtils.validateId(userId, "User ID")
      ValidationUtils.validateId(characterId, "Character ID")
      ValidationUtils.validateId(shopId, "Shop ID")

      await PermissionUtils.ensureCharacterOwner(userId, characterId)

      // 2. Validar que el personaje existe
      const character = await this.characterService.getCharacter(characterId)
      if (!character) {
        return { valid: false, error: "Character not found or access denied" }
      }

      // 3. Validar que la tienda existe y obtener información de campaña
      const shop = await this.shopRepo.getByIdWithLocation(shopId)
      if (!shop || !shop.location) {
        return { valid: false, error: "Shop not found or invalid" }
      }

      // 4. Validar que el personaje está inscrito como player en la campaña
      const members = await this.campaignService.getCampaignMembers(shop.location.campaign_id)
      const member = members.find(
        (m) => m.character_id === characterId && m.role === "player"
      )
      if (!member) {
        return { valid: false, error: "Character is not enrolled as player in this campaign" }
      }

      // 5. Obtener carrito con items
      const cart = await this.getCartWithItems(userId, characterId, shopId)
      if (!cart || !cart.items || cart.items.length === 0) {
        return { valid: false, error: "Cart is empty" }
      }

      // 6. Validar stock y precios de todos los items
      for (const item of cart.items) {
        if (!item.shop_item) {
          return { valid: false, error: `Item ${item.shop_item_id} not found` }
        }

        // Re-obtener item para validar stock actual (previene race conditions)
        const currentItem = await this.shopItemRepo.getById(item.shop_item_id)
        if (!currentItem) {
          return { valid: false, error: `Item ${item.shop_item.item_name} no longer available` }
        }

        // Validar stock
        if (currentItem.quantity_available < item.quantity) {
          return {
            valid: false,
            error: `Insufficient stock for ${currentItem.item_name}. Available: ${currentItem.quantity_available}, Requested: ${item.quantity}`,
          }
        }

        // Validar que el precio no haya cambiado significativamente (>10%)
        const priceDifference = Math.abs(currentItem.price_in_copper - item.shop_item.price_in_copper)
        const priceChangePercent = (priceDifference / item.shop_item.price_in_copper) * 100
        if (priceChangePercent > 10) {
          return {
            valid: false,
            error: `Price for ${currentItem.item_name} has changed. Please refresh your cart.`,
          }
        }
      }

      // 7. Validar fondos suficientes
      const totalCost = await this.calculateCartTotal(userId, characterId, shopId)
      const wallet = await this.walletService.getWallet(characterId)
      const totalInCopper = await this.walletService.calculateTotalInCopper(characterId)

      if (totalInCopper < totalCost) {
        return { valid: false, error: "Insufficient funds" }
      }

      return { valid: true }
    } catch (error) {
      console.error("[ShoppingCartService] Error in validateCheckout:", error)
      return { valid: false, error: "Validation failed" }
    }
  }

  /**
   * Procesa el checkout del carrito usando stored procedure
   */
  async checkoutCart(
    userId: string,
    characterId: string,
    shopId: string,
    isGm: boolean
  ): Promise<CheckoutResult> {
    // 1. Validar checkout
    const validation = await this.validateCheckout(userId, characterId, shopId, isGm)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 2. Obtener carrito con items
    const cart = await this.getCartWithItems(userId, characterId, shopId)
    if (!cart || !cart.items || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" }
    }

    // 3. Filtrar items válidos
    const validItems = cart.items.filter((item) => item.shop_item)
    if (validItems.length === 0) {
      return { success: false, error: "No valid items in cart" }
    }

    // 4. Preparar items para stored procedure
    const cartItemsJson = validItems.map((item) => ({
      shop_item_id: item.shop_item_id,
      quantity: item.quantity,
    }))

    // 5. Generar descripción de compra
    const purchaseSummary = validItems
      .map((item) => {
        if (!item.shop_item) return null
        return `${item.quantity}x ${item.shop_item.item_name}`
      })
      .filter(Boolean)
      .join(", ")
    const purchaseDescription = `Compra en tienda: ${purchaseSummary}`

    // 6. Llamar stored procedure
    try {
      const { data, error } = await this.supabase.rpc("process_purchase", {
        p_character_id: characterId,
        p_shop_id: shopId,
        p_cart_items: cartItemsJson,
        p_purchase_description: purchaseDescription,
      })

      if (error) {
        console.error("[ShoppingCartService] Stored procedure error:", error)
        return { success: false, error: error.message || "Failed to process purchase" }
      }

      if (!data || !data.success) {
        console.error("[ShoppingCartService] Stored procedure returned failure:", data)
        return {
          success: false,
          error: data?.error || "Purchase processing failed",
        }
      }

      return {
        success: true,
        purchaseIds: data.purchase_ids || [],
      }
    } catch (error: any) {
      console.error("[ShoppingCartService] Exception during checkout:", error)
      return { success: false, error: error.message || "Checkout failed" }
    }
  }

  /**
   * Obtiene el conteo de items en el carrito
   */
  async getCartItemCount(userId: string, characterId: string, shopId: string): Promise<number> {
    const cart = await this.getCartWithItems(userId, characterId, shopId)
    if (!cart || !cart.items) {
      return 0
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }
}

// Re-exportar tipos para compatibilidad
export type { ShoppingCart, CartWithItems, CheckoutResult } from "@/lib/infrastructure/repositories/shopping-cart-repository"
export type { ShoppingCartItem, ShoppingCartItemWithShopItem } from "@/lib/infrastructure/repositories/shopping-cart-repository"

