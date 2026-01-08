"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, MapPin, AlertCircle } from "lucide-react"

interface CharacterJoinCampaignViewProps {
  characterId: string
}

export function CharacterJoinCampaignView({ characterId }: CharacterJoinCampaignViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [inviteCode, setInviteCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user) {
      setError("Debes estar autenticado para unirte a una campaña")
      return
    }
    if (!inviteCode.trim()) {
      setError("El código de invitación es obligatorio")
      return
    }

    setIsJoining(true)
    setError(null)
    try {
      const { campaign } = await services.campaign.joinCampaignByInviteCode(
        inviteCode.trim().toUpperCase(),
        user.id,
        characterId
      )

      // Redirigir a la campaña con el characterId en query para que cargue el personaje correcto
      router.push(`/campaigns/${campaign.id}?characterId=${characterId}`)
    } catch (err: any) {
      console.error("Error joining campaign:", err)
      setError(err?.message || "Error al unirse a la campaña. Verifica que el código sea correcto.")
    } finally {
      setIsJoining(false)
    }
  }

  if (isJoining) {
    return <LoadingState message="Uniéndose a la campaña..." />
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/characters/${characterId}/sheet`)}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Hoja de Personaje
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Unir Personaje a Campaña
          </CardTitle>
          <CardDescription>
            Ingresa el código de invitación que te proporcionó el Game Master para unir este personaje a la campaña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Código de Invitación</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              maxLength={8}
              className="font-mono text-center text-lg tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              El código debe tener 8 caracteres. Pídele al Game Master de la campaña que te lo proporcione.
            </p>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!inviteCode.trim() || inviteCode.length !== 8}>
            Unirse a la Campaña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

