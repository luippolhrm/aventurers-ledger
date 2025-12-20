/**
 * Service for managing shopping carts and checkout
 */

import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface ShoppingCart {
  id: string
  character_id: string
  shop_id: string
  created_at: string
  updated_at: string
}

export interface ShoppingCartItem {
  id: string
  cart_id: string
  shop_item_id: string
  quantity: number
  created_at: string
  updated_at: string
  shop_item?: {
    id: string
    item_name: string
    item_type: string | null
    description: string | null
    price_in_copper: number
    weight: number
    quantity_available: number
    image_url?: string | null
    rarity?: string | null
    item_category?: string | null
  }
}

export interface CartWithItems extends ShoppingCart {
  items: ShoppingCartItem[]
}

export interface CheckoutResult {
  success: boolean
  error?: string
  purchaseIds?: string[]
}

export class ShoppingCartService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createBrowserClient()
  }

  /**
   * Get or create a shopping cart for a character and shop
   */
  async getOrCreateCart(characterId: string, shopId: string): Promise<ShoppingCart | null> {
    try {
      // Try to get existing cart
      const { data: existingCart, error: fetchError } = await this.supabase
        .from("shopping_carts")
        .select("*")
        .eq("character_id", characterId)
        .eq("shop_id", shopId)
        .maybeSingle()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is OK
        console.error("[ShoppingCart] Error fetching cart:", {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        })
        return null
      }

      if (existingCart) {
        return existingCart as ShoppingCart
      }

      // Verify character has access to shop before creating cart
      // This helps provide better error messages
      const canPurchase = await this.canCharacterPurchase(characterId, shopId, false)
      if (!canPurchase) {
        console.error("[ShoppingCart] Character cannot purchase from this shop:", {
          characterId,
          shopId,
          reason: "Character may not be enrolled as player in the campaign",
        })
        return null
      }

      // Create new cart
      const { data: newCart, error: createError } = await this.supabase
        .from("shopping_carts")
        .insert({
          character_id: characterId,
          shop_id: shopId,
        })
        .select()
        .single()

      if (createError) {
        console.error("[ShoppingCart] Error creating cart:", {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint,
          characterId,
          shopId,
        })
        return null
      }

      return newCart as ShoppingCart
    } catch (error) {
      console.error("[ShoppingCart] Unexpected error in getOrCreateCart:", error)
      return null
    }
  }

  /**
   * Get cart with all items
   */
  async getCartWithItems(characterId: string, shopId: string): Promise<CartWithItems | null> {
    const cart = await this.getOrCreateCart(characterId, shopId)
    if (!cart) {
      console.log("[ShoppingCart] No cart found for character:", characterId, "shop:", shopId)
      return null
    }

    console.log("[ShoppingCart] Fetching items for cart:", cart.id)

    // Primero obtener los items del carrito
    // Usar select explícito para evitar problemas de caché
    const { data: items, error: itemsError } = await this.supabase
      .from("shopping_cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true })

    if (itemsError) {
      console.error("[ShoppingCart] Error fetching cart items:", {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
        cartId: cart.id,
      })
      return null
    }

    if (!items || items.length === 0) {
      console.log("[ShoppingCart] No items found in cart:", cart.id)
      return {
        ...cart,
        items: [],
      }
    }

    // Obtener los shop_items para cada item del carrito
    const shopItemIds = items.map(item => item.shop_item_id)
    console.log("[ShoppingCart] Fetching shop items for IDs:", shopItemIds)
    
    // Si no hay IDs, retornar items sin shop_item
    if (shopItemIds.length === 0) {
      console.log("[ShoppingCart] No shop item IDs to fetch")
      return {
        ...cart,
        items: items.map(item => ({ ...item, shop_item: undefined })) as ShoppingCartItem[],
      }
    }
    
    // Intentar obtener todos los shop_items de una vez
    const { data: shopItems, error: shopItemsError } = await this.supabase
      .from("shop_items")
      .select("id, item_name, item_type, description, price_in_copper, weight, quantity_available, image_url, rarity, item_category")
      .in("id", shopItemIds)

    if (shopItemsError) {
      console.error("[ShoppingCart] Error fetching shop items:", {
        message: shopItemsError.message,
        code: shopItemsError.code,
        details: shopItemsError.details,
        hint: shopItemsError.hint,
        shopItemIds,
      })
      // Si falla la consulta masiva, intentar obtener uno por uno como fallback
      console.log("[ShoppingCart] Attempting to fetch shop items individually as fallback...")
      const individualShopItems: any[] = []
      for (const shopItemId of shopItemIds) {
        const { data: item, error } = await this.supabase
          .from("shop_items")
          .select("id, item_name, item_type, description, price_in_copper, weight, quantity_available, image_url, rarity, item_category")
          .eq("id", shopItemId)
          .maybeSingle()
        
        if (!error && item) {
          individualShopItems.push(item)
        } else if (error) {
          console.warn("[ShoppingCart] Failed to fetch individual shop item:", {
            shopItemId,
            error: error.message,
          })
        }
      }
      console.log("[ShoppingCart] Fetched", individualShopItems.length, "shop items individually")
      
      // Combinar los datos con los items obtenidos individualmente
      const itemsWithShopItems: ShoppingCartItem[] = items.map(cartItem => {
        const shopItem = individualShopItems.find(si => si.id === cartItem.shop_item_id)
        if (!shopItem) {
          console.warn("[ShoppingCart] Shop item not found for cart item (after fallback):", {
            cartItemId: cartItem.id,
            shopItemId: cartItem.shop_item_id,
          })
        }
        return {
          ...cartItem,
          shop_item: shopItem || undefined,
        } as ShoppingCartItem
      })
      
      const validItems = itemsWithShopItems.filter(item => item.shop_item)
      console.log("[ShoppingCart] Valid items with shop_item (after fallback):", validItems.length, "of", itemsWithShopItems.length)
      
      return {
        ...cart,
        items: itemsWithShopItems,
      }
    }
    
    // Si no hubo error, continuar con el flujo normal
    console.log("[ShoppingCart] Shop items fetched:", shopItems?.length || 0, "items")

    // Combinar los datos
    const itemsWithShopItems: ShoppingCartItem[] = items.map(cartItem => {
      const shopItem = shopItems?.find(si => si.id === cartItem.shop_item_id)
      if (!shopItem) {
        console.warn("[ShoppingCart] Shop item not found for cart item:", {
          cartItemId: cartItem.id,
          shopItemId: cartItem.shop_item_id,
          availableShopItemIds: shopItems?.map(si => si.id) || [],
        })
      }
      return {
        ...cartItem,
        shop_item: shopItem || undefined,
      } as ShoppingCartItem
    })
    
    // Filtrar items que no tienen shop_item válido para el log
    const validItems = itemsWithShopItems.filter(item => item.shop_item)
    console.log("[ShoppingCart] Valid items with shop_item:", validItems.length, "of", itemsWithShopItems.length)

    console.log("[ShoppingCart] Cart items fetched:", itemsWithShopItems.length, "items")

    const cartWithItems: CartWithItems = {
      ...cart,
      items: itemsWithShopItems,
    }

    // Log para debug
    if (cartWithItems.items.length > 0) {
      console.log("[ShoppingCart] Cart items details:", cartWithItems.items.map(item => ({
        id: item.id,
        shop_item_id: item.shop_item_id,
        quantity: item.quantity,
        shop_item: item.shop_item ? {
          id: item.shop_item.id,
          item_name: item.shop_item.item_name,
        } : null,
      })))
    }

    return cartWithItems
  }

  /**
   * Add item to cart (or update quantity if already exists)
   */
  async addItemToCart(cartId: string, shopItemId: string, quantity: number): Promise<boolean> {
    try {
      console.log("[ShoppingCart] Adding item to cart:", { cartId, shopItemId, quantity })
      
      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await this.supabase
        .from("shopping_cart_items")
        .select("*")
        .eq("cart_id", cartId)
        .eq("shop_item_id", shopItemId)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[ShoppingCart] Error checking existing item:", checkError)
        return false
      }

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity
        console.log("[ShoppingCart] Item already exists, updating quantity:", {
          existingQuantity: existingItem.quantity,
          adding: quantity,
          newQuantity,
        })
        const { data: updated, error } = await this.supabase
          .from("shopping_cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id)
          .select()

        if (error) {
          console.error("[ShoppingCart] Error updating cart item:", {
            message: error.message,
            code: error.code,
            details: error.details,
          })
          return false
        }
        console.log("[ShoppingCart] Cart item quantity updated:", updated)
        return true
      }

      // Validate that shop_item belongs to the same shop as the cart
      // Get cart to know its shop_id
      const { data: cart, error: cartError } = await this.supabase
        .from("shopping_carts")
        .select("shop_id")
        .eq("id", cartId)
        .single()

      if (cartError || !cart) {
        console.error("[ShoppingCart] Error fetching cart for validation:", cartError)
        return false
      }

      // Get shop_item to verify its shop_id
      const { data: shopItem, error: shopItemError } = await this.supabase
        .from("shop_items")
        .select("id, shop_id, item_name")
        .eq("id", shopItemId)
        .single()

      if (shopItemError || !shopItem) {
        console.error("[ShoppingCart] Shop item not found or error fetching:", {
          shopItemId,
          error: shopItemError,
        })
        return false
      }

      // Validate that shop_item belongs to the same shop as the cart
      if (shopItem.shop_id !== cart.shop_id) {
        console.error("[ShoppingCart] Shop item does not belong to the cart's shop:", {
          shopItemId,
          shopItemShopId: shopItem.shop_id,
          cartShopId: cart.shop_id,
          itemName: shopItem.item_name,
        })
        return false
      }

      // Insert new item
      console.log("[ShoppingCart] Item doesn't exist, inserting new item")
      const { data: inserted, error } = await this.supabase
        .from("shopping_cart_items")
        .insert({
          cart_id: cartId,
          shop_item_id: shopItemId,
          quantity,
        })
        .select()

      if (error) {
        console.error("[ShoppingCart] Error adding item to cart:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return false
      }

      console.log("[ShoppingCart] New cart item inserted:", inserted)
      return true
    } catch (error) {
      console.error("[ShoppingCart] Unexpected error in addItemToCart:", error)
      return false
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(cartItemId: string, quantity: number): Promise<boolean> {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      console.log("[ShoppingCart] Quantity is 0 or less, removing item:", cartItemId)
      return this.removeCartItem(cartItemId)
    }

    try {
      console.log("[ShoppingCart] Updating cart item:", { cartItemId, quantity })
      const { data, error } = await this.supabase
        .from("shopping_cart_items")
        .update({ quantity })
        .eq("id", cartItemId)
        .select()

      if (error) {
        console.error("[ShoppingCart] Error updating cart item:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          cartItemId,
          quantity,
        })
        return false
      }

      console.log("[ShoppingCart] Cart item updated successfully:", data)
      return true
    } catch (error) {
      console.error("[ShoppingCart] Unexpected error in updateCartItem:", error)
      return false
    }
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(cartItemId: string): Promise<boolean> {
    try {
      console.log("[ShoppingCart] Removing cart item:", cartItemId)
      const { data, error } = await this.supabase
        .from("shopping_cart_items")
        .delete()
        .eq("id", cartItemId)
        .select()

      if (error) {
        console.error("[ShoppingCart] Error removing cart item:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          cartItemId,
        })
        return false
      }

      console.log("[ShoppingCart] Cart item removed successfully:", data)
      return true
    } catch (error) {
      console.error("[ShoppingCart] Unexpected error in removeCartItem:", error)
      return false
    }
  }

  /**
   * Calculate total cost of cart in copper pieces
   */
  async calculateCartTotal(cartId: string): Promise<number> {
    const { data: items, error } = await this.supabase
      .from("shopping_cart_items")
      .select(
        `
        quantity,
        shop_items (
          price_in_copper
        )
      `
      )
      .eq("cart_id", cartId)

    if (error || !items) {
      console.error("[ShoppingCart] Error calculating total:", error)
      return 0
    }

    return items.reduce((total, item) => {
      const price = (item.shop_items as any)?.price_in_copper || 0
      return total + price * item.quantity
    }, 0)
  }

  /**
   * Helper function to validate if a character can purchase from a shop
   * This validates permissions (not GM, is player in campaign)
   */
  async canCharacterPurchase(characterId: string, shopId: string, isGm: boolean): Promise<boolean> {
    // 1. If isGm === true, return false immediately (GMs cannot purchase)
    if (isGm) {
      return false
    }

    try {
      // 2. Verify that character_id exists and belongs to the user
      const { data: character } = await this.supabase
        .from("characters")
        .select("id, user_id")
        .eq("id", characterId)
        .maybeSingle()

      if (!character) {
        return false
      }

      // 3. Verify that the shop belongs to a campaign where the character is enrolled as player
      const { data: shopData } = await this.supabase
        .from("shops")
        .select("location_id, locations!inner(campaign_id)")
        .eq("id", shopId)
        .maybeSingle()

      if (!shopData || !shopData.locations) {
        return false
      }

      const campaignId = (shopData.locations as any).campaign_id

      // 4. Verify that the character is enrolled in that campaign as player
      const { data: member } = await this.supabase
        .from("campaign_members")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("character_id", characterId)
        .eq("role", "player")
        .maybeSingle()

      return !!member
    } catch (error) {
      console.error("[ShoppingCart] Error in canCharacterPurchase:", error)
      return false
    }
  }

  /**
   * Validate that character can purchase (is player in campaign, has funds, stock available)
   */
  async validateCheckout(
    characterId: string,
    shopId: string,
    isGm: boolean
  ): Promise<{ valid: boolean; error?: string }> {
    // 1. Check if isGm (GMs cannot purchase)
    if (isGm) {
      return { valid: false, error: "Game Masters cannot purchase items" }
    }

    // 2. Validate character exists and belongs to user
    const { data: character, error: charError } = await this.supabase
      .from("characters")
      .select("id, user_id")
      .eq("id", characterId)
      .maybeSingle()

    if (charError || !character) {
      return { valid: false, error: "Character not found or access denied" }
    }

    // 3. Validate shop exists and get campaign info
    const { data: shopData, error: shopError } = await this.supabase
      .from("shops")
      .select("id, location_id, locations!inner(campaign_id)")
      .eq("id", shopId)
      .maybeSingle()

    if (shopError || !shopData || !shopData.locations) {
      return { valid: false, error: "Shop not found or invalid" }
    }

    const campaignId = (shopData.locations as any).campaign_id

    // 4. Validate character is enrolled in campaign as player
    const { data: member, error: memberError } = await this.supabase
      .from("campaign_members")
      .select("id, role")
      .eq("campaign_id", campaignId)
      .eq("character_id", characterId)
      .eq("role", "player")
      .maybeSingle()

    if (memberError || !member) {
      return { valid: false, error: "Character is not enrolled as player in this campaign" }
    }

    // 5. Get cart with items
    const cart = await this.getCartWithItems(characterId, shopId)
    if (!cart || !cart.items || cart.items.length === 0) {
      return { valid: false, error: "Cart is empty" }
    }

    // 6. Validate stock for all items (re-validate to catch race conditions)
    for (const item of cart.items) {
      if (!item.shop_item) {
        return { valid: false, error: `Item ${item.shop_item_id} not found` }
      }

      // Re-fetch item to get latest stock (prevents race conditions)
      const { data: currentItem, error: itemError } = await this.supabase
        .from("shop_items")
        .select("quantity_available, price_in_copper, item_name")
        .eq("id", item.shop_item_id)
        .maybeSingle()

      if (itemError || !currentItem) {
        return { valid: false, error: `Item ${item.shop_item.item_name} no longer available` }
      }

      // Validate stock
      if (currentItem.quantity_available < item.quantity) {
        return {
          valid: false,
          error: `Insufficient stock for ${currentItem.item_name}. Available: ${currentItem.quantity_available}, Requested: ${item.quantity}`,
        }
      }

      // Validate price hasn't changed significantly (optional but recommended)
      // Allow small differences due to rounding, but flag major changes
      const priceDifference = Math.abs(currentItem.price_in_copper - item.shop_item.price_in_copper)
      const priceChangePercent = (priceDifference / item.shop_item.price_in_copper) * 100
      if (priceChangePercent > 10) {
        // Price changed more than 10%
        return {
          valid: false,
          error: `Price for ${currentItem.item_name} has changed. Please refresh your cart.`,
        }
      }
    }

    // 7. Re-validate funds (re-fetch wallet to catch race conditions)
    const totalCost = await this.calculateCartTotal(cart.id)
    const { data: wallet, error: walletError } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("character_id", characterId)
      .maybeSingle()

    if (walletError || !wallet) {
      return { valid: false, error: "Wallet not found" }
    }

    const totalInCopper =
      wallet.copper +
      wallet.silver * 10 +
      wallet.electrum * 50 +
      wallet.gold * 100 +
      wallet.platinum * 1000

    if (totalInCopper < totalCost) {
      return { valid: false, error: "Insufficient funds" }
    }

    return { valid: true }
  }

  /**
   * Checkout cart - atomic transaction using stored procedure
   * This uses the process_purchase stored procedure which handles everything
   * in a single atomic transaction in the database
   */
  async checkoutCart(characterId: string, shopId: string, isGm: boolean): Promise<CheckoutResult> {
    console.log("[ShoppingCartService] Starting checkout:", { characterId, shopId, isGm })
    
    // 1. Validate checkout (pre-validation in TypeScript)
    const validation = await this.validateCheckout(characterId, shopId, isGm)
    console.log("[ShoppingCartService] Validation result:", { valid: validation.valid, error: validation.error })
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 2. Get cart with items
    const cart = await this.getCartWithItems(characterId, shopId)
    console.log("[ShoppingCartService] Cart retrieved:", { hasCart: !!cart, itemsCount: cart?.items?.length || 0 })
    if (!cart || !cart.items || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" }
    }

    // 3. Prepare cart items for stored procedure
    // Filter out items without shop_item (shouldn't happen after validation, but just in case)
    const validItems = cart.items.filter(item => item.shop_item)
    if (validItems.length === 0) {
      return { success: false, error: "No valid items in cart" }
    }

    // 4. Prepare cart items in JSONB format for stored procedure
    const cartItemsJson = validItems.map(item => ({
      shop_item_id: item.shop_item_id,
      quantity: item.quantity,
    }))

    // 5. Generate purchase description summary
    const purchaseSummary = validItems
      .map(item => {
        if (!item.shop_item) return null
        return `${item.quantity}x ${item.shop_item.item_name}`
      })
      .filter(Boolean)
      .join(", ")
    const purchaseDescription = `Compra en tienda: ${purchaseSummary}`

    console.log("[ShoppingCartService] Calling stored procedure process_purchase:", {
      characterId,
      shopId,
      itemsCount: cartItemsJson.length,
      description: purchaseDescription,
    })

    // 6. Call stored procedure
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

      console.log("[ShoppingCartService] Checkout completed successfully:", {
        purchaseIds: data.purchase_ids?.length || 0,
        movementId: data.movement_id,
        totalCost: data.total_cost,
      })

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
   * Get cart item count (for badge display)
   */
  async getCartItemCount(characterId: string, shopId: string): Promise<number> {
    const cart = await this.getCartWithItems(characterId, shopId)
    if (!cart || !cart.items) return 0

    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }
}
