"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

interface NpcCreateViewProps {
  campaignId: string
}

export function NpcCreateView({ campaignId }: NpcCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const services = useServices()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, campaignId])

  const loadCampaignData = async () => {
    if (!user || !campaignId) return

    setIsLoading(true)
    setError(null)
    try {
      const campaign = await services.campaign.getCampaign(campaignId)
      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)
    } catch (err: any) {
      console.error("Error loading campaign:", err)
      setError(err?.message || "Error al cargar la campaña")
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
      const newNpc = await services.npc.createNpc(
        {
          name: formData.name.trim(),
          title: formData.title || null,
          resistances: formData.resistances || null,
          story: formData.story || null,
          campaign_id: campaignId,
        },
        user.id
      )

      // Verificar si hay parámetros de retorno
      const returnTo = searchParams.get("returnTo")
      const locationId = searchParams.get("locationId")
      const shopId = searchParams.get("shopId")

      if (returnTo === "shop" && locationId && shopId) {
        router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
      } else {
        router.push(`/campaigns/${campaignId}/npcs/${newNpc.id}`)
      }
    } catch (err: any) {
      console.error("Error creating NPC:", err)
      setError(err?.message || "Error al crear el NPC")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    const returnTo = searchParams.get("returnTo")
    const locationId = searchParams.get("locationId")
    const shopId = searchParams.get("shopId")

    if (returnTo === "shop" && locationId && shopId) {
      router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
    } else {
      router.push(`/campaigns/${campaignId}`)
    }
  }

  if (isLoading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <EmptyState title="Acceso Denegado" description="Solo el dueño de la campaña puede crear NPCs" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
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
            {t.marketplace?.addNpc || "Crear NPC"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.npcSubtitle || "Crea un NPC reutilizable que puede ser asignado a tiendas en tu campaña"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NpcForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  )
}

