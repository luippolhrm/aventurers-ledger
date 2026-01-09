"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ShoppingCartService, type CartWithItems, type CheckoutResult } from "@/lib/services/shopping-cart-service"
import { useToast } from "@/hooks/use-toast"

interface UseShoppingCartReturn {
  cart: CartWithItems | null
  loading: boolean
  error: string | null
  itemCount: number
  totalPrice: number
  addItem: (shopItemId: string, quantity: number) => Promise<boolean>
  updateItem: (cartItemId: string, quantity: number) => Promise<boolean>
  removeItem: (cartItemId: string) => Promise<boolean>
  checkout: (isGm: boolean) => Promise<CheckoutResult>
  refreshCart: () => Promise<void>
  canCheckout: (isGm: boolean) => Promise<{ canCheckout: boolean; error?: string }>
}

export function useShoppingCart(shopId: string | null, characterId: string | null): UseShoppingCartReturn {
  const { toast } = useToast()
  const [cart, setCart] = useState<CartWithItems | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Referencia para rastrear si el componente está montado
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const service = new ShoppingCartService()

  const loadCart = useCallback(async () => {
    // Verificar montaje antes de actualizar estado
    if (!isMountedRef.current) return
    
    if (!characterId || !shopId) {
      if (isMountedRef.current) {
        setCart(null)
        setItemCount(0)
        setTotalPrice(0)
      }
      return
    }

    if (isMountedRef.current) {
      setLoading(true)
      setError(null)
    }

    try {
      const cartData = await service.getCartWithItems(characterId, shopId)
      console.log("[useShoppingCart] Cart data loaded:", {
        hasCart: !!cartData,
        itemsCount: cartData?.items?.length || 0,
        items: cartData?.items?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          hasShopItem: !!item.shop_item,
          shopItemName: item.shop_item?.item_name,
        })) || [],
      })

      // Calcular itemCount y totalPrice basándose en el cartData
      let calculatedCount = 0
      let calculatedTotal = 0
      
      if (cartData && cartData.items && cartData.items.length > 0) {
        // Solo contar items que tienen shop_item válido
        // Contar artículos DISTINTOS, no la suma de cantidades
        const validItems = cartData.items.filter(item => item.shop_item)
        calculatedCount = validItems.length // Número de artículos distintos
        calculatedTotal = await service.calculateCartTotal(cartData.id)
        
        console.log("[useShoppingCart] Calculating item count:", {
          totalItems: cartData.items.length,
          validItems: validItems.length,
          itemsWithoutShopItem: cartData.items.length - validItems.length,
          calculatedCount, // Número de artículos distintos
          totalQuantity: validItems.reduce((sum, item) => sum + item.quantity, 0), // Suma de cantidades (solo para log)
          items: cartData.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            hasShopItem: !!item.shop_item,
            shopItemName: item.shop_item?.item_name,
          })),
        })
      } else {
        console.log("[useShoppingCart] Cart is empty or has no items, setting count to 0")
      }
      
      // Solo actualizar estado si está montado
      if (isMountedRef.current) {
        setCart(cartData)
        setItemCount(calculatedCount)
        setTotalPrice(calculatedTotal)
        
        console.log("[useShoppingCart] State updated:", {
          hasCart: !!cartData,
          itemCount: calculatedCount,
          totalPrice: calculatedTotal,
          itemsInCart: cartData?.items?.length || 0,
        })
      }
    } catch (err: any) {
      console.error("[useShoppingCart] Error loading cart:", err)
      if (isMountedRef.current) {
        setError(err.message || "Failed to load cart")
        setCart(null)
        setItemCount(0)
        setTotalPrice(0)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [characterId, shopId])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Escuchar cambios en el carrito desde otras instancias del hook
  useEffect(() => {
    const handleCartChange = () => {
      // Solo actualizar si el componente está montado
      if (isMountedRef.current) {
        console.log("[useShoppingCart] Cart changed event received, reloading...")
        loadCart()
      }
    }
    
    window.addEventListener('cart-changed', handleCartChange)
    return () => {
      window.removeEventListener('cart-changed', handleCartChange)
    }
  }, [loadCart])

  const addItem = useCallback(
    async (shopItemId: string, quantity: number): Promise<boolean> => {
      if (!characterId || !shopId) {
        toast({
          title: "Error",
          description: "Character or shop not selected",
          variant: "destructive",
        })
        return false
      }

      setError(null)

      try {
        const cartData = await service.getOrCreateCart(characterId, shopId)
        if (!cartData) {
          toast({
            title: "Error",
            description: "Failed to create cart",
            variant: "destructive",
          })
          return false
        }

        const success = await service.addItemToCart(cartData.id, shopItemId, quantity)
        if (success) {
          // Pequeño delay para asegurar que la BD se actualice
          await new Promise(resolve => setTimeout(resolve, 100))
          // Recargar el carrito
          await loadCart()
          // Notificar a otras instancias del hook para que se sincronicen
          window.dispatchEvent(new CustomEvent('cart-changed'))
          toast({
            title: "Success",
            description: "Item added to cart",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to add item to cart",
            variant: "destructive",
          })
        }
        return success
      } catch (err: any) {
        console.error("[useShoppingCart] Error adding item:", err)
        setError(err.message || "Failed to add item")
        toast({
          title: "Error",
          description: err.message || "Failed to add item to cart",
          variant: "destructive",
        })
        return false
      }
    },
    [characterId, shopId, loadCart, toast]
  )

  const updateItem = useCallback(
    async (cartItemId: string, quantity: number): Promise<boolean> => {
      setError(null)
      console.log("[useShoppingCart] Updating item:", { cartItemId, quantity })

      try {
        const success = await service.updateCartItem(cartItemId, quantity)
        if (success) {
          // Recargar inmediatamente
          await loadCart()
          // Notificar a otras instancias del hook para que se sincronicen
          window.dispatchEvent(new CustomEvent('cart-changed'))
        } else {
          console.error("[useShoppingCart] Update failed")
          toast({
            title: "Error",
            description: "Failed to update item",
            variant: "destructive",
          })
        }
        return success
      } catch (err: any) {
        console.error("[useShoppingCart] Error updating item:", err)
        setError(err.message || "Failed to update item")
        toast({
          title: "Error",
          description: err.message || "Failed to update item",
          variant: "destructive",
        })
        return false
      }
    },
    [loadCart, toast]
  )

  const removeItem = useCallback(
    async (cartItemId: string): Promise<boolean> => {
      setError(null)
      console.log("[useShoppingCart] Removing item:", cartItemId)

      try {
        const success = await service.removeCartItem(cartItemId)
        if (success) {
          // Recargar inmediatamente
          await loadCart()
          // Notificar a otras instancias del hook para que se sincronicen
          window.dispatchEvent(new CustomEvent('cart-changed'))
          toast({
            title: "Success",
            description: "Item removed from cart",
          })
        } else {
          console.error("[useShoppingCart] Remove failed")
          toast({
            title: "Error",
            description: "Failed to remove item",
            variant: "destructive",
          })
        }
        return success
      } catch (err: any) {
        console.error("[useShoppingCart] Error removing item:", err)
        setError(err.message || "Failed to remove item")
        toast({
          title: "Error",
          description: err.message || "Failed to remove item",
          variant: "destructive",
        })
        return false
      }
    },
    [loadCart, toast]
  )

  const checkout = useCallback(
    async (isGm: boolean): Promise<CheckoutResult> => {
      console.log("[useShoppingCart] Checkout called:", {
        characterId,
        shopId,
        isGm,
      })
      
      if (!characterId || !shopId) {
        console.warn("[useShoppingCart] Missing character or shop ID")
        return { success: false, error: "Character or shop not selected" }
      }

      setError(null)
      setLoading(true)

      try {
        console.log("[useShoppingCart] Calling service.checkoutCart...")
        const result = await service.checkoutCart(characterId, shopId, isGm)
        console.log("[useShoppingCart] Service checkout result:", {
          success: result.success,
          error: result.error,
          purchaseIds: result.purchaseIds?.length || 0,
        })

        if (result.success) {
          console.log("[useShoppingCart] Checkout successful, reloading cart...")
          await loadCart()
          toast({
            title: "Success",
            description: "Purchase completed successfully",
          })
        } else {
          console.error("[useShoppingCart] Checkout failed:", result.error)
          toast({
            title: "Checkout Failed",
            description: result.error || "Failed to complete purchase",
            variant: "destructive",
          })
        }

        return result
      } catch (err: any) {
        console.error("[useShoppingCart] Error during checkout:", err)
        const errorMsg = err.message || "Failed to complete checkout"
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        return { success: false, error: errorMsg }
      } finally {
        setLoading(false)
      }
    },
    [characterId, shopId, loadCart, toast]
  )

  const canCheckout = useCallback(
    async (isGm: boolean): Promise<{ canCheckout: boolean; error?: string }> => {
      if (!characterId || !shopId) {
        return { canCheckout: false, error: "Character or shop not selected" }
      }

      try {
        const validation = await service.validateCheckout(characterId, shopId, isGm)
        return {
          canCheckout: validation.valid,
          error: validation.error,
        }
      } catch (err: any) {
        console.error("[useShoppingCart] Error validating checkout:", err)
        return {
          canCheckout: false,
          error: err.message || "Failed to validate checkout",
        }
      }
    },
    [characterId, shopId]
  )

  return {
    cart,
    loading,
    error,
    itemCount,
    totalPrice,
    addItem,
    updateItem,
    removeItem,
    checkout,
    refreshCart: loadCart,
    canCheckout,
  }
}
