import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  ShoppingCart,
  ShoppingCartItem,
  ShoppingCartItemWithShopItem,
  CartWithItems,
  CreateShoppingCart,
  CreateShoppingCartItem,
  UpdateShoppingCartItem,
} from "./shopping-cart-repository.types"

// Re-export types
export type {
  ShoppingCart,
  ShoppingCartItem,
  ShoppingCartItemWithShopItem,
  CartWithItems,
  CreateShoppingCart,
  CreateShoppingCartItem,
  UpdateShoppingCartItem,
} from "./shopping-cart-repository.types"

/**
 * Interfaz del repositorio de Shopping Carts
 */
export interface ShoppingCartRepository {
  /**
   * Obtiene un carrito por character_id y shop_id
   */
  getByCharacterAndShop(characterId: string, shopId: string): Promise<ShoppingCart | null>

  /**
   * Crea un nuevo carrito
   */
  create(cart: CreateShoppingCart): Promise<ShoppingCart>

  /**
   * Obtiene un carrito con todos sus items (incluyendo shop_item details)
   */
  getCartWithItems(characterId: string, shopId: string): Promise<CartWithItems | null>

  /**
   * Obtiene todos los items de un carrito
   */
  getCartItems(cartId: string): Promise<ShoppingCartItem[]>

  /**
   * Obtiene items del carrito con información de shop_item
   */
  getCartItemsWithShopItems(cartId: string): Promise<ShoppingCartItemWithShopItem[]>

  /**
   * Agrega un item al carrito
   */
  addCartItem(item: CreateShoppingCartItem): Promise<ShoppingCartItem>

  /**
   * Actualiza la cantidad de un item del carrito
   */
  updateCartItem(itemId: string, updates: UpdateShoppingCartItem): Promise<ShoppingCartItem>

  /**
   * Elimina un item del carrito
   */
  removeCartItem(itemId: string): Promise<void>

  /**
   * Elimina todos los items de un carrito
   */
  clearCart(cartId: string): Promise<void>

  /**
   * Elimina un carrito y todos sus items
   */
  deleteCart(cartId: string): Promise<void>
}

/**
 * Implementación de ShoppingCartRepository usando Supabase
 */
export class SupabaseShoppingCartRepository implements ShoppingCartRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByCharacterAndShop(characterId: string, shopId: string): Promise<ShoppingCart | null> {
    const { data, error } = await this.supabase
      .from("shopping_carts")
      .select("*")
      .eq("character_id", characterId)
      .eq("shop_id", shopId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCart(data) : null
  }

  async create(cart: CreateShoppingCart): Promise<ShoppingCart> {
    const { data, error } = await this.supabase
      .from("shopping_carts")
      .insert({
        character_id: cart.character_id,
        shop_id: cart.shop_id,
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create shopping cart")
    }

    return this.mapToCart(data)
  }

  async getCartWithItems(characterId: string, shopId: string): Promise<CartWithItems | null> {
    const cart = await this.getByCharacterAndShop(characterId, shopId)
    if (!cart) {
      return null
    }

    const items = await this.getCartItemsWithShopItems(cart.id)

    return {
      ...cart,
      items,
    }
  }

  async getCartItems(cartId: string): Promise<ShoppingCartItem[]> {
    const { data, error } = await this.supabase
      .from("shopping_cart_items")
      .select("*")
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToCartItem(item))
  }

  async getCartItemsWithShopItems(cartId: string): Promise<ShoppingCartItemWithShopItem[]> {
    const { data, error } = await this.supabase
      .from("shopping_cart_items")
      .select(
        `
        *,
        shop_items (
          id,
          item_name,
          item_type,
          description,
          price_in_copper,
          weight,
          quantity_available,
          image_url,
          rarity,
          item_category
        )
      `
      )
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item: any) => ({
      ...this.mapToCartItem(item),
      shop_item: item.shop_items
        ? {
            id: item.shop_items.id,
            item_name: item.shop_items.item_name,
            item_type: item.shop_items.item_type,
            description: item.shop_items.description,
            price_in_copper: item.shop_items.price_in_copper,
            weight: item.shop_items.weight,
            quantity_available: item.shop_items.quantity_available,
            image_url: item.shop_items.image_url || undefined,
            rarity: item.shop_items.rarity || undefined,
            item_category: item.shop_items.item_category || undefined,
          }
        : undefined,
    }))
  }

  async addCartItem(item: CreateShoppingCartItem): Promise<ShoppingCartItem> {
    // Verificar si el item ya existe en el carrito
    const { data: existing } = await this.supabase
      .from("shopping_cart_items")
      .select("*")
      .eq("cart_id", item.cart_id)
      .eq("shop_item_id", item.shop_item_id)
      .maybeSingle()

    if (existing) {
      // Si existe, actualizar la cantidad
      return this.updateCartItem(existing.id, {
        quantity: existing.quantity + item.quantity,
      })
    }

    // Si no existe, crear nuevo
    const { data, error } = await this.supabase
      .from("shopping_cart_items")
      .insert({
        cart_id: item.cart_id,
        shop_item_id: item.shop_item_id,
        quantity: item.quantity,
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to add item to cart")
    }

    return this.mapToCartItem(data)
  }

  async updateCartItem(itemId: string, updates: UpdateShoppingCartItem): Promise<ShoppingCartItem> {
    const { data, error } = await this.supabase
      .from("shopping_cart_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Cart item not found")
    }

    return this.mapToCartItem(data)
  }

  async removeCartItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from("shopping_cart_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async clearCart(cartId: string): Promise<void> {
    const { error } = await this.supabase
      .from("shopping_cart_items")
      .delete()
      .eq("cart_id", cartId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async deleteCart(cartId: string): Promise<void> {
    // Los items se eliminan automáticamente por CASCADE
    const { error } = await this.supabase
      .from("shopping_carts")
      .delete()
      .eq("id", cartId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToCart(data: any): ShoppingCart {
    return {
      id: data.id,
      character_id: data.character_id,
      shop_id: data.shop_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }

  private mapToCartItem(data: any): ShoppingCartItem {
    return {
      id: data.id,
      cart_id: data.cart_id,
      shop_item_id: data.shop_item_id,
      quantity: data.quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }
}

