"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { ShopForm } from "./shop-form"
import { ArrowLeft, Store, Users, Package, Edit, Trash2, Plus } from "lucide-react"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"

interface ShopViewProps {
  campaignId: string
  locationId: string
  shopId: string
}

interface ShopNpcRow {
  id: string
  name: string
  title: string | null
  resistances: string | null
  story: string | null
  shop_id: string
  npc_id: string | null
}

const SHOP_TYPE_OPTIONS = ["inn", "general", "smith", "jewelry", "market", "atelier"] as const
type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

export function ShopView({ campaignId, locationId, shopId }: ShopViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [shop, setShop] = useState<Shop | null>(null)
  const [shopNpcs, setShopNpcs] = useState<ShopNpcRow[]>([])
  const [standaloneNpcs, setStandaloneNpcs] = useState<Npc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [assignedNpcId, setAssignedNpcId] = useState<string>("")

  useEffect(() => {
    if (user && campaignId && locationId && shopId) {
      loadData()
    }
  }, [user, campaignId, locationId, shopId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId || !shopId) return

    setIsLoading(true)
    setError(null)
    try {
      const [campaignData, shopData, npcs] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.shop.getShop(shopId),
        services.npc.getNpcsByCampaign(campaignId),
      ])

      const owner = campaignData.game_master_id === user.id
      setIsOwner(owner)
      setShop(shopData)
      setStandaloneNpcs(npcs)

      // Cargar shop_npcs
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()
      const { data: shopNpcData } = await supabase
        .from("shop_npcs")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })

      if (shopNpcData) {
        setShopNpcs(shopNpcData as ShopNpcRow[])
        // Buscar el npc_id asignado
        const assignedNpc = shopNpcData.find((sn) => sn.npc_id) as ShopNpcRow | undefined
        if (assignedNpc?.npc_id) {
          setAssignedNpcId(assignedNpc.npc_id)
        }
      }
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    loadData()
  }

  const handleSubmit = async (formData: {
    name: string
    description: string
    shop_type: string
    shopkeeper_name: string
    selectedNpcId: string
  }) => {
    if (!user || !shop) return

    setIsSaving(true)
    setError(null)
    try {
      const updated = await services.shop.updateShop(shopId, {
        name: formData.name.trim(),
        description: formData.description || null,
        shopkeeper_name: formData.shopkeeper_name || null,
        shop_type: formData.shop_type,
      })
      setShop(updated)

      // Manejar relación con NPC
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()

      // Eliminar relaciones existentes
      await supabase.from("shop_npcs").delete().eq("shop_id", shopId)

      // Si hay un NPC seleccionado, crear la relación
      if (formData.selectedNpcId && formData.selectedNpcId !== "none") {
        await supabase.from("shop_npcs").insert({
          shop_id: shopId,
          npc_id: formData.selectedNpcId,
        })
        setAssignedNpcId(formData.selectedNpcId)
      } else {
        setAssignedNpcId("")
      }

      setIsEditing(false)
      loadData()
    } catch (err: any) {
      console.error("Error updating shop:", err)
      setError(err?.message || "Error al actualizar la tienda")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !shop) return

    const confirmMessage = `¿Eliminar "${shop.name}"? Esta acción eliminará todos los items, NPCs y carritos asociados. Esta acción no se puede deshacer.`

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    setError(null)
    try {
      await services.shop.deleteShop(shopId)
      router.push(`/campaigns/${campaignId}/locations/${locationId}`)
    } catch (err: any) {
      console.error("Error deleting shop:", err)
      setError(err?.message || "Error al eliminar la tienda")
      setIsDeleting(false)
    }
  }

  const getShopTypeLabel = (type: string) => {
    return t.marketplace?.shopTypes?.[type as ShopType] || type
  }

  if (isLoading) {
    return <LoadingState message="Cargando tienda..." />
  }

  if (!shop) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)}
          className="text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ubicación
        </Button>
        <EmptyState title="Tienda no encontrada" description="La tienda solicitada no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Ubicación
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Editar Tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShopForm
              initialData={shop}
              standaloneNpcs={standaloneNpcs}
              selectedNpcId={assignedNpcId}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              onCreateNpc={() => router.push(`/campaigns/${campaignId}/npcs/new?returnTo=shop&locationId=${locationId}&shopId=${shopId}`)}
              isLoading={isSaving}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Store className="w-6 h-6" />
                    {shop.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {shop.description || "Sin descripción"}
                  </CardDescription>
                  {shop.shop_type && (
                    <Badge className="mt-2" variant="secondary">
                      {getShopTypeLabel(shop.shop_type)}
                    </Badge>
                  )}
                  {shop.shopkeeper_name && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t.marketplace?.shopkeeper || "Tendero"}: {shop.shopkeeper_name}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="npcs" className="w-full">
            <TabsList>
              <TabsTrigger value="npcs">
                <Users className="w-4 h-4 mr-2" />
                NPCs ({shopNpcs.length})
              </TabsTrigger>
              <TabsTrigger value="items">
                <Package className="w-4 h-4 mr-2" />
                Items
              </TabsTrigger>
            </TabsList>
            <TabsContent value="npcs" className="space-y-4">
              {isOwner && (
                <Button
                  onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}/npcs/new`)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear NPC de Tienda
                </Button>
              )}
              {shopNpcs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No hay NPCs en esta tienda</p>
                    {isOwner && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}/npcs/new`)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer NPC
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shopNpcs.map((npc) => (
                    <Card
                      key={npc.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}/npcs/${npc.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>{npc.name}</CardTitle>
                        {npc.title && <CardDescription>{npc.title}</CardDescription>}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="items" className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/shop-items/${shopId}?role=${isOwner ? "game_master" : "player"}`)}
              >
                <Package className="w-4 h-4 mr-2" />
                {isOwner ? (t.marketplace?.manageItems || "Gestionar Items") : (t.marketplace?.viewItems || "Ver Items")}
              </Button>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

