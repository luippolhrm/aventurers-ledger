"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useServices } from "@/hooks/use-services"
import { ShopItemsManager } from "@/components/features/world/shop-items-manager"
import { ShopCatalog } from "@/components/shop-catalog"
import { ShoppingCartComponent } from "@/components/shopping-cart"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { ArrowLeft, Package } from "lucide-react"

interface ShopData {
  id: string
  name: string
  location_id: string
  locations: {
    id: string
    name: string
    campaign_id: string
    campaigns: {
      id: string
      name: string
      game_master_id: string
    }
  }
}

export default function ShopItemsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const services = useServices()
  const supabase = createBrowserClient()
  
  // Unwrap params Promise using React.use()
  const { shopId } = use(params)

  const [shop, setShop] = useState<ShopData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGm, setIsGm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characterId, setCharacterId] = useState<string | null>(null)

  useEffect(() => {
    loadShopData()
  }, [shopId, user])

  const loadShopData = async () => {
    if (!user) {
      setError("Debes iniciar sesión para gestionar items de tienda")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch shop with nested location and campaign data
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select(
          `
          id,
          name,
          location_id,
          locations!inner (
            id,
            name,
            campaign_id,
            campaigns!inner (
              id,
              name,
              game_master_id
            )
          )
        `
        )
        .eq("id", shopId)
        .single()

      if (shopError) throw shopError

      if (!shopData) {
        throw new Error("Tienda no encontrada")
      }

      setShop(shopData as ShopData)

      // Check if user is the GM
      const campaign = shopData.locations.campaigns
      const userIsGm = campaign.game_master_id === user.id
      
      // Leer el query parameter de rol si está presente
      // Usar window.location.search para evitar problemas con useSearchParams hook
      const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
      const roleParam = urlParams.get("role")
      
      // Determinar permisos de edición basándose en el query parameter y el rol real del usuario
      // El acceso se valida por separado (más abajo)
      let finalIsGm = userIsGm
      if (roleParam) {
        if (roleParam === "player") {
          // Cualquier usuario (GM o player) puede ver como player (solo lectura)
          // Esto permite que los GMs vean la tienda desde la perspectiva de un jugador
          finalIsGm = false
        } else if (roleParam === "game_master") {
          // Solo permitir modo GM si realmente es GM
          // Si un player intenta usar ?role=game_master, se mantiene como false
          finalIsGm = userIsGm
        }
        // Si el query parameter tiene un valor inválido, se ignora y se usa el rol por defecto
      }
      
      setIsGm(finalIsGm)

      // Validar acceso: si es GM, siempre tiene acceso
      // Si no es GM, verificar que sea miembro de la campaña y obtener su personaje
      if (!userIsGm) {
        const { data: memberData, error: memberError } = await supabase
          .from("campaign_members")
          .select("role")
          .eq("campaign_id", campaign.id)
          .eq("user_id", user.id)
          .maybeSingle()

        if (memberError || !memberData) {
          throw new Error("No tienes permiso para acceder a esta tienda")
        }

        // Obtener el personaje del jugador en esta campaña
        try {
          const playerCharacter = await services.campaign.getPlayerCharacterInCampaign(campaign.id, user.id)
          if (playerCharacter) {
            setCharacterId(playerCharacter.id)
          } else {
            setCharacterId(null)
          }
        } catch (err) {
          console.error("Error loading player character:", err)
          setCharacterId(null)
        }
      } else {
        // Si es GM, no necesita characterId para la vista de administración
        setCharacterId(null)
      }
    } catch (err) {
      console.error("Error loading shop data:", err)
      setError(err instanceof Error ? err.message : "Error al cargar la tienda")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (shop) {
      // Navegar de vuelta a la vista de la tienda
      router.push(`/campaigns/${shop.locations.campaign_id}/locations/${shop.locations.id}/shops/${shopId}`)
    } else {
      // Si no hay datos de tienda, intentar volver al dashboard
      router.push("/dashboard")
    }
  }

  if (isLoading) {
    return <LoadingState message={t.marketplace?.loadingShop || "Cargando tienda..."} />
  }

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleBack} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.marketplace?.backToShop || "Volver"}
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <EmptyState
          icon={Package}
          title={t.marketplace?.errorLoadingShop || "Error al cargar la tienda"}
          description={error}
          action={{
            label: t.marketplace?.backToShop || "Volver",
            onClick: handleBack,
          }}
        />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleBack} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.marketplace?.backToShop || "Volver"}
        </Button>
        <EmptyState
          icon={Package}
          title={t.marketplace?.shopNotFound || "Tienda no encontrada"}
          description={t.marketplace?.shopNotFoundDescription || "La tienda solicitada no existe"}
          action={{
            label: t.marketplace?.backToShop || "Volver",
            onClick: handleBack,
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      {/* Botón Volver */}
      <Button variant="ghost" onClick={handleBack} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.marketplace?.backToShop || "Volver a Tienda"}
      </Button>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push(`/campaigns/${shop.locations.campaign_id}`)}
          className="hover:text-foreground transition-colors"
        >
          {shop.locations.campaigns.name}
        </button>
        <span>›</span>
        <button
          onClick={() => router.push(`/campaigns/${shop.locations.campaign_id}/locations/${shop.locations.id}`)}
          className="hover:text-foreground transition-colors"
        >
          {shop.locations.name}
        </button>
        <span>›</span>
        <span className="text-foreground font-medium">{shop.name}</span>
      </div>

      {isGm ? (
        /* GM View: Shop Items Manager */
      <ShopItemsManager shopId={shopId} shopName={shop.name} isGm={isGm} />
      ) : (
        /* Player View: Shop Catalog + Shopping Cart */
        characterId ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ShopCatalog shopId={shopId} characterId={characterId} isGm={isGm} />
            </div>
            <div className="lg:col-span-1">
              <ShoppingCartComponent
                shopId={shopId}
                characterId={characterId}
                isGm={isGm}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title={t.marketplace?.noCharacterAssigned || "No hay personaje asignado"}
            description={t.marketplace?.noCharacterDescription || "No tienes un personaje asignado a esta campaña. Por favor, contacta al Game Master."}
            action={{
              label: t.marketplace?.backToShop || "Volver",
              onClick: handleBack,
            }}
          />
        )
      )}
    </div>
  )
}
