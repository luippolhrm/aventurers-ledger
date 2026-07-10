"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ShoppingCartService,
  type CartWithItems,
  type CheckoutResult,
} from "@/lib/application/services/shopping-cart-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

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
  const { user } = useAuth()
  const [cart, setCart] = useState<CartWithItems | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const service = new ShoppingCartService()

  const loadCart = useCallback(async () => {
    if (!isMountedRef.current) return

    if (!user?.id || !characterId || !shopId) {
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
      const cartData = await service.getCartWithItems(user.id, characterId, shopId)

      let calculatedCount = 0
      let calculatedTotal = 0

      if (cartData && cartData.items && cartData.items.length > 0) {
        const validItems = cartData.items.filter((item) => item.shop_item)
        calculatedCount = validItems.length
        calculatedTotal = await service.calculateCartTotal(user.id, characterId, shopId)
      }

      if (isMountedRef.current) {
        setCart(cartData)
        setItemCount(calculatedCount)
        setTotalPrice(calculatedTotal)
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
  }, [user?.id, characterId, shopId])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  useEffect(() => {
    const handleCartChange = () => {
      if (isMountedRef.current) {
        loadCart()
      }
    }

    window.addEventListener("cart-changed", handleCartChange)
    return () => {
      window.removeEventListener("cart-changed", handleCartChange)
    }
  }, [loadCart])

  const addItem = useCallback(
    async (shopItemId: string, quantity: number): Promise<boolean> => {
      if (!user?.id || !characterId || !shopId) {
        toast({
          title: "Error",
          description: "You must be signed in with a character and shop selected",
          variant: "destructive",
        })
        return false
      }

      setError(null)

      try {
        const success = await service.addItemToCart(user.id, characterId, shopId, shopItemId, quantity)
        if (success) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          await loadCart()
          window.dispatchEvent(new CustomEvent("cart-changed"))
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
    [user?.id, characterId, shopId, loadCart, toast]
  )

  const updateItem = useCallback(
    async (cartItemId: string, quantity: number): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in",
          variant: "destructive",
        })
        return false
      }

      setError(null)

      try {
        const success = await service.updateCartItem(user.id, cartItemId, quantity)
        if (success) {
          await loadCart()
          window.dispatchEvent(new CustomEvent("cart-changed"))
        } else {
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
    [user?.id, loadCart, toast]
  )

  const removeItem = useCallback(
    async (cartItemId: string): Promise<boolean> => {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in",
          variant: "destructive",
        })
        return false
      }

      setError(null)

      try {
        const success = await service.removeCartItem(user.id, cartItemId)
        if (success) {
          await loadCart()
          window.dispatchEvent(new CustomEvent("cart-changed"))
          toast({
            title: "Success",
            description: "Item removed from cart",
          })
        } else {
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
    [user?.id, loadCart, toast]
  )

  const checkout = useCallback(
    async (isGm: boolean): Promise<CheckoutResult> => {
      if (!user?.id || !characterId || !shopId) {
        return { success: false, error: "Character or shop not selected" }
      }

      setError(null)
      setLoading(true)

      try {
        const result = await service.checkoutCart(user.id, characterId, shopId, isGm)

        if (result.success) {
          await loadCart()
          toast({
            title: "Success",
            description: "Purchase completed successfully",
          })
        } else {
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
    [user?.id, characterId, shopId, loadCart, toast]
  )

  const canCheckout = useCallback(
    async (isGm: boolean): Promise<{ canCheckout: boolean; error?: string }> => {
      if (!user?.id || !characterId || !shopId) {
        return { canCheckout: false, error: "Character or shop not selected" }
      }

      try {
        const validation = await service.validateCheckout(user.id, characterId, shopId, isGm)
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
    [user?.id, characterId, shopId]
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
