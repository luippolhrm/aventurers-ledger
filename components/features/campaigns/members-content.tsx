"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { AlertCircle, Crown, LogOut } from "lucide-react"
import type { CampaignMemberWithDetails } from "@/lib/infrastructure/repositories"

interface MembersContentProps {
  campaignId: string
}

export function MembersContent({ campaignId }: MembersContentProps) {
  const { user } = useAuth()
  const services = useServices()

  const [members, setMembers] = useState<CampaignMemberWithDetails[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  const loadData = async () => {
    if (!user) return

    try {
      const campaign = await services.campaign.getCampaign(campaignId)
      setIsOwner(campaign.game_master_id === user.id)
      await loadMembers()
    } catch (error: any) {
      console.error("Error loading campaign data:", error)
      setMembersError(error?.message || "Error al cargar datos")
    }
  }

  const loadMembers = async () => {
    setMembersLoading(true)
    setMembersError(null)
    try {
      const data = await services.campaign.getCampaignMembers(campaignId)
      setMembers(data)
    } catch (error: any) {
      console.error("Error loading members:", error)
      setMembersError(error?.message || "Error al cargar miembros")
    } finally {
      setMembersLoading(false)
    }
  }

  const handleRemoveMember = async (member: CampaignMemberWithDetails) => {
    if (!user || !isOwner) {
      alert("Solo el GM puede expulsar miembros")
      return
    }

    if (!confirm(`¿Expulsar a ${member.character_name || member.user_display_name}?`)) {
      return
    }

    try {
      await services.campaign.removeMemberFromCampaign(campaignId, member.user_id, user.id)
      await loadMembers()
    } catch (error: any) {
      console.error("Error removing member:", error)
      alert(error?.message || "Error al expulsar miembro")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Miembros de la Campaña</CardTitle>
          <CardDescription>Gestiona los jugadores que participan en esta campaña</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {membersError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{membersError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Lista de miembros</p>
            <Button variant="outline" size="sm" onClick={loadMembers} disabled={membersLoading}>
              Recargar
            </Button>
          </div>

          {membersLoading ? (
            <LoadingState message="Cargando miembros..." size="sm" />
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay miembros en esta campaña.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const displayText =
                  member.role === "game_master"
                    ? member.user_display_name || member.user_id
                    : member.character_name && member.user_display_name
                      ? `${member.character_name} (${member.user_display_name})`
                      : member.character_name || member.user_display_name || member.user_id

                return (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{displayText}</span>
                      <Badge variant={member.role === "game_master" ? "default" : "secondary"}>
                        {member.role === "game_master" ? (
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" /> GM
                          </span>
                        ) : (
                          <span>Jugador</span>
                        )}
                      </Badge>
                    </div>
                    {isOwner && member.role !== "game_master" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        title="Expulsar"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

