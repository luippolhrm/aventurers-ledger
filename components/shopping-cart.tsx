"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useShoppingCart } from "@/hooks/use-shopping-cart"
import { CartItem } from "@/components/cart-item"
import { useLanguage } from "@/lib/language-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatPriceInGold } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useServices } from "@/hooks/use-services"

interface ShoppingCartProps {
  shopId: string
  characterId: string
  isGm: boolean
}

export function ShoppingCartComponent({ shopId, characterId, isGm }: ShoppingCartProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const services = useServices()
  const { cart, loading, error, itemCount, totalPrice, updateItem, removeItem, checkout, canCheckout } = useShoppingCart(shopId, characterId)
  type DialogType = 'checkout' | 'success' | null
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [purchasedItems, setPurchasedItems] = useState<Array<{
    name: string
    quantity: number
    price: number
  }>>([])
  const [purchaseTotal, setPurchaseTotal] = useState(0)
  const [currentWalletBalance, setCurrentWalletBalance] = useState<{
    totalInCopper: number
    wallet: { platinum: number; gold: number; electrum: number; silver: number; copper: number }
  } | null>(null)

  // Log cuando el carrito cambia o cuando itemCount cambia
  useEffect(() => {
    console.log("[ShoppingCartComponent] State updated:", {
      itemCount,
      hasCart: !!cart,
      itemsCount: cart?.items?.length || 0,
      validItemsCount: cart?.items?.filter(item => item.shop_item).length || 0,
      items: cart?.items?.map(item => ({
        id: item.id,
        hasShopItem: !!item.shop_item,
        item_name: item.shop_item?.item_name,
      })) || [],
    })
  }, [cart, itemCount])

  // Función para cargar el balance actual del wallet
  const loadCurrentWalletBalance = useCallback(async () => {
    const charId = activeCharacterId || characterId
    if (!charId) {
      setCurrentWalletBalance(null)
      return
    }

    try {
      const wallet = await services.wallet.getWallet(charId)
      const totalInCopper = await services.wallet.calculateTotalInCopper(charId)

      setCurrentWalletBalance({
        totalInCopper,
        wallet: {
          platinum: wallet.platinum,
          gold: wallet.gold,
          electrum: wallet.electrum,
          silver: wallet.silver,
          copper: wallet.copper,
        },
      })
    } catch (error) {
      console.error("[ShoppingCartComponent] Error loading wallet balance:", error)
      setCurrentWalletBalance(null)
    }
  }, [activeCharacterId, characterId, services])

  // Cargar balance cuando el componente se monta o cuando cambia el personaje
  useEffect(() => {
    loadCurrentWalletBalance()
  }, [loadCurrentWalletBalance])

  // También recargar cuando el carrito cambia (por si se hizo una compra)
  useEffect(() => {
    loadCurrentWalletBalance()
  }, [itemCount, loadCurrentWalletBalance]) // Recargar cuando cambia el carrito

  // Don't render if GM
  if (isGm) {
    return null
  }

  const handleOpenCheckoutDialog = async () => {
    console.log("[ShoppingCartComponent] handleOpenCheckoutDialog called")
    
    // Validación previa: si tenemos el balance y no es suficiente, no proceder
    if (currentWalletBalance && currentWalletBalance.totalInCopper < totalPrice) {
      console.warn("[ShoppingCartComponent] Insufficient funds detected, blocking checkout")
      toast({
        title: t.marketplace?.insufficientFunds || "Fondos Insuficientes",
        description: t.marketplace?.insufficientFundsDescription || 
          "No tienes suficiente dinero para completar esta compra.",
        variant: "destructive",
      })
      return
    }
    
    try {
      console.log("[ShoppingCartComponent] Calling canCheckout...")
      const validation = await canCheckout(isGm)
      console.log("[ShoppingCartComponent] canCheckout result:", validation)
      
      if (validation.canCheckout) {
        console.log("[ShoppingCartComponent] Validation passed, opening checkout dialog")
        setActiveDialog('checkout')
      } else {
        console.error("[ShoppingCartComponent] Validation failed:", validation.error)
        
        // Mostrar toast para todos los errores (incluyendo fondos insuficientes del servidor)
        let errorTitle = "Cannot Checkout"
        let errorDescription = validation.error || "Unable to proceed with checkout"
        
        if (validation.error?.includes("Insufficient funds") || validation.error?.toLowerCase().includes("insufficient funds")) {
          errorTitle = t.marketplace?.insufficientFunds || "Fondos Insuficientes"
          errorDescription = t.marketplace?.insufficientFundsDescription || 
            "No tienes suficiente dinero para completar esta compra."
        } else if (validation.error?.includes("Insufficient stock")) {
          errorTitle = "Stock Unavailable"
          errorDescription = validation.error
        } else if (validation.error?.includes("Price")) {
          errorTitle = "Price Changed"
          errorDescription = validation.error + " Please refresh your cart and try again."
        } else if (validation.error?.includes("not enrolled")) {
          errorTitle = "Access Denied"
          errorDescription = "Your character is no longer enrolled in this campaign."
        } else if (validation.error?.includes("Character not found")) {
          errorTitle = "Character Not Found"
          errorDescription = "The selected character no longer exists or you don't have access to it."
        } else if (validation.error?.includes("Shop not found")) {
          errorTitle = "Shop Not Found"
          errorDescription = "This shop no longer exists or is not available."
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[ShoppingCartComponent] Error in handleOpenCheckoutDialog:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCheckout = async () => {
    // Capturar información del carrito ANTES del checkout
    const itemsToPurchase = cart?.items
      .filter(item => item.shop_item)
      .map(item => ({
        name: item.shop_item!.item_name,
        quantity: item.quantity,
        price: item.shop_item!.price_in_copper * item.quantity,
      })) || []
    
    const currentTotal = totalPrice
    
    console.log("[ShoppingCartComponent] Starting checkout:", {
      itemsToPurchase,
      currentTotal,
      itemsCount: itemsToPurchase.length,
      hasCart: !!cart,
    })
    
    setIsProcessingCheckout(true)
    try {
      const result = await checkout(isGm)
      console.log("[ShoppingCartComponent] Checkout result:", {
        success: result.success,
        error: result.error,
        purchaseIds: result.purchaseIds,
      })

      if (result.success) {
        console.log("[ShoppingCartComponent] Checkout successful, preparing success dialog")
        // Guardar información para el diálogo de éxito
        setPurchasedItems(itemsToPurchase)
        setPurchaseTotal(currentTotal)
        // Cerrar diálogo de confirmación y abrir diálogo de éxito
        setActiveDialog(null)
        // Pequeño delay para asegurar que el estado se actualice correctamente
        setTimeout(() => {
          console.log("[ShoppingCartComponent] Opening success dialog")
          setActiveDialog('success')
        }, 150)
      } else {
        console.error("[ShoppingCartComponent] Checkout failed:", result.error)
        // El error ya se muestra en el toast desde el hook
        // No cerramos el diálogo de confirmación para que el usuario vea el error
      }
    } catch (error) {
      console.error("[ShoppingCartComponent] Checkout exception:", error)
      // Manejar errores inesperados
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  // Simplificar: usar itemCount como fuente de verdad principal
  // Si itemCount > 0, hay items (aunque los shop_item aún no se hayan cargado)
  const hasItems = itemCount > 0
  const validItems = cart?.items?.filter(item => item.shop_item) || []

  // Calcular la diferencia entre balance y total
  const balanceDifference = currentWalletBalance 
    ? currentWalletBalance.totalInCopper - totalPrice 
    : null
  
  const hasInsufficientFunds = balanceDifference !== null && balanceDifference < 0
  const missingAmount = hasInsufficientFunds ? Math.abs(balanceDifference) : 0

  // Mostrar loading si está cargando y no hay cart
  if (loading && !cart) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Si hay items según el contador pero no hay cart o items cargados, mostrar loading
  if (hasItems && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Si hay items pero aún no se han cargado los shop_item, mostrar loading
  if (hasItems && cart?.items && cart.items.length > 0 && validItems.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Solo mostrar "vacío" si realmente no hay items
  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            {t.marketplace?.cart || "Shopping Cart"}
          </CardTitle>
          <CardDescription>{t.marketplace?.cartEmpty || "Your cart is empty"}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            {t.marketplace?.cart || "Shopping Cart"}
          </CardTitle>
          <CardDescription>
            {itemCount} {itemCount === 1 ? (t.marketplace?.item || "item") : (t.marketplace?.items || "items")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {validItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            {/* Resumen de billetera */}
            {currentWalletBalance && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {t.marketplace?.availableBalance || "Balance Disponible"}:
                  </span>
                  <span className="font-semibold">{formatPriceInGold(currentWalletBalance.totalInCopper)}</span>
                </div>
                
                {/* Indicador visual si no hay fondos suficientes */}
                {hasInsufficientFunds && (
                  <Alert variant="destructive" className="mt-2 py-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      {t.marketplace?.insufficientFundsWarning?.replace('{amount}', formatPriceInGold(missingAmount)) || 
                        `Faltan ${formatPriceInGold(missingAmount)} para completar esta compra.`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>{t.marketplace?.total || "Total"}:</span>
              <span>{formatPriceInGold(totalPrice)}</span>
            </div>
            <Button
              onClick={() => {
                console.log("[ShoppingCartComponent] Button clicked, loading:", loading, "isProcessingCheckout:", isProcessingCheckout)
                handleOpenCheckoutDialog()
              }}
              className="w-full"
              size="lg"
              disabled={loading || isProcessingCheckout || hasInsufficientFunds}
            >
              {loading || isProcessingCheckout ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.marketplace?.processing || "Processing..."}
                </>
              ) : (
                t.marketplace?.checkout || "Checkout"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de checkout */}
      {activeDialog === 'checkout' && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.marketplace?.confirmCheckout || "Confirm Checkout"}</DialogTitle>
              <DialogDescription>
                {t.marketplace?.checkoutConfirmation || "Are you sure you want to purchase these items?"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.marketplace?.items || "Items"}:</span>
                  <span className="font-medium">{itemCount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>{t.marketplace?.total || "Total"}:</span>
                  <span>{formatPriceInGold(totalPrice)}</span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  {t.marketplace?.checkoutWarning ||
                    "This will deduct money from your wallet and add items to your inventory."}
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveDialog(null)} disabled={isProcessingCheckout}>
                {t.marketplace?.cancel || "Cancel"}
              </Button>
              <Button onClick={handleCheckout} disabled={isProcessingCheckout}>
                {isProcessingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.marketplace?.processing || "Processing..."}
                  </>
                ) : (
                  t.marketplace?.confirmPurchase || "Confirm Purchase"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de éxito */}
      {activeDialog === 'success' && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                {t.marketplace?.purchaseSuccessful || "Purchase Successful"}
              </DialogTitle>
              <DialogDescription>
                {t.marketplace?.itemsAddedToInventory || "Items have been added to your inventory"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Resumen de items comprados */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">{t.marketplace?.purchaseSummary || "Purchase Summary"}</h3>
                <div className="space-y-2">
                  {purchasedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatPriceInGold(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>{t.marketplace?.totalDeducted || "Total Deducted"}:</span>
                  <span>{formatPriceInGold(purchaseTotal)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveDialog(null)}
                className="w-full sm:w-auto"
              >
                {t.marketplace?.continueShopping || "Continue Shopping"}
              </Button>
              <Button
                onClick={() => {
                  router.push("/dashboard?module=inventory")
                }}
                className="w-full sm:w-auto"
              >
                {t.marketplace?.viewInventory || "View Inventory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
