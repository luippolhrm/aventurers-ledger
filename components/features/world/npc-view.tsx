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
import { ArrowLeft, Users, Edit, Trash2 } from "lucide-react"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"

interface NpcViewProps {
  campaignId: string
  npcId: string
  isShopNpc?: boolean
  locationId?: string
  shopId?: string
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

export function NpcView({ campaignId, npcId, isShopNpc = false, locationId, shopId }: NpcViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [npc, setNpc] = useState<Npc | ShopNpcRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user && campaignId && npcId) {
      loadData()
    }
  }, [user, campaignId, npcId])

  const loadData = async () => {
    if (!user || !campaignId || !npcId) return

    setIsLoading(true)
    setError(null)
    try {
      const campaign = await services.campaign.getCampaign(campaignId)
      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)

      if (isShopNpc) {
        // Cargar shop_npc
        const { createBrowserClient } = await import("@/lib/supabase/client")
        const supabase = createBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("shop_npcs")
          .select("*")
          .eq("id", npcId)
          .maybeSingle()

        if (fetchError || !data) {
          throw new Error("NPC de tienda no encontrado")
        }
        setNpc(data as ShopNpcRow)
      } else {
        // Cargar NPC standalone
        const npcData = await services.npc.getNpc(npcId)
        setNpc(npcData)
      }
    } catch (err: any) {
      console.error("Error loading NPC:", err)
      setError(err?.message || "Error al cargar el NPC")
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

  const handleSubmit = async (formData: { name: string; title: string; resistances: string; story: string }) => {
    if (!user || !npc) return

    setIsSaving(true)
    setError(null)
    try {
      if (isShopNpc) {
        // Actualizar shop_npc
        const { createBrowserClient } = await import("@/lib/supabase/client")
        const supabase = createBrowserClient()
        const { error: updateError } = await supabase
          .from("shop_npcs")
          .update({
            name: formData.name.trim(),
            title: formData.title || null,
            resistances: formData.resistances || null,
            story: formData.story || null,
          })
          .eq("id", npcId)

        if (updateError) {
          throw new Error(updateError.message)
        }
      } else {
        // Actualizar NPC standalone
        const updated = await services.npc.updateNpc(
          npcId,
          {
            name: formData.name.trim(),
            title: formData.title || null,
            resistances: formData.resistances || null,
            story: formData.story || null,
          },
          user.id
        )
        setNpc(updated)
      }

      setIsEditing(false)
      loadData()
    } catch (err: any) {
      console.error("Error updating NPC:", err)
      setError(err?.message || "Error al actualizar el NPC")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !npc) return

    const confirmMessage = `¿Eliminar "${npc.name}"? Esta acción no se puede deshacer.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    setError(null)
    try {
      if (isShopNpc) {
        // Eliminar shop_npc
        const { createBrowserClient } = await import("@/lib/supabase/client")
        const supabase = createBrowserClient()
        const { error: deleteError } = await supabase.from("shop_npcs").delete().eq("id", npcId)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        if (locationId && shopId) {
          router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
        } else {
          router.push(`/campaigns/${campaignId}`)
        }
      } else {
        // Eliminar NPC standalone
        await services.npc.deleteNpc(npcId, user.id)
        router.push(`/campaigns/${campaignId}`)
      }
    } catch (err: any) {
      console.error("Error deleting NPC:", err)
      setError(err?.message || "Error al eliminar el NPC")
      setIsDeleting(false)
    }
  }

  const handleBack = () => {
    if (isShopNpc && locationId && shopId) {
      router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shopId}`)
    } else {
      router.push(`/campaigns/${campaignId}`)
    }
  }

  if (isLoading) {
    return <LoadingState message="Cargando NPC..." />
  }

  if (!npc) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleBack} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <EmptyState title="NPC no encontrado" description="El NPC solicitado no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleBack} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
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
              <Users className="w-5 h-5" />
              Editar NPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NpcForm initialData={npc} onSubmit={handleSubmit} onCancel={handleCancelEdit} isLoading={isSaving} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="w-6 h-6" />
                  {npc.name}
                </CardTitle>
                {npc.title && (
                  <CardDescription className="mt-2">{npc.title}</CardDescription>
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
          <CardContent className="space-y-4">
            {npc.resistances && (
              <div>
                <h3 className="font-semibold mb-2">{t.marketplace?.npcResistances || "Resistencias"}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{npc.resistances}</p>
              </div>
            )}
            {npc.story && (
              <div>
                <h3 className="font-semibold mb-2">{t.marketplace?.npcStory || "Historia"}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{npc.story}</p>
              </div>
            )}
            {!npc.resistances && !npc.story && (
              <p className="text-sm text-muted-foreground">Sin información adicional</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

