"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Crown, Settings, Trash2, PowerOff, Power } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useServices } from "@/hooks/use-services"
import type { Campaign } from "@/lib/infrastructure/repositories"
import { LoadingState } from "@/components/molecules/loading"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface CampaignsProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function Campaigns({ language }: CampaignsProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()
  const router = useRouter()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadCampaigns()
  }, [user])

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const loadCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")

      // Nueva sección de Campañas: solo campañas creadas por el usuario (GM)
      const gmCampaigns = await services.campaign.getCampaignsAsGM(user.id)
      setCampaigns(gmCampaigns)
    } catch (err: any) {
      console.error("Error loading campaigns:", err)
      setError(err?.message || "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCampaign = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`)
  }

  const handleGoToAdmin = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) return
    if (!confirm((t.campaigns as any)?.confirmDelete || "Are you sure you want to delete this campaign?")) return

    try {
      setError("")
      setSuccess("")

      const realCampaignId = campaignId.includes("_") ? campaignId.split("_")[0] : campaignId
      await services.campaign.deleteCampaign(realCampaignId, user.id)

      setSuccess((t.campaigns as any)?.campaignDeleted || "Campaign deleted successfully")
      loadCampaigns()
    } catch (err: any) {
      console.error("Error deleting campaign:", err)
      setError(err?.message || "Failed to delete campaign")
    }
  }

  const handleArchiveCampaign = async (campaignId: string) => {
    if (!user) return
    if (!confirm("¿Archivar esta campaña? Podrás reactivarla más tarde.")) return

    try {
      setError("")
      setSuccess("")
      await services.campaign.archiveCampaign(campaignId, user.id)
      setSuccess("Campaña archivada")
      loadCampaigns()
    } catch (err: any) {
      console.error("Error archiving campaign:", err)
      setError(err?.message || "No se pudo archivar la campaña")
    }
  }

  const handleUnarchiveCampaign = async (campaignId: string) => {
    if (!user) return
    if (!confirm("¿Reactivar esta campaña?")) return

    try {
      setError("")
      setSuccess("")
      await services.campaign.unarchiveCampaign(campaignId, user.id)
      setSuccess("Campaña reactivada")
      loadCampaigns()
    } catch (err: any) {
      console.error("Error unarchiving campaign:", err)
      setError(err?.message || "No se pudo reactivar la campaña")
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.campaigns as any)?.loading || "Loading campaigns..."} />
      </div>
    )
  }

  const activeCampaigns = campaigns.filter((c) => c.status !== "archived")
  const archivedCampaigns = campaigns.filter((c) => c.status === "archived")

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm md:text-base">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription className="text-sm md:text-base">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold">Mis Campañas</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Gestiona las campañas que has creado como Game Master</p>
          </div>
          <Button onClick={() => router.push("/campaigns/new")} className="text-sm md:text-base w-full sm:w-auto">
            <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Crear Campaña
          </Button>
        </div>

        {activeCampaigns.length === 0 && archivedCampaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">{(t.campaigns as any)?.noGMCampaigns || "Aún no has creado ninguna campaña."}</p>
              <Button onClick={() => router.push("/campaigns/new")}>
                <Crown className="w-4 h-4 mr-2" />
                Crear tu Primera Campaña
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:bg-accent transition-colors border-purple-200 dark:border-purple-800"
                onClick={() => handleOpenCampaign(campaign.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description || "Sin descripción"}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGoToAdmin(campaign.id)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Administrar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveCampaign(campaign.id)
                        }}
                        title="Archivar campaña"
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCampaign(campaign.id)
                        }}
                        title={(t.campaigns as any)?.deleteCampaign || "Eliminar campaña"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {archivedCampaigns.length > 0 && (
              <>
                <div className="border-t border-border my-2 md:my-3" />
                <div className="space-y-3 md:space-y-4">
                  {archivedCampaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-gray-200 dark:border-gray-800 opacity-70"
                      onClick={() => handleOpenCampaign(campaign.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-muted-foreground">{campaign.name}</CardTitle>
                            <CardDescription className="text-muted-foreground">
                              {campaign.description || "Sin descripción"}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnarchiveCampaign(campaign.id)
                              }}
                              title="Reactivar"
                            >
                              <Power className="h-4 w-4 mr-1 md:mr-2" />
                              <span className="hidden sm:inline">Reactivar</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCampaign(campaign.id)
                              }}
                              title={(t.campaigns as any)?.deleteCampaign || "Eliminar campaña"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
