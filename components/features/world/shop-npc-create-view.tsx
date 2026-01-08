"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { NpcForm } from "./npc-form"
import { ArrowLeft, Users } from "lucide-react"

interface ShopNpcCreateViewProps {
  campaignId: string
  locationId: string
  shopId: string
}

export function ShopNpcCreateView({ campaignId, locationId, shopId }: ShopNpcCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [shop, setShop] = useState<any>(null)

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
      const [campaign, shopData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.shop.getShop(shopId),
      ])

      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)
      setShop(shopData)
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: { name: string; title: string; resistances: string; story: string }) => {
    if (!user) {
      setError("Debes estar autenticado para crear NPCs")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      // Crear el NPC directamente en shop_npcs (no en npcs)
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()
      const { data, error: insertError } = await supabase
        .from("shop_npcs")
        .insert({
          name: formData.name.trim(),
          title: formData.title || null,
          resistances: formData.resistances || null,
          story: formData.story || null,
          shop_id: shopId,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
    } catch (err: any) {
      console.error("Error creating shop NPC:", err)
      setError(err?.message || "Error al crear el NPC de tienda")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
  }

  if (isLoading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Tienda
        </Button>
        <EmptyState title="Acceso Denegado" description="Solo el dueño de la campaña puede crear NPCs de tienda" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Tienda
        </Button>
        <EmptyState title="Tienda no encontrada" description="La tienda solicitada no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Tienda
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t.marketplace?.addNpc || "Crear NPC de Tienda"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.npcSubtitle || "Describe quién gestiona la tienda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NpcForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  )
}

