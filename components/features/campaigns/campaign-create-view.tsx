"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Crown } from "lucide-react"

export function CampaignCreateView() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user) {
      setError("Debes estar autenticado para crear campañas")
      return
    }
    if (!name.trim()) {
      setError("El nombre de la campaña es obligatorio")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await services.campaign.createCampaign(
        {
          name: name.trim(),
          description: description.trim() || null,
          game_master_id: user.id,
          status: "active",
        },
        user.id
      )

      router.push("/dashboard?module=campaigns")
    } catch (err: any) {
      console.error("Error creating campaign:", err)
      setError(err?.message || "Error al crear la campaña")
    } finally {
      setIsSaving(false)
    }
  }

  if (isSaving) {
    return <LoadingState message="Creando campaña..." />
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard?module=campaigns")}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Campañas
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Crear Campaña
          </CardTitle>
          <CardDescription>Crea una nueva campaña y comparte el código de invitación con tus jugadores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">{(t.campaigns as any)?.campaignName || "Nombre"}</Label>
            <Input
              id="campaignName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={(t.campaigns as any)?.namePlaceholder || "Ingresa el nombre de la campaña"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignDescription">{(t.campaigns as any)?.description || "Descripción"}</Label>
            <Textarea
              id="campaignDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={(t.campaigns as any)?.descriptionPlaceholder || "Describe tu campaña (opcional)"}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            Crear Campaña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


